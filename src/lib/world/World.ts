import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Work } from '$lib/works';
import { createScenery, HONEY_COLOR, HONEY_GLOW_COLOR, SCENERY_PALETTES } from './Scenery';
import { honeyArc } from './terrain';
import {
	NEAR_DISTANCE,
	START_POSITION,
	clampToGround,
	moveHeading,
	sparkleOffsets,
	spotPosition
} from './layout';

const WALK_SPEED = 5.5;
const CAMERA_DISTANCE = 7.5;
const CAMERA_HEIGHT = 3.4;
const PALETTES = {
	light: { hemiSky: 0xfff6e0, hemiGround: 0x7f9f5c, hemi: 1.9, sun: 0xffe7b8, sunIntensity: 2.6 },
	dark: { hemiSky: 0xa9b8e0, hemiGround: 0x2c3d28, hemi: 1.15, sun: 0xc8d6ff, sunIntensity: 1.1 }
} as const;

export type WorldTheme = keyof typeof PALETTES;

const BEE_SCALE = 0.16;
const HOVER_HEIGHT = 0.9;

const FLOWER_SCALE = 0.8;
const FLOWER_BOTTOM = -1.09;
const LABEL_HEIGHT = 3.6;
/** カメラからこの距離 (m) より近い札は薄くし、near で消える */
const LABEL_FADE = { near: 2.5, far: 5 };
const PETAL_MATERIAL = 'mat21';

const IDLE_GLOW = 0.06;
const NEAR_GLOW = 0.55;

const SPARKLE_SIZE = 0.34;
const SPARKLE_SPIN = 0.3;
const SPARKLE_TWINKLE = 3.2;

export type MoveInput = { x: number; y: number };

/** 蜜集め: すでに訪れた作品と、新しく訪れたときの知らせ先 */
export type Foraging = {
	visited: Iterable<string>;
	onVisit: (id: string) => void;
};

/** 花の近くにこの時間 (秒) 留まると蜜を集めたことにする */
const DWELL = 1;
/** 蜜が花から巣へ飛ぶ時間 (秒) */
const HONEY_FLIGHT = 2.4;
/** 蜜が飛び立つ高さ (花の頭のあたり) */
const HONEY_START_HEIGHT = 2.2;
/** 道の奥で見上げる量。z が from から to へ進むにつれて、注視点を height (m) まで上げる */
const LOOK_UP = { from: 18, to: 40, height: 3 };
/** 蜜の通り道の弧の高さ (m) */
const HONEY_RISE = 3;
/** 蜜の粒が残す光の尾の長さ (点の数) */
const TRAIL_LENGTH = 24;

export type World = {
	setMove: (input: MoveInput) => void;
	setTheme: (theme: WorldTheme) => void;
	dispose: () => void;
};

type Exhibit = {
	work: Work;
	position: THREE.Vector3;
	glow: THREE.MeshStandardMaterial;
	label: THREE.Sprite;
	sparkles?: Sparkles;
	meshes: THREE.Object3D[];
};

export async function createWorld(
	canvas: HTMLCanvasElement,
	works: Work[],
	onNear: (work: Work | null) => void,
	foraging: Foraging
): Promise<World> {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	// 指で操作する端末 (多くはスマホ) は描く画素と草花を減らす
	const lite = matchMedia('(pointer: coarse)').matches;
	renderer.setPixelRatio(Math.min(devicePixelRatio, lite ? 1.5 : 2));
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	const scene = new THREE.Scene();
	// 霧は空の地平線と同じ色にして、遠くの丘を空へ溶かす
	const fog = new THREE.Fog(0xffffff, 28, 120);
	scene.fog = fog;

	const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);

	const hemi = new THREE.HemisphereLight();
	scene.add(hemi);
	const sun = new THREE.DirectionalLight();
	sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	sun.shadow.camera.left = -22;
	sun.shadow.camera.right = 22;
	sun.shadow.camera.top = 22;
	sun.shadow.camera.bottom = -22;
	scene.add(sun, sun.target);

	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const scenery = createScenery(
		works.flatMap((w) => (w.spot ? [w.spot] : [])),
		{ still, lite }
	);
	scene.add(...scenery.objects);

	const setTheme = (theme: WorldTheme) => {
		const palette = PALETTES[theme];
		fog.color.copy(scenery.setPalette(SCENERY_PALETTES[theme]));
		hemi.color.set(palette.hemiSky);
		hemi.groundColor.set(palette.hemiGround);
		hemi.intensity = palette.hemi;
		sun.color.set(palette.sun);
		sun.intensity = palette.sunIntensity;
	};
	setTheme('light');

	const [character, flower] = await Promise.all([
		createCharacter(),
		loadFlower(),
		// 札は canvas に描くので、書体が届いてから描く。届かなくても既定の書体で続ける
		document.fonts.load(`700 30px ${LABEL_FONT}`).catch(() => [])
	]);

	const exhibits = works.filter((w) => w.spot).map((work) => createExhibit(work, flower));
	for (const exhibit of exhibits) scene.add(...exhibit.meshes);

	// トップで訪れた作品の部屋は、最初から蜜で満たしておく
	const visited = new Set(foraging.visited);
	for (const exhibit of exhibits) {
		if (visited.has(exhibit.work.id)) scenery.hive.fill(exhibit.work.spot!.index, true);
	}
	let dwell = 0;
	const honeyGeometry = new THREE.IcosahedronGeometry(0.32, 1);
	const honeyMaterial = new THREE.MeshStandardMaterial({
		color: HONEY_COLOR,
		emissive: HONEY_GLOW_COLOR,
		emissiveIntensity: 1.2,
		roughness: 0.2
	});
	type Drop = {
		mesh: THREE.Mesh;
		trail: THREE.Points;
		from: THREE.Vector3;
		to: THREE.Vector3;
		slot: number;
		t: number;
	};
	const drops: Drop[] = [];

	const collect = (exhibit: Exhibit) => {
		const id = exhibit.work.id;
		const slot = exhibit.work.spot!.index;
		visited.add(id);
		foraging.onVisit(id);
		if (still) {
			scenery.hive.fill(slot, true);
			return;
		}
		const mesh = new THREE.Mesh(honeyGeometry, honeyMaterial);
		const from = exhibit.position.clone().setY(HONEY_START_HEIGHT);
		mesh.position.copy(from);
		const trail = createTrail(from);
		scene.add(mesh, trail);
		drops.push({ mesh, trail, from, to: scenery.hive.cellPosition(slot), slot, t: 0 });
	};

	character.group.position.set(START_POSITION.x, HOVER_HEIGHT, START_POSITION.z);
	scene.add(character.group);

	const move: MoveInput = { x: 0, y: 0 };
	const keys = new Set<string>();
	let yaw = 0;
	let dragging = false;
	let lastPointerX = 0;
	let nearId: string | null = null;

	const onKey = (event: KeyboardEvent, down: boolean) => {
		const key = event.key.toLowerCase();
		if (!MOVE_KEYS.has(key)) return;
		event.preventDefault();
		if (down) keys.add(key);
		else keys.delete(key);
	};
	const keyDown = (e: KeyboardEvent) => onKey(e, true);
	const keyUp = (e: KeyboardEvent) => onKey(e, false);
	const blur = () => keys.clear();

	const pointerDown = (e: PointerEvent) => {
		dragging = true;
		lastPointerX = e.clientX;
		canvas.setPointerCapture(e.pointerId);
	};
	const pointerMove = (e: PointerEvent) => {
		if (!dragging) return;
		yaw -= (e.clientX - lastPointerX) * 0.006;
		lastPointerX = e.clientX;
	};
	const pointerUp = () => {
		dragging = false;
	};

	addEventListener('keydown', keyDown);
	addEventListener('keyup', keyUp);
	addEventListener('blur', blur);
	canvas.addEventListener('pointerdown', pointerDown);
	canvas.addEventListener('pointermove', pointerMove);
	canvas.addEventListener('pointerup', pointerUp);
	canvas.addEventListener('pointercancel', pointerUp);

	const resize = () => {
		const { clientWidth, clientHeight } = canvas;
		if (!clientWidth || !clientHeight) return;
		renderer.setSize(clientWidth, clientHeight, false);
		camera.aspect = clientWidth / clientHeight;
		camera.updateProjectionMatrix();
	};
	const observer = new ResizeObserver(resize);
	observer.observe(canvas);
	resize();

	const timer = new THREE.Timer();
	timer.connect(document);
	let frame = 0;

	const tick = () => {
		frame = requestAnimationFrame(tick);
		timer.update();
		const delta = Math.min(timer.getDelta(), 0.1);
		const elapsed = timer.getElapsed();

		const input = readInput(keys, move);
		const moving = input.lengthSq() > 0;
		if (moving) {
			const heading = moveHeading(input, yaw);
			character.group.position.x += Math.sin(heading) * WALK_SPEED * delta;
			character.group.position.z += Math.cos(heading) * WALK_SPEED * delta;
			character.group.rotation.y = heading;
			const inside = clampToGround(character.group.position.x, character.group.position.z);
			character.group.position.x = inside.x;
			character.group.position.z = inside.z;
		}
		character.animate(elapsed, moving);
		scenery.animate(elapsed, delta);

		const target = character.group.position;
		sun.position.set(target.x + 12, 20, target.z + 8);
		sun.target.position.copy(target);
		camera.position.set(
			target.x - Math.sin(yaw) * CAMERA_DISTANCE,
			CAMERA_HEIGHT,
			target.z - Math.cos(yaw) * CAMERA_DISTANCE
		);
		// 道の奥 (蜂の巣の手前) に近づくほど見上げて、丘の上の巣を画面に入れる
		const lookUp = THREE.MathUtils.smoothstep(target.z, LOOK_UP.from, LOOK_UP.to) * LOOK_UP.height;
		camera.lookAt(target.x, 1.2 + lookUp, target.z);

		const near = findNearest(exhibits, target);
		if ((near?.work.id ?? null) !== nearId) {
			nearId = near?.work.id ?? null;
			dwell = 0;
			onNear(near?.work ?? null);
		}
		// まだ訪れていない花の近くに留まると、蜜を集めて巣へ送る
		if (near && !visited.has(near.work.id)) {
			dwell += delta;
			if (dwell >= DWELL) collect(near);
		}
		for (let i = drops.length - 1; i >= 0; i--) {
			const drop = drops[i];
			drop.t = Math.min(1, drop.t + delta / HONEY_FLIGHT);
			// 飛び立ちはゆっくり、巣に近づくと速く
			const eased = drop.t * drop.t * (3 - 2 * drop.t);
			// 低い弧で飛ばし、前を向いた画面の中を巣へ向かう様子が見えるようにする
			const p = honeyArc(drop.from, drop.to, eased, HONEY_RISE);
			drop.mesh.position.set(p.x, p.y, p.z);
			pushTrail(drop.trail, drop.mesh.position);
			if (drop.t < 1) continue;
			scene.remove(drop.mesh, drop.trail);
			drop.trail.geometry.dispose();
			scenery.hive.fill(drop.slot);
			drops.splice(i, 1);
		}
		for (const exhibit of exhibits) {
			const lit = exhibit.work.id === nearId ? NEAR_GLOW : IDLE_GLOW;
			exhibit.glow.emissiveIntensity += (lit - exhibit.glow.emissiveIntensity) * 0.15;
			exhibit.sparkles?.twinkle(elapsed);
			// カメラが札のすぐ横を通るときは薄くして、画面を札で覆わない
			const distance = camera.position.distanceTo(exhibit.label.position);
			exhibit.label.material.opacity = THREE.MathUtils.smoothstep(distance, LABEL_FADE.near, LABEL_FADE.far);
		}

		renderer.render(scene, camera);
	};
	tick();

	return {
		setTheme,
		setMove(next) {
			move.x = next.x;
			move.y = next.y;
		},
		dispose() {
			cancelAnimationFrame(frame);
			timer.dispose();
			observer.disconnect();
			removeEventListener('keydown', keyDown);
			removeEventListener('keyup', keyUp);
			removeEventListener('blur', blur);
			canvas.removeEventListener('pointerdown', pointerDown);
			canvas.removeEventListener('pointermove', pointerMove);
			canvas.removeEventListener('pointerup', pointerUp);
			canvas.removeEventListener('pointercancel', pointerUp);
			scene.traverse((object) => {
				if (
				!(
					object instanceof THREE.Mesh ||
					object instanceof THREE.Sprite ||
					object instanceof THREE.Points
				)
			)
				return;
				object.geometry?.dispose();
				const material = object.material as THREE.Material & { map?: THREE.Texture | null };
				material.map?.dispose();
				material.dispose();
			});
			renderer.forceContextLoss();
			renderer.dispose();
		}
	};
}

const MOVE_KEYS = new Set([
	'w',
	'a',
	's',
	'd',
	'arrowup',
	'arrowdown',
	'arrowleft',
	'arrowright'
]);

function readInput(keys: Set<string>, joystick: MoveInput) {
	const vector = new THREE.Vector2(joystick.x, joystick.y);
	if (keys.has('w') || keys.has('arrowup')) vector.y += 1;
	if (keys.has('s') || keys.has('arrowdown')) vector.y -= 1;
	if (keys.has('a') || keys.has('arrowleft')) vector.x -= 1;
	if (keys.has('d') || keys.has('arrowright')) vector.x += 1;
	return vector.lengthSq() > 1 ? vector.normalize() : vector;
}

function findNearest(exhibits: Exhibit[], position: THREE.Vector3) {
	let best: Exhibit | null = null;
	let bestDistance = NEAR_DISTANCE * NEAR_DISTANCE;
	for (const exhibit of exhibits) {
		const distance = exhibit.position.distanceToSquared(position);
		if (distance >= bestDistance) continue;
		best = exhibit;
		bestDistance = distance;
	}
	return best;
}

async function loadFlower() {
	const gltf = await new GLTFLoader().loadAsync('/flower.glb');
	gltf.scene.scale.setScalar(FLOWER_SCALE);
	return gltf.scene;
}

function createExhibit(work: Work, flower: THREE.Object3D): Exhibit {
	const { index, color } = work.spot!;
	const { x, z } = spotPosition(work.spot!);

	const model = flower.clone();
	let glow: THREE.MeshStandardMaterial | undefined;
	model.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		object.castShadow = true;
		if (object.material.name !== PETAL_MATERIAL) return;
		const petal = object.material.clone() as THREE.MeshStandardMaterial;
		petal.color.set(color);
		petal.emissive.set(color);
		petal.emissiveIntensity = IDLE_GLOW;
		object.material = petal;
		glow = petal;
	});
	if (!glow) throw new Error(`花びらのマテリアル ${PETAL_MATERIAL} が見つからない`);

	model.position.set(x, -FLOWER_BOTTOM * FLOWER_SCALE, z);
	model.rotation.y = index * 1.1;

	const label = createLabel(work.title, color);
	label.position.set(x, LABEL_HEIGHT, z);

	const sparkles = work.liveUrl ? createSparkles(x, z, color) : undefined;

	return {
		work,
		position: new THREE.Vector3(x, 0, z),
		glow,
		label,
		sparkles,
		meshes: sparkles ? [model, label, sparkles.points] : [model, label]
	};
}

type Sparkles = ReturnType<typeof createSparkles>;

function createSparkles(x: number, z: number, color: string) {
	const offsets = sparkleOffsets();
	const positions = new Float32Array(offsets.length * 3);
	offsets.forEach((offset, i) => positions.set([offset.x, offset.y, offset.z], i * 3));

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(offsets.length * 3), 3));

	const points = new THREE.Points(
		geometry,
		new THREE.PointsMaterial({
			size: SPARKLE_SIZE,
			map: sparkleTexture(),
			vertexColors: true,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending
		})
	);
	points.position.set(x, 0, z);

	const tint = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.65);
	const colors = geometry.attributes.color as THREE.BufferAttribute;

	return {
		points,
		twinkle(time: number) {
			points.rotation.y = time * SPARKLE_SPIN;
			offsets.forEach((offset, i) => {
				const brightness = 0.65 + 0.35 * Math.sin(time * SPARKLE_TWINKLE + offset.phase);
				colors.setXYZ(i, tint.r * brightness, tint.g * brightness, tint.b * brightness);
			});
			colors.needsUpdate = true;
		}
	};
}

/** 蜜の粒の尾。直近の位置を点で並べ、古いほど薄くする。明るい空でも見えるよう加算ではなく透明度で薄める */
function createTrail(start: THREE.Vector3) {
	const positions = new Float32Array(TRAIL_LENGTH * 3);
	const colors = new Float32Array(TRAIL_LENGTH * 4);
	const honey = new THREE.Color(HONEY_COLOR);
	for (let i = 0; i < TRAIL_LENGTH; i++) {
		positions.set([start.x, start.y, start.z], i * 3);
		colors.set([honey.r, honey.g, honey.b, 0.9 * (1 - i / TRAIL_LENGTH)], i * 4);
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
	return new THREE.Points(geometry, trailMaterial());
}

let sharedTrailMaterial: THREE.PointsMaterial | undefined;
function trailMaterial() {
	sharedTrailMaterial ??= new THREE.PointsMaterial({
		size: 0.5,
		map: sparkleTexture(),
		vertexColors: true,
		transparent: true,
		depthWrite: false
	});
	return sharedTrailMaterial;
}

function pushTrail(trail: THREE.Points, head: THREE.Vector3) {
	const position = trail.geometry.attributes.position as THREE.BufferAttribute;
	const array = position.array as Float32Array;
	array.copyWithin(3, 0, (TRAIL_LENGTH - 1) * 3);
	array.set([head.x, head.y, head.z], 0);
	position.needsUpdate = true;
	trail.geometry.computeBoundingSphere();
}

function sparkleTexture() {
	const size = 64;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d')!;
	const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255,255,255,1)');
	gradient.addColorStop(0.35, 'rgba(255,255,255,0.5)');
	gradient.addColorStop(1, 'rgba(255,255,255,0)');
	context.fillStyle = gradient;
	context.fillRect(0, 0, size, size);
	return new THREE.CanvasTexture(canvas);
}

// 作品名の札。トップと同じく、紙色の地に墨の枠と文字、作品の色の帯を付ける
const LABEL_INK = '#1f1a14';
const LABEL_PAPER = '#fbf6e9';
const LABEL_FONT = '"Jost", "Noto Sans JP", sans-serif';

function createLabel(text: string, color: string) {
	const scale = 3;
	const font = `700 ${30 * scale}px ${LABEL_FONT}`;
	const measure = document.createElement('canvas').getContext('2d')!;
	measure.font = font;
	const border = 3 * scale;
	const shadow = 5 * scale;
	const band = 8 * scale;
	const boxWidth = Math.ceil(measure.measureText(text).width) + 40 * scale;
	const boxHeight = 52 * scale;
	const width = boxWidth + shadow;
	const height = boxHeight + shadow;

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d')!;
	const box = (x: number, y: number) => {
		context.beginPath();
		context.roundRect(x + border / 2, y + border / 2, boxWidth - border, boxHeight - border, 10 * scale);
	};
	// ずらした影
	context.fillStyle = LABEL_INK;
	box(shadow, shadow);
	context.fill();
	// 地と左の色帯
	context.fillStyle = LABEL_PAPER;
	box(0, 0);
	context.fill();
	context.save();
	context.clip();
	context.fillStyle = color;
	context.fillRect(0, 0, band + border, boxHeight);
	context.restore();
	context.lineWidth = border;
	context.strokeStyle = LABEL_INK;
	box(0, 0);
	context.stroke();
	context.font = font;
	context.fillStyle = LABEL_INK;
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillText(text, (boxWidth + band) / 2, boxHeight / 2 + scale);

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;
	const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
	// 近づいても蜂を隠さない大きさ。遠くの札は霧に溶けないよう fog を切る
	sprite.material.fog = false;
	sprite.scale.set((width / height) * 0.72, 0.72, 1);
	return sprite;
}

async function createCharacter() {
	const model = await new GLTFLoader().loadAsync('/bee.glb');
	model.scene.scale.setScalar(BEE_SCALE);
	model.scene.rotation.y = Math.PI;
	model.scene.traverse((object) => {
		if (object instanceof THREE.Mesh) object.castShadow = true;
	});

	const group = new THREE.Group();
	group.add(model.scene);

	return {
		group,
		animate(time: number, moving: boolean) {
			const beat = moving ? 14 : 6;
			const amplitude = moving ? 0.14 : 0.07;
			group.position.y = HOVER_HEIGHT + Math.sin(time * beat) * amplitude;
		}
	};
}

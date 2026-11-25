import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createBeeModel, type WingMode } from './BeeModel';
import { createFlight3, FLIGHT3, hasArrived, speedOf, step3, type Control } from './flight';
import type { Work } from '$lib/works';
import { createScenery, SCENERY_PALETTES } from './Scenery';
import {
	NEAR_DISTANCE,
	START_POSITION,
	clampToGround,
	moveHeading,
	sparkleOffsets,
	spotPosition
} from './layout';

const CAMERA_DISTANCE = 7.5;
const CAMERA_HEIGHT = 3.4;
const PALETTES = {
	light: { hemiSky: 0xfff6e0, hemiGround: 0x7f9f5c, hemi: 1.9, sun: 0xffe7b8, sunIntensity: 2.6 },
	dark: { hemiSky: 0xa9b8e0, hemiGround: 0x2c3d28, hemi: 1.15, sun: 0xc8d6ff, sunIntensity: 1.1 }
} as const;

export type WorldTheme = keyof typeof PALETTES;

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

/**
 * 蜜集め
 *   visited   蜜が巣に届いている作品 (トップで訪れたものを含む)
 *   onCarry   花粉を運んでいる作品が変わったとき
 *   onVisit   花粉を巣に降ろして、その作品の部屋が満ちたとき
 */
export type Foraging = {
	visited: Iterable<string>;
	onCarry: (ids: string[]) => void;
	onVisit: (id: string) => void;
};

/** 花の上に止まってから花粉が付くまでの時間 (秒) */
const REST = 0.9;
/** 巣の前で花粉を 1 つ降ろす間隔 (秒) */
const DROP_INTERVAL = 0.4;
/** 花粉を運んでいるとき、巣の入口からこの距離 (m) で止まると自分で巣へ寄る。道の突き当たりのどこからでも届く広さ */
const HIVE_REACH = 8;
/** カメラが蜂に追いつく速さ。大きいほど遅れが小さい */
const CAMERA_FOLLOW = 4;
/** 花へ自分で寄り始める速さの上限 (m/秒)。これより速く飛んでいるときは素通りする */
const SETTLE_SPEED = 2.5;

export type World = {
	setMove: (input: MoveInput) => void;
	setTheme: (theme: WorldTheme) => void;
	dispose: () => void;
};

type Exhibit = {
	work: Work;
	position: THREE.Vector3;
	glow: THREE.MeshStandardMaterial;
	/** 蜂が降りる位置 (花の頭の上) */
	head: THREE.Vector3;
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

	const [bee, flower] = await Promise.all([
		createBeeModel({ still }),
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

	/**
	 * 蜂のしていること
	 *   free       操作どおりに飛ぶ
	 *   toFlower   止まった近くの花へ自分で寄る
	 *   resting    花の上に止まって花粉を集める
	 *   toHive     花粉を運んで巣の前で止まったので、入口へ寄る
	 *   unloading  入口で花粉を 1 つずつ降ろす
	 */
	type Mode = 'free' | 'toFlower' | 'resting' | 'toHive' | 'unloading';
	let mode: Mode = 'free';
	let landing: Exhibit | null = null;
	let clock = 0;
	const carried: string[] = [];
	let flight = createFlight3({ x: START_POSITION.x, y: FLIGHT3.idle, z: START_POSITION.z });
	scene.add(bee.group);

	const carry = (id: string) => {
		carried.push(id);
		bee.setPollen(carried.length);
		foraging.onCarry([...carried]);
	};
	const unload = () => {
		const id = carried.shift();
		if (!id) return;
		const exhibit = exhibits.find((e) => e.work.id === id)!;
		scenery.hive.fill(exhibit.work.spot!.index, still);
		visited.add(id);
		bee.setPollen(carried.length);
		foraging.onCarry([...carried]);
		foraging.onVisit(id);
	};

	const cameraPosition = new THREE.Vector3();
	const cameraLook = new THREE.Vector3();
	let cameraReady = false;

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
		const steering = input.lengthSq() > 0;
		if (steering) {
			mode = 'free';
			landing = null;
		}

		// 操作をやめて遅くなったら、近くの花か巣へ自分で寄る
		const near = findNearest(exhibits, flight);
		if (mode === 'free' && !steering && speedOf(flight) < SETTLE_SPEED) {
			if (near && !visited.has(near.work.id) && !carried.includes(near.work.id)) {
				mode = 'toFlower';
				landing = near;
			} else if (carried.length > 0 && Math.hypot(flight.x - scenery.hive.entrance.x, flight.z - scenery.hive.entrance.z) < HIVE_REACH) {
				mode = 'toHive';
			}
		}

		let control: Control;
		if (mode === 'free') {
			const heading = moveHeading(input, yaw);
			const amount = Math.min(1, input.length());
			control = { kind: 'steer', dir: { x: Math.sin(heading) * amount, z: Math.cos(heading) * amount } };
		} else if (mode === 'toFlower' || mode === 'resting') {
			control = { kind: 'arrive', target: landing!.head };
		} else {
			control = { kind: 'arrive', target: scenery.hive.entrance };
		}
		// 1 回の計算で進める時間には上限があるので、画面の更新が遅い端末でも同じ速さで飛ぶよう分けて進める
		for (let left = delta; left > 1e-6; left -= FLIGHT3.maxStep) {
			flight = step3(flight, control, Math.min(left, FLIGHT3.maxStep));
		}
		if (mode === 'free') {
			const inside = clampToGround(flight.x, flight.z);
			flight.x = inside.x;
			flight.z = inside.z;
		}

		if (mode === 'toFlower' && hasArrived(flight, landing!.head)) {
			mode = 'resting';
			clock = 0;
		} else if (mode === 'resting') {
			clock += delta;
			if (clock >= REST && !carried.includes(landing!.work.id)) carry(landing!.work.id);
		} else if (mode === 'toHive' && hasArrived(flight, scenery.hive.entrance)) {
			mode = 'unloading';
			clock = 0;
		} else if (mode === 'unloading' && carried.length > 0) {
			clock += delta;
			if (still) while (carried.length > 0) unload();
			else if (clock >= DROP_INTERVAL) {
				clock = 0;
				unload();
			}
		}

		const wings: WingMode =
			mode === 'resting' ? 'resting' : speedOf(flight) > 1 ? 'flying' : 'hovering';
		bee.update(flight, wings, delta);
		scenery.animate(elapsed, delta);

		const target = bee.group.position;
		sun.position.set(target.x + 12, 20, target.z + 8);
		sun.target.position.copy(target);
		// カメラはばねのように少し遅れて付いてくる
		const wantPosition = new THREE.Vector3(
			target.x - Math.sin(yaw) * CAMERA_DISTANCE,
			CAMERA_HEIGHT + (target.y - FLIGHT3.idle),
			target.z - Math.cos(yaw) * CAMERA_DISTANCE
		);
		const wantLook = new THREE.Vector3(target.x, target.y + 0.3, target.z);
		const follow = cameraReady ? 1 - Math.exp(-delta * CAMERA_FOLLOW) : 1;
		cameraPosition.lerp(wantPosition, follow);
		cameraLook.lerp(wantLook, cameraReady ? 1 - Math.exp(-delta * CAMERA_FOLLOW * 2) : 1);
		cameraReady = true;
		camera.position.copy(cameraPosition);
		camera.lookAt(cameraLook);

		if ((near?.work.id ?? null) !== nearId) {
			nearId = near?.work.id ?? null;
			onNear(near?.work ?? null);
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

/** 水平の距離で、いちばん近い展示を探す (蜂の高さは問わない) */
function findNearest(exhibits: Exhibit[], position: { x: number; z: number }) {
	let best: Exhibit | null = null;
	let bestDistance = NEAR_DISTANCE * NEAR_DISTANCE;
	for (const exhibit of exhibits) {
		const distance = (exhibit.position.x - position.x) ** 2 + (exhibit.position.z - position.z) ** 2;
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
	let petals: THREE.Mesh | undefined;
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
		petals = object;
	});
	if (!glow) throw new Error(`花びらのマテリアル ${PETAL_MATERIAL} が見つからない`);

	model.position.set(x, -FLOWER_BOTTOM * FLOWER_SCALE, z);
	model.rotation.y = index * 1.1;
	// 蜂は花びらの真ん中に降りる。蜂のモデルの原点は体の下端なので、花びらの高さをそのまま使う
	model.updateMatrixWorld(true);
	const head = new THREE.Box3().setFromObject(petals!).getCenter(new THREE.Vector3());
	head.y += 0.02;

	const label = createLabel(work.title, color);
	label.position.set(x, LABEL_HEIGHT, z);

	const sparkles = work.liveUrl ? createSparkles(x, z, color) : undefined;

	return {
		work,
		position: new THREE.Vector3(x, 0, z),
		glow,
		head,
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

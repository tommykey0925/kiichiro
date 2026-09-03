import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Work } from '$lib/works';
import {
	NEAR_DISTANCE,
	ROAD_HALF_LENGTH,
	ROAD_HALF_WIDTH,
	START_POSITION,
	clampToGround,
	moveHeading,
	sparkleOffsets,
	spotPosition
} from './layout';

const WALK_SPEED = 5.5;
const CAMERA_DISTANCE = 7.5;
const CAMERA_HEIGHT = 3.4;
const SKY = 0xdfe9f2;

// モデルの単位が実寸と揃っていないので、見た目で合わせるための調整値。
// 元は全長 11.2 / 高さ 6.3。0.16 倍で全長 1.8 ほどになる。
const BEE_SCALE = 0.16;
const HOVER_HEIGHT = 0.9;

// 花は高さ 3.6、原点は茎の途中 (下端 y=-1.09)。地面に生やすので下端を y=0 に合わせる。
const FLOWER_SCALE = 0.5;
const FLOWER_BOTTOM = -1.09;
const LABEL_HEIGHT = 2.6;
/** 花びらのマテリアル名。ここだけ複製して作品ごとの色にする。 */
const PETAL_MATERIAL = 'mat21';

const IDLE_GLOW = 0.06;
const NEAR_GLOW = 0.55;

const SPARKLE_SIZE = 0.34;
const SPARKLE_SPIN = 0.3;
const SPARKLE_TWINKLE = 3.2;

export type MoveInput = { x: number; y: number };

export type World = {
	setMove: (input: MoveInput) => void;
	dispose: () => void;
};

type Exhibit = {
	work: Work;
	position: THREE.Vector3;
	glow: THREE.MeshStandardMaterial;
	sparkles?: Sparkles;
	meshes: THREE.Object3D[];
};

export async function createWorld(
	canvas: HTMLCanvasElement,
	works: Work[],
	onNear: (work: Work | null) => void
): Promise<World> {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(SKY);
	// 道の先と地面の端を霧に溶かす。終端の地形を作らずに済ませるため。
	scene.fog = new THREE.Fog(SKY, 24, 62);

	const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

	scene.add(new THREE.HemisphereLight(0xffffff, 0x8fa88c, 2.1));
	const sun = new THREE.DirectionalLight(0xfff4e2, 2.4);
	sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	// 影の範囲は道全体ではなくキャラの周りだけ。道は 84 あるので、
	// 全体を 1 枚の shadow map で覆うと影が潰れる。
	sun.shadow.camera.left = -22;
	sun.shadow.camera.right = 22;
	sun.shadow.camera.top = 22;
	sun.shadow.camera.bottom = -22;
	scene.add(sun, sun.target);

	const ground = new THREE.Mesh(
		new THREE.PlaneGeometry(ROAD_HALF_WIDTH * 2, ROAD_HALF_LENGTH * 2).rotateX(-Math.PI / 2),
		new THREE.MeshStandardMaterial({ color: 0x9dbf8e, roughness: 1 })
	);
	ground.receiveShadow = true;
	scene.add(ground);

	const [character, flower] = await Promise.all([createCharacter(), loadFlower()]);

	const exhibits = works.filter((w) => w.spot).map((work) => createExhibit(work, flower));
	for (const exhibit of exhibits) scene.add(...exhibit.meshes);

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

	const clock = new THREE.Clock();
	let frame = 0;

	const tick = () => {
		frame = requestAnimationFrame(tick);
		const delta = Math.min(clock.getDelta(), 0.1);

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
		character.animate(clock.elapsedTime, moving);

		const target = character.group.position;
		sun.position.set(target.x + 12, 20, target.z + 8);
		sun.target.position.copy(target);
		camera.position.set(
			target.x - Math.sin(yaw) * CAMERA_DISTANCE,
			CAMERA_HEIGHT,
			target.z - Math.cos(yaw) * CAMERA_DISTANCE
		);
		camera.lookAt(target.x, 1.2, target.z);

		const near = findNearest(exhibits, target);
		if ((near?.work.id ?? null) !== nearId) {
			nearId = near?.work.id ?? null;
			onNear(near?.work ?? null);
		}
		for (const exhibit of exhibits) {
			const lit = exhibit.work.id === nearId ? NEAR_GLOW : IDLE_GLOW;
			exhibit.glow.emissiveIntensity += (lit - exhibit.glow.emissiveIntensity) * 0.15;
			exhibit.sparkles?.twinkle(clock.elapsedTime);
		}

		renderer.render(scene, camera);
	};
	tick();

	return {
		setMove(next) {
			move.x = next.x;
			move.y = next.y;
		},
		dispose() {
			cancelAnimationFrame(frame);
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

	// clone はマテリアルを共有するので、色を変える花びらだけ複製する。
	// 茎と中心は共有のままにして、描画時の状態変更を減らす。
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
	// 全部同じ向きだと並びが機械的に見えるので、少しずつ回す。
	model.rotation.y = index * 1.1;

	const label = createLabel(work.title.ja);
	label.position.set(x, LABEL_HEIGHT, z);

	const sparkles = work.liveUrl ? createSparkles(x, z, color) : undefined;

	return {
		work,
		position: new THREE.Vector3(x, 0, z),
		glow,
		sparkles,
		meshes: sparkles ? [model, label, sparkles.points] : [model, label]
	};
}

type Sparkles = ReturnType<typeof createSparkles>;

/**
 * 公開中の作品の目印。emissive を上げても昼のシーンでは花びらが白飛びしていて
 * 差が出ないので、輝度ではなく粒の動きで示す。
 */
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

	// 加算合成は暗い色を足しても何も起きないので、作品の色を白に寄せて明るい側に振る。
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

function createLabel(text: string) {
	const scale = 3;
	const font = `${28 * scale}px system-ui, "Hiragino Kaku Gothic ProN", sans-serif`;
	const measure = document.createElement('canvas').getContext('2d')!;
	measure.font = font;
	const width = Math.ceil(measure.measureText(text).width) + 40 * scale;
	const height = 48 * scale;

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d')!;
	context.font = font;
	context.fillStyle = '#ffffff';
	context.strokeStyle = 'rgba(35,32,28,0.14)';
	context.beginPath();
	context.roundRect(0, 0, width, height, 16 * scale);
	context.fill();
	context.stroke();
	context.fillStyle = '#23201c';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillText(text, width / 2, height / 2);

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
	sprite.scale.set((width / height) * 0.9, 0.9, 1);
	return sprite;
}

/**
 * 蜂はアニメーションを持たないので、上下の揺れで羽ばたきを代用する。
 * 止まっていても浮いていないと落ちて見えるため、揺れは常時かける。
 */
async function createCharacter() {
	const model = await new GLTFLoader().loadAsync('/bee.glb');
	model.scene.scale.setScalar(BEE_SCALE);
	// モデルは -Z を向いている。進行方向は毎フレーム group に入るので、
	// モデル自身の向き直しは内側の 1 枚に持たせて上書きされないようにする。
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

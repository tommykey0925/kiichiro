import * as THREE from 'three';
import type { Work } from '$lib/works';
import { GROUND_RADIUS, clampToGround, moveHeading, spotPosition } from './layout';

const NEAR_DISTANCE = 3.4;
const WALK_SPEED = 5.5;
const CAMERA_DISTANCE = 7.5;
const CAMERA_HEIGHT = 3.4;
const SKY = 0xdfe9f2;

export type MoveInput = { x: number; y: number };

export type World = {
	setMove: (input: MoveInput) => void;
	dispose: () => void;
};

type Exhibit = {
	work: Work;
	position: THREE.Vector3;
	glow: THREE.MeshStandardMaterial;
};

/** 丘の上に11の展示台を並べ、キャラを歩かせる。近づいた作品を onNear で外に流す。 */
export function createWorld(
	canvas: HTMLCanvasElement,
	works: Work[],
	onNear: (work: Work | null) => void
): World {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(SKY);
	// 台地の縁を霧で溶かして「丘の頂上」に見せる。裾の地形モデルを作らずに済ませるため。
	scene.fog = new THREE.Fog(SKY, GROUND_RADIUS * 0.55, GROUND_RADIUS * 1.5);

	const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

	scene.add(new THREE.HemisphereLight(0xffffff, 0x8fa88c, 2.1));
	const sun = new THREE.DirectionalLight(0xfff4e2, 2.4);
	sun.position.set(12, 20, 8);
	sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	sun.shadow.camera.left = -GROUND_RADIUS;
	sun.shadow.camera.right = GROUND_RADIUS;
	sun.shadow.camera.top = GROUND_RADIUS;
	sun.shadow.camera.bottom = -GROUND_RADIUS;
	scene.add(sun);

	const ground = new THREE.Mesh(
		new THREE.CircleGeometry(GROUND_RADIUS, 96).rotateX(-Math.PI / 2),
		new THREE.MeshStandardMaterial({ color: 0x9dbf8e, roughness: 1 })
	);
	ground.receiveShadow = true;
	scene.add(ground);

	const exhibits = works.filter((w) => w.spot).map(createExhibit);
	for (const exhibit of exhibits) scene.add(...exhibitMeshes(exhibit));

	const character = createCharacter();
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
			const lit = exhibit.work.id === nearId ? 0.55 : 0.06;
			exhibit.glow.emissiveIntensity += (lit - exhibit.glow.emissiveIntensity) * 0.15;
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
				if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite)) return;
				object.geometry?.dispose();
				for (const material of materialsOf(object)) {
					material.map?.dispose();
					material.dispose();
				}
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

function createExhibit(work: Work): Exhibit {
	const { x, z } = spotPosition(work.spot!);
	return {
		work,
		position: new THREE.Vector3(x, 0, z),
		glow: new THREE.MeshStandardMaterial({
			color: 0xf2efe6,
			emissive: 0x3b7a57,
			emissiveIntensity: 0.06,
			roughness: 0.35
		})
	};
}

function exhibitMeshes(exhibit: Exhibit) {
	const { position, glow, work } = exhibit;

	const pedestal = new THREE.Mesh(
		new THREE.CylinderGeometry(1.1, 1.3, 0.9, 24),
		new THREE.MeshStandardMaterial({ color: 0xe8e3d7, roughness: 0.8 })
	);
	pedestal.position.set(position.x, 0.45, position.z);
	pedestal.castShadow = true;
	pedestal.receiveShadow = true;

	const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), glow);
	cube.position.set(position.x, 1.75, position.z);
	cube.rotation.set(0.4, 0.6, 0);
	cube.castShadow = true;

	const label = createLabel(work.title.ja);
	label.position.set(position.x, 3.1, position.z);

	return [pedestal, cube, label];
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
	roundRect(context, 0, 0, width, height, 16 * scale);
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

function roundRect(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
	context.beginPath();
	context.roundRect(x, y, width, height, radius);
	context.closePath();
}

/**
 * ponytail: プリミティブ製の仮キャラ。歩行は上下の揺れで代用している。
 * CC0 の GLB (Quaternius) を static/ に置いたら、GLTFLoader + AnimationMixer で
 * idle / walk に差し替える。差し替え点はここ 1 箇所。
 */
function createCharacter() {
	const group = new THREE.Group();
	const material = new THREE.MeshStandardMaterial({ color: 0xe4572e, roughness: 0.5 });

	const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.7, 8, 16), material);
	body.position.y = 0.87;
	body.castShadow = true;

	const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 16), material);
	head.position.y = 1.6;
	head.castShadow = true;

	const nose = new THREE.Mesh(
		new THREE.ConeGeometry(0.09, 0.24, 12).rotateX(Math.PI / 2),
		new THREE.MeshStandardMaterial({ color: 0x23201c, roughness: 0.6 })
	);
	nose.position.set(0, 1.6, 0.26);

	group.add(body, head, nose);

	return {
		group,
		animate(time: number, moving: boolean) {
			group.position.y = moving ? Math.abs(Math.sin(time * 9)) * 0.12 : 0;
		}
	};
}

function materialsOf(object: THREE.Mesh | THREE.Sprite) {
	const material = object.material;
	return (Array.isArray(material) ? material : [material]) as Array<
		THREE.Material & { map?: THREE.Texture | null }
	>;
}

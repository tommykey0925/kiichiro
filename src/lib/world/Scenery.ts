// 花畑の見た目 (地面・空・草・野の花・蜂の巣・蜜で広がる花・蛍) を Three.js で組む。
// 地形と配置の計算は terrain.ts にあり、ここは形と色だけを受け持つ。

import * as THREE from 'three';
import type { Spot } from './layout';
import { spotPosition } from './layout';
import { GROUND_SIZE, HIVE_POSITION, combCells, fillOrder, grassTone, groundHeight, pathAmount, scatter, sprouts } from './terrain';

export type SceneryPalette = {
	skyTop: number;
	skyHorizon: number;
	grassLight: number;
	grassDark: number;
	path: number;
	blade: number;
	hive: number;
	hiveDeep: number;
	/** 蜜の部屋の灯りの強さ */
	honeyGlow: number;
	/** 夜か。巣が満ちたあと、夜だけ蛍を飛ばす */
	night: boolean;
};

export const SCENERY_PALETTES: Record<'light' | 'dark', SceneryPalette> = {
	light: {
		skyTop: 0x8fbfe0,
		skyHorizon: 0xfbefd2,
		grassLight: 0xa9cc7a,
		grassDark: 0x6f9f4f,
		path: 0xdcc79a,
		blade: 0x7fae55,
		// 壁は淡い蜜蝋、空の部屋は影、蜜の部屋は濃い琥珀で見分ける
		hive: 0xf1d98c,
		hiveDeep: 0xb8934a,
		honeyGlow: 0.35,
		night: false
	},
	// 月夜。暗くしすぎず、小道と丘の形が読める明るさにする
	dark: {
		skyTop: 0x101a33,
		skyHorizon: 0x3d3352,
		grassLight: 0x5a8048,
		grassDark: 0x34562f,
		path: 0x8a7656,
		blade: 0x4f7a40,
		hive: 0xb99a52,
		hiveDeep: 0x3a2c14,
		// 夜は蜜の部屋だけが灯り、遠くからいくつ満ちたか分かる
		honeyGlow: 1.4,
		night: true
	}
};

/** 野の花の色。トップの花びら・蜂蜜・紙の色と、作品の花にない淡い色 */
const WILDFLOWER_COLORS = [0xd95f79, 0xf2b705, 0xfbf6e9, 0xe9a6c0, 0xb9a3e3];

const GROUND_SEGMENTS = 96;
const BLADE_COUNT = 4200;
const WILDFLOWER_COUNT = 520;
/** 蜜が 1 部屋満ちるたびに、その作品の色で野原へ広がる花の数 */
const SPROUT_COUNT = 240;
/** 巣が全部満ちたあと夜に飛ぶ蛍の数 */
const FIREFLY_COUNT = 160;
const HIVE_CELL = 0.42;
/** 巣の真ん中の高さ。蜂が止まって降ろせる高さにする */
const HIVE_HEIGHT = 1.6;
/** 蜜の色。巣の部屋で使う */
export const HONEY_COLOR = 0xe8960c;
export const HONEY_GLOW_COLOR = 0xff9a00;

export type Scenery = {
	objects: THREE.Object3D[];
	/** 空と霧の色を合わせるため、地平線の色を返す */
	setPalette: (palette: SceneryPalette) => THREE.Color;
	animate: (time: number, delta: number) => void;
	hive: Hive;
	/** index 番目の作品の色の花を野原へ広げる。now なら動きなしで咲かせる */
	grow: (index: number, now?: boolean) => void;
	/** 巣が全部満ちたか (満ちると夜に蛍が飛ぶ) */
	setComplete: (complete: boolean) => void;
};

export type WorkSpot = { index: number; color: string };

export type Hive = ReturnType<typeof createHive>;

/**
 * still: 動きを減らす設定。草を揺らさない
 * lite: 指で操作する端末。草花を減らして描く量を抑える
 */
export function createScenery(spots: WorkSpot[], { still, lite }: { still: boolean; lite: boolean }): Scenery {
	const ground = createGround();
	const sky = createSky();
	const wind = { value: 0 };
	const share = lite ? 0.5 : 1;
	const blades = createBlades(spots, wind, Math.round(BLADE_COUNT * share));
	const wildflowers = createWildflowers(spots, wind, Math.round(WILDFLOWER_COUNT * share));
	const hive = createHive(spots.length);
	const meadows = spots.map((spot) => createMeadow(spot, spots, wind, Math.round(SPROUT_COUNT * share)));
	const fireflies = createFireflies(Math.round(FIREFLY_COUNT * share));
	let complete = false;
	let night = false;
	const showFireflies = () => (fireflies.points.visible = complete && night);

	return {
		objects: [ground.mesh, sky.mesh, blades.mesh, wildflowers, hive.group, fireflies.points, ...meadows.map((m) => m.mesh)],
		hive,
		grow(index, now = false) {
			meadows.find((m) => m.index === index)?.grow(now || still);
		},
		setComplete(next) {
			complete = next;
			showFireflies();
		},
		setPalette(palette) {
			night = palette.night;
			showFireflies();
			ground.paint(palette);
			sky.paint(palette);
			blades.paint(palette);
			hive.paint(palette);
			return new THREE.Color(palette.skyHorizon);
		},
		animate(time, delta) {
			// 動きを減らす設定では草を揺らさない
			wind.value = still ? 0 : time;
			hive.update(delta);
			for (const meadow of meadows) meadow.update(delta);
			if (fireflies.points.visible) fireflies.update(still ? 0 : time);
		}
	};
}

function createGround() {
	const geometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, GROUND_SEGMENTS, GROUND_SEGMENTS).rotateX(
		-Math.PI / 2
	);
	const position = geometry.attributes.position as THREE.BufferAttribute;
	const tone = new Float32Array(position.count);
	const path = new Float32Array(position.count);
	for (let i = 0; i < position.count; i++) {
		const x = position.getX(i);
		const z = position.getZ(i);
		position.setY(i, groundHeight(x, z));
		tone[i] = grassTone(x, z);
		path[i] = pathAmount(x, z);
	}
	geometry.computeVertexNormals();
	geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(position.count * 3), 3));

	const material = new THREE.MeshStandardMaterial({ roughness: 1, vertexColors: true, flatShading: true });
	const mesh = new THREE.Mesh(geometry, material);
	mesh.receiveShadow = true;

	const light = new THREE.Color();
	const dark = new THREE.Color();
	const dirt = new THREE.Color();
	const mixed = new THREE.Color();
	return {
		mesh,
		paint(palette: SceneryPalette) {
			light.set(palette.grassLight);
			dark.set(palette.grassDark);
			dirt.set(palette.path);
			const colors = geometry.attributes.color as THREE.BufferAttribute;
			for (let i = 0; i < position.count; i++) {
				mixed.copy(dark).lerp(light, tone[i]).lerp(dirt, path[i] * 0.85);
				colors.setXYZ(i, mixed.r, mixed.g, mixed.b);
			}
			colors.needsUpdate = true;
		}
	};
}

/** 上は空色、地平線は暖かい紙色へ変わる空。霧も地平線の色にそろえて、丘が空に溶けるようにする */
function createSky() {
	const uniforms = { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } };
	const material = new THREE.ShaderMaterial({
		uniforms,
		side: THREE.BackSide,
		depthWrite: false,
		fog: false,
		vertexShader: /* glsl */ `
			varying vec3 vDirection;
			void main() {
				vDirection = normalize(position);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: /* glsl */ `
			uniform vec3 top;
			uniform vec3 horizon;
			varying vec3 vDirection;
			void main() {
				float t = smoothstep(-0.02, 0.45, vDirection.y);
				gl_FragColor = vec4(mix(horizon, top, t), 1.0);
				#include <colorspace_fragment>
			}
		`
	});
	const mesh = new THREE.Mesh(new THREE.SphereGeometry(160, 32, 16), material);
	mesh.renderOrder = -1;
	mesh.frustumCulled = false;
	return {
		mesh,
		paint(palette: SceneryPalette) {
			uniforms.top.value.set(palette.skyTop);
			uniforms.horizon.value.set(palette.skyHorizon);
		}
	};
}

/** 草と野の花の先を風で揺らす。高いところほど大きく、場所ごとに揺れの位相をずらす */
function addWind(material: THREE.Material, wind: { value: number }, height: number, tinted = false) {
	material.onBeforeCompile = (shader) => {
		shader.uniforms.wind = wind;
		shader.vertexShader = shader.vertexShader
			.replace('#include <common>', '#include <common>\nuniform float wind;' + (tinted ? '\nattribute float tint;' : ''))
			// tinted: 作品や野の花の色 (instanceColor) を花びらだけに付け、茎の緑と芯の黄は残す
			.replace(
				'#include <color_vertex>',
				tinted
					? '#include <color_vertex>\nvColor.rgb = color.rgb * mix(vec3(1.0), instanceColor.rgb, tint);'
					: '#include <color_vertex>'
			)
			.replace(
				'#include <begin_vertex>',
				/* glsl */ `#include <begin_vertex>
				vec3 root = instanceMatrix[3].xyz;
				float bend = clamp(position.y / ${height.toFixed(2)}, 0.0, 1.0);
				bend *= bend;
				float sway = sin(wind * 1.7 + root.x * 0.35 + root.z * 0.22) + 0.4 * sin(wind * 3.1 + root.z * 0.9);
				transformed.x += sway * 0.09 * bend;
				transformed.z += sway * 0.05 * bend;`
			);
	};
}

function createBlades(spots: Spot[], wind: { value: number }, count: number) {
	// 3 枚の細い葉を寄せた株。三角錐を平たくつぶして葉に見せる
	const blade = new THREE.ConeGeometry(0.05, 0.62, 3, 1).translate(0, 0.31, 0).scale(1, 1, 0.35);
	const parts = [0, 1, 2].map((i) => {
		const g = blade.clone();
		g.rotateZ((i - 1) * 0.28).rotateY(i * 2.1).translate((i - 1) * 0.05, 0, (i % 2) * 0.04);
		return g;
	});
	const geometry = mergeGeometries(parts);

	const material = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true });
	addWind(material, wind, 0.62);
	const tufts = scatter(count, spots, 11);
	const mesh = new THREE.InstancedMesh(geometry, material, tufts.length);
	const matrix = new THREE.Matrix4();
	const rotation = new THREE.Quaternion();
	const up = new THREE.Vector3(0, 1, 0);
	tufts.forEach((t, i) => {
		rotation.setFromAxisAngle(up, t.turn);
		matrix.compose(new THREE.Vector3(t.x, t.y, t.z), rotation, new THREE.Vector3(t.scale, t.scale, t.scale));
		mesh.setMatrixAt(i, matrix);
	});
	mesh.receiveShadow = true;

	const base = new THREE.Color();
	const tint = new THREE.Color();
	return {
		mesh,
		paint(palette: SceneryPalette) {
			base.set(palette.blade);
			tufts.forEach((t, i) => {
				tint.copy(base).offsetHSL((t.tone - 0.5) * 0.05, 0, (t.tone - 0.5) * 0.12);
				mesh.setColorAt(i, tint);
			});
			mesh.instanceColor!.needsUpdate = true;
		}
	};
}

/** 細い茎の先に、上を向いた杯形の花。横から見ても板に見えないよう、下をすぼめる */
/**
 * 野の花の形。緑の茎の先に、上へ開いた 5 枚の花びらと黄色の芯。
 * 花びらだけ tint = 1 にして、色 (instanceColor) を付ける。
 */
function wildflowerGeometry() {
	const stem = paint(new THREE.CylinderGeometry(0.007, 0.011, 0.46, 4).translate(0, 0.23, 0), 0x5f8f3a, 0);
	const leaf = paint(
		new THREE.SphereGeometry(1, 5, 3).scale(0.05, 0.008, 0.016).translate(0.045, 0.16, 0).rotateZ(0.5),
		0x5f8f3a,
		0
	);
	const petals = [0, 1, 2, 3, 4].map((k) =>
		paint(
			new THREE.SphereGeometry(1, 5, 2)
				.scale(0.052, 0.01, 0.026)
				.translate(0.05, 0, 0)
				.rotateZ(0.35)
				.rotateY((k / 5) * Math.PI * 2)
				.translate(0, 0.47, 0),
			0xffffff,
			1
		)
	);
	const center = paint(new THREE.SphereGeometry(0.024, 5, 3).scale(1, 0.6, 1).translate(0, 0.475, 0), 0xf2b705, 0);
	// 蜂 (体長 0.46m) と並べて小さすぎないよう、全体を 1.5 倍にする
	return mergeGeometries([stem, leaf, ...petals, center]).scale(1.5, 1.5, 1.5);
}

/** 頂点色と、花びらかどうか (tint) を付ける */
function paint(geometry: THREE.BufferGeometry, color: number, tint: number) {
	const flat = geometry.toNonIndexed();
	const count = flat.attributes.position.count;
	const c = new THREE.Color(color);
	flat.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3).map((_, i) => [c.r, c.g, c.b][i % 3]), 3));
	flat.setAttribute('tint', new THREE.BufferAttribute(new Float32Array(count).fill(tint), 1));
	return flat;
}

function flowerMaterial(wind: { value: number }) {
	const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, flatShading: true });
	addWind(material, wind, 0.75, true);
	return material;
}

function createWildflowers(spots: Spot[], wind: { value: number }, count: number) {
	const geometry = wildflowerGeometry();
	const material = flowerMaterial(wind);

	const heads = scatter(count, spots, 23);
	const mesh = new THREE.InstancedMesh(geometry, material, heads.length);
	const matrix = new THREE.Matrix4();
	const rotation = new THREE.Quaternion();
	const tilt = new THREE.Euler();
	const color = new THREE.Color();
	heads.forEach((t, i) => {
		tilt.set((t.tone - 0.5) * 0.25, t.turn, (t.scale - 1.1) * 0.2);
		rotation.setFromEuler(tilt);
		const s = 0.7 + t.scale * 0.35;
		matrix.compose(new THREE.Vector3(t.x, t.y, t.z), rotation, new THREE.Vector3(s, s, s));
		mesh.setMatrixAt(i, matrix);
		mesh.setColorAt(i, color.set(WILDFLOWER_COLORS[Math.floor(t.tone * WILDFLOWER_COLORS.length)]));
	});
	return mesh;
}

/**
 * 蜜が巣に届いた作品の色で咲く花。巣から作品の花へ向かって、波のように咲いていく。
 * 最初は全部大きさ 0 で隠し、grow で咲かせる。
 */
function createMeadow(spot: WorkSpot, spots: Spot[], wind: { value: number }, count: number) {
	const material = flowerMaterial(wind);
	const places = sprouts(HIVE_POSITION, spotPosition(spot), count, spots, 100 + spot.index);
	const mesh = new THREE.InstancedMesh(wildflowerGeometry(), material, places.length);
	mesh.visible = false;
	const matrices = places.map((t) => {
		const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler((t.tone - 0.5) * 0.3, t.turn, 0));
		return { position: new THREE.Vector3(t.x, t.y, t.z), rotation, size: t.scale };
	});
	const matrix = new THREE.Matrix4();
	const scale = new THREE.Vector3();
	const place = (i: number, size: number) => {
		const m = matrices[i];
		matrix.compose(m.position, m.rotation, scale.setScalar(Math.max(size, 1e-4)));
		mesh.setMatrixAt(i, matrix);
	};
	const color = new THREE.Color(spot.color);
	places.forEach((_, i) => {
		place(i, 0);
		mesh.setColorAt(i, color);
	});
	let time = -1;
	const finished = Math.max(...places.map((p) => p.delay)) + GROW_TIME;

	return {
		index: spot.index,
		mesh,
		grow(now: boolean) {
			if (time >= 0) return;
			mesh.visible = true;
			time = now ? finished : 0;
			if (now) {
				places.forEach((p, i) => place(i, matrices[i].size));
				mesh.instanceMatrix.needsUpdate = true;
			}
		},
		update(delta: number) {
			if (time < 0 || time >= finished) return;
			time = Math.min(finished, time + delta);
			places.forEach((p, i) => {
				const t = Math.max(0, Math.min(1, (time - p.delay) / GROW_TIME));
				place(i, easeOutBack(t) * matrices[i].size);
			});
			mesh.instanceMatrix.needsUpdate = true;
		}
	};
}

/** 1 輪が咲ききるまでの時間 (秒) */
const GROW_TIME = 0.5;

/** 蛍。谷の中をゆっくり漂い、明滅する */
function createFireflies(count: number) {
	const base = new Float32Array(count * 3);
	const phase = new Float32Array(count);
	for (let i = 0; i < count; i++) {
		// 決まった並びにするため、添字から位置を作る
		const a = Math.sin(i * 12.9898) * 43758.5453;
		const b = Math.sin(i * 78.233) * 12345.678;
		const u = a - Math.floor(a);
		const v = b - Math.floor(b);
		base.set([(u * 2 - 1) * 14, 0.4 + ((u * 7) % 1) * 2.2, -44 + v * 92], i * 3);
		phase[i] = ((u + v) * 10) % (Math.PI * 2);
	}
	const positions = new Float32Array(base);
	const colors = new Float32Array(count * 3);
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
	const points = new THREE.Points(
		geometry,
		new THREE.PointsMaterial({
			size: 0.22,
			map: glowTexture(),
			vertexColors: true,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending
		})
	);
	points.visible = false;
	points.frustumCulled = false;
	const glow = new THREE.Color(0xd8ff7a);
	return {
		points,
		update(time: number) {
			for (let i = 0; i < count; i++) {
				const p = phase[i];
				positions[i * 3] = base[i * 3] + Math.sin(time * 0.4 + p) * 0.8;
				positions[i * 3 + 1] = base[i * 3 + 1] + Math.sin(time * 0.7 + p * 2) * 0.3;
				positions[i * 3 + 2] = base[i * 3 + 2] + Math.cos(time * 0.35 + p) * 0.8;
				const light = Math.max(0, Math.sin(time * 1.6 + p * 3)) ** 3;
				colors.set([glow.r * light, glow.g * light, glow.b * light], i * 3);
			}
			geometry.attributes.position.needsUpdate = true;
			geometry.attributes.color.needsUpdate = true;
		}
	};
}

function glowTexture() {
	const size = 64;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d')!;
	const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255,255,255,1)');
	gradient.addColorStop(0.3, 'rgba(255,255,255,0.45)');
	gradient.addColorStop(1, 'rgba(255,255,255,0)');
	context.fillStyle = gradient;
	context.fillRect(0, 0, size, size);
	return new THREE.CanvasTexture(canvas);
}

/**
 * 道の突き当たりの木に吊るした蜂の巣。部屋は作品の数だけ作り、真ん中から外へ埋める。
 *
 *        ___________ 枝
 *       |     |
 *       |   ⬡⬡⬡      ← 巣 (正面は道の方)
 *    幹 |   ⬡⬡⬡⬡
 *       |   ⬡⬡⬡
 *            ●       蜂は巣の下の entrance で止まって花粉を降ろす
 */
function createHive(count: number) {
	const group = new THREE.Group();
	const ground = groundHeight(HIVE_POSITION.x, HIVE_POSITION.z);
	group.position.set(HIVE_POSITION.x, ground, HIVE_POSITION.z);
	// 正面 (+z) を道の方 (z が小さい側) へ向ける
	group.rotation.y = Math.PI;

	// 作品の数が入る大きさの格子から、真ん中に近い順に count 部屋だけ使う
	let radius = 0;
	while (1 + 3 * radius * (radius + 1) < count) radius++;
	const grid = combCells(radius, HIVE_CELL);
	const cells = fillOrder(grid)
		.slice(0, count)
		.map((i) => grid[i]);

	const wall = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, flatShading: true });
	const deep = new THREE.MeshStandardMaterial({ roughness: 0.4, flatShading: true });
	const honey = new THREE.MeshStandardMaterial({
		color: HONEY_COLOR,
		emissive: HONEY_GLOW_COLOR,
		roughness: 0.15,
		flatShading: true
	});
	const prism = new THREE.CylinderGeometry(HIVE_CELL * 0.96, HIVE_CELL * 0.96, 1, 6).rotateX(Math.PI / 2);
	const hollow = new THREE.CylinderGeometry(HIVE_CELL * 0.72, HIVE_CELL * 0.72, 0.1, 6).rotateX(Math.PI / 2);
	// 蜜で満ちた部屋。少し盛り上がった、つやのある琥珀色。最初は大きさ 0 で隠しておく
	const cap = new THREE.CylinderGeometry(HIVE_CELL * 0.74, HIVE_CELL * 0.8, 0.2, 6).rotateX(Math.PI / 2);
	const center = HIVE_HEIGHT;
	const depth = 0.7;
	const fills: { mesh: THREE.Mesh; progress: number }[] = [];

	for (const cell of cells) {
		const box = new THREE.Mesh(prism, wall);
		box.scale.z = depth;
		box.position.set(cell.x, cell.y + center, 0);
		box.castShadow = true;
		const pit = new THREE.Mesh(hollow, deep);
		pit.position.set(cell.x, cell.y + center, depth / 2);
		const fill = new THREE.Mesh(cap, honey);
		fill.position.set(cell.x, cell.y + center, depth / 2 + 0.02);
		fill.scale.setScalar(0);
		fill.visible = false;
		group.add(box, pit, fill);
		fills.push({ mesh: fill, progress: -1 });
	}

	// 木: 巣の横に幹を立て、上から枝を巣の上へ渡す
	const bark = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1, flatShading: true });
	const top = center + HIVE_CELL * 1.5 * (radius + 1) + 0.6;
	const trunkX = HIVE_CELL * 2 * (radius + 1) + 0.8;
	const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, top + 0.6, 7).translate(trunkX, (top + 0.6) / 2, -0.3), bark);
	const branch = new THREE.Mesh(
		new THREE.CylinderGeometry(0.13, 0.18, trunkX + 0.4, 6).rotateZ(Math.PI / 2).translate(trunkX / 2 - 0.2, top, -0.3),
		bark
	);
	const stalk = new THREE.Mesh(
		new THREE.CylinderGeometry(0.07, 0.1, top - center - HIVE_CELL * 1.5 * radius, 6).translate(
			0,
			(top + center + HIVE_CELL * 1.5 * radius) / 2,
			-0.3
		),
		bark
	);
	const crown = new THREE.Mesh(
		new THREE.IcosahedronGeometry(1.6, 0).translate(trunkX, top + 1.2, -0.3),
		new THREE.MeshStandardMaterial({ color: 0x5f8a3c, roughness: 0.9, flatShading: true })
	);
	for (const part of [trunk, branch, stalk, crown]) part.castShadow = true;
	group.add(trunk, branch, stalk, crown);

	group.updateMatrixWorld(true);
	// 蜂が花粉を降ろすときに止まる位置: 巣の下の入口。正面に重ならず、満ちていく部屋が見える
	const entrance = group.localToWorld(
		new THREE.Vector3(0, center - HIVE_CELL * 1.5 * radius - HIVE_CELL - 0.55, depth / 2 + 0.2)
	);

	return {
		group,
		entrance,
		/** slot 番目の部屋 (真ん中から外へ数える) を蜜で満たす。now なら動きなしで満たす */
		fill(slot: number, now = false) {
			const cell = fills[slot];
			if (!cell || cell.progress >= 0) return;
			cell.mesh.visible = true;
			cell.progress = now ? 1 : 0;
			cell.mesh.scale.setScalar(now ? 1 : 0);
		},
		update(delta: number) {
			for (const cell of fills) {
				if (cell.progress < 0 || cell.progress >= 1) continue;
				cell.progress = Math.min(1, cell.progress + delta / 0.5);
				cell.mesh.scale.setScalar(easeOutBack(cell.progress));
			}
		},
		paint(palette: SceneryPalette) {
			wall.color.set(palette.hive);
			deep.color.set(palette.hiveDeep);
			honey.emissiveIntensity = palette.honeyGlow;
		}
	};
}

/** 少し行き過ぎてから落ち着く (ぷくっと満ちる) */
function easeOutBack(t: number) {
	const c = 1.7;
	return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

/** 位置と法線だけを持つ geometry をつなげる (BufferGeometryUtils を読まずに済ませる) */
function mergeGeometries(parts: THREE.BufferGeometry[]) {
	const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p));
	const geometry = new THREE.BufferGeometry();
	// 全部の部品が持っている属性だけをつなげる (位置は必ず、頂点色と tint は持っていれば)
	for (const name of ['position', 'color', 'tint']) {
		if (!flat.every((p) => p.attributes[name])) continue;
		const size = flat[0].attributes[name].itemSize;
		const total = flat.reduce((n, p) => n + p.attributes.position.count, 0);
		const array = new Float32Array(total * size);
		let offset = 0;
		for (const p of flat) {
			array.set(p.attributes[name].array as Float32Array, offset);
			offset += p.attributes.position.count * size;
		}
		geometry.setAttribute(name, new THREE.BufferAttribute(array, size));
	}
	geometry.computeVertexNormals();
	return geometry;
}

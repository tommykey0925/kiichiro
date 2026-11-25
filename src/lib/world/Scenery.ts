// 花畑の見た目 (地面・空・草・野の花・遠くの蜂の巣) を Three.js で組む。
// 地形と配置の計算は terrain.ts にあり、ここは形と色だけを受け持つ。

import * as THREE from 'three';
import type { Spot } from './layout';
import { GROUND_SIZE, HIVE_POSITION, combCells, grassTone, groundHeight, pathAmount, scatter } from './terrain';

export type SceneryPalette = {
	skyTop: number;
	skyHorizon: number;
	grassLight: number;
	grassDark: number;
	path: number;
	blade: number;
	hive: number;
	hiveDeep: number;
	/** 巣の部屋の奥の灯り。夜は巣が灯って遠くからも見える */
	hiveGlow?: number;
};

export const SCENERY_PALETTES: Record<'light' | 'dark', SceneryPalette> = {
	light: {
		skyTop: 0x8fbfe0,
		skyHorizon: 0xfbefd2,
		grassLight: 0xa9cc7a,
		grassDark: 0x6f9f4f,
		path: 0xdcc79a,
		blade: 0x7fae55,
		hive: 0xf2b705,
		hiveDeep: 0xc98a00
	},
	// 月夜。暗くしすぎず、小道と丘の形が読める明るさにする
	dark: {
		skyTop: 0x101a33,
		skyHorizon: 0x3d3352,
		grassLight: 0x5a8048,
		grassDark: 0x34562f,
		path: 0x8a7656,
		blade: 0x4f7a40,
		hive: 0xf2b705,
		hiveDeep: 0xffb400,
		hiveGlow: 1.6
	}
};

/** 野の花の色。トップの花びら・蜂蜜・紙の色と、作品の花にない淡い色 */
const WILDFLOWER_COLORS = [0xd95f79, 0xf2b705, 0xfbf6e9, 0xe9a6c0, 0xb9a3e3];

const GROUND_SEGMENTS = 96;
const BLADE_COUNT = 4200;
const WILDFLOWER_COUNT = 520;
const HIVE_CELL = 1.15;

export type Scenery = {
	objects: THREE.Object3D[];
	/** 空と霧の色を合わせるため、地平線の色を返す */
	setPalette: (palette: SceneryPalette) => THREE.Color;
	animate: (time: number) => void;
	/** 蜂の巣の正面の中心 (PR3 で蜜を運ぶ先) */
	hive: THREE.Group;
};

/**
 * still: 動きを減らす設定。草を揺らさない
 * lite: 指で操作する端末。草花を減らして描く量を抑える
 */
export function createScenery(spots: Spot[], { still, lite }: { still: boolean; lite: boolean }): Scenery {
	const ground = createGround();
	const sky = createSky();
	const wind = { value: 0 };
	const share = lite ? 0.5 : 1;
	const blades = createBlades(spots, wind, Math.round(BLADE_COUNT * share));
	const wildflowers = createWildflowers(spots, wind, Math.round(WILDFLOWER_COUNT * share));
	const hive = createHive();

	return {
		objects: [ground.mesh, sky.mesh, blades.mesh, wildflowers, hive.group],
		hive: hive.group,
		setPalette(palette) {
			ground.paint(palette);
			sky.paint(palette);
			blades.paint(palette);
			hive.paint(palette);
			return new THREE.Color(palette.skyHorizon);
		},
		animate(time) {
			// 動きを減らす設定では草を揺らさない
			wind.value = still ? 0 : time;
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
function addWind(material: THREE.Material, wind: { value: number }, height: number) {
	material.onBeforeCompile = (shader) => {
		shader.uniforms.wind = wind;
		shader.vertexShader = shader.vertexShader
			.replace('#include <common>', '#include <common>\nuniform float wind;')
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

function createWildflowers(spots: Spot[], wind: { value: number }, count: number) {
	// 細い茎の先に、上を向いた杯形の花。横から見ても板に見えないよう、下をすぼめる
	const stem = new THREE.CylinderGeometry(0.01, 0.014, 0.45, 4).translate(0, 0.225, 0);
	const head = new THREE.CylinderGeometry(0.09, 0.015, 0.08, 6).translate(0, 0.48, 0);
	const geometry = mergeGeometries([stem, head]);
	const material = new THREE.MeshStandardMaterial({ roughness: 0.7, flatShading: true });
	addWind(material, wind, 0.5);

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

/** 道の奥の丘に立つ蜂の巣。ロゴの「.」と同じ六角形の部屋を積み、奥行きを少しずつずらす */
function createHive() {
	const group = new THREE.Group();
	const ground = groundHeight(HIVE_POSITION.x, HIVE_POSITION.z);
	group.position.set(HIVE_POSITION.x, ground + 0.2, HIVE_POSITION.z);
	// 道の方 (z が小さい側) を向ける
	group.rotation.y = Math.PI;

	const cells = combCells(2, HIVE_CELL);
	const wall = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, flatShading: true });
	const deep = new THREE.MeshStandardMaterial({ roughness: 0.4, flatShading: true });
	const prism = new THREE.CylinderGeometry(HIVE_CELL * 0.96, HIVE_CELL * 0.96, 1, 6).rotateX(Math.PI / 2);
	const hollow = new THREE.CylinderGeometry(HIVE_CELL * 0.72, HIVE_CELL * 0.72, 0.2, 6).rotateX(Math.PI / 2);
	const lift = HIVE_CELL * 1.5 * 2 + HIVE_CELL;

	cells.forEach((cell, i) => {
		const depth = 1.1 + ((i * 37) % 7) * 0.12;
		const box = new THREE.Mesh(prism, wall);
		box.scale.z = depth;
		box.position.set(cell.x, cell.y + lift, 0);
		box.castShadow = true;
		const pit = new THREE.Mesh(hollow, deep);
		pit.position.set(cell.x, cell.y + lift, depth / 2 - 0.05);
		group.add(box, pit);
	});

	// 巣を支える太い枝
	const branch = new THREE.Mesh(
		new THREE.CylinderGeometry(0.35, 0.5, lift, 6).translate(0, lift / 2, -0.6),
		new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1, flatShading: true })
	);
	group.add(branch);

	return {
		group,
		paint(palette: SceneryPalette) {
			wall.color.set(palette.hive);
			deep.color.set(palette.hiveDeep);
			deep.emissive.set(palette.hiveDeep);
			deep.emissiveIntensity = palette.hiveGlow ?? 0;
		}
	};
}

/** 位置と法線だけを持つ geometry をつなげる (BufferGeometryUtils を読まずに済ませる) */
function mergeGeometries(parts: THREE.BufferGeometry[]) {
	const flat = parts.map((p) => p.toNonIndexed());
	const total = flat.reduce((n, p) => n + p.attributes.position.count, 0);
	const position = new Float32Array(total * 3);
	let offset = 0;
	for (const p of flat) {
		position.set(p.attributes.position.array as Float32Array, offset);
		offset += p.attributes.position.count * 3;
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
	geometry.computeVertexNormals();
	return geometry;
}

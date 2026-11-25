// 花畑の地形と草花の配置。Three.js に依存しない計算だけを置き、terrain.check.ts で検査する。
//
//          丘            歩ける谷             丘
//    ___/‾‾‾‾\___   |                 |   ___/‾‾\___
//   /            \__|_________________|__/          \
//                   ← ROAD_HALF_WIDTH →
//
// 歩ける範囲 (道) の地面は高さ 0 のまま平らにし、外へ出るほど丘が立ち上がって板の端を隠す。
// 道の奥 (z が大きい側) の丘の上に、遠くからも見える蜂の巣を置く。

import { ROAD_HALF_LENGTH, ROAD_HALF_WIDTH, spotPosition, type Spot } from './layout.ts';

/** 地面の板の一辺 (m)。霧の向こうまで続くように大きくとる */
export const GROUND_SIZE = 240;

/** 丘が立ち上がり始める、道の外側からの距離 */
const HILL_START = 2;
/** 丘が上がりきる距離 */
const HILL_FULL = 20;

/** 蜂の巣の位置。道の奥の丘の上 */
export const HIVE_POSITION = { x: 0, z: ROAD_HALF_LENGTH + 34 };

/** 決まった種から同じ並びを返す乱数 (mulberry32)。開くたびに草花の配置が変わらないようにする */
export function seeded(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function smoothstep(edge0: number, edge1: number, x: number) {
	const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}

/** 道の長方形の外へどれだけ出ているか (m)。道の中は 0 */
export function outside(x: number, z: number) {
	const dx = Math.max(0, Math.abs(x) - ROAD_HALF_WIDTH);
	const dz = Math.max(0, Math.abs(z) - ROAD_HALF_LENGTH);
	return Math.hypot(dx, dz);
}

/** 地面の高さ。道の中は 0、外は波の重なった丘 */
export function groundHeight(x: number, z: number) {
	const rise = smoothstep(HILL_START, HILL_FULL, outside(x, z));
	if (rise === 0) return 0;
	const waves =
		3.2 +
		1.8 * Math.sin(x * 0.11 + 0.8) * Math.cos(z * 0.07) +
		1.1 * Math.sin(x * 0.23 + z * 0.17 + 2.1) +
		0.6 * Math.sin(z * 0.31 - x * 0.05);
	return rise * waves + outside(x, z) * 0.05;
}

/** 草の色の揺らぎ (0〜1)。同じ緑一色に見えないように、地面の頂点ごとに色を混ぜる */
export function grassTone(x: number, z: number) {
	const v = 0.5 + 0.25 * Math.sin(x * 0.37 + z * 0.21) + 0.25 * Math.sin(x * 0.13 - z * 0.41 + 1.7);
	return Math.max(0, Math.min(1, v));
}

/** 踏みならされた小道の濃さ (0〜1)。道の真ん中をゆるく蛇行する */
export function pathAmount(x: number, z: number) {
	if (Math.abs(z) > ROAD_HALF_LENGTH) return 0;
	const center = 0.9 * Math.sin(z * 0.12);
	return 1 - smoothstep(0.6, 1.4, Math.abs(x - center));
}

export type Tuft = { x: number; y: number; z: number; scale: number; turn: number; tone: number };

/** 展示の花のまわりは空けて、作品の花が草に埋もれないようにする */
export const CLEAR_RADIUS = 1.8;

function nearSpot(x: number, z: number, spots: Spot[]) {
	return spots.some((spot) => {
		const p = spotPosition(spot);
		return Math.hypot(p.x - x, p.z - z) < CLEAR_RADIUS;
	});
}

/** 草と野の花を散らす。道の中は少なめ、谷のふちから丘にかけて多め。小道と展示の花のまわりは避ける */
export function scatter(count: number, spots: Spot[], seed: number): Tuft[] {
	const random = seeded(seed);
	const tufts: Tuft[] = [];
	const halfX = 46;
	const minZ = -ROAD_HALF_LENGTH - 16;
	const maxZ = ROAD_HALF_LENGTH + 30;
	let guard = count * 20;
	while (tufts.length < count && guard-- > 0) {
		const x = (random() * 2 - 1) * halfX;
		const z = minZ + random() * (maxZ - minZ);
		const edge = outside(x, z);
		// 道の中 0.35、ふちの外 6m あたりで 1、遠くでは少しずつ減らす
		const density = edge === 0 ? 0.35 : Math.max(0.25, 1 - Math.max(0, edge - 6) / 40);
		if (random() > density) continue;
		if (pathAmount(x, z) > 0.2) continue;
		if (nearSpot(x, z, spots)) continue;
		tufts.push({
			x,
			y: groundHeight(x, z),
			z,
			scale: 0.7 + random() * 0.8,
			turn: random() * Math.PI * 2,
			tone: random()
		});
	}
	return tufts;
}

/** 蜂の巣の部屋の並び (六角形の格子、半径 radius の部屋まで)。x, y は巣の正面での位置 */
export function combCells(radius: number, size: number) {
	const cells: { q: number; r: number; x: number; y: number }[] = [];
	for (let q = -radius; q <= radius; q++) {
		for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
			// 頂点が上の六角形 (pointy-top) を横に並べる
			const x = size * Math.sqrt(3) * (q + r / 2);
			const y = size * 1.5 * r;
			cells.push({ q, r, x, y });
		}
	}
	return cells;
}

/** 蜜をためる部屋の順番。真ん中の部屋から外へ、同じ輪の中は上から時計回りに埋める */
export function fillOrder(cells: { q: number; r: number; x: number; y: number }[]) {
	const ring = (c: { q: number; r: number }) => Math.max(Math.abs(c.q), Math.abs(c.r), Math.abs(-c.q - c.r));
	// 上 (y が大きい) から時計回り。atan2(x, y) は上で 0、右回りで増える
	const turn = (c: { x: number; y: number }) => (Math.atan2(c.x, c.y) + Math.PI * 2) % (Math.PI * 2);
	return cells
		.map((cell, index) => ({ index, ring: ring(cell), turn: turn(cell) }))
		.sort((a, b) => a.ring - b.ring || a.turn - b.turn)
		.map((c) => c.index);
}

type Point3 = { x: number; y: number; z: number };

/** 花から巣へ飛ぶ蜜の通り道。2 点の上に山なりの弧を描く (2 次ベジェ)。t は 0〜1 */
export function honeyArc(from: Point3, to: Point3, t: number, rise = 8): Point3 {
	const control = { x: (from.x + to.x) / 2, y: Math.max(from.y, to.y) + rise, z: (from.z + to.z) / 2 };
	const u = 1 - t;
	return {
		x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
		y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
		z: u * u * from.z + 2 * u * t * control.z + t * t * to.z
	};
}

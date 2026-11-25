import assert from 'node:assert/strict';
import { ROAD_HALF_LENGTH, ROAD_HALF_WIDTH, spotPosition } from './layout.ts';
import { CLEAR_RADIUS, HIVE_POSITION, SPROUT_SPEED, SPROUT_WIDTH, combCells, fillOrder, groundHeight, pathAmount, sprouts, scatter, seeded } from './terrain.ts';
import { featured } from '../works.ts';

const spots = featured.map((work) => work.spot!);

// 歩ける範囲の地面は平ら (蜂の高さは固定なので、地面が上がると草に埋もれる)
for (let x = -ROAD_HALF_WIDTH; x <= ROAD_HALF_WIDTH; x += 0.5) {
	for (let z = -ROAD_HALF_LENGTH; z <= ROAD_HALF_LENGTH; z += 0.5) {
		assert.equal(groundHeight(x, z), 0, `道の中 (${x}, ${z}) の地面が平らでない`);
	}
}

// 道の外は丘になり、なめらかに上がる (1m で 1.2m 以上の段差がない)
let highest = 0;
for (let x = -100; x <= 100; x += 1) {
	for (let z = -100; z <= 100; z += 1) {
		const h = groundHeight(x, z);
		assert.ok(h >= 0, `(${x}, ${z}) の地面が道より低い`);
		assert.ok(Math.abs(groundHeight(x + 1, z) - h) < 1.2, `(${x}, ${z}) で段差が急`);
		assert.ok(Math.abs(groundHeight(x, z + 1) - h) < 1.2, `(${x}, ${z}) で段差が急`);
		highest = Math.max(highest, h);
	}
}
assert.ok(highest > 4, `丘が低すぎて板の端が見える (最高 ${highest.toFixed(2)}m)`);
assert.equal(groundHeight(HIVE_POSITION.x, HIVE_POSITION.z), 0, '蜂の巣の足元が平らでない');

// 同じ種なら同じ並び
const a = seeded(7);
const b = seeded(7);
for (let i = 0; i < 10; i++) assert.equal(a(), b());

// 草花は、作品の花のまわりと小道を避け、地面の高さに立つ
const tufts = scatter(3000, spots, 1);
assert.equal(tufts.length, 3000, '草花を必要な数だけ置けない');
for (const t of tufts) {
	for (const spot of spots) {
		const p = spotPosition(spot);
		assert.ok(Math.hypot(p.x - t.x, p.z - t.z) >= CLEAR_RADIUS, '作品の花のまわりに草がある');
	}
	assert.ok(pathAmount(t.x, t.z) <= 0.2, '小道の上に草がある');
	assert.equal(t.y, groundHeight(t.x, t.z), '草が地面から浮いている');
}
const inside = tufts.filter((t) => Math.abs(t.x) < ROAD_HALF_WIDTH && Math.abs(t.z) < ROAD_HALF_LENGTH).length;
assert.ok(inside > 100, `道の中の草が少なすぎる (${inside})`);

// 小道は歩ける範囲の真ん中を通る
assert.ok(pathAmount(0, 0) > 0.9, '道の真ん中に小道がない');
assert.equal(pathAmount(ROAD_HALF_WIDTH, 0), 0, '小道が道の端まで広がっている');

// 蜂の巣の部屋: 半径 2 で 19 部屋、隣り合う部屋の中心は等間隔
const cells = combCells(2, 1);
assert.equal(cells.length, 19);
const center = cells.find((c) => c.q === 0 && c.r === 0)!;
const neighbours = cells.filter((c) => Math.hypot(c.x - center.x, c.y - center.y) < 1.8);
assert.equal(neighbours.length, 7, '真ん中の部屋の隣が 6 つでない');
for (const n of neighbours) {
	if (n === center) continue;
	assert.ok(Math.abs(Math.hypot(n.x, n.y) - Math.sqrt(3)) < 1e-9, '部屋の間隔がそろっていない');
}

// 蜜は真ん中の部屋から埋まり、次の 6 部屋はその隣、上から時計回り
const order = fillOrder(cells);
assert.equal(new Set(order).size, cells.length, '埋める順番に抜けか重なりがある');
assert.deepEqual([cells[order[0]].q, cells[order[0]].r], [0, 0], '最初に埋まる部屋が真ん中でない');
for (const i of order.slice(1, 7)) assert.ok(Math.abs(Math.hypot(cells[i].x, cells[i].y) - Math.sqrt(3)) < 1e-9, '2〜7 番目が真ん中の隣でない');
const firstRing = order.slice(1, 7).map((i) => cells[i]);
assert.ok(firstRing[0].y > 0, '輪の最初が上にない');
assert.ok(firstRing[1].x > firstRing[firstRing.length - 1].x, '時計回りになっていない');

// 蜜が届いたときに咲く花: 巣から作品の花への帯に並び、遅れは巣からの距離に比例し、作品の花の側が密
const target = spotPosition(spots[0]);
const grown = sprouts(HIVE_POSITION, target, 160, spots, 5);
assert.equal(grown.length, 160, '咲く花を必要な数だけ置けない');
const fromHive = (t: { x: number; z: number }) => Math.hypot(t.x - HIVE_POSITION.x, t.z - HIVE_POSITION.z);
const span = Math.hypot(target.x - HIVE_POSITION.x, target.z - HIVE_POSITION.z);
for (const t of grown) {
	assert.ok(Math.abs(t.delay - fromHive(t) / SPROUT_SPEED) < 1e-9, '遅れが巣からの距離に比例しない');
	assert.ok(fromHive(t) < span + SPROUT_WIDTH, '帯の外に咲いている');
	assert.ok(pathAmount(t.x, t.z) <= 0.2, '咲く花が小道の上にある');
	assert.equal(t.y, groundHeight(t.x, t.z), '咲く花が地面から浮いている');
}
const nearFlower = grown.filter((t) => fromHive(t) > span / 2).length;
assert.ok(nearFlower > grown.length / 2, `作品の花の側が密になっていない (${nearFlower})`);
assert.ok(Math.min(...grown.map((t) => t.delay)) < 1, '巣の近くから咲き始めない');
assert.ok(Math.max(...grown.map((t) => t.delay)) < 5, '咲き終わるまでが長すぎる');

console.log(`terrain ok: ${tufts.length} tufts (${inside} in the valley), hill ${highest.toFixed(1)}m`);

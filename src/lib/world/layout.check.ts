import assert from 'node:assert/strict';
import { GROUND_RADIUS, clampToGround, moveHeading, spotPosition, type Spot } from './layout.ts';

const spots: Spot[] = [
	{ ring: 'center', index: 0 },
	...[0, 1, 2, 3, 4].map((index) => ({ ring: 'inner' as const, index })),
	...[0, 1, 2, 3, 4].map((index) => ({ ring: 'outer' as const, index }))
];

// 11の展示台は、台地の中に収まり、互いに離れていること
const points = spots.map(spotPosition);
for (const { x, z } of points) {
	assert.ok(Math.hypot(x, z) < GROUND_RADIUS - 2, '展示台が台地からはみ出している');
}
for (let a = 0; a < points.length; a++) {
	for (let b = a + 1; b < points.length; b++) {
		const gap = Math.hypot(points[a].x - points[b].x, points[a].z - points[b].z);
		assert.ok(gap > 4, `展示台 ${a} と ${b} が近すぎる (${gap.toFixed(2)})`);
	}
}

// 台地の中にいる間は座標が変わらないこと
assert.deepEqual(clampToGround(3, -4), { x: 3, z: -4 });

// 台地の外に出ようとしたら、向きを保ったまま縁に押し戻されること
const pushed = clampToGround(100, 0);
assert.ok(Math.abs(Math.hypot(pushed.x, pushed.z) - (GROUND_RADIUS - 1.5)) < 1e-9);
assert.ok(pushed.x > 0 && pushed.z === 0, '押し戻しで向きが変わっている');

// どの視点角でも、入力方向が画面の見た目どおりに動くこと
const direction = (heading: number) => ({ x: Math.sin(heading), z: Math.cos(heading) });
const dot = (a: { x: number; z: number }, b: { x: number; z: number }) => a.x * b.x + a.z * b.z;

for (const yaw of [0, 0.7, -2.1, Math.PI, 4.2]) {
	const forward = { x: Math.sin(yaw), z: Math.cos(yaw) };
	const right = { x: -Math.cos(yaw), z: Math.sin(yaw) };

	assert.ok(dot(direction(moveHeading({ x: 0, y: 1 }, yaw)), forward) > 0.999, 'W が前でない');
	assert.ok(dot(direction(moveHeading({ x: 0, y: -1 }, yaw)), forward) < -0.999, 'S が後ろでない');
	assert.ok(dot(direction(moveHeading({ x: 1, y: 0 }, yaw)), right) > 0.999, 'D が画面の右でない');
	assert.ok(dot(direction(moveHeading({ x: -1, y: 0 }, yaw)), right) < -0.999, 'A が画面の左でない');
}

console.log('layout ok:', points.length, 'spots');

import assert from 'node:assert/strict';
import { GROUND_RADIUS, clampToGround, spotPosition, type Spot } from './layout.ts';

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

console.log('layout ok:', points.length, 'spots');

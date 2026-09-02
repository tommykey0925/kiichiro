import assert from 'node:assert/strict';
import {
	NEAR_DISTANCE,
	ROAD_HALF_LENGTH,
	ROAD_HALF_WIDTH,
	START_POSITION,
	clampToGround,
	moveHeading,
	spotPosition
} from './layout.ts';

const points = [...Array(11)].map((_, index) => spotPosition({ index }));

// 展示台は道の上に収まり、左右交互に並ぶこと
for (const [i, { x, z }] of points.entries()) {
	assert.ok(Math.abs(x) < ROAD_HALF_WIDTH, `展示台 ${i} が道からはみ出している`);
	assert.ok(Math.abs(z) < ROAD_HALF_LENGTH, `展示台 ${i} が道の端を越えている`);
	assert.equal(x < 0, i % 2 === 0, `展示台 ${i} が交互になっていない`);
}

// 隣り合う展示台のパネルが同時に開かないこと
for (let a = 0; a < points.length; a++) {
	for (let b = a + 1; b < points.length; b++) {
		const gap = Math.hypot(points[a].x - points[b].x, points[a].z - points[b].z);
		assert.ok(gap > NEAR_DISTANCE * 2, `展示台 ${a} と ${b} が近すぎる (${gap.toFixed(2)})`);
	}
}

// 開始位置がどの展示台とも重ならないこと
for (const [i, { x, z }] of points.entries()) {
	const gap = Math.hypot(x - START_POSITION.x, z - START_POSITION.z);
	assert.ok(gap > NEAR_DISTANCE, `開始位置が展示台 ${i} に近すぎる (${gap.toFixed(2)})`);
}

// 開始位置の背後にあるカメラも道の上に乗っていること
assert.ok(START_POSITION.z - 7.5 > -ROAD_HALF_LENGTH, 'カメラが道の外から始まっている');

// 道の中にいる間は座標が変わらないこと
assert.deepEqual(clampToGround(3, -4), { x: 3, z: -4 });

// 道の外に出ようとしたら縁で止まること
assert.deepEqual(clampToGround(100, 100), {
	x: ROAD_HALF_WIDTH - 1.5,
	z: ROAD_HALF_LENGTH - 1.5
});

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

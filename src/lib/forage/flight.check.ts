// 通常ページの蜂の飛び方の検査。pnpm test で動かす。
import assert from 'node:assert/strict';
import { FLIGHT, createFlight, speedOf, step, wave, type Flight, type Goal } from './flight.ts';

const fps = 60;
const run = (flight: Flight, goal: Goal, seconds: number, onFrame?: (f: Flight) => void, yaw: number | null = null) => {
	let f = flight;
	for (let i = 0; i < seconds * fps; i++) {
		f = step(f, goal, 1 / fps, yaw);
		onFrame?.(f);
	}
	return f;
};
const distance = (f: Flight, goal: Goal) => Math.hypot(f.p.x - goal.at.x, f.p.y - goal.at.y, f.p.z - goal.at.z);
const finite = (f: Flight) => [f.p.x, f.p.y, f.p.z, f.v.x, f.v.y, f.v.z, f.yaw, f.pitch, f.bank, f.smile].every(Number.isFinite);

// 1. 遠くの作品 (奥) へ 3 秒以内に着き、そのあと 0.3m より離れない。最高速度を超えない
{
	const goal: Goal = { at: { x: -3, y: -1.5, z: -7 }, wander: 0.12, speed: 5 };
	let arrivedAt = -1;
	let frame = 0;
	let left = false;
	let top = 0;
	run(createFlight({ x: 4, y: 2, z: 0 }), goal, 7, (f) => {
		frame++;
		assert.ok(finite(f), '値が有限でない');
		top = Math.max(top, speedOf(f));
		if (arrivedAt < 0 && distance(f, goal) < 0.2) arrivedAt = frame / fps;
		else if (arrivedAt >= 0 && frame / fps > arrivedAt + 1 && distance(f, goal) > 0.3) left = true;
	});
	assert.ok(arrivedAt > 0 && arrivedAt < 3, `着くまで ${arrivedAt} 秒かかった`);
	assert.ok(!left, '着いた後に離れた');
	assert.ok(top <= goal.speed * 1.05, `最高速度を超えた (${top.toFixed(2)})`);
}

// 2. 飛び始めは急に最高速にならない (慣性)
{
	const goal: Goal = { at: { x: 6, y: 0, z: 0 }, wander: 0, speed: 5 };
	const early = run(createFlight({ x: 0, y: 0, z: 0 }), goal, 0.1);
	assert.ok(speedOf(early) < 1, `飛び始めから速すぎる (${speedOf(early).toFixed(2)})`);
}

// 3. 留まっている間も完全には止まらず、漂う
{
	const goal: Goal = { at: { x: 0, y: 0, z: 2 }, wander: 1, speed: 4 };
	const settled = run(createFlight({ x: 0, y: 0, z: 2 }), goal, 4);
	const xs: number[] = [];
	run(settled, goal, 4, (f) => xs.push(f.p.x));
	const spread = Math.max(...xs) - Math.min(...xs);
	assert.ok(spread > 0.1 && spread < 1.2, `漂う幅が想定外 (${spread.toFixed(2)}m)`);
}

// 4. 留まっていると、こちらを向いて笑い、手を振る。挨拶は 2.2 秒で終わり、ずっと笑い続けない
{
	const goal: Goal = { at: { x: 0, y: 0, z: 2 }, wander: 0.05, speed: 4 };
	let greeted = -1;
	let maxWave = 0;
	let smiling = 0;
	let frame = 0;
	run(createFlight({ x: 0, y: 0, z: 2 }), goal, 16, (f) => {
		frame++;
		maxWave = Math.max(maxWave, wave(f));
		if (greeted < 0 && f.greetFor > 0) greeted = frame / fps;
		if (f.smile > 0.5) smiling++;
	});
	assert.ok(greeted >= 0 && greeted < FLIGHT.lookCycle + 1, `挨拶が始まらない (${greeted})`);
	assert.ok(maxWave > 0.9 && maxWave <= 1, `手を振る度合いが想定外 (${maxWave.toFixed(2)})`);
	assert.ok(smiling / fps < 16 * 0.5, `笑っている時間が長すぎる (${(smiling / fps).toFixed(1)} 秒)`);
}

// 5. 速く飛んでいる間は挨拶しない
{
	const goal: Goal = { at: { x: 40, y: 0, z: 0 }, wander: 0, speed: 5 };
	let greeted = false;
	run(createFlight({ x: -40, y: 0, z: 0 }), goal, 6, (f) => speedOf(f) > 1 && f.greetFor > 0 && (greeted = true));
	assert.ok(!greeted, '速く飛びながら挨拶した');
}

// 6. 向きを指定すると、その向きへ寄る (標本のように回して見せるとき)
{
	const goal: Goal = { at: { x: 0, y: 0, z: 0 }, wander: 0, speed: 4 };
	const turned = run(createFlight({ x: 0, y: 0, z: 0 }), goal, 2, undefined, Math.PI / 2);
	assert.ok(Math.abs(turned.yaw - Math.PI / 2) < 0.05, `指定した向きにならない (${turned.yaw.toFixed(2)})`);
}

// 7. 大きな dt を渡しても飛びすぎない (タブが裏から戻った直後)
{
	const goal: Goal = { at: { x: 50, y: 0, z: 0 }, wander: 0, speed: 5 };
	const start = createFlight({ x: 0, y: 0, z: 0 }, { x: 5, y: 0, z: 0 });
	const f = step(start, goal, 10);
	assert.ok(f.p.x <= 5 * FLIGHT.maxStep * 1.5, `一度に進みすぎた (${f.p.x.toFixed(2)}m)`);
	assert.ok(finite(f), '値が有限でない');
}

console.log('forage flight ok');

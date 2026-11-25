// 蜂の飛び方の検査。pnpm test で動かす。
import assert from 'node:assert/strict';
import { FLIGHT, createFlight, isHovering, step, type Flight } from './flight.ts';

const fps = 60;
const run = (flight: Flight, target: { x: number; y: number } | null, seconds: number, onFrame?: (f: Flight) => void) => {
	let f = flight;
	for (let i = 0; i < seconds * fps; i++) {
		f = step(f, target, { x: 0, y: 0 }, 1 / fps);
		onFrame?.(f);
	}
	return f;
};

// 1. 遠くの花に 3 秒以内で着き、そのあと花の上に留まる
{
	const target = { x: 1200, y: 700 };
	let arrivedAt = -1;
	let frame = 0;
	let left = false;
	let maxSpeed = 0;
	run(createFlight({ x: 0, y: 0 }), target, 6, (f) => {
		frame++;
		maxSpeed = Math.max(maxSpeed, Math.hypot(f.vx, f.vy));
		for (const v of [f.x, f.y, f.vx, f.vy, f.angle]) assert.ok(Number.isFinite(v), '値が有限でない');
		if (arrivedAt < 0 && isHovering(f, target)) arrivedAt = frame / fps;
		else if (arrivedAt >= 0 && frame / fps > arrivedAt + 0.5 && Math.hypot(f.x - target.x, f.y - target.y) > FLIGHT.hoverRadius * 1.5) left = true;
	});
	assert.ok(arrivedAt > 0 && arrivedAt < 3, `花に着くまで ${arrivedAt} 秒かかった`);
	assert.ok(!left, '着いた後に花から離れた');
	assert.ok(maxSpeed <= FLIGHT.maxSpeed + 1e-6, `最高速度を超えた (${maxSpeed})`);
}

// 2. まっすぐ飛ばない (進路が直線から外れる)
{
	const target = { x: 1500, y: 0 };
	let maxOff = 0;
	run(createFlight({ x: 0, y: 0 }), target, 1.2, (f) => (maxOff = Math.max(maxOff, Math.abs(f.y))));
	assert.ok(maxOff > 3, `進路の揺れが小さすぎる (${maxOff.toFixed(2)}px)`);
	assert.ok(maxOff < 120, `進路の揺れが大きすぎる (${maxOff.toFixed(2)}px)`);
}

// 3. 花の上では止まりきらず、細かく揺れる
{
	const target = { x: 300, y: 300 };
	const settled = run(createFlight({ x: 0, y: 0 }), target, 4);
	const xs: number[] = [];
	run(settled, target, 1, (f) => xs.push(f.x));
	const spread = Math.max(...xs) - Math.min(...xs);
	assert.ok(spread > 2 && spread < 40, `花の上の揺れ幅が想定外 (${spread.toFixed(2)}px)`);
}

// 4. 行き先がないときは巡回し、遠くへ行かない
{
	let far = 0;
	run(createFlight({ x: 0, y: 0 }), null, 20, (f) => (far = Math.max(far, Math.hypot(f.x, f.y))));
	assert.ok(far < 260, `巡回で離れすぎた (${far.toFixed(0)}px)`);
}

// 5. 大きな dt を渡しても飛びすぎない (タブが裏から戻った直後)
{
	const f = step(createFlight({ x: 0, y: 0 }), { x: 5000, y: 0 }, { x: 0, y: 0 }, 10);
	assert.ok(Math.hypot(f.x, f.y) <= FLIGHT.maxSpeed * FLIGHT.maxStep + 1e-6, '一度に進みすぎた');
}

console.log('flight ok');

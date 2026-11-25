import assert from 'node:assert/strict';
import { FLIGHT3, createFlight3, hasArrived, speedOf, step3, type Control, type Flight3 } from './flight.ts';

const dt = 1 / 60;
function run(f: Flight3, control: Control, seconds: number, each?: (f: Flight3) => void) {
	for (let i = 0; i < seconds / dt; i++) {
		f = step3(f, control, dt);
		each?.(f);
	}
	return f;
}

const start = createFlight3({ x: 0, y: FLIGHT3.idle, z: 0 });
const forward: Control = { kind: 'steer', dir: { x: 0, z: 1 } };

// 慣性: 押した瞬間に最高速にならず、1 秒ほどで最高速に近づく
const early = run(start, forward, 0.1);
assert.ok(speedOf(early) < FLIGHT3.maxSpeed * 0.3, `押した直後から速すぎる (${speedOf(early).toFixed(2)})`);
let top = 0;
const cruising = run(start, forward, 1.2, (f) => (top = Math.max(top, speedOf(f))));
assert.ok(speedOf(cruising) > FLIGHT3.maxSpeed * 0.9, '1.2 秒押しても最高速に近づかない');
assert.ok(top <= FLIGHT3.maxSpeed + 1e-9, '最高速度を超えた');
// 飛んでいるあいだは高く、加速中は頭を下げる
assert.ok(Math.abs(cruising.y - FLIGHT3.cruise) < 0.1, `飛んでいる高さが想定外 (${cruising.y.toFixed(2)})`);
assert.ok(early.pitch > 0.05, '加速しても前傾しない');

// 離すとすぐには止まらず、滑ってから止まる
const released = run(cruising, { kind: 'steer', dir: { x: 0, z: 0 } }, 0.2);
assert.ok(speedOf(released) > 2, '離した瞬間に止まった');
const stopped = run(cruising, { kind: 'steer', dir: { x: 0, z: 0 } }, 2);
assert.ok(speedOf(stopped) < 0.05, '離して 2 秒たっても止まらない');
assert.ok(Math.abs(stopped.y - FLIGHT3.idle) < 0.1, '止まっても高さが下がらない');

// 曲がるときは内側へ傾き、向きは少し遅れて回る
let maxBank = 0;
const turned = run(cruising, { kind: 'steer', dir: { x: 1, z: 0 } }, 1.5, (f) => (maxBank = Math.max(maxBank, Math.abs(f.bank))));
assert.ok(maxBank > 0.2, `曲がっても傾かない (${maxBank.toFixed(2)})`);
assert.ok(maxBank <= FLIGHT3.maxBank + 1e-9, '傾きすぎた');
assert.ok(Math.abs(turned.yaw - Math.PI / 2) < 0.1, `曲がり終えても向きが進む向きにそろわない (${turned.yaw.toFixed(2)})`);
assert.ok(Math.abs(turned.bank) < 0.1, '曲がり終えても傾いたまま');

// 寄る: 3m 先の花の上に 3 秒以内に着いて止まり、その後も離れない
const flower = { x: 2, y: 2.2, z: 2 };
let arrivedAt = -1;
let after = run(start, { kind: 'arrive', target: flower }, 3, (f) => {
	if (arrivedAt < 0 && hasArrived(f, flower)) arrivedAt = f.t;
});
assert.ok(arrivedAt > 0 && arrivedAt < 3, `花に 3 秒以内に着かない (${arrivedAt.toFixed(2)})`);
after = run(after, { kind: 'arrive', target: flower }, 2, (f) => {
	assert.ok(Math.hypot(f.x - flower.x, f.y - flower.y, f.z - flower.z) < 0.12, '着いた後に花から離れた');
});

// 大きな時間差 (タブを裏から戻したとき) でも飛びすぎない
const jumped = step3(cruising, forward, 5);
assert.ok(Math.abs(jumped.z - cruising.z) < FLIGHT3.maxSpeed * FLIGHT3.maxStep + 1e-9, '大きな時間差で飛びすぎた');

console.log(`world flight ok: arrive ${arrivedAt.toFixed(2)}s, bank ${maxBank.toFixed(2)}`);

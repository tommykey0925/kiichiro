// 通常ページを飛ぶ 3D の蜂の飛び方。three.js を使わない純粋な計算だけを置き、flight.check.ts で検査する。
//
//   座標はカメラから見た 3D の空間 (m)。カメラは +z 側から -z を向いている。z が大きいほど手前で大きく映る。
//   行き先がある     → 向かって加速し、近づくと減速する (arrive)。行き先のまわりを周期の違う波で漂い、完全には止まらない
//   体の向き         → 速いときは進む向きに頭を向け、遅いときはこちら (+z) へ顔を向ける。曲がるときは内側へ傾き、上下に動くときは頭を上げ下げする
//   挨拶             → ずっと正面から見つめないよう、ふだんは斜めを向いて見回す。8 秒に 1 回だけこちらを向き、
//                      正面を向いて落ち着いたら 2.2 秒だけ目を細めて笑い、前脚で手を振る

export type Vec = { x: number; y: number; z: number };

export type Goal = {
	/** 行き先 (m) */
	at: Vec;
	/** 行き先のまわりを漂う強さ。0 でほぼ真上に留まる */
	wander: number;
	/** 最高速度 (m/秒) */
	speed: number;
};

export type Flight = {
	p: Vec;
	v: Vec;
	/** 左右の向き (ラジアン)。0 でこちらを向く */
	yaw: number;
	pitch: number;
	bank: number;
	/** 経過時間 (秒)。揺れの位相に使う */
	t: number;
	/** 笑顔の度合い 0〜1 */
	smile: number;
	/** 挨拶の残り時間 (秒) */
	greetFor: number;
	/** 前の挨拶からの時間 (秒) */
	sinceGreet: number;
};

export const FLIGHT = {
	/** 加速度の上限 (m/秒²) */
	maxForce: 7,
	/** この距離から減速を始める (m) */
	slowRadius: 1.6,
	/** 一度に進める時間の上限 (秒)。タブが裏にあった直後などに飛びすぎないため */
	maxStep: 1 / 20,
	/** 挨拶の長さと、次の挨拶までの間 (秒) */
	greetLength: 2.2,
	greetGap: 4,
	/** こちらを向く周期と、そのうち正面を向いている長さ (秒) */
	lookCycle: 8,
	lookLength: 2.8
} as const;

const damp = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt));
const shortestTurn = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export function createFlight(at: Vec, v: Vec = { x: 0, y: 0, z: 0 }): Flight {
	return { p: { ...at }, v: { ...v }, yaw: 0.4, pitch: 0, bank: 0, t: 0, smile: 0, greetFor: 0, sinceGreet: FLIGHT.greetGap };
}

/** 行き先のまわりの漂い。周期の違う波を重ねて規則的に見せない */
export function drift(t: number, wander: number): Vec {
	return {
		x: wander * (0.32 * Math.sin(t * 0.71) + 0.1 * Math.sin(t * 2.3)),
		y: wander * (0.22 * Math.sin(t * 1.13 + 1) + 0.06 * Math.sin(t * 3.1)),
		z: wander * 0.35 * Math.sin(t * 0.53 + 2)
	};
}

/**
 * dt 秒だけ進めて、新しい状態を返す。
 * yawOverride を渡すと左右の向きをその値へ寄せる (標本のように回して見せるとき)。
 */
export function step(flight: Flight, goal: Goal, dt: number, yawOverride: number | null = null): Flight {
	const h = Math.min(Math.max(dt, 0), FLIGHT.maxStep);
	const t = flight.t + h;
	const off = drift(t, goal.wander);
	const dx = goal.at.x + off.x - flight.p.x;
	const dy = goal.at.y + off.y - flight.p.y;
	const dz = goal.at.z + off.z - flight.p.z;
	const distance = Math.hypot(dx, dy, dz);

	// 近づくほど遅く。1 回で変えられる速度は 加速度の上限 × 時間 まで
	const want = distance > 1e-4 ? (Math.min(1, distance / FLIGHT.slowRadius) * goal.speed) / distance : 0;
	let sx = dx * want - flight.v.x;
	let sy = dy * want - flight.v.y;
	let sz = dz * want - flight.v.z;
	const steer = Math.hypot(sx, sy, sz);
	const reach = FLIGHT.maxForce * h;
	if (steer > reach) {
		sx *= reach / steer;
		sy *= reach / steer;
		sz *= reach / steer;
	}
	const v = { x: flight.v.x + sx, y: flight.v.y + sy, z: flight.v.z + sz };
	const p = { x: flight.p.x + v.x * h, y: flight.p.y + v.y * h, z: flight.p.z + v.z * h };

	// 向き: 速いほど進む向き、遅いほどこちらへ顔を向ける。こちらを向く周期の外では斜めを見回す
	const speed = Math.hypot(v.x, v.y, v.z);
	const calm = 1 - Math.min(1, speed / 1.4);
	const hx = v.x;
	const hy = v.y;
	const hz = v.z + calm * 1.2 + 0.15;
	const looking = calm > 0.6 && t % FLIGHT.lookCycle < FLIGHT.lookLength;
	const glance = 0.8 * Math.sin(t * 0.37) + 0.25 * Math.sin(t * 1.1);
	const nextYaw = yawOverride ?? Math.atan2(hx, hz) + (looking ? 0 : glance * calm);
	const turn = shortestTurn(flight.yaw, nextYaw);
	const yaw = Math.atan2(Math.sin(flight.yaw + turn * (1 - Math.exp(-4.5 * h))), Math.cos(flight.yaw + turn * (1 - Math.exp(-4.5 * h))));
	const pitch = damp(flight.pitch, -Math.atan2(hy, Math.hypot(hx, hz)) * 0.75, 4, h);
	const bank = damp(flight.bank, Math.max(-0.6, Math.min(0.6, -turn * 1.6)), 3, h);

	// 挨拶: 正面を向いて落ち着いたら始める
	const facing = Math.cos(yaw) > 0.93 && speed < 0.7;
	let sinceGreet = flight.sinceGreet + h;
	// 飛び出したら挨拶はやめる (速く飛びながら手を振らない)
	let greetFor = speed > 1 ? 0 : flight.greetFor - h;
	if (facing && greetFor <= 0 && sinceGreet > FLIGHT.greetGap) {
		greetFor = FLIGHT.greetLength;
		sinceGreet = 0;
	}
	const smile = damp(flight.smile, greetFor > 0 ? 1 : 0, 6, h);

	return { p, v, yaw, pitch, bank, t, smile, greetFor: Math.max(greetFor, 0), sinceGreet };
}

/** 手を振る度合い 0〜1。挨拶の始めと終わりの 1/3 秒で上げ下げする */
export function wave(flight: Flight) {
	if (flight.greetFor <= 0) return 0;
	return Math.min(1, (FLIGHT.greetLength - flight.greetFor) * 3, flight.greetFor * 3);
}

export function speedOf(flight: Flight) {
	return Math.hypot(flight.v.x, flight.v.y, flight.v.z);
}

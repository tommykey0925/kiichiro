// /world の蜂の飛び方。座標は m、時間は秒。
//
//   操作しているとき   入力の向きへ加速し、離すとゆっくり止まる (慣性)。曲がると体を内側へ傾け、加速すると頭を下げる
//   花や巣へ寄るとき   行き先に向かい、近づくほど遅くなって、その上で細かく揺れながら止まる (arrive)
//
// 体の向き (yaw) は速度の向きへ少し遅れて回る。向きの変わる速さから傾き (bank) を、前後の加速から前傾 (pitch) を出す。

export type Vec3 = { x: number; y: number; z: number };

export type Flight3 = Vec3 & {
	vx: number;
	vy: number;
	vz: number;
	yaw: number;
	bank: number;
	pitch: number;
	t: number;
};

export type Control =
	/** dir は世界座標の水平方向 (長さ 0〜1)。0 なら止まろうとする */
	| { kind: 'steer'; dir: { x: number; z: number } }
	| { kind: 'arrive'; target: Vec3 };

export const FLIGHT3 = {
	maxSpeed: 7,
	accel: 13,
	brake: 7,
	/** 飛んでいるときの高さ */
	cruise: 1.45,
	/** 止まっているときの高さ */
	idle: 1.15,
	/** 寄るときの最高速度と、減速を始める距離 */
	arriveSpeed: 5,
	slowRadius: 2.2,
	/** 行き先に着いたとみなす距離 */
	landRadius: 0.14,
	turnRate: 7,
	maxBank: 0.65,
	maxPitch: 0.35,
	maxStep: 1 / 30
} as const;

export function createFlight3(at: Vec3): Flight3 {
	return { ...at, vx: 0, vy: 0, vz: 0, yaw: 0, bank: 0, pitch: 0, t: 0 };
}

function shortestTurn(from: number, to: number) {
	return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function limit(x: number, y: number, z: number, max: number) {
	const length = Math.hypot(x, y, z);
	if (length <= max || length === 0) return { x, y, z };
	const k = max / length;
	return { x: x * k, y: y * k, z: z * k };
}

/** 寄った先で止まっているときの細かい揺れ。本物の蜂は空中で完全には止まらない */
function hover(t: number): Vec3 {
	return { x: 0.03 * Math.sin(t * 7.3), y: 0.025 * Math.sin(t * 9.7 + 0.6), z: 0.03 * Math.sin(t * 5.9 + 1.9) };
}

export function speedOf(f: Flight3) {
	return Math.hypot(f.vx, f.vz);
}

export function step3(f: Flight3, control: Control, dt: number): Flight3 {
	const h = Math.min(Math.max(dt, 0), FLIGHT3.maxStep);
	const t = f.t + h;
	let desired: Vec3;
	let force: number;

	if (control.kind === 'steer') {
		const { dir } = control;
		const amount = Math.min(1, Math.hypot(dir.x, dir.z));
		const height = speedOf(f) > 1 || amount > 0 ? FLIGHT3.cruise : FLIGHT3.idle;
		desired = {
			x: dir.x * FLIGHT3.maxSpeed,
			// 高さはばねで寄せる (上下の速さは水平より小さく)
			y: Math.max(-2, Math.min(2, (height - f.y) * 3)),
			z: dir.z * FLIGHT3.maxSpeed
		};
		force = amount > 0 ? FLIGHT3.accel : FLIGHT3.brake;
	} else {
		const wobble = hover(t);
		const dx = control.target.x + wobble.x - f.x;
		const dy = control.target.y + wobble.y - f.y;
		const dz = control.target.z + wobble.z - f.z;
		const distance = Math.hypot(dx, dy, dz);
		const speed = FLIGHT3.arriveSpeed * Math.min(1, distance / FLIGHT3.slowRadius);
		desired = distance > 0 ? { x: (dx / distance) * speed, y: (dy / distance) * speed, z: (dz / distance) * speed } : { x: 0, y: 0, z: 0 };
		force = FLIGHT3.accel;
	}

	const change = limit(desired.x - f.vx, desired.y - f.vy, desired.z - f.vz, force * h);
	const vx = f.vx + change.x;
	const vy = f.vy + change.y;
	const vz = f.vz + change.z;

	// 体の向き: 水平に動いているときだけ速度の向きへ回す
	const horizontal = Math.hypot(vx, vz);
	const turn = horizontal > 0.4 ? shortestTurn(f.yaw, Math.atan2(vx, vz)) * Math.min(1, h * FLIGHT3.turnRate) : 0;
	const yaw = Math.atan2(Math.sin(f.yaw + turn), Math.cos(f.yaw + turn));
	// 傾き: 向きの変わる速さに比例して内側へ。前傾: 進む向きへの加速に比例
	const turning = h > 0 ? turn / h : 0;
	const bankTarget = Math.max(-FLIGHT3.maxBank, Math.min(FLIGHT3.maxBank, -turning * 0.22));
	const forward = h > 0 ? (change.x * Math.sin(yaw) + change.z * Math.cos(yaw)) / h : 0;
	const pitchTarget = Math.max(-FLIGHT3.maxPitch, Math.min(FLIGHT3.maxPitch, forward * 0.03));
	const ease = Math.min(1, h * 8);

	return {
		x: f.x + vx * h,
		y: f.y + vy * h,
		z: f.z + vz * h,
		vx,
		vy,
		vz,
		yaw,
		bank: f.bank + (bankTarget - f.bank) * ease,
		pitch: f.pitch + (pitchTarget - f.pitch) * ease,
		t
	};
}

/** 行き先に着いて、ほぼ止まっているか */
export function hasArrived(f: Flight3, target: Vec3) {
	return Math.hypot(target.x - f.x, target.y - f.y, target.z - f.z) < FLIGHT3.landRadius && Math.hypot(f.vx, f.vy, f.vz) < 0.5;
}

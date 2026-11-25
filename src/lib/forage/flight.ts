// 蜂の飛び方。画面の座標 (px) で、速度と加速度を持たせて少しずつ進める。
//
//   行き先がある   → 向かって加速し、近づくと減速して、花の上で細かく揺れながら止まる
//   行き先がない   → 決まった場所のまわりをゆっくり巡回する
//   いつでも       → 進む向きと直角に小さな揺れを足して、まっすぐ飛ばない
//
// 体の向きは、速いときは進む向き、止まりかけは頭を上にした姿勢へ寄せる。曲がるときは内側へ傾ける。

export type Point = { x: number; y: number };

export type Flight = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	/** 体の向き (ラジアン)。0 で頭が上 */
	angle: number;
	/** 経過時間 (秒)。揺れの位相に使う */
	t: number;
};

export const FLIGHT = {
	/** 最高速度 (px/秒) */
	maxSpeed: 620,
	/** 加速度の上限 (px/秒²) */
	maxForce: 1600,
	/** この距離から減速を始める */
	slowRadius: 220,
	/** 花の上で止まっているとみなす距離 */
	hoverRadius: 28,
	/** 進む向きと直角の揺れの強さ (px/秒²) */
	wobble: 520,
	/** 一度に進める時間の上限 (秒)。タブが裏にあった直後などに飛びすぎないため */
	maxStep: 1 / 30
} as const;

export function createFlight(at: Point): Flight {
	return { x: at.x, y: at.y, vx: 0, vy: 0, angle: 0, t: 0 };
}

/** 花の上で止まっているときの細かい揺れ。本物の蜂は空中で完全には止まらない */
function hoverOffset(t: number): Point {
	return { x: 7 * Math.sin(t * 9.1) + 3 * Math.sin(t * 23.7), y: 5 * Math.sin(t * 12.3 + 1.1) };
}

/** 行き先がないときの巡回。home のまわりを 8 の字に近い形で回る */
function patrol(home: Point, t: number): Point {
	return { x: home.x + 110 * Math.sin(t * 0.55), y: home.y + 60 * Math.sin(t * 1.1 + 0.7) };
}

function clamp(vx: number, vy: number, max: number): Point {
	const length = Math.hypot(vx, vy);
	if (length <= max || length === 0) return { x: vx, y: vy };
	return { x: (vx / length) * max, y: (vy / length) * max };
}

function shortestTurn(from: number, to: number) {
	return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** dt 秒だけ進めて、新しい状態を返す */
export function step(flight: Flight, target: Point | null, home: Point, dt: number): Flight {
	const h = Math.min(Math.max(dt, 0), FLIGHT.maxStep);
	const t = flight.t + h;

	const goal = target ? { x: target.x + hoverOffset(t).x, y: target.y + hoverOffset(t).y } : patrol(home, t);
	const dx = goal.x - flight.x;
	const dy = goal.y - flight.y;
	const distance = Math.hypot(dx, dy);

	// 近づくほど遅く (arrive)
	const speed = distance < FLIGHT.slowRadius ? FLIGHT.maxSpeed * (distance / FLIGHT.slowRadius) : FLIGHT.maxSpeed;
	const desired = distance > 0 ? { x: (dx / distance) * speed, y: (dy / distance) * speed } : { x: 0, y: 0 };
	// 1 回で変えられる速度は 加速度の上限 × 時間 まで
	const reach = FLIGHT.maxForce * h;
	const steer = clamp(desired.x - flight.vx, desired.y - flight.vy, reach);

	// 進む向きと直角の揺れ。周期の違う 2 つの波を重ねて規則的に見せない
	const current = Math.hypot(flight.vx, flight.vy);
	const nx = current > 1 ? -flight.vy / current : 0;
	const ny = current > 1 ? flight.vx / current : 0;
	const wave = Math.sin(t * 7.3) + 0.6 * Math.sin(t * 11.9 + 1.3);
	const wobble = wave * FLIGHT.wobble * Math.min(1, current / FLIGHT.maxSpeed + 0.2);

	const velocity = clamp(
		flight.vx + steer.x + nx * wobble * h,
		flight.vy + steer.y + ny * wobble * h,
		FLIGHT.maxSpeed
	);

	// 体の向き: 速いときは進む向き (+90° で頭が前)、遅いときは頭を上に。曲がる側へ少し傾ける
	const moving = Math.hypot(velocity.x, velocity.y);
	const heading = Math.atan2(velocity.y, velocity.x) + Math.PI / 2;
	const upright = 0.12 * Math.sin(t * 2.3);
	const blend = Math.min(1, moving / 260);
	const facing = upright + shortestTurn(upright, heading) * blend;
	const lateral = reach > 0 ? (nx * steer.x + ny * steer.y) / reach : 0;
	const bank = 0.35 * Math.max(-1, Math.min(1, lateral));
	const angle = flight.angle + shortestTurn(flight.angle, facing + bank) * Math.min(1, h * 10);

	// 角度は -π〜π に収め、回り続けても値が大きくならないようにする
	const wrapped = Math.atan2(Math.sin(angle), Math.cos(angle));
	return { x: flight.x + velocity.x * h, y: flight.y + velocity.y * h, vx: velocity.x, vy: velocity.y, angle: wrapped, t };
}

/** 花の上で止まっているか */
export function isHovering(flight: Flight, target: Point) {
	return Math.hypot(target.x - flight.x, target.y - flight.y) < FLIGHT.hoverRadius;
}

export const GROUND_RADIUS = 26;

const RING_RADIUS = { center: 0, inner: 9, outer: 17 } as const;
const RING_COUNT = { center: 1, inner: 5, outer: 5 } as const;

export type Spot = { ring: keyof typeof RING_RADIUS; index: number };

/** 外周は内周と角度をずらす。真横から見たとき展示台が重なるため。 */
export function spotPosition({ ring, index }: Spot) {
	const radius = RING_RADIUS[ring];
	const offset = ring === 'outer' ? Math.PI / RING_COUNT.outer : 0;
	const angle = (index / RING_COUNT[ring]) * Math.PI * 2 + offset;
	return { x: Math.sin(angle) * radius, z: Math.cos(angle) * radius };
}

/** 霧で見えなくなる手前で押し戻す。縁に立たれると台地が円盤だと分かってしまうため。 */
export function clampToGround(x: number, z: number) {
	const limit = GROUND_RADIUS - 1.5;
	const distance = Math.hypot(x, z);
	if (distance <= limit) return { x, z };
	return { x: (x * limit) / distance, z: (z * limit) / distance };
}

/**
 * カメラは (sin yaw, cos yaw) 方向を向くので、画面の右は world 上では
 * (-cos yaw, sin yaw)。x をそのまま足すと左右が鏡になる。
 */
export function moveHeading(input: { x: number; y: number }, yaw: number) {
	return Math.atan2(-input.x, input.y) + yaw;
}

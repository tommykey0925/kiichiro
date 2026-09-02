/** 道の幅と長さ。端は霧に溶けるので、見える範囲より少し広く取る。 */
export const ROAD_HALF_WIDTH = 9;
export const ROAD_HALF_LENGTH = 44;

export const NEAR_DISTANCE = 3.4;

const SPOT_OFFSET_X = 5;
const SPOT_SPACING = 5;

/** 手前の展示台より後ろ。カメラが地面の外に出ない位置でもある。 */
export const START_POSITION = { x: 0, z: -33.5 };

export type Spot = { index: number };

/** 道の左右に交互。偶数が左、奇数が右。 */
export function spotPosition({ index }: Spot) {
	return {
		x: index % 2 === 0 ? -SPOT_OFFSET_X : SPOT_OFFSET_X,
		z: index * SPOT_SPACING - 27.5
	};
}

/** 道の外に出さない。縁に立たれると地面がただの板だと分かってしまうため。 */
export function clampToGround(x: number, z: number) {
	const margin = 1.5;
	return {
		x: Math.max(-ROAD_HALF_WIDTH + margin, Math.min(ROAD_HALF_WIDTH - margin, x)),
		z: Math.max(-ROAD_HALF_LENGTH + margin, Math.min(ROAD_HALF_LENGTH - margin, z))
	};
}

/**
 * カメラは (sin yaw, cos yaw) 方向を向くので、画面の右は world 上では
 * (-cos yaw, sin yaw)。x をそのまま足すと左右が鏡になる。
 */
export function moveHeading(input: { x: number; y: number }, yaw: number) {
	return Math.atan2(-input.x, input.y) + yaw;
}

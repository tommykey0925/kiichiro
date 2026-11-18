export const ROAD_HALF_WIDTH = 9;
export const ROAD_HALF_LENGTH = 44;

export const NEAR_DISTANCE = 3.4;

const SPOT_OFFSET_X = 5;
const SPOT_SPACING = 5;

export const START_POSITION = { x: 0, z: -33.5 };

export type Spot = { index: number };

export function spotPosition({ index }: Spot) {
	return {
		x: index % 2 === 0 ? -SPOT_OFFSET_X : SPOT_OFFSET_X,
		z: index * SPOT_SPACING - 27.5
	};
}

export function clampToGround(x: number, z: number) {
	const margin = 1.5;
	return {
		x: Math.max(-ROAD_HALF_WIDTH + margin, Math.min(ROAD_HALF_WIDTH - margin, x)),
		z: Math.max(-ROAD_HALF_LENGTH + margin, Math.min(ROAD_HALF_LENGTH - margin, z))
	};
}

export function moveHeading(input: { x: number; y: number }, yaw: number) {
	return Math.atan2(-input.x, input.y) + yaw;
}

export const SPARKLE_COUNT = 18;
export const SPARKLE_RADIUS = { min: 0.55, max: 1.2 };
export const SPARKLE_HEIGHT = { min: 0.7, max: 2.0 };

export function sparkleOffsets(random = Math.random) {
	return Array.from({ length: SPARKLE_COUNT }, (_, i) => {
		const angle = ((i + random() * 0.6) / SPARKLE_COUNT) * Math.PI * 2;
		const radius = SPARKLE_RADIUS.min + random() * (SPARKLE_RADIUS.max - SPARKLE_RADIUS.min);
		return {
			x: Math.cos(angle) * radius,
			y: SPARKLE_HEIGHT.min + random() * (SPARKLE_HEIGHT.max - SPARKLE_HEIGHT.min),
			z: Math.sin(angle) * radius,
			phase: random() * Math.PI * 2
		};
	});
}

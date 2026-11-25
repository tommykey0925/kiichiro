// /world の蜂の見た目。羽ばたき、体の傾き、後ろ脚の花粉玉を受け持つ。動き方は flight.ts が決める。

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Flight3 } from './flight';

const BEE_SCALE = 0.16;
/** bee.glb の羽のマテリアル名 */
const WING_MATERIAL = '80DEEA';
/** 羽の付け根 (モデル座標)。ここを軸に上下に振る */
const WING_HINGE = { x: 1.2, y: 4.4 };
/** 花粉玉の色 */
const POLLEN_COLOR = 0xf5b400;

export type WingMode = 'flying' | 'hovering' | 'resting';

const WING = {
	flying: { rate: 34, amplitude: 0.55 },
	hovering: { rate: 30, amplitude: 0.45 },
	// 花や巣に止まっているときはゆっくり、小さく
	resting: { rate: 4, amplitude: 0.12 }
} as const;

export async function createBeeModel({ still }: { still: boolean }) {
	const gltf = await new GLTFLoader().loadAsync('/bee.glb');
	const model = gltf.scene;
	model.scale.setScalar(BEE_SCALE);
	// モデルは -z を向いているので、体の前を +z にそろえる
	model.rotation.y = Math.PI;

	const wing = { angle: { value: 0 } };
	model.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		object.castShadow = true;
		if (object.material.name !== WING_MATERIAL) return;
		const material = (object.material as THREE.MeshStandardMaterial).clone();
		// 羽は半透明にして、速く動くときのぶれを感じさせる
		material.transparent = true;
		material.opacity = 0.72;
		material.depthWrite = false;
		material.onBeforeCompile = (shader) => {
			shader.uniforms.wingAngle = wing.angle;
			shader.vertexShader = shader.vertexShader
				.replace('#include <common>', '#include <common>\nuniform float wingAngle;')
				.replace(
					'#include <begin_vertex>',
					/* glsl */ `#include <begin_vertex>
					// 付け根より外側の頂点を、付け根を軸に回す。左右で逆向きに回して両羽を同時に上げ下げする
					float side = sign(position.x);
					float reach = abs(position.x) - ${WING_HINGE.x.toFixed(2)};
					if (reach > 0.0) {
						float lift = position.y - ${WING_HINGE.y.toFixed(2)};
						float c = cos(wingAngle);
						float s = sin(wingAngle);
						transformed.x = side * (${WING_HINGE.x.toFixed(2)} + reach * c - lift * s);
						transformed.y = ${WING_HINGE.y.toFixed(2)} + reach * s + lift * c;
					}`
				);
		};
		object.material = material;
	});

	// 体を傾けるための入れ物: group (位置と向き) → body (傾き) → model
	const body = new THREE.Group();
	body.add(model);
	const group = new THREE.Group();
	group.add(body);

	// 後ろ脚の花粉玉。運んでいる数に合わせて大きくする
	const pollenMaterial = new THREE.MeshStandardMaterial({ color: POLLEN_COLOR, roughness: 0.8, flatShading: true });
	const pollen = [-1, 1].map((side) => {
		const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), pollenMaterial);
		ball.position.set(side * 0.13, 0.12, -0.12);
		ball.scale.setScalar(0);
		ball.visible = false;
		body.add(ball);
		return ball;
	});
	let pollenSize = 0;
	let pollenTarget = 0;
	let phase = 0;

	return {
		group,
		/** 運んでいる花粉の数を見た目に反映する */
		setPollen(count: number) {
			pollenTarget = count === 0 ? 0 : 0.035 + 0.012 * Math.min(count, 8);
		},
		update(flight: Flight3, mode: WingMode, delta: number) {
			group.position.set(flight.x, flight.y, flight.z);
			group.rotation.y = flight.yaw;
			body.rotation.set(flight.pitch, 0, flight.bank);

			const { rate, amplitude } = WING[mode];
			phase += delta * rate;
			// 動きを減らす設定では羽を止める
			wing.angle.value = still ? 0.2 : Math.sin(phase) * amplitude + 0.15;

			pollenSize += (pollenTarget - pollenSize) * Math.min(1, delta * 6);
			for (const ball of pollen) {
				ball.visible = pollenSize > 0.004;
				ball.scale.setScalar(pollenSize);
			}
		}
	};
}

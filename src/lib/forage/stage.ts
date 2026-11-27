// 通常ページを飛ぶ 3D の蜂を描く。形は /world の蜂 (BeeModel.ts) そのもので、表情と 2 節の脚をここで足す。
//
//   ページ全体に透明なキャンバスを 1 枚重ね、遠近のあるカメラで蜂を描く。
//   動き (位置・向き・挨拶) は flight.ts が決め、ここは画面の座標との変換と描画だけを受け持つ。
//
//   カメラ (z = 9) ─────▶  -z の向きを見る
//           手前 (z > 0) ほど大きく、奥 (z < 0) ほど小さく映る

import * as THREE from 'three';
import { createBeeModel } from '$lib/world/BeeModel';
import { speedOf, wave, type Flight, type Vec } from './flight';

export type Stage = ReturnType<typeof createStage>;

export function createStage(canvas: HTMLCanvasElement, { scale, still }: { scale: number; still: boolean }) {
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
	camera.position.set(0, 0, 9);
	scene.add(new THREE.HemisphereLight(0xfff4dc, 0x5b4a33, 2));
	const sun = new THREE.DirectionalLight(0xffffff, 2.8);
	sun.position.set(3, 6, 7);
	scene.add(sun);
	const rim = new THREE.DirectionalLight(0xffe2a0, 1.2);
	rim.position.set(-4, 2, -5);
	scene.add(rim);

	const bee = createBeeModel({ still });
	const holder = new THREE.Group();
	holder.add(bee.group);
	scene.add(holder);
	const face = rig(bee.group);

	function resize() {
		const w = innerWidth;
		const h = innerHeight;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		// 最初の描画より前に画面の点を 3D に直すので、カメラの位置と向きをここで反映しておく
		camera.updateMatrixWorld();
		// 画角は縦で決まるので、そのままだと蜂の見かけの大きさが画面の高さに比例し、横にしたスマホでは半分になる。
		// 高さと「幅の 9 割 (900px まで)」の大きいほうを基準にして、背の低い画面でも同じくらいの大きさで見せる
		const reference = Math.max(h, Math.min(w, 900) * 0.9);
		holder.scale.setScalar(scale * Math.min(2.2, reference / h));
	}
	resize();

	const ray = new THREE.Vector3();
	/** 画面の点 (px) を、奥行き z の平面の上の点に直す */
	function toWorld(x: number, y: number, z: number): Vec {
		ray.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
		const distance = (z - camera.position.z) / ray.z;
		const p = camera.position.clone().addScaledVector(ray, distance);
		return { x: p.x, y: p.y, z: p.z };
	}

	const projected = new THREE.Vector3();
	/** 3D の点を画面の点 (px) に直す */
	function toScreen(p: Vec) {
		projected.set(p.x, p.y, p.z).project(camera);
		return { x: ((projected.x + 1) / 2) * innerWidth, y: ((1 - projected.y) / 2) * innerHeight };
	}

	function render(flight: Flight, dt: number) {
		const speed = speedOf(flight);
		holder.position.set(flight.p.x, flight.p.y, flight.p.z);
		face.set(flight.smile, wave(flight), flight.t);
		bee.update(
			{ x: 0, y: 0, z: 0, vx: flight.v.x, vy: flight.v.y, vz: flight.v.z, yaw: flight.yaw, bank: flight.bank, pitch: flight.pitch, t: flight.t },
			speed > 0.9 ? 'flying' : 'hovering',
			dt
		);
		renderer.render(scene, camera);
	}

	function dispose() {
		renderer.dispose();
		scene.traverse((o) => {
			if (o instanceof THREE.Mesh) {
				o.geometry.dispose();
				for (const material of [o.material].flat()) material.dispose();
			}
		});
	}

	return { resize, toWorld, toScreen, render, dispose };
}

/**
 * 表情と脚の仕掛けを足す。
 *   笑顔   目 (艶のある黒い球) を細め、黒い頭の上でも見えるよう蜜色の弓 (∩) を重ね、頬を赤らめ、口を笑わせる
 *   脚     1 本の固い管を、腿・膝・すねの 2 節に組み直す。飛んでいる間は節ごとに少し遅れて揺れる
 *   手振り 右の前脚の腿を顔の横まで上げて止め、すね (前腕) を膝から左右に振る
 */
function rig(group: THREE.Group) {
	const meshes: THREE.Mesh[] = [];
	group.traverse((o) => o instanceof THREE.Mesh && meshes.push(o));
	const body = group.children[0] as THREE.Object3D;

	const eyes = meshes.filter((m) => m.geometry instanceof THREE.SphereGeometry && Math.abs(m.geometry.parameters.radius - 0.03) < 1e-6);
	const base = eyes.map((e) => ({ y: e.position.y, sy: e.scale.y }));

	const cheekMaterial = new THREE.MeshBasicMaterial({ color: 0xff8fa8, transparent: true, opacity: 0 });
	for (const side of [-1, 1]) {
		const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), cheekMaterial);
		cheek.position.set(side * 0.05, 0.118, 0.19);
		cheek.scale.set(1, 0.6, 0.35);
		body.add(cheek);
	}
	const lidMaterial = new THREE.MeshBasicMaterial({ color: 0xffd45c });
	const lids = eyes.map((e) => {
		const lid = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0042, 6, 16, Math.PI), lidMaterial);
		lid.position.set(e.position.x * 1.05, e.position.y + 0.004, e.position.z + 0.026);
		lid.rotation.y = Math.sign(e.position.x) * 0.45;
		lid.scale.setScalar(0.001);
		body.add(lid);
		return lid;
	});
	const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0032, 6, 16, Math.PI), new THREE.MeshBasicMaterial({ color: 0xf2b705 }));
	mouth.rotation.z = Math.PI;
	mouth.position.set(0, 0.122, 0.212);
	mouth.scale.setScalar(0.001);
	body.add(mouth);

	// 脚の管 (足先が胸の下の y ≈ 0 まで下がるもの) を隠し、同じ付け根・膝・足先で 2 節の脚を組む
	const tubes = meshes.filter((m) => {
		if (!(m.geometry instanceof THREE.TubeGeometry)) return false;
		m.geometry.computeBoundingBox();
		return (m.geometry.boundingBox?.min.y ?? 1) < 0.02;
	});
	const legMaterial = tubes[0]?.material ?? new THREE.MeshStandardMaterial({ color: 0x1a1410 });
	for (const tube of tubes) tube.visible = false;
	const bone = (from: THREE.Vector3, to: THREE.Vector3, radius: number) => {
		const direction = to.clone().sub(from);
		const length = direction.length();
		const joint = new THREE.Group();
		const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 8), legMaterial);
		mesh.position.copy(direction.clone().multiplyScalar(0.5));
		mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
		joint.add(mesh);
		return joint;
	};
	const legs: { upper: THREE.Group; lower: THREE.Group; side: number; front: boolean; phase: number }[] = [];
	const roots = [0.09, 0.06, 0.03];
	const feet = [0.14, 0.05, -0.06];
	roots.forEach((root, i) => {
		for (const side of [-1, 1]) {
			const hip = new THREE.Vector3(side * 0.03, 0.095, root);
			const knee = new THREE.Vector3(side * 0.085, 0.07, (root + feet[i]) / 2);
			const foot = new THREE.Vector3(side * 0.1, 0, feet[i]);
			const upper = bone(hip, knee, 0.0062);
			upper.position.copy(hip);
			const lower = bone(knee, foot, 0.0048);
			lower.position.copy(knee.clone().sub(hip));
			upper.add(lower);
			body.add(upper);
			legs.push({ upper, lower, side, front: i === 0, phase: i * 1.3 + (side > 0 ? 0 : 0.7) });
		}
	});
	const arm = legs.find((l) => l.front && l.side > 0);

	return {
		set(smile: number, waving: number, t: number) {
			eyes.forEach((e, i) => {
				e.scale.y = base[i].sy * (1 - 0.6 * smile);
				e.position.y = base[i].y - 0.006 * smile;
				lids[i].scale.setScalar(Math.max(0.001, smile));
			});
			cheekMaterial.opacity = 0.85 * smile;
			mouth.scale.setScalar(Math.max(0.001, smile));
			for (const l of legs) {
				l.upper.rotation.set(0.12 * Math.sin(t * 3.1 + l.phase), 0, l.side * 0.08 * Math.sin(t * 2.3 + l.phase));
				l.lower.rotation.set(0.22 * Math.sin(t * 3.1 + l.phase - 0.9), 0, 0);
			}
			if (arm && waving > 0) {
				arm.upper.rotation.z = arm.upper.rotation.z * (1 - waving) + waving * 2.2;
				arm.upper.rotation.x = arm.upper.rotation.x * (1 - waving) - waving * 0.35;
				arm.lower.rotation.x *= 1 - waving;
				arm.lower.rotation.z = waving * (-0.5 + 0.75 * Math.sin(t * 9));
			}
		}
	};
}

// /world の蜂の見た目。Three.js の形を組み合わせて作る (bee.glb は使わない)。動き方は flight.ts が決める。
//
//   横から見た形 (前は +z、原点は足の先)
//
//            羽 (前翅・後翅、半透明で翅脈がある)
//          ___/\___
//     触角 ⌒                     ●   頭 (複眼つき)
//   腹 (縞) ===( 胸 )●           ◯   胸 (毛羽立った茶)
//    針 <      | | |  脚 3 対    ===  腹 (黄と黒の縞)
//
// 本物の蜂の羽は 1 秒に 200 回以上動き、目には残像の扇にしか見えない。
// 1 枚を往復させると遅く見えるので、角度を変えた薄い羽を何枚も重ねて残像を作る。

import * as THREE from 'three';
import type { Flight3 } from './flight';

/** 体長 (m)。花の頭より小さく見える大きさ */
const LENGTH = 0.46;
const YELLOW = 0xf2b705;
const BLACK = 0x1c1712;
const FUZZ = 0x5a3d1e;
const POLLEN_COLOR = 0xf5b400;
/** 残像の羽の枚数 (片側・1 枚の羽につき) */
const GHOSTS = 5;

export type WingMode = 'flying' | 'hovering' | 'resting';

const WING = {
	// 振れ幅 (ラジアン)。残像はこの範囲に並ぶ
	flying: { amplitude: 0.95, opacity: 0.16 },
	hovering: { amplitude: 0.8, opacity: 0.14 }
} as const;

export function createBeeModel({ still }: { still: boolean }) {
	const s = LENGTH / 0.46;
	const fuzz = new THREE.MeshPhysicalMaterial({
		color: FUZZ,
		roughness: 0.95,
		sheen: 1,
		sheenColor: new THREE.Color(YELLOW),
		sheenRoughness: 0.55
	});
	const black = new THREE.MeshStandardMaterial({ color: BLACK, roughness: 0.6 });
	const eye = new THREE.MeshPhysicalMaterial({ color: 0x0b0a08, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 });
	const parts: THREE.Mesh[] = [];
	const add = (mesh: THREE.Mesh) => {
		mesh.castShadow = true;
		parts.push(mesh);
		return mesh;
	};

	// 腹: 先細りの回転体に、黄と黒の縞を頂点色で塗る
	const abdomen = add(new THREE.Mesh(createAbdomen(), new THREE.MeshPhysicalMaterial({
		vertexColors: true,
		roughness: 0.8,
		sheen: 0.8,
		sheenColor: new THREE.Color(0xfff1c4),
		sheenRoughness: 0.6
	})));
	abdomen.position.set(0, 0.125 * s, -0.01 * s);
	abdomen.rotation.x = 0.28;
	abdomen.scale.setScalar(s);

	const thorax = add(new THREE.Mesh(new THREE.SphereGeometry(0.075 * s, 20, 14), fuzz));
	thorax.position.set(0, 0.135 * s, 0.06 * s);
	thorax.scale.set(1, 0.95, 1.08);

	const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.056 * s, 18, 12), black));
	head.position.set(0, 0.135 * s, 0.16 * s);
	head.scale.set(1.08, 1, 0.9);
	for (const side of [-1, 1]) {
		const e = add(new THREE.Mesh(new THREE.SphereGeometry(0.03 * s, 14, 10), eye));
		e.position.set(side * 0.04 * s, 0.145 * s, 0.17 * s);
		e.scale.set(0.8, 1.35, 0.9);
		const antenna = add(
			new THREE.Mesh(
				tube([
					[side * 0.018, 0.175, 0.2],
					[side * 0.04, 0.235, 0.235],
					[side * 0.07, 0.25, 0.29]
				], 0.0045 * s, s),
				black
			)
		);
		void antenna;
	}

	const sting = add(new THREE.Mesh(new THREE.ConeGeometry(0.008 * s, 0.03 * s, 6).rotateX(-Math.PI / 2), black));
	sting.position.set(0, 0.07 * s, -0.255 * s);

	// 脚 3 対。胸の下から外へ広げて下ろす
	const legRoots = [0.09, 0.06, 0.03];
	const legFeet = [0.14, 0.05, -0.06];
	legRoots.forEach((root, i) => {
		for (const side of [-1, 1]) {
			add(
				new THREE.Mesh(
					tube([
						[side * 0.03, 0.095, root],
						[side * 0.085, 0.07, (root + legFeet[i]) / 2],
						[side * 0.1, 0.0, legFeet[i]]
					], 0.0055 * s, s),
					black
				)
			);
		}
	});

	// 後ろ脚の花粉玉
	const pollenMaterial = new THREE.MeshStandardMaterial({ color: POLLEN_COLOR, roughness: 0.85, flatShading: true });
	const pollen = [-1, 1].map((side) => {
		const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), pollenMaterial);
		ball.position.set(side * 0.095 * s, 0.03 * s, -0.04 * s);
		ball.scale.setScalar(0);
		ball.visible = false;
		ball.castShadow = true;
		parts.push(ball);
		return ball;
	});

	// 羽: 付け根 (胸の上) を軸に回す。前翅と後翅、それぞれ本体 1 枚と残像 GHOSTS 枚
	const veins = veinTexture();
	const wingMaterial = (opacity: number) =>
		new THREE.MeshPhysicalMaterial({
			color: 0xeaf6ff,
			map: veins,
			transparent: true,
			opacity,
			roughness: 0.2,
			iridescence: 1,
			iridescenceIOR: 1.4,
			side: THREE.DoubleSide,
			depthWrite: false
		});
	const solid = wingMaterial(0.55);
	const ghost = wingMaterial(WING.flying.opacity);
	const fore = createWingGeometry(0.2 * s, 0.065 * s);
	const hind = createWingGeometry(0.13 * s, 0.045 * s);
	type Wing = { pivot: THREE.Group; side: number; main: THREE.Mesh; ghosts: THREE.Mesh[]; hindwing: boolean };
	const wings: Wing[] = [];
	for (const side of [-1, 1]) {
		for (const hindwing of [false, true]) {
			const pivot = new THREE.Group();
			pivot.position.set(side * 0.03 * s, 0.2 * s, (hindwing ? 0.035 : 0.07) * s);
			const geometry = hindwing ? hind : fore;
			const make = (material: THREE.Material) => {
				const mesh = new THREE.Mesh(geometry, material);
				// 形は +x へ伸びているので、左の羽は裏返す
				mesh.scale.x = side;
				const holder = new THREE.Group();
				holder.add(mesh);
				pivot.add(holder);
				return mesh;
			};
			const main = make(solid);
			const ghosts = Array.from({ length: GHOSTS }, () => make(ghost));
			wings.push({ pivot, side, main, ghosts, hindwing });
		}
	}

	// 入れ物: group (位置と向き) → body (傾き) → 各部品
	const body = new THREE.Group();
	body.add(...parts, ...wings.map((w) => w.pivot));
	const group = new THREE.Group();
	group.add(body);

	let pollenSize = 0;
	let pollenTarget = 0;
	let phase = 0;

	/** 羽 1 枚の向き。lift は上下 (+ で上)、sweep は後ろへの倒れ */
	function pose(mesh: THREE.Mesh, side: number, lift: number, sweep: number) {
		const holder = mesh.parent!;
		holder.rotation.set(0, side * sweep, side * lift, 'YZX');
	}

	return {
		group,
		setPollen(count: number) {
			pollenTarget = count === 0 ? 0 : (0.016 + 0.006 * Math.min(count, 8)) * s;
		},
		update(flight: Flight3, mode: WingMode, delta: number) {
			group.position.set(flight.x, flight.y, flight.z);
			group.rotation.y = flight.yaw;
			body.rotation.set(flight.pitch, 0, flight.bank);

			phase += delta * 160;
			for (const wing of wings) {
				const sweep = wing.hindwing ? 0.55 : 0.35;
				if (mode === 'resting' || still) {
					// 止まっているときは羽を背中へたたむ。動きを減らす設定では飛んでいても羽を止めて見せる
					const folded = mode === 'resting';
					pose(wing.main, wing.side, folded ? 0.12 : 0.35, folded ? 1.25 : sweep);
					for (const g of wing.ghosts) g.visible = false;
					continue;
				}
				const { amplitude, opacity } = WING[mode];
				ghost.opacity = opacity;
				// 本体の羽は毎フレームほぼ無作為な角度に置き、残像の扇の中でちらつかせる
				pose(wing.main, wing.side, Math.sin(phase + (wing.hindwing ? 1.3 : 0)) * amplitude * 0.9 + 0.2, sweep);
				wing.ghosts.forEach((g, i) => {
					g.visible = true;
					const spread = (i / (GHOSTS - 1)) * 2 - 1;
					pose(g, wing.side, spread * amplitude + 0.2, sweep);
				});
			}

			pollenSize += (pollenTarget - pollenSize) * Math.min(1, delta * 6);
			for (const ball of pollen) {
				ball.visible = pollenSize > 0.002;
				ball.scale.setScalar(pollenSize);
			}
		}
	};
}

/** 腹の回転体。付け根から後ろ (-z) へ太ってから細くなり、針で終わる。縞は頂点色 */
function createAbdomen() {
	const length = 0.25;
	const profile: THREE.Vector2[] = [];
	const steps = 48;
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		// 付け根は細く、40% あたりで最も太く、先へ細る
		const r = 0.078 * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.15 * t);
		profile.push(new THREE.Vector2(Math.max(r, 0.0005), t * length));
	}
	const geometry = new THREE.LatheGeometry(profile, 28);
	const position = geometry.attributes.position as THREE.BufferAttribute;
	const colors = new Float32Array(position.count * 3);
	const yellow = new THREE.Color(YELLOW);
	const black = new THREE.Color(BLACK);
	for (let i = 0; i < position.count; i++) {
		const t = position.getY(i) / length;
		// 付け根の黄、黒、黄、黒、黄、先は黒
		const band = t > 0.84 ? 1 : Math.floor(t * 6) % 2;
		const c = band === 0 ? yellow : black;
		colors.set([c.r, c.g, c.b], i * 3);
	}
	geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
	// 回転体の軸 (y) を体の後ろ向き (-z) へ倒す
	geometry.rotateX(-Math.PI / 2);
	geometry.computeVertexNormals();
	return geometry;
}

function tube(points: [number, number, number][], radius: number, scale: number) {
	const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x * scale, y * scale, z * scale)));
	return new THREE.TubeGeometry(curve, 12, radius, 5, false);
}

/** 羽の形。付け根 (原点) から +x へ伸び、少し後ろへ反る細長い葉形 */
function createWingGeometry(length: number, width: number) {
	const shape = new THREE.Shape();
	shape.moveTo(0, 0);
	shape.bezierCurveTo(length * 0.3, width * 0.9, length * 0.85, width * 0.75, length, width * 0.1);
	shape.bezierCurveTo(length * 0.95, -width * 0.45, length * 0.4, -width * 0.5, 0, 0);
	const geometry = new THREE.ShapeGeometry(shape, 16);
	// 平面 (xy) を水平 (xz) に寝かせる。y が羽の幅 → -z (後ろ) へ
	geometry.rotateX(Math.PI / 2);
	// 翅脈の模様を形の大きさに合わせて貼る
	const uv = geometry.attributes.uv as THREE.BufferAttribute;
	const position = geometry.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < uv.count; i++) {
		uv.setXY(i, position.getX(i) / length, 0.5 + position.getZ(i) / width);
	}
	return geometry;
}

/** 羽の翅脈。付け根から先へ伸びる数本の細い筋 */
function veinTexture() {
	const size = 128;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const c = canvas.getContext('2d')!;
	c.fillStyle = '#ffffff';
	c.fillRect(0, 0, size, size);
	c.strokeStyle = '#6b5a44';
	c.lineWidth = 1.5;
	for (const [y1, y2] of [[64, 40], [64, 58], [64, 78], [64, 96]]) {
		c.beginPath();
		c.moveTo(0, y1);
		c.quadraticCurveTo(size * 0.5, (y1 + y2) / 2, size, y2);
		c.stroke();
	}
	c.beginPath();
	c.moveTo(size * 0.45, 30);
	c.lineTo(size * 0.55, 100);
	c.moveTo(size * 0.75, 36);
	c.lineTo(size * 0.8, 92);
	c.stroke();
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

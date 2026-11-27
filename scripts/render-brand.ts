// /world の蜂 (src/lib/world/BeeModel.ts) を headless Chromium で撮り、背景透過の WebP を src/lib/brand/ に書き出す。
// サイトの蜂はこの 1 種類だけにする (トップの絵・メニューの絵・トップを飛ぶ蜂・/world)。
// 使い方: CHROMIUM_PATH=/usr/bin/chromium node --experimental-strip-types scripts/render-brand.ts
// CHROMIUM_PATH を省くと Playwright が入れた Chromium を使う (`npx playwright-core install chromium`)。

import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import { chromium } from 'playwright-core';
import { stripTypeScriptTypes } from 'node:module';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'src/lib/brand');

/**
 * layer: all は全体、body は羽を除いた体、wings は羽だけ。body と wings は同じ枠で撮るので重ねるとそろう
 * (トップを飛ぶ蜂は、体の上で羽の絵だけを震わせて羽ばたきを見せる)。
 * wing: flying は羽を残像の扇に広げ、resting は背中へたたむ。
 */
type Shot = { file: string; yaw: number; pitch: number; size: number; layer: 'all' | 'body' | 'wings'; wing: 'flying' | 'hovering' | 'resting' };

const shots: Shot[] = [
	{ file: 'mascot.webp', yaw: -0.85, pitch: 0.45, size: 1024, layer: 'all', wing: 'hovering' },
	{ file: 'bee-side.webp', yaw: -1.35, pitch: 0.15, size: 512, layer: 'all', wing: 'hovering' },
	// 真上から、頭を画面の上へ向ける (yaw で後ろ向きにしてから手前へ倒す)
	{ file: 'bee-top.webp', yaw: Math.PI, pitch: Math.PI / 2, size: 256, layer: 'body', wing: 'flying' },
	{ file: 'bee-top-wings.webp', yaw: Math.PI, pitch: Math.PI / 2, size: 256, layer: 'wings', wing: 'flying' }
];

// BeeModel.ts は型注釈を外せばそのままブラウザで動く ('three' は importmap で解決する)
const beeModule = stripTypeScriptTypes(await readFile(join(root, 'src/lib/world/BeeModel.ts'), 'utf8'));

const page = /* html */ `<!doctype html><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { createBeeModel } from '/bee.js';
window.render = async ({ yaw, pitch, size, layer, wing }) => {
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
	renderer.setSize(size, size);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	const scene = new THREE.Scene();
	scene.add(new THREE.HemisphereLight(0xffffff, 0x887766, 2.2));
	const sun = new THREE.DirectionalLight(0xffffff, 2.5);
	sun.position.set(3, 5, 4);
	scene.add(sun);
	const bee = createBeeModel({ still: false });
	bee.update({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, bank: 0, pitch: 0, t: 0 }, wing, 0.001);
	const object = bee.group;
	const box = new THREE.Box3().setFromObject(object);
	object.position.sub(box.getCenter(new THREE.Vector3()));
	const pivot = new THREE.Group();
	pivot.add(object);
	pivot.rotation.set(pitch, yaw, 0);
	scene.add(pivot);
	// 画面上の外接矩形で寄せる。外接球だと翼や茎の分だけ余白が広くなりすぎる。
	const bounds = new THREE.Box3().setFromObject(pivot);
	const extent = bounds.getSize(new THREE.Vector3());
	pivot.position.sub(bounds.getCenter(new THREE.Vector3()));
	const half = Math.max(extent.x, extent.y) / 2 / 0.9;
	// 枠を全体で決めてから、撮らない部品を隠す。羽は透ける材質だけでできている
	object.traverse((o) => {
		if (!o.isMesh) return;
		const isWing = o.material.transparent;
		if (layer === 'body' && isWing) o.visible = false;
		if (layer === 'wings' && !isWing) o.visible = false;
	});
	const camera = new THREE.OrthographicCamera(-half, half, half, -half, -100, 100);
	renderer.render(scene, camera);
	const blob = await new Promise((r) => renderer.domElement.toBlob(r, 'image/webp', 0.9));
	const bytes = new Uint8Array(await blob.arrayBuffer());
	renderer.dispose();
	return Array.from(bytes);
};
window.ready = true;
</script>`;

const mounts: [string, string][] = [
	['/three/', join(root, 'node_modules/three/')]
];
const types: Record<string, string> = { '.js': 'text/javascript' };

const server = createServer(async (req, res) => {
	const path = (req.url ?? '/').split('?')[0];
	if (path === '/') {
		res.writeHead(200, { 'content-type': 'text/html' }).end(page);
		return;
	}
	if (path === '/bee.js') {
		res.writeHead(200, { 'content-type': 'text/javascript' }).end(beeModule);
		return;
	}
	const mount = mounts.find(([prefix]) => path.startsWith(prefix));
	if (!mount) return void res.writeHead(404).end();
	const file = join(mount[1], path.slice(mount[0].length));
	try {
		const body = await readFile(file);
		res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
	} catch {
		res.writeHead(404).end();
	}
});
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address() as AddressInfo;

const browser = await chromium.launch({
	executablePath: process.env.CHROMIUM_PATH,
	args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
try {
	const tab = await browser.newPage();
	await tab.goto(`http://127.0.0.1:${port}/`);
	await tab.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);
	for (const { file, ...shot } of shots) {
		const bytes = await tab.evaluate((s) => (window as unknown as { render: (s: unknown) => Promise<number[]> }).render(s), shot);
		await writeFile(join(out, file), Uint8Array.from(bytes));
		console.log(`${file} ${bytes.length} bytes`);
	}
} finally {
	await browser.close();
	server.close();
}

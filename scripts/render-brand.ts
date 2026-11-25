// static/bee.glb と static/flower.glb を headless Chromium で撮り、背景透過の WebP を src/lib/brand/ に書き出す。
// 使い方: CHROMIUM_PATH=/usr/bin/chromium node --experimental-strip-types scripts/render-brand.ts
// CHROMIUM_PATH を省くと Playwright が入れた Chromium を使う (`npx playwright-core install chromium`)。

import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import { chromium } from 'playwright-core';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'src/lib/brand');

type Shot = { file: string; model: 'bee' | 'flower'; yaw: number; pitch: number; petal?: string; size: number };

const shots: Shot[] = [
	{ file: 'mascot.webp', model: 'bee', yaw: 2.6, pitch: 0.35, size: 1024 },
	{ file: 'bee-side.webp', model: 'bee', yaw: -1.1, pitch: 0.25, size: 512 },
	{ file: 'bee-top.webp', model: 'bee', yaw: 3.4, pitch: 0.9, size: 512 },
	{ file: 'flower-petal.webp', model: 'flower', yaw: 0.3, pitch: 1.25, petal: '#d95f79', size: 512 },
	{ file: 'flower-honey.webp', model: 'flower', yaw: 1.4, pitch: 1.35, petal: '#f2b705', size: 512 },
	{ file: 'flower-cream.webp', model: 'flower', yaw: 2.5, pitch: 1.2, petal: '#fff3d6', size: 512 }
];

const page = /* html */ `<!doctype html><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
window.render = async ({ model, yaw, pitch, petal, size }) => {
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
	renderer.setSize(size, size);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	const scene = new THREE.Scene();
	scene.add(new THREE.HemisphereLight(0xffffff, 0x887766, 2.2));
	const sun = new THREE.DirectionalLight(0xffffff, 2.5);
	sun.position.set(3, 5, 4);
	scene.add(sun);
	const object = (await new GLTFLoader().loadAsync('/static/' + model + '.glb')).scene;
	if (petal) object.traverse((o) => { if (o.isMesh && o.material.name === 'mat21') { o.material = o.material.clone(); o.material.color.set(petal); } });
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
	['/three/', join(root, 'node_modules/three/')],
	['/static/', join(root, 'static/')]
];
const types: Record<string, string> = { '.js': 'text/javascript', '.glb': 'model/gltf-binary' };

const server = createServer(async (req, res) => {
	const path = (req.url ?? '/').split('?')[0];
	if (path === '/') {
		res.writeHead(200, { 'content-type': 'text/html' }).end(page);
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

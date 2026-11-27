// 画面に入ると下から上がって出てくる (一度だけ)。見出しや作品の行に付ける。
// 動きを減らす設定では何もしない (最初から出ている)。見た目は app.css の .reveal / .in。

export function reveal(node: HTMLElement) {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	node.classList.add('reveal');
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				node.classList.add('in');
				observer.disconnect();
			}
		},
		{ rootMargin: '0px 0px -10% 0px' }
	);
	observer.observe(node);
	return { destroy: () => observer.disconnect() };
}

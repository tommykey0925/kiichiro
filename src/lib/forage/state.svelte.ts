// 蜂と花の状態。ページの花 (Bloom)、ヘッダーの蜂の巣 (Comb)、飛ぶ蜂 (Bee) が共有する。
//
//   咲いた (bloomed)   作品が読む位置まで来た
//   訪れた (visited)   蜂がその花の上にしばらく留まった (動きを減らす設定では、咲いた時点で訪れたことにする)
//
// 訪れた花はタブを閉じるまで sessionStorage に残し、詳細ページから戻っても蜜が減らないようにする。

import { SvelteSet } from 'svelte/reactivity';

const STORAGE_KEY = 'kiichiro:visited';

function load(): string[] {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		const ids: unknown = raw ? JSON.parse(raw) : [];
		return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
	} catch {
		return [];
	}
}

function save(ids: Iterable<string>) {
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
	} catch {
		// 保存できない環境 (プライベートモードなど) では、このページを開いている間だけ覚える
	}
}

class Forage {
	/** ページにある花。id → 花の要素。登録順 = ページの上から順 */
	flowers = $state.raw(new Map<string, HTMLElement>());
	bloomed = new SvelteSet<string>();
	visited = new SvelteSet<string>();
	/** いま読んでいる作品の花 */
	current = $state<string | null>(null);
	/** リンクに触れている作品の花。current より優先して向かう */
	detour = $state<string | null>(null);
	/** ページの要素ではなく 3D の中にある花 (/world)。蜂の巣の部屋数に使う */
	field = $state.raw<string[]>([]);

	#loaded = false;

	/** 訪れた記録を sessionStorage から一度だけ読む */
	restore() {
		if (this.#loaded) return;
		this.#loaded = true;
		for (const visited of load()) this.visited.add(visited);
	}

	/** /world の花を蜂の巣に数える。戻り値で外す */
	plant(ids: string[]) {
		this.restore();
		this.field = ids;
		return () => {
			this.field = [];
		};
	}

	register(id: string, element: HTMLElement) {
		this.restore();
		this.flowers = new Map(this.flowers).set(id, element);
		return () => {
			const next = new Map(this.flowers);
			next.delete(id);
			this.flowers = next;
			if (this.current === id) this.current = null;
			if (this.detour === id) this.detour = null;
		};
	}

	bloom(id: string) {
		this.bloomed.add(id);
		this.current = id;
	}

	visit(id: string) {
		if (this.visited.has(id)) return;
		this.visited.add(id);
		save(this.visited);
	}
}

export const forage = new Forage();

/** 作品のまとまりに付けると、触れている間だけ蜂がその花へ寄り道する */
export function detour(node: HTMLElement, id: string) {
	const enter = () => {
		forage.bloomed.add(id);
		forage.detour = id;
	};
	const leave = () => {
		if (forage.detour === id) forage.detour = null;
	};
	node.addEventListener('pointerenter', enter);
	node.addEventListener('pointerleave', leave);
	node.addEventListener('focusin', enter);
	node.addEventListener('focusout', leave);
	return {
		destroy() {
			leave();
			node.removeEventListener('pointerenter', enter);
			node.removeEventListener('pointerleave', leave);
			node.removeEventListener('focusin', enter);
			node.removeEventListener('focusout', leave);
		}
	};
}

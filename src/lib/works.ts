export type Work = {
	id: string;
	title: string;
	summary: string;
	tech: string[];
	repo: string;
	liveUrl?: string;
	/** 一覧の 1 行より詳しい紹介。持つ作品はトップの先頭に宣言順で並ぶ。 */
	pitch?: string;
	/** 無い作品は 3D に現れず、一覧にのみ載る。 */
	spot?: { index: number; color: string };
};

export const works = (
	[
		{
			"id": "hapax",
			"title": "hapax",
			"summary": "暗号化して送る一時ファイル共有",
			"tech": ["TypeScript", "React", "デジタル庁デザインシステム", "Hono", "Lambda", "DynamoDB", "S3", "EventBridge Scheduler", "Web Crypto API", "Terraform", "GitHub Actions", "Vitest", "Playwright"],
			"repo": "https://github.com/gakushu-lab/hapax",
			"liveUrl": "https://hapax.tom.gakushu.now/",
			"pitch": "ファイルをブラウザで暗号化してから送る一時共有サービス。復号の鍵は URL の # 以降に入れるので、サーバーはファイルの中身も名前も読めない。決めた回数か期限に達すると削除する。",
			"spot": { "index": 0, "color": "#d95f79" }
		},
		{
			"id": "ahab",
			"title": "ahab",
			"summary": "Docker を一望する常駐ダッシュボード",
			"tech": ["Go 1.27 (標準ライブラリのみ)", "Docker Engine API", "Server-Sent Events", "Vanilla JS", "Mermaid", "デジタル庁デザインシステム", "Docker (scratch)", "GHCR", "GitHub Actions"],
			"repo": "https://github.com/tommykey-apps/ahab",
			"pitch": "Docker の状態とコンテナ同士のつながりを、ブラウザで一望する常駐ダッシュボード。コンテナの操作、ログの追従、ネットワーク構成図を備える。Go の標準ライブラリだけで書き、scratch の 1 イメージで動く。",
			"spot": { "index": 1, "color": "#8fd95f" }
		},
		{
			"id": "sanjal",
			"title": "sanjal",
			"summary": "ホストのネットワークを VPN ごと図にする CLI",
			"tech": ["Go 1.27", "hynt", "Mermaid", "GoReleaser", "GitHub Actions"],
			"repo": "https://github.com/tommykey-apps/sanjal",
			"pitch": "ホストが繋がっているネットワークを、仮想プライベートネットワーク (Virtual Private Network, VPN) を含めて Mermaid の図にする CLI。情報の収集は自作の hynt に任せ、sanjal は描くことだけを受け持つ。",
			"spot": { "index": 2, "color": "#5f6ed9" }
		},
		{
			"id": "hynt",
			"title": "hynt",
			"summary": "ホストのネットワークを VPN ごと表にする CLI と Go ライブラリ",
			"tech": ["Go 1.27", "iproute2", "nftables", "GoReleaser", "GitHub Actions"],
			"repo": "https://github.com/tommykey-apps/hynt",
			"spot": { "index": 3, "color": "#5fbcd9" }
		},
		{
			"id": "cinis",
			"title": "cinis",
			"summary": "1 回読んだら消える秘密共有",
			"tech": ["PHP 8.4", "Laravel 13", "Bref v3", "Lambda (arm64)", "DynamoDB", "SvelteKit 2", "Svelte 5", "Tailwind CSS v4", "デジタル庁デザインシステム", "WebCrypto API", "Terraform", "GitHub Actions", "Playwright", "CloudFront"],
			"repo": "https://github.com/tommykey-apps/cinis",
			"liveUrl": "https://cinis.tommykeyapp.com/",
			"spot": { "index": 4, "color": "#d9855f" }
		},
		{
			"id": "ui-components",
			"title": "ui-components",
			"summary": "Svelte 5 コンポーネント集",
			"tech": ["Svelte 5", "svelte-package", "Vite 8", "Storybook 10", "Changesets", "date-fns", "flox", "GitHub Actions"],
			"repo": "https://github.com/tommykey-apps/ui-components",
			"spot": { "index": 5, "color": "#a15fd9" }
		}
	]
) satisfies Work[];

export const featured = works.filter((w) => w.spot);

export const showcase = works.filter((w) => w.pitch);

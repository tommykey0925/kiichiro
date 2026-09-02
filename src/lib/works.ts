export type Localized = { ja: string; en?: string };

export type Work = {
	id: string;
	title: Localized;
	summary: Localized;
	tech: string[];
	repo: string;
	liveUrl?: string;
	category: 'product' | 'learning' | 'infra';
	/** 無い作品は 3D に現れず、一覧にのみ載る。 */
	spot?: { index: number };
};

export const works = (
	[
		{
			"id": "chat",
			"title": { "ja": "chatto" },
			"summary": {
				"ja": "リアルタイムチャットアプリ。フレンド・DM・リアクション・メンション・既読・タイピングインジケーター・全文検索・画像送信・Web Push・メール通知まで実装した、機能量で殴る一本。"
			},
			"tech": ["Java 21", "Spring Boot 3.4", "SvelteKit 2", "Svelte 5", "Tailwind CSS v4", "Cognito", "PostgreSQL (RDS)", "Redis (ElastiCache)", "AWS"],
			"repo": "https://github.com/tommykey-apps/chat",
			"category": "product",
			"spot": { "index": 3 }
		},
		{
			"id": "url-shortener",
			"title": { "ja": "URL Shortener" },
			"summary": {
				"ja": "URL を短縮してクリック数を計測するサービス。登録時に遷移先の安全性を自動チェックし、LLM が中身を要約する。"
			},
			"tech": ["Go", "AWS SDK v2", "Lambda", "DynamoDB", "SvelteKit 2", "Svelte 5", "Tailwind CSS v4", "Groq API (Llama 3.3 70B)"],
			"repo": "https://github.com/tommykey-apps/url-shortener",
			"liveUrl": "https://url.tommykeyapp.com/",
			"category": "product",
			"spot": { "index": 1 }
		},
		{
			"id": "receipto",
			"title": { "ja": "Receipto" },
			"summary": {
				"ja": "レシートを撮るだけで支出を自動記録する家計簿。Claude Vision で金額と店名を構造化 JSON にし、カテゴリ自動分類・予算アラート・週次ダイジェストまで繋げた。"
			},
			"tech": ["Python 3.12", "FastAPI", "Lambda", "DynamoDB", "Bedrock (Claude Vision)", "Cognito", "SvelteKit 2", "Svelte 5", "Tailwind CSS v4"],
			"repo": "https://github.com/tommykey-apps/receipto",
			"liveUrl": "https://expense.tommykeyapp.com/",
			"category": "product",
			"spot": { "index": 2 }
		},
		{
			"id": "burnnote",
			"title": { "ja": "burnnote" },
			"summary": {
				"ja": "1 回読んだら消える秘密共有サービス。ブラウザ側で AES-256-GCM 暗号化し、鍵は URL fragment に置くのでサーバーは暗号文しか知らないゼロ知識設計。"
			},
			"tech": ["PHP 8.4", "Laravel 13", "Bref v3", "Lambda (arm64)", "DynamoDB", "SvelteKit 2", "Svelte 5", "WebCrypto API"],
			"repo": "https://github.com/tommykey-apps/burnnote",
			"liveUrl": "https://burnnote.tommykeyapp.com/",
			"category": "product",
			"spot": { "index": 0 }
		},
		{
			"id": "gakushu",
			"title": { "ja": "Gakushu" },
			"summary": {
				"ja": "GPT の仕組みを一般向けに可視化するインタラクティブ学習サイト。Embedding → Attention → Transformer を段階的に見せ、Claude が個別チューターとして解説する。"
			},
			"tech": ["TypeScript", "H3/Nitro", "Lambda", "Nuxt 4", "Nuxt UI", "Tailwind CSS v4", "DynamoDB", "Bedrock (Claude)", "Cognito"],
			"repo": "https://github.com/tommykey-apps/gakushu",
			"category": "product",
			"spot": { "index": 5 }
		},
		{
			"id": "resource-planner",
			"title": { "ja": "Resource Planner" },
			"summary": {
				"ja": "要員計画アプリ。自作コンポーネントライブラリ ui-components を実消費する側でもあり、ライブラリの API 設計を実運用で検証している。"
			},
			"tech": ["SvelteKit 2", "Svelte 5", "Tailwind CSS v4", "Auth.js (Magic Link)", "DynamoDB (Single Table)", "Lambda (ARM64 container)", "API Gateway", "CloudFront"],
			"repo": "https://github.com/tommykey-apps/resource-planner",
			"category": "product",
			"spot": { "index": 6 }
		},
		{
			"id": "ui-components",
			"title": { "ja": "ui-components" },
			"summary": {
				"ja": "個人用 Svelte 5 コンポーネントライブラリ。GitHub Packages で配布し、Storybook でカタログ化、Changesets でバージョン管理している。"
			},
			"tech": ["Svelte 5", "svelte-package", "Vite 8", "Storybook 10", "Changesets", "date-fns", "flox"],
			"repo": "https://github.com/tommykey-apps/ui-components",
			"category": "product",
			"spot": { "index": 7 }
		},
		{
			"id": "pasu",
			"title": { "ja": "pasu" },
			"summary": {
				"ja": "パスキー (WebAuthn) のサンプルアプリ。登録から認証までの流れを SimpleWebAuthn で実装し、Cloudflare Workers + D1 上で動かしている。"
			},
			"tech": ["SvelteKit 2", "Svelte 5", "SimpleWebAuthn", "Cloudflare Workers", "D1", "Playwright", "Vitest"],
			"repo": "https://github.com/tommykey-apps/pasu",
			"liveUrl": "https://pasu.tommykey0925.workers.dev",
			"category": "product",
			"spot": { "index": 4 }
		},
		{
			"id": "vigil",
			"title": { "ja": "vigil" },
			"summary": {
				"ja": "個人開発者向けのドメイン + AWS 運用監視ダッシュボード。所有ドメインの WHOIS / SSL / DNS 期限を 1 日 1 回 polling し、期限が近づいたら SES で通知する。開発中。"
			},
			"tech": ["SvelteKit 2", "Svelte 5", "Lambda Web Adapter", "Node.js 24 (arm64)", "DynamoDB", "GitHub OAuth", "EventBridge Scheduler", "SES", "Terraform"],
			"repo": "https://github.com/tommykey-apps/vigil",
			"category": "product",
			"spot": { "index": 9 }
		},
		{
			"id": "dropfast",
			"title": { "ja": "dropfast" },
			"summary": {
				"ja": "一時ファイル共有サービス。期限と回数制限つきの URL を発行し、規定回数のダウンロードが終わると S3 から実体を消す。burnnote と同じゼロ知識方式。開発中。"
			},
			"tech": ["Rust", "axum", "Lambda (arm64)", "cargo-lambda", "S3 (presigned URL)", "DynamoDB (TTL)", "SvelteKit 2", "WebCrypto API", "Terraform"],
			"repo": "https://github.com/tommykey-apps/dropfast",
			"category": "product",
			"spot": { "index": 10 }
		},
		{
			"id": "axiowiz",
			"title": { "ja": "Check Wizards" },
			"summary": {
				"ja": "Vue 3 と Angular 17 で同じ題材 (Harry Potter API の一覧・詳細) を実装し、設計思想とコードの書き方の差を並べて比較できるようにした学習プロジェクト。"
			},
			"tech": ["Vue 3", "Angular 17", "TypeScript", "GitHub Pages"],
			"repo": "https://github.com/tommykey-apps/axiowiz",
			"liveUrl": "https://tommykey0925.github.io/checkWizards/",
			"category": "product",
			"spot": { "index": 8 }
		},
	
		{
			"id": "with",
			"title": { "ja": "with" },
			"summary": {
				"ja": "Claude Agent SDK の学習用に書いた、ターミナルで動くミニコーディングエージェント。対話ループ・ツール実行・許可確認という Claude Code のコア体験を約 130 行で再現している。"
			},
			"tech": ["TypeScript", "Claude Agent SDK", "Node.js"],
			"repo": "https://github.com/tommykey-apps/with",
			"category": "learning"
		},
		{
			"id": "myownllm",
			"title": { "ja": "myownllm" },
			"summary": {
				"ja": "最小構成の言語モデルを 1 から実装して LLM の基本を追う教材。学習データの用意から推論までを 6 段階に分けて説明している。"
			},
			"tech": ["Python", "NumPy"],
			"repo": "https://github.com/tommykey0925/myownllm",
			"category": "learning"
		},
		{
			"id": "tinyllm",
			"title": { "ja": "tinyllm" },
			"summary": {
				"ja": "本当に最小の言語モデル。文字ベクトル + 位置ベクトル → 次の文字を予測 → 答え合わせ → 重み調整、の一周だけを剥き出しで書いたもの。"
			},
			"tech": ["Python"],
			"repo": "https://github.com/tommykey0925/tinyllm",
			"category": "learning"
		},
		{
			"id": "rag",
			"title": { "ja": "rag" },
			"summary": {
				"ja": "RAG を体験するためのサンプル。PostgreSQL の pgvector でベクトル DB を作り、ドキュメントをセマンティック検索できるようにしている。"
			},
			"tech": ["Python", "PostgreSQL", "pgvector"],
			"repo": "https://github.com/kiichiro-tominaga/rag",
			"category": "learning"
		},
		{
			"id": "lism-playground",
			"title": { "ja": "Lism Playground" },
			"summary": {
				"ja": "Lism CSS のサンプル集を Astro で構築したショーケース。レイアウトプリミティブ、プロパティクラス、Liquid Glass のデモを並べている。"
			},
			"tech": ["Astro", "Lism CSS", "GitHub Pages"],
			"repo": "https://github.com/tommykey0925/lism-playground",
			"liveUrl": "https://tommykey0925.github.io/lism-playground/",
			"category": "learning"
		},
		{
			"id": "cutting-edge-webui",
			"title": { "ja": "Cutting-Edge WebUI" },
			"summary": {
				"ja": "2026 年 2 月時点で新しめの HTML / CSS 機能を一通り触って解説したページ。"
			},
			"tech": ["HTML", "CSS", "GitHub Pages"],
			"repo": "https://github.com/tommykey0925/cutting-edge-webui",
			"liveUrl": "https://tommykey0925.github.io/cutting-edge-webui/",
			"category": "learning"
		},
		{
			"id": "elixir",
			"title": { "ja": "Elixir & Phoenix 学習アプリ" },
			"summary": {
				"ja": "Elixir と Phoenix でプログラミング学習アプリを作りながら言語とフレームワークを学ぶ。HTMX で非同期 UI を組んでいる。"
			},
			"tech": ["Elixir", "Phoenix", "HTMX"],
			"repo": "https://github.com/tommykey0925/elixir",
			"category": "learning"
		},
		{
			"id": "ddd",
			"title": { "ja": "ddd-reservation" },
			"summary": {
				"ja": "予約ドメインを題材にドメイン駆動設計を Java で試したもの。"
			},
			"tech": ["Java"],
			"repo": "https://github.com/tommykey0925/ddd",
			"category": "learning"
		},
		{
			"id": "rustnative",
			"title": { "ja": "rustnative" },
			"summary": {
				"ja": "Rust でネイティブアプリを組む素振り。"
			},
			"tech": ["Rust"],
			"repo": "https://github.com/tommykey0925/rustnative",
			"category": "learning"
		},
		{
			"id": "tauri",
			"title": { "ja": "tauri" },
			"summary": {
				"ja": "Tauri でデスクトップアプリを作る素振り。"
			},
			"tech": ["Tauri", "Rust"],
			"repo": "https://github.com/tommykey0925/tauri",
			"category": "learning"
		},
		{
			"id": "electron",
			"title": { "ja": "electron" },
			"summary": {
				"ja": "Electron でデスクトップアプリを作る素振り。Tauri との比較用。"
			},
			"tech": ["Electron", "JavaScript"],
			"repo": "https://github.com/tommykey0925/electron",
			"category": "learning"
		},
		{
			"id": "ios-sample",
			"title": { "ja": "ios-sample" },
			"summary": {
				"ja": "Expo でモバイルアプリを作る素振り。Dev Container + Expo Go で動かしている。"
			},
			"tech": ["Expo", "React Native", "TypeScript"],
			"repo": "https://github.com/tommykey0925/ios-sample",
			"category": "learning"
		},
		{
			"id": "java-fundamental",
			"title": { "ja": "java-fundamental" },
			"summary": {
				"ja": "Java の基礎をビルドツールなしで確認するための最小サンプル。"
			},
			"tech": ["Java"],
			"repo": "https://github.com/tommykey0925/java-fundamental",
			"category": "learning"
		},
	
		{
			"id": "infra-shared",
			"title": { "ja": "infra-shared" },
			"summary": {
				"ja": "アプリ群が共有するインフラ。VPC / EKS / ALB Controller / DNS を Terraform で管理している。"
			},
			"tech": ["Terraform", "AWS", "EKS"],
			"repo": "https://github.com/tommykey-apps/infra-shared",
			"category": "infra"
		},
		{
			"id": "infra-global",
			"title": { "ja": "infra-global" },
			"summary": {
				"ja": "リージョンを跨いで共通で要るもの (証明書・DNS ゾーン等) を切り出した Terraform 構成。"
			},
			"tech": ["Terraform", "AWS"],
			"repo": "https://github.com/tommykey-apps/infra-global",
			"category": "infra"
		},
		{
			"id": "vmcontainerarchi",
			"title": { "ja": "vmcontainerarchi" },
			"summary": {
				"ja": "仮想マシンとコンテナのアーキテクチャの違いを整理したメモ。"
			},
			"tech": ["Linux", "Container"],
			"repo": "https://github.com/kiichiro-tominaga/vmcontainerarchi",
			"category": "infra"
		}
	]
) satisfies Work[];

export const featured = works.filter((w) => w.spot);

export const byCategory = (category: Work['category']) => works.filter((w) => w.category === category);

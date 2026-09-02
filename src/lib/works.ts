export type Localized = { ja: string; en?: string };

export type Work = {
	id: string;
	title: Localized;
	summary: Localized;
	tech: string[];
	repo: string;
	liveUrl?: string;
	category: 'product' | 'learning' | 'infra';
	/** 素材のライセンス表記。持つのはこのサイト自身のエントリだけ。 */
	credits?: string[];
	/** 無い作品は 3D に現れず、一覧にのみ載る。 */
	spot?: { index: number; color: string };
};

export const works = (
	[
		{
			"id": "kiichiro",
			"title": { "ja": "kiichi.ro" },
			"summary": { "ja": "歩いて見るポートフォリオ" },
			"tech": [
				"SvelteKit 2",
				"Svelte 5",
				"Three.js",
				"adapter-static",
				"Cloudflare Workers",
				"GitHub Actions"
			],
			"repo": "https://github.com/tommykey0925/kiichiro",
			"liveUrl": "https://kiichi.ro/",
			"category": "product",
			"credits": [
				"Bee by jeremy [CC-BY] via Poly Pizza",
				"Flower by Zoe XR [CC-BY] via Poly Pizza"
			],
			"spot": { "index": 0, "color": "#d95f5f" }
		},
		{
			"id": "chat",
			"title": { "ja": "chatto" },
			"summary": { "ja": "リアルタイムチャット" },
			"tech": ["Java 21", "Spring Boot 3.4", "SvelteKit 2", "Svelte 5", "Tailwind CSS v4", "Cognito", "PostgreSQL (RDS)", "Redis (ElastiCache)", "AWS", "Terraform", "GitHub Actions", "EKS", "CloudFront"],
			"repo": "https://github.com/tommykey-apps/chat",
			"category": "product",
			"spot": { "index": 4, "color": "#5fbcd9" }
		},
		{
			"id": "url-shortener",
			"title": { "ja": "URL Shortener" },
			"summary": { "ja": "URL 短縮とクリック計測" },
			"tech": ["Go", "AWS SDK v2", "Lambda", "DynamoDB", "SvelteKit 2", "Svelte 5", "Tailwind CSS v4", "Groq API (Llama 3.3 70B)", "Terraform", "GitHub Actions", "CloudFront"],
			"repo": "https://github.com/tommykey-apps/url-shortener",
			"liveUrl": "https://url.tommykeyapp.com/",
			"category": "product",
			"spot": { "index": 2, "color": "#d9b25f" }
		},
		{
			"id": "receipto",
			"title": { "ja": "Receipto" },
			"summary": { "ja": "レシートを撮るだけの家計簿" },
			"tech": ["Python 3.12", "FastAPI", "Lambda", "DynamoDB", "Bedrock (Claude Vision)", "Cognito", "SvelteKit 2", "Svelte 5", "Tailwind CSS v4", "Terraform", "GitHub Actions", "CloudFront"],
			"repo": "https://github.com/tommykey-apps/receipto",
			"liveUrl": "https://expense.tommykeyapp.com/",
			"category": "product",
			"spot": { "index": 3, "color": "#5fd9cf" }
		},
		{
			"id": "burnnote",
			"title": { "ja": "burnnote" },
			"summary": { "ja": "1 回読んだら消えるメモ" },
			"tech": ["PHP 8.4", "Laravel 13", "Bref v3", "Lambda (arm64)", "DynamoDB", "SvelteKit 2", "Svelte 5", "WebCrypto API", "Terraform", "GitHub Actions", "CloudFront"],
			"repo": "https://github.com/tommykey-apps/burnnote",
			"liveUrl": "https://burnnote.tommykeyapp.com/",
			"category": "product",
			"spot": { "index": 1, "color": "#d9855f" }
		},
		{
			"id": "gakushu",
			"title": { "ja": "Gakushu" },
			"summary": { "ja": "GPT の仕組みを可視化する学習サイト" },
			"tech": ["TypeScript", "H3/Nitro", "Lambda", "Nuxt 4", "Nuxt UI", "Tailwind CSS v4", "DynamoDB", "Bedrock (Claude)", "Cognito", "Terraform", "GitHub Actions", "CloudFront"],
			"repo": "https://github.com/tommykey-apps/gakushu",
			"category": "product",
			"spot": { "index": 6, "color": "#5f6ed9" }
		},
		{
			"id": "resource-planner",
			"title": { "ja": "Resource Planner" },
			"summary": { "ja": "要員計画アプリ" },
			"tech": ["SvelteKit 2", "Svelte 5", "Tailwind CSS v4", "Auth.js (Magic Link)", "DynamoDB (Single Table)", "Lambda (ARM64 container)", "API Gateway", "CloudFront", "Terraform", "GitHub Actions"],
			"repo": "https://github.com/tommykey-apps/resource-planner",
			"category": "product",
			"spot": { "index": 7, "color": "#7a5fd9" }
		},
		{
			"id": "ui-components",
			"title": { "ja": "ui-components" },
			"summary": { "ja": "Svelte 5 コンポーネント集" },
			"tech": ["Svelte 5", "svelte-package", "Vite 8", "Storybook 10", "Changesets", "date-fns", "flox", "GitHub Actions"],
			"repo": "https://github.com/tommykey-apps/ui-components",
			"category": "product",
			"spot": { "index": 8, "color": "#a15fd9" }
		},
		{
			"id": "pasu",
			"title": { "ja": "pasu" },
			"summary": { "ja": "パスキー認証のサンプル" },
			"tech": ["SvelteKit 2", "Svelte 5", "SimpleWebAuthn", "Cloudflare Workers", "D1", "Playwright", "Vitest", "GitHub Actions"],
			"repo": "https://github.com/tommykey-apps/pasu",
			"liveUrl": "https://pasu.tommykey0925.workers.dev",
			"category": "product",
			"spot": { "index": 5, "color": "#5f95d9" }
		},
		{
			"id": "vigil",
			"title": { "ja": "vigil" },
			"summary": { "ja": "ドメインと AWS の期限監視" },
			"tech": ["SvelteKit 2", "Svelte 5", "Lambda Web Adapter", "Node.js 24 (arm64)", "DynamoDB", "GitHub OAuth", "EventBridge Scheduler", "SES", "Terraform"],
			"repo": "https://github.com/tommykey-apps/vigil",
			"category": "product",
			"spot": { "index": 10, "color": "#d95fa5" }
		},
		{
			"id": "dropfast",
			"title": { "ja": "dropfast" },
			"summary": { "ja": "期限付きの一時ファイル共有" },
			"tech": ["Rust", "axum", "Lambda (arm64)", "cargo-lambda", "S3 (presigned URL)", "DynamoDB (TTL)", "SvelteKit 2", "WebCrypto API", "Terraform"],
			"repo": "https://github.com/tommykey-apps/dropfast",
			"category": "product",
			"spot": { "index": 11, "color": "#d95f79" }
		},
		{
			"id": "axiowiz",
			"title": { "ja": "Check Wizards" },
			"summary": { "ja": "Vue 3 と Angular 17 の比較" },
			"tech": ["Vue 3", "Angular 17", "TypeScript", "GitHub Pages", "GitHub Actions"],
			"repo": "https://github.com/tommykey-apps/axiowiz",
			"liveUrl": "https://tommykey0925.github.io/checkWizards/",
			"category": "product",
			"spot": { "index": 9, "color": "#d95fd0" }
		},
	
		{
			"id": "with",
			"title": { "ja": "with" },
			"summary": { "ja": "130 行のコーディングエージェント" },
			"tech": ["TypeScript", "Claude Agent SDK", "Node.js"],
			"repo": "https://github.com/tommykey-apps/with",
			"category": "learning"
		},
		{
			"id": "myownllm",
			"title": { "ja": "myownllm" },
			"summary": { "ja": "言語モデルを 1 から実装" },
			"tech": ["Python", "NumPy"],
			"repo": "https://github.com/tommykey0925/myownllm",
			"category": "learning"
		},
		{
			"id": "tinyllm",
			"title": { "ja": "tinyllm" },
			"summary": { "ja": "本当に最小の言語モデル" },
			"tech": ["Python"],
			"repo": "https://github.com/tommykey0925/tinyllm",
			"category": "learning"
		},
		{
			"id": "rag",
			"title": { "ja": "rag" },
			"summary": { "ja": "pgvector で RAG を体験" },
			"tech": ["Python", "PostgreSQL", "pgvector"],
			"repo": "https://github.com/kiichiro-tominaga/rag",
			"category": "learning"
		},
		{
			"id": "lism-playground",
			"title": { "ja": "Lism Playground" },
			"summary": { "ja": "Lism CSS のサンプル集" },
			"tech": ["Astro", "Lism CSS", "GitHub Pages", "GitHub Actions"],
			"repo": "https://github.com/tommykey0925/lism-playground",
			"liveUrl": "https://tommykey0925.github.io/lism-playground/",
			"category": "learning"
		},
		{
			"id": "cutting-edge-webui",
			"title": { "ja": "Cutting-Edge WebUI" },
			"summary": { "ja": "新しめの HTML / CSS 集" },
			"tech": ["HTML", "CSS", "GitHub Pages"],
			"repo": "https://github.com/tommykey0925/cutting-edge-webui",
			"liveUrl": "https://tommykey0925.github.io/cutting-edge-webui/",
			"category": "learning"
		},
		{
			"id": "elixir",
			"title": { "ja": "Elixir & Phoenix 学習アプリ" },
			"summary": { "ja": "Elixir + Phoenix の学習アプリ" },
			"tech": ["Elixir", "Phoenix", "HTMX"],
			"repo": "https://github.com/tommykey0925/elixir",
			"category": "learning"
		},
		{
			"id": "ddd",
			"title": { "ja": "ddd-reservation" },
			"summary": { "ja": "予約ドメインで DDD" },
			"tech": ["Java"],
			"repo": "https://github.com/tommykey0925/ddd",
			"category": "learning"
		},
		{
			"id": "rustnative",
			"title": { "ja": "rustnative" },
			"summary": { "ja": "Rust でネイティブアプリ" },
			"tech": ["Rust"],
			"repo": "https://github.com/tommykey0925/rustnative",
			"category": "learning"
		},
		{
			"id": "tauri",
			"title": { "ja": "tauri" },
			"summary": { "ja": "Tauri でデスクトップアプリ" },
			"tech": ["Tauri", "Rust"],
			"repo": "https://github.com/tommykey0925/tauri",
			"category": "learning"
		},
		{
			"id": "electron",
			"title": { "ja": "electron" },
			"summary": { "ja": "Electron でデスクトップアプリ" },
			"tech": ["Electron", "JavaScript"],
			"repo": "https://github.com/tommykey0925/electron",
			"category": "learning"
		},
		{
			"id": "ios-sample",
			"title": { "ja": "ios-sample" },
			"summary": { "ja": "Expo でモバイルアプリ" },
			"tech": ["Expo", "React Native", "TypeScript", "GitHub Actions"],
			"repo": "https://github.com/tommykey0925/ios-sample",
			"category": "learning"
		},
		{
			"id": "java-fundamental",
			"title": { "ja": "java-fundamental" },
			"summary": { "ja": "Java の基礎" },
			"tech": ["Java"],
			"repo": "https://github.com/tommykey0925/java-fundamental",
			"category": "learning"
		},
	
		{
			"id": "infra-shared",
			"title": { "ja": "infra-shared" },
			"summary": { "ja": "共有インフラ (VPC / EKS / DNS)" },
			"tech": ["Terraform", "AWS", "EKS", "GitHub Actions", "flox"],
			"repo": "https://github.com/tommykey-apps/infra-shared",
			"category": "infra"
		},
		{
			"id": "infra-global",
			"title": { "ja": "infra-global" },
			"summary": { "ja": "リージョンを跨ぐ共通インフラ" },
			"tech": ["Terraform", "AWS", "GitHub Actions"],
			"repo": "https://github.com/tommykey-apps/infra-global",
			"category": "infra"
		},
		{
			"id": "vmcontainerarchi",
			"title": { "ja": "vmcontainerarchi" },
			"summary": { "ja": "VM とコンテナの違い" },
			"tech": ["Linux", "Container"],
			"repo": "https://github.com/kiichiro-tominaga/vmcontainerarchi",
			"category": "infra"
		}
	]
) satisfies Work[];

export const featured = works.filter((w) => w.spot);

export const byCategory = (category: Work['category']) => works.filter((w) => w.category === category);

export type Work = {
  id: string;
  title: string;
  summary: string;
  tech: string[];
  repo: string;
  liveUrl?: string;
  /** 素材のライセンス表記。持つのはこのサイト自身のエントリだけ。 */
  credits?: string[];
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
      "summary": "hapaxは文中に1度だけ出る単語を表す言葉ですけどネーミングしくりました。ただのファイル共有サービス。よくあるやつ。",
      "tech": ["TypeScript", "React", "デジタル庁デザインシステム", "Hono", "Lambda", "DynamoDB", "S3", "EventBridge Scheduler", "Web Crypto API", "Terraform", "GitHub Actions", "Vitest", "Playwright"],
      "repo": "https://github.com/gakushu-lab/hapax",
      "liveUrl": "https://hapax.tom.gakushu.now/",
      "pitch": "いや〜これ最近やった中で1番割と頑張りましたね〜。ドメイン見てもらったらモロですけど学習用なんすね。ただ、自分で社内研修専用でAWSのOrganizationUnitとSCP作って、その例としてリリースしてるアプリなんで、そういう意味で頑張りました。",
      "spot": { "index": 0, "color": "#d95f79" }
    },
    {
      "id": "ahab",
      "title": "ahab",
      "summary": "Ahab船長ですね。銛で白鯨を狩ったっていう。dockerの状態をdockerで見せようという変な取り組み。ぶっちゃけdocker desktop下位互換",
      "tech": ["Go 1.27 (標準ライブラリのみ)", "Docker Engine API", "Server-Sent Events", "Vanilla JS", "Mermaid", "デジタル庁デザインシステム", "Docker (scratch)", "GHCR", "GitHub Actions"],
      "repo": "https://github.com/tommykey-apps/ahab",
      "pitch": "Goにハマってた時のですね。goといえばdockerという安直なあれです。frontはめんどかったんでAIにvanilaJSで書かせたますですハイ",
      "spot": { "index": 1, "color": "#8fd95f" }
    },
    {
      "id": "sanjal",
      "title": "sanjal",
      "summary": "ヒンディー語で網、ネットワークを意味します。ネットワークの勉強してる時にイメージしやすいように作りました。",
      "tech": ["Go 1.27", "hynt", "Mermaid", "GoReleaser", "GitHub Actions"],
      "repo": "https://github.com/tommykey-apps/sanjal",
      "pitch": "ホストが繋がっているネットワークを、仮想プライベートネットワーク (Virtual Private Network, VPN) を含めて Mermaid の図にする CLI。情報の収集は自作の hynt に任せ、sanjal は描くことだけを受け持つ。",
      "spot": { "index": 2, "color": "#5f6ed9" }
    },
    {
      "id": "hynt",
      "title": "hynt",
      "summary": "ウェールズ語で道だった様な。普通にヒントって読みます。sanjalの中で動いてますが単独でも使えます。ホストのネットワークを丸っと出力します",
      "tech": ["Go 1.27", "iproute2", "nftables", "GoReleaser", "GitHub Actions"],
      "repo": "https://github.com/tommykey-apps/hynt",
      "spot": { "index": 3, "color": "#5fbcd9" }
    },
    {
      "id": "cinis",
      "title": "cinis",
      "summary": "サイニス、何かの言葉で燃やすですね。hapaxの文字だけ版ですわ。仕事でパスワード交換する時用すね",
      "tech": ["PHP 8.4", "Laravel 13", "Bref v3", "Lambda (arm64)", "DynamoDB", "SvelteKit 2", "Svelte 5", "Tailwind CSS v4", "デジタル庁デザインシステム", "WebCrypto API", "Terraform", "GitHub Actions", "Playwright", "CloudFront"],
      "repo": "https://github.com/tommykey-apps/cinis",
      "liveUrl": "https://cinis.tommykeyapp.com/",
      "spot": { "index": 4, "color": "#d9855f" }
    },
    {
      "id": "ui-components",
      "title": "ui-components",
      "summary": "Svelte 5 コンポーネント集。集と言いつつ1個だけ。ガントみたいなやつです。shadcn/ui-svelteになかったってだけ",
      "tech": ["Svelte 5", "svelte-package", "Vite 8", "Storybook 10", "Changesets", "date-fns", "flox", "GitHub Actions"],
      "repo": "https://github.com/tommykey-apps/ui-components",
      "spot": { "index": 5, "color": "#a15fd9" }
    },
    {
      "id": "kiichiro",
      "title": "kiichi.ro",
      "summary": "今あなたが見てるこのサイトのソースですよ笑",
      "tech": ["SvelteKit 2", "Svelte 5", "Three.js", "adapter-static", "Cloudflare Workers", "GitHub Actions"],
      "repo": "https://github.com/tommykey0925/kiichiro",
      "liveUrl": "https://kiichi.ro/",
      "credits": [
        "Bee by jeremy [CC-BY] via Poly Pizza",
        "Flower by Zoe XR [CC-BY] via Poly Pizza",
        "Honeybee by Twitter (Twemoji) [CC-BY 4.0]"
      ],
      "spot": { "index": 6, "color": "#d95f5f" }
    }
  ]
) satisfies Work[];

export const featured = works.filter((w) => w.spot);

export const showcase = works.filter((w) => w.pitch);

import type { Localized } from '$lib/i18n/localize';

export type Work = {
  id: string;
  title: string;
  summary: Localized;
  tech: (string | Localized)[];
  repo: string;
  liveUrl?: string;
  credits?: string[];
  pitch?: Localized;
  spot?: { index: number; color: string };
};

export const works = (
  [
    {
      "id": "hapax",
      "title": "hapax",
      "summary": {
        "ja": "hapaxは文中に1度だけ出る単語を表す言葉ですけどネーミングしくりました。ただのファイル共有サービス。よくあるやつ。",
        "en": "A hapax is a word that shows up only once in a text, so yeah, I botched the name. It's just a file-sharing service. The usual kind."
      },
      "tech": ["TypeScript", "React", { "ja": "デジタル庁デザインシステム", "en": "Digital Agency Design System" }, "Hono", "Lambda", "DynamoDB", "S3", "EventBridge Scheduler", "Web Crypto API", "Terraform", "GitHub Actions", "Vitest", "Playwright"],
      "repo": "https://github.com/gakushu-lab/hapax",
      "liveUrl": "https://hapax.tom.gakushu.now/",
      "pitch": {
        "ja": "ただのファイル共有サービスですけどいや〜これ最近やった中で1番割と頑張りましたね〜。ドメイン見てもらったらモロですけど学習用なんすね。ただ、自分で社内研修専用でAWSのOrganizationUnitとSCP作って、その例としてリリースしてるアプリなんで、そういう意味で頑張りました。",
        "en": "It's just a file-sharing service, but honestly it's the one I worked hardest on lately. The domain gives it away: it's for learning. I set up an AWS organizational unit and service control policies (SCPs) just for in-house training, and this app is released as the example for them. That's the part I worked hard on."
      },
      "spot": { "index": 0, "color": "#d95f79" }
    },
    {
      "id": "ahab",
      "title": "ahab",
      "summary": {
        "ja": "Ahab船長ですね。銛で白鯨を狩ったっていう。dockerの状態をdockerで見せようという変な取り組み。ぶっちゃけdocker desktop下位互換",
        "en": "Captain Ahab, the guy who hunted the white whale with a harpoon. A weird attempt to show Docker's state with Docker. Honestly, a worse Docker Desktop."
      },
      "tech": [{ "ja": "Go 1.27 (標準ライブラリのみ)", "en": "Go 1.27 (standard library only)" }, "Docker Engine API", "Server-Sent Events", "Vanilla JS", "Mermaid", { "ja": "デジタル庁デザインシステム", "en": "Digital Agency Design System" }, "Docker (scratch)", "GHCR", "GitHub Actions"],
      "repo": "https://github.com/tommykey-apps/ahab",
      "pitch": {
        "ja": "dockerの状態をdockerで見せようという変な取り組み。ぶっちゃけdocker desktop下位互換どす。Goにハマってた時のですね。goといえばdockerという安直なあれです。frontはめんどかったんでAIにvanilaJSで書かせてますですハイ",
        "en": "A weird attempt to show Docker's state with Docker. Honestly, a worse Docker Desktop. From back when I was hooked on Go. Go means Docker, right? That kind of lazy logic. The frontend was a chore, so I had AI write it in vanilla JS. Yep."
      },
      "spot": { "index": 1, "color": "#8fd95f" }
    },
    {
      "id": "sanjal",
      "title": "sanjal",
      "summary": {
        "ja": "ヒンディー語で網、ネットワークを意味します。ネットワークの勉強してる時にイメージしやすいように作りました。",
        "en": "Hindi for net, as in network. I built it to picture networks more easily while I was studying them."
      },
      "tech": ["Go 1.27", "hynt", "Mermaid", "GoReleaser", "GitHub Actions"],
      "repo": "https://github.com/tommykey-apps/sanjal",
      "pitch": {
        "ja": "ネットワークの勉強してる時にイメージしやすいように作りました。ネットワークの可視化かなできるの。Go書くのに飽きてAIに作らせたからか、全然思い入れがない。",
        "en": "I built it to picture networks more easily while I was studying them. It visualizes networks, I guess. I got bored of writing Go and had AI build it, which may be why I have zero attachment to it."
      },
      "spot": { "index": 2, "color": "#5f6ed9" }
    },
    {
      "id": "hynt",
      "title": "hynt",
      "summary": {
        "ja": "ウェールズ語で道だった様な。普通にヒントって読みます。sanjalの中で動いてますが単独でも使えます。ホストのネットワークを丸っと出力します",
        "en": "Welsh for road, I think. Just read it as \"hint\". It runs inside sanjal but works on its own too. It dumps your host's whole network."
      },
      "tech": ["Go 1.27", "iproute2", "nftables", "GoReleaser", "GitHub Actions"],
      "repo": "https://github.com/tommykey-apps/hynt",
      "spot": { "index": 3, "color": "#5fbcd9" }
    },
    {
      "id": "cinis",
      "title": "cinis",
      "summary": {
        "ja": "サイニス、何かの言葉で燃やすですね。hapaxの文字だけ版ですわ。仕事でパスワード交換する時用すね",
        "en": "Cinis. Means burning in some language. It's the text-only version of hapax. For swapping passwords at work."
      },
      "tech": ["PHP 8.4", "Laravel 13", "Bref v3", "Lambda (arm64)", "DynamoDB", "SvelteKit 2", "Svelte 5", "Tailwind CSS v4", { "ja": "デジタル庁デザインシステム", "en": "Digital Agency Design System" }, "WebCrypto API", "Terraform", "GitHub Actions", "Playwright", "CloudFront"],
      "repo": "https://github.com/tommykey-apps/cinis",
      "liveUrl": "https://cinis.tommykeyapp.com/",
      "spot": { "index": 4, "color": "#d9855f" }
    },
    {
      "id": "ui-components",
      "title": "ui-components",
      "summary": {
        "ja": "Svelte 5 コンポーネント集。集と言いつつ1個だけ。ガントみたいなやつです。shadcn/ui-svelteになかったってだけ",
        "en": "A Svelte 5 component collection. Calls itself a collection, has exactly one. A Gantt-ish thing. I only made it because shadcn/ui-svelte didn't have one."
      },
      "tech": ["Svelte 5", "svelte-package", "Vite 8", "Storybook 10", "Changesets", "date-fns", "flox", "GitHub Actions"],
      "repo": "https://github.com/tommykey-apps/ui-components",
      "spot": { "index": 5, "color": "#a15fd9" }
    },
    {
      "id": "kiichiro",
      "title": "kiichi.ro",
      "summary": {
        "ja": "今あなたが見てるこのサイトのソースですよ笑",
        "en": "The source of the site you're looking at right now, lol."
      },
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

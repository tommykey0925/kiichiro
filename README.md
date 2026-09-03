# kiichiro

`kiichi.ro` — ポートフォリオサイト。

作品データを 1 本 (`src/lib/works.ts`) に置き、通常のページと 3D モードの両方がそこだけを読む。
片方だけ更新されて食い違う状態を作らないための構造。

## モード

| | |
|---|---|
| `/` | 作品一覧 + プロフィール。ファーストビューは常にこちらを即描画する |
| `/works/[id]` | 作品ごとの静的ページ (共有・OGP 用) |
| `/world` | 3D モード。蜂を操作して花に近づくと、その作品のパネルが開く |

## 技術

| | |
|---|---|
| フレームワーク | SvelteKit 2 + Svelte 5 (runes) |
| ビルド | `@sveltejs/adapter-static` — 全ページ prerender |
| 3D | Three.js (素で使う。Threlte / 物理エンジンは使わない) |
| 3D アセット | CC-BY (Poly Pizza / Twemoji)。表記は `works.ts` の credits に持ち、`/works/kiichiro` に出す |
| ホスティング | Cloudflare Workers (アセットのみ)。デプロイは Workers Builds |

## 開発

```bash
pnpm install
pnpm dev
pnpm check    # 型チェック
pnpm test     # 3D の配置を検証 (展示台の間隔・移動方向・キラキラの分布)
pnpm build    # build/ に静的サイトを出力
```

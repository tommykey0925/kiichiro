# kiichiro

`kiichi.ro` — ポートフォリオサイト。

作品データを 1 本 (`src/lib/works.ts`) に置き、通常のページと 3D モードの両方がそこだけを読む。
片方だけ更新されて食い違う状態を作らないための構造。

## モード

| | |
|---|---|
| `/` | 作品一覧 + プロフィール。ファーストビューは常にこちらを即描画する |
| `/works/[id]` | 作品ごとの静的ページ (共有・OGP 用) |
| `/world` | 3D モード (未実装) |

## 技術

| | |
|---|---|
| フレームワーク | SvelteKit 2 + Svelte 5 (runes) |
| ビルド | `@sveltejs/adapter-static` — 全ページ prerender |
| 3D | Three.js (素で使う。Threlte / 物理エンジンは使わない) |
| 3D アセット | CC0 のみ (Quaternius / Kenney / Poly Haven) |
| ホスティング | Cloudflare Pages |

## 開発

```bash
pnpm install
pnpm dev
pnpm check    # 型チェック
pnpm build    # build/ に静的サイトを出力
```

# kiichiro

`kiichi.ro` — ポートフォリオサイト。

作品データを 1 本 (`src/lib/works.ts`) に置き、通常のページと 3D モードの両方がそこだけを読む。
片方だけ更新されて食い違う状態を作らないための構造。

## モード

| | |
|---|---|
| `/` | 作品一覧 + プロフィール。常にここから入る。Three.js は `/world` に入ってから読む |
| `/works/[id]` | 作品ごとの静的ページ (共有・OGP 用) |
| `/world` | 3D モード。蜂を操作して花に近づくと、その作品のパネルが開く |

## 技術

| | |
|---|---|
| フレームワーク | SvelteKit 2 + Svelte 5 (runes) |
| ビルド | `@sveltejs/adapter-static` — 全ページ prerender |
| 見た目 | 色と書体は `src/lib/theme/brand.css` の独自トークン (方針は `CLAUDE.md`)。欧文の見出しは Jost (`@fontsource/jost`)、和文は `@fontsource/noto-sans-jp` で自前配信 |
| 多言語 | Paraglide JS。日本語は接頭辞なし、英語は `/en/`。画面の文言は `messages/{ja,en}.json`、作品の紹介文は `works.ts` に両方を持つ |
| 表示モード | ライト・ダーク・OS に合わせる。ダークはデザイントークンの変数を `src/lib/theme/dark.css` で上書きする |
| 3D | Three.js (素で使う。Threlte / 物理エンジンは使わない) |
| 3D アセット | CC-BY (Poly Pizza / Twemoji)。表記は `works.ts` の credits に持ち、`/works/kiichiro` に出す。トップの静止画 (`src/lib/brand/*.webp`) は同じモデルを `scripts/render-brand.ts` で撮ったもの |
| ホスティング | Cloudflare Workers (アセットのみ)。デプロイは Workers Builds |

## 開発

```bash
pnpm install
pnpm dev
pnpm check    # 型チェック
pnpm test     # 3D の配置を検証 (展示台の間隔・移動方向・キラキラの分布)
pnpm build    # build/ に静的サイトを出力
pnpm test:visual  # build/ を headless Chromium で開き、横スクロール・ヘッダーの透け・メニュー・動きを減らす設定を検査
```

## 複製したファイル

| ファイル | 複製元 | 作り直し方 |
|---|---|---|
| `src/lib/dads/link.css` | digital-go-jp/design-system-example-components-html `src/components/link/link.css` @ af8b665 (MIT)。色だけ `brand.css` に差し替えた | 上流に追随しない |
| `src/lib/fonts/noto-sans-jp.css` | `@fontsource/noto-sans-jp` の `400.css` と `700.css`。`font-display` を `swap` から `optional` に変えたもの | 下のコマンド |
| `src/lib/theme/dark.css` | tommykey-apps/ahab `internal/web/static/theme.css` のダーク用トークン | 手で合わせる |

```bash
cat node_modules/@fontsource/noto-sans-jp/{400,700}.css \
  | sed -e '/^\/\*/d' \
        -e 's/font-display: swap/font-display: optional/' \
        -e 's#url(\./files/#url(@fontsource/noto-sans-jp/files/#g' \
  > src/lib/fonts/noto-sans-jp.css
```

# kiichiro の見た目の決まり

このサイトは作品を見せるためのポートフォリオなので、`~/.claude/DESIGN.md` (デジタル庁デザインシステムのトークンだけを使う規約) を適用しない。目標は mq1.dev くらい迫力のある見た目。

## 守るもの

| 項目 | 決まり |
|---|---|
| 到達性 | WCAG 2.1 AA。文字のコントラスト比 4.5:1 以上、フォーカス表示を消さない、キーボードだけで操作できる |
| 動き | `prefers-reduced-motion: reduce` のときはスクロール連動の演出と時間差の登場を止め、最終状態を一度に出す |
| 色・書体 | `src/lib/theme/brand.css` のトークンを使う。新しい色を足すときはここに足し、コントラスト比を計算してコメントに残す |
| 本文 | 和文は Noto Sans JP、14px 未満にしない、行間 1.5 以上 |

## 検査

画面を変えたら `pnpm build && pnpm test:visual` を通す。PC とスマホ、ライトとダークで、横スクロール・ヘッダーの透け・ページのエラー・メニューの開閉・動きを減らす設定を確かめる。CI でも同じものを動かす。

## モチーフ

蜂と花で統一する。`/world` の 3D (蜂が花畑を飛び、花が作品) と通常ページで同じモチーフを使う。

## 絵とロゴ

ページは `src/lib/brand/` の部品だけを参照する。当面は 3D の蜂 (`static/bee.glb`) と花 (`static/flower.glb`) から書き出した静止画と、書体で組んだ文字ロゴを使う。描いた絵や依頼した絵に替えるときは、`src/lib/brand/` の画像を替えるだけで済む形を保つ。

| 部品 | 中身 |
|---|---|
| `Logo.svelte` | 文字ロゴ。「.」を六角形で見せる |
| `Mascot.svelte` | 蜂の静止画。`pose` で向きを選ぶ (`hero` / `side` / `top`) |
| `Flower.svelte` | 花の静止画。`color` で色を選ぶ (`petal` / `honey` / `cream`) |
| `BeeIcon.svelte` | `/world` への入口に使う Twemoji の蜂 |

静止画を撮り直すときは `CHROMIUM_PATH=/usr/bin/chromium node --experimental-strip-types scripts/render-brand.ts` を実行する。角度と色は同じファイルの `shots` で決める。

## デジタル庁デザインシステムの残り

`@digital-go-jp/design-tokens` は `/world` の画面部品と `src/lib/theme/dark.css` がまだ参照している。新しく書く部品では使わない。

// 全画面メニューの開閉。ヘッダーのボタン (SiteHeader)、メニュー本体 (SiteMenu)、飛ぶ蜂 (Bee)、ページの本文 (+layout) が共有する。
//
//   open    開いている (または開きかけ)。本文は操作できなくなり (inert)、蜂はメニューの上へ飛んでくる
//   moving  開け閉めの動きの途中。途中で押されても受け付けない

export const menu = $state({ open: false, moving: false });

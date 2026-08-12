# CSS表記揺れ 統一対応表

## 1. 調査結果サマリ

ページごとのCSSファイル・HTML内 `<style>` に、同じ処理に対して異なるクラス名・値が使われています。主な原因は以下の3パターンです。

| 原因 | 具体例 |
|------|--------|
| コピペによる各CSSへの重複定義 | 「Keep: boxed text sections」ブロックが song / home / character_card / dream_park / rhyth_game / 楽曲一覧.css の6ファイルに存在 |
| HTML内 `<style>` での `!important` 上書き | body背景・navbar・fade-in-up が home / song / unit / dream_park / character_card / rhythm_game.html の各 `<style>` に重複定義 |
| 共通CSSとの二重定義 | common_menu.css の「Unified page header」が `.navbar` 系を `!important` で再定義 |

特に対応が必要な表記揺れ:

- `.fade-in-up` の値が4パターン（`translateY(20px)` / `translateY(30px)` / `translateX(-64px)` / 無効化）
- 戻るボタン `.back-btn` と `.back-button` の2種類
- 目次 `.unit-toc` / `.dream-park-toc` / `.page-toc` の3種類
- 画像ボックス4種類・本文画像クラス6種類

## 2. 対応表（新統一命名）

### 2-1. 共通部品

| # | 処理内容 | 現在の表記 | 統一後の表記 | 現在の定義・使用箇所 |
|---|---------|-----------|-------------|----------------------|
| 1 | 戻るボタン | `.back-btn` / `.back-button` | `.back-btn` | `.back-button` : about.html:42, update_history.html:41（navbar内）。CSS定義は各ページCSS（song/character_card/item_search/unit/dream_park/rhyth_game/楽曲一覧）にコピペ |
| 2 | フェードイン表示 | `.fade-in-up` + `.is-show`（値が4種） | `.fade-in-up` + `.is-show`（値統一） | home:translateY(30px) / song・character_card:translateY(20px) / unit:translateY(30px) / dream_park・rhythm:translateX(-64px) / item_search.css:translateY(20px)。rhyth_game.css:353 では無効化（残骸） |
| 3 | 目次 | `.unit-toc` / `.dream-park-toc` / `.page-toc` | `.page-toc` | unit.html:98, dream_park.html:102, rhythm_game.html:103。内包 `.toc-title` / `.toc-links` は共通だが各CSSで個別定義 |
| 4 | ページトップボタン | `.page-top-button` | `.page-top-button`（全ページに導入） | unit.html:83, dream_park.html:88, rhythm_game.html:84 のみ実装。CSSは unit.css:103, dream_park.css:572, rhyth_game.css:539 で同一コピペ |
| 5 | 記事ボックス | `.operation-block` / `.content-card` / `.comment-box` | `.operation-block`（共通CSS化） | 「Keep: boxed text sections」ブロックが6ファイルにコピペ（song.css:434, home.css:620, character_card.css:666, dream_park.css:408, rhyth_game.css:366, 楽曲一覧.css:322） |
| 6 | 見出し下線 | `h1::after` / `.main-title::after` / `.section-title::after` | 共通CSS化 | 上記6ファイルに同一コピペ |

### 2-2. レイアウト

| # | 処理内容 | 現在の表記 | 統一後の表記 | 現在の定義・使用箇所 |
|---|---------|-----------|-------------|----------------------|
| 7 | 本文の大見出し | `.unit-main-title` / `.dream-park-main-title` / inline `h1 style="font-size:50px"` | `.page-title` | unit.html:95（unit.css:128）, dream_park.html:98（dream_park.css:438）, rhythm_game.html:94（inline） |
| 8 | 章見出し | `.title-explanation`（font-size 52/60pxの揺れ） | `.title-explanation`（値統一） | unit.css:188（52px・#0094d8）, dream_park.css:169・rhyth_game.css:189（60px・グラデーション）。HTMLは unit / dream_park / rhythm_game.html で使用 |
| 9 | 画像を囲むボックス | `.dream-park-image-box` / `.unit-image-box` / `.rhythm-play-image-box` / `.tap-effect-image-box` | `.image-box` | dream_park.html:113〜, rhythm_game.html:140〜, unit.html:109。`.rhythm-play-image-box` はCSSのみでHTML未使用（rhyth_game.css:606） |
| 10 | 本文画像 | `.dream-park-image` / `.unit-image` / `.rhythm-play-image` / `.tap-effect-image` / `.notes_img` / `.under-img` | `.content-image` | dream_park.html / rhythm_game.html / unit.html。`.notes_img` は page-render.js:14 でも生成。`.under-img` / `.rhythm-play-image` はCSSのみ |
| 11 | 記事内テキスト余白 | `.double-space`（意味が2種）/ `.double-space2` | `.double-space`（`.double-space2` は廃止） | unit.css:183（margin 72px/32px）, dream_park.css:100・rhyth_game.css:100（margin-bottom 3em）, `.double-space2` は dream_park.css:104・rhyth_game.css:104（6em）。page-render.js:13,21 でも生成 |
| 12 | body背景 | 複数行個別定義 / ショートハンド / `!important` 上書き | 共通CSS化 | 各CSSの body 定義＋home/song/unit/dream_park/character_card/rhythm_game.html の `<style>`。about.css:5・update_history.css:5 はショートハンド形式 |

### 2-3. ナビゲーション・共通化

| # | 処理内容 | 現在の表記 | 統一後の表記 | 現在の定義・使用箇所 |
|---|---------|-----------|-------------|----------------------|
| 13 | navbar / logo / site-title / nav-links | 各ページCSSで定義＋common_menu.css で再定義 | common_menu.css へ集約 | 全ページCSSに navbar系の重複定義（song/unit/dream_park/rhyth_game/character_card/item_search/home） |
| 14 | スクロールバー非表示 | `html,body { scrollbar-width:none }` + `::-webkit-scrollbar` コピペ | 共通CSS化 | song/unit/dream_park/item_search/character_card/home/楽曲一覧.css、common_menu.css |
| 15 | 検索ボックス | `.search-container` + `#search-input` / `#item-search-input` | `.search-container` + `.search-input`（class化） | song.html:109（#search-input）, item_search.html:77（#item-search-input）, character_card.html:106（#search-input）。CSSは各CSSで同一コピペ |
| 16 | ページネーション | `.pagination` / `.page-btn` / `#page-info` / `#total-count` / `#hit-count` | 共通CSS化 | song.html / character_card.html / item_search.html。`.page-btn` の形が song:radius30px・item_search:radius999px で不統一 |

### 2-4. 色・バッジ・部品

| # | 処理内容 | 現在の表記 | 統一後の表記 | 現在の定義・使用箇所 |
|---|---------|-----------|-------------|----------------------|
| 17 | テキスト色クラス | `.color-blue` / `.color-green` / `.color-red` / `.color-yellow` | 4色とも統一（共通CSS化） | dream_park.css:143〜（yellow 定義なし）, rhyth_game.css:143〜（yellow あり）。rhythm_game.html:156〜 で使用 |
| 18 | 強調テキスト | `.emphasis-section` | `.emphasis-section`（誤字修正） | dream_park.css:137・rhyth_game.css:137。dream_park.css:331 に誤字 `.emphasis-sectio`（未使用の残骸） |
| 19 | 難易度の色 | `.badge-easy/normal/hard/expert` / `.border-easy` 等 / `easy-video` 等 | CSS変数化（`--color-easy` / `--color-normal` / `--color-hard` / `--color-expert`） | song.css:265〜,314（badge/border）, 楽曲一覧.css:238〜（video）。4色は共通（#81c784 / #ffcc80 / #ff8a80 / #b388ff） |
| 20 | モーダル | `.modal-overlay`+`.modal-content` / `.item-modal`+`.item-modal-panel` / `.news-image-viewer` | `.modal-overlay` + `.modal-panel`（共通化） | character_card.html:145 / item_search.html:94 / home.html:270（JS生成） |
| 21 | ローディング画面 | `.holodori-loading-screen` 等 / プレビュー用 `.loading-screen` 等 | `.holodori-loading-*` に統一 | loading.css（本番）/ loading_preview.html（プレビュー用に別名コピー） |
| 22 | ローディングHTMLマークアップ | 1行／複数行で改行が不統一 | フォーマット統一 | 全ページ（例：about.html:35 は1行、home.html:68〜 は複数行） |

## 3. 誤字・不正CSS（優先修正）

| # | 箇所 | 内容 |
|---|------|------|
| A | dream_park.css:331 | `.emphasis-sectio` → `n` 欠落（未使用の残骸） |
| B | dream_park.css:273 / rhyth_game.css:293 | `margin-bottom: 10px !;` → 不正な `!`（`!important` の記述ミス） |
| C | home.css:523 | `.next-btn { right: 00px; }` → `00px` は不正な値 |
| D | rhyth_game.css:353〜363 | `.fade-in-up` を無効化した残骸（HTML側の `<style>` と二重定義） |

## 4. 参考: 動的生成コード

- `content/page-render.js` が `class="notes_img"`, `.double-space`, `.double-space2`, `.title-explanation`, `.operation-block`, `.fade-in-up`, `.color-blue/green/red` を生成（page-render.js:14,21,23,27）。クラス名統一時はここも更新が必要
- `content/rhythm-game-content.js` が `.emphasis-section`, `.color-*`, `.double-space2` を使用（rhythm-game-content.js:9〜）

## 5. 補足: 反映時に注意するポイント

1. **クラス名変更はHTML・CSS・JS の3箇所セットで実施**する（例：`.dream-park-image-box` → `.image-box` は dream_park.html・rhythm_game.html・dream_park.css・rhyth_game.css を同時に修正）
2. **`.fade-in-up` の値**は現状ページごとに演出意図が異なる可能性があるため、統一値を1つ決めてから適用する
3. **common_menu.css / loading.css / site_notice.css** は全ページ共通なので、共通化の受け皿として利用する
4. 難易度色のCSS変数化（#19）は song.css と 楽曲一覧.css の両方に反映する

# Color Rules

このドキュメントは、ことことサイトの配色ルール定義です。

## 基本方針

- 各ページに1つの主軸カラーを持たせる
- 可読性を優先し、本文文字色は濃色、背景は淡色を基本にする
- ボタンは「塗り(primary)」「アウトライン(secondary)」の2種類を標準化する

## 共通カラー（全ページ）

- `--color-white`: `#FFFFFF`
- `--color-text`: `#1F2937`（本文）
- `--color-text-muted`: `#4B5563`（補助テキスト）
- `--color-border`: `#E5E7EB`（境界線）
- `--color-bg-base`: `#F8FAFC`（全体背景の基本）

## 1) TOP（緑色中心）

主軸カラー: `#94CA43FF`（=`#94CA43`）

- `--top-key`: `#94CA43`
- `--top-key-dark`: `#7EAE36`（ホバー/強調）
- `--top-bg`: `#F4FBE9`（ページ背景）
- `--top-surface`: `#FFFFFF`（カード背景）
- `--top-border`: `#D8EBB8`
- `--top-button-primary-bg`: `#94CA43`
- `--top-button-primary-text`: `#FFFFFF`
- `--top-button-primary-hover`: `#7EAE36`
- `--top-button-secondary-text`: `#6A9630`
- `--top-button-secondary-border`: `#B7D98A`

## 2) 授業支援（青色中心）

主軸カラー: `#4E80EEFF`（=`#4E80EE`）

- `--teachers-key`: `#4E80EE`
- `--teachers-key-dark`: `#3E69C4`
- `--teachers-bg`: `#EEF4FF`
- `--teachers-surface`: `#FFFFFF`
- `--teachers-border`: `#CFE0FF`
- `--teachers-button-primary-bg`: `#4E80EE`
- `--teachers-button-primary-text`: `#FFFFFF`
- `--teachers-button-primary-hover`: `#3E69C4`
- `--teachers-button-secondary-text`: `#3459A8`
- `--teachers-button-secondary-border`: `#AFC8FA`

## 3) 自己探求（オレンジ中心）

主軸カラー: `#E67D2E`

- `--self-key`: `#E67D2E`
- `--self-key-dark`: `#C8661E`
- `--self-bg`: `#FFF3E8`
- `--self-surface`: `#FFFFFF`
- `--self-border`: `#F5CFB0`
- `--self-button-primary-bg`: `#E67D2E`
- `--self-button-primary-text`: `#FFFFFF`
- `--self-button-primary-hover`: `#C8661E`
- `--self-button-secondary-text`: `#A75415`
- `--self-button-secondary-border`: `#F0B98B`

## 使用ルール

- TOPページは `--top-*` を優先
- 授業支援ページは `--teachers-*` を優先
- 自己探求ページは `--self-*` を優先
- 共通コンポーネント（本文、罫線、ベース背景）は「共通カラー」を優先


# ことこと Webサイト

静的サイト構成（GitHub Pages公開想定）です。

## ページ構成

- `index.html`: トップページ
- `products-teachers.html`: 商品1「ことこと - 授業支援」
- `products-self-discovery.html`: 商品2「ことこと - 感情解析」
- `blog.html`: ブログ一覧（microCMS連携）
- `blog-post.html`: ブログ詳細（microCMS連携）
- `contact.html`: お問い合わせ（外部フォーム埋め込み）

## ローカル確認

`index.html` をブラウザで開いて確認できます。

## microCMS設定

1. `assets/js/config.js` を開く
2. `apiKey` に `X-MICROCMS-API-KEY` を設定
3. `contentModel` を microCMS のAPI名に合わせる（現在: `kotokoto-blogs`）

```js
window.KOTOKOTO_CONFIG = {
  microcms: {
    baseUrl: 'https://137.microcms.io/api/v1',
    contentModel: 'kotokoto-blogs',
    apiKey: 'YOUR_API_KEY'
  }
};
```

## お問い合わせフォーム埋め込み

`contact.html` の `embed-placeholder` 部分を外部フォームの `iframe` または `script` に置き換えてください。

## GitHub Pages公開

1. GitHubリポジトリへpush
2. リポジトリ設定で `Pages` を有効化
3. ブランチ（例: `main`）と公開ディレクトリ（`/root`）を選択

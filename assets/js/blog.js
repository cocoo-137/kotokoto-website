(() => {
  const statusNode = document.getElementById('blog-status');
  const listNode = document.getElementById('blog-list');
  const postNode = document.getElementById('blog-post');
  if (!statusNode || (!listNode && !postNode)) return;

  const cfg = window.KOTOKOTO_CONFIG?.microcms;
  if (!cfg?.baseUrl || !cfg?.contentModel) {
    statusNode.textContent = 'microCMS設定が不足しています。assets/js/config.js を確認してください。';
    return;
  }

  if (!cfg.apiKey) {
    statusNode.textContent = 'APIキー未設定です。assets/js/config.js の apiKey に X-MICROCMS-API-KEY を設定してください。';
    return;
  }

  const buildUrl = (id = '') => {
    const base = cfg.baseUrl.replace(/\/$/, '');
    const model = cfg.contentModel.replace(/^\//, '');
    const suffix = id ? `/${encodeURIComponent(id)}` : '';
    return `${base}/${model}${suffix}`;
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate()
    ).padStart(2, '0')}`;
  };

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const categoryClassName = (category) => {
    switch (category) {
      case 'お知らせ':
        return 'is-news';
      case '授業改善':
        return 'is-class-improvement';
      case '自己探求':
        return 'is-self-discovery';
      default:
        return 'is-default';
    }
  };

  const fetchJson = async (url) => {
    const res = await fetch(url, {
      headers: {
        'X-MICROCMS-API-KEY': cfg.apiKey
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  };

  const renderList = async () => {
    try {
      const limit = Number(listNode.dataset.limit || '12');
      const json = await fetchJson(`${buildUrl()}?limit=${limit}&orders=-publishedAt`);
      const items = Array.isArray(json.contents) ? json.contents : [];

      if (items.length === 0) {
        statusNode.textContent = '記事がありません。';
        return;
      }

      statusNode.textContent = '';
      statusNode.style.display = 'none';
      listNode.innerHTML = items
        .map((item) => {
          const title = escapeHtml(item.title || 'タイトル未設定');
          const desc = escapeHtml(item.description || item.excerpt || '');
          const category = String(item.category?.name || item.category || '').trim();
          const date = formatDate(item.publishedAt || item.createdAt);
          const categoryTag = category
            ? `<span class="category-badge ${categoryClassName(category)}">${escapeHtml(category)}</span>`
            : '';
          return `
            <a class="blog-card blog-card-link" href="blog-post.html?id=${item.id}" aria-label="${title}">
              <p class="blog-meta">${date}${categoryTag ? ` ${categoryTag}` : ''}</p>
              <h3>${title}</h3>
              <p>${desc}</p>
            </a>
          `;
        })
        .join('');
    } catch (e) {
      statusNode.textContent = `記事の取得に失敗しました (${e.message})。contentModel または APIキーを確認してください。`;
    }
  };

  const renderDetail = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
      statusNode.textContent = '記事IDが指定されていません。';
      return;
    }

    try {
      const item = await fetchJson(buildUrl(id));
      const title = item.title || 'タイトル未設定';
      const date = formatDate(item.publishedAt || item.createdAt);
      const body = item.content || item.body || '<p>本文がありません。</p>';
      const category = String(item.category?.name || item.category || '').trim();
      const categoryTag = category
        ? `<span class="category-badge ${categoryClassName(category)}">${escapeHtml(category)}</span>`
        : '';

      document.title = `${escapeHtml(title)} | ことことブログ`;
      postNode.innerHTML = `
        <p class="blog-meta">${date}${categoryTag ? ` ${categoryTag}` : ''}</p>
        <h1>${escapeHtml(title)}</h1>
        <div class="blog-post-content">${body}</div>
      `;
      statusNode.textContent = '';
      statusNode.style.display = 'none';
    } catch (e) {
      statusNode.textContent = `記事の取得に失敗しました (${e.message})。`;
    }
  };

  if (listNode) {
    renderList();
  }
  if (postNode) {
    renderDetail();
  }
})();

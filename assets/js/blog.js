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
      case '感情解析':
        return 'is-self-discovery';
      default:
        return 'is-default';
    }
  };

  const categoryLabel = (category) => (category === '自己探求' ? '感情解析' : category);
  const pageTypeMap = {
    top: ['全体'],
    teachers: ['授業改善'],
    self: ['感情解析', 'ワークショップ']
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

  const canonicalType = (value) => {
    if (value === '授業支援') return '授業改善';
    if (value === '自己探求') return '感情解析';
    return value;
  };

  const normalizeTypeList = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((entry) => canonicalType(String(entry?.name || entry?.value || entry || '').trim()))
        .filter(Boolean);
    }
    const single = canonicalType(String(value?.name || value?.value || value || '').trim());
    return single ? [single] : [];
  };

  const getItemTypes = (item) => {
    const fromCategory = normalizeTypeList(item?.category?.type);
    if (fromCategory.length > 0) return fromCategory;
    return normalizeTypeList(item?.type);
  };

  const currentPage = () => {
    if (document.body.classList.contains('page-top')) return 'top';
    if (document.body.classList.contains('page-teachers')) return 'teachers';
    if (document.body.classList.contains('page-self')) return 'self';
    return '';
  };

  const isVisibleOnCurrentPage = (item) => {
    const page = currentPage();
    const allowedTypes = pageTypeMap[page];
    if (!allowedTypes) return true;
    const types = getItemTypes(item);
    if (types.length === 0) return page === 'top';
    return types.some((type) => allowedTypes.includes(type));
  };

  const renderList = async () => {
    try {
      const limit = Number(listNode.dataset.limit || '12');
      const listStyle = String(listNode.dataset.blogStyle || '').trim();
      const useSimpleStyle = listStyle === 'simple';
      const fetchLimit = Math.max(limit * 6, 30);
      const json = await fetchJson(`${buildUrl()}?limit=${fetchLimit}&orders=-publishedAt`);
      const allItems = Array.isArray(json.contents) ? json.contents : [];
      const items = allItems.filter(isVisibleOnCurrentPage).slice(0, limit);

      if (items.length === 0) {
        statusNode.textContent = '記事がありません。';
        return;
      }

      statusNode.textContent = '';
      statusNode.style.display = 'none';
      listNode.classList.toggle('notice-simple-list', useSimpleStyle);
      listNode.innerHTML = items
        .map((item) => {
          const title = escapeHtml(item.title || 'タイトル未設定');
          const date = formatDate(item.publishedAt || item.createdAt);
          if (useSimpleStyle) {
            return `
              <a class="notice-simple-item" href="blog-post.html?id=${item.id}" aria-label="${title}">
                <time class="notice-simple-date" datetime="${escapeHtml(item.publishedAt || item.createdAt || '')}">${date}</time>
                <span class="notice-simple-title">${title}</span>
                <span class="notice-simple-arrow" aria-hidden="true">›</span>
              </a>
            `;
          }

          const desc = escapeHtml(item.description || item.excerpt || '');
          const category = String(item.category?.name || item.category || '').trim();
          const categoryTag = category
            ? `<span class="category-badge ${categoryClassName(category)}">${escapeHtml(
                categoryLabel(category)
              )}</span>`
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
        ? `<span class="category-badge ${categoryClassName(category)}">${escapeHtml(
            categoryLabel(category)
          )}</span>`
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

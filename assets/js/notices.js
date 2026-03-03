(() => {
  const statusNode = document.getElementById('notice-status');
  const listNode = document.getElementById('notice-list');
  if (!statusNode || !listNode) return;

  const cfg = window.KOTOKOTO_CONFIG?.microcms;
  if (!cfg?.baseUrl || !cfg?.contentModel || !cfg?.apiKey) {
    statusNode.textContent = '記事を表示できません。microCMS設定を確認してください。';
    return;
  }

  const categoryId = String(listNode.dataset.categoryId || '').trim();
  if (!categoryId) {
    statusNode.textContent = 'カテゴリIDが未設定です。';
    return;
  }

  const categoriesModel = cfg.categoriesModel || 'kotokoto-categories';

  const buildCategoryUrl = (id) => {
    const base = cfg.baseUrl.replace(/\/$/, '');
    return `${base}/${categoriesModel}/${encodeURIComponent(id)}`;
  };

  const buildBlogsUrl = (query = '') => {
    const base = cfg.baseUrl.replace(/\/$/, '');
    const model = cfg.contentModel.replace(/^\//, '');
    return `${base}/${model}${query ? `?${query}` : ''}`;
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

  const stripHtml = (value) =>
    String(value ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

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

  const fetchJson = async (url) => {
    const res = await fetch(url, {
      headers: {
        'X-MICROCMS-API-KEY': cfg.apiKey
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const fetchCategory = async (id) => {
    try {
      return await fetchJson(buildCategoryUrl(id));
    } catch (_e) {
      return null;
    }
  };

  const fetchLatestByCategory = async (id, categoryName = '') => {
    // 1) category参照フィールドをIDで絞り込み
    const byId = await fetchJson(
      buildBlogsUrl(`filters=category[equals]${encodeURIComponent(id)}&limit=1&orders=-publishedAt`)
    );
    const fromId = Array.isArray(byId.contents) ? byId.contents[0] : null;
    if (fromId) return fromId;

    // 2) 参照ではなく文字列カテゴリの場合のフォールバック
    if (categoryName) {
      const byName = await fetchJson(
        buildBlogsUrl(
          `filters=category[contains]${encodeURIComponent(categoryName)}&limit=1&orders=-publishedAt`
        )
      );
      return Array.isArray(byName.contents) ? byName.contents[0] : null;
    }

    return null;
  };

  const render = async () => {
    try {
      const categoryData = await fetchCategory(categoryId);
      const categoryName = String(categoryData?.name || '').trim();
      const item = await fetchLatestByCategory(categoryId, categoryName);
      if (!item) {
        statusNode.textContent = '記事がありません。';
        return;
      }
      const title = escapeHtml(item.title || 'タイトル未設定');
      const itemCategory = String(item.category?.name || item.category || '').trim();
      const date = formatDate(item.publishedAt || item.createdAt);
      const desc = stripHtml(item.description || item.excerpt || item.content || item.body || '');
      const excerpt = desc.length > 120 ? `${desc.slice(0, 120)}...` : desc;
      const categoryTag = itemCategory
        ? `<span class="category-badge ${categoryClassName(itemCategory)}">${escapeHtml(
            categoryLabel(itemCategory)
          )}</span>`
        : '';

      listNode.innerHTML = `
        <a class="blog-card blog-card-link" href="blog-post.html?id=${encodeURIComponent(item.id)}" aria-label="${title}">
          <p class="blog-meta">${date}${categoryTag ? ` ${categoryTag}` : ''}</p>
          <h3>${title}</h3>
          ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ''}
        </a>
      `;
      statusNode.style.display = 'none';
    } catch (error) {
      statusNode.textContent = `記事の取得に失敗しました (${error.message})。`;
    }
  };

  render();
})();

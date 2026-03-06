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
  const limit = Math.max(Number(listNode.dataset.limit || '5'), 1);
  const noticeStyle = String(listNode.dataset.noticeStyle || '').trim();
  const useSimpleStyle = noticeStyle === 'simple';

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

  const canonicalType = (value) => {
    if (value === '授業支援') return '授業改善';
    if (value === '自己探求') return '感情解析';
    return value;
  };

  const splitTypeValues = (raw) =>
    String(raw || '')
      .split(/[、,]/)
      .map((part) => canonicalType(String(part).trim()))
      .filter(Boolean);

  const normalizeTypeList = (value) => {
    if (Array.isArray(value)) {
      return [...new Set(value.flatMap((entry) => splitTypeValues(entry?.name || entry?.value || entry)))];
    }
    return [...new Set(splitTypeValues(value?.name || value?.value || value))];
  };
  const datasetAllowedTypes = normalizeTypeList(listNode.dataset.noticeTypes || '');

  const getItemTypes = (item) => {
    const fromItem = normalizeTypeList(item?.type);
    if (fromItem.length > 0) return fromItem;
    return normalizeTypeList(item?.category?.type);
  };

  const isVisibleOnCurrentPage = (item) => {
    if (datasetAllowedTypes.length === 0) return true;
    const types = getItemTypes(item);
    if (types.length === 0) return false;
    return types.some((type) => datasetAllowedTypes.includes(type));
  };

  const fetchItemsByCategory = async (id, categoryName = '') => {
    const merged = [];
    const seen = new Set();
    const appendVisible = (items) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        if (!item || !item.id || seen.has(item.id) || !isVisibleOnCurrentPage(item)) return;
        seen.add(item.id);
        merged.push(item);
      });
    };

    // 1) category参照フィールドをIDで絞り込み
    const byId = await fetchJson(
      buildBlogsUrl(`filters=category[equals]${encodeURIComponent(id)}&limit=30&orders=-publishedAt`)
    );
    appendVisible(byId.contents);

    // 2) 参照ではなく文字列カテゴリの場合のフォールバック
    if (categoryName) {
      const byName = await fetchJson(
        buildBlogsUrl(
          `filters=category[contains]${encodeURIComponent(categoryName)}&limit=30&orders=-publishedAt`
        )
      );
      appendVisible(byName.contents);
    }

    return merged.slice(0, limit);
  };

  const render = async () => {
    try {
      const categoryData = await fetchCategory(categoryId);
      const categoryName = String(categoryData?.name || '').trim();
      const items = await fetchItemsByCategory(categoryId, categoryName);
      if (items.length === 0) {
        statusNode.textContent = '記事がありません。';
        return;
      }
      listNode.classList.toggle('notice-simple-list', useSimpleStyle);
      listNode.innerHTML = items
        .map((item) => {
          const title = escapeHtml(item.title || 'タイトル未設定');
          const date = formatDate(item.publishedAt || item.createdAt);
          if (useSimpleStyle) {
            return `
              <a class="notice-simple-item" href="blog-post.html?id=${encodeURIComponent(item.id)}" aria-label="${title}">
                <time class="notice-simple-date" datetime="${escapeHtml(item.publishedAt || item.createdAt || '')}">${date}</time>
                <span class="notice-simple-title">${title}</span>
                <span class="notice-simple-arrow" aria-hidden="true">›</span>
              </a>
            `;
          }

          const itemCategory = String(item.category?.name || item.category || '').trim();
          const desc = stripHtml(item.description || item.excerpt || item.content || item.body || '');
          const excerpt = desc.length > 120 ? `${desc.slice(0, 120)}...` : desc;
          const typeTags = getItemTypes(item)
            .map((type) => `<span class="category-badge is-self-discovery">${escapeHtml(type)}</span>`)
            .join(' ');
          const categoryTag = itemCategory
            ? `<span class="category-badge ${categoryClassName(itemCategory)}">${escapeHtml(
                categoryLabel(itemCategory)
              )}</span>`
            : '';

          return `
            <a class="blog-card blog-card-link" href="blog-post.html?id=${encodeURIComponent(item.id)}" aria-label="${title}">
              <p class="blog-meta">${date}${categoryTag ? ` ${categoryTag}` : ''}${typeTags ? ` ${typeTags}` : ''}</p>
              <h3>${title}</h3>
              ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ''}
            </a>
          `;
        })
        .join('');
      statusNode.style.display = 'none';
    } catch (error) {
      statusNode.textContent = `記事の取得に失敗しました (${error.message})。`;
    }
  };

  render();
})();

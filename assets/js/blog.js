(() => {
  const statusNode = document.getElementById('blog-status');
  const listNode = document.getElementById('blog-list');
  const postNode = document.getElementById('blog-post');
  const filterNode = document.getElementById('blog-category-filter');
  const postNavNode = document.getElementById('blog-post-nav');
  const backLinkNode = document.getElementById('blog-back-link');
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

  const TYPE_FILTERS = {
    all: { allowedTypes: [] },
    teachers: { allowedTypes: ['Education'] },
    self: { allowedTypes: ['EQ', 'Workshop'] }
  };

  const CONTENT_CATEGORIES = new Set(['notice', 'blog', 'casestudy']);

  const buildUrl = (id = '') => {
    const base = cfg.baseUrl.replace(/\/$/, '');
    const model = cfg.contentModel.replace(/^\//, '');
    const suffix = id ? `/${encodeURIComponent(id)}` : '';
    return `${base}/${model}${suffix}`;
  };

  const normalizeTypeFilter = (value) => {
    const key = String(value || '').trim();
    return Object.prototype.hasOwnProperty.call(TYPE_FILTERS, key) ? key : 'all';
  };

  const normalizeContentCategory = (value) => {
    const key = String(value || '').trim();
    return CONTENT_CATEGORIES.has(key) ? key : '';
  };

  const getCurrentTypeFilter = () => {
    const params = new URLSearchParams(window.location.search);
    const legacy = params.get('category');
    return normalizeTypeFilter(params.get('type') || legacy);
  };

  const getListContentCategory = () => normalizeContentCategory(listNode?.dataset.contentCategory || '');
  const getListTypeFilter = () => normalizeTypeFilter(listNode?.dataset.typeFilter || 'all');

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
      case 'Education':
        return 'is-class-improvement';
      case 'EQ':
      case 'Workshop':
        return 'is-self-discovery';
      default:
        return 'is-default';
    }
  };
  const categoryLabel = (category) => category;

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
    if (value === '授業支援' || value === '授業改善') return 'Education';
    if (value === '自己探求' || value === '感情解析') return 'EQ';
    if (value === 'ワークショップ') return 'Workshop';
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

  const getItemTypes = (item) => {
    const fromItem = normalizeTypeList(item?.type);
    if (fromItem.length > 0) return fromItem;
    return normalizeTypeList(item?.category?.type);
  };

  const isVisibleInTypeFilter = (item, filterKey) => {
    const key = normalizeTypeFilter(filterKey);
    if (key === 'all') return true;
    const allowed = TYPE_FILTERS[key].allowedTypes;
    const types = getItemTypes(item);
    if (types.length === 0) return false;
    return types.some((type) => allowed.includes(type));
  };

  const isVisibleOnTopPage = (item) => {
    const types = getItemTypes(item);
    if (types.length === 0) return true;
    return types.includes('全体');
  };

  const buildListHref = (filterKey, contentCategory) => {
    const type = normalizeTypeFilter(filterKey);
    const category = normalizeContentCategory(contentCategory);
    const page = category ? `${category}.html` : 'blog.html';
    return `${page}?type=${encodeURIComponent(type)}`;
  };

  const buildPostHref = (id, filterKey, contentCategory) => {
    const type = normalizeTypeFilter(filterKey);
    const category = normalizeContentCategory(contentCategory);
    const params = new URLSearchParams({ id: String(id), type });
    if (category) params.set('contentCategory', category);
    return `blog-post.html?${params.toString()}`;
  };

  const updateTypeFilterUI = (activeKey) => {
    const key = normalizeTypeFilter(activeKey);
    document.body?.setAttribute('data-type-theme', key);
    if (!filterNode) return;
    filterNode.querySelectorAll('[data-type], [data-category]').forEach((button) => {
      const source = button.dataset.type || button.dataset.category;
      const selected = normalizeTypeFilter(source) === key;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
  };

  const updateUrlType = (typeKey) => {
    const url = new URL(window.location.href);
    url.searchParams.set('type', normalizeTypeFilter(typeKey));
    url.searchParams.delete('category');
    history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
  };

  const fetchRecentItems = async (limit = 200, contentCategory = '') => {
    const category = normalizeContentCategory(contentCategory);
    const query = new URLSearchParams({ limit: String(Math.max(limit, 50)), orders: '-publishedAt' });
    if (category) {
      query.set('filters', `category[equals]${category}`);
    }
    const json = await fetchJson(`${buildUrl()}?${query.toString()}`);
    return Array.isArray(json.contents) ? json.contents : [];
  };

  const renderList = async () => {
    try {
      const limit = Number(listNode.dataset.limit || '12');
      const listStyle = String(listNode.dataset.blogStyle || '').trim();
      const useSimpleStyle = listStyle === 'simple';
      const useMediaStyle = listStyle === 'media';
      const typeKey = filterNode ? getCurrentTypeFilter() : getListTypeFilter();
      const contentCategory = getListContentCategory();

      updateTypeFilterUI(typeKey);
      const allItems = await fetchRecentItems(Math.max(limit * 6, 60), contentCategory);
      const items = allItems
        .filter((item) => isVisibleInTypeFilter(item, typeKey))
        .slice(0, limit);

      if (items.length === 0) {
        listNode.innerHTML = '';
        statusNode.style.display = '';
        statusNode.textContent = '記事がありません。';
        return;
      }

      statusNode.textContent = '';
      statusNode.style.display = 'none';
      listNode.classList.toggle('notice-simple-list', useSimpleStyle);
      listNode.classList.toggle('blog-media-list', useMediaStyle);
      listNode.innerHTML = items
        .map((item) => {
          const title = escapeHtml(item.title || 'タイトル未設定');
          const date = formatDate(item.publishedAt || item.createdAt);
          const postHref = buildPostHref(item.id, typeKey, contentCategory);
          if (useSimpleStyle) {
            return `
              <a class="notice-simple-item" href="${postHref}" aria-label="${title}">
                <time class="notice-simple-date" datetime="${escapeHtml(item.publishedAt || item.createdAt || '')}">${date}</time>
                <span class="notice-simple-title">${title}</span>
                <span class="notice-simple-arrow" aria-hidden="true">›</span>
              </a>
            `;
          }
          if (useMediaStyle) {
            const imageUrl = item.eyecatch?.url || '';
            const image = imageUrl
              ? `<img src="${escapeHtml(imageUrl)}" alt="${title}" loading="lazy" />`
              : '<div class="blog-media-thumb-placeholder" aria-hidden="true">NO IMAGE</div>';
            return `
              <a class="blog-media-item" href="${postHref}" aria-label="${title}">
                <div class="blog-media-thumb">${image}</div>
                <div class="blog-media-main">
                  <p class="blog-media-date">${date}</p>
                  <h3 class="blog-media-title">${title}</h3>
                </div>
                <span class="blog-media-arrow" aria-hidden="true">→</span>
              </a>
            `;
          }

          const descRaw = item.description || item.excerpt || item.content || item.body || '';
          const descPlain = stripHtml(descRaw);
          const desc = escapeHtml(descPlain.length > 110 ? `${descPlain.slice(0, 110)}...` : descPlain);
          const category = String(item.category?.name || item.category || '').trim();
          const categoryTag = category
            ? `<span class="category-badge ${categoryClassName(category)}">${escapeHtml(categoryLabel(category))}</span>`
            : '';
          return `
            <a class="blog-card blog-card-link" href="${postHref}" aria-label="${title}">
              <p class="blog-meta">${date}${categoryTag ? ` ${categoryTag}` : ''}</p>
              <h3>${title}</h3>
              <p>${desc}</p>
            </a>
          `;
        })
        .join('');
    } catch (e) {
      listNode.innerHTML = '';
      statusNode.style.display = '';
      statusNode.textContent = `記事の取得に失敗しました (${e.message})。contentModel または APIキーを確認してください。`;
    }
  };

  const renderDetail = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const typeKey = getCurrentTypeFilter();
    const requestedContentCategory = normalizeContentCategory(params.get('contentCategory'));
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
        ? `<span class="category-badge ${categoryClassName(category)}">${escapeHtml(categoryLabel(category))}</span>`
        : '';
      const itemContentCategory = normalizeContentCategory(item?.category?.id || '');
      const contentCategory = requestedContentCategory || itemContentCategory;

      if (backLinkNode) backLinkNode.href = buildListHref(typeKey, contentCategory);

      document.title = `${escapeHtml(title)} | ことことブログ`;
      postNode.innerHTML = `
        <p class="blog-meta">${date}${categoryTag ? ` ${categoryTag}` : ''}</p>
        <h1>${escapeHtml(title)}</h1>
        <div class="blog-post-content">${body}</div>
      `;

      const allItems = await fetchRecentItems(300, contentCategory);
      const filtered = allItems.filter((entry) => isVisibleInTypeFilter(entry, typeKey));
      const currentIndex = filtered.findIndex((entry) => entry.id === id);
      if (postNavNode) {
        if (currentIndex === -1) {
          postNavNode.innerHTML = '';
        } else {
          const prev = currentIndex > 0 ? filtered[currentIndex - 1] : null;
          const next = currentIndex < filtered.length - 1 ? filtered[currentIndex + 1] : null;
          const prevMarkup = prev
            ? `<a class="btn btn-line" href="${buildPostHref(prev.id, typeKey, contentCategory)}">← 前の記事へ</a>`
            : '<span class="btn btn-line is-disabled" aria-disabled="true">← 前の記事へ</span>';
          const nextMarkup = next
            ? `<a class="btn btn-line" href="${buildPostHref(next.id, typeKey, contentCategory)}">次の記事へ →</a>`
            : '<span class="btn btn-line is-disabled" aria-disabled="true">次の記事へ →</span>';
          postNavNode.innerHTML = `
            <div class="actions">
              ${prevMarkup}
              ${nextMarkup}
            </div>
          `;
        }
      }

      statusNode.textContent = '';
      statusNode.style.display = 'none';
    } catch (e) {
      statusNode.textContent = `記事の取得に失敗しました (${e.message})。`;
    }
  };

  if (filterNode && listNode) {
    filterNode.addEventListener('click', (event) => {
      const button = event.target.closest('[data-type], [data-category]');
      if (!button) return;
      const typeKey = normalizeTypeFilter(button.dataset.type || button.dataset.category);
      updateUrlType(typeKey);
      renderList();
    });
  }

  if (listNode) renderList();
  if (postNode) renderDetail();
})();

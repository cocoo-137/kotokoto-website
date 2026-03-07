(() => {
  const sectionNode = document.getElementById('cases-section');
  const listNode = document.getElementById('case-list');
  if (!sectionNode || !listNode) return;
  const filterNode = document.getElementById('blog-category-filter');

  const cfg = window.KOTOKOTO_CONFIG?.microcms;
  if (!cfg?.baseUrl || !cfg?.contentModel || !cfg?.apiKey) return;

  const fixedTypes = String(sectionNode.dataset.caseTypes || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const categoryId = String(sectionNode.dataset.categoryId || '').trim();
  if (!categoryId) return;

  const TYPE_FILTERS = {
    all: { allowedTypes: [] },
    teachers: { allowedTypes: ['Education'] },
    self: { allowedTypes: ['EQ', 'Workshop'] }
  };

  let currentTypeKey = 'all';

  const buildUrl = () => {
    const base = cfg.baseUrl.replace(/\/$/, '');
    const model = cfg.contentModel.replace(/^\//, '');
    return `${base}/${model}`;
  };

  const normalizeTypeKey = (value) => {
    const key = String(value || '').trim();
    return Object.prototype.hasOwnProperty.call(TYPE_FILTERS, key) ? key : 'all';
  };

  const readTypeKeyFromQuery = () => {
    const params = new URLSearchParams(window.location.search);
    return normalizeTypeKey(params.get('type') || params.get('category'));
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

  const excerptText = (item) => {
    const source = item.description || item.excerpt || item.content || item.body || '';
    const plain = stripHtml(source);
    if (!plain) return '';
    return plain.length > 90 ? `${plain.slice(0, 90)}...` : plain;
  };

  const canonicalType = (value) => {
    if (value === '授業支援' || value === '授業改善') return 'Education';
    if (value === '自己探求' || value === '感情解析') return 'EQ';
    if (value === 'ワークショップ') return 'Workshop';
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

  const normalizeType = (item) => getItemTypes(item)[0] || '';
  const isTypeMatch = (itemType, targetTypes) => {
    if (targetTypes.length === 0) return true;
    return targetTypes.includes(itemType);
  };

  const activeTypes = () => {
    if (filterNode) return TYPE_FILTERS[currentTypeKey].allowedTypes;
    return fixedTypes;
  };

  const updateFilterUI = () => {
    document.body?.setAttribute('data-type-theme', currentTypeKey);
    if (!filterNode) return;
    filterNode.querySelectorAll('[data-type], [data-category]').forEach((button) => {
      const source = button.dataset.type || button.dataset.category;
      const selected = normalizeTypeKey(source) === currentTypeKey;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
  };

  const updateTypeQuery = () => {
    if (!filterNode) return;
    const url = new URL(window.location.href);
    url.searchParams.set('type', currentTypeKey);
    url.searchParams.delete('category');
    history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
  };

  const buildPostHref = (itemId) => {
    const params = new URLSearchParams({ id: String(itemId), contentCategory: categoryId });
    if (filterNode) params.set('type', currentTypeKey);
    return `blog-post.html?${params.toString()}`;
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

  const render = async () => {
    try {
      updateFilterUI();
      const limit = Math.max(Number(listNode.dataset.limit || '6'), 1);
      const json = await fetchJson(`${buildUrl()}?limit=50&orders=-publishedAt`);
      const items = Array.isArray(json.contents) ? json.contents : [];
      const filtered = items
        .filter((item) => {
          const id = String(item?.category?.id || '').trim();
          return id === categoryId;
        })
        .filter((item) => isTypeMatch(normalizeType(item), activeTypes()))
        .slice(0, limit);

      if (filtered.length === 0) {
        sectionNode.hidden = true;
        return;
      }

      listNode.innerHTML = filtered
        .map((item) => {
          const title = escapeHtml(item.title || 'タイトル未設定');
          const summary = escapeHtml(excerptText(item));
          const type = escapeHtml(normalizeType(item));
          const imageUrl = item.eyecatch?.url || '';
          const imageTag = imageUrl
            ? `<img src=\"${escapeHtml(imageUrl)}\" alt=\"${title}\" loading=\"lazy\" />`
            : '<div class="case-image-placeholder" aria-hidden="true">NO IMAGE</div>';

          return `
            <article class="case-card reveal">
              <a class="case-link" href="${buildPostHref(item.id)}" aria-label="${title}">
                <div class="case-image-wrap">
                  ${imageTag}
                </div>
                <div class="case-body">
                  ${type ? `<span class="case-type">${type}</span>` : ''}
                  <h3>${title}</h3>
                  ${summary ? `<p>${summary}</p>` : ''}
                  <span class="case-more">詳細を見る →</span>
                </div>
              </a>
            </article>
          `;
        })
        .join('');

      sectionNode.hidden = false;
      const revealNodes = listNode.querySelectorAll('.reveal');
      requestAnimationFrame(() => {
        revealNodes.forEach((node) => node.classList.add('show'));
      });
    } catch (_error) {
      sectionNode.hidden = true;
    }
  };

  if (filterNode) {
    currentTypeKey = readTypeKeyFromQuery();
    filterNode.addEventListener('click', (event) => {
      const button = event.target.closest('[data-type], [data-category]');
      if (!button) return;
      currentTypeKey = normalizeTypeKey(button.dataset.type || button.dataset.category);
      updateTypeQuery();
      render();
    });
  }

  render();
})();

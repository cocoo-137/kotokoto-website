(() => {
  const sectionNode = document.getElementById('cases-section');
  const listNode = document.getElementById('case-list');
  if (!sectionNode || !listNode) return;

  const cfg = window.KOTOKOTO_CONFIG?.microcms;
  if (!cfg?.baseUrl || !cfg?.contentModel || !cfg?.apiKey) return;

  const types = String(sectionNode.dataset.caseTypes || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (types.length === 0) return;

  const buildUrl = () => {
    const base = cfg.baseUrl.replace(/\/$/, '');
    const model = cfg.contentModel.replace(/^\//, '');
    return `${base}/${model}`;
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

  const normalizeType = (item) => String(item.type?.name || item.type || '').trim();
  const isTypeMatch = (itemType, targetTypes) => {
    if (targetTypes.includes(itemType)) return true;
    if (itemType === '自己探求' && targetTypes.includes('感情解析')) return true;
    if (itemType === '感情解析' && targetTypes.includes('自己探求')) return true;
    return false;
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
      const limit = Math.max(Number(listNode.dataset.limit || '6'), 1);
      const json = await fetchJson(`${buildUrl()}?limit=50&orders=-publishedAt`);
      const items = Array.isArray(json.contents) ? json.contents : [];
      const filtered = items
        .filter((item) => isTypeMatch(normalizeType(item), types))
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
              <a class="case-link" href="blog-post.html?id=${encodeURIComponent(item.id)}" aria-label="${title}">
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

  render();
})();

(() => {
  const data = window.SYSTEM_DATA;
  let activeFilter = 'all';

  const byId = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  const flatItems = () => data.sections.flatMap(section => section.items.map(item => ({...item, sectionId: section.id})));

  function renderMeta() {
    byId('topbarMeta').innerHTML = `Aktualizované <strong>${esc(data.meta.updated)}</strong><br>${esc(data.meta.github)}`;
  }

  function renderFilters() {
    byId('filters').innerHTML = data.filters.map(filter =>
      `<button class="filter-btn ${filter.id === activeFilter ? 'active' : ''}" data-filter="${esc(filter.id)}">${esc(filter.label)}</button>`
    ).join('');
    document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      renderFilters();
      applyFilter();
    }));
  }

  function renderSummary() {
    const items = flatItems();
    const stats = [
      [2, 'produkčné aplikácie'],
      [items.length, 'zdokumentovaných funkcií'],
      [items.filter(i => i.categories.includes('notification')).length, 'blokov upozornení'],
      [data.sections.length, 'hlavných oblastí']
    ];
    byId('summaryGrid').innerHTML = stats.map(([value, label]) => `<article class="summary-card"><div class="value">${value}</div><div class="label">${esc(label)}</div></article>`).join('');
  }

  function renderSystems() {
    byId('systemGrid').innerHTML = data.systems.map(system => `
      <article class="system-card">
        <div class="row"><h3>${esc(system.name)}</h3><span class="status ${esc(system.status)}">${esc(system.statusLabel)}</span></div>
        <p>${esc(system.detail)}</p>
      </article>
    `).join('');
  }

  function renderNav() {
    byId('sectionNav').innerHTML = data.sections.map(section => `<a href="#${esc(section.id)}">${esc(section.title)}</a>`).join('');
  }

  function renderSections() {
    byId('sections').innerHTML = data.sections.map(section => `
      <section class="section" id="${esc(section.id)}">
        <div class="section-head">
          <div><div class="eyebrow">${section.items.length} položiek</div><h2>${esc(section.title)}</h2></div>
          <div class="section-desc">${esc(section.description)}</div>
        </div>
        <div class="feature-grid">
          ${section.items.map((item, index) => featureCard(item, section.id, index)).join('')}
        </div>
      </section>
    `).join('') + `<div class="empty-state" id="emptyState">Nenašiel som nič pre tento filter alebo hľadaný výraz.</div>`;
  }

  function featureCard(item, sectionId, index) {
    const searchable = [item.title, item.subtitle, item.body, ...(item.bullets || []), ...(item.tags || []), ...(item.categories || [])].join(' ').toLowerCase();
    return `
      <article class="feature-card" data-card data-search="${esc(searchable)}" data-categories="${esc(item.categories.join(','))}" data-section="${esc(sectionId)}">
        <details ${index === 0 ? 'open' : ''}>
          <summary>
            <div class="feature-title-row">
              <div>
                <div class="feature-title">${esc(item.title)}</div>
                <div class="feature-subtitle">${esc(item.subtitle)}</div>
              </div>
              <span class="status ${esc(item.status)}">${esc(item.statusLabel)}</span>
            </div>
            <div class="tags">${(item.tags || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
          </summary>
          <div class="feature-body">
            <p>${esc(item.body)}</p>
            ${item.bullets?.length ? `<ul>${item.bullets.map(bullet => `<li>${esc(bullet)}</li>`).join('')}</ul>` : ''}
          </div>
        </details>
      </article>
    `;
  }

  function applyFilter() {
    const query = byId('searchInput').value.trim().toLowerCase();
    let visibleCards = 0;
    document.querySelectorAll('[data-card]').forEach(card => {
      const matchesText = !query || card.dataset.search.includes(query);
      const categories = card.dataset.categories.split(',');
      const matchesFilter = activeFilter === 'all' || categories.includes(activeFilter);
      const visible = matchesText && matchesFilter;
      card.classList.toggle('hidden', !visible);
      if (visible) visibleCards++;
    });

    document.querySelectorAll('.section').forEach(section => {
      const anyVisible = [...section.querySelectorAll('[data-card]')].some(card => !card.classList.contains('hidden'));
      section.style.display = anyVisible ? '' : 'none';
    });
    byId('emptyState').style.display = visibleCards ? 'none' : 'block';
  }

  renderMeta();
  renderFilters();
  renderSummary();
  renderSystems();
  renderNav();
  renderSections();
  byId('searchInput').addEventListener('input', applyFilter);
})();

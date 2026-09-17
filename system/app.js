(() => {
  const data = window.SYSTEM_DATA;
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  const badge = (label, tone) => `<span class="badge ${esc(tone)}">${esc(label)}</span>`;

  function renderMeta() {
    $('updated').textContent = `Aktualizované ${data.meta.updated}`;
  }

  function renderNow() {
    $('nowCard').innerHTML = `
      <article class="now-card">
        <div class="now-top">
          <div>
            <div class="mini-label">AKTUÁLNA ÚLOHA</div>
            <h2>${esc(data.now.title)}</h2>
          </div>
          ${badge(data.now.status, data.now.statusTone)}
        </div>
        <p class="now-note">${esc(data.now.note)}</p>
        <div class="check-list">
          ${data.now.bullets.map(item => `<div><span>→</span><p>${esc(item)}</p></div>`).join('')}
        </div>
      </article>`;
  }

  function renderNext() {
    $('nextList').innerHTML = data.next.map(item => `
      <article class="task-card">
        <div class="task-head"><h3>${esc(item.title)}</h3>${badge(item.status, item.tone)}</div>
        <p>${esc(item.text)}</p>
        <small>${esc(item.detail)}</small>
      </article>`).join('');
  }

  function renderWaiting() {
    $('waitingList').innerHTML = data.waiting.map(item => `
      <article class="waiting-card">
        <div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.text)}</p>
        </div>
        ${badge(item.status, item.tone)}
      </article>`).join('');
  }

  function renderRecent() {
    $('recentList').innerHTML = data.recent.map(item => `
      <article class="recent-card">
        <div class="recent-meta"><span>${esc(item.date)}</span><span>${esc(item.app)}</span></div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.text)}</p>
      </article>`).join('');
  }

  function renderFeatures(appKey = 'admin') {
    const app = data.apps[appKey];
    $('featureGrid').innerHTML = `
      <article class="feature-intro">
        <span class="mini-label">${esc(app.label).toUpperCase()}</span>
        <h2>${esc(app.label)}</h2>
        <p>${esc(app.intro)}</p>
      </article>
      ${app.features.map(item => `
        <article class="feature-card">
          <span class="feature-dot">✓</span>
          <div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div>
        </article>`).join('')}`;
  }

  function bindTabs() {
    document.querySelectorAll('.app-tab').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.app-tab').forEach(tab => tab.classList.remove('active'));
        button.classList.add('active');
        renderFeatures(button.dataset.app);
      });
    });
  }

  function renderHistory() {
    $('historyList').innerHTML = data.history.map(item => `
      <article class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-card">
          <div class="timeline-meta"><span>${esc(item.date)}</span><span>${esc(item.app)}</span></div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.text)}</p>
        </div>
      </article>`).join('');
  }

  function renderTechnical() {
    $('technicalInfo').innerHTML = `
      <p class="source-note">${esc(data.meta.note)}</p>
      <div class="tech-grid">
        ${data.technical.map(item => `
          <div class="tech-row"><strong>${esc(item.label)}</strong><span>${esc(item.value)}</span></div>`).join('')}
      </div>`;
  }

  renderMeta();
  renderNow();
  renderNext();
  renderWaiting();
  renderRecent();
  renderFeatures();
  renderHistory();
  renderTechnical();
  bindTabs();
})();

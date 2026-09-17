(() => {
  const data = window.SYSTEM_DATA;
  const $ = (id) => document.getElementById(id);
  const NOTES_KEY = 'chvostikovo-system-prepared-notes-v1';
  let preparedNotes = loadPreparedNotes();
  let editingNoteId = null;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  const badge = (label, tone) => `<span class="badge ${esc(tone)}">${esc(label)}</span>`;

  function loadPreparedNotes() {
    try {
      const stored = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  function savePreparedNotes() {
    localStorage.setItem(NOTES_KEY, JSON.stringify(preparedNotes));
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(value));
    } catch {
      return '';
    }
  }

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
    const fixedTasks = data.next.map(item => `
      <article class="task-card">
        <div class="task-head"><h3>${esc(item.title)}</h3>${badge(item.status, item.tone)}</div>
        <p>${esc(item.text)}</p>
        <small>${esc(item.detail)}</small>
      </article>`).join('');

    const userNotes = preparedNotes.map(item => `
      <article class="task-card note-card" data-note-id="${esc(item.id)}">
        <div class="task-head">
          <div>
            <div class="note-kicker">${esc(item.area)} · ${esc(item.kind)}</div>
            <h3>${esc(item.title)}</h3>
          </div>
          ${badge('Poznámka', 'ready')}
        </div>
        ${item.text ? `<p>${esc(item.text)}</p>` : ''}
        <div class="note-footer">
          <small>Pridané ${esc(formatDate(item.createdAt))}</small>
          <div class="note-actions">
            <button type="button" data-edit-note="${esc(item.id)}">Upraviť</button>
            <button type="button" class="danger" data-delete-note="${esc(item.id)}">Vymazať</button>
          </div>
        </div>
      </article>`).join('');

    $('nextList').innerHTML = userNotes + fixedTasks;
    $('copyNotesButton').hidden = preparedNotes.length === 0;
    bindNoteCardActions();
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

  function openNoteModal(note = null) {
    editingNoteId = note?.id || null;
    $('noteModalTitle').textContent = note ? 'Upraviť bod' : 'Pridať nový bod';
    $('noteTitle').value = note?.title || '';
    $('noteText').value = note?.text || '';
    $('noteArea').value = note?.area || 'Obe appky';
    $('noteKind').value = note?.kind || 'Nápad';
    $('noteModal').showModal();
    setTimeout(() => $('noteTitle').focus(), 50);
  }

  function closeNoteModal() {
    $('noteModal').close();
    editingNoteId = null;
    $('noteForm').reset();
  }

  function bindNoteCardActions() {
    document.querySelectorAll('[data-edit-note]').forEach(button => {
      button.addEventListener('click', () => {
        const note = preparedNotes.find(item => item.id === button.dataset.editNote);
        if (note) openNoteModal(note);
      });
    });

    document.querySelectorAll('[data-delete-note]').forEach(button => {
      button.addEventListener('click', () => {
        const note = preparedNotes.find(item => item.id === button.dataset.deleteNote);
        if (!note) return;
        if (!window.confirm(`Vymazať poznámku „${note.title}“?`)) return;
        preparedNotes = preparedNotes.filter(item => item.id !== note.id);
        savePreparedNotes();
        renderNext();
      });
    });
  }

  async function copyPreparedNotes() {
    if (!preparedNotes.length) return;
    const text = preparedNotes.map((item, index) => [
      `${index + 1}. ${item.title}`,
      `Týka sa: ${item.area}`,
      `Typ: ${item.kind}`,
      item.text ? `Poznámka: ${item.text}` : ''
    ].filter(Boolean).join('\n')).join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      const button = $('copyNotesButton');
      const original = button.textContent;
      button.textContent = 'Skopírované ✓';
      setTimeout(() => { button.textContent = original; }, 1600);
    } catch {
      window.prompt('Skopíruj pripravené body:', text);
    }
  }

  function bindNotes() {
    $('globalAddButton').addEventListener('click', () => openNoteModal());
    $('nextAddButton').addEventListener('click', () => openNoteModal());
    $('copyNotesButton').addEventListener('click', copyPreparedNotes);
    $('closeNoteModal').addEventListener('click', closeNoteModal);
    $('cancelNoteButton').addEventListener('click', closeNoteModal);

    $('noteModal').addEventListener('click', (event) => {
      const rect = $('noteModal').getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) closeNoteModal();
    });

    $('noteForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const title = $('noteTitle').value.trim();
      if (!title) return;

      if (editingNoteId) {
        preparedNotes = preparedNotes.map(item => item.id === editingNoteId ? {
          ...item,
          title,
          text: $('noteText').value.trim(),
          area: $('noteArea').value,
          kind: $('noteKind').value,
          updatedAt: new Date().toISOString()
        } : item);
      } else {
        preparedNotes.unshift({
          id: self.crypto?.randomUUID?.() || `note-${Date.now()}`,
          title,
          text: $('noteText').value.trim(),
          area: $('noteArea').value,
          kind: $('noteKind').value,
          createdAt: new Date().toISOString()
        });
      }

      savePreparedNotes();
      closeNoteModal();
      renderNext();
      document.querySelector('#dalej')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
  bindNotes();
})();

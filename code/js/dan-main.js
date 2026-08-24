(function () {
  const root = document.getElementById('dan-rank-list');
  const switcher = document.getElementById('dan-dataset-switcher');
  const prevButton = document.getElementById('dan-dataset-prev');
  const nextButton = document.getElementById('dan-dataset-next');
  const titleLabel = document.getElementById('dan-dataset-title');
  const creditRoot = document.getElementById('dan-credit');
  let currentDatasetIndex = 0;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (!src) {
        resolve();
        return;
      }
      const alreadyLoaded = Array.from(document.scripts).some((script) => script.dataset.danRankSrc === src);
      if (alreadyLoaded) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.dataset.danRankSrc = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`段位データを読み込めませんでした: ${src}`));
      document.head.appendChild(script);
    });
  }

  async function loadRankSets() {
    const scripts = Array.isArray(window.danRankSetScripts) ? window.danRankSetScripts : [];
    for (const src of scripts) {
      await loadScript(src);
    }
  }

  function getDatasets() {
    const sets = Array.isArray(window.danRankSets) ? window.danRankSets : [];
    if (sets.length) {
      return sets.map((set, index) => ({
        id: set.id || `dan-${index + 1}`,
        title: set.title || `段位表 ${index + 1}`,
        author: set.author || null,
        ranks: Array.isArray(set.ranks) ? set.ranks : []
      }));
    }
    if (Array.isArray(window.danRankList)) {
      return [{
        id: 'default',
        title: 'しろ式ホロドリ創作段位',
        author: { name: 'しろ', url: '' },
        ranks: window.danRankList
      }];
    }
    return [];
  }

  function songCell(songName) {
    const title = String(songName || '').trim();
    if (!title) return '<span class="dan-empty">未設定</span>';
    return `<a class="dan-song-link" href="music_detail.html?song=${encodeURIComponent(title)}">${escapeHtml(title)}</a>`;
  }

  function valueCell(value) {
    const text = String(value || '').trim();
    return text ? escapeHtml(text) : '<span class="dan-empty">未設定</span>';
  }
  function difficultyCell(value) {
    const text = String(value || '').trim();
    if (!text) return '<span class="dan-empty">&#26410;&#35373;&#23450;</span>';
    const match = text.match(/^([A-Za-z]+)\s*([0-9]+(?:\.[0-9]+)?\+?)$/);
    if (!match) return escapeHtml(text);
    return `<span class="dan-difficulty"><span class="dan-difficulty-label">${escapeHtml(match[1].toUpperCase())}</span><span class="dan-difficulty-level">${escapeHtml(match[2])}</span></span>`;
  }
  function normalizeDifficulty(value) {
    const text = String(value || '').trim();
    const lower = text.toLowerCase();
    if (/^easy\d*\+?$/i.test(text) || lower === 'e' || text === 'イージー') return 'easy';
    if (/^normal\d*\+?$/i.test(text) || lower === 'n' || text === 'ノーマル') return 'normal';
    if (/^hard\d*\+?$/i.test(text) || lower === 'h' || text === 'ハード') return 'hard';
    if (/^expert\d*\+?$/i.test(text) || lower === 'ex' || lower === 'x' || text === 'エキスパート') return 'expert';
    return lower;
  }

  function findSongData(songName) {
    const title = String(songName || '').trim();
    if (!title || typeof songList === 'undefined' || !Array.isArray(songList)) return null;
    return songList.find((song) => String(song?.[0] || '').trim() === title) || null;
  }

  function getAutoNotes(stage) {
    const song = findSongData(stage.song);
    const difficulty = normalizeDifficulty(stage.difficulty);
    const combo = song?.[4]?.combos?.[difficulty];
    const comboText = String(combo ?? '').trim();
    return comboText || String(stage.notes || '').trim();
  }

  function notesCell(stage) {
    return valueCell(getAutoNotes(stage));
  }

  function getTotalCombo(stages) {
    let total = 0;
    let hasAny = false;
    stages.forEach((stage) => {
      const raw = getAutoNotes(stage);
      const number = Number(String(raw || '').replace(/,/g, '').trim());
      if (Number.isFinite(number) && number > 0) {
        total += number;
        hasAny = true;
      }
    });
    return hasAny ? String(total) : '';
  }

  function limitText(value) {
    const text = String(value || '').trim();
    if (!text) return '<span class="dan-empty">未設定</span>';
    if (text === '×' || text === '-' || text === 'なし') return escapeHtml(text);
    return escapeHtml(text.includes('未満') ? text : `${text}未満`);
  }

  function renderRank(rank, index) {
    const stages = Array.isArray(rank.stages) ? rank.stages : [];
    const rows = ['1st', '2nd', '3rd'].map((label, stageIndex) => {
      const stage = stages[stageIndex] || {};
      return `
        <tr>
          <th scope="row">${escapeHtml(stage.order || label)}</th>
          <td>${songCell(stage.song)}</td>
          <td>${difficultyCell(stage.difficulty)}</td>
          <td>${notesCell(stage)}</td>
        </tr>`;
    }).join('');

    const conditions = rank.conditions || {};
    const totalCombo = getTotalCombo(stages);
    const rankName = escapeHtml(rank.rank || '段位');
    const contentId = `dan-rank-content-${currentDatasetIndex}-${index}`;
    return `
      <article class="dan-rank-card">
        <button class="dan-rank-toggle" type="button" aria-expanded="false" aria-controls="${contentId}">
          <span class="dan-rank-title">${rankName}</span>
          <span class="dan-rank-arrow" aria-hidden="true">▼</span>
        </button>
        <div class="dan-rank-content" id="${contentId}" hidden>
          <div class="dan-table-wrap">
            <table class="dan-stage-table">
              <thead>
                <tr>
                  <th>順番</th>
                  <th>曲名</th>
                  <th>難易度</th>
                  <th>ノーツ数</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <section class="dan-conditions" aria-label="合格条件">
            <h3>合格条件</h3>
            <dl>
              <div><dt>GREAT</dt><dd>${limitText(conditions.great)}</dd></div>
              <div><dt>GOOD以下の数</dt><dd>${limitText(conditions.goodOrBelow)}</dd></div>
            </dl>
          </section>
          <div class="dan-total-combo"><span>総コンボ数</span><strong>${valueCell(totalCombo)}</strong></div>
        </div>
      </article>`;
  }

  function setupRankToggles() {
    if (!root) return;
    root.querySelectorAll('.dan-rank-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const content = document.getElementById(button.getAttribute('aria-controls'));
        if (!content) return;
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!isOpen));
        button.classList.toggle('is-open', !isOpen);
        content.hidden = isOpen;
      });
    });
  }

  function renderCredit(dataset) {
    if (!creditRoot) return;
    const author = dataset?.author;
    const name = typeof author === 'string' ? author : author?.name;
    const url = typeof author === 'object' ? String(author.url || '').trim() : '';
    if (!name) {
      creditRoot.innerHTML = '';
      creditRoot.hidden = true;
      return;
    }
    creditRoot.hidden = false;
    creditRoot.innerHTML = url
      ? `段位作者：<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(name)}</a>`
      : `段位作者：${escapeHtml(name)}`;
  }

  function updateSwitcher(dataset, datasets) {
    if (!switcher || !titleLabel || !prevButton || !nextButton) return;
    const hasMultiple = datasets.length > 1;
    switcher.hidden = !datasets.length;
    titleLabel.textContent = dataset?.title || '段位表';
    prevButton.disabled = !hasMultiple;
    nextButton.disabled = !hasMultiple;
  }

  function renderDanRanks() {
    if (!root) return;
    const datasets = getDatasets();
    if (!datasets.length) {
      root.innerHTML = '<p class="dan-empty-message">段位データがありません。</p>';
      updateSwitcher(null, datasets);
      renderCredit(null);
      return;
    }
    currentDatasetIndex = Math.max(0, Math.min(currentDatasetIndex, datasets.length - 1));
    const dataset = datasets[currentDatasetIndex];
    root.innerHTML = dataset.ranks.map(renderRank).join('');
    setupRankToggles();
    updateSwitcher(dataset, datasets);
    renderCredit(dataset);
  }

  function changeDataset(direction) {
    const datasets = getDatasets();
    if (datasets.length <= 1) return;
    currentDatasetIndex = (currentDatasetIndex + direction + datasets.length) % datasets.length;
    renderDanRanks();
  }

  function setupSwitcher() {
    if (!prevButton || !nextButton) return;
    prevButton.addEventListener('click', () => changeDataset(-1));
    nextButton.addEventListener('click', () => changeDataset(1));
  }


  async function init() {
    try {
      await loadRankSets();
    } catch (error) {
      console.error(error);
    }
    setupSwitcher();
    renderDanRanks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();









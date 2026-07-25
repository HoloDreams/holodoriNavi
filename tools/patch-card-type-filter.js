const fs = require('fs');
const htmlPath = 'G:/holodoriNavi/code/character_card.html';
const jsPath = 'G:/holodoriNavi/code/js/card-main.js';
const cssPath = 'G:/holodoriNavi/code/css/character_card.css';

let html = fs.readFileSync(htmlPath, 'utf8');
const oldPanel = `    <div id="card-filter-panel" class="card-filter-panel" aria-hidden="true">
      <div class="sort-container">
        <label for="sort-select">並び替え：</label>
        <select id="sort-select">
          <option value="default">新着順</option>
          <option value="debut-asc">デビュー順</option>
          <option value="rarity-desc">レアリティが高い順</option>
          <option value="rarity-asc">レアリティが低い順</option>
        </select>
      </div>
    </div>`;
const newPanel = `    <div id="card-filter-panel" class="card-filter-panel" aria-hidden="true">
      <div class="type-filter-container" aria-label="タイプで絞り込み">
        <button type="button" class="type-filter-btn active" data-type="all">すべて</button>
        <button type="button" class="type-filter-btn type-cute" data-type="cute">❤ キュート</button>
        <button type="button" class="type-filter-btn type-pure" data-type="pure">🍃 ピュア</button>
        <button type="button" class="type-filter-btn type-happy" data-type="happy">☀ ハッピー</button>
      </div>
      <div class="sort-container">
        <label for="sort-select">並び替え：</label>
        <select id="sort-select">
          <option value="default">新着順</option>
          <option value="debut-asc">デビュー順</option>
          <option value="rarity-desc">レアリティが高い順</option>
          <option value="rarity-asc">レアリティが低い順</option>
        </select>
      </div>
    </div>`;
if (html.includes(oldPanel)) {
  html = html.replace(oldPanel, newPanel);
} else if (!html.includes('type-filter-container')) {
  html = html.replace('<div class="sort-container">', '<div class="type-filter-container" aria-label="タイプで絞り込み">\n        <button type="button" class="type-filter-btn active" data-type="all">すべて</button>\n        <button type="button" class="type-filter-btn type-cute" data-type="cute">❤ キュート</button>\n        <button type="button" class="type-filter-btn type-pure" data-type="pure">🍃 ピュア</button>\n        <button type="button" class="type-filter-btn type-happy" data-type="happy">☀ ハッピー</button>\n      </div>\n      <div class="sort-container">');
}
fs.writeFileSync(htmlPath, html, 'utf8');

let js = fs.readFileSync(jsPath, 'utf8');
if (!js.includes('let currentTypeFilter')) {
  js = js.replace("let currentSort = 'default';", "let currentSort = 'default';\nlet currentTypeFilter = 'all';");
}
if (!js.includes('currentTypeFilter !==')) {
  js = js.replace(`    if (keyword !== '') {
        filtered = filtered.filter(card => {
            const cardName = card[1] ? card[1].toLowerCase() : '';
            const searchWords = card[3] ? card[3].toLowerCase() : '';
            return cardName.includes(keyword) || searchWords.includes(keyword);
        });
    }


    filtered.sort((a, b) => {`, `    if (keyword !== '') {
        filtered = filtered.filter(card => {
            const cardName = card[1] ? card[1].toLowerCase() : '';
            const searchWords = card[3] ? card[3].toLowerCase() : '';
            return cardName.includes(keyword) || searchWords.includes(keyword);
        });
    }

    if (currentTypeFilter !== 'all') {
        filtered = filtered.filter(card => normalizeCardType(card[4]?.type) === currentTypeFilter);
    }

    filtered.sort((a, b) => {`);
}
if (!js.includes("querySelectorAll('.type-filter-btn')")) {
  js = js.replace(`    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            renderCards();
        });
    }

    const prevBtn = document.getElementById('prev-btn');`, `    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            renderCards();
        });
    }

    document.querySelectorAll('.type-filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            currentTypeFilter = button.dataset.type || 'all';
            document.querySelectorAll('.type-filter-btn').forEach(item => item.classList.toggle('active', item === button));
            currentPage = 1;
            renderCards();
        });
    });

    const prevBtn = document.getElementById('prev-btn');`);
}
fs.writeFileSync(jsPath, js, 'utf8');

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('/* Card type filter controls */')) {
  css += `\n/* Card type filter controls */\n.card-filter-panel {\n  padding: 0 12px;\n}\n.card-filter-panel.is-open {\n  max-height: 520px;\n  padding-bottom: 18px;\n}\n.type-filter-container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 10px;\n  margin: 2px auto 18px;\n  max-width: 760px;\n}\n.type-filter-btn {\n  min-width: 116px;\n  padding: 8px 16px;\n  border: 2px solid #46d4ff;\n  border-radius: 999px;\n  background: rgba(255, 255, 255, 0.92);\n  color: #008dd2;\n  font-size: 15px;\n  font-weight: 800;\n  line-height: 1.2;\n  box-shadow: 0 8px 18px rgba(0, 148, 216, 0.12);\n  cursor: pointer;\n}\n.type-filter-btn.active {\n  color: #fff;\n  background: linear-gradient(135deg, #46d4ff, #0094d8);\n  border-color: transparent;\n}\n.type-filter-btn.type-cute.active { background: linear-gradient(135deg, #ff8fac, #ff4f78); }\n.type-filter-btn.type-pure.active { background: linear-gradient(135deg, #65ff46, #20b85c); }\n.type-filter-btn.type-happy.active { background: linear-gradient(135deg, #ffd95a, #f4ad13); }\nmain .sort-container {\n  margin: 0 auto 4px !important;\n  min-height: 46px;\n  overflow: visible;\n}\nmain #sort-select {\n  min-width: 230px;\n  height: 42px;\n  padding: 8px 38px 8px 16px;\n  line-height: 1.2;\n  box-sizing: border-box;\n}\n@media (max-width: 520px) {\n  .type-filter-container {\n    gap: 8px;\n    margin-bottom: 14px;\n  }\n  .type-filter-btn {\n    min-width: 0;\n    flex: 1 1 44%;\n    padding: 8px 10px;\n    font-size: 13px;\n  }\n  main .sort-container {\n    flex-wrap: wrap;\n    gap: 8px;\n  }\n  main #sort-select {\n    width: min(260px, 100%);\n    min-width: 0;\n  }\n}\n`;
}
fs.writeFileSync(cssPath, css, 'utf8');
console.log('patched');

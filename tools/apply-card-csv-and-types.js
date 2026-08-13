const fs = require('fs');
const vm = require('vm');

const cardPath = 'G:/holodoriNavi/code/js/card-data.js';
const csvPath = 'G:/Documents/cards-all.csv';
const editorPath = 'G:/holodoriNavi/data-editor.html';
const mainPath = 'G:/holodoriNavi/code/js/card-main.js';
const cssPath = 'G:/holodoriNavi/code/css/character_card.css';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else {
      if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows.filter(r => r.some(v => String(v).trim() !== ''));
}
function toObjects(rows) {
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])));
}
function normName(value) {
  return String(value || '').replace(/一伊那尔栖/g, '一伊那尓栖').replace(/[\s　]/g, '').trim();
}
function rarityOf(value) {
  const m = String(value || '').match(/\d+/);
  return m ? Number(m[0]) : 0;
}
function typeKey(value) {
  const v = String(value || '').trim();
  if (v.includes('キュート') || v.includes('赤') || /^cute$/i.test(v)) return 'cute';
  if (v.includes('ピュア') || v.includes('緑') || /^pure$/i.test(v)) return 'pure';
  if (v.includes('ハッピー') || v.includes('黄') || /^happy$/i.test(v)) return 'happy';
  return '';
}
function jsString(value) { return JSON.stringify(String(value || '')); }
function numList(values) {
  return Array.from(new Set((values || []).map(Number).filter(v => Number.isInteger(v) && v >= 0 && v < 25))).sort((a,b)=>a-b);
}
function normalizeCells(cells) {
  if (cells && typeof cells === 'object' && !Array.isArray(cells)) {
    return { yellow: numList(cells.yellow || cells.y || []), green: numList(cells.green || cells.g || []) };
  }
  if (Array.isArray(cells)) return { yellow: numList(cells), green: [] };
  return { yellow: [], green: [] };
}
function memberFromCard(card) {
  const tags = String(card[3] || '').split(',').map(v => v.trim()).filter(Boolean);
  if (tags.length >= 3) return tags[tags.length - 1];
  return String(card[2] || '').replace(/^\d+_/, '').replace(/\d+\.webp$/i, '').replace(/\.webp$/i, '');
}
function formatCardData(cards) {
  let out = 'const cardData = [\n';
  cards.forEach((card, index) => {
    const skills = card[4] || {};
    const connect = skills.connect && typeof skills.connect === 'object' ? skills.connect : { range: '', cells: { yellow: [], green: [] }, effect: String(skills.connect || '') };
    const cells = normalizeCells(connect.cells);
    out += `  [ ${Number(card[0]) || 0}, ${jsString(card[1])}, ${jsString(card[2])}, ${jsString(card[3])}, \n`;
    out += `    { type: ${jsString(skills.type || '')}, leader: ${jsString(skills.leader || '')}, connect: { range: ${jsString(connect.range || '')}, cells: { yellow: [${cells.yellow.join(', ')}], green: [${cells.green.join(', ')}] }, effect: ${jsString(connect.effect || '')} }, costume: ${jsString(skills.costume || '')}, special: ${jsString(skills.special || '')}, active: ${jsString(skills.active || '')}, passive: ${jsString(skills.passive || '')} }\n`;
    out += '  ]';
    out += index < cards.length - 1 ? ',\n' : '\n';
  });
  out += '];\n';
  return out;
}

const csvText = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const csvRows = toObjects(parseCsv(csvText));
const csvMap = new Map();
for (const row of csvRows) csvMap.set(`${rarityOf(row['レア'])}|${normName(row['ホロメン'])}`, row);

let cardSrc = fs.readFileSync(cardPath, 'utf8').replace(/^\uFEFF/, '');
const ctx = {};
vm.runInNewContext('var cardData;\n' + cardSrc.replace(/const\s+cardData\s*=/, 'cardData ='), ctx);
const cards = ctx.cardData;
let matched = 0;
const unmatched = [];
for (const card of cards) {
  const rarity = Number(card[0]) || 0;
  const member = memberFromCard(card);
  const row = csvMap.get(`${rarity}|${normName(member)}`);
  if (!row) { unmatched.push(`${rarity}|${member}`); continue; }
  matched++;
  card[1] = `${row['カード名']} ${row['ホロメン']}`.trim();
  const skills = card[4] && typeof card[4] === 'object' ? card[4] : {};
  const existingConnect = skills.connect && typeof skills.connect === 'object' ? skills.connect : { cells: { yellow: [], green: [] } };
  const connectText = row['コネクト'] || '';
  const parts = connectText.split('／');
  skills.type = typeKey(row['タイプ']);
  skills.leader = skills.leader || '';
  skills.connect = { range: (parts[0] || '').trim(), cells: normalizeCells(existingConnect.cells), effect: (parts.slice(1).join('／') || '').trim() };
  skills.costume = row['衣装スキル'] || '';
  skills.special = row['SPスキル'] || '';
  skills.active = row['アクティブスキル'] || '';
  skills.passive = row['パッシブスキル'] || '';
  card[4] = skills;
}
fs.writeFileSync(cardPath, formatCardData(cards), 'utf8');

let editor = fs.readFileSync(editorPath, 'utf8');
editor = editor.replace(/`r`n/g, '\n');
editor = editor.replace('<td><input type="number" class="rarity" value="${safeData[0]}" min="1" max="5"></td>\n            <td><input type="text" class="name"', '<td><input type="number" class="rarity" value="${safeData[0]}" min="1" max="5"></td>\n            <td>\n                <select class="card-type">\n                    <option value="" ${typeVal === "" ? "selected" : ""}>未設定</option>\n                    <option value="cute" ${typeVal === "cute" ? "selected" : ""}>❤ キュート</option>\n                    <option value="pure" ${typeVal === "pure" ? "selected" : ""}>🍃 ピュア</option>\n                    <option value="happy" ${typeVal === "happy" ? "selected" : ""}>☀ ハッピー</option>\n                </select>\n            </td>\n            <td><input type="text" class="name"');
if (!/function normalizeCardType\(value\)/.test(editor)) {
  editor = editor.replace('function jsString(str) {', 'function normalizeCardType(value) {\n    const normalized = String(value || "").trim().toLowerCase();\n    if (["cute", "キュート", "キュートタイプ", "❤", "赤"].includes(normalized)) return "cute";\n    if (["pure", "ピュア", "ピュアタイプ", "🍃", "緑"].includes(normalized)) return "pure";\n    if (["happy", "ハッピー", "ハッピータイプ", "☀", "黄", "黄色"].includes(normalized)) return "happy";\n    return "";\n}\n\nfunction jsString(str) {');
}
fs.writeFileSync(editorPath, editor, 'utf8');

let main = fs.readFileSync(mainPath, 'utf8');
if (!/function normalizeCardType\(value\)/.test(main)) {
  const helper = [
    'function normalizeCardType(value) {',
    "    const normalized = String(value || '').trim().toLowerCase();",
    '    if (["cute", "キュート", "キュートタイプ", "❤", "赤"].includes(normalized)) return "cute";',
    '    if (["pure", "ピュア", "ピュアタイプ", "🍃", "緑"].includes(normalized)) return "pure";',
    '    if (["happy", "ハッピー", "ハッピータイプ", "☀", "黄", "黄色"].includes(normalized)) return "happy";',
    '    return "";',
    '}',
    '',
    'function getCardTypeLabel(type) {',
    '    const normalized = normalizeCardType(type);',
    '    if (normalized === "cute") return "❤ キュートタイプ";',
    '    if (normalized === "pure") return "🍃 ピュアタイプ";',
    '    if (normalized === "happy") return "☀ ハッピータイプ";',
    '    return "";',
    '}',
    '',
    'function createTypeBadge(type) {',
    '    const normalized = normalizeCardType(type);',
    '    const label = getCardTypeLabel(normalized);',
    "    return label ? '<span class=\"card-type-badge type-' + normalized + '\">' + escapeHtml(label) + '</span>' : '';",
    '}',
    '',
    'function createConnectGrid(cells) {'
  ].join('\n');
  main = main.replace('function createConnectGrid(cells) {', helper);
}
main = main.replace('const passiveSkill = skills.passive || "\\u306a\\u3057";\n\n    if (mImg)', 'const passiveSkill = skills.passive || "\\u306a\\u3057";\n    const cardType = normalizeCardType(skills.type);\n\n    if (mImg)');
main = main.replace('mRarity.innerHTML = `<span class="star-group rarity-${rarityNum}">${"\\u2605".repeat(rarityNum)}</span>`;', 'mRarity.innerHTML = `<span class="star-group rarity-${rarityNum}">${"\\u2605".repeat(rarityNum)}</span>${createTypeBadge(cardType)}`;');
fs.writeFileSync(mainPath, main, 'utf8');

let css = fs.readFileSync(cssPath, 'utf8');
if (!/\.card-type-badge/.test(css)) {
  css += '\n/* Card type badge */\n.card-type-badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  margin-left: 10px;\n  padding: 4px 10px;\n  border: 2px solid currentColor;\n  border-radius: 999px;\n  font-size: 13px;\n  line-height: 1;\n  font-weight: 800;\n  vertical-align: middle;\n  background: rgba(255, 255, 255, 0.72);\n}\n.card-type-badge.type-cute { color: #ff4f78; background: rgba(255, 96, 132, 0.18); }\n.card-type-badge.type-pure { color: #25b965; background: rgba(101, 255, 70, 0.18); }\n.card-type-badge.type-happy { color: #f4ad13; background: rgba(255, 215, 73, 0.22); }\n@media (max-width: 520px) {\n  .card-type-badge {\n    margin-left: 6px;\n    padding: 3px 8px;\n    font-size: 11px;\n  }\n}\n';
}
fs.writeFileSync(cssPath, css, 'utf8');

console.log(JSON.stringify({csvRows: csvRows.length, cardRows: cards.length, matched, unmatched: unmatched.slice(0, 20), unmatchedCount: unmatched.length}, null, 2));

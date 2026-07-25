function getCardImageGroup(fileName) {
    const match = String(fileName || '').match(/^(\d+)/);
    if (!match) return 'misc';
    return String(Math.floor((Number(match[1]) - 1) / 50) + 1);
}

function getCardImagePath(fileName, isThumb = false) {
    const group = getCardImageGroup(fileName);
    return `character_card/${isThumb ? 'thumb/' : ''}${group}/${fileName}`;
}
const debutGroupOrder = [
    "ホロライブ0期生",
    "ホロライブ1期生",
    "ホロライブ2期生",
    "ホロライブゲーマーズ",
    "ホロライブ3期生",
    "ホロライブ4期生",
    "hololive Indonesia 1期生",
    "ホロライブ5期生",
    "秘密結社holoX",
    "hololive English -Myth-",
    "hololive Indonesia 2期生",
    "hololive English -Promise-",
    "hololive Indonesia 3期生",
    "hololive English -Advent-",
    "ReGLOSS"
];

const debutMemberOrder = [
    "ときのそら", "ロボ子さん", "さくらみこ", "AZKi", "星街すいせい",
    "アキ・ローゼンタール", "赤井はあと", "夏色まつり", "白上フブキ",
    "百鬼あやめ", "癒月ちょこ", "大空スバル",
    "大神ミオ", "猫又おかゆ", "戌神ころね",
    "兎田ぺこら", "不知火フレア", "白銀ノエル", "宝鐘マリン",
    "角巻わため", "常闇トワ", "姫森ルーナ",
    "アユンダ・リス", "ムーナ・ホシノヴァ", "アイラニ・イオフィフティーン",
    "雪花ラミィ", "桃鈴ねね", "獅白ぼたん", "尾丸ポルカ",
    "森カリオペ", "小鳥遊キアラ", "一伊那尓栖",
    "クレイジー・オリー", "アーニャ・メルフィッサ", "パヴォリア・レイネ",
    "IRyS", "オーロ・クロニー", "ハコス・ベールズ",
    "ラプラス・ダークネス", "鷹嶺ルイ", "博衣こより", "風真いろは",
    "ベスティア・ゼータ", "カエラ・コヴァルスキア", "こぼ・かなえる",
    "シオリ・ノヴェラ", "古石ビジュー", "ネリッサ・レイヴンクロフト", "フワワ・アビスガード", "モココ・アビスガード",
    "音乃瀬奏", "一条莉々華", "儒烏風亭らでん", "轟はじめ"
];

let currentPage = 1;
const itemsPerPage = 28;
let currentSort = 'default';
let currentTypeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    renderCards();
    setupEventListeners();
});

function getCardTitleParts(fullName) {
    const value = String(fullName || '').trim();
    const member = debutMemberOrder.find(name => value.endsWith(` ${name}`));
    if (!member) return { title: value, member: '' };
    return {
        title: value.slice(0, -member.length).trim(),
        member
    };
}
function getListCardTitle(fullName) {
    const value = String(fullName || '').trim();
    const member = debutMemberOrder.find(name => value.endsWith(` ${name}`));
    return member ? value.slice(0, -member.length).trim() : value;
}
function renderCards() {
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filtered = [...cardData];

    if (keyword !== '') {
        filtered = filtered.filter(card => {
            const cardName = card[1] ? card[1].toLowerCase() : '';
            const searchWords = card[3] ? card[3].toLowerCase() : '';
            return cardName.includes(keyword) || searchWords.includes(keyword);
        });
    }

    if (currentTypeFilter !== 'all') {
        filtered = filtered.filter(card => normalizeCardType(card[4]?.type) === currentTypeFilter);
    }


    filtered.sort((a, b) => {
        if (currentSort === 'rarity-desc' || currentSort === 'rarity-asc') {
            const rA = Number(a[0]) || 0;
            const rB = Number(b[0]) || 0;
            if (rA !== rB) {
                return currentSort === 'rarity-desc' ? rB - rA : rA - rB;
            }
        }

        if (currentSort === 'debut-asc') {
            const genA = a[3] ? a[3].split(',')[1]?.trim() : '';
            const genB = b[3] ? b[3].split(',')[1]?.trim() : '';
            const groupA = debutGroupOrder.indexOf(genA);
            const groupB = debutGroupOrder.indexOf(genB);
            const orderA = groupA === -1 ? 999 : groupA;
            const orderB = groupB === -1 ? 999 : groupB;
            if (orderA !== orderB) return orderA - orderB;

            const memberA = debutMemberOrder.indexOf(a[1]);
            const memberB = debutMemberOrder.indexOf(b[1]);
            const memberOrderA = memberA === -1 ? 999 : memberA;
            const memberOrderB = memberB === -1 ? 999 : memberB;
            if (memberOrderA !== memberOrderB) return memberOrderA - memberOrderB;
        }

        const idA = cardData.indexOf(a);
        const idB = cardData.indexOf(b);
        return currentSort === 'default' ? idB - idA : idA - idB;
    });

    const totalCountEl = document.getElementById('total-count');
    const hitCountEl = document.getElementById('hit-count');
    if (totalCountEl) totalCountEl.textContent = cardData.length;
    if (hitCountEl) hitCountEl.textContent = filtered.length;

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filtered.slice(startIndex, endIndex);

    const cardContainer = document.getElementById('card-list-container');
    if (cardContainer) {
        cardContainer.innerHTML = '';
        if (pageItems.length === 0) {
            cardContainer.innerHTML = '<p style="text-align:center; width:100%; color:#999; margin:40px 0;">該当するカードが見つかりません</p>';
        } else {
            pageItems.forEach(card => {
                const cardEl = document.createElement('div');
                cardEl.className = 'character-card';
                cardEl.innerHTML = `
                    <div class="card-image-wrapper">
                        <img src="${getCardImagePath(card[2], true)}" alt="${card[1]}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${getCardImagePath(card[2])}';">
                    </div>
                    <p class="list-card-name">${escapeHtml(getListCardTitle(card[1]))}</p>
                `;
                cardEl.addEventListener('click', () => openModal(card));
                cardContainer.appendChild(cardEl);
            });
        }
    }

    const pageInfo = document.getElementById('current-page-num');
    if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`;
    document.querySelectorAll('.type-filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            currentTypeFilter = button.dataset.type || 'all';
            document.querySelectorAll('.type-filter-btn').forEach(item => {
                item.classList.toggle('active', item === button);
            });
            currentPage = 1;
            renderCards();
        });
    });

    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatSkillText(value) {
    return escapeHtml(value).replace(/／/g, "<br>");
}
function uniqueConnectCells(values) {
    return Array.from(new Set((values || [])
        .map(value => Number(value))
        .filter(value => Number.isInteger(value) && value >= 0 && value < 25)))
        .sort((a, b) => a - b);
}

function normalizeConnectCellMap(cells) {
    if (cells && typeof cells === 'object' && !Array.isArray(cells)) {
        return {
            yellow: uniqueConnectCells(cells.yellow || cells.y || []),
            green: uniqueConnectCells(cells.green || cells.g || [])
        };
    }
    if (Array.isArray(cells)) {
        return { yellow: uniqueConnectCells(cells), green: [] };
    }
    return { yellow: [], green: [] };
}

function normalizeConnectSkill(connect) {
    if (connect && typeof connect === 'object' && !Array.isArray(connect)) {
        return {
            range: connect.range || "なし",
            effect: connect.effect || "なし",
            cells: normalizeConnectCellMap(connect.cells)
        };
    }

    return {
        range: "なし",
        effect: connect || "なし",
        cells: { yellow: [], green: [] }
    };
}

function normalizeCardType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (["cute", "キュート", "キュートタイプ", "❤", "赤"].includes(normalized)) return "cute";
    if (["pure", "ピュア", "ピュアタイプ", "🍃", "緑"].includes(normalized)) return "pure";
    if (["happy", "ハッピー", "ハッピータイプ", "☀", "黄", "黄色"].includes(normalized)) return "happy";
    return "";
}

function getCardTypeLabel(type) {
    const normalized = normalizeCardType(type);
    if (normalized === "cute") return "❤ キュートタイプ";
    if (normalized === "pure") return "🍃 ピュアタイプ";
    if (normalized === "happy") return "☀ ハッピータイプ";
    return "";
}

function createTypeBadge(type) {
    const normalized = normalizeCardType(type);
    const label = getCardTypeLabel(normalized);
    return label ? '<span class="card-type-badge type-' + normalized + '">' + escapeHtml(label) + '</span>' : '';
}

function createConnectGrid(cells) {
    const cellMap = normalizeConnectCellMap(cells);
    const yellowCells = new Set(cellMap.yellow);
    const greenCells = new Set(cellMap.green);
    let html = '';

    for (let i = 0; i < 25; i++) {
        const classes = ['connect-cell'];
        if (yellowCells.has(i)) classes.push('is-yellow');
        if (greenCells.has(i)) classes.push('is-green');
        if (i === 12) classes.push('is-center');
        html += `<span class="${classes.join(' ')}"></span>`;
    }

    return html;
}

function openModal(card) {
    const overlay = document.getElementById('image-modal');
    const mImg = document.getElementById('modal-image');
    const mRarity = document.getElementById('modal-rarity');
    const mName = document.getElementById('modal-name');
    const mSkillArea = document.getElementById('modal-text-area');

    if (!overlay) return;

    const rarityNum = Number(card[0]) || 0;
    const skills = card[4] || {};
    const connectSkill = normalizeConnectSkill(skills.connect);
    const costumeSkill = skills.costume || "なし";
    const specialSkill = skills.special || "\u306a\u3057";
    const activeSkill = skills.active || "\u306a\u3057";
    const passiveSkill = skills.passive || "なし";
    const cardType = normalizeCardType(skills.type);

    if (mImg) mImg.src = getCardImagePath(card[2]);
    if (mName) {
        const titleParts = getCardTitleParts(card[1]);
        mName.innerHTML = titleParts.member
            ? `${escapeHtml(titleParts.title)}<br><span class="modal-member-name">${escapeHtml(titleParts.member)}</span>`
            : escapeHtml(titleParts.title);
    }
    
    if (mRarity) {
        mRarity.innerHTML = `<span class="star-group rarity-${rarityNum}">${"\u2605".repeat(rarityNum)}</span>${createTypeBadge(cardType)}`;
    }
    
    mSkillArea.innerHTML = `
        <section class="skill-section connect-skill-section">
            <h3>\u30b3\u30cd\u30af\u30c8\u52b9\u679c</h3>
            <div class="connect-skill-layout">
                <div class="connect-grid" aria-label="\u30b3\u30cd\u30af\u30c8\u52b9\u679c\u7bc4\u56f2">${createConnectGrid(connectSkill.cells)}</div>
                <div class="connect-skill-text">
                    <span class="connect-range-label">${escapeHtml(connectSkill.range)}</span>
                    <p>${formatSkillText(connectSkill.effect)}</p>
                </div>
            </div>
        </section>
        <section class="skill-section costume-skill-section">
            <h3>\u8863\u88c5\u30b9\u30ad\u30eb</h3>
            <p>${formatSkillText(costumeSkill)}</p>
        </section>
        <section class="skill-section card-skill-section">
            <h3>\u30b9\u30ad\u30eb\u8a73\u7d30</h3>
            <div class="skill-card-grid">
                <div class="skill-card special-card">
                    <strong>\u30b9\u30da\u30b7\u30e3\u30eb\u30b9\u30ad\u30eb</strong>
                    <p>${formatSkillText(specialSkill)}</p>
                </div>
                <div class="skill-card active-card">
                    <strong>\u30a2\u30af\u30c6\u30a3\u30d6\u30b9\u30ad\u30eb</strong>
                    <p>${formatSkillText(activeSkill)}</p>
                </div>
                <div class="skill-card passive-card">
                    <strong>\u30d1\u30c3\u30b7\u30d6\u30b9\u30ad\u30eb</strong>
                    <p>${formatSkillText(passiveSkill)}</p>
                </div>
            </div>
        </section>
    `;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function setupFilterPanel() {
    const toggle = document.getElementById('filter-toggle');
    const panel = document.getElementById('card-filter-panel');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', () => {
        const isOpen = panel.classList.toggle('is-open');
        toggle.classList.toggle('is-open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        panel.setAttribute('aria-hidden', String(!isOpen));
    });
}
function scrollCardPageTop() {
    requestAnimationFrame(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
}
function setupEventListeners() {
    setupFilterPanel();
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            renderCards();
        });
    }

    const sortSelect = document.getElementById('sort-select');
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
            document.querySelectorAll('.type-filter-btn').forEach(item => {
                item.classList.toggle('active', item === button);
            });
            currentPage = 1;
            renderCards();
        });
    });

    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCards();
                scrollCardPageTop();
            }
        });
    }

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            renderCards();
            scrollCardPageTop();
        });
    }

    const overlay = document.getElementById('image-modal');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.id === 'modal-image' || e.target.id === 'close-modal') {
                overlay.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    }
}











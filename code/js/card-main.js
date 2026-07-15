function getCardImageGroup(fileName) {
    const match = String(fileName || '').match(/^(\d+)/);
    if (!match) return 'misc';
    return String(Math.floor((Number(match[1]) - 1) / 50) + 1);
}

function getCardImagePath(fileName, isThumb = false) {
    const group = getCardImageGroup(fileName);
    return `character_card/${isThumb ? 'thumb/' : ''}${group}/${fileName}`;
}
const generationOrder = ["0期生", "1期生", "2期生", "ゲーマーズ", "3期生", "4期生", "5期生", "秘密結社holoX", "ReGLOSS", "Advent"];

const skillMaster = {
    1: "スキルアップ10%",
    2: "スキルアップ15%",
    3: "回復",
    4: "判定強化",
    5: "判定強化",
    6: "テスト用判定",
    10: "超絶大回復",
    100: "伝説のスキル"
};

let currentPage = 1;
const itemsPerPage = 28;
let currentSort = 'default';
let currentSkillFilter = 'すべて'; 

document.addEventListener('DOMContentLoaded', () => {
    createSkillFilterButtons(); 
    renderCards();
    setupEventListeners();
});

function createSkillFilterButtons() {
    const container = document.getElementById('skill-filter-container');
    if (!container) return;

    container.innerHTML = ''; 

    const finalSkills = ["すべて"];

    Object.values(skillMaster).forEach(skillName => {
        if (!finalSkills.includes(skillName)) {
            finalSkills.push(skillName);
        }
    });

    finalSkills.forEach(skill => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'skill-btn';
        if (skill === currentSkillFilter) {
            button.classList.add('active');
        }
        button.textContent = skill;

        button.addEventListener('click', () => {
            document.querySelectorAll('.skill-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            currentSkillFilter = skill;
            currentPage = 1; 
            renderCards();
        });
        container.appendChild(button);
    });
}

function getSkillName(skillInput) {
    if (skillInput !== null && skillInput !== undefined) {
        const key = String(skillInput).trim();
        if (skillMaster[key]) {
            return skillMaster[key];
        }
    }
    return skillInput ? String(skillInput).trim() : "";
}

function renderCards() {
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filtered = [...cardData];

    if (keyword !== '') {
        filtered = filtered.filter(card => {
            const cardName = card[1] ? card[1].toLowerCase() : '';
            const searchWords = card[4] ? card[4].toLowerCase() : '';
            return cardName.includes(keyword) || searchWords.includes(keyword);
        });
    }

    if (currentSkillFilter !== 'すべて') {
        filtered = filtered.filter(card => {
            const cardSkillName = getSkillName(card[3]);
            return cardSkillName === currentSkillFilter;
        });
    }

    filtered.sort((a, b) => {
        if (currentSort === 'rarity-desc' || currentSort === 'rarity-asc') {
            const rA = Number(a[0]) || 0;
            const rB = Number(b[0]) || 0;
            if (rA !== rB) {
                return currentSort === 'rarity-desc' ? rB - rA : rA - rB;
            }
        }

        const genA = a[4] ? a[4].split(',')[1]?.trim() : '';
        const genB = b[4] ? b[4].split(',')[1]?.trim() : '';
        const indexA = generationOrder.indexOf(genA);
        const indexB = generationOrder.indexOf(genB);
        const orderA = indexA === -1 ? 999 : indexA;
        const orderB = indexB === -1 ? 999 : indexB;

        if (orderA !== orderB) return orderA - orderB;

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
                    <p class="list-card-name">${card[1]}</p>
                `;
                cardEl.addEventListener('click', () => openModal(card));
                cardContainer.appendChild(cardEl);
            });
        }
    }

    const pageInfo = document.getElementById('current-page-num');
    if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`;

    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

function openModal(card) {
    const overlay = document.getElementById('image-modal');
    const mImg = document.getElementById('modal-image');
    const mRarity = document.getElementById('modal-rarity');
    const mName = document.getElementById('modal-name');
    const mSkillArea = document.getElementById('modal-text-area');

    if (!overlay) return;

    const rarityNum = Number(card[0]) || 0;
    
    const skills = card[5] || { leader: "なし", special: "なし", active: "なし", passive: "なし" };
    const leaderSkill = skills.leader || "なし";
    const specialSkill = skills.special || "なし";
    const activeSkill = skills.active || "なし";
    const passiveSkill = skills.passive || "なし";

    if (mImg) mImg.src = getCardImagePath(card[2]);
    if (mName) mName.textContent = card[1];
    
    if (mRarity) {
        mRarity.innerHTML = `<span class="star-group rarity-${rarityNum}">${"★".repeat(rarityNum)}</span>`;
    }
    
    mSkillArea.innerHTML = `
        <div class="skill-card leader-card">
            <strong>リーダースキル</strong>
            <p>${leaderSkill}</p>
        </div>
        <div class="skill-card special-card">
            <strong>スペシャルスキル</strong>
            <p>${specialSkill}</p>
        </div>
        <div class="skill-card active-card">
            <strong>アクティブスキル</strong>
            <p>${activeSkill}</p>
        </div>
        <div class="skill-card passive-card">
            <strong>パッシブスキル</strong>
            <p>${passiveSkill}</p>
        </div>
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

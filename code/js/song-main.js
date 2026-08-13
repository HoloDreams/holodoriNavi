const itemsPerPage = 30;
let currentPage = 1;
let filteredSongs = [];

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function getSongDetailHref(songName) {
    return `music_detail.html?song=${encodeURIComponent(songName)}`;
}
function getSongCoverSrc(songData) {
    const songName = songData[0];
    const fileName = songData[3] || `${songName}.jpg`;
    return `img/cover_art/${encodeURIComponent(fileName)}`;
}

function parseSongReleaseDate(value) {
    if (!value) return 0;
    const text = String(value).trim();
    const jpMatch = text.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
    if (jpMatch) {
        return new Date(Number(jpMatch[1]), Number(jpMatch[2]) - 1, Number(jpMatch[3])).getTime();
    }
    const slashMatch = text.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
    if (slashMatch) {
        return new Date(Number(slashMatch[1]), Number(slashMatch[2]) - 1, Number(slashMatch[3])).getTime();
    }
    const parsed = Date.parse(text);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function getSongReleaseDateValue(item) {
    const extra = item.data && item.data[4] ? item.data[4] : {};
    return parseSongReleaseDate(extra.releaseDate || extra.date || '');
}

function getSongSortLevel(item) {
    const levels = item.data[2] || {};
    if (item.displayDiff && item.displayDiff !== 'none') {
        return Number(levels[item.displayDiff] || 0);
    }
    return Math.max(
        Number(levels.easy || 0),
        Number(levels.normal || 0),
        Number(levels.hard || 0),
        Number(levels.expert || 0)
    );
}

function getSongSortBpm(item) {
    const extra = item.data && item.data[4] ? item.data[4] : {};
    const rawBpm = extra.bpm || item.data[5] || '';
    const numbers = String(rawBpm).match(/\d+(?:\.\d+)?/g);
    if (!numbers || numbers.length === 0) return 0;
    return Math.max(...numbers.map(Number));
}
function sortSongResults(results, sortMode) {
    if (sortMode === 'default') return results;

    return results
        .map((item, index) => ({ ...item, originalIndex: index }))
        .sort((a, b) => {
            const fallback = (a.sourceIndex ?? a.originalIndex) - (b.sourceIndex ?? b.originalIndex);

            if (sortMode === 'release-desc') {
                const dateDiff = getSongReleaseDateValue(b) - getSongReleaseDateValue(a);
                return dateDiff !== 0 ? dateDiff : fallback;
            }
            if (sortMode === 'bpm-desc' || sortMode === 'bpm-asc') {
                const bpmA = getSongSortBpm(a);
                const bpmB = getSongSortBpm(b);
                const bpmDiff = sortMode === 'bpm-asc'
                    ? bpmA - bpmB
                    : bpmB - bpmA;
                return bpmDiff !== 0 ? bpmDiff : fallback;
            }

            if (sortMode === 'title-ja') {
                const titleA = a.data[0] || '';
                const titleB = b.data[0] || '';
                const titleDiff = titleA.localeCompare(titleB, 'ja');
                return titleDiff !== 0 ? titleDiff : fallback;
            }

            const levelA = getSongSortLevel(a);
            const levelB = getSongSortLevel(b);
            const levelDiff = sortMode === 'level-asc'
                ? levelA - levelB
                : levelB - levelA;
            return levelDiff !== 0 ? levelDiff : fallback;
        })
        .map(({ originalIndex, ...item }) => item);
}

function isLevelFilterActive() {
    const diffSelect = document.getElementById('difficulty-select');
    const minInput = document.getElementById('level-min');
    const maxInput = document.getElementById('level-max');

    return (
        (diffSelect && diffSelect.value !== 'none') ||
        (minInput && minInput.value !== '') ||
        (maxInput && maxInput.value !== '')
    );
}

function updateSortOptions() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;

    const levelOptions = sortSelect.querySelectorAll('option[value="level-desc"], option[value="level-asc"]');
    const showLevelSort = isLevelFilterActive();

    levelOptions.forEach(option => {
        option.hidden = !showLevelSort;
        option.disabled = !showLevelSort;
    });

    if (!showLevelSort && (sortSelect.value === 'level-desc' || sortSelect.value === 'level-asc')) {
        sortSelect.value = 'default';
    }
}

function updateDisplay() {
    const searchInput = document.getElementById('search-input');
    const diffSelect = document.getElementById('difficulty-select');
    const minInput = document.getElementById('level-min');
    const maxInput = document.getElementById('level-max');
    const sortSelect = document.getElementById('sort-select');

    // 1. テキストキーワードの取得
    const keywords = searchInput ? searchInput.value.toLowerCase().replace(/ /g, ' ').split(' ').filter(word => word !== "") : [];
    
    // 2. 難易度・範囲数値の取得
    const selectedDiff = diffSelect ? diffSelect.value : 'none'; 
    const minLevel = minInput && minInput.value !== "" ? parseInt(minInput.value, 10) : null;
    const maxLevel = maxInput && maxInput.value !== "" ? parseInt(maxInput.value, 10) : null;
    updateSortOptions();
    const sortMode = sortSelect ? sortSelect.value : 'default';

    let results = [];
    let totalFumenCount = 0;

    for (let i = 0; i < songList.length; i++) {
        const songData = songList[i];
        const levels = songData[2] || {};

        ['easy', 'normal', 'hard', 'expert'].forEach(d => {
            if (levels[d] !== undefined) {
                totalFumenCount++;
            }
        });

        const songName = (songData[0] || "").toLowerCase();
        const memberName = (songData[1] || "").toLowerCase();
        const combinedText = songName + " " + memberName;
        const textMatches = keywords.every(keyword => combinedText.includes(keyword));

        if (!textMatches) continue;

        if (selectedDiff === 'none' && minLevel === null && maxLevel === null) {
            results.push({
                data: songData,
                displayDiff: 'none',
sourceIndex: i
            });
            continue;
        }

        if (selectedDiff !== 'none') {
            const targetLevel = levels[selectedDiff];
            if (targetLevel !== undefined) {
                if (minLevel !== null && targetLevel < minLevel) continue;
                if (maxLevel !== null && targetLevel > maxLevel) continue;
                
                results.push({
                    data: songData,
                    displayDiff: selectedDiff,
                    sourceIndex: i
                });
            }
            continue;
        }

        const diffList = ['expert', 'hard', 'normal', 'easy'];
        diffList.forEach(diff => {
            const targetLevel = levels[diff];
            if (targetLevel !== undefined) {
                if (minLevel !== null && targetLevel < minLevel) return;
                if (maxLevel !== null && targetLevel > maxLevel) return;

                results.push({
                    data: songData,
                    displayDiff: diff,
                    sourceIndex: i
                });
            }
        });
    }

    filteredSongs = sortSongResults(results, sortMode);
    const pageInfoEl = document.getElementById('page-info');
    if (pageInfoEl) {
        const isLevelFiltered = (selectedDiff !== 'none' || minLevel !== null || maxLevel !== null);
        if (isLevelFiltered) {
            pageInfoEl.innerHTML = `全 <span id="total-count">${totalFumenCount}</span> 譜面中、<span id="hit-count">${filteredSongs.length}</span> 譜面を表示`;
        } else {
            pageInfoEl.innerHTML = `全 <span id="total-count">${songList.length}</span> 曲中、<span id="hit-count">${filteredSongs.length}</span> 曲を表示`;
        }
    }

    const maxPage = Math.ceil(filteredSongs.length / itemsPerPage) || 1;
    if (currentPage > maxPage) {
        currentPage = maxPage;
    }

    displaySongs(currentPage);
}

function scrollSongPageTop() {
    const topTarget = document.querySelector('main') || document.body;
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (topTarget && typeof topTarget.scrollIntoView === 'function') {
        topTarget.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
}

function displaySongs(page) {
    const container = document.getElementById('song-list-container');
    const pageInfo = document.getElementById('current-page-num');
    
    if (!container) return;

    container.innerHTML = "";
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const slicedSongs = filteredSongs.slice(start, end);

    if (slicedSongs.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px; color: #888; font-size: 18px;">
            該当する楽曲が見つかりませんでした。キーワードやレベル制限を変更して再度検索してください。
        </p>`;
    }

    slicedSongs.forEach(item => {
        const songName = item.data[0];
        const coverSrc = getSongCoverSrc(item.data);
        const levels = item.data[2] || {};
        const displayDiff = item.displayDiff;

        const card = document.createElement('div');
        
        if (displayDiff !== 'none') {
            card.className = `song-card border-${displayDiff}`;
        } else {
            card.className = 'song-card';
        }
        
        let badgeHtml = "";
        if (displayDiff !== 'none') {
            const currentLevelValue = levels[displayDiff] || "";
            badgeHtml = `<div class="difficulty-badge badge-${displayDiff}">${currentLevelValue}</div>`;
        }

        const detailHref = getSongDetailHref(songName);
        const imageHtml = `
            <div class="card-link-wrapper">
                ${badgeHtml}
                <img src="${coverSrc}" alt="${escapeHtml(songName)}" loading="lazy">
            </div>
            <p>${escapeHtml(songName)}</p>
        `;

        card.classList.add('song-card--has-detail');
        card.innerHTML = `<a class="song-detail-link" href="${detailHref}">${imageHtml}</a>`;
        container.appendChild(card);
    });

    const maxPage = Math.ceil(filteredSongs.length / itemsPerPage) || 1;
    if (pageInfo) {
        pageInfo.innerText = `${page} / ${maxPage}`;
    }
    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) prevBtn.disabled = (page === 1);
    if (nextBtn) nextBtn.disabled = (page === maxPage);
}

function setupSongSuggestions() {
    const suggestions = document.getElementById('song-suggestions');
    if (!suggestions) return;
    const values = new Set();
    songList.forEach(song => {
        if (song[0]) values.add(song[0]);
        if (song[1]) values.add(song[1]);
    });
    suggestions.innerHTML = Array.from(values)
        .filter(Boolean)
        .map(value => `<option value="${escapeHtml(value)}"></option>`)
        .join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const diffSelect = document.getElementById('difficulty-select');
    const minInput = document.getElementById('level-min');
    const maxInput = document.getElementById('level-max');
    const sortSelect = document.getElementById('sort-select');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    setupSongSuggestions();

    if (minInput && sessionStorage.getItem('level-min-value')) {
        minInput.value = sessionStorage.getItem('level-min-value');
    }
    if (maxInput && sessionStorage.getItem('level-max-value')) {
        maxInput.value = sessionStorage.getItem('level-max-value');
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            updateDisplay();
        });
    }

    if (diffSelect) {
        diffSelect.addEventListener('change', () => {
            currentPage = 1;
            updateDisplay();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentPage = 1;
            updateDisplay();
            scrollSongPageTop();
        });
    }

    // ★修正ポイント：入力時に数値を一時保存（保存することでページ切り替えやリロードでも残る）
    [minInput, maxInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                sessionStorage.setItem(input.id + '-value', input.value); // 値を記憶
                currentPage = 1;
                updateDisplay();
            });
        }
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displaySongs(currentPage);
                scrollSongPageTop();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const maxPage = Math.ceil(filteredSongs.length / itemsPerPage);
            if (currentPage < maxPage) {
                currentPage++;
                displaySongs(currentPage);
                scrollSongPageTop();
            }
        });
    }

    updateDisplay();
});










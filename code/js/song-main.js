const itemsPerPage = 30;
let currentPage = 1;
let filteredSongs = [];
let showFavoritesOnly = false;
const favoriteStorageKey = 'holodori-favorite-songs';

function getSongKey(songName) {
    return String(songName || '').trim();
}

function loadFavoriteSongs() {
    try {
        const saved = JSON.parse(localStorage.getItem(favoriteStorageKey) || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function saveFavoriteSongs(favorites) {
    localStorage.setItem(favoriteStorageKey, JSON.stringify(favorites));
}

function isFavoriteSong(songName) {
    return loadFavoriteSongs().includes(getSongKey(songName));
}

function toggleFavoriteSong(songName) {
    const key = getSongKey(songName);
    const favorites = loadFavoriteSongs();
    const existingIndex = favorites.indexOf(key);
    if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push(key);
    }
    saveFavoriteSongs(favorites);
    return favorites.includes(key);
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
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

function sortSongResults(results, sortMode) {
    if (sortMode !== 'level-desc') return results;
    return results
        .map((item, index) => ({ ...item, originalIndex: index }))
        .sort((a, b) => {
            const levelDiff = getSongSortLevel(b) - getSongSortLevel(a);
            return levelDiff !== 0 ? levelDiff : a.originalIndex - b.originalIndex;
        })
        .map(({ originalIndex, ...item }) => item);
}

function updateSortVisibility() {
    const diffSelect = document.getElementById('difficulty-select');
    const minInput = document.getElementById('level-min');
    const maxInput = document.getElementById('level-max');
    const sortContainer = document.querySelector('.sort-container');
    const sortSelect = document.getElementById('sort-select');
    if (!sortContainer) return;

    const isLevelFilterEnabled =
        (diffSelect && diffSelect.value !== 'none') ||
        (minInput && minInput.value !== '') ||
        (maxInput && maxInput.value !== '');

    sortContainer.hidden = !isLevelFilterEnabled;
    if (!isLevelFilterEnabled && sortSelect) {
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
    updateSortVisibility();
    const sortMode = sortSelect ? sortSelect.value : 'default';

    let results = [];
    let totalFumenCount = 0;

    for (let i = songList.length - 1; i >= 0; i--) {
        const songData = songList[i];
        const levels = songData[2] || {};

        ['easy', 'normal', 'hard', 'expert'].forEach(d => {
            if (levels[d] !== undefined) {
                totalFumenCount++;
            }
        });

        if (showFavoritesOnly && !isFavoriteSong(songData[0])) continue;

        const songName = (songData[0] || "").toLowerCase();
        const memberName = (songData[1] || "").toLowerCase();
        const combinedText = songName + " " + memberName;
        const textMatches = keywords.every(keyword => combinedText.includes(keyword));

        if (!textMatches) continue;

        if (selectedDiff === 'none' && minLevel === null && maxLevel === null) {
            results.push({
                data: songData,
                displayDiff: 'none' 
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
                    displayDiff: selectedDiff
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
                    displayDiff: diff
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

        const isFavorite = isFavoriteSong(songName);
        card.innerHTML = `
            <div class="card-link-wrapper">
                ${badgeHtml}
                <button type="button" class="favorite-song-btn${isFavorite ? ' is-favorite' : ''}" data-song-name="${escapeHtml(songName)}" aria-label="お気に入り">\u2605</button>
                <a href="\u53ce\u9332\u697d\u66f2\u4e00\u89a7/${encodeURIComponent(songName)}.html">
                    <img src="img/cover_art/${songName}.jpg" alt="${songName}" loading="lazy">
                </a>
            </div>
            <p>${songName}</p>
        `;
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

function getUniqueFilteredSongData() {
    const seen = new Set();
    const source = filteredSongs.length ? filteredSongs.map(item => item.data) : songList;
    return source.filter(song => {
        const key = getSongKey(song[0]);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function showRandomSong() {
    const resultEl = document.getElementById('random-song-result');
    if (!resultEl) return;
    const candidates = getUniqueFilteredSongData();
    if (!candidates.length) {
        resultEl.hidden = false;
        resultEl.innerHTML = '条件に合う楽曲がありません。';
        return;
    }
    const song = candidates[Math.floor(Math.random() * candidates.length)];
    const songName = song[0];
    const levels = song[2] || {};
    const levelText = ['easy', 'normal', 'hard', 'expert']
        .map(diff => levels[diff] !== undefined ? `${diff.toUpperCase()} ${levels[diff]}` : '')
        .filter(Boolean)
        .join(' / ');
    resultEl.hidden = false;
    resultEl.innerHTML = `
        <a class="random-song-card" href="\u53ce\u9332\u697d\u66f2\u4e00\u89a7/${encodeURIComponent(songName)}.html">
            <img src="img/cover_art/${songName}.jpg" alt="${escapeHtml(songName)}" loading="lazy">
            <span class="random-song-text">
                <strong>\u30e9\u30f3\u30c0\u30e01\u66f2\uff1a${escapeHtml(songName)}</strong>
                <small>${escapeHtml(levelText)}</small>
            </span>
        </a>`;
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const diffSelect = document.getElementById('difficulty-select');
    const minInput = document.getElementById('level-min');
    const maxInput = document.getElementById('level-max');
    const sortSelect = document.getElementById('sort-select');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const randomSongBtn = document.getElementById('random-song-btn');
    const favoriteFilterBtn = document.getElementById('favorite-filter-btn');
    const songListContainer = document.getElementById('song-list-container');

    setupSongSuggestions();

    if (randomSongBtn) {
        randomSongBtn.addEventListener('click', showRandomSong);
    }

    if (favoriteFilterBtn) {
        favoriteFilterBtn.addEventListener('click', () => {
            showFavoritesOnly = !showFavoritesOnly;
            favoriteFilterBtn.classList.toggle('is-active', showFavoritesOnly);
            currentPage = 1;
            updateDisplay();
        });
    }

    if (songListContainer) {
        songListContainer.addEventListener('click', event => {
            const favoriteButton = event.target.closest('.favorite-song-btn');
            if (!favoriteButton) return;
            event.preventDefault();
            event.stopPropagation();
            const songName = favoriteButton.dataset.songName;
            const isFavorite = toggleFavoriteSong(songName);
            favoriteButton.classList.toggle('is-favorite', isFavorite);
            if (showFavoritesOnly && !isFavorite) {
                updateDisplay();
            }
        });
    }

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

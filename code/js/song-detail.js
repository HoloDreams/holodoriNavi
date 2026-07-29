const DIFFICULTIES = [
  { key: "expert", label: "EXPERT", rowClass: "ex", videoClass: "expert-video", icon: "03 expert.png" },
  { key: "hard", label: "HARD", rowClass: "hd", videoClass: "hard-video", icon: "02 hard.png" },
  { key: "normal", label: "NORMAL", rowClass: "nm", videoClass: "normal-video", icon: "01 normal.png" },
  { key: "easy", label: "EASY", rowClass: "es", videoClass: "easy-video", icon: "00 easy.png" }
];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function normalizeSongName(value) {
  return decodeURIComponent(String(value || "")).replace(/\+/g, " ").trim();
}

function getRequestedSongName() {
  const params = new URLSearchParams(window.location.search);
  return normalizeSongName(params.get("song") || params.get("title") || params.get("id") || "");
}

function getCoverSrc(song) {
  const title = song[0] || "";
  const fileName = song[3] || `${title}.jpg`;
  return `img/cover_art/${encodeURIComponent(fileName)}`;
}

function toEmbedUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("/embed/")) return raw;
  const watchMatch = raw.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = raw.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  return raw;
}

function showNotFound() {
  document.getElementById("songDetailMain")?.classList.add("is-hidden");
  document.getElementById("songNotFound")?.classList.remove("is-hidden");
}

function renderTitle(title, link) {
  const titleEl = document.getElementById("songTitle");
  if (!titleEl) return;
  const safeTitle = escapeHtml(title);
  if (link) {
    titleEl.innerHTML = `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${safeTitle}<span class="title-link-icon">🔗</span></a>`;
  } else {
    titleEl.textContent = title;
  }
}

function renderStats(song) {
  const levels = song[2] || {};
  const detail = song[4] || {};
  const combos = detail.combos || {};
  const stats = document.getElementById("songStats");
  if (!stats) return;
  stats.innerHTML = DIFFICULTIES.map(diff => {
    const level = levels[diff.key] || "?";
    const combo = combos[diff.key] || "?";
    return `<div class="stat-row ${diff.rowClass}"><img src="img/course img/${diff.icon}" alt="${diff.label}"> <span class="lv-text">Lv.${escapeHtml(level)}</span> <span class="combo-text">${escapeHtml(combo)}combo</span></div>`;
  }).join("");
}

function renderVideos(detail) {
  const videos = (detail && detail.videos) || {};
  const videoGrid = document.getElementById("videoGrid");
  const videoSection = document.getElementById("videoSection");
  if (!videoGrid || !videoSection) return;

  const html = DIFFICULTIES.map(diff => {
    const src = toEmbedUrl(videos[diff.key]);
    if (!src) return "";
    return `<div class="video-wrapper ${diff.videoClass}">
      <div class="video-header"><img src="img/course img/${diff.icon}" alt="${diff.label}"></div>
      <iframe width="560" height="315" src="${escapeHtml(src)}" title="${diff.label} 譜面確認" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>`;
  }).join("");

  videoGrid.innerHTML = html;
  videoSection.style.display = html.trim() ? "block" : "none";
}

function renderDescription(detail) {
  const desc = document.getElementById("songDescription");
  if (!desc) return;
  const text = String((detail && detail.description) || "").trim();
  desc.innerHTML = text ? `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>` : "";
}

function renderSongDetail() {
  const requestedName = getRequestedSongName();
  const sourceList = typeof songList !== "undefined" ? songList : (window.songList || []);
  const song = sourceList.find(item => item[0] === requestedName);
  if (!song) {
    showNotFound();
    return;
  }

  const title = song[0] || "";
  const detail = song[4] || {};
  const coverSrc = getCoverSrc(song);

  document.title = `${title} - 収録楽曲情報`;
  const bg = document.getElementById("blurredBackground");
  if (bg) bg.style.backgroundImage = `url('${coverSrc.replace(/'/g, "%27")}')`;

  const jacket = document.getElementById("songJacket");
  if (jacket) {
    jacket.src = coverSrc;
    jacket.alt = title;
  }

  renderTitle(title, detail.link || "");
  const bpm = document.getElementById("songBpm");
  if (bpm) bpm.textContent = detail.bpm || "?";
  renderStats(song);
  renderVideos(detail);
  renderDescription(detail);
}

document.addEventListener("DOMContentLoaded", renderSongDetail);



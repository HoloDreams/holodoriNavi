// --- DOM取得 ---
const dropZone = document.getElementById('drop_zone');
const fileInput = document.getElementById('file_input');
const previewImg = document.getElementById('preview_img');
const imgNameInput = document.getElementById('img_name');

// --- ボタンイベント ---
document.getElementById('btn-generate').onclick = generateHTML;
document.getElementById('btn-copy').onclick = copyToClipboard;
document.getElementById('btn-download').onclick = downloadHTML;

// --- 画像処理 ---
dropZone.onclick = () => fileInput.click();
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.background = '#f0e6f7'; };
dropZone.ondragleave = () => dropZone.style.background = 'transparent';
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.style.background = 'transparent';
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
};
fileInput.onchange = (e) => { if (e.target.files.length > 0) handleFile(e.target.files[0]); };

function handleFile(file) {
    imgNameInput.value = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = 'inline-block';
        dropZone.querySelector('p').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function adjustVideoSize(str) {
    if (!str) return "";
    return str.replace(/width=["']\d+["']/, 'width="560"').replace(/height=["']\d+["']/, 'height="315"');
}

// --- メイン生成ロジック ---
function generateHTML() {
    try {
        const song = document.getElementById('song_name').value;
        const img = document.getElementById('img_name').value;
        const url = document.getElementById('song_URL').value;
        const bpm = document.getElementById('bpm').value;
        const comment = document.getElementById('song_comment').value.trim();
        const imgPath = "../img/cover_art/" + img;

        const stats = {
            ex: { lv: document.getElementById('ex_lv').value, cb: document.getElementById('ex_cb').value },
            hd: { lv: document.getElementById('hd_lv').value, cb: document.getElementById('hd_cb').value },
            nm: { lv: document.getElementById('nm_lv').value, cb: document.getElementById('nm_cb').value },
            es: { lv: document.getElementById('es_lv').value, cb: document.getElementById('es_cb').value }
        };

        const vids = {
            ex: document.getElementById('ex_vid').value,
            hd: document.getElementById('hd_vid').value,
            nm: document.getElementById('nm_vid').value,
            es: document.getElementById('es_vid').value
        };

        // 動画セクションの構築
        let videoItems = '';
        const levels = [
            { key: 'ex', name: 'expert', img: '03 expert.png' },
            { key: 'hd', name: 'hard',   img: '02 hard.png' },
            { key: 'nm', name: 'normal', img: '01 normal.png' },
            { key: 'es', name: 'easy',   img: '00 easy.png' }
        ];

        levels.forEach(lvl => {
            if (vids[lvl.key] && vids[lvl.key].trim() !== "") {
                videoItems += `      <div class="video-wrapper ${lvl.name}-video">
        <div class="video-header"><img src="../img/course img/${lvl.img}"></div>
        ${adjustVideoSize(vids[lvl.key])}
      </div>\n`;
            }
        });

        let videoSection = videoItems ? `<section class="chart-check-section"><h2 class="section-title">譜面確認</h2><div class="video-grid">${videoItems}</div></section>` : '';
        let commentSection = comment ? `<section class="chart-check-section"><h2 class="section-title">譜面について</h2><div class="comment-box"><p>${comment.replace(/\n/g, '<br>')}</p></div></section>` : '';

        // --- テンプレート全体の組み立て ---
        const template = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>収録楽曲情報 - ホロドリ非公式サイト</title>
  <link rel="stylesheet" href="楽曲一覧.css">
  <link rel="icon" href="../img/favicon.ico">
  <style>
    body { background: transparent; margin: 0; }
    .blurred-background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background-image: url('${imgPath}'); background-size: cover; background-position: center; filter: blur(20px) brightness(0.8); transform: scale(1.1); }
    .main-wrapper { position: relative; z-index: 10; }
    .chart-check-section { margin-top: 80px; padding: 0 20px; }
    .section-title { display: block; margin-bottom: 40px; text-align: center; }
    .video-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; }
  </style>
</head>
<body>
  <div class="blurred-background"></div>
  <div class="main-wrapper">
    <a href="../song.html" class="back-btn"><img src="../back.png" alt="戻る"></a>
    <nav class="navbar">
      <div class="logo">
        <img src="../img/logo.webp" alt="logo">
        <span class="site-title">ホロドリ非公式サイト<br>収録楽曲情報</span>
      </div>
      <ul class="nav-links">
        <li><a href="https://opening.hololive-dreams.com/" target="_blank">公式サイトはこちら</a></li>
        <li><a href="https://x.com/hololive_dreams" target="_blank">公式Xはこちら</a></li>
        <li><a href="https://www.youtube.com/@hololivedreams" target="_blank">公式YouTubeはこちら</a></li>
      </ul>
    </nav>
    <main class="detail-main">
      <div class="song-detail-flex">
        <div class="side-jacket">
          <img src="${imgPath}" alt="${song}">
        </div>
        <div class="song-info-area">
          <h1 class="display-title">
            <a href="${url}" target="_blank" rel="noopener noreferrer">${song}<span style="font-size: 40px;">🔗</span></a>
          </h1>
          <div class="bpm-area">
            <span class="bpm-label">BPM</span>
            <span class="bpm-value">${bpm}</span>
          </div>
          <div class="song-stats-vertical">
            <div class="stat-row ex"><img src="../img/course img/03 expert.png"> <span class="lv-text">Lv.${stats.ex.lv}</span> <span class="combo-text">${stats.ex.cb}combo</span></div>
            <div class="stat-row hd"><img src="../img/course img/02 hard.png"> <span class="lv-text">Lv.${stats.hd.lv}</span> <span class="combo-text">${stats.hd.cb}combo</span></div>
            <div class="stat-row nm"><img src="../img/course img/01 normal.png"> <span class="lv-text">Lv.${stats.nm.lv}</span> <span class="combo-text">${stats.nm.cb}combo</span></div>
            <div class="stat-row es"><img src="../img/course img/00 easy.png"> <span class="lv-text">Lv.${stats.es.lv}</span> <span class="combo-text">${stats.es.cb}combo</span></div>
          </div>
        </div>
      </div>
      ${videoSection}
      ${commentSection}
    </main>
  </div>
</body>
</html>`;

        document.getElementById('result_code').value = template;
    } catch (e) {
        console.error(e);
        alert("エラーが発生しました。コンソールを確認してください。");
    }
}

function copyToClipboard() {
    const area = document.getElementById("result_code");
    area.select();
    document.execCommand("copy");
    alert("コピーしました");
}

function downloadHTML() {
    const name = document.getElementById('song_name').value || "song";
    const blob = new Blob([document.getElementById('result_code').value], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name + ".html";
    a.click();
}
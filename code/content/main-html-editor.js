let fileHandle = null;
let originalHtml = '';

function setStatus(text) {
  document.getElementById('status').textContent = text;
}

function getEditor() {
  return document.getElementById('editor');
}

function extractMainInner(html) {
  const startMatch = html.match(/<main\b[^>]*id=["']content-root["'][^>]*>/i);
  if (!startMatch) return null;
  const startTagStart = startMatch.index;
  const startTagEnd = startTagStart + startMatch[0].length;
  const closeIndex = html.indexOf('</main>', startTagEnd);
  if (closeIndex === -1) return null;
  return {
    before: html.slice(0, startTagEnd),
    inner: html.slice(startTagEnd, closeIndex),
    after: html.slice(closeIndex),
  };
}

async function openHtmlFile() {
  const handles = await window.showOpenFilePicker({
    types: [{ description: 'HTML', accept: { 'text/html': ['.html'] } }],
    multiple: false,
  });
  fileHandle = handles[0];
  const file = await fileHandle.getFile();
  originalHtml = await file.text();
  const parts = extractMainInner(originalHtml);
  if (!parts) {
    alert('id="content-root" の main が見つかりませんでした。');
    return;
  }
  getEditor().value = parts.inner.trim();
  setStatus('読み込み: ' + file.name);
}

async function saveHtmlFile() {
  if (!fileHandle || !originalHtml) {
    alert('先にHTMLを開いてください。');
    return;
  }
  const parts = extractMainInner(originalHtml);
  if (!parts) {
    alert('id="content-root" の main が見つかりませんでした。');
    return;
  }
  const nextInner = '\n' + getEditor().value.trim() + '\n  ';
  const nextHtml = parts.before + nextInner + parts.after;
  const writable = await fileHandle.createWritable();
  await writable.write(nextHtml);
  await writable.close();
  originalHtml = nextHtml;
  setStatus('保存しました');
}

function selectAllText() {
  const editor = getEditor();
  editor.focus();
  editor.select();
}

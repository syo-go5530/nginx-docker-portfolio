// ─────────────────────────────
// 設定
// ─────────────────────────────
const GITHUB_USERNAME = 'syo-go5530';

// リポジトリを追加する場合はここに追記してください
const REPOSITORIES = [
  { repo: 'nginx-docker-portfolio' },
  // 例: { repo: 'next-repo-name' },
  // 例: { repo: 'another-repo' },
];

// ─────────────────────────────
// パーティクル生成
// ─────────────────────────────
(function spawnParticles() {
  const container = document.getElementById('particles');
  const count = 28;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 2.5 + 1;
    p.style.cssText = [
      `left:${Math.random() * 100}%`,
      `width:${size}px`,
      `height:${size}px`,
      `animation-duration:${Math.random() * 18 + 12}s`,
      `animation-delay:${Math.random() * 15}s`,
      `opacity:0`,
    ].join(';');
    container.appendChild(p);
  }
})();

// ─────────────────────────────
// README 取得
// ─────────────────────────────
const cache = {}; // index -> { md, repoUrl, repo }

async function fetchReadme(repo) {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${repo}/readme`;
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  // base64 → UTF-8
  const md = decodeURIComponent(
    atob(json.content.replace(/\s/g, ''))
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return { md, repoUrl: `https://github.com/${GITHUB_USERNAME}/${repo}` };
}

// ─────────────────────────────
// カード描画
// ─────────────────────────────
function buildCard(index, repoName) {
  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${repoName} を開く`);

  card.innerHTML = `
    <div class="card-top-bar"></div>
    <div class="card-header">
      <span class="card-icon">📁</span>
      <span class="card-name">${repoName}</span>
      <span class="card-expand-hint">クリックで拡大 ↗</span>
    </div>
    <div class="card-preview" id="preview-${index}">
      <div class="loading-wrap">
        <div class="spinner"></div>
        <span>README 読み込み中...</span>
      </div>
    </div>
  `;

  const openHandler = () => openModal(index, repoName);
  card.addEventListener('click', openHandler);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') openHandler();
  });

  return card;
}

async function renderCards() {
  const track = document.getElementById('cardsTrack');
  const badge = document.getElementById('repoCount');

  badge.textContent = `${REPOSITORIES.length} repo${REPOSITORIES.length !== 1 ? 's' : ''}`;

  for (let i = 0; i < REPOSITORIES.length; i++) {
    const { repo } = REPOSITORIES[i];
    const card = buildCard(i, repo);
    track.appendChild(card);

    // 非同期で README 取得
    fetchReadme(repo)
      .then(({ md, repoUrl }) => {
        cache[i] = { md, repoUrl, repo };
        const el = document.getElementById(`preview-${i}`);
        if (el) el.innerHTML = marked.parse(md);
      })
      .catch(() => {
        const el = document.getElementById(`preview-${i}`);
        if (el) el.innerHTML = `
          <div class="error-msg">
            <span class="err-icon">⚠️</span>
            <span>README を読み込めませんでした</span>
          </div>`;
      });
  }

  setupDragScroll(track);
}

// ─────────────────────────────
// ドラッグスクロール
// ─────────────────────────────
function setupDragScroll(el) {
  let down = false, startX = 0, scrollL = 0, moved = false;

  el.addEventListener('mousedown', e => {
    down = true; moved = false;
    startX = e.pageX - el.offsetLeft;
    scrollL = el.scrollLeft;
  });
  el.addEventListener('mousemove', e => {
    if (!down) return;
    const dx = (e.pageX - el.offsetLeft) - startX;
    if (Math.abs(dx) > 4) moved = true;
    el.scrollLeft = scrollL - dx;
  });
  ['mouseup', 'mouseleave'].forEach(ev =>
    el.addEventListener(ev, () => { down = false; })
  );
  // ドラッグ中はカードのクリックを無効化
  el.addEventListener('click', e => {
    if (moved) e.stopPropagation();
  }, true);
}

// ─────────────────────────────
// モーダル
// ─────────────────────────────
function openModal(index, repoName) {
  const overlay = document.getElementById('overlay');
  const title   = document.getElementById('modalTitle');
  const body    = document.getElementById('modalBody');
  const ghLink  = document.getElementById('modalGhLink');

  title.textContent = repoName;

  if (cache[index]) {
    const { md, repoUrl } = cache[index];
    ghLink.href = repoUrl;
    body.innerHTML = marked.parse(md);
  } else {
    ghLink.href = `https://github.com/${GITHUB_USERNAME}/${repoName}`;
    const previewEl = document.getElementById(`preview-${index}`);
    body.innerHTML = previewEl
      ? previewEl.innerHTML
      : '<div class="loading-wrap"><div class="spinner"></div><span>読み込み中...</span></div>';
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('modalClose').focus();
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ─────────────────────────────
// 起動
// ─────────────────────────────
renderCards();

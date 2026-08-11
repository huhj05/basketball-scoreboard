// ===== 篮球计分板 PWA =====
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const cam = $('cam');
  const fallback = $('fallback');
  const board = $('board');
  const teamA = $('teamA'), teamB = $('teamB');
  const nameA = $('nameA'), nameB = $('nameB');
  const scoreA = $('scoreA'), scoreB = $('scoreB');
  const periodEl = $('period'), pval = $('pval');
  const overlayImg = $('overlayImg');
  const gear = $('gear'), toolbar = $('toolbar');
  const colorPicker = $('colorPicker'), swatches = $('swatches');
  const fileInput = $('fileInput');
  const startOverlay = $('startOverlay'), startBtn = $('startBtn'), skipBtn = $('skipBtn');

  const PALETTE = ['#FF6B6B', '#5AA8FF', '#FFD93D', '#6BCB77', '#FF9F45', '#B06BFF',
                   '#4ECDC4', '#FF6BD6', '#F5F5F5', '#2B2B2B', '#FF3B30', '#34C759'];

  let editMode = false;
  const state = {
    nameA: '主队', nameB: '客队', scoreA: 0, scoreB: 0, period: 1,
    colorA: '#FF6B6B', colorB: '#5AA8FF',
    board: { left: null, top: null, scale: 1 },
    img: { src: '', left: null, top: null, scale: 1, visible: false }
  };

  // ---- 视口高度（兼容老 iOS 的 dvh） ----
  function setVH() { document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px'); }
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', () => setTimeout(setVH, 200));

  // ---- 持久化 ----
  function save() {
    try { localStorage.setItem('bs_pwa', JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem('bs_pwa'));
      if (s) Object.assign(state, s);
    } catch (e) {}
    const img = localStorage.getItem('bs_pwa_img');
    if (img) state.img.src = img;
  }

  // ---- 工具 ----
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function setScale(el, s) { el._scale = s; el.style.transform = 'scale(' + s + ')'; }
  function hexToRgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function applyColor(team, hex) {
    if (team === 'A') {
      state.colorA = hex;
      nameA.style.color = hex;
      teamA.style.background = hexToRgba(hex, 0.33);
    } else {
      state.colorB = hex;
      nameB.style.color = hex;
      teamB.style.background = hexToRgba(hex, 0.33);
    }
    save();
  }

  function centerBoard() {
    const top = (parseInt(getComputedStyle(document.body).getPropertyValue('padding-top')) || 0) + 50;
    state.board.left = Math.round((window.innerWidth - board.offsetWidth) / 2);
    state.board.top = Math.round(top + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0));
    board.style.left = state.board.left + 'px';
    board.style.top = state.board.top + 'px';
  }

  function applyState() {
    nameA.textContent = state.nameA;
    nameB.textContent = state.nameB;
    scoreA.textContent = state.scoreA;
    scoreB.textContent = state.scoreB;
    pval.textContent = state.period;
    applyColor('A', state.colorA);
    applyColor('B', state.colorB);

    if (state.board.left != null) {
      board.style.left = state.board.left + 'px';
      board.style.top = state.board.top + 'px';
    } else {
      centerBoard();
    }
    if (state.board.scale) setScale(board, state.board.scale);

    if (state.img.src) {
      overlayImg.src = state.img.src;
      overlayImg.classList.remove('hidden');
      if (state.img.left != null) {
        overlayImg.style.left = state.img.left + 'px';
        overlayImg.style.top = state.img.top + 'px';
      }
      if (state.img.scale) setScale(overlayImg, state.img.scale);
    }
  }

  // ---- 计分交互（非编辑模式：点按 / 长按） ----
  function bindTap(el, onTap, onLong) {
    let sx, sy, moved, longfired, timer;
    el.addEventListener('pointerdown', (e) => {
      if (editMode) return;
      e.stopPropagation();
      sx = e.clientX; sy = e.clientY; moved = false; longfired = false;
      if (onLong) timer = setTimeout(() => { longfired = true; onLong(); }, 500);
    });
    el.addEventListener('pointermove', (e) => {
      if (editMode) return;
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) moved = true;
    });
    const up = (e) => {
      if (editMode) return;
      if (timer) clearTimeout(timer);
      e.stopPropagation();
      if (!moved && !longfired && onTap) onTap();
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', () => { if (timer) clearTimeout(timer); });
  }

  function rename(team) {
    const cur = team === 'A' ? state.nameA : state.nameB;
    const r = prompt('修改队名', cur);
    if (r != null) {
      const v = r.trim() || (team === 'A' ? '主队' : '客队');
      if (team === 'A') { state.nameA = v; nameA.textContent = v; }
      else { state.nameB = v; nameB.textContent = v; }
      save();
    }
  }

  // 点队名区域 +1，点比分 −1，长按队名改名
  bindTap(teamA, () => { state.scoreA++; scoreA.textContent = state.scoreA; save(); },
    () => rename('A'));
  bindTap(scoreA, () => { if (state.scoreA > 0) { state.scoreA--; scoreA.textContent = state.scoreA; save(); } });
  bindTap(teamB, () => { state.scoreB++; scoreB.textContent = state.scoreB; save(); },
    () => rename('B'));
  bindTap(scoreB, () => { if (state.scoreB > 0) { state.scoreB--; scoreB.textContent = state.scoreB; save(); } });
  // 节：点击下一节，长按上一节
  bindTap(periodEl, () => { if (state.period < 9) { state.period++; pval.textContent = state.period; save(); } },
    () => { if (state.period > 1) { state.period--; pval.textContent = state.period; save(); } });

  // ---- 编辑模式：拖动 + 双指/滚轮缩放 ----
  function makeMovable(el, picker, onChange) {
    const pointers = new Map();
    let drag = null, pinch = null;

    function dist() {
      const p = Array.from(pointers.values());
      return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    }
    el.addEventListener('pointerdown', (e) => {
      if (!editMode) return;
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        drag = {
          ox: parseFloat(el.style.left) || el.offsetLeft,
          oy: parseFloat(el.style.top) || el.offsetTop,
          sx: e.clientX, sy: e.clientY
        };
      } else if (pointers.size === 2) {
        pinch = { d: dist(), s: el._scale || 1 };
      }
    });
    el.addEventListener('pointermove', (e) => {
      if (!editMode || !pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1 && drag) {
        el.style.left = (drag.ox + (e.clientX - drag.sx)) + 'px';
        el.style.top = (drag.oy + (e.clientY - drag.sy)) + 'px';
        onChange();
      } else if (pointers.size === 2 && pinch) {
        setScale(el, clamp(pinch.s * (dist() / pinch.d), 0.4, 4));
        onChange();
      }
    });
    const end = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) drag = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => {
      if (!editMode) return;
      e.preventDefault();
      setScale(el, clamp((el._scale || 1) * (e.deltaY < 0 ? 1.08 : 0.92), 0.4, 4));
      onChange();
    }, { passive: false });
  }

  makeMovable(board, 'board', () => {
    state.board.left = parseFloat(board.style.left);
    state.board.top = parseFloat(board.style.top);
    state.board.scale = board._scale || 1;
    save();
  });
  makeMovable(overlayImg, 'img', () => {
    state.img.left = parseFloat(overlayImg.style.left);
    state.img.top = parseFloat(overlayImg.style.top);
    state.img.scale = overlayImg._scale || 1;
    save();
  });

  // ---- 编辑工具条 ----
  gear.addEventListener('click', toggleEdit);
  function toggleEdit() {
    editMode = !editMode;
    document.body.classList.toggle('edit', editMode);
    toolbar.classList.toggle('hidden', !editMode);
    overlayImg.classList.toggle('hidden', !(editMode || state.img.visible));
    if (editMode && state.img.src) overlayImg.classList.remove('hidden');
  }

  toolbar.addEventListener('click', (e) => {
    const act = e.target.getAttribute('data-act');
    if (!act) return;
    if (act === 'nameA') rename('A');
    else if (act === 'nameB') rename('B');
    else if (act === 'colorA') showPicker('A');
    else if (act === 'colorB') showPicker('B');
    else if (act === 'upload') fileInput.click();
    else if (act === 'reset') {
      state.scoreA = 0; state.scoreB = 0; state.period = 1;
      scoreA.textContent = 0; scoreB.textContent = 0; pval.textContent = 1;
      save();
    } else if (act === 'done') toggleEdit();
  });

  // ---- 颜色选择 ----
  let pickerTeam = 'A';
  function showPicker(team) {
    pickerTeam = team;
    colorPicker.classList.remove('hidden');
  }
  PALETTE.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.background = c;
    b.addEventListener('click', () => { applyColor(pickerTeam, c); colorPicker.classList.add('hidden'); });
    swatches.appendChild(b);
  });
  $('pickerClose').addEventListener('click', () => colorPicker.classList.add('hidden'));

  // ---- 图片上传 ----
  fileInput.addEventListener('change', () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      if (data.length > 4 * 1024 * 1024) { alert('图片过大（>4MB），请压缩后再上传'); return; }
      state.img.src = data;
      state.img.visible = true;
      overlayImg.src = data;
      overlayImg.classList.remove('hidden');
      if (state.img.left == null) {
        overlayImg.style.left = (window.innerWidth / 2 - 80) + 'px';
        overlayImg.style.top = (window.innerHeight / 2 - 80) + 'px';
      }
      try { localStorage.setItem('bs_pwa_img', data); } catch (e) { alert('图片保存失败（存储空间不足）'); }
      save();
      if (!editMode) toggleEdit();
    };
    reader.readAsDataURL(f);
    fileInput.value = '';
  });

  // ---- 相机 ----
  async function initCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, audio: false
      });
      cam.srcObject = stream;
      await cam.play().catch(() => {});
    } catch (err) {
      console.warn('camera unavailable', err);
      fallback.classList.remove('hidden');
    }
  }
  startBtn.addEventListener('click', () => { initCam(); startOverlay.classList.add('hidden'); });
  skipBtn.addEventListener('click', () => { fallback.classList.remove('hidden'); startOverlay.classList.add('hidden'); });

  // ---- Service Worker ----
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // ---- 启动 ----
  load();
  applyState();
})();

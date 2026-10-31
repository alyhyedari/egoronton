/* EGOR Portrait Studio — dependency-free, local-only 2D compositor. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('workspace'), ctx = canvas.getContext('2d');
  const SIZE = 1024, MAX_LAYERS = 12, MAX_STROKES = 500, MAX_POINTS = 60000;
  const INK = '#091619';
  const PARTS = {
    torso: 'Torso', head: 'Head',
    leftUpperArm: 'Left upper arm', leftForearm: 'Left forearm', leftHand: 'Left hand',
    rightUpperArm: 'Right upper arm', rightForearm: 'Right forearm', rightHand: 'Right hand',
    leftThigh: 'Left thigh', leftShin: 'Left shin', leftFoot: 'Left foot',
    rightThigh: 'Right thigh', rightShin: 'Right shin', rightFoot: 'Right foot'
  };
  const PRESETS = {
    relaxed: {},
    hello: {rightUpperArm: -55, rightForearm: -110, rightHand: 15, head: -5},
    celebrate: {leftUpperArm: 140, leftForearm: 20, rightUpperArm: -140, rightForearm: -20, head: 7},
    stride: {leftUpperArm: 35, leftForearm: -15, rightUpperArm: -35, rightForearm: -35, leftThigh: 27, leftShin: -15, rightThigh: -30, rightShin: 38, head: -6},
    seated: {leftThigh: 65, leftShin: -65, rightThigh: -65, rightShin: 65, leftUpperArm: 25, leftForearm: -65, rightUpperArm: -25, rightForearm: 65}
  };
  const STICKERS = ['guide', 'curious', 'confident', 'seated'];
  const assets = new Map(), renders = new Map();
  let head, state, past = [], future = [], baseline = '', pending = null;
  let tool = 'move', part = 'head', brush = 40, gesture = null, busy = false, frame = 0;
  let serial = 0;
  const uid = () => `layer-${Date.now().toString(36)}-${++serial}`;
  const clone = x => JSON.parse(JSON.stringify(x));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rad = d => d * Math.PI / 180;
  const deg = r => r * 180 / Math.PI;
  const angle = a => ((a + 180) % 360 + 360) % 360 - 180;
  const selected = () => state.layers.find(l => l.id === state.selected);
  const editable = () => { const l = selected(); return l && !l.locked && !busy ? l : null; };
  const say = s => { $('status').textContent = s; };
  const fingerprint = () => JSON.stringify({background: state.background, layers: state.layers});
  const dirty = () => fingerprint() !== baseline;
  const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('An image could not be read. Try a PNG, JPEG or WebP file.'));
      img.src = src;
    });
  }
  function pose(name = 'hello') {
    const p = {};
    for (const key of Object.keys(PARTS)) p[key] = {angle: (PRESETS[name] || {})[key] || 0, length: 1, visible: true};
    return p;
  }
  function layer(type, name) {
    return {id: uid(), type, name, x: 512, y: 512, scale: 1, rotation: 0, opacity: 1, flip: false, visible: true, locked: false, masks: []};
  }
  function rigLayer() { return {...layer('rig', 'EGOR · hello'), pose: pose(), preset: 'hello'}; }
  function initial() { const l = rigLayer(); return {background: '#03afd5', layers: [l], selected: l.id}; }
  function begin() { if (!pending) pending = clone(state); }
  function commit() {
    if (!pending) return;
    if (JSON.stringify(pending) !== JSON.stringify(state)) {
      past.push(pending); if (past.length > 40) past.shift(); future = [];
    }
    pending = null; collectAssets(); syncHistory();
  }
  function mutate(fn, message) {
    if (busy || gesture) return;
    commit(); begin(); fn(); commit(); sync(); requestDraw(); if (message) say(message);
  }
  function collectAssets() {
    const used = new Set();
    for (const s of [state, ...past, ...future, pending].filter(Boolean)) for (const l of s.layers) if (l.asset) used.add(l.asset);
    for (const key of assets.keys()) if (!used.has(key)) assets.delete(key);
    renders.clear();
  }
  function undo(redo = false) {
    if (busy || gesture) return;
    commit(); const from = redo ? future : past, to = redo ? past : future;
    if (!from.length) return;
    to.push(clone(state)); state = from.pop(); renders.clear(); sync(); requestDraw(); say(redo ? 'Redone.' : 'Undone.');
  }
  function syncHistory() { $('undo').disabled = !past.length; $('redo').disabled = !future.length; }
  function add(l) {
    if (state.layers.length >= MAX_LAYERS) { say('The desk holds 12 layers. Remove a layer before adding another.'); return; }
    mutate(() => { state.layers.push(l); state.selected = l.id; }, `${l.name} added.`);
  }
  function dimensions(l) {
    if (l.type === 'rig') return {w: 1024, h: 1024};
    if (l.type === 'text') return {w: 1024, h: 640};
    const a = assets.get(l.asset); return {w: a?.image.width || 1, h: a?.image.height || 1};
  }
  function localToWorld(l, p) {
    const {w, h} = dimensions(l), x = (p.x - w / 2) * l.scale * (l.flip ? -1 : 1), y = (p.y - h / 2) * l.scale;
    const a = rad(l.rotation);
    return {x: l.x + x * Math.cos(a) - y * Math.sin(a), y: l.y + x * Math.sin(a) + y * Math.cos(a)};
  }
  function worldToLocal(l, p) {
    const {w, h} = dimensions(l), a = rad(-l.rotation), x = p.x - l.x, y = p.y - l.y;
    return {x: (x * Math.cos(a) - y * Math.sin(a)) / l.scale * (l.flip ? -1 : 1) + w / 2, y: (x * Math.sin(a) + y * Math.cos(a)) / l.scale + h / 2};
  }
  function rigGeometry(l) {
    const p = l.pose, nodes = {};
    // Angles are relative to each parent; zero points down the canvas.
    const advance = (origin, a, length) => ({x: origin.x - Math.sin(rad(a)) * length, y: origin.y + Math.cos(rad(a)) * length});
    const shoulder = {x: 512, y: 320};
    const torsoAngle = p.torso.angle, hip = advance(shoulder, torsoAngle, 220 * p.torso.length);
    const side = (origin, d) => ({x: origin.x + Math.cos(rad(torsoAngle)) * d, y: origin.y + Math.sin(rad(torsoAngle)) * d});
    nodes.torso = {start: shoulder, end: hip, angle: torsoAngle, parentAngle: 0};
    const neck = advance(shoulder, torsoAngle, -25);
    const headAngle = torsoAngle + p.head.angle;
    nodes.head = {start: neck, end: advance(neck, headAngle, -145 * p.head.length), angle: headAngle, parentAngle: torsoAngle};
    for (const [prefix, sign] of [['left', -1], ['right', 1]]) {
      for (const [suffix, origin, parentAngle, len] of [
        ['UpperArm', side(shoulder, sign * 37), torsoAngle, 115],
        ['Thigh', side(hip, sign * 37), torsoAngle, 155]
      ]) {
        const key = prefix + suffix, a = parentAngle + p[key].angle;
        nodes[key] = {start: origin, end: advance(origin, a, len * p[key].length), angle: a, parentAngle};
        const child = prefix + (suffix === 'UpperArm' ? 'Forearm' : 'Shin'), childAngle = a + p[child].angle;
        nodes[child] = {start: nodes[key].end, end: advance(nodes[key].end, childAngle, (suffix === 'UpperArm' ? 128 : 153) * p[child].length), angle: childAngle, parentAngle: a};
        const tip = prefix + (suffix === 'UpperArm' ? 'Hand' : 'Foot'), tipAngle = childAngle + p[tip].angle;
        nodes[tip] = {start: nodes[child].end, end: advance(nodes[child].end, tipAngle + (suffix === 'UpperArm' ? 0 : -sign * 90), 33 * p[tip].length), angle: tipAngle, parentAngle: childAngle};
      }
    }
    return nodes;
  }
  function line(c, start, end, bend = 3) {
    c.beginPath(); c.moveTo(start.x, start.y);
    c.quadraticCurveTo((start.x + end.x) / 2 + bend, (start.y + end.y) / 2, end.x, end.y); c.stroke();
  }
  function drawRig(c, l) {
    const nodes = rigGeometry(l), p = l.pose;
    c.strokeStyle = INK; c.lineWidth = 11; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const key of ['leftThigh', 'leftShin', 'rightThigh', 'rightShin', 'leftUpperArm', 'leftForearm', 'rightUpperArm', 'rightForearm']) {
      if (p[key].visible) line(c, nodes[key].start, nodes[key].end, key.startsWith('left') ? -3 : 3);
    }
    if (p.torso.visible) {
      const n = nodes.torso;
      c.save(); c.translate(n.start.x, n.start.y); c.rotate(rad(n.angle));
      const h = 220 * p.torso.length;
      c.beginPath(); c.moveTo(-37, 0); c.quadraticCurveTo(0, -4, 37, 0); c.quadraticCurveTo(32, h / 2, 39, h); c.quadraticCurveTo(2, h - 7, -37, h); c.quadraticCurveTo(-42, h / 2, -37, 0); c.stroke();
      line(c, {x: 0, y: 0}, {x: 0, y: -30}, 0); c.restore();
    }
    for (const prefix of ['left', 'right']) {
      const sign = prefix === 'left' ? -1 : 1;
      for (const suffix of ['Hand', 'Foot']) {
        const key = prefix + suffix; if (!p[key].visible) continue;
        const n = nodes[key]; c.save(); c.translate(n.start.x, n.start.y); c.rotate(rad(n.angle)); c.scale(p[key].length, p[key].length); c.lineWidth = 7;
        c.beginPath(); c.moveTo(0, 0);
        if (suffix === 'Foot') { c.bezierCurveTo(sign * 18, 0, sign * 52, 21, sign * 41, 25); c.quadraticCurveTo(sign * 25, 29, 0, 0); }
        else { c.quadraticCurveTo(sign * 14, 28, sign * 2, 30); c.quadraticCurveTo(-sign * 10, 22, 0, 0); }
        c.stroke(); c.restore();
      }
    }
    if (p.head.visible && head) {
      const n = nodes.head, h = 145 * p.head.length, w = h * head.width / head.height;
      c.save(); c.translate(n.start.x, n.start.y); c.rotate(rad(n.angle)); c.drawImage(head, -w / 2, -h, w, h); c.restore();
    }
  }
  function textLines(c, text, width) {
    const out = [];
    for (const paragraph of text.split('\n')) {
      let current = '';
      for (const char of Array.from(paragraph)) {
        if (current && c.measureText(current + char).width > width) { out.push(current); current = ''; }
        current += char;
      }
      out.push(current);
    }
    return out;
  }
  function surface(l) {
    const key = JSON.stringify([l.type, l.asset, l.pose, l.text, l.fontSize, l.color, l.masks]);
    const cached = renders.get(l.id); if (cached?.key === key) return cached.canvas;
    const {w, h} = dimensions(l), c = makeCanvas(w, h), g = c.getContext('2d');
    if (l.type === 'rig') drawRig(g, l);
    else if (l.type === 'text') {
      g.font = `600 ${l.fontSize}px "DM Sans", Arial, sans-serif`; g.fillStyle = l.color; g.textAlign = 'center'; g.textBaseline = 'middle';
      // Direction is inferred per line; all input is rendered as text, never HTML.
      const lines = textLines(g, l.text, 984), lineHeight = l.fontSize * 1.22;
      lines.forEach((s, i) => { g.direction = /[\u0590-\u08ff]/.test(s) ? 'rtl' : 'ltr'; g.fillText(s, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lineHeight); });
    } else if (assets.has(l.asset)) g.drawImage(assets.get(l.asset).image, 0, 0);
    if (l.masks.length) {
      const mask = makeCanvas(w, h), m = mask.getContext('2d'); m.fillStyle = '#fff'; m.fillRect(0, 0, w, h); m.lineCap = 'round'; m.lineJoin = 'round';
      for (const s of l.masks) {
        m.globalCompositeOperation = s.mode === 'erase' ? 'destination-out' : 'source-over'; m.strokeStyle = '#fff'; m.fillStyle = '#fff'; m.lineWidth = s.radius * 2;
        m.beginPath(); m.arc(s.points[0][0], s.points[0][1], s.radius, 0, Math.PI * 2); m.fill();
        if (s.points.length > 1) { m.beginPath(); s.points.forEach(([x, y], i) => i ? m.lineTo(x, y) : m.moveTo(x, y)); m.stroke(); }
      }
      g.globalCompositeOperation = 'destination-in'; g.drawImage(mask, 0, 0); g.globalCompositeOperation = 'source-over';
    }
    renders.set(l.id, {key, canvas: c}); return c;
  }
  function drawScene(g, size, circle = false) {
    g.clearRect(0, 0, size, size); g.save(); g.scale(size / SIZE, size / SIZE);
    if (circle) { g.beginPath(); g.arc(512, 512, 512, 0, Math.PI * 2); g.clip(); }
    if (state.background !== 'transparent') { g.fillStyle = state.background; g.fillRect(0, 0, SIZE, SIZE); }
    for (const l of state.layers) {
      if (!l.visible || l.opacity === 0) continue;
      const c = surface(l); g.save(); g.globalAlpha = l.opacity; g.translate(l.x, l.y); g.rotate(rad(l.rotation)); g.scale(l.scale * (l.flip ? -1 : 1), l.scale); g.drawImage(c, -c.width / 2, -c.height / 2); g.restore();
    }
    g.restore();
  }
  function bounds(l) {
    if (l.type === 'rig') {
      const pts = Object.values(rigGeometry(l)).flatMap(n => [n.start, n.end]);
      return {x: Math.max(0, Math.min(...pts.map(p => p.x)) - 80), y: Math.max(0, Math.min(...pts.map(p => p.y)) - 20), right: Math.min(1024, Math.max(...pts.map(p => p.x)) + 80), bottom: Math.min(1024, Math.max(...pts.map(p => p.y)) + 40)};
    }
    if (l.type === 'text') {
      const c = surface(l).getContext('2d'); c.font = `600 ${l.fontSize}px "DM Sans", Arial, sans-serif`;
      const lines = textLines(c, l.text, 984), w = Math.max(50, ...lines.map(s => c.measureText(s).width)) + 20, h = Math.min(640, Math.max(l.fontSize * 1.22, lines.length * l.fontSize * 1.22));
      return {x: 512 - w / 2, y: 320 - h / 2, right: 512 + w / 2, bottom: 320 + h / 2};
    }
    const {w, h} = dimensions(l); return {x: 0, y: 0, right: w, bottom: h};
  }
  function handles(l) {
    const b = bounds(l), corners = [[b.x, b.y], [b.right, b.y], [b.right, b.bottom], [b.x, b.bottom]].map(([x, y]) => localToWorld(l, {x, y}));
    const top = localToWorld(l, {x: (b.x + b.right) / 2, y: b.y});
    const a = rad(l.rotation), gap = 28 * displayUnit();
    return {corners, top, rotate: {x: top.x + Math.sin(a) * gap, y: top.y - Math.cos(a) * gap}};
  }
  const displayUnit = () => SIZE / (canvas.getBoundingClientRect().width || SIZE);
  function draw() {
    frame = 0; if (!state) return; drawScene(ctx, SIZE);
    const u = displayUnit();
    if ($('circle-guide').checked) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.2 * u; ctx.setLineDash([6 * u, 5 * u]); ctx.beginPath(); ctx.arc(512, 512, 500, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    const l = selected(); if (!l || !l.visible || l.locked) return;
    ctx.save(); ctx.lineWidth = 1.3 * u; ctx.strokeStyle = '#006f8b'; ctx.fillStyle = '#fff';
    const dot = (p, r, active = false) => { ctx.beginPath(); ctx.arc(p.x, p.y, r * u, 0, Math.PI * 2); ctx.fillStyle = active ? '#f6ee69' : '#fff'; ctx.fill(); ctx.stroke(); };
    if (tool === 'move') {
      const h = handles(l); ctx.setLineDash([4 * u, 3 * u]); ctx.beginPath(); h.corners.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      line(ctx, h.top, h.rotate, 0); h.corners.forEach(p => dot(p, 5)); dot(h.rotate, 6);
    } else if (tool === 'pose' && l.type === 'rig') {
      for (const [key, n] of Object.entries(rigGeometry(l))) dot(localToWorld(l, n.end), key === part ? 7 : 5, key === part);
    }
    ctx.restore();
  }
  function requestDraw() { if (!frame) frame = requestAnimationFrame(draw); }
  function fitView() {
    const vp = $('viewport'), style = getComputedStyle(vp), pad = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const base = Math.max(100, Math.min(vp.clientWidth - pad, vp.clientHeight - pad));
    const size = Math.floor(base * Number($('zoom').value)); $('stage-frame').style.width = `${size}px`; $('stage-frame').style.height = `${size}px`; requestDraw();
  }
  function setValue(id, value) { if (document.activeElement !== $(id)) $(id).value = value; }
  function syncJoint() {
    const l = selected(); if (l?.type !== 'rig') return;
    const p = l.pose[part]; setValue('body-part', part); setValue('joint-angle', Math.round(p.angle)); setValue('joint-length', Math.round(p.length * 100)); $('part-visible').checked = p.visible;
    $('joint-value').textContent = `${Math.round(p.angle)}°`; $('length-value').textContent = `${Math.round(p.length * 100)}%`; setValue('pose-preset', l.preset);
  }
  function syncTransform() {
    const l = selected(); if (!l) return;
    setValue('pos-x', Math.round(l.x)); setValue('pos-y', Math.round(l.y)); setValue('scale', Math.round(l.scale * 100)); setValue('rotation', Math.round(l.rotation)); setValue('opacity', Math.round(l.opacity * 100));
    $('scale-value').textContent = `${Math.round(l.scale * 100)}%`; $('rotation-value').textContent = `${Math.round(l.rotation)}°`; $('opacity-value').textContent = `${Math.round(l.opacity * 100)}%`;
  }
  function sync() {
    const l = selected(), list = $('layers'); list.replaceChildren();
    for (const item of [...state.layers].reverse()) {
      const row = document.createElement('div'); row.className = `layer-row${item.id === state.selected ? ' selected' : ''}`;
      const button = document.createElement('button'); button.type = 'button'; button.dataset.layerId = item.id; button.setAttribute('aria-pressed', String(item.id === state.selected));
      const icon = document.createElement('span'); icon.className = 'layer-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = {rig: '⌘', text: 'T', photo: '▧', sticker: '✳'}[item.type];
      const title = document.createElement('span'); title.className = 'layer-title'; title.textContent = item.name;
      const small = document.createElement('small'); small.textContent = `${item.type}${item.locked ? ' · locked' : ''}${!item.visible ? ' · hidden' : ''}`; title.append(small); button.append(icon, title); row.append(button); list.append(row);
    }
    $('layer-count').textContent = `${state.layers.length} / ${MAX_LAYERS}`;
    $('selection-controls').hidden = !l; $('empty-selection').hidden = !!l; $('selection-kind').textContent = l ? l.type.toUpperCase() : 'NO LAYER';
    const index = l ? state.layers.indexOf(l) : -1;
    $('layer-up').disabled = !l || l.locked || index === state.layers.length - 1; $('layer-down').disabled = !l || l.locked || index === 0;
    $('duplicate').disabled = !l || l.locked || state.layers.length >= MAX_LAYERS; $('delete-layer').disabled = !l || l.locked;
    for (const id of ['add-egor', 'add-text', 'upload-photo']) $(id).disabled = state.layers.length >= MAX_LAYERS;
    document.querySelectorAll('[data-sticker]').forEach(b => { b.disabled = state.layers.length >= MAX_LAYERS; });
    if (l) {
      setValue('layer-name', l.name); $('layer-name').disabled = l.locked; $('layer-visible').checked = l.visible; $('layer-visible').disabled = l.locked; $('layer-locked').checked = l.locked;
      for (const id of ['transform-controls', 'pose-controls', 'text-controls', 'brush-controls']) $(id).disabled = l.locked;
      $('pose-controls').hidden = l.type !== 'rig'; $('text-controls').hidden = l.type !== 'text'; $('photo-fit').hidden = !['photo', 'sticker'].includes(l.type);
      $('brush-controls').hidden = !['erase', 'restore'].includes(tool);
      if (l.type === 'text') { setValue('text-content', l.text); setValue('text-size', l.fontSize); setValue('text-color', l.color); }
      syncTransform(); syncJoint();
    }
    document.querySelectorAll('[data-bg]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.bg === state.background)));
    if (state.background !== 'transparent') setValue('bg-color', state.background);
    syncHistory();
  }
  function chooseTool(value) {
    if (gesture || busy) return;
    commit(); tool = value; canvas.dataset.tool = tool;
    document.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
    $('canvas-help').textContent = {
      move: 'Drag a layer to move it. Corner handles resize; the top handle rotates. Arrow keys nudge the selected layer.',
      pose: 'Select a poseable EGOR layer. Drag a joint handle, or choose a body part and use its angle and size controls.',
      erase: 'Brush over the selected layer to erase. Other layers are untouched. Use Restore or Undo to bring pixels back.',
      restore: 'Brush over an erased area to restore original pixels. Masks move with the whole layer, not individual joints.'
    }[tool]; sync(); requestDraw();
  }
  function bindInput(id, update, {live = true, unrestricted = false} = {}) {
    const el = $(id);
    const apply = () => {
      if (busy || gesture) return;
      const l = unrestricted ? selected() : editable(); if (!l && !unrestricted) return;
      begin(); update(l, el); syncTransform(); syncJoint(); requestDraw();
    };
    if (live) el.addEventListener('input', apply);
    el.addEventListener('change', () => { apply(); commit(); sync(); });
    el.addEventListener('blur', () => { commit(); });
  }
  function finiteInput(el, lo, hi, previous) { return el.value.trim() && Number.isFinite(Number(el.value)) ? clamp(Number(el.value), lo, hi) : previous; }
  function setupControls() {
    for (const [key, name] of Object.entries(PARTS)) { const option = document.createElement('option'); option.value = key; option.textContent = name; $('body-part').append(option); }
    $('layers').addEventListener('click', e => { const b = e.target.closest('[data-layer-id]'); if (!b || busy || gesture) return; commit(); state.selected = b.dataset.layerId; sync(); requestDraw(); });
    document.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => chooseTool(b.dataset.tool)));
    document.querySelectorAll('[data-bg]').forEach(b => b.addEventListener('click', () => mutate(() => { state.background = b.dataset.bg; })));
    bindInput('bg-color', (_, el) => { state.background = el.value; }, {unrestricted: true});
    bindInput('layer-name', (l, el) => { l.name = el.value.slice(0, 50); });
    bindInput('layer-visible', (l, el) => { l.visible = el.checked; }, {live: false});
    bindInput('layer-locked', (l, el) => { if (l) l.locked = el.checked; }, {live: false, unrestricted: true});
    bindInput('pos-x', (l, el) => { l.x = finiteInput(el, -2048, 3072, l.x); });
    bindInput('pos-y', (l, el) => { l.y = finiteInput(el, -2048, 3072, l.y); });
    bindInput('scale', (l, el) => { l.scale = Number(el.value) / 100; });
    bindInput('rotation', (l, el) => { l.rotation = Number(el.value); });
    bindInput('opacity', (l, el) => { l.opacity = Number(el.value) / 100; });
    bindInput('pose-preset', (l, el) => { if (l.type === 'rig' && Object.hasOwn(PRESETS, el.value)) { l.pose = pose(el.value); l.preset = el.value; } }, {live: false});
    $('body-part').addEventListener('change', () => { part = $('body-part').value; syncJoint(); requestDraw(); });
    bindInput('joint-angle', (l, el) => { if (l.type === 'rig') { l.pose[part].angle = Number(el.value); l.preset = 'custom'; } });
    bindInput('joint-length', (l, el) => { if (l.type === 'rig') { l.pose[part].length = Number(el.value) / 100; l.preset = 'custom'; } });
    bindInput('part-visible', (l, el) => { if (l.type === 'rig') { l.pose[part].visible = el.checked; l.preset = 'custom'; } }, {live: false});
    bindInput('text-content', (l, el) => { if (l.type === 'text') l.text = el.value.slice(0, 100); });
    bindInput('text-size', (l, el) => { if (l.type === 'text') l.fontSize = finiteInput(el, 16, 180, l.fontSize); });
    bindInput('text-color', (l, el) => { if (l.type === 'text') l.color = el.value; });
    $('brush-size').addEventListener('input', () => { brush = Number($('brush-size').value); $('brush-value').textContent = `${brush} px`; });
    $('flip').onclick = () => { if (editable()) mutate(() => { selected().flip = !selected().flip; }); };
    $('center').onclick = () => { if (editable()) mutate(() => { selected().x = 512; selected().y = 512; }); };
    for (const [id, fill] of [['fit-photo', false], ['fill-photo', true]]) $(id).onclick = () => {
      const l = editable(); if (!l) return; const {w, h} = dimensions(l);
      mutate(() => { l.x = l.y = 512; l.rotation = 0; l.scale = clamp(SIZE / (fill ? Math.min(w, h) : Math.max(w, h)), .05, 4); });
    };
    $('reset-mask').onclick = () => { if (editable()) mutate(() => { selected().masks = []; }, 'The selected layer is fully restored.'); };
    $('add-egor').onclick = () => add(rigLayer());
    $('add-text').onclick = () => add({...layer('text', 'Your words'), text: 'A little different.', fontSize: 68, color: INK, y: 800, scale: .8});
    $('duplicate').onclick = () => { const l = editable(); if (l) add({...clone(l), id: uid(), name: `${l.name.slice(0, 43)} copy`, x: clamp(l.x + 25, -2048, 3072), y: clamp(l.y + 25, -2048, 3072)}); };
    $('delete-layer').onclick = removeSelected;
    for (const [id, dir] of [['layer-up', 1], ['layer-down', -1]]) $(id).onclick = () => {
      const l = editable(); if (!l) return; const i = state.layers.indexOf(l), j = i + dir; if (j < 0 || j >= state.layers.length) return;
      mutate(() => { [state.layers[i], state.layers[j]] = [state.layers[j], state.layers[i]]; });
    };
    $('undo').onclick = () => undo(); $('redo').onclick = () => undo(true);
    $('circle-guide').onchange = requestDraw; $('zoom').onchange = fitView;
    $('help-open').onclick = () => $('help-dialog').showModal();
    $('new-project').onclick = () => { if (busy || gesture || (dirty() && !confirm('Start a new portrait? Unsaved changes will be lost.'))) return; commit(); state = initial(); past = []; future = []; collectAssets(); baseline = fingerprint(); sync(); requestDraw(); say('A fresh page. Your previous project is no longer in this tab.'); };
  }
  function removeSelected() {
    const l = editable(); if (!l) return;
    mutate(() => { const i = state.layers.indexOf(l); state.layers.splice(i, 1); state.selected = state.layers[Math.min(i, state.layers.length - 1)]?.id || null; }, 'Layer removed. Undo is available.');
  }
  function pointerPosition(e) { const r = canvas.getBoundingClientRect(); return {x: (e.clientX - r.left) * SIZE / r.width, y: (e.clientY - r.top) * SIZE / r.height}; }
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function hitLayer(l, p) {
    if (!l.visible || l.locked || l.opacity === 0) return false;
    const q = worldToLocal(l, p), c = surface(l);
    if (q.x < 0 || q.y < 0 || q.x >= c.width || q.y >= c.height) return false;
    const r = Math.max(1, Math.min(18, Math.ceil(5 * displayUnit() / l.scale))), x = Math.max(0, Math.floor(q.x) - r), y = Math.max(0, Math.floor(q.y) - r);
    const data = c.getContext('2d').getImageData(x, y, Math.min(r * 2 + 1, c.width - x), Math.min(r * 2 + 1, c.height - y)).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 30) return true;
    return false;
  }
  function pointCount() { return state.layers.reduce((n, l) => n + l.masks.reduce((m, s) => m + s.points.length, 0), 0); }
  function pointerDown(e) {
    if (busy || gesture || e.button !== 0) return;
    commit(); canvas.focus({preventScroll: true}); const p = pointerPosition(e), u = displayUnit(); let l = selected(), mode = tool, joint;
    if (tool === 'move') {
      let handle = false;
      if (l && !l.locked && l.visible) {
        const h = handles(l);
        if (distance(p, h.rotate) < 14 * u) { mode = 'rotate'; handle = true; }
        else if (h.corners.some(c => distance(c, p) < 13 * u)) { mode = 'scale'; handle = true; }
      }
      if (!handle) {
        l = [...state.layers].reverse().find(item => hitLayer(item, p));
        state.selected = l?.id || null; sync(); requestDraw(); if (!l) return;
      }
    } else {
      if (!l || l.locked || !l.visible) { say('Select a visible, unlocked layer first.'); return; }
      if (tool === 'pose') {
        if (l.type !== 'rig') { say('Pose works with a poseable EGOR, not a flat image.'); return; }
        const nodes = rigGeometry(l);
        const nearest = Object.entries(nodes).map(([k, n]) => [k, distance(p, localToWorld(l, n.end))]).sort((a, b) => a[1] - b[1])[0];
        if (nearest[1] > 18 * u) { say('Drag a joint handle, or use the Body part controls.'); return; }
        part = nearest[0]; joint = nodes[part]; syncJoint();
      } else if (l.masks.length >= MAX_STROKES || pointCount() >= MAX_POINTS) { say('Mask limit reached. Restore an entire layer or start a new project.'); return; }
    }
    begin(); gesture = {pointer: e.pointerId, id: l.id, mode, start: p, original: clone(l), joint, points: pointCount()};
    if (tool === 'erase' || tool === 'restore') {
      const q = worldToLocal(l, p);
      l.masks.push({mode: tool, radius: brush / 2 / l.scale, points: [[q.x, q.y]]});
    }
    canvas.setPointerCapture(e.pointerId); e.preventDefault(); requestDraw();
  }
  function pointerMove(e) {
    if (!gesture || e.pointerId !== gesture.pointer) return;
    const l = selected(), g = gesture, p = pointerPosition(e), o = g.original;
    if (g.mode === 'move') { l.x = clamp(o.x + p.x - g.start.x, -2048, 3072); l.y = clamp(o.y + p.y - g.start.y, -2048, 3072); }
    if (g.mode === 'scale') l.scale = clamp(o.scale * distance(p, o) / Math.max(1, distance(g.start, o)), .05, 4);
    if (g.mode === 'rotate') l.rotation = angle(o.rotation + deg(Math.atan2(p.y - o.y, p.x - o.x) - Math.atan2(g.start.y - o.y, g.start.x - o.x)));
    if (g.mode === 'pose') {
      const q = worldToLocal(l, p), n = g.joint;
      let a = deg(Math.atan2(-(q.x - n.start.x), q.y - n.start.y)) - n.parentAngle;
      if (part === 'head') a -= 180;
      if (part.endsWith('Foot')) a += part.startsWith('left') ? -90 : 90;
      l.pose[part].angle = angle(a); l.preset = 'custom'; syncJoint();
    }
    if (g.mode === 'erase' || g.mode === 'restore') {
      const s = l.masks[l.masks.length - 1], q = worldToLocal(l, p), last = s.points[s.points.length - 1];
      if (distance(q, {x: last[0], y: last[1]}) >= Math.max(.5, s.radius / 8) && g.points + s.points.length < MAX_POINTS && s.points.length < 4000) s.points.push([q.x, q.y]);
    }
    syncTransform(); requestDraw(); e.preventDefault();
  }
  function finishGesture(cancel = false) {
    if (!gesture) return;
    const pointer = gesture.pointer; gesture = null;
    if (cancel) { state = pending; pending = null; renders.clear(); say('Edit canceled.'); } else commit();
    if (canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
    sync(); requestDraw();
  }
  function setupPointers() {
    canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', e => { if (gesture?.pointer === e.pointerId) finishGesture(); });
    canvas.addEventListener('pointercancel', () => finishGesture(true)); canvas.addEventListener('lostpointercapture', () => finishGesture(true));
    document.addEventListener('keydown', e => {
      if (busy || document.querySelector('dialog[open]')) return;
      if (e.key === 'Escape' && gesture) { e.preventDefault(); finishGesture(true); return; }
      if (e.target.closest('input,select,textarea,[contenteditable=true]')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(e.shiftKey); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); undo(true); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const keys = {v: 'move', p: 'pose', e: 'erase', r: 'restore'};
      if (keys[e.key.toLowerCase()]) { e.preventDefault(); chooseTool(keys[e.key.toLowerCase()]); }
      if (document.activeElement !== canvas || !editable()) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected(); }
      const delta = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[e.key];
      if (delta) { e.preventDefault(); mutate(() => { const l = selected(), step = e.shiftKey ? 10 : 1; l.x = clamp(l.x + delta[0] * step, -2048, 3072); l.y = clamp(l.y + delta[1] * step, -2048, 3072); }); }
    });
    window.addEventListener('blur', () => finishGesture(true));
    document.addEventListener('visibilitychange', () => { if (document.hidden) finishGesture(true); });
  }
  async function task(message, fn) {
    if (busy || gesture) return;
    commit(); busy = true; $('editor').inert = true; $('editor').setAttribute('aria-busy', 'true'); say(message);
    try { await fn(); } catch (error) { say(error.message || 'That operation could not be completed. Your existing project is unchanged.'); }
    finally { busy = false; $('editor').inert = false; $('editor').removeAttribute('aria-busy'); sync(); requestDraw(); }
  }
  function fileData(file) {
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('This file could not be read.')); reader.readAsDataURL(file); });
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function insertLoaded(l) {
    begin(); state.layers.push(l); state.selected = l.id; commit();
  }
  function setupFiles() {
    $('upload-photo').onclick = () => $('photo-input').click();
    $('photo-input').onchange = () => {
      const file = $('photo-input').files[0]; $('photo-input').value = ''; if (!file || state.layers.length >= MAX_LAYERS) return;
      task('Reading your photo locally…', async () => {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) throw new Error('Choose a PNG, JPEG or WebP smaller than 20 MB.');
        const url = URL.createObjectURL(file); let img;
        try { img = await loadImage(url); } finally { URL.revokeObjectURL(url); }
        if (img.width * img.height > 64000000) throw new Error('This photo is too large to edit safely. Resize it below 64 megapixels first.');
        const factor = Math.min(1, 1536 / Math.max(img.width, img.height)), c = makeCanvas(Math.max(1, Math.round(img.width * factor)), Math.max(1, Math.round(img.height * factor)));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const data = c.toDataURL('image/png'), image = await loadImage(data), id = uid();
        assets.set(id, {image, data});
        insertLoaded({...layer('photo', file.name.slice(0, 50)), asset: id, scale: clamp(1024 / Math.max(c.width, c.height), .05, 4)});
        say('Photo added locally. No upload was made. Drag or reorder it to compose your portrait.');
      });
    };
    document.querySelectorAll('[data-sticker]').forEach(b => {
      b.onclick = () => {
        if (state.layers.length >= MAX_LAYERS) return;
        task('Opening the supplied artwork…', async () => {
          const key = b.dataset.sticker, image = await loadImage(`assets/egor-${key}.webp`), id = uid();
          assets.set(id, {image, bundled: key}); insertLoaded({...layer('sticker', `EGOR · ${key}`), asset: id, scale: 1.25}); say('Flat artwork added. Use Move or Erase; joint posing needs a rig layer.');
        });
      };
    });
    $('save-project').onclick = () => {
      if (busy || gesture) return; commit();
      const used = [...new Set(state.layers.map(l => l.asset).filter(Boolean))], stored = {};
      for (const id of used) { const a = assets.get(id); stored[id] = a.bundled ? {bundled: a.bundled} : {data: a.data}; }
      const project = {format: 'egor-portrait', version: 1, canvasSize: SIZE, background: state.background, layers: state.layers, selected: state.selected, assets: stored};
      const blob = new Blob([JSON.stringify(project)], {type: 'application/json'});
      if (blob.size > 64 * 1024 * 1024) { say('This project exceeds the 64 MB save limit. Remove or resize photos first.'); return; }
      download(blob, 'EGOR-portrait-project.json'); baseline = fingerprint(); say('Project download requested. It includes your photos; keep it private. Check your downloads before leaving.');
    };
    $('load-project').onclick = () => $('project-input').click();
    $('project-input').onchange = () => {
      const file = $('project-input').files[0]; $('project-input').value = ''; if (!file) return;
      if (dirty() && !confirm('Open this project? Unsaved changes will be replaced.')) return;
      task('Checking the project locally…', async () => {
        if (file.size > 64 * 1024 * 1024) throw new Error('Projects must be smaller than 64 MB.');
        let project; try { project = JSON.parse(await file.text()); } catch { throw new Error('This is not a valid JSON project.'); }
        const loaded = await validateProject(project);
        // Swap only after every field and image has been checked; failed imports preserve the current project.
        assets.clear(); for (const [id, a] of loaded.assets) assets.set(id, a);
        state = loaded.state; past = []; future = []; pending = null; renders.clear(); baseline = fingerprint(); say('Project opened. Photos and edits remain in this tab only.');
      });
    };
  }
  async function validateProject(p) {
    const fail = () => { throw new Error('Unsupported or damaged EGOR project. Nothing was replaced.'); };
    const obj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
    const num = (v, lo, hi) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) fail(); return v; };
    const str = (v, max) => { if (typeof v !== 'string' || v.length > max) fail(); return v; };
    const bool = v => { if (typeof v !== 'boolean') fail(); return v; };
    const color = v => { if (typeof v !== 'string' || !/^#[0-9a-f]{6}$/i.test(v)) fail(); return v; };
    if (!obj(p) || p.format !== 'egor-portrait' || p.version !== 1 || p.canvasSize !== SIZE || !Array.isArray(p.layers) || p.layers.length > MAX_LAYERS || !obj(p.assets)) fail();
    const background = p.background === 'transparent' ? p.background : color(p.background), layers = [], ids = new Set(); let points = 0;
    for (const input of p.layers) {
      if (!obj(input) || !['rig', 'photo', 'text', 'sticker'].includes(input.type)) fail();
      const id = str(input.id, 80); if (!id || ids.has(id)) fail(); ids.add(id);
      const l = {id, type: input.type, name: str(input.name, 50), x: num(input.x, -2048, 3072), y: num(input.y, -2048, 3072), scale: num(input.scale, .05, 4), rotation: num(input.rotation, -180, 180), opacity: num(input.opacity, 0, 1), visible: bool(input.visible), locked: bool(input.locked), flip: bool(input.flip), masks: []};
      if (!Array.isArray(input.masks) || input.masks.length > MAX_STROKES) fail();
      for (const s of input.masks) {
        if (!obj(s) || !['erase', 'restore'].includes(s.mode) || !Array.isArray(s.points) || !s.points.length || s.points.length > 4000) fail();
        points += s.points.length; if (points > MAX_POINTS) fail();
        l.masks.push({mode: s.mode, radius: num(s.radius, .1, 1800), points: s.points.map(q => { if (!Array.isArray(q) || q.length !== 2) fail(); return [num(q[0], -1000000, 1000000), num(q[1], -1000000, 1000000)]; })});
      }
      if (l.type === 'rig') {
        if (!obj(input.pose)) fail(); l.pose = {};
        for (const key of Object.keys(PARTS)) { const v = input.pose[key]; if (!obj(v)) fail(); l.pose[key] = {angle: num(v.angle, -180, 180), length: num(v.length, .5, 1.5), visible: bool(v.visible)}; }
        if (input.preset !== 'custom' && !Object.hasOwn(PRESETS, input.preset)) fail(); l.preset = input.preset;
      } else if (l.type === 'text') { l.text = str(input.text, 100); l.fontSize = num(input.fontSize, 16, 180); l.color = color(input.color); }
      else l.asset = str(input.asset, 80);
      layers.push(l);
    }
    const loadedAssets = new Map();
    for (const id of new Set(layers.map(l => l.asset).filter(Boolean))) {
      if (!Object.hasOwn(p.assets, id) || !obj(p.assets[id])) fail();
      const a = p.assets[id]; let src, record;
      if (STICKERS.includes(a.bundled)) { src = `assets/egor-${a.bundled}.webp`; record = {bundled: a.bundled}; }
      else {
        if (typeof a.data !== 'string' || a.data.length > 16 * 1024 * 1024 || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(a.data)) fail();
        // Check PNG IHDR before decode to reject oversized project bitmaps.
        let header; try { header = atob(a.data.slice(22, 66)); } catch { fail(); }
        if (header.slice(0, 8) !== '\x89PNG\r\n\x1a\n' || header.slice(12, 16) !== 'IHDR') fail();
        const read32 = offset => ((header.charCodeAt(offset) * 16777216) + (header.charCodeAt(offset + 1) << 16) + (header.charCodeAt(offset + 2) << 8) + header.charCodeAt(offset + 3));
        if (read32(16) < 1 || read32(20) < 1 || read32(16) > 1536 || read32(20) > 1536) fail();
        src = a.data; record = {data: a.data};
      }
      const image = await loadImage(src); if (image.width > 1536 || image.height > 1536) fail(); loadedAssets.set(id, {...record, image});
    }
    if (layers.some(l => ['photo', 'sticker'].includes(l.type) && !loadedAssets.has(l.asset))) fail();
    return {state: {background, layers, selected: ids.has(p.selected) ? p.selected : layers[0]?.id || null}, assets: loadedAssets};
  }
  function setupExport() {
    const preview = () => drawScene($('export-preview').getContext('2d'), 320, $('export-shape').value === 'circle');
    $('export-open').onclick = () => { if (busy || gesture) return; commit(); preview(); $('export-status').textContent = ''; $('export-dialog').showModal(); };
    $('export-shape').onchange = preview;
    $('download-png').onclick = async () => {
      const button = $('download-png'); if (button.disabled) return; button.disabled = true; $('export-status').textContent = 'Rendering your PNG locally…';
      try {
        const size = Number($('export-size').value), circle = $('export-shape').value === 'circle', c = makeCanvas(size, size); drawScene(c.getContext('2d'), size, circle);
        const blob = await new Promise(resolve => c.toBlob(resolve, 'image/png')); if (!blob) throw new Error('PNG creation failed. Try a smaller resolution.');
        download(blob, `EGOR-portrait-${size}${circle ? '-circle' : ''}.png`); $('export-status').textContent = 'PNG download requested. Save a project too if you want to edit later.';
      } catch (error) { $('export-status').textContent = error.message; } finally { button.disabled = false; }
    };
  }
  async function boot() {
    if (!ctx) throw new Error('This browser does not support the canvas editor.');
    head = await loadImage('assets/studio/head.png');
    await document.fonts.ready;
    state = initial(); baseline = fingerprint(); setupControls(); setupPointers(); setupFiles(); setupExport();
    $('editor').hidden = false; $('boot-message').hidden = true; sync(); fitView();
    new ResizeObserver(fitView).observe($('viewport'));
    window.addEventListener('beforeunload', e => { if (dirty()) { e.preventDefault(); e.returnValue = ''; } });
    canvas.dataset.tool = tool;
  }
  boot().catch(() => {
    $('boot-message').textContent = 'The drawing desk could not load. Check that the complete site files are present, then reload. Your browser needs JavaScript and Canvas 2D. You can return to the world using the link above.';
  });
})();

/* Wordyssey v2 — gameplay & render enhancements.
   Loads after game.js and extends its classes in place. */
(() => {
  'use strict';
  try {
    const P = WordiPlayer.prototype, E = Enemy.prototype, G = GameEngine.prototype;
    const DASH_T = 0.16, DASH_CD = 0.8, COMBO_MS = 2600;
    const $ = (id) => document.getElementById(id);
    const mult = () => (DIFFICULTY_CONFIG[progress.difficulty] || DIFFICULTY_CONFIG.normal).scoreMultiplier;

    /* Real pronunciation via the browser's speech engine */
    window.speakWord = (w) => {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(w);
        u.lang = 'en-US'; u.rate = 0.85;
        speechSynthesis.speak(u);
      } catch (_) {}
    };

    /* ---------- Player: game feel + new moves ---------- */
    const pReset = P.reset, pDamage = P.takeDamage, pUpdate = P.update;

    P.reset = function (...a) {
      pReset.apply(this, a);
      Object.assign(this, { _coy: 0, _buf: 0, _dashT: 0, _dashCd: 0, _dashDir: 1, _pound: false,
        _cut: false, _noCut: false, _safe: null, _safeT: 0, _downPrev: false });
    };

    // Dashing is a brief i-frame window
    P.takeDamage = function (n) { return this._dashT > 0 ? false : pDamage.call(this, n); };

    P.update = function (dt, input) {
      const game = this.game, prevY = this.y;

      // Jump buffer (press slightly early) + coyote time (jump slightly late)
      this._buf = input.jumpPressed ? 0.12 : Math.max(0, this._buf - dt);
      if (input.jumpPressed && !this.onGround && this._coy > 0) {
        this.vy = CONFIG.JUMP_FORCE; this.canDoubleJump = true;
        this._coy = 0; this._buf = 0; input.jumpPressed = false;
        game.sound.playJump();
        game.particles.createDust(this.x + this.width / 2, this.y + this.height);
      } else if (this._buf > 0 && this.onGround) {
        input.jumpPressed = true; this._buf = 0;
      }

      // Dash
      if (input.dashPressed) {
        input.dashPressed = false;
        if (this._dashCd <= 0 && !this._pound) {
          this._dashT = DASH_T; this._dashCd = DASH_CD; this._dashDir = this.facing; this.vy = 0;
          game.sound.playBark();
          game.particles.burst(this.x + this.width / 2, this.y + this.height / 2, 8, ['#c6ff3d', '#ffffff']);
        }
      }
      this._dashCd = Math.max(0, this._dashCd - dt);

      // Ground pound: fresh down-press while airborne
      if (input.down && !this._downPrev && !this.onGround && !this._pound && this._dashT <= 0) {
        this._pound = true; game.sound.playJump();
      }
      this._downPrev = !!input.down;
      if (this._pound) this.vy = CONFIG.MAX_FALL_SPEED;

      // Run the original physics (dash overrides horizontal speed for its duration)
      const dashing = this._dashT > 0, sp = CONFIG.PLAYER_SPEED, bsp = CONFIG.PLAYER_BOOST_SPEED;
      let inp = input;
      if (dashing) {
        this._dashT -= dt; this.vy = 0;
        inp = Object.assign({}, input, { left: this._dashDir < 0, right: this._dashDir > 0 });
        CONFIG.PLAYER_SPEED = CONFIG.PLAYER_BOOST_SPEED = 760;
      }
      try { pUpdate.call(this, dt, inp); }
      finally { CONFIG.PLAYER_SPEED = sp; CONFIG.PLAYER_BOOST_SPEED = bsp; }
      if (inp !== input) { input.jumpPressed = inp.jumpPressed; input.shootPressed = inp.shootPressed; }

      // Variable jump height: release early for a short hop (bounce pads are exempt)
      if (this.vy < -600) this._noCut = true;
      if (this.vy >= 0) { this._noCut = false; this._cut = false; }
      if (!input.up && this.vy < -150 && !this._cut && !this._noCut && !this._pound) { this.vy *= 0.5; this._cut = true; }

      // Coyote bookkeeping
      if (this.vy < 0) this._coy = 0;
      else if (this.onGround) this._coy = 0.1;
      else this._coy = Math.max(0, this._coy - dt);

      // Fair respawn: after a pit fall, return to the last safe ground instead of a random spot
      const sp2 = this.standingPlatform;
      if (this.onGround && sp2 && !sp2.isHazard && !sp2.isMoving && !sp2.isCrumbling && !sp2.isBouncePad && !sp2.isQuantum) {
        this._safeT += dt;
        if (this._safeT > 0.35) this._safe = { x: this.x, y: this.y };
      } else this._safeT = 0;
      if (prevY > 500 && this.y === 80 && this._safe) { this.x = this._safe.x; this.y = this._safe.y; this.vy = 0; }

      // Ground pound impact
      if (this._pound && this.onGround) {
        this._pound = false;
        const cx = this.x + this.width / 2, fy = this.y + this.height;
        for (const e of game.enemies) {
          if (e.active && Math.abs(e.x + e.width / 2 - cx) < 150 && Math.abs(e.y + e.height - fy) < 80) {
            e.hit(e.type === 'slime' || e.type === 'bat' ? 1 : 2, game);
            if (e.type === 'boss') e._stun = 0.9;
          }
        }
        game.rings.push({ x: cx, y: fy, t: 0 });
        game.particles.burst(cx, fy, 22, ['#ffffff', '#ffd43b', '#ff7a1a']);
        game.triggerScreenShake(10); game.hitstop(0.06); game.sound.playEnemyDefeat();
      }

      // Dash-slash and stomp (porcupines are spiky: bark or pound them instead)
      const b = this.getBounds();
      for (const e of game.enemies) {
        if (!e.active || e._stun > 0) continue;
        const eb = e.getBounds();
        if (!rectsIntersect(b, eb)) continue;
        if (this._dashT > 0) {
          if (e.type !== 'boss' && !(e._dh > 0)) { e._dh = 0.25; e.hit(e.type === 'porcupine' ? 2 : 1, game); }
        } else if (this.vy > 40 && e.type !== 'porcupine' && b.y + b.height - eb.y < 24 + this.vy * dt) {
          e.hit(e.type === 'boss' ? 2 : 1, game);
          if (e.type === 'boss') e._stun = 0.8;
          this.vy = input.up ? -560 : -380;
          this.canDoubleJump = true; this._cut = true; this._pound = false; this.onGround = false;
          game.particles.burst(b.x + b.width / 2, b.y + b.height, 10, ['#ffffff', '#c6ff3d']);
        }
      }
    };

    /* ---------- Enemies: stun, boss enrage, combo hooks ---------- */
    const eUpdate = E.update, eHit = E.hit;

    E.update = function (dt, game) {
      if (this._dh > 0) this._dh -= dt;
      if (this._stun > 0) { this._stun -= dt; this.animTime += dt; return; }
      if (this.type === 'boss' && this.hp <= this.maxHp / 2) this.attackTimer = (this.attackTimer || 0) + dt * 0.8;
      eUpdate.call(this, dt, game);
    };

    E.hit = function (d, game) {
      const was = this.active, cx = this.x + this.width / 2;
      eHit.call(this, d, game);
      if (was && !this.active) {
        game.pop(cx, this.y - 6, '+' + Math.round((this.type === 'boss' ? 1000 : 150) * mult()), '#ffffff');
        game.addCombo(cx, this.y - 28);
        game.hitstop(0.05);
      }
    };

    /* ---------- Game engine: combos, hit-stop, boss victory ---------- */
    const gLoad = G.loadLevel, gUpdate = G.update, gRender = G.render, gStar = G.collectStar,
      gClear = G.stageClear, gQuiz = G.handleQuizAnswer;

    G.loadLevel = function (id) {
      Object.assign(this, { comboCount: 0, _comboAt: -1e9, popups: [], rings: [], _ghosts: [], _hs: 0 });
      gLoad.call(this, id);
      this._hadBoss = this.enemies.some((e) => e.type === 'boss');
    };

    G.hitstop = function (t) { this._hs = Math.max(this._hs || 0, t); };
    G.pop = function (x, y, text, color) { this.popups.push({ x, y, text, color, t: 0 }); };

    G.addCombo = function (x, y) {
      const now = performance.now();
      this.comboCount = now - this._comboAt < COMBO_MS ? this.comboCount + 1 : 1;
      this._comboAt = now;
      if (this.comboCount > 1) {
        this.addScore(25 * this.comboCount);
        this.pop(x, y, '×' + this.comboCount, '#c6ff3d');
        this.sound.playPickupStar();
      }
    };

    G.collectStar = function (x, y) {
      gStar.call(this, x, y);
      this.pop(x, y - 12, '+' + Math.round(100 * mult()), '#ffd43b');
      this.addCombo(x, y - 34);
    };

    G.update = function (dt) {
      if (this._hs > 0) { this._hs -= dt; return; }
      gUpdate.call(this, dt);
      for (const [k, life] of [['popups', 0.9], ['rings', 0.45], ['_ghosts', 0.25]]) {
        this[k].forEach((o) => { o.t += dt; });
        this[k] = this[k].filter((o) => o.t < life);
      }
      const p = this.player;
      if (p._dashT > 0) this._ghosts.push({ x: p.x, y: p.y, t: 0 });

      // Defeating the Word Titan now actually wins the game
      if (this.currentLevelId === 'final' && this._hadBoss && this.state === 'PLAYING' &&
          !this.enemies.some((e) => e.type === 'boss')) this.stageClear();

      const el = $('fxCombo');
      if (el) {
        const t = this.comboCount > 1 && performance.now() - this._comboAt < COMBO_MS ? '×' + this.comboCount + ' COMBO' : '';
        if (el.textContent !== t) {
          el.textContent = t;
          if (t) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
        }
      }
    };

    G.stageClear = function () {
      gClear.call(this);
      const s = document.querySelector('#modalStageClear .sub');
      if (s) s.textContent = this._hadBoss && !this.enemies.some((e) => e.type === 'boss')
        ? 'The Word Titan has fallen.' : 'All 10 stars collected.';
    };

    /* Say the word out loud on every correct answer */
    G.handleQuizAnswer = function (c, el) {
      if (this.activeQuiz && c === this.activeQuiz.answer) window.speakWord(c);
      gQuiz.call(this, c, el);
    };
    const qh = QuizArenaEngine.prototype.handleAnswer;
    QuizArenaEngine.prototype.handleAnswer = function (c, b) {
      if (this.currentQuestion && c === this.currentQuestion.answer) window.speakWord(c);
      qh.call(this, c, b);
    };

    /* ---------- Cinematic render pass drawn over the original scene ---------- */
    const TINT = { 1: '255,170,70', 2: '255,80,60', 3: '80,110,255', 4: '200,60,255', 5: '255,190,60' };

    const drawFx = (g) => {
      const c = g.ctx, W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT, cam = g.cameraX;
      const st = g.currentStageData || STAGES[0], p = g.player;
      c.save();

      // Additive glow behind pickups
      c.globalCompositeOperation = 'lighter';
      for (const it of g.collectibles) {
        if (it.collected) continue;
        const x = it.x - cam;
        if (x < -40 || x > W + 40) continue;
        const r = 28, gr = c.createRadialGradient(x, it.y, 2, x, it.y, r);
        gr.addColorStop(0, it.type === 'star' ? 'rgba(255,200,60,.5)' : 'rgba(120,220,255,.4)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gr; c.fillRect(x - r, it.y - r, r * 2, r * 2);
      }
      // Dash afterimages
      for (const o of g._ghosts) {
        c.globalAlpha = 0.4 * (1 - o.t / 0.25); c.fillStyle = '#c6ff3d';
        c.beginPath(); c.ellipse(o.x - cam + 23, o.y + 24, 19, 17, 0, 0, 7); c.fill();
      }
      c.globalAlpha = 1;

      // Per-world colour grade, then vignette
      c.globalCompositeOperation = 'overlay';
      const tint = TINT[st.id] || '255,255,255', gg = c.createLinearGradient(0, 0, 0, H);
      gg.addColorStop(0, 'rgba(' + tint + ',.38)'); gg.addColorStop(1, 'rgba(' + tint + ',0)');
      c.fillStyle = gg; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const v = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
      v.addColorStop(0, 'rgba(8,6,14,0)'); v.addColorStop(1, 'rgba(8,6,14,.55)');
      c.fillStyle = v; c.fillRect(0, 0, W, H);

      // Speed lines while dashing
      if (p._dashT > 0) {
        const t = performance.now();
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
          const y = (i * 83 + t * 0.9) % H, x = (((i * 197 - t * 2.4 * p._dashDir) % W) + W) % W;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x - p._dashDir * 120, y); c.stroke();
        }
      }
      // Slam shockwaves
      for (const r of g.rings) {
        const k = r.t / 0.45;
        c.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; c.lineWidth = 1 + 4 * (1 - k);
        c.beginPath(); c.ellipse(r.x - cam, r.y, 20 + k * 130, 6 + k * 18, 0, 0, 7); c.stroke();
      }
      // Dash cooldown bar under Wordi
      if (p._dashCd > 0) {
        const x = p.x - cam + 6, y = p.y + p.height + 6;
        c.fillStyle = '#0b0a0e'; c.fillRect(x, y, 34, 4);
        c.fillStyle = '#c6ff3d'; c.fillRect(x, y, 34 * (1 - p._dashCd / DASH_CD), 4);
      }
      // Floating score popups
      c.textAlign = 'center'; c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = '#0b0a0e';
      c.font = '800 20px "Bricolage Grotesque","Arial Black",sans-serif';
      for (const o of g.popups) {
        const k = o.t / 0.9, x = o.x - cam, y = o.y - k * 44;
        c.globalAlpha = 1 - k * k; c.strokeText(o.text, x, y); c.fillStyle = o.color; c.fillText(o.text, x, y);
      }
      c.restore();
    };

    G.render = function () {
      gRender.call(this);
      try { drawFx(this); } catch (_) {}
    };

    /* ---------- Input & DOM wiring ---------- */
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') &&
          window.game && window.game.state === 'PLAYING') window.game.input.dashPressed = true;
    });

    window.addEventListener('DOMContentLoaded', () => {
      const hud = $('hudOverlay');
      if (hud) hud.insertAdjacentHTML('beforeend', '<div id="fxHud"><div class="combo" id="fxCombo"></div></div>');

      const keys = document.querySelector('#modalStart .keys tbody');
      if (keys) keys.insertAdjacentHTML('beforeend',
        '<tr><td>Dash (cuts through foes)</td><td><kbd>Shift</kbd> <kbd>K</kbd></td></tr>' +
        '<tr><td>Ground Pound</td><td><kbd>S</kbd> in mid-air</td></tr>' +
        '<tr><td>Stomp</td><td>Land on a foe</td></tr>');

      const grp = document.querySelectorAll('#touchControls .touch-grp')[1];
      if (grp) {
        const b = document.createElement('button');
        b.className = 'touch-btn dash'; b.type = 'button'; b.textContent = '»'; b.setAttribute('aria-label', 'Dash');
        b.addEventListener('touchstart', (e) => { e.preventDefault(); if (window.game) window.game.input.dashPressed = true; }, { passive: false });
        grp.appendChild(b);
      }

      const pb = $('btnPlayWordAudio');
      if (pb) pb.onclick = () => { const q = window.suite && window.suite.quiz.currentQuestion; if (q) window.speakWord(q.answer); };
    });
  } catch (err) {
    console.warn('Wordyssey enhancements failed to load; the base game is unaffected.', err);
  }
})();

/* Pointer fixes: roomier stage hit-areas, hand cursor + click on the "Let's Go" callout. */
(() => {
  try {
    const M = WorldMapEngine.prototype, HIT = 30;
    const omm = M.onMouseMove, ocl = M.onClick;
    const logical = (cv, e) => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) * CONFIG.CANVAS_WIDTH / r.width, (e.clientY - r.top) * CONFIG.CANVAS_HEIGHT / r.height];
    };

    // Nearest stage within a larger radius (was a 22px circle, first match wins)
    M.getNodeUnderCursor = function (mx, my) {
      let best = null, bd = HIT;
      for (const isl of MAP_ISLANDS) for (const n of isl.nodes) {
        const d = Math.hypot(mx - n.x, my - n.y);
        if (d <= bd) { best = n; bd = d; }
      }
      return best;
    };

    // The callout floats above the active stage, so its box can be derived from that node
    M.calloutRect = function () {
      const id = progress.activeLevelId || '1-1';
      let n = null;
      for (const isl of MAP_ISLANDS) for (const k of isl.nodes) if (k.id === id) n = k;
      n = n || MAP_ISLANDS[0].nodes[0];
      return { x: n.x + 14, y: n.y - 75, w: 72, h: 22, node: n };
    };
    M.overCallout = function (mx, my) {
      const r = this.calloutRect();
      return mx >= r.x - 2 && mx <= r.x + r.w + 2 && my >= r.y - 2 && my <= r.y + r.h + 10;
    };

    M.onMouseMove = function (e) {
      const [mx, my] = logical(this.canvas, e);
      this._calloutHot = !this.getNodeUnderCursor(mx, my) && this.overCallout(mx, my);
      omm.call(this, e);
      this.canvas.style.cursor = this.hoveredNode || this._calloutHot ? 'pointer' : 'default';
    };

    M.onClick = function (e) {
      const [mx, my] = logical(this.canvas, e);
      if (!this.getNodeUnderCursor(mx, my) && this.overCallout(mx, my)) {
        const n = this.calloutRect().node;
        this.selectNode(n);
        if (progress.unlockedLevels.includes(n.id)) this.suite.startLevelFromMap(n);
        return;
      }
      ocl.call(this, e);
    };

    window.addEventListener('DOMContentLoaded', () => {
      const cv = document.getElementById('worldMapCanvas');
      if (cv) cv.addEventListener('mouseleave', () => {
        const m = window.suite && window.suite.map;
        if (m) m._calloutHot = false;
        cv.style.cursor = 'default';
      });
    });
  } catch (err) {
    console.warn('Pointer fixes failed to load.', err);
  }
})();

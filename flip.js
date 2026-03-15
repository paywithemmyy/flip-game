// ─── Score State ───────────────────────────────────────────────────────────
const players = {
  1: JSON.parse(localStorage.getItem('player1')) || { wins: 0, losses: 0 },
  2: JSON.parse(localStorage.getItem('player2')) || { wins: 0, losses: 0 },
};
let currentPlayer = 1;
let totalFlips = { 1: 0, 2: 0 };
let gameActive = true;

// ─── Display ────────────────────────────────────────────────────────────────
function displayScores() {
  document.querySelector('.js-wins').textContent = players[currentPlayer].wins;
  document.querySelector('.js-losses').textContent = players[currentPlayer].losses;
  document.querySelector('.current-player-label').textContent = `Player ${currentPlayer}'s Turn`;
}

function bumpEl(el) {
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
  el.addEventListener('animationend', () => el.classList.remove('bump'), { once: true });
}

// ─── Audio Engine ───────────────────────────────────────────────────────────
function playWhoosh() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = ctx.sampleRate * 0.6;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.5);
  filter.Q.value = 1.5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

function playHorrorLoss() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const t = ctx.currentTime;

  // Deep creepy drone
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(80, t);
  osc1.frequency.linearRampToValueAtTime(40, t + 1.5);

  // Dissonant second oscillator
  const osc2 = ctx.createOscillator();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(85, t);
  osc2.frequency.linearRampToValueAtTime(38, t + 1.5);

  // Tremolo (horror wobble)
  const tremolo = ctx.createOscillator();
  tremolo.frequency.value = 6;
  const tremoloGain = ctx.createGain();
  tremoloGain.gain.value = 0.4;
  tremolo.connect(tremoloGain);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.6, t + 0.2);
  gain.gain.linearRampToValueAtTime(0, t + 1.5);

  // Distortion
  const distortion = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    curve[i] = (Math.PI + 400) * x / (Math.PI + 400 * Math.abs(x));
  }
  distortion.curve = curve;

  tremoloGain.connect(gain);
  osc1.connect(distortion);
  osc2.connect(distortion);
  distortion.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(t); osc1.stop(t + 1.5);
  osc2.start(t); osc2.stop(t + 1.5);
  tremolo.start(t); tremolo.stop(t + 1.5);
}

function playEvilLaugh() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const t = ctx.currentTime;

  // Pitch-shifted laugh simulation using modulated oscillator
  [0, 0.15, 0.3, 0.45, 0.6].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const freq = 180 + i * 20;
    osc.frequency.setValueAtTime(freq, t + delay);
    osc.frequency.linearRampToValueAtTime(freq * 1.3, t + delay + 0.1);
    osc.frequency.linearRampToValueAtTime(freq, t + delay + 0.12);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t + delay);
    gain.gain.linearRampToValueAtTime(0.3, t + delay + 0.02);
    gain.gain.linearRampToValueAtTime(0, t + delay + 0.12);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + delay);
    osc.stop(t + delay + 0.15);
  });
}

// ─── Monster Horror Effect ───────────────────────────────────────────────────
function triggerMonsterEffect() {
  // Play deep horror sound
  playHorrorLoss();
  playHorrorLoss();

  const monster = document.getElementById('monster-overlay');
  monster.innerHTML = `
    <div class="monster-content">
      <div class="monster-face">👹</div>
      <div class="monster-text">YOU HAVE BEEN<br>CONSUMED...</div>
      <div class="monster-sub">The darkness claims another soul 💀</div>
      <button class="monster-btn" onclick="dismissMonster()">ESCAPE... IF YOU CAN</button>
    </div>
    <div class="monster-cracks">
      ${Array.from({length: 12}, () => `<div class="crack"></div>`).join('')}
    </div>
  `;
  monster.classList.add('active');
  document.body.classList.add('horror-mode');
}

function dismissMonster() {
  const monster = document.getElementById('monster-overlay');
  monster.classList.remove('active');
  document.body.classList.remove('horror-mode');
  clearScores();
}

// ─── Multiplayer Switch ──────────────────────────────────────────────────────
function switchPlayer() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  displayScores();

  const card = document.querySelector('.card');
  card.classList.add('player-switch');
  setTimeout(() => card.classList.remove('player-switch'), 500);
}

// ─── Main Game ───────────────────────────────────────────────────────────────
function playGame(guess) {
  if (!gameActive) return;
  gameActive = false;

  playWhoosh();

  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const won = guess === result;

  // Disable buttons during flip
  document.querySelectorAll('.btn').forEach(b => b.disabled = true);

  // Show suspense message
  const msg = document.getElementById('result');
  msg.className = 'result-msg suspense';
  msg.textContent = '🪙 The coin is in the air...';

  // Coin flip animation
  const coin = document.getElementById('coin');
  coin.classList.remove('flip-heads', 'flip-tails', 'flip-spin');
  void coin.offsetWidth;
  coin.classList.add('flip-spin');

  setTimeout(() => {
    coin.classList.remove('flip-spin');
    coin.classList.add(result === 'heads' ? 'flip-heads' : 'flip-tails');

    setTimeout(() => {
      if (won) {
        score.wins++;
        players[currentPlayer].wins++;
        playEvilLaugh();
        msg.className = 'result-msg win';
        msg.textContent = `🎉 It was ${result}! Player ${currentPlayer} WINS!`;
        bumpEl(document.querySelector('.js-wins'));
        triggerConfetti();
      } else {
        players[currentPlayer].losses++;
        playHorrorLoss();
        msg.className = 'result-msg loss';
        msg.textContent = `💀 It was ${result}. Player ${currentPlayer} LOSES!`;
        bumpEl(document.querySelector('.js-losses'));
        shakeCard();
      }

      totalFlips[currentPlayer]++;
      displayScores();
      localStorage.setItem(`player${currentPlayer}`, JSON.stringify(players[currentPlayer]));

      // Check monster condition after 10 flips
      if (totalFlips[currentPlayer] >= 10 &&
          players[currentPlayer].losses > players[currentPlayer].wins) {
        setTimeout(triggerMonsterEffect, 1000);
      }

      // Re-enable buttons
      setTimeout(() => {
        document.querySelectorAll('.btn').forEach(b => b.disabled = false);
        gameActive = true;
      }, 500);

    }, 300);
  }, 1200);
}

// ─── Confetti ────────────────────────────────────────────────────────────────
function triggerConfetti() {
  const container = document.querySelector('.card');
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.background = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)];
    container.appendChild(confetti);
    setTimeout(() => confetti.remove(), 2000);
  }
}

// ─── Shake ───────────────────────────────────────────────────────────────────
function shakeCard() {
  const card = document.querySelector('.card');
  card.classList.add('shake');
  card.addEventListener('animationend', () => card.classList.remove('shake'), { once: true });
}

// ─── Score & Legacy ──────────────────────────────────────────────────────────
// Keep legacy score for single-player reference
const score = JSON.parse(localStorage.getItem('score')) || { wins: 0, losses: 0 };

function clearScores() {
  players[1] = { wins: 0, losses: 0 };
  players[2] = { wins: 0, losses: 0 };
  totalFlips = { 1: 0, 2: 0 };
  score.wins = 0;
  score.losses = 0;
  localStorage.clear();
  displayScores();
  const msg = document.getElementById('result');
  msg.className = 'result-msg';
  msg.textContent = 'Pick heads or tails!';
}

displayScores();
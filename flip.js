const score = JSON.parse(localStorage.getItem('score')) || { wins: 0, losses: 0 };

  function displayScores() {
    const wEl = document.querySelector('.js-wins');
    const lEl = document.querySelector('.js-losses');
    wEl.textContent = score.wins;
    lEl.textContent = score.losses;
  }

  function bumpEl(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
    el.addEventListener('animationend', () => el.classList.remove('bump'), { once: true });
  }

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

    // Bandpass filter for a whooshy swoosh
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

  function playGame(guess) {
    playWhoosh();
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = guess === result;

    // Coin flip animation
    const coin = document.getElementById('coin');
    coin.classList.remove('flip-heads', 'flip-tails');
    void coin.offsetWidth;
    coin.classList.add(result === 'heads' ? 'flip-heads' : 'flip-tails');

    if (won) {
      score.wins++;
      bumpEl(document.querySelector('.js-wins'));
    } else {
      score.losses++;
      bumpEl(document.querySelector('.js-losses'));
    }

    const msg = document.getElementById('result');
    msg.className = 'result-msg ' + (won ? 'win' : 'loss');
    msg.textContent = won
      ? `🎉 It was ${result}! You win!`
      : `😬 It was ${result}. Better luck next time!`;

    displayScores();
    localStorage.setItem('score', JSON.stringify(score));
  }

  function clearScores() {
    score.wins = 0;
    score.losses = 0;
    localStorage.clear();
    displayScores();
    document.getElementById('result').className = 'result-msg';
    document.getElementById('result').textContent = 'Pick heads or tails!';
  }

  displayScores();
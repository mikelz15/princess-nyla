(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const hud = document.getElementById("hud");
  const touchPad = document.getElementById("touch");
  const starCountEl = document.getElementById("star-count");
  const levelNameEl = document.getElementById("level-name");
  const muteBtn = document.getElementById("mute-btn");
  const playBtn = document.getElementById("play-btn");
  const heartImgs = [...document.querySelectorAll("#hearts img")];
  const gemHud = document.getElementById("gem-hud");
  const gemCountEl = document.getElementById("gem-count");

  const W = 1280;
  const H = 720;
  const PW = 72;
  const PH = 118;

  const assets = {};
  const keys = new Set();
  const hold = { left: false, right: false, jump: false, duck: false, star: false, gem: false };
  let bolts = [];
  let bossShots = [];

  let mode = "title";
  let last = 0;
  let time = 0;
  let starsTotal = 0;
  let starsFound = 0;
  let gemsTotal = 0;
  let gemGlow = 0;
  let muted = false;
  let audio;
  let musicTimer = 0;
  let camX = 0;
  let flash = 0;
  let toast = "";
  let toastT = 0;
  let particles = [];
  let levelIndex = 0;
  let player;
  let level;
  let walkFrame = 0;
  let coyote = 0;
  let jumpBuf = 0;
  let safe = { x: 80, y: 400 };
  let awaitingAdvance = false;
  const MAX_HEARTS = 3;
  let hearts = 3;
  let retrying = false;
  let flashColor = "255,245,200";

  const LEVELS = [
    {
      name: "Rose Garden",
      bg: "garden",
      platform: "grass",
      width: 3900,
      spawn: { x: 90, y: 480 },
      platforms: [
        { x: 0, y: 610, w: 760 },
        { x: 860, y: 540, w: 300 },
        { x: 1240, y: 470, w: 280 },
        { x: 1620, y: 560, w: 360 },
        { x: 2080, y: 470, w: 250 },
        { x: 2420, y: 390, w: 280 },
        { x: 2800, y: 500, w: 320 },
        { x: 3220, y: 590, w: 680 },
      ],
      stars: [
        [420, 520], [980, 450], [1360, 380], [1760, 470],
        [2180, 380], [2540, 300], [2920, 410], [3500, 500],
      ],
      hearts: [[1640, 470]],
      gems: [[2460, 300]],
      friends: [{ kind: "bunny", x: 280, y: 610 }],
      enemies: [
        { kind: "bramble", x: 980, y: 540, left: 870, right: 1140, speed: 1.25 },
        { kind: "bramble", x: 1760, y: 560, left: 1640, right: 1960, speed: 1.4 },
        { kind: "puff", x: 2520, y: 300, left: 2320, right: 2720, speed: 1.0 },
        { kind: "bramble", x: 2920, y: 500, left: 2810, right: 3100, speed: 1.45 },
      ],
      crown: { x: 3480, y: 590 },
      prince: { x: 3680, y: 590 },
      rescue: "the rose vines",
    },
    {
      name: "Candy Clouds",
      bg: "clouds",
      platform: "cloud",
      width: 4200,
      spawn: { x: 80, y: 430 },
      platforms: [
        { x: 0, y: 560, w: 420 },
        { x: 520, y: 480, w: 260 },
        { x: 900, y: 400, w: 240 },
        { x: 1260, y: 500, w: 280 },
        { x: 1680, y: 390, w: 240 },
        { x: 2060, y: 310, w: 260 },
        { x: 2460, y: 420, w: 280 },
        { x: 2880, y: 340, w: 250 },
        { x: 3280, y: 460, w: 300 },
        { x: 3720, y: 560, w: 480 },
      ],
      stars: [
        [220, 470], [620, 390], [1000, 310], [1380, 410],
        [1780, 300], [2160, 220], [2580, 330], [2980, 250],
        [3400, 370], [3920, 470],
      ],
      hearts: [[2080, 220]],
      gems: [[2900, 250]],
      friends: [{ kind: "unicorn", x: 140, y: 560 }],
      enemies: [
        { kind: "bramble", x: 640, y: 480, left: 530, right: 760, speed: 1.45 },
        { kind: "puff", x: 1020, y: 310, left: 900, right: 1140, speed: 1.15 },
        { kind: "bat", x: 1780, y: 290, left: 1680, right: 1920, speed: 1.3 },
        { kind: "goblin", x: 2580, y: 420, left: 2470, right: 2720, speed: 1.7 },
        { kind: "puff", x: 2980, y: 240, left: 2880, right: 3120, speed: 1.25 },
        { kind: "bat", x: 3400, y: 360, left: 3280, right: 3560, speed: 1.4 },
      ],
      crown: { x: 3820, y: 560 },
      prince: { x: 4000, y: 560 },
      rescue: "a sticky candy cloud",
    },
    {
      name: "Crystal Caves",
      bg: "cave",
      platform: "grass",
      width: 4300,
      spawn: { x: 80, y: 160 },
      platforms: [
        { x: 0, y: 280, w: 420 },
        { x: 500, y: 360, w: 220 },
        { x: 820, y: 450, w: 210 },
        { x: 1120, y: 380, w: 200 },
        { x: 1420, y: 500, w: 230 },
        { x: 1760, y: 420, w: 210 },
        { x: 2080, y: 540, w: 240 },
        { x: 2420, y: 430, w: 210 },
        { x: 2740, y: 330, w: 220 },
        { x: 3080, y: 440, w: 230 },
        { x: 3440, y: 560, w: 860 },
      ],
      stars: [
        [180, 190], [560, 270], [900, 360], [1200, 290],
        [1500, 410], [1840, 330], [2160, 450], [2500, 340],
        [2820, 240], [3160, 350], [3600, 470], [4000, 470],
      ],
      hearts: [[1120, 290]],
      gems: [[1760, 330], [3480, 470]],
      friends: [{ kind: "bunny", x: 3520, y: 560 }],
      enemies: [
        { kind: "goblin", x: 580, y: 360, left: 510, right: 700, speed: 1.7 },
        { kind: "bat", x: 900, y: 360, left: 820, right: 1020, speed: 1.5 },
        { kind: "bramble", x: 1520, y: 500, left: 1430, right: 1630, speed: 1.65 },
        { kind: "puff", x: 1840, y: 330, left: 1760, right: 1960, speed: 1.4 },
        { kind: "bat", x: 2500, y: 340, left: 2420, right: 2620, speed: 1.55 },
        { kind: "goblin", x: 2820, y: 330, left: 2750, right: 2940, speed: 1.9 },
        { kind: "puff", x: 3160, y: 350, left: 3080, right: 3300, speed: 1.5 },
      ],
      crown: { x: 3920, y: 560 },
      prince: { x: 4120, y: 560 },
      rescue: "a crystal cage",
    },
    {
      name: "Star Palace",
      bg: "palace",
      platform: "cloud",
      width: 4600,
      spawn: { x: 90, y: 430 },
      platforms: [
        { x: 0, y: 580, w: 420 },
        { x: 520, y: 500, w: 220 },
        { x: 840, y: 400, w: 200 },
        { x: 1140, y: 500, w: 210 },
        { x: 1460, y: 370, w: 210 },
        { x: 1780, y: 290, w: 200 },
        { x: 2100, y: 400, w: 210 },
        { x: 2440, y: 300, w: 200 },
        { x: 2760, y: 420, w: 220 },
        { x: 3100, y: 330, w: 200 },
        { x: 3420, y: 460, w: 230 },
        { x: 3780, y: 560, w: 820 },
      ],
      stars: [
        [220, 490], [600, 410], [920, 310], [1240, 410],
        [1540, 280], [1860, 200], [2180, 310], [2520, 210],
        [2840, 330], [3180, 240], [3520, 370], [4000, 470],
      ],
      hearts: [[1780, 200], [2760, 330]],
      gems: [[1460, 280], [3100, 240]],
      friends: [
        { kind: "unicorn", x: 180, y: 580 },
        { kind: "bunny", x: 3900, y: 560 },
      ],
      enemies: [
        { kind: "goblin", x: 600, y: 500, left: 530, right: 720, speed: 1.85 },
        { kind: "bat", x: 920, y: 310, left: 840, right: 1040, speed: 1.6 },
        { kind: "puff", x: 1560, y: 280, left: 1460, right: 1660, speed: 1.5 },
        { kind: "goblin", x: 1880, y: 290, left: 1790, right: 1970, speed: 2.0 },
        { kind: "bat", x: 2180, y: 310, left: 2100, right: 2300, speed: 1.7 },
        { kind: "bramble", x: 2520, y: 300, left: 2450, right: 2630, speed: 1.8 },
        { kind: "puff", x: 2860, y: 330, left: 2760, right: 2970, speed: 1.6 },
        { kind: "goblin", x: 3500, y: 460, left: 3430, right: 3640, speed: 2.1 },
      ],
      crown: { x: 4200, y: 560 },
      prince: { x: 4420, y: 560 },
      rescue: "the palace halls",
    },
    {
      name: "Midnight Thorns",
      bg: "forest",
      platform: "grass",
      width: 5600,
      spawn: { x: 80, y: 460 },
      platforms: [
        { x: 0, y: 580, w: 380 },
        { x: 460, y: 500, w: 200 },
        { x: 760, y: 400, w: 190 },
        { x: 1060, y: 500, w: 200 },
        { x: 1360, y: 360, w: 190 },
        { x: 1660, y: 470, w: 200 },
        { x: 1980, y: 340, w: 180 },
        { x: 2280, y: 450, w: 190 },
        { x: 2580, y: 330, w: 180 },
        { x: 2880, y: 440, w: 190 },
        { x: 3200, y: 540, w: 240 },
        { x: 3560, y: 430, w: 200 },
        { x: 3880, y: 580, w: 1720 },
        { x: 4120, y: 420, w: 190 },
        { x: 4500, y: 330, w: 190 },
        { x: 4880, y: 420, w: 180 },
      ],
      stars: [
        [200, 490], [540, 410], [840, 310], [1140, 410],
        [1440, 270], [1740, 380], [2060, 250], [2360, 360],
        [2660, 240], [2960, 350], [3280, 450], [3640, 340],
        [4300, 490], [4580, 240],
      ],
      hearts: [[1660, 380], [3200, 450], [4200, 490]],
      gems: [[1980, 250], [2580, 240]],
      friends: [{ kind: "unicorn", x: 160, y: 580 }],
      enemies: [
        { kind: "bramble", x: 540, y: 500, left: 470, right: 640, speed: 1.9 },
        { kind: "bat", x: 840, y: 310, left: 760, right: 940, speed: 1.7 },
        { kind: "goblin", x: 1140, y: 500, left: 1070, right: 1240, speed: 2.1 },
        { kind: "puff", x: 1460, y: 270, left: 1360, right: 1540, speed: 1.65 },
        { kind: "bramble", x: 1740, y: 470, left: 1670, right: 1840, speed: 2.0 },
        { kind: "bat", x: 2060, y: 250, left: 1980, right: 2160, speed: 1.8 },
        { kind: "goblin", x: 2360, y: 450, left: 2290, right: 2460, speed: 2.15 },
        { kind: "puff", x: 2660, y: 240, left: 2580, right: 2750, speed: 1.75 },
        { kind: "bramble", x: 3280, y: 540, left: 3210, right: 3420, speed: 2.1 },
      ],
      crown: { x: 3720, y: 580 },
      prince: { x: 5380, y: 580 },
      rescue: "the Spell Queen",
      arena: { left: 3880, lockMax: 5200 },
      boss: { x: 4700, y: 500, title: "Spell Queen", art: "boss", artCast: "bossCast", hp: 6 },
    },
    {
      name: "Sky Spire",
      bg: "spire",
      platform: "cloud",
      width: 5400,
      spawn: { x: 70, y: 40 },
      platforms: [
        { x: 0, y: 160, w: 380 },
        { x: 460, y: 240, w: 200 },
        { x: 760, y: 330, w: 190 },
        { x: 1060, y: 280, w: 180 },
        { x: 1360, y: 400, w: 200 },
        { x: 1680, y: 490, w: 190 },
        { x: 1980, y: 420, w: 180 },
        { x: 2280, y: 530, w: 200 },
        { x: 2600, y: 450, w: 180 },
        { x: 2900, y: 560, w: 220 },
        { x: 3240, y: 480, w: 190 },
        { x: 3560, y: 580, w: 1840 },
        { x: 3840, y: 430, w: 180 },
        { x: 4220, y: 340, w: 180 },
        { x: 4600, y: 430, w: 180 },
      ],
      stars: [
        [160, 70], [540, 150], [840, 240], [1140, 190],
        [1440, 310], [1760, 400], [2060, 330], [2360, 440],
        [2680, 360], [2980, 470], [3320, 390], [3700, 490],
        [4000, 340], [4300, 250],
      ],
      hearts: [[1060, 190], [2600, 360], [3840, 340]],
      gems: [[1360, 310], [3240, 390]],
      friends: [{ kind: "bunny", x: 220, y: 160 }],
      enemies: [
        { kind: "puff", x: 540, y: 160, left: 470, right: 650, speed: 1.7 },
        { kind: "bat", x: 840, y: 240, left: 770, right: 940, speed: 1.85 },
        { kind: "goblin", x: 1440, y: 400, left: 1370, right: 1540, speed: 2.2 },
        { kind: "puff", x: 1760, y: 400, left: 1690, right: 1860, speed: 1.8 },
        { kind: "bat", x: 2060, y: 330, left: 1980, right: 2150, speed: 1.9 },
        { kind: "bramble", x: 2360, y: 530, left: 2290, right: 2470, speed: 2.15 },
        { kind: "puff", x: 2680, y: 360, left: 2610, right: 2770, speed: 1.85 },
        { kind: "goblin", x: 2980, y: 560, left: 2910, right: 3100, speed: 2.3 },
        { kind: "bat", x: 3320, y: 390, left: 3250, right: 3420, speed: 2.0 },
        { kind: "puff", x: 4000, y: 340, left: 3850, right: 4010, speed: 1.9 },
      ],
      crown: { x: 3400, y: 580 },
      prince: { x: 5160, y: 580 },
      rescue: "King Thunderpuff",
      arena: { left: 3560, lockMax: 4980 },
      boss: { x: 4400, y: 490, title: "King Thunderpuff", art: "bossStorm", artCast: "bossStormCast", hp: 7 },
    },
    {
      name: "Storm Keep",
      bg: "storm",
      platform: "cloud",
      width: 6000,
      spawn: { x: 70, y: 30 },
      platforms: [
        { x: 0, y: 150, w: 340 },
        { x: 420, y: 240, w: 180 },
        { x: 700, y: 340, w: 170 },
        { x: 980, y: 280, w: 170 },
        { x: 1260, y: 400, w: 180 },
        { x: 1560, y: 500, w: 180 },
        { x: 1860, y: 420, w: 170 },
        { x: 2140, y: 320, w: 170 },
        { x: 2420, y: 430, w: 180 },
        { x: 2720, y: 540, w: 200 },
        { x: 3040, y: 430, w: 170 },
        { x: 3320, y: 320, w: 170 },
        { x: 3600, y: 430, w: 180 },
        { x: 3900, y: 540, w: 210 },
        { x: 4240, y: 580, w: 1760 },
        { x: 4520, y: 420, w: 170 },
        { x: 4900, y: 320, w: 170 },
        { x: 5280, y: 420, w: 170 },
      ],
      stars: [
        [140, 60], [500, 150], [780, 250], [1060, 190],
        [1340, 310], [1640, 410], [1940, 330], [2220, 230],
        [2500, 340], [2800, 450], [3120, 340], [3400, 230],
        [3680, 340], [3980, 450], [4600, 490], [4980, 230],
      ],
      hearts: [[980, 190], [2140, 230], [3900, 450], [4520, 330]],
      gems: [[1260, 310], [3320, 230], [4900, 230]],
      friends: [
        { kind: "unicorn", x: 160, y: 150 },
        { kind: "bunny", x: 4000, y: 540 },
      ],
      enemies: [
        { kind: "bat", x: 500, y: 150, left: 430, right: 590, speed: 2.0 },
        { kind: "puff", x: 780, y: 250, left: 710, right: 860, speed: 1.95 },
        { kind: "goblin", x: 1340, y: 400, left: 1270, right: 1430, speed: 2.35 },
        { kind: "bat", x: 1640, y: 410, left: 1570, right: 1730, speed: 2.1 },
        { kind: "puff", x: 1940, y: 330, left: 1870, right: 2020, speed: 2.0 },
        { kind: "bramble", x: 2220, y: 320, left: 2150, right: 2300, speed: 2.2 },
        { kind: "goblin", x: 2500, y: 430, left: 2430, right: 2590, speed: 2.4 },
        { kind: "bat", x: 2800, y: 450, left: 2730, right: 2910, speed: 2.15 },
        { kind: "puff", x: 3120, y: 340, left: 3050, right: 3200, speed: 2.05 },
        { kind: "goblin", x: 3400, y: 320, left: 3330, right: 3480, speed: 2.45 },
        { kind: "bat", x: 3680, y: 340, left: 3610, right: 3770, speed: 2.2 },
        { kind: "puff", x: 4600, y: 330, left: 4530, right: 4680, speed: 2.1 },
      ],
      crown: { x: 4100, y: 580 },
      prince: { x: 5740, y: 580 },
      rescue: "Prince Nightpaw",
      arena: { left: 4240, lockMax: 5560 },
      boss: { x: 5100, y: 500, title: "Prince Nightpaw", art: "bossPanther", artCast: "bossPantherCast", hp: 8 },
    },
  ];

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function loadAssets() {
    const files = {
      idle: "assets/princess-idle.png",
      walk: "assets/princess-walk.png",
      jump: "assets/princess-jump.png",
      duck: "assets/princess-duck.png",
      wand: "assets/princess-wand.png",
      bolt: "assets/bolt.png",
      front: "assets/princess-front.png",
      star: "assets/star.png",
      crown: "assets/crown.png",
      heart: "assets/heart.png",
      gem: "assets/gem.png",
      bunny: "assets/bunny.png",
      unicorn: "assets/unicorn.png",
      bramble: "assets/bramble.png",
      puff: "assets/puff.png",
      bat: "assets/bat.png",
      goblin: "assets/goblin.png",
      snake: "assets/snake.png",
      snakeLoot: "assets/snake-loot.png",
      prince: "assets/prince-idle.png",
      princeFront: "assets/prince-front.png",
      boss: "assets/boss.png",
      bossCast: "assets/boss-cast.png",
      bossOrb: "assets/boss-orb.png",
      grass: "assets/grass.png",
      cloud: "assets/cloud.png",
      garden: "assets/bg-garden.jpg",
      clouds: "assets/bg-clouds.jpg",
      cave: "assets/bg-cave.jpg",
      palace: "assets/bg-palace.jpg",
      forest: "assets/bg-forest.jpg",
      spire: "assets/bg-spire.jpg",
      storm: "assets/bg-storm.jpg",
      bossStorm: "assets/boss-storm.png",
      bossStormCast: "assets/boss-storm-cast.png",
      bossPanther: "assets/boss-panther.png",
      bossPantherCast: "assets/boss-panther-cast.png",
    };
    await Promise.all(
      Object.entries(files).map(async ([k, src]) => {
        assets[k] = await loadImage(src);
      })
    );
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const needW = Math.floor(W * dpr);
    const needH = Math.floor(H * dpr);
    if (canvas.width !== needW || canvas.height !== needH) {
      canvas.width = needW;
      canvas.height = needH;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }
  }

  function setupAudio() {
    if (audio) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC();
  }

  function beep(freq, dur, type, vol, when) {
    if (!audio || muted) return;
    try {
      const now = audio.currentTime;
      const t = Math.max(now + 0.01, when || now + 0.01);
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = type || "triangle";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, 0.05));
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + dur + 0.03);
    } catch (_) {}
  }

  function sfxCollect() {
    beep(880, 0.12, "sine", 0.1);
    beep(1320, 0.18, "triangle", 0.08, audio ? audio.currentTime + 0.07 : 0);
  }
  function sfxJump() {
    beep(420, 0.12, "square", 0.05);
    beep(640, 0.16, "sine", 0.06, audio ? audio.currentTime + 0.04 : 0);
  }
  function sfxCrown() {
    if (!audio) return;
    [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.28, "triangle", 0.1, audio.currentTime + i * 0.1));
  }
  function sfxWin() {
    if (!audio) return;
    [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, 0.4, "sine", 0.1, audio.currentTime + i * 0.12));
  }
  function sfxHurt() {
    beep(180, 0.16, "square", 0.06);
    beep(140, 0.22, "sawtooth", 0.04, audio ? audio.currentTime + 0.08 : 0);
  }
  function sfxStomp() {
    beep(320, 0.08, "square", 0.07);
    beep(520, 0.14, "triangle", 0.08, audio ? audio.currentTime + 0.05 : 0);
  }
  function sfxWand() {
    beep(740, 0.08, "sine", 0.08);
    beep(1180, 0.16, "triangle", 0.09, audio ? audio.currentTime + 0.04 : 0);
    beep(1480, 0.12, "sine", 0.06, audio ? audio.currentTime + 0.1 : 0);
  }
  function sfxBossCast() {
    beep(220, 0.18, "sawtooth", 0.05);
    beep(330, 0.22, "triangle", 0.06, audio ? audio.currentTime + 0.08 : 0);
  }
  function sfxBossHurt() {
    beep(160, 0.12, "square", 0.07);
    beep(280, 0.18, "triangle", 0.07, audio ? audio.currentTime + 0.06 : 0);
  }

  function startMusic() {
    if (!audio || musicTimer) return;
    const notes = [523.25, 659.25, 783.99, 987.77, 880, 783.99, 659.25, 587.33];
    let i = 0;
    const tick = () => {
      if (!audio || muted) return;
      beep(notes[i % notes.length], 0.38, "sine", 0.045);
      if (i % 2 === 0) beep(notes[i % notes.length] / 2, 0.5, "triangle", 0.03);
      i += 1;
    };
    tick();
    musicTimer = setInterval(tick, 420);
  }

  function stopMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = 0;
  }

  function burst(x, y, color, n = 14) {
    n = Math.min(n, 18);
    const room = 90 - particles.length;
    if (room <= 0) return;
    n = Math.min(n, room);
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random();
      const s = 1.4 + Math.random() * 3.2;
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 1.2,
        life: 1,
        color,
        r: 2 + Math.random() * 3,
      });
    }
  }

  function stampEnemy(e) {
    const sizes = {
      bramble: { w: 62, h: 48, visW: 80, visH: 64 },
      puff: { w: 58, h: 50, visW: 82, visH: 70 },
      bat: { w: 62, h: 42, visW: 88, visH: 66 },
      goblin: { w: 50, h: 58, visW: 74, visH: 80 },
    };
    const s = sizes[e.kind];
    const fly = e.kind === "puff" || e.kind === "bat";
    return {
      ...e,
      dir: 1,
      phase: e.x * 0.01,
      homeY: e.y,
      alive: true,
      fly,
      amp: fly ? 26 : 0,
      w: s.w,
      h: s.h,
      visW: s.visW,
      visH: s.visH,
      vy: 0,
      ridden: false,
    };
  }

  function makeLevel(i) {
    const src = LEVELS[i];
    return {
      ...src,
      platforms: stampPlatforms(src.platforms, i),
      items: [
        ...src.stars.map(([x, y]) => ({ kind: "star", x, y, got: false })),
        ...src.hearts.map(([x, y]) => ({ kind: "heart", x, y, got: false })),
        ...src.gems.map(([x, y]) => ({ kind: "gem", x, y, got: false })),
        { kind: "crown", x: src.crown.x, y: src.crown.y, got: false },
      ],
      friends: src.friends.map((f) => ({
        ...f,
        said: false,
        dir: 1,
        vy: 0,
        alive: true,
        ridden: false,
        fly: f.kind === "unicorn",
        onGround: true,
        w: f.kind === "unicorn" ? 70 : 54,
        h: f.kind === "unicorn" ? 50 : 44,
        visW: f.kind === "unicorn" ? 92 : 70,
        visH: f.kind === "unicorn" ? 88 : 100,
      })),
      enemies: (src.enemies || []).map(stampEnemy),
      prince: src.prince ? { ...src.prince, saved: false } : null,
      rescue: src.rescue || "trouble",
      arena: src.arena || null,
      boss: src.boss ? {
        x: src.boss.x,
        y: src.boss.y,
        homeY: src.boss.y,
        dir: -1,
        hp: src.boss.hp || 6,
        maxHp: src.boss.hp || 6,
        title: src.boss.title || "Boss",
        art: src.boss.art || "boss",
        artCast: src.boss.artCast || "bossCast",
        state: "intro",
        timer: 0,
        invuln: 0,
        alive: true,
        shot: false,
        visW: 210,
        visH: 250,
        w: 120,
        h: 150,
      } : null,
      snake: makeSnake(src),
    };
  }

  function stampPlatforms(plats, levelI) {
    const speedMul = 1 + levelI * 0.28;
    const rangeMul = 0.85 + levelI * 0.2;
    return plats.map((p, i) => {
      const stay = i === 0 || p.w >= 380;
      let rangeX = 0;
      let rangeY = 0;
      let ms = 0;
      if (!stay) {
        if (i % 2 === 0) rangeX = (52 + (i % 4) * 16) * rangeMul;
        else rangeY = (38 + (i % 4) * 12) * rangeMul;
        ms = (0.78 + (i % 5) * 0.16) * speedMul;
      }
      return {
        ...p,
        homeX: p.x,
        homeY: p.y,
        rangeX,
        rangeY,
        moveSpeed: ms,
        phase: i * 1.31 + levelI * 0.4,
        vx: 0,
        vy: 0,
        h: 56,
      };
    });
  }

  function updatePlatforms() {
    for (const p of level.platforms) {
      const ox = p.x;
      const oy = p.y;
      if (p.rangeX) p.x = p.homeX + Math.sin(time * p.moveSpeed + p.phase) * p.rangeX;
      else p.x = p.homeX;
      if (p.rangeY) p.y = p.homeY + Math.sin(time * p.moveSpeed + p.phase) * p.rangeY;
      else p.y = p.homeY;
      p.vx = p.x - ox;
      p.vy = p.y - oy;
    }
    if (player && player.onGround && player.standPlat) {
      player.x += player.standPlat.vx;
      player.y += player.standPlat.vy;
    }
    if (player && player.grab && player.grab.plat) {
      const plat = player.grab.plat;
      player.x += plat.vx;
      player.y += plat.vy;
    }
    for (const e of level.enemies) {
      if (!e.alive || e.fly || e.ridden) continue;
      for (const p of level.platforms) {
        if (e.x > p.x && e.x < p.x + p.w && Math.abs(e.y - p.y) < 36) {
          e.x += p.vx;
          e.y = p.y;
          e.left += p.vx;
          e.right += p.vx;
          break;
        }
      }
    }
    for (const f of level.friends) {
      if (f.fly) continue;
      for (const p of level.platforms) {
        if (f.x > p.x && f.x < p.x + p.w && Math.abs(f.y - p.y) < 36) {
          f.x += p.vx;
          f.y = p.y;
          break;
        }
      }
    }
    const s = level.snake;
    if (s && s.phase !== "hidden" && s.onGround && s.standPlat) {
      s.x += s.standPlat.vx;
      s.y = s.standPlat.y;
    }
  }

  function makeSnake(src) {
    const p = src.platforms[1] || src.platforms[0];
    return {
      x: p.x + Math.min(120, p.w * 0.5),
      y: p.y,
      vx: 0,
      vy: 0,
      dir: 1,
      onGround: true,
      standPlat: null,
      carrying: null,
      stashT: 0,
      scareT: 0,
      stealCool: 0,
      jumpCool: 0,
      phase: "hidden",
      phaseT: 1.8,
      alpha: 0,
      scale: 0.35,
      visits: 0,
      liveT: 8,
      wasScared: false,
      banished: false,
      w: 74,
      h: 34,
      visW: 150,
      visH: 78,
    };
  }

  function renderHearts() {
    heartImgs.forEach((img, i) => img.classList.toggle("empty", i >= hearts));
  }

  function renderAmmo() {
    starCountEl.textContent = String(starsTotal);
  }

  function renderGem() {
    if (!gemHud) return;
    const n = gemsTotal;
    gemHud.classList.toggle("empty", n <= 0);
    gemHud.classList.toggle("hot", n > 0);
    if (gemCountEl) gemCountEl.textContent = String(n);
  }

  function resetRun() {
    starsTotal = 3;
    starsFound = 0;
    gemsTotal = 1;
    gemGlow = 0;
    hearts = MAX_HEARTS;
    renderHearts();
    renderAmmo();
    renderGem();
  }

  function startLevel(i) {
    levelIndex = i;
    level = makeLevel(i);
    const s = level.spawn;
    player = {
      x: s.x,
      y: s.y,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      invuln: 0,
      ducking: false,
      attackT: 0,
      attackCd: 0,
      starCd: 0,
      gemCd: 0,
      mount: null,
      mountLock: 0,
      standPlat: null,
      airJumps: 1,
      jumpHeld: false,
      grab: null,
      grabT: 0,
      grabLock: 0,
      bumpLock: 0,
    };
    bolts = [];
    bossShots = [];
    camX = Math.max(0, player.x - 380);
    safe = { x: s.x, y: s.y };
    toast = level.name;
    toastT = 1.8;
    levelNameEl.textContent = level.name;
    awaitingAdvance = false;
    retrying = false;
    hearts = MAX_HEARTS;
    renderHearts();
  }

  function wantLeft() { return keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || hold.left; }
  function wantRight() { return keys.has("ArrowRight") || keys.has("d") || keys.has("D") || hold.right; }
  function wantJump() {
    return keys.has(" ") || keys.has("ArrowUp") || keys.has("w") || keys.has("W") || hold.jump;
  }
  function wantDuck() {
    return keys.has("ArrowDown") || keys.has("s") || keys.has("S") || hold.duck;
  }
  function wantStar() {
    return keys.has("f") || keys.has("F") || keys.has("j") || keys.has("J") || keys.has("x") || keys.has("X") || hold.star;
  }
  function wantGem() {
    return keys.has("g") || keys.has("G") || keys.has("k") || keys.has("K") || keys.has("c") || keys.has("C") || hold.gem;
  }
  function tryWands() {
    if (wantStar() && (player.starCd || 0) <= 0) startWand("star");
    if (wantGem() && (player.gemCd || 0) <= 0) startWand("gem");
  }

  function bodyBox() {
    if (player.ducking) {
      return { x: player.x + 16, y: player.y + PH - 56, w: PW - 32, h: 56 };
    }
    return { x: player.x + 18, y: player.y + 24, w: PW - 34, h: PH - 28 };
  }

  function isFriend(e) {
    return !!(e && (e.kind === "bunny" || e.kind === "unicorn"));
  }

  function isFlyer(e) {
    return !!(e && e.fly);
  }

  function mountSprite(e) {
    if (!e || player.mount || !isFriend(e)) return;
    player.mount = e;
    e.ridden = true;
    e.vy = 0;
    player.mountLock = 0.28;
    player.vy = 0;
    player.vx = 0;
    player.invuln = 0.25;
    player.ducking = false;
    sfxJump();
    burst(e.x, e.y - e.visH, "#ffe58a", 14);
    toast = e.kind === "unicorn" ? "The unicorn can fly! Duck to dive, jump to hop off." : "Giddy up! Jump to hop off.";
    toastT = 1.8;
  }

  function dismount(hop) {
    const e = player.mount;
    if (!e) return;
    e.ridden = false;
    player.mount = null;
    player.mountLock = 0.2;
    player.invuln = 0.35;
    player.airJumps = 1;
    if (hop) {
      player.vy = -13.8;
      player.onGround = false;
      coyote = 0;
      sfxJump();
      burst(player.x + PW / 2, player.y + PH, "#ffe58a", 8);
    }
  }

  function updateMount(dt) {
    const e = player.mount;
    if (!e || e.alive === false) {
      player.mount = null;
      return false;
    }
    const spd = isFlyer(e) ? 5.6 : 5.3;
    if (wantLeft()) { e.dir = -1; e.x -= spd; player.facing = -1; }
    else if (wantRight()) { e.dir = 1; e.x += spd; player.facing = 1; }
    e.x = Math.max(30, Math.min(level.width - 30, e.x));

    if (isFlyer(e)) {
      if (wantDuck()) e.y += 4.4;
      else e.y -= 1.6;
      e.y += Math.sin(time * 4) * 0.35;
      e.y = Math.max(200, Math.min(620, e.y));
      e.homeY = e.y;
      e.vy = 0;
    } else {
      if (e.vy === undefined) e.vy = 0;
      if (e.onGround) e.vy = 0;
      else {
        e.vy += 0.52;
        e.y += e.vy;
      }
      let landed = false;
      for (const p of level.platforms) {
        if (e.x > p.x && e.x < p.x + p.w && e.vy >= 0 && e.y >= p.y - 2 && e.y <= p.y + 28) {
          e.y = p.y;
          e.vy = 0;
          landed = true;
        }
      }
      e.onGround = landed;
      if (e.y > H + 50) {
        e.ridden = false;
        player.mount = null;
        return false;
      }
    }
    player.x = e.x - PW / 2;
    player.y = e.y - (e.h || 48) - PH + 10;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    return true;
  }

  function islandH(p) {
    return p.h || 56;
  }

  function standingOnIsland(p) {
    const feet = player.y + PH;
    const overlapX = player.x + 16 < p.x + p.w && player.x + PW - 16 > p.x;
    return overlapX && feet >= p.y - 14 && feet <= p.y + 10;
  }

  function landOnIslands() {
    const feet = player.y + PH;
    let grounded = false;
    let stand = null;
    for (const p of level.platforms) {
      const overlapX = player.x + 18 < p.x + p.w && player.x + PW - 18 > p.x;
      const pad = 26 + Math.abs(p.vy || 0) + Math.max(0, player.vy);
      if (overlapX && player.vy >= -0.4 && feet >= p.y - 6 && feet <= p.y + pad) {
        player.y = p.y - PH;
        player.vy = 0;
        grounded = true;
        stand = p;
        safe = { x: player.x, y: player.y };
      }
    }
    return { grounded, stand };
  }

  function bumpSolidIslands(stand, prevStand) {
    let hit = false;
    let pushX = 0;
    let fromX = player.x + PW / 2;
    for (const p of level.platforms) {
      const box = bodyBox();
      const top = p.y;
      const bot = p.y + islandH(p);
      const overlapX = box.x + box.w > p.x && box.x < p.x + p.w;
      if (!overlapX) continue;

      const onTop = standingOnIsland(p) && player.vy >= -0.2;
      const overlapSolid = box.y + box.h > top + 1 && box.y < bot;
      const moving = Math.abs(p.vx) > 0.35 || Math.abs(p.vy) > 0.35;
      const sideTransfer = !!(prevStand && prevStand !== p && Math.abs(prevStand.y - p.y) < 22);
      const ram = moving && sideTransfer && onTop;

      if (onTop && p === stand && !ram) continue;
      if (!overlapSolid && !ram) continue;

      const oL = box.x + box.w - p.x;
      const oR = p.x + p.w - box.x;
      const oT = box.y + box.h - top;
      const oB = bot - box.y;
      if (!overlapSolid || Math.min(oL, oR) <= Math.min(oT, oB) || ram) {
        if (oL < oR) {
          player.x -= Math.max(4, Math.min(oL, 18)) + 4;
          pushX = -1;
        } else {
          player.x += Math.max(4, Math.min(oR, 18)) + 4;
          pushX = 1;
        }
      } else if (oB <= oT) {
        player.y += oB + 4;
      } else {
        if (oL < oR) {
          player.x -= oL + 6;
          pushX = -1;
        } else {
          player.x += oR + 6;
          pushX = 1;
        }
      }
      hit = true;
      fromX = p.x + p.w / 2;
    }
    if (!hit) return false;
    if (player.mount) dismount(false);
    player.onGround = false;
    player.standPlat = null;
    player.grab = null;
    player.grabLock = Math.max(player.grabLock || 0, 0.2);
    coyote = 0;
    const side = pushX || Math.sign(player.x + PW / 2 - fromX) || -1;
    if ((player.bumpLock || 0) <= 0) {
      player.vx = side * 4.8;
      player.vy = 6.6;
      player.bumpLock = 0.22;
      burst(player.x + PW / 2, player.y + 42, "#d7f6ff", 9);
    } else if (player.vy < 3.2) {
      player.vy = 3.2;
    }
    return true;
  }

  function updatePlayer(dt) {
    const acc = 0.9;
    const max = gemGlow > 0 ? 6.6 : 5.6;
    const grav = 0.52;
    const jumpV = gemGlow > 0 ? -14.6 : -13.8;

    gemGlow = Math.max(0, gemGlow - dt);
    player.attackT = Math.max(0, player.attackT - dt);
    player.attackCd = Math.max(0, player.attackCd - dt);
    player.starCd = Math.max(0, (player.starCd || 0) - dt);
    player.gemCd = Math.max(0, (player.gemCd || 0) - dt);
    player.mountLock = Math.max(0, player.mountLock - dt);
    player.grabLock = Math.max(0, (player.grabLock || 0) - dt);
    player.bumpLock = Math.max(0, (player.bumpLock || 0) - dt);
    player.ducking = wantDuck() && player.attackT <= 0 && !player.mount && !player.grab;

    const jumpPressed = wantJump() && !player.jumpHeld;

    if (player.mount) {
      const riding = updateMount(dt);
      if (riding) {
        if (wantJump() && player.mountLock <= 0) jumpBuf = 0.12;
        else jumpBuf -= dt;
        if (jumpBuf > 0 && player.mountLock <= 0) {
          jumpBuf = 0;
          dismount(true);
        }
        tryWands();
        if (wantLeft() || wantRight()) walkFrame += dt * 6;
        player.invuln = Math.max(0, player.invuln - dt);
        player.jumpHeld = wantJump();
        bumpSolidIslands(null, player.standPlat);
        updateBolts(dt);
        return;
      }
    }

    tryWands();

    if (player.grab) {
      const g = player.grab;
      const plat = g.plat;
      player.vx = 0;
      player.vy = 0;
      player.x = g.side < 0 ? plat.x - PW + 14 : plat.x + plat.w - 14;
      player.y = plat.y - 46;
      player.facing = g.side < 0 ? 1 : -1;
      player.grabT += dt;
      const letGo = wantDuck() || (g.side < 0 && wantLeft()) || (g.side > 0 && wantRight());
      if (letGo) {
        player.grab = null;
        player.grabLock = 0.2;
        player.vy = 1.2;
      } else if (player.grabT > 0.1 && wantJump()) {
        player.x = g.side < 0 ? plat.x + 8 : plat.x + plat.w - PW - 8;
        player.y = plat.y - PH;
        player.onGround = true;
        player.vy = 0;
        player.airJumps = 1;
        player.grab = null;
        player.grabLock = 0.08;
        coyote = 0.14;
        sfxJump();
        burst(player.x + PW / 2, player.y + PH, "#ffe58a", 8);
      }
      if (player.grab) {
        tryWands();
        player.jumpHeld = wantJump();
        player.invuln = Math.max(0, player.invuln - dt);
        updateBolts(dt);
        return;
      }
    }

    const speed = player.ducking && player.onGround ? 2.4 : max;
    if (wantLeft()) { player.vx -= acc; player.facing = -1; }
    if (wantRight()) { player.vx += acc; player.facing = 1; }
    if (!wantLeft() && !wantRight()) player.vx *= player.onGround ? 0.72 : 0.92;
    player.vx = Math.max(-speed, Math.min(speed, player.vx));

    if (player.onGround) {
      coyote = 0.14;
      player.airJumps = 1;
    } else coyote -= dt;
    if (jumpPressed) jumpBuf = 0.12;
    else jumpBuf -= dt;

    if (jumpBuf > 0 && coyote > 0) {
      player.vy = jumpV;
      player.onGround = false;
      coyote = 0;
      jumpBuf = 0;
      player.airJumps = 1;
      sfxJump();
      burst(player.x + PW / 2, player.y + PH, "#ffe58a", 8);
    } else if (jumpPressed && !player.onGround && coyote <= 0 && player.airJumps > 0) {
      player.vy = jumpV * 0.86;
      player.airJumps = 0;
      jumpBuf = 0;
      sfxJump();
      burst(player.x + PW / 2, player.y + PH, "#c9f0ff", 10);
    }
    if (!wantJump() && player.vy < -4) player.vy *= 0.86;

    if (!player.onGround) {
      player.vy += grav;
      player.vy = Math.min(player.vy, 14);
    } else {
      player.vy = 0;
    }
    player.x += player.vx;
    player.y += player.vy;
    player.x = Math.max(-10, Math.min(level.width - PW + 10, player.x));

    const prevStand = player.standPlat;
    const land = landOnIslands();
    if (bumpSolidIslands(land.stand, prevStand)) {
      player.onGround = false;
      player.standPlat = null;
    } else {
      player.onGround = land.grounded;
      player.standPlat = land.stand;
    }
    if (player.onGround) {
      player.airJumps = 1;
      player.grab = null;
    } else {
      tryGrab();
    }

    if (player.y > H + 80) {
      if (player.mount) dismount(false);
      burst(player.x + PW / 2, H - 40, "#ffd1ec", 20);
      player.x = safe.x;
      player.y = safe.y - 8;
      player.vx = 0;
      player.vy = 0;
      toast = "Sparkle back, Nyla!";
      toastT = 1.3;
      burst(player.x + PW / 2, player.y + PH / 2, "#fff1a8", 18);
    }

    if (Math.abs(player.vx) > 0.8 && player.onGround && !player.ducking) walkFrame += dt * 7;
    player.invuln = Math.max(0, player.invuln - dt);
    player.jumpHeld = wantJump();
    updateBolts(dt);
  }

  function tryGrab() {
    if (player.grab || player.grabLock > 0 || player.mount || player.ducking) return;
    if (player.vy < -3.5) return;
    const handY = player.y + 34;
    const prevHand = handY - player.vy;
    for (const p of level.platforms) {
      if (p.w < 40) continue;
      const nearEdge = (handY >= p.y - 20 && handY <= p.y + 16) ||
        (prevHand < p.y && handY >= p.y - 10);
      if (!nearEdge) continue;
      const leftHang = player.x + PW >= p.x - 16 && player.x + PW <= p.x + 18 &&
        player.x + 20 < p.x && (player.facing > 0 || player.vx > 0.4);
      const rightHang = player.x <= p.x + p.w + 16 && player.x >= p.x + p.w - 18 &&
        player.x + PW - 20 > p.x + p.w && (player.facing < 0 || player.vx < -0.4);
      if (leftHang) {
        player.grab = { plat: p, side: -1 };
        player.grabT = 0;
        player.vx = 0;
        player.vy = 0;
        player.x = p.x - PW + 14;
        player.y = p.y - 46;
        player.facing = 1;
        return;
      }
      if (rightHang) {
        player.grab = { plat: p, side: 1 };
        player.grabT = 0;
        player.vx = 0;
        player.vy = 0;
        player.x = p.x + p.w - 14;
        player.y = p.y - 46;
        player.facing = -1;
        return;
      }
    }
  }

  function say(msg, t = 1.4) {
    toast = msg;
    toastT = t;
  }

  function startWand(kind) {
    const gem = kind === "gem";
    if (gem) {
      if (gemsTotal <= 0) {
        player.gemCd = 0.35;
        say("Collect gems to zap!", 1.2);
        return;
      }
      gemsTotal -= 1;
      renderGem();
      gemGlow = 0.85;
    } else {
      if (starsTotal <= 0) {
        player.starCd = 0.35;
        say("Collect stars to zap!", 1.2);
        return;
      }
      starsTotal -= 1;
      renderAmmo();
    }
    player.ducking = false;
    player.attackT = gem ? 0.4 : 0.34;
    player.attackCd = gem ? 0.32 : 0.4;
    if (gem) player.gemCd = 0.42;
    else player.starCd = 0.4;
    sfxWand();
    const cx = player.x + PW / 2 + player.facing * 42;
    const cy = player.y + (player.onGround ? 46 : 40);
    const spread = gem ? [-1, 0, 1] : [0];
    spread.forEach((k) => {
      bolts.push({
        x: cx,
        y: cy + k * 16,
        vx: player.facing * (gem ? 15 : 13),
        vy: k * 3.4,
        dir: player.facing,
        life: gem ? 0.7 : 0.55,
        power: gem,
      });
    });
    burst(cx, cy, gem ? "#7fe3c6" : "#ffe58a", gem ? 18 : 12);
    zapMelee();
  }

  let lastStompAt = -1;
  function defeatEnemy(e) {
    if (player.mount === e) dismount(false);
    e.alive = false;
    e.ridden = false;
    if (time - lastStompAt > 0.09) {
      sfxStomp();
      lastStompAt = time;
    }
    burst(e.x, e.y - e.h / 2, "#c9a6ff", 8);
  }

  function zapMelee() {
    const cx = player.x + PW / 2;
    const cy = player.y + PH * 0.45;
    for (const e of level.enemies) {
      if (!e.alive || e === player.mount) continue;
      const dx = e.x - cx;
      const toward = Math.sign(dx) === player.facing || Math.abs(dx) < 28;
      if (toward && Math.abs(dx) < 110 && Math.abs((e.y - e.h / 2) - cy) < 78) {
        defeatEnemy(e);
      }
    }
    hitBossWith(cx, cy, 90);
    snakeHitBy(cx, cy, 70);
  }

  function updateBolts(dt) {
    bolts = bolts.filter((b) => {
      b.x += b.vx;
      b.y += b.vy || 0;
      b.life -= dt;
      if (Math.random() < 0.12) burst(b.x, b.y, "#ffe58a", 1);
      for (const e of level.enemies) {
        if (!e.alive || e === player.mount) continue;
        const ex = e.x - e.w / 2;
        const ey = e.y - e.h;
        if (b.x > ex && b.x < ex + e.w && b.y > ey && b.y < ey + e.h) {
          defeatEnemy(e);
          burst(b.x, b.y, "#fff1a8", 14);
          return false;
        }
      }
      if (hitBossWith(b.x, b.y, 40)) {
        burst(b.x, b.y, "#fff1a8", 14);
        return false;
      }
      if (snakeHitBy(b.x, b.y, 28)) {
        burst(b.x, b.y, "#9be89a", 12);
        return false;
      }
      return b.life > 0;
    });
  }

  function updateEnemies(dt) {
    const pcx = player.x + PW / 2;
    for (const e of level.enemies) {
      if (!e.alive || e.ridden) continue;
      const near = Math.abs(pcx - e.x) < 280;
      const chase = near ? 1.25 : 1;
      let dir = e.dir;
      if (e.fly) {
        e.phase += dt * 2.4;
        e.y = e.homeY + Math.sin(e.phase) * e.amp;
        if (near) dir = pcx < e.x ? -1 : 1;
      } else if (near && Math.abs(player.y + PH - e.y) < 90) {
        dir = pcx < e.x ? -1 : 1;
      }
      const next = e.x + dir * e.speed * chase;
      if (next < e.left) {
        e.x = e.left;
        e.dir = 1;
      } else if (next > e.right) {
        e.x = e.right;
        e.dir = -1;
      } else {
        e.dir = dir;
        e.x = next;
      }
    }
  }

  function snakeCanTouch() {
    const s = level.snake;
    return !!(s && s.phase === "active" && !s.banished);
  }

  function snakeMayAppear() {
    const s = level.snake;
    if (!s || s.banished) return false;
    if ((s.visits || 0) >= 2) return false;
    if (inBossArena()) return false;
    return true;
  }

  function pickSnakePerch() {
    const s = level.snake;
    const pcx = player ? player.x + PW / 2 : 200;
    const py = player ? player.y + PH : 500;
    const arenaLeft = level.arena ? level.arena.left - 40 : 1e9;
    let best = null;
    let bestScore = -1e9;
    for (const p of level.platforms) {
      if (p.w < 150) continue;
      const mid = p.x + p.w * 0.5;
      const dx = Math.abs(mid - pcx);
      if (dx < 150) continue;
      if (mid < camX - 60 || mid > camX + W + 140) continue;
      if (mid > arenaLeft) continue;
      if (player && player.standPlat === p) continue;
      const score = 520 - Math.abs(dx - 380) - Math.abs(p.y - py) * 0.35 + (p.w > 240 ? 28 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (!best) {
      const plats = level.platforms.filter((p) => p.w >= 180 && p.x + p.w * 0.5 < arenaLeft);
      const n = plats.length || 1;
      const i = (s.visits || 0) % n;
      best = plats[i] || plats[0] || level.platforms[0];
    }
    return best;
  }

  function snakeAppear() {
    const s = level.snake;
    if (!snakeMayAppear()) return;
    const p = pickSnakePerch();
    if (!p) return;
    s.x = p.x + p.w * 0.45;
    s.y = p.y;
    s.vx = 0;
    s.vy = 0;
    s.onGround = true;
    s.standPlat = p;
    s.dir = player && (player.x + PW / 2) < s.x ? -1 : 1;
    s.phase = "in";
    s.phaseT = 0.48;
    s.alpha = 0;
    s.scale = 0.32;
    s.stealCool = 0.8;
    s.scareT = 0;
    s.jumpCool = 0.45;
    s.liveT = 7.2 + Math.min(3.5, levelIndex * 0.55);
    s.stashT = 0;
    s.visits = (s.visits || 0) + 1;
    burst(s.x, s.y - 26, "#9be89a", 14);
    if (s.visits === 1) say("Nino Travis the sneaky snake!", 2);
  }

  function snakeVanish() {
    const s = level.snake;
    if (!s || s.phase === "hidden" || s.phase === "out") return;
    if (s.carrying) {
      s.carrying.got = true;
      s.carrying.stolen = true;
      s.carrying = null;
      s.stashT = 0;
    }
    s.phase = "out";
    s.phaseT = 0.4;
    s.vx = 0;
    burst(s.x, s.y - 26, "#c9f0ff", 12);
  }

  function snakeLand() {
    const s = level.snake;
    if (!s || s.phase === "hidden") return;
    if (s.standPlat && s.vy >= -0.2) {
      const p = s.standPlat;
      if (s.x > p.x - 14 && s.x < p.x + p.w + 14 && s.y >= p.y - 12 && s.y <= p.y + 42) {
        s.y = p.y;
        s.vy = 0;
        s.onGround = true;
        return;
      }
    }
    let best = null;
    let bestD = 1e9;
    for (const p of level.platforms) {
      const overlapX = s.x + 26 > p.x && s.x - 26 < p.x + p.w;
      const pad = 24 + Math.abs(p.vy || 0) + Math.max(0, s.vy);
      if (overlapX && s.vy >= -0.15 && s.y >= p.y - 8 && s.y <= p.y + pad) {
        const d = Math.abs(s.y - p.y);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
    }
    if (best) {
      s.y = best.y;
      s.vy = 0;
      s.onGround = true;
      s.standPlat = best;
    } else {
      s.onGround = false;
      s.standPlat = null;
    }
  }

  function dropSnakeLoot(quiet) {
    const s = level.snake;
    if (!s || !s.carrying) return;
    const it = s.carrying;
    it.x = s.x - 16;
    it.y = s.y - 36;
    it.got = false;
    it.stolen = false;
    if (!level.items.includes(it)) level.items.push(it);
    s.carrying = null;
    s.stashT = 0;
    s.stealCool = 2;
    if (!quiet) say("Nino Travis dropped the loot!", 1.4);
    burst(s.x, s.y - 20, "#ffd76a", 14);
  }

  function scareSnake() {
    const s = level.snake;
    if (!s || s.phase === "hidden" || s.phase === "out") return;
    if (s.scareT > 0.25) return;
    const hadLoot = !!s.carrying;
    dropSnakeLoot(true);
    s.scareT = 0.5;
    s.wasScared = true;
    s.banished = true;
    s.dir = (player.x + PW / 2) < s.x ? 1 : -1;
    s.stealCool = Math.max(s.stealCool, 1.2);
    sfxStomp();
    burst(s.x, s.y - 24, "#9be89a", 16);
    snakeVanish();
    say(hadLoot ? "Nino Travis dropped the loot and slithered off!" : "Nino Travis won't be back this land!", 1.5);
  }

  function snakeTarget() {
    const s = level.snake;
    let best = null;
    let bestD = 1e9;
    for (const it of level.items) {
      if (it.got || it.kind === "heart" || it.kind === "crown") continue;
      const d = Math.abs(it.x - s.x) + Math.abs(it.y - s.y) * 0.8;
      if (d < bestD) { bestD = d; best = it; }
    }
    const pcx = player.x + PW / 2;
    const playerHas = starsTotal > 0 || gemsTotal > 0;
    const pDist = Math.abs(pcx - s.x) + Math.abs(player.y + PH - s.y);
    if (playerHas && pDist < 260 && pDist < bestD + 80 && !s.carrying) {
      return { x: pcx, y: player.y + PH, player: true };
    }
    if (best) return { x: best.x + 24, y: best.y, item: best };
    return null;
  }

  function updateSnake(dt) {
    const s = level.snake;
    if (!s) return;
    s.stealCool = Math.max(0, s.stealCool - dt);
    s.scareT = Math.max(0, s.scareT - dt);
    s.jumpCool = Math.max(0, (s.jumpCool || 0) - dt);
    s.phaseT = (s.phaseT || 0) - dt;

    if (s.phase === "hidden") {
      s.alpha = 0;
      s.vx = 0;
      s.vy = 0;
      if (s.phaseT <= 0 && snakeMayAppear()) snakeAppear();
      return;
    }

    if (inBossArena() && s.phase !== "out") {
      if (s.carrying) dropSnakeLoot();
      snakeVanish();
    }

    if (s.phase === "in") {
      const t = 1 - Math.max(0, s.phaseT) / 0.48;
      s.alpha = Math.min(1, t);
      s.scale = 0.32 + 0.68 * t;
      if (s.phaseT <= 0) {
        s.phase = "active";
        s.alpha = 1;
        s.scale = 1;
      }
    } else if (s.phase === "out") {
      const t = Math.max(0, s.phaseT) / 0.4;
      s.alpha = t;
      s.scale = 0.32 + 0.68 * t;
      if (s.phaseT <= 0) {
        s.phase = "hidden";
        s.alpha = 0;
        s.scale = 0.32;
        s.phaseT = (s.banished || s.visits >= 2) ? 9999 : 2.6 + Math.random() * 1.4;
        s.wasScared = false;
        s.onGround = false;
        s.standPlat = null;
        s.vx = 0;
        s.vy = 0;
        return;
      }
    } else if (s.phase === "active") {
      s.liveT = (s.liveT || 8) - dt;
      if (s.liveT <= 0 && !s.carrying) snakeVanish();
    }

    const canChase = s.phase === "active";
    let tx = null;
    let ty = null;
    if (canChase && s.carrying) {
      s.stashT += dt;
      tx = player.x < s.x ? s.x + 400 : s.x - 400;
      ty = s.y;
      if (s.stashT > 1.7) {
        toast = "Nino Travis hid the loot!";
        toastT = 1.5;
        snakeVanish();
      }
    } else if (canChase) {
      const t = snakeTarget();
      if (t) { tx = t.x; ty = t.y; }
    }

    const spd = s.carrying ? 4.2 : 3.1;
    if (canChase && tx != null) {
      const want = tx < s.x - 8 ? -spd : tx > s.x + 8 ? spd : 0;
      if (want) s.dir = want < 0 ? -1 : 1;
      s.vx += (want - s.vx) * 0.22;
    } else {
      s.vx *= 0.82;
    }
    if (Math.abs(s.vx) < 0.08) s.vx = 0;
    s.x += s.vx;
    s.x = Math.max(20, Math.min(level.width - 20, s.x));

    if (s.onGround && s.standPlat) {
      const p = s.standPlat;
      const left = p.x + 22;
      const right = p.x + p.w - 22;
      if (s.x < left) {
        s.x = left;
        s.vx = 0;
        if (canChase && tx != null && tx < s.x - 10 && s.jumpCool <= 0) {
          s.vy = -11;
          s.onGround = false;
          s.standPlat = null;
          s.vx = -3.2;
          s.jumpCool = 1.05;
        }
      } else if (s.x > right) {
        s.x = right;
        s.vx = 0;
        if (canChase && tx != null && tx > s.x + 10 && s.jumpCool <= 0) {
          s.vy = -11;
          s.onGround = false;
          s.standPlat = null;
          s.vx = 3.2;
          s.jumpCool = 1.05;
        }
      }
    }

    if (canChase && s.onGround && s.jumpCool <= 0 && ty != null && ty < s.y - 80 && Math.abs(tx - s.x) < 280) {
      s.vy = -11;
      s.onGround = false;
      s.standPlat = null;
      s.jumpCool = 1.05;
    }

    if (!s.onGround) {
      s.vy += 0.52;
      s.vy = Math.min(s.vy, 12);
      s.y += s.vy;
    } else {
      s.vy = 0;
      if (s.standPlat) s.y = s.standPlat.y;
    }
    snakeLand();

    if (s.y > H + 80) {
      s.y = H + 20;
      s.vy = 0;
      s.vx = 0;
      if (s.carrying) dropSnakeLoot();
      if (s.phase === "active" || s.phase === "in") snakeVanish();
    }

    if (canChase && !s.carrying && s.stealCool <= 0) {
      for (const it of level.items) {
        if (it.got || (it.kind !== "star" && it.kind !== "gem")) continue;
        if (Math.abs(it.x + 24 - s.x) < 38 && Math.abs(it.y - (s.y - 18)) < 42) {
          it.got = true;
          it.stolen = true;
          s.carrying = it;
          s.stashT = 0;
          sfxCollect();
          burst(it.x, it.y, it.kind === "gem" ? "#7fe3c6" : "#ffd76a", 12);
          toast = it.kind === "gem"
            ? "Nino Travis snatched a gem!"
            : "Nino Travis snatched a star!";
          toastT = 1.5;
          break;
        }
      }
    }
  }

  function inBossArena() {
    const a = level && level.arena;
    return !!(level.boss && level.boss.alive && a && player.x > a.left - 30);
  }

  function hitBossWith(x, y, rad) {
    const b = level.boss;
    if (!b || !b.alive || b.invuln > 0 || b.state === "intro") return false;
    const bx = b.x - b.w / 2;
    const by = b.y - b.h;
    if (x < bx - rad || x > bx + b.w + rad || y < by - rad || y > by + b.h + rad) return false;
    hurtBoss();
    return true;
  }

  function hurtBoss() {
    const b = level.boss;
    if (!b || !b.alive || b.invuln > 0) return;
    b.hp -= 1;
    b.invuln = 0.75;
    b.state = "hurt";
    b.timer = 0;
    b.shot = false;
    flash = 0.22;
    flashColor = "200,140,255";
    sfxBossHurt();
    burst(b.x, b.y - b.h / 2, "#d4a6ff", 22);
    if (b.hp <= 0) {
      b.alive = false;
      b.state = "dead";
      bossShots = [];
      toast = b.title + " is poofed!";
      toastT = 2.2;
      burst(b.x, b.y - 80, "#ffd76a", 36);
      if (audio) sfxCrown();
    } else {
      toast = b.hp <= 3 ? "She's getting mad!" : "Nice hit, Nyla!";
      toastT = 1.3;
    }
  }

  function fireBossOrbs(b) {
    const pcx = player.x + PW / 2;
    const pcy = player.y + PH * 0.4;
    const ox = b.x + b.dir * 50;
    const oy = b.y - 120;
    const base = Math.atan2(pcy - oy, pcx - ox);
    const spd = b.hp <= Math.ceil(b.maxHp / 2) ? 6.4 : 5.2;
    [-0.32, 0, 0.32].forEach((off) => {
      const a = base + off;
      bossShots.push({
        x: ox,
        y: oy,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 2.4,
      });
    });
    sfxBossCast();
  }

  function updateBoss(dt) {
    const b = level.boss;
    if (!b || !b.alive) {
      bossShots = bossShots.filter((s) => {
        s.x += s.vx; s.y += s.vy; s.life -= dt;
        return s.life > 0;
      });
      return;
    }
    b.timer += dt;
    b.invuln = Math.max(0, b.invuln - dt);
    const pcx = player.x + PW / 2;
    const angry = b.hp <= Math.ceil(b.maxHp / 2);
    if (b.state !== "swoop" && Math.abs(pcx - b.x) > 48) b.dir = pcx < b.x ? -1 : 1;

    if (b.state === "intro") {
      b.y = b.homeY - 30 + Math.sin(time * 2) * 12;
      if (level.arena && player.x > level.arena.left) {
        toast = b.title + "!";
        toastT = 2;
        b.state = "idle";
        b.timer = 0;
      }
      return;
    }

    if (b.state === "hurt") {
      b.x += -b.dir * 1.2;
      if (b.timer > 0.5) { b.state = "idle"; b.timer = 0; }
    } else if (b.state === "idle") {
      b.y = b.homeY - 36 + Math.sin(time * 2.3) * 18;
      b.x += b.dir * (angry ? 2.4 : 1.6);
      const al = level.arena ? level.arena.left + 100 : 400;
      const ar = level.arena ? level.arena.lockMax + 120 : level.width - 80;
      b.x = Math.max(al, Math.min(ar, b.x));
      if (b.timer > (angry ? 1.05 : 1.55)) {
        b.state = Math.random() < 0.58 ? "cast" : "swoop";
        b.timer = 0;
        b.shot = false;
      }
    } else if (b.state === "cast") {
      b.y = b.homeY - 50 + Math.sin(time * 6) * 6;
      if (b.timer > 0.32 && !b.shot) {
        b.shot = true;
        fireBossOrbs(b);
      }
      if (b.timer > 1.0) { b.state = "idle"; b.timer = 0; b.shot = false; }
    } else if (b.state === "swoop") {
      if (b.timer < 0.22) {
        b.y -= 1.4;
      } else {
        b.x += b.dir * (angry ? 8.5 : 6.8);
        b.y += 3.2;
      }
      if (b.timer > 0.85) {
        b.state = "idle";
        b.timer = 0;
      }
    }
    const al = level.arena ? level.arena.left + 40 : 200;
    const ar = level.arena ? level.arena.lockMax + 180 : level.width - 40;
    b.x = Math.max(al, Math.min(ar, b.x));
    b.y = Math.max(220, Math.min(580, b.y));

    const box = bodyBox();
    const bx = b.x - b.w / 2;
    const by = b.y - b.h;
    const overlap = !(box.x + box.w < bx || box.x > bx + b.w || box.y + box.h < by || box.y > by + b.h);
    if (overlap && b.state !== "intro") {
      const stomp = player.vy > 1.0 && (player.y + PH) < b.y - b.h * 0.35;
      if (stomp || player.mount) {
        if (hitBossWith(b.x, b.y - b.h * 0.5, 80)) {
          player.vy = -11;
          player.onGround = false;
          if (player.mount) dismount(true);
        }
      } else if (player.attackT > 0) {
        hitBossWith(player.x + PW / 2 + player.facing * 40, player.y + 50, 70);
      } else if (gemGlow > 0) {
        hitBossWith(b.x, b.y - b.h * 0.5, 80);
      } else if (player.invuln <= 0) {
        hurtPlayer(b.x);
        player.x += Math.sign(player.x + PW / 2 - b.x) * 36;
      }
    }

    bossShots = bossShots.filter((s) => {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= dt;
      const pbox = bodyBox();
      if (s.x > pbox.x && s.x < pbox.x + pbox.w && s.y > pbox.y && s.y < pbox.y + pbox.h) {
        if (gemGlow > 0) {
          burst(s.x, s.y, "#7fe3c6", 10);
          return false;
        }
        if (player.invuln <= 0) hurtPlayer(s.x);
        burst(s.x, s.y, "#c9a6ff", 10);
        return false;
      }
      return s.life > 0 && s.x > camX - 40 && s.x < camX + W + 80;
    });
  }

  function hurtPlayer(fromX) {
    if (player.invuln > 0 || retrying) return;
    hearts = Math.max(0, hearts - 1);
    renderHearts();
    player.invuln = 1.5;
    player.vx = Math.sign(player.x + PW / 2 - fromX) * 7.2 || -7.2;
    player.vy = -7;
    player.onGround = false;
    flash = 0.28;
    flashColor = "255,90,130";
    sfxHurt();
    burst(player.x + PW / 2, player.y + PH * 0.4, "#ff8fb3", 16);
    if (hearts <= 0) {
      retrying = true;
      toast = "Oh no! Try again, Nyla!";
      toastT = 1.6;
      setTimeout(() => {
        if (mode === "play") startLevel(levelIndex);
      }, 900);
    } else {
      say("Jump on their heads or zap them!", 1.4);
    }
  }

  function collideEnemies() {
    if (retrying) return;
    const box = bodyBox();
    const sprites = [...level.enemies, ...level.friends];
    for (const e of sprites) {
      if (e.alive === false || e === player.mount) continue;
      const ex = e.x - (e.w || 50) / 2;
      const ey = e.y - (e.h || 48);
      const ew = e.w || 50;
      const eh = e.h || 48;
      if (box.x + box.w < ex || box.x > ex + ew || box.y + box.h < ey || box.y > ey + eh) continue;
      const stomp = player.vy > 1.1 && (player.y + PH) < e.y - eh * 0.28;
      if (isFriend(e)) {
        if (stomp) {
          if (player.mount && player.mount !== e) dismount(false);
          if (!player.mount) mountSprite(e);
        }
        continue;
      }
      if (stomp) {
        defeatEnemy(e);
        player.vy = -10.5;
        player.onGround = false;
        continue;
      }
      if (gemGlow > 0 || player.mount) {
        defeatEnemy(e);
        continue;
      }
      if (player.attackT > 0) {
        defeatEnemy(e);
      } else if (player.invuln <= 0) {
        hurtPlayer(e.x);
      }
    }
    collideSnake();
  }

  function snakeHitBy(x, y, rad) {
    const s = level.snake;
    if (!snakeCanTouch() || s.scareT > 0.35) return false;
    if (Math.abs(x - s.x) < s.w / 2 + rad && Math.abs(y - (s.y - s.h / 2)) < s.h / 2 + rad) {
      scareSnake();
      return true;
    }
    return false;
  }

  function collideSnake() {
    const s = level.snake;
    if (!snakeCanTouch() || s.scareT > 0) return;
    const box = bodyBox();
    const sx = s.x - s.w / 2;
    const sy = s.y - s.h;
    if (box.x + box.w < sx || box.x > sx + s.w || box.y + box.h < sy || box.y > sy + s.h) return;
    const stomp = player.vy > 1.1 && (player.y + PH) < s.y - s.h * 0.2;
    if (stomp || player.attackT > 0 || gemGlow > 0 || player.mount) {
      scareSnake();
      if (stomp) {
        player.vy = -10.5;
        player.onGround = false;
      }
      return;
    }
    if (s.scareT > 0 || s.stealCool > 0) return;
    if (s.carrying) {
      toast = "Catch Nino Travis!";
      toastT = 1.1;
      s.stealCool = 0.7;
      return;
    }
    if (starsTotal > 0) {
      starsTotal -= 1;
      renderAmmo();
      s.carrying = { kind: "star", x: s.x, y: s.y, got: true, stolen: true };
      toast = "Nino Travis stole a star!";
    } else if (gemsTotal > 0) {
      gemsTotal -= 1;
      renderGem();
      s.carrying = { kind: "gem", x: s.x, y: s.y, got: true, stolen: true };
      toast = "Nino Travis stole a gem!";
    } else {
      toast = "Nino Travis wants your stars!";
    }
    toastT = 1.5;
    s.stealCool = 1.5;
    s.dir = (player.x + PW / 2) < s.x ? 1 : -1;
    burst(s.x, s.y - 20, "#9be89a", 10);
  }

  function collect() {
    const cx = player.x + PW / 2;
    const cy = player.y + PH * 0.45;
    for (const it of level.items) {
      if (it.got) continue;
      const dx = cx - (it.x + 24);
      const dy = cy - (it.y - 10);
      if (dx * dx + dy * dy < 58 * 58) {
        it.got = true;
        if (it.kind === "star") {
          starsTotal += 1;
          starsFound += 1;
          renderAmmo();
          sfxCollect();
          burst(it.x + 24, it.y, "#ffd76a", 16);
          toast = "Star ammo!";
          toastT = 0.9;
        } else if (it.kind === "heart") {
          sfxCollect();
          burst(it.x + 24, it.y, "#ff7eb3", 18);
          if (hearts < MAX_HEARTS) {
            hearts += 1;
            renderHearts();
            toast = "A heart! That feels better.";
          } else {
            toast = "Hearts are already full!";
          }
          toastT = 1.4;
        } else if (it.kind === "gem") {
          gemsTotal += 1;
          sfxCollect();
          burst(it.x + 24, it.y, "#7fe3c6", 22);
          renderGem();
          toast = "Gem ammo!";
          toastT = 0.9;
        } else if (it.kind === "crown") {
          sfxCrown();
          burst(it.x + 24, it.y, "#ffd76a", 28);
          toast = "A crown! Leo is close!";
          toastT = 1.5;
        }
      }
    }
    for (const f of level.friends) {
      if (f.said) continue;
      if (Math.abs(cx - f.x) < 70 && Math.abs(player.y + PH - f.y) < 90) {
        f.said = true;
        say(f.kind === "bunny" ? "Jump on me — I'm a friend!" : "Friends can be ridden. Hop on!", 1.6);
        toastT = 1.6;
        burst(f.x, f.y - 40, "#fff", 10);
      }
    }
    if (level.prince && !level.prince.saved) {
      if (level.boss && level.boss.alive) {
        const dx = cx - level.prince.x;
        const dy = (player.y + PH) - level.prince.y;
        if (dx * dx + dy * dy < 80 * 80) {
          toast = "Beat " + (level.boss.title || "the boss") + " first!";
          toastT = 1.4;
        }
      } else {
        const dx = cx - level.prince.x;
        const dy = (player.y + PH) - level.prince.y;
        if (dx * dx + dy * dy < 80 * 80) {
          level.prince.saved = true;
          sfxCrown();
          burst(level.prince.x, level.prince.y - 60, "#ffd76a", 30);
          toast = "You rescued Leo!";
          toastT = 1.6;
          completeLevel();
        }
      }
    }
  }

  function completeLevel() {
    if (awaitingAdvance) return;
    awaitingAdvance = true;
    if (levelIndex >= LEVELS.length - 1) {
      setTimeout(() => showWin(), 700);
    } else {
      setTimeout(() => showComplete(), 700);
    }
  }

  function showComplete() {
    mode = "complete";
    hud.hidden = true;
    touchPad.hidden = true;
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <div class="card">
        <p class="eyebrow">Leo is safe... for now</p>
        <h1>You rescued him!</h1>
        <p class="story">You freed Prince Leo from ${LEVELS[levelIndex].rescue || "trouble"} in the ${LEVELS[levelIndex].name}. The spell snatches him away again — keep going!</p>
        <button type="button" class="play" id="next-btn">Next rescue</button>
      </div>`;
    document.getElementById("next-btn").onclick = () => {
      overlay.classList.add("hidden");
      hud.hidden = false;
      showTouch();
      startLevel(levelIndex + 1);
      mode = "play";
    };
  }

  function showWin() {
    mode = "win";
    hud.hidden = true;
    touchPad.hidden = true;
    if (audio) sfxWin();
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <div class="card">
        <p class="eyebrow">The prince is free</p>
        <h1>You saved him!</h1>
        <p class="story">Princess Nyla rescued Prince Leo from the naughty spell. The kingdom sparkles because of you.</p>
        <p class="big-score">⭐ ${starsFound} stars gathered</p>
        <button type="button" class="play" id="again-btn">Play again</button>
      </div>`;
    document.getElementById("again-btn").onclick = () => {
      resetRun();
      overlay.classList.add("hidden");
      hud.hidden = false;
      showTouch();
      startLevel(0);
      mode = "play";
    };
  }

  function showTouch() {
    touchPad.hidden = false;
  }

  function isTouch() {
    return navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches;
  }

  function drawBg() {
    const img = assets[level.bg];
    const parallax = camX * 0.28;
    const scale = H / img.height;
    const dw = img.width * scale;
    const sx = -(parallax % dw);
    ctx.drawImage(img, sx, 0, dw, H);
    ctx.drawImage(img, sx + dw - 1, 0, dw, H);
  }

  function drawPlatforms() {
    const img = assets[level.platform];
    for (const p of level.platforms) {
      const visH = 112;
      const tileW = 270;
      for (let x = p.x; x < p.x + p.w; x += tileW - 56) {
        const w = Math.min(tileW, p.x + p.w - x + 8);
        ctx.drawImage(img, x - 6, p.y - 18, w, visH);
      }
    }
  }

  function drawItems() {
    for (const it of level.items) {
      if (it.got) continue;
      const bob = Math.sin(time * 3 + it.x * 0.01) * 6;
      const img = assets[it.kind];
      const size = it.kind === "crown" ? 74 : 52;
      ctx.drawImage(img, it.x, it.y - size + bob, size, size);
    }
    for (const f of level.friends) {
      const bob = f.ridden ? 0 : Math.sin(time * 2 + f.x) * 4;
      const img = assets[f.kind];
      const w = f.kind === "unicorn" ? 92 : 70;
      const h = f.kind === "unicorn" ? 88 : 100;
      ctx.drawImage(img, f.x - w / 2, f.y - h + bob, w, h);
    }
    if (level.prince) {
      const bob = Math.sin(time * 2.2) * 5;
      const px = level.prince.x;
      const py = level.prince.y - 118 + bob;
      if (level.boss && level.boss.alive) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#c9a6ff";
        ctx.beginPath();
        ctx.ellipse(px, py + 70, 56, 78, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.drawImage(assets.prince, px - 42, py, 84, 126);
    }
  }

  function drawEnemies() {
    for (const e of level.enemies) {
      if (!e.alive) continue;
      const img = assets[e.kind];
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(e.dir, 1);
      const scale = e.ridden ? 1.08 : 1;
      ctx.drawImage(img, -e.visW / 2 * scale, -e.visH * scale - 4, e.visW * scale, e.visH * scale);
      ctx.restore();
    }
  }

  function drawSnake() {
    const s = level.snake;
    if (!s || s.phase === "hidden" || (s.alpha || 0) <= 0.04) return;
    const img = s.carrying && s.carrying.kind === "star" ? assets.snakeLoot : assets.snake;
    const bob = s.phase === "active" ? Math.sin(time * 3.2) * 2 : 0;
    const sc = s.scale == null ? 1 : s.scale;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha == null ? 1 : s.alpha));
    ctx.translate(s.x, s.y + bob);
    ctx.scale(-s.dir * sc, sc);
    ctx.drawImage(img, -s.visW / 2, -s.visH, s.visW, s.visH);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (s.carrying && s.carrying.kind === "gem" && s.phase === "active") {
      ctx.drawImage(assets.gem, s.x + s.dir * 52 - 16, s.y - s.visH + 6, 32, 32);
    }
  }

  function drawBoss() {
    const b = level.boss;
    if (!b || !b.alive) return;
    const img = (b.state === "cast" ? assets[b.artCast] : assets[b.art]) || assets.boss;
    if (b.invuln > 0 && Math.floor(time * 16) % 2 === 0) ctx.globalAlpha = 0.4;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(-b.dir, 1);
    ctx.drawImage(img, -b.visW / 2, -b.visH, b.visW, b.visH);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawBossShots() {
    for (const s of bossShots) {
      ctx.save();
      ctx.translate(s.x, s.y);
      const dir = s.vx >= 0 ? 1 : -1;
      ctx.scale(-dir, 1);
      ctx.drawImage(assets.bossOrb, -28, -20, 64, 42);
      ctx.restore();
    }
  }

  function drawBossBar() {
    const b = level.boss;
    if (!b || !b.alive || b.state === "intro") return;
    const x = 310;
    const y = 64;
    const w = 660;
    const h = 22;
    ctx.save();
    ctx.fillStyle = "rgba(255,247,251,0.92)";
    roundRect(x - 8, y - 28, w + 16, h + 40, 16);
    ctx.fill();
    ctx.fillStyle = "#5a2d58";
    ctx.font = "700 16px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.title || "Boss", x + w / 2, y - 8);
    ctx.fillStyle = "#e8d4ef";
    roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = "#b44ad0";
    const fw = Math.max(0, (b.hp / b.maxHp) * w);
    if (fw > 0) {
      roundRect(x, y, fw, h, 10);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPlayer() {
    let img = assets.idle;
    let dw = PW * 1.44;
    let dh = PH + 16;
    let ox = -dw / 2;
    if (player.attackT > 0) {
      img = assets.wand;
      dw = PW * 1.72;
      ox = -PW * 0.58;
    } else if (player.grab) {
      img = assets.duck;
      dh = PH * 0.9;
    } else if (player.ducking && !player.mount) {
      img = assets.duck;
      dh = PH * 0.92;
    } else if (!player.onGround && !player.mount) img = assets.jump;
    else if (player.mount && (wantLeft() || wantRight())) {
      img = Math.floor(walkFrame) % 2 ? assets.walk : assets.idle;
    } else if (Math.abs(player.vx) > 0.7) img = Math.floor(walkFrame) % 2 ? assets.walk : assets.idle;
    const bob = player.onGround && !player.ducking ? Math.sin(time * 5) * 2 : 0;
    if (player.invuln > 0 && gemGlow <= 0 && Math.floor(time * 10) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.save();
    ctx.translate(player.x + PW / 2, player.y + PH + bob);
    ctx.scale(player.facing, 1);
    ctx.drawImage(img, ox, -dh, dw, dh);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (gemGlow > 0 && Math.random() < 0.18) {
      burst(player.x + PW / 2, player.y + PH * 0.5, "#7fe3c6", 1);
    }
  }

  function drawBolts() {
    for (const b of bolts) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(-b.dir, 1);
      if (b.power) ctx.drawImage(assets.gem, -22, -22, 44, 44);
      else ctx.drawImage(assets.star, -20, -20, 40, 40);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawAmbient() {
    ctx.save();
    ctx.translate(-camX, 0);
    for (let i = 0; i < 18; i++) {
      const x = (i * 240 + time * 18) % (level.width + 200);
      const y = 40 + (i * 47) % 220;
      ctx.globalAlpha = 0.35 + Math.sin(time * 2 + i) * 0.2;
      ctx.fillStyle = i % 2 ? "#fff7c2" : "#ffe1f0";
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawToast() {
    if (toastT <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, toastT);
    ctx.font = "700 28px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,247,251,0.92)";
    const tw = ctx.measureText(toast).width;
    roundRect(W / 2 - tw / 2 - 22, 86, tw + 44, 50, 24);
    ctx.fill();
    ctx.fillStyle = "#5a2d58";
    ctx.fillText(toast, W / 2, 120);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTitleBackdrop() {
    ctx.drawImage(assets.garden, 0, 0, W, H);
    const bob = Math.sin(time * 2) * 8;
    ctx.drawImage(assets.front, W * 0.70, 150 + bob, 360, 520);
    for (let i = 0; i < 24; i++) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = i % 2 ? "#ffd76a" : "#fff";
      ctx.beginPath();
      ctx.arc((i * 97 + time * 30) % W, 40 + (i * 53) % 280, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
    last = ts;
    time += dt;
    try {
    resize();
    ctx.imageSmoothingEnabled = true;

    if (mode === "title" || mode === "story") {
      drawTitleBackdrop();
    } else if (mode === "play") {
      updatePlatforms();
      updatePlayer(dt);
      updateEnemies(dt);
      updateSnake(dt);
      updateBoss(dt);
      if (inBossArena()) {
        const minX = level.arena.left + 8;
        const maxX = level.arena.lockMax;
        if (player.x < minX) player.x = minX;
        if (player.x > maxX) player.x = maxX;
        if (player.mount) {
          player.mount.x = Math.max(minX + 40, Math.min(maxX + 40, player.mount.x));
        }
      }
      collideEnemies();
      collect();
      particles = particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= dt * 1.6;
        return p.life > 0;
      });
      let camTarget = player.x - 400;
      if (inBossArena()) camTarget = Math.max(level.arena.left, Math.min(level.width - W, player.x - 420));
      camX += (camTarget - camX) * 0.08;
      camX = Math.max(0, Math.min(level.width - W, camX));
      toastT = Math.max(0, toastT - dt);
      flash = Math.max(0, flash - dt);

      drawBg();
      drawAmbient();
      ctx.save();
      ctx.translate(-camX, 0);
      drawPlatforms();
      drawItems();
      drawEnemies();
      drawSnake();
      drawBoss();
      drawPlayer();
      drawBolts();
      drawBossShots();
      drawParticles();
      ctx.restore();
      if (flash > 0) {
        ctx.fillStyle = `rgba(${flashColor},${flash * 0.45})`;
        ctx.fillRect(0, 0, W, H);
      }
      drawBossBar();
      drawToast();
    } else if (mode === "complete" || mode === "win") {
      if (level) {
        drawBg();
        ctx.save();
        ctx.translate(-camX, 0);
        drawPlatforms();
        ctx.restore();
      } else {
        ctx.drawImage(assets.palace, 0, 0, W, H);
      }
      if (mode === "win") {
        const bob = Math.sin(time * 2) * 8;
        ctx.drawImage(assets.front, W / 2 - 280, 110 + bob, 280, 400);
        ctx.drawImage(assets.princeFront, W / 2 + 10, 120 + bob, 270, 390);
      }
    }

    } catch (err) {
      console.error(err);
    }
    requestAnimationFrame(loop);
  }

  function bindInput() {
    window.addEventListener("keydown", (e) => {
      keys.add(e.key);
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => keys.delete(e.key));

    const press = (dir, down) => {
      if (dir === "left") hold.left = down;
      if (dir === "right") hold.right = down;
      if (dir === "jump") hold.jump = down;
      if (dir === "duck") hold.duck = down;
      if (dir === "star") hold.star = down;
      if (dir === "gem") hold.gem = down;
      const btn = touchPad.querySelector(`[data-dir="${dir}"]`);
      if (btn) btn.classList.toggle("held", down);
    };

    const heldByPointer = new Map();
    touchPad.querySelectorAll("button").forEach((btn) => {
      const dir = btn.dataset.dir;
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        heldByPointer.set(e.pointerId, dir);
        press(dir, true);
        if (audio && audio.state === "suspended") audio.resume();
      });
    });
    const releasePointer = (e) => {
      const d = heldByPointer.get(e.pointerId);
      if (!d) return;
      heldByPointer.delete(e.pointerId);
      press(d, false);
    };
    window.addEventListener("pointerup", releasePointer);
    window.addEventListener("pointercancel", releasePointer);

    document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    window.addEventListener("contextmenu", (e) => e.preventDefault());

    muteBtn.addEventListener("click", () => {
      muted = !muted;
      muteBtn.textContent = muted ? "×" : "♪";
    });
  }

  function stopStoryVid() {
    const v = document.getElementById("story-vid");
    if (v) v.pause();
  }

  function beginGame() {
    if (mode !== "title") return;
    stopStoryVid();
    if (audio && audio.state === "suspended") audio.resume();
    startMusic();
    overlay.innerHTML = `
      <div class="card">
        <p class="eyebrow">For Princess Nyla</p>
        <h1>Save the Prince</h1>
        <p class="story">Seven lands, and Leo needs rescuing in every one. Star button fires star ammo. Gem button fires gem ammo — a bigger triple zap! Ride the bunny and unicorn. The last three lands hide a boss. Go!</p>
        <button type="button" class="play" id="go-btn">Let's go!</button>
      </div>`;
    document.getElementById("go-btn").onclick = () => {
      overlay.classList.add("hidden");
      hud.hidden = false;
      showTouch();
      resetRun();
      startLevel(0);
      mode = "play";
    };
    mode = "story";
  }

  const kickOff = () => {
    setupAudio();
    beginGame();
  };
  playBtn.addEventListener("click", kickOff);
  playBtn.addEventListener("pointerup", kickOff);

  const host = location.hostname || "";
  const isLocal = host === "localhost" || host === "127.0.0.1" ||
    /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (isLocal) {
    fetch("tablet.json")
      .then((r) => r.json())
      .then((d) => {
        const el = document.getElementById("wifi-hint");
        if (el && d.url) el.textContent = "On iPad, open Safari and go to " + d.url;
      })
      .catch(() => {});
  }

  window.addEventListener("resize", resize);
  bindInput();
  resize();

  function launchFromUrl() {
    const params = new URLSearchParams(location.search);
    const hash = (location.hash || "").replace(/^#\/?/, "");
    let lvl = 0;
    if (params.has("level")) {
      lvl = parseInt(params.get("level"), 10);
    } else {
      const m = hash.match(/^play\/(\d+)$/);
      if (m) lvl = parseInt(m[1], 10);
    }
    if (!Number.isFinite(lvl) || lvl < 0) lvl = 0;
    lvl = Math.min(LEVELS.length - 1, lvl);
    const go =
      params.has("play") ||
      params.has("level") ||
      hash === "play" ||
      /^play\/\d+$/.test(hash);
    if (!go) return false;
    stopStoryVid();
    overlay.classList.add("hidden");
    hud.hidden = false;
    showTouch();
    resetRun();
    startLevel(lvl);
    mode = "play";
    return true;
  }

  loadAssets()
    .then(() => {
      requestAnimationFrame(loop);
      launchFromUrl();
    })
    .catch((err) => {
      overlay.innerHTML = `<div class="card"><h1>Oh no</h1><p class="story">${err}</p></div>`;
    });
})();

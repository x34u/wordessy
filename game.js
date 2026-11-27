/**
 * Wordyssey: Wordi the Inu - Unified Complete Game Suite
 * -------------------------------------------------------------
 * 1. Interactive Overworld Map (5 Islands, Level Select 1-1 to Final Stage)
 * 2. Volumetric 2D Action Platformer (Volumetric cliffs, suspension bridges, Wordi combat)
 * 3. English Training Arena / Soal Ujian (Dedicated interactive vocabulary quiz)
 * 4. Wordi Character Sheet & Expression Animator (Image 2)
 * 5. Player Progress & Persistent State (localStorage sync for stars, coins, unlocked levels)
 */

'use strict';

/* ==========================================================================
   GLOBAL CONFIGURATION & WORLD DEFINITIONS
   ========================================================================== */
const CONFIG = {
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 540,
  GRAVITY: 1100,
  PLAYER_SPEED: 280,
  PLAYER_BOOST_SPEED: 410,
  JUMP_FORCE: -490,
  DOUBLE_JUMP_FORCE: -430,
  MAX_FALL_SPEED: 650,
  INVULN_DURATION: 1.6,
  STARS_PER_STAGE: 10,
  TOTAL_STAGES: 13,
};

// Difficulty Modes & Modifiers (Apple HIG)
const DIFFICULTY_CONFIG = {
  casual: {
    id: 'casual',
    name: 'Casual',
    badge: 'CASUAL',
    badgeClass: 'casual',
    maxHp: 4,
    invulnDuration: 2.4,
    enemySpeedMultiplier: 0.75,
    quizTime: 16,
    scoreMultiplier: 1.0,
    desc: '4 Hearts · Gentle Pace · 16s Quiz · 1.0x'
  },
  normal: {
    id: 'normal',
    name: 'Normal',
    badge: 'NORMAL',
    badgeClass: 'normal',
    maxHp: 3,
    invulnDuration: 1.6,
    enemySpeedMultiplier: 1.0,
    quizTime: 12,
    scoreMultiplier: 1.25,
    desc: '3 Hearts · Standard Pace · 12s Quiz · 1.25x'
  },
  hero: {
    id: 'hero',
    name: 'Hero',
    badge: 'HERO 2X',
    badgeClass: 'hero',
    maxHp: 2,
    invulnDuration: 1.0,
    enemySpeedMultiplier: 1.35,
    quizTime: 8,
    scoreMultiplier: 2.0,
    desc: '2 Hearts · Fast Enemies · 8s Quiz · 2.0x'
  }
};

const ALL_LEVEL_IDS = [
  '1-1', '1-2', '1-3',
  '2-1', '2-2', '2-3',
  '3-1', '3-2', '3-3',
  '4-1', '4-2', '4-3',
  'final'
];

// Overworld Map Islands (Image 3)
const MAP_ISLANDS = [
  {
    id: 'island-1',
    name: '1. Basic',
    color: '#4caf50',
    cliffColor: '#5d4037',
    x: 185,
    y: 390,
    w: 260,
    h: 140,
    nodes: [
      { id: '1-1', title: '1-1 Basic Meadow', desc: 'Introduction to Wordi & jumping', x: 135, y: 420, stageIdx: 0 },
      { id: '1-2', title: '1-2 Spring Path', desc: 'Overcome alphabet bugs & slimes', x: 195, y: 410, stageIdx: 0 },
      { id: '1-3', title: '1-3 Windmill Hill', desc: 'Leap across floating ledges', x: 250, y: 382, stageIdx: 0 },
    ]
  },
  {
    id: 'island-2',
    name: '2. Daily Life',
    color: '#e65100',
    cliffColor: '#4e342e',
    x: 320,
    y: 190,
    w: 210,
    h: 110,
    nodes: [
      { id: '2-1', title: '2-1 Village Square', desc: 'Daily vocabulary & moving platforms', x: 260, y: 220, stageIdx: 1 },
      { id: '2-2', title: '2-2 Timber Bridges', desc: 'Suspension bridge navigation', x: 340, y: 220, stageIdx: 1 },
      { id: '2-3', title: '2-3 Sunset Valley', desc: 'Flying shadow crows & mystery chests', x: 420, y: 190, stageIdx: 1 },
    ]
  },
  {
    id: 'island-3',
    name: '3. Adventure',
    color: '#7986cb',
    cliffColor: '#263238',
    x: 580,
    y: 160,
    w: 210,
    h: 120,
    nodes: [
      { id: '3-1', title: '3-1 Alpine Ridge', desc: 'Snowy ledges & agile porcupines', x: 550, y: 220, stageIdx: 2 },
      { id: '3-2', title: '3-2 Castle Sconces', desc: 'Fortress towers & spiky hazards', x: 620, y: 220, stageIdx: 2 },
      { id: '3-3', title: '3-3 Citadel Ramparts', desc: 'High elevation obstacle traversal', x: 690, y: 220, stageIdx: 2 },
    ]
  },
  {
    id: 'island-4',
    name: '4. Future',
    color: '#00f5d4',
    cliffColor: '#10002b',
    x: 820,
    y: 260,
    w: 210,
    h: 120,
    nodes: [
      { id: '4-1', title: '4-1 Neon Skyline', desc: 'High-speed laser drones & pads', x: 790, y: 290, stageIdx: 3 },
      { id: '4-2', title: '4-2 Cyber Monorail', desc: 'Moving magnetic platforms', x: 860, y: 310, stageIdx: 3 },
      { id: '4-3', title: '4-3 Quantum Spire', desc: 'Intense hazard gauntlet', x: 920, y: 310, stageIdx: 3 },
    ]
  },
  {
    id: 'island-5',
    name: 'Final Stage',
    color: '#ffd166',
    cliffColor: '#3c096c',
    x: 810,
    y: 440,
    w: 180,
    h: 90,
    nodes: [
      { id: 'final', title: 'Final Stage: Star Palace', desc: 'The Giant Word Titan Boss Arena', x: 820, y: 440, stageIdx: 4 },
    ]
  }
];

// Stage Visual Themes
const STAGES = [
  {
    id: 1,
    name: 'Stage 1: Basic Island',
    skyTop: '#1a73e8', skyMid: '#64b5f6', skyBottom: '#e3f2fd',
    sunColor: '#fff9c4', mountainColor: '#81c784', mountainBack: '#a5d6a7',
    grassTop: '#4caf50', grassBevel: '#388e3c',
    dirtLight: '#8d6e63', dirtDark: '#5d4037', rockStrata: '#4e342e',
    ambientType: 'dandelions',
  },
  {
    id: 2,
    name: 'Stage 2: Daily Life',
    skyTop: '#d84315', skyMid: '#ff7043', skyBottom: '#ffe0b2',
    sunColor: '#ffecb3', mountainColor: '#a1887f', mountainBack: '#bcaaa4',
    grassTop: '#e65100', grassBevel: '#bf360c',
    dirtLight: '#795548', dirtDark: '#4e342e', rockStrata: '#3e2723',
    ambientType: 'leaves',
  },
  {
    id: 3,
    name: 'Stage 3: Adventure Peaks',
    skyTop: '#1a237e', skyMid: '#3949ab', skyBottom: '#c5cae9',
    sunColor: '#e8eaf6', mountainColor: '#5c6bc0', mountainBack: '#7986cb',
    grassTop: '#e0e0e0', grassBevel: '#90caf9',
    dirtLight: '#455a64', dirtDark: '#263238', rockStrata: '#1c252b',
    ambientType: 'snow',
  },
  {
    id: 4,
    name: 'Stage 4: Future City',
    skyTop: '#0d0221', skyMid: '#19053b', skyBottom: '#2d0c5a',
    sunColor: '#00f5d4', mountainColor: '#4a1570', mountainBack: '#300a4d',
    grassTop: '#00f5d4', grassBevel: '#00bbf9',
    dirtLight: '#240046', dirtDark: '#10002b', rockStrata: '#070014',
    ambientType: 'data',
  },
  {
    id: 5,
    name: 'Final Stage: Star Palace',
    skyTop: '#0a0017', skyMid: '#240046', skyBottom: '#7b2cbf',
    sunColor: '#ffbe0b', mountainColor: '#5a189a', mountainBack: '#3c096c',
    grassTop: '#ffd166', grassBevel: '#f77f00',
    dirtLight: '#4a0e4e', dirtDark: '#26042b', rockStrata: '#150119',
    ambientType: 'stardust',
  }
];

/* ==========================================================================
   13 DISTINCT LEVEL BLUEPRINTS & HANDCRAFTED MECHANICS
   ========================================================================== */
const LEVEL_CONFIGS = {
  '1-1': {
    id: '1-1',
    name: '1-1 Basic Meadow',
    subtitle: 'Gentle grassy cliffs & jumping fundamentals',
    themeIndex: 0,
    playerStart: { x: 100, y: 340 },
    build(game) {
      const theme = STAGES[0];
      game.platforms.push({ x: 0, y: 440, width: 760, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 880, y: 430, width: 700, height: 150, isOneWay: false, theme });
      game.platforms.push({ x: 1700, y: 420, width: 820, height: 160, isOneWay: false, theme });

      game.bridges.push({ x: 760, y: 440, w: 120, targetY: 430 });
      game.platforms.push({ x: 760, y: 435, width: 120, height: 16, isOneWay: true });
      game.bridges.push({ x: 1580, y: 430, w: 120, targetY: 420 });
      game.platforms.push({ x: 1580, y: 425, width: 120, height: 16, isOneWay: true });

      const ledges = [
        { x: 300, y: 320, w: 160, h: 22 },
        { x: 520, y: 220, w: 150, h: 22 },
        { x: 1040, y: 310, w: 180, h: 22 },
        { x: 1320, y: 210, w: 170, h: 22 },
        { x: 1880, y: 300, w: 180, h: 22 },
        { x: 2160, y: 200, w: 180, h: 22 },
      ];
      for (const l of ledges) {
        game.platforms.push({ x: l.x, y: l.y, width: l.w, height: l.h, isOneWay: true, theme });
      }

      const stars = [
        { x: 360, y: 270 }, { x: 580, y: 170 }, { x: 820, y: 390 },
        { x: 1100, y: 260 }, { x: 1390, y: 160 }, { x: 1640, y: 380 },
        { x: 1950, y: 250 }, { x: 2230, y: 150 }, { x: 2380, y: 370 }, { x: 2480, y: 370 },
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(600, 390, 'chest'));
      game.collectibles.push(new Collectible(1450, 380, 'chest'));
      game.collectibles.push(new Collectible(2050, 370, 'chest'));

      game.collectibles.push(new Collectible(950, 380, 'shield'));
      game.collectibles.push(new Collectible(1750, 370, 'spread'));

      game.enemies.push(new Enemy(450, 400, 'slime', 110));
      game.enemies.push(new Enemy(1150, 390, 'slime', 120));
      game.enemies.push(new Enemy(1900, 380, 'slime', 130));
      game.enemies.push(new Enemy(980, 170, 'bat', 120));
      game.enemies.push(new Enemy(1500, 160, 'bat', 110));
    }
  },

  '1-2': {
    id: '1-2',
    name: '1-2 Spring Path',
    subtitle: 'High trampoline bounce pads & aerial stars',
    themeIndex: 0,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[0];
      game.platforms.push({ x: 0, y: 440, width: 620, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 780, y: 430, width: 580, height: 150, isOneWay: false, theme });
      game.platforms.push({ x: 1520, y: 420, width: 640, height: 160, isOneWay: false, theme });
      game.platforms.push({ x: 2340, y: 430, width: 620, height: 150, isOneWay: false, theme });

      // Super Bounce Pads
      game.platforms.push({ x: 500, y: 420, width: 74, height: 20, isBouncePad: true, isOneWay: true });
      game.platforms.push({ x: 1240, y: 410, width: 74, height: 20, isBouncePad: true, isOneWay: true });
      game.platforms.push({ x: 2040, y: 400, width: 74, height: 20, isBouncePad: true, isOneWay: true });

      // High Cloud Platforms reached by bouncing
      game.platforms.push({ x: 860, y: 190, width: 170, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 1620, y: 180, width: 180, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 2460, y: 220, width: 170, height: 22, isOneWay: true, theme });

      const stars = [
        { x: 537, y: 230 }, { x: 537, y: 130 }, { x: 920, y: 140 },
        { x: 1277, y: 220 }, { x: 1277, y: 120 }, { x: 1700, y: 130 },
        { x: 2077, y: 210 }, { x: 2077, y: 110 }, { x: 2520, y: 160 }, { x: 2700, y: 380 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(980, 140, 'chest'));
      game.collectibles.push(new Collectible(1750, 130, 'chest'));
      game.collectibles.push(new Collectible(880, 380, 'speed'));
      game.collectibles.push(new Collectible(1650, 370, 'magnet'));

      game.enemies.push(new Enemy(320, 400, 'slime', 100));
      game.enemies.push(new Enemy(1800, 380, 'slime', 120));
      game.enemies.push(new Enemy(650, 170, 'bat', 120));
      game.enemies.push(new Enemy(1380, 150, 'bat', 130));
      game.enemies.push(new Enemy(2100, 160, 'bat', 120));
    }
  },

  '1-3': {
    id: '1-3',
    name: '1-3 Windmill Hill',
    subtitle: 'Ascending staircase bluffs & hilltop summit',
    themeIndex: 0,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[0];
      // Stepped hillside ascending into clouds
      game.platforms.push({ x: 0, y: 440, width: 480, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 540, y: 380, width: 340, height: 200, isOneWay: false, theme });
      game.platforms.push({ x: 940, y: 310, width: 360, height: 270, isOneWay: false, theme });
      game.platforms.push({ x: 1360, y: 240, width: 380, height: 340, isOneWay: false, theme });
      game.platforms.push({ x: 1800, y: 170, width: 820, height: 410, isOneWay: false, theme });

      // Stepping ledges
      game.platforms.push({ x: 440, y: 330, width: 120, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 840, y: 260, width: 120, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 1260, y: 190, width: 120, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 1950, y: 100, width: 160, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 2250, y: 90, width: 160, height: 20, isOneWay: true, theme });

      const stars = [
        { x: 260, y: 390 }, { x: 480, y: 280 }, { x: 700, y: 330 },
        { x: 880, y: 210 }, { x: 1100, y: 260 }, { x: 1300, y: 140 },
        { x: 1520, y: 190 }, { x: 1900, y: 120 }, { x: 2020, y: 50 }, { x: 2320, y: 40 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(680, 330, 'chest'));
      game.collectibles.push(new Collectible(1500, 190, 'chest'));
      game.collectibles.push(new Collectible(2400, 120, 'chest'));

      game.collectibles.push(new Collectible(1120, 260, 'spread'));
      game.collectibles.push(new Collectible(2100, 120, 'shield'));

      game.enemies.push(new Enemy(300, 400, 'slime', 100));
      game.enemies.push(new Enemy(720, 340, 'slime', 90));
      game.enemies.push(new Enemy(1140, 270, 'slime', 100));
      game.enemies.push(new Enemy(800, 140, 'bat', 120));
      game.enemies.push(new Enemy(1400, 100, 'bat', 120));
      game.enemies.push(new Enemy(2150, 130, 'porcupine', 100));
    }
  },

  '2-1': {
    id: '2-1',
    name: '2-1 Village Square',
    subtitle: 'Rooftops & moving timber merchant carts',
    themeIndex: 1,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[1];
      game.platforms.push({ x: 0, y: 440, width: 520, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 800, y: 430, width: 580, height: 150, isOneWay: false, theme });
      game.platforms.push({ x: 1660, y: 420, width: 680, height: 160, isOneWay: false, theme });
      game.platforms.push({ x: 2480, y: 430, width: 600, height: 150, isOneWay: false, theme });

      // Moving Carts
      game.platforms.push({ x: 540, y: 350, width: 140, height: 22, isOneWay: true, isMoving: true, vx: 75, minX: 520, maxX: 780, theme });
      game.platforms.push({ x: 1400, y: 340, width: 140, height: 22, isOneWay: true, isMoving: true, vx: -80, minX: 1380, maxX: 1640, theme });

      game.platforms.push({ x: 260, y: 320, width: 150, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 960, y: 290, width: 160, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 1820, y: 280, width: 170, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 2100, y: 190, width: 160, height: 22, isOneWay: true, theme });

      const stars = [
        { x: 300, y: 260 }, { x: 620, y: 290 }, { x: 880, y: 380 },
        { x: 1020, y: 230 }, { x: 1240, y: 380 }, { x: 1480, y: 280 },
        { x: 1750, y: 370 }, { x: 1880, y: 220 }, { x: 2160, y: 130 }, { x: 2650, y: 380 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(1080, 380, 'chest'));
      game.collectibles.push(new Collectible(1960, 370, 'chest'));
      game.collectibles.push(new Collectible(900, 380, 'speed'));
      game.collectibles.push(new Collectible(2200, 370, 'heal'));

      game.enemies.push(new Enemy(380, 400, 'porcupine', 100));
      game.enemies.push(new Enemy(1150, 390, 'porcupine', 110));
      game.enemies.push(new Enemy(1950, 380, 'porcupine', 120));
      game.enemies.push(new Enemy(950, 390, 'slime', 100));
      game.enemies.push(new Enemy(600, 180, 'bat', 120));
      game.enemies.push(new Enemy(1500, 170, 'bat', 120));
    }
  },

  '2-2': {
    id: '2-2',
    name: '2-2 Timber Bridges',
    subtitle: 'Suspension spans & fragile crumbling planks',
    themeIndex: 1,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[1];
      game.platforms.push({ x: 0, y: 440, width: 440, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 860, y: 430, width: 420, height: 150, isOneWay: false, theme });
      game.platforms.push({ x: 1680, y: 420, width: 440, height: 160, isOneWay: false, theme });
      game.platforms.push({ x: 2500, y: 430, width: 550, height: 150, isOneWay: false, theme });

      // Suspension Bridges
      game.bridges.push({ x: 440, y: 440, w: 130, targetY: 430 });
      game.platforms.push({ x: 440, y: 435, width: 130, height: 16, isOneWay: true });
      game.bridges.push({ x: 1280, y: 430, w: 130, targetY: 420 });
      game.platforms.push({ x: 1280, y: 425, width: 130, height: 16, isOneWay: true });
      game.bridges.push({ x: 2120, y: 420, w: 130, targetY: 425 });
      game.platforms.push({ x: 2120, y: 420, width: 130, height: 16, isOneWay: true });

      // Crumbling Timber Planks across abysses!
      game.platforms.push({ x: 600, y: 430, width: 110, height: 18, isOneWay: true, isCrumbling: true });
      game.platforms.push({ x: 730, y: 430, width: 110, height: 18, isOneWay: true, isCrumbling: true });
      game.platforms.push({ x: 1440, y: 420, width: 110, height: 18, isOneWay: true, isCrumbling: true });
      game.platforms.push({ x: 1570, y: 420, width: 110, height: 18, isOneWay: true, isCrumbling: true });
      game.platforms.push({ x: 2280, y: 415, width: 100, height: 18, isOneWay: true, isCrumbling: true });
      game.platforms.push({ x: 2400, y: 415, width: 90, height: 18, isOneWay: true, isCrumbling: true });

      game.platforms.push({ x: 960, y: 260, width: 160, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 1800, y: 240, width: 160, height: 22, isOneWay: true, theme });

      const stars = [
        { x: 280, y: 390 }, { x: 650, y: 370 }, { x: 780, y: 370 },
        { x: 1020, y: 200 }, { x: 1350, y: 370 }, { x: 1500, y: 360 },
        { x: 1620, y: 360 }, { x: 1860, y: 180 }, { x: 2330, y: 360 }, { x: 2650, y: 380 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(980, 210, 'shield'));
      game.collectibles.push(new Collectible(1820, 190, 'spread'));

      game.enemies.push(new Enemy(500, 180, 'bat', 120));
      game.enemies.push(new Enemy(750, 160, 'bat', 110));
      game.enemies.push(new Enemy(1350, 170, 'bat', 130));
      game.enemies.push(new Enemy(1600, 150, 'bat', 120));
      game.enemies.push(new Enemy(2250, 160, 'bat', 110));
      game.enemies.push(new Enemy(300, 400, 'porcupine', 100));
      game.enemies.push(new Enemy(1100, 390, 'porcupine', 100));
    }
  },

  '2-3': {
    id: '2-3',
    name: '2-3 Sunset Valley',
    subtitle: 'Twilight rock spires & precision chasm leaping',
    themeIndex: 1,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[1];
      game.platforms.push({ x: 0, y: 440, width: 420, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 520, y: 400, width: 160, height: 180, isOneWay: false, theme });
      game.platforms.push({ x: 760, y: 340, width: 150, height: 240, isOneWay: false, theme });
      game.platforms.push({ x: 1020, y: 280, width: 160, height: 300, isOneWay: false, theme });
      game.platforms.push({ x: 1280, y: 350, width: 150, height: 230, isOneWay: false, theme });
      game.platforms.push({ x: 1540, y: 410, width: 200, height: 170, isOneWay: false, theme });
      game.platforms.push({ x: 1840, y: 330, width: 170, height: 250, isOneWay: false, theme });
      game.platforms.push({ x: 2120, y: 260, width: 180, height: 320, isOneWay: false, theme });
      game.platforms.push({ x: 2420, y: 390, width: 620, height: 190, isOneWay: false, theme });

      // Moving Rock Platform
      game.platforms.push({ x: 1320, y: 230, width: 130, height: 20, isOneWay: true, isMoving: true, vx: 70, minX: 1280, maxX: 1520, theme });
      // High Launch Bounce Pad
      game.platforms.push({ x: 1600, y: 390, width: 70, height: 18, isBouncePad: true, isOneWay: true });

      game.platforms.push({ x: 800, y: 180, width: 150, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 1900, y: 160, width: 160, height: 20, isOneWay: true, theme });

      const stars = [
        { x: 280, y: 390 }, { x: 590, y: 340 }, { x: 820, y: 130 },
        { x: 830, y: 280 }, { x: 1090, y: 220 }, { x: 1380, y: 180 },
        { x: 1635, y: 120 }, { x: 1920, y: 270 }, { x: 2180, y: 200 }, { x: 2600, y: 340 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(850, 140, 'chest'));
      game.collectibles.push(new Collectible(1950, 120, 'chest'));
      game.collectibles.push(new Collectible(2700, 340, 'chest'));

      game.collectibles.push(new Collectible(1100, 240, 'magnet'));
      game.collectibles.push(new Collectible(2200, 210, 'speed'));

      game.enemies.push(new Enemy(700, 150, 'bat', 120));
      game.enemies.push(new Enemy(1200, 130, 'bat', 120));
      game.enemies.push(new Enemy(1700, 140, 'bat', 130));
      game.enemies.push(new Enemy(2200, 120, 'bat', 120));
      game.enemies.push(new Enemy(300, 400, 'porcupine', 100));
      game.enemies.push(new Enemy(1600, 370, 'porcupine', 90));
      game.enemies.push(new Enemy(2550, 350, 'porcupine', 120));
    }
  },

  '3-1': {
    id: '3-1',
    name: '3-1 Alpine Ridge',
    subtitle: 'Snowy peaks & slippery low-friction ice',
    themeIndex: 2,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[2];
      game.platforms.push({ x: 0, y: 440, width: 600, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 780, y: 430, width: 640, height: 150, isOneWay: false, theme });
      game.platforms.push({ x: 1580, y: 420, width: 660, height: 160, isOneWay: false, theme });
      game.platforms.push({ x: 2400, y: 430, width: 600, height: 150, isOneWay: false, theme });

      game.bridges.push({ x: 600, y: 440, w: 180, targetY: 430 });
      game.platforms.push({ x: 600, y: 435, width: 180, height: 16, isOneWay: true });
      game.bridges.push({ x: 1420, y: 430, w: 160, targetY: 420 });
      game.platforms.push({ x: 1420, y: 425, width: 160, height: 16, isOneWay: true });
      game.bridges.push({ x: 2240, y: 420, w: 160, targetY: 430 });
      game.platforms.push({ x: 2240, y: 425, width: 160, height: 16, isOneWay: true });

      // Slippery Ice Ledges!
      game.platforms.push({ x: 280, y: 320, width: 220, height: 22, isIce: true, isOneWay: true });
      game.platforms.push({ x: 980, y: 310, width: 240, height: 22, isIce: true, isOneWay: true });
      game.platforms.push({ x: 1740, y: 300, width: 240, height: 22, isIce: true, isOneWay: true });
      game.platforms.push({ x: 2100, y: 200, width: 200, height: 22, isIce: true, isOneWay: true });

      const stars = [
        { x: 380, y: 260 }, { x: 450, y: 260 }, { x: 690, y: 380 },
        { x: 1060, y: 250 }, { x: 1140, y: 250 }, { x: 1500, y: 370 },
        { x: 1820, y: 240 }, { x: 1900, y: 240 }, { x: 2180, y: 140 }, { x: 2650, y: 380 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(400, 280, 'chest'));
      game.collectibles.push(new Collectible(1850, 260, 'chest'));
      game.collectibles.push(new Collectible(1080, 270, 'speed'));
      game.collectibles.push(new Collectible(2550, 380, 'shield'));

      game.enemies.push(new Enemy(450, 400, 'porcupine', 100));
      game.enemies.push(new Enemy(1200, 390, 'porcupine', 110));
      game.enemies.push(new Enemy(1950, 380, 'porcupine', 110));
      game.enemies.push(new Enemy(550, 170, 'bat', 120));
      game.enemies.push(new Enemy(1100, 150, 'bat', 120));
      game.enemies.push(new Enemy(1650, 160, 'bat', 130));
      game.enemies.push(new Enemy(2200, 140, 'bat', 120));
    }
  },

  '3-2': {
    id: '3-2',
    name: '3-2 Castle Sconces',
    subtitle: 'Stone battlements & floor spike hazard traps',
    themeIndex: 2,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[2];
      game.platforms.push({ x: 0, y: 440, width: 460, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 640, y: 420, width: 380, height: 160, isOneWay: false, theme });
      game.platforms.push({ x: 1200, y: 400, width: 400, height: 180, isOneWay: false, theme });
      game.platforms.push({ x: 1780, y: 420, width: 420, height: 160, isOneWay: false, theme });
      game.platforms.push({ x: 2380, y: 440, width: 600, height: 140, isOneWay: false, theme });

      // Danger Floor Spikes between towers
      game.platforms.push({ x: 460, y: 460, width: 180, height: 26, isHazard: true });
      game.platforms.push({ x: 1020, y: 450, width: 180, height: 26, isHazard: true });
      game.platforms.push({ x: 1600, y: 450, width: 180, height: 26, isHazard: true });
      game.platforms.push({ x: 2200, y: 460, width: 180, height: 26, isHazard: true });

      game.platforms.push({ x: 240, y: 310, width: 150, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 760, y: 280, width: 150, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 1320, y: 250, width: 160, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 1920, y: 270, width: 150, height: 22, isOneWay: true, theme });

      const stars = [
        { x: 300, y: 250 }, { x: 550, y: 340 }, { x: 820, y: 220 },
        { x: 1110, y: 320 }, { x: 1380, y: 190 }, { x: 1690, y: 320 },
        { x: 1980, y: 210 }, { x: 2290, y: 340 }, { x: 2520, y: 380 }, { x: 2680, y: 380 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(800, 240, 'chest'));
      game.collectibles.push(new Collectible(1950, 230, 'chest'));
      game.collectibles.push(new Collectible(1380, 210, 'shield'));
      game.collectibles.push(new Collectible(2500, 390, 'spread'));

      game.enemies.push(new Enemy(500, 160, 'bat', 120));
      game.enemies.push(new Enemy(1050, 150, 'bat', 110));
      game.enemies.push(new Enemy(1650, 150, 'bat', 120));
      game.enemies.push(new Enemy(2250, 160, 'bat', 130));
      game.enemies.push(new Enemy(250, 400, 'porcupine', 100));
      game.enemies.push(new Enemy(850, 380, 'porcupine', 100));
      game.enemies.push(new Enemy(1450, 360, 'porcupine', 100));
    }
  },

  '3-3': {
    id: '3-3',
    name: '3-3 Citadel Ramparts',
    subtitle: 'Vertical fortress elevators & high ramparts',
    themeIndex: 2,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[2];
      game.platforms.push({ x: 0, y: 440, width: 480, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 880, y: 420, width: 440, height: 160, isOneWay: false, theme });
      game.platforms.push({ x: 1700, y: 410, width: 480, height: 170, isOneWay: false, theme });
      game.platforms.push({ x: 2500, y: 420, width: 550, height: 160, isOneWay: false, theme });

      // Vertical Moving Elevators!
      game.platforms.push({ x: 580, y: 360, width: 140, height: 22, isOneWay: true, isMoving: true, vy: 65, minY: 180, maxY: 380, theme });
      game.platforms.push({ x: 1420, y: 340, width: 140, height: 22, isOneWay: true, isMoving: true, vy: -65, minY: 160, maxY: 360, theme });

      // Spikes below elevator shafts
      game.platforms.push({ x: 540, y: 480, width: 220, height: 24, isHazard: true });
      game.platforms.push({ x: 1380, y: 480, width: 220, height: 24, isHazard: true });

      game.platforms.push({ x: 260, y: 280, width: 150, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 1020, y: 220, width: 160, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 1850, y: 200, width: 170, height: 22, isOneWay: true, theme });
      game.platforms.push({ x: 2180, y: 280, width: 150, height: 22, isOneWay: true, theme });

      const stars = [
        { x: 320, y: 220 }, { x: 640, y: 280 }, { x: 640, y: 150 },
        { x: 1080, y: 160 }, { x: 1480, y: 260 }, { x: 1480, y: 130 },
        { x: 1760, y: 350 }, { x: 1920, y: 140 }, { x: 2240, y: 220 }, { x: 2680, y: 360 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(1050, 170, 'chest'));
      game.collectibles.push(new Collectible(1900, 150, 'chest'));
      game.collectibles.push(new Collectible(640, 110, 'spread'));
      game.collectibles.push(new Collectible(1500, 90, 'shield'));

      game.enemies.push(new Enemy(450, 150, 'bat', 120));
      game.enemies.push(new Enemy(800, 140, 'bat', 110));
      game.enemies.push(new Enemy(1300, 130, 'bat', 130));
      game.enemies.push(new Enemy(1650, 140, 'bat', 120));
      game.enemies.push(new Enemy(2300, 150, 'bat', 110));
      game.enemies.push(new Enemy(320, 400, 'porcupine', 100));
      game.enemies.push(new Enemy(1120, 380, 'porcupine', 100));
      game.enemies.push(new Enemy(1950, 370, 'porcupine', 110));
    }
  },

  '4-1': {
    id: '4-1',
    name: '4-1 Neon Skyline',
    subtitle: 'Cyberpunk metropolis & neon booster pads',
    themeIndex: 3,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[3];
      game.platforms.push({ x: 0, y: 440, width: 560, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 760, y: 430, width: 580, height: 150, isOneWay: false, theme });
      game.platforms.push({ x: 1520, y: 420, width: 620, height: 160, isOneWay: false, theme });
      game.platforms.push({ x: 2320, y: 430, width: 620, height: 150, isOneWay: false, theme });

      // Neon Boosters
      game.platforms.push({ x: 480, y: 420, width: 70, height: 18, isBouncePad: true, isOneWay: true });
      game.platforms.push({ x: 1260, y: 410, width: 70, height: 18, isBouncePad: true, isOneWay: true });
      game.platforms.push({ x: 2040, y: 400, width: 70, height: 18, isBouncePad: true, isOneWay: true });

      game.platforms.push({ x: 860, y: 180, width: 170, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 1640, y: 170, width: 180, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 2450, y: 200, width: 180, height: 20, isOneWay: true, theme });

      const stars = [
        { x: 515, y: 220 }, { x: 515, y: 120 }, { x: 920, y: 120 },
        { x: 1295, y: 210 }, { x: 1295, y: 110 }, { x: 1720, y: 110 },
        { x: 2075, y: 200 }, { x: 2075, y: 100 }, { x: 2520, y: 140 }, { x: 2700, y: 370 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(950, 130, 'chest'));
      game.collectibles.push(new Collectible(1750, 120, 'chest'));
      game.collectibles.push(new Collectible(900, 370, 'magnet'));
      game.collectibles.push(new Collectible(1680, 360, 'speed'));

      game.enemies.push(new Enemy(600, 160, 'bat', 130));
      game.enemies.push(new Enemy(1050, 140, 'bat', 120));
      game.enemies.push(new Enemy(1450, 150, 'bat', 130));
      game.enemies.push(new Enemy(1900, 140, 'bat', 120));
      game.enemies.push(new Enemy(2400, 160, 'bat', 130));
      game.enemies.push(new Enemy(300, 400, 'slime', 110));
      game.enemies.push(new Enemy(1800, 370, 'slime', 110));
    }
  },

  '4-2': {
    id: '4-2',
    name: '4-2 Cyber Monorail',
    subtitle: 'High-speed moving monorail transit cars',
    themeIndex: 3,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[3];
      game.platforms.push({ x: 0, y: 440, width: 440, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 880, y: 420, width: 420, height: 160, isOneWay: false, theme });
      game.platforms.push({ x: 1700, y: 410, width: 440, height: 170, isOneWay: false, theme });
      game.platforms.push({ x: 2520, y: 430, width: 520, height: 150, isOneWay: false, theme });

      // Fast Moving Monorail Cars
      game.platforms.push({ x: 480, y: 360, width: 160, height: 24, isOneWay: true, isMoving: true, vx: 120, minX: 440, maxX: 840, theme });
      game.platforms.push({ x: 1320, y: 350, width: 160, height: 24, isOneWay: true, isMoving: true, vx: -125, minX: 1300, maxX: 1680, theme });

      game.platforms.push({ x: 220, y: 280, width: 140, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 1040, y: 240, width: 150, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 1860, y: 230, width: 150, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 2180, y: 320, width: 160, height: 20, isOneWay: true, theme });

      const stars = [
        { x: 280, y: 220 }, { x: 560, y: 300 }, { x: 740, y: 300 },
        { x: 1100, y: 180 }, { x: 1400, y: 290 }, { x: 1580, y: 290 },
        { x: 1780, y: 350 }, { x: 1920, y: 170 }, { x: 2240, y: 260 }, { x: 2680, y: 370 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(1120, 190, 'chest'));
      game.collectibles.push(new Collectible(1940, 180, 'chest'));
      game.collectibles.push(new Collectible(560, 240, 'shield'));
      game.collectibles.push(new Collectible(1500, 230, 'spread'));

      game.enemies.push(new Enemy(500, 150, 'bat', 130));
      game.enemies.push(new Enemy(800, 140, 'bat', 120));
      game.enemies.push(new Enemy(1350, 130, 'bat', 130));
      game.enemies.push(new Enemy(1650, 140, 'bat', 120));
      game.enemies.push(new Enemy(2250, 150, 'bat', 130));
      game.enemies.push(new Enemy(280, 400, 'porcupine', 110));
      game.enemies.push(new Enemy(1100, 380, 'porcupine', 110));
    }
  },

  '4-3': {
    id: '4-3',
    name: '4-3 Quantum Spire',
    subtitle: 'Phase-shifting quantum void blocks & drone swarms',
    themeIndex: 3,
    playerStart: { x: 90, y: 340 },
    build(game) {
      const theme = STAGES[3];
      game.platforms.push({ x: 0, y: 440, width: 420, height: 140, isOneWay: false, theme });
      game.platforms.push({ x: 860, y: 410, width: 400, height: 160, isOneWay: false, theme });
      game.platforms.push({ x: 1680, y: 400, width: 420, height: 170, isOneWay: false, theme });
      game.platforms.push({ x: 2500, y: 420, width: 550, height: 160, isOneWay: false, theme });

      // Phase-Shifting Quantum Blocks (solid -> warning -> phantom)
      game.platforms.push({ x: 460, y: 380, width: 120, height: 22, isQuantum: true, isOneWay: true });
      game.platforms.push({ x: 680, y: 320, width: 120, height: 22, isQuantum: true, isOneWay: true });
      game.platforms.push({ x: 1300, y: 350, width: 120, height: 22, isQuantum: true, isOneWay: true });
      game.platforms.push({ x: 1500, y: 290, width: 120, height: 22, isQuantum: true, isOneWay: true });
      game.platforms.push({ x: 2140, y: 340, width: 120, height: 22, isQuantum: true, isOneWay: true });
      game.platforms.push({ x: 2340, y: 270, width: 120, height: 22, isQuantum: true, isOneWay: true });

      game.platforms.push({ x: 980, y: 200, width: 160, height: 20, isOneWay: true, theme });
      game.platforms.push({ x: 1820, y: 190, width: 160, height: 20, isOneWay: true, theme });

      const stars = [
        { x: 260, y: 380 }, { x: 520, y: 320 }, { x: 740, y: 260 },
        { x: 1040, y: 140 }, { x: 1360, y: 290 }, { x: 1560, y: 230 },
        { x: 1750, y: 340 }, { x: 1880, y: 130 }, { x: 2200, y: 280 }, { x: 2650, y: 360 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(1060, 150, 'chest'));
      game.collectibles.push(new Collectible(1900, 140, 'chest'));
      game.collectibles.push(new Collectible(740, 210, 'shield'));
      game.collectibles.push(new Collectible(1560, 180, 'spread'));
      game.collectibles.push(new Collectible(2200, 220, 'speed'));

      game.enemies.push(new Enemy(550, 150, 'bat', 130));
      game.enemies.push(new Enemy(900, 130, 'bat', 130));
      game.enemies.push(new Enemy(1400, 140, 'bat', 130));
      game.enemies.push(new Enemy(1750, 130, 'bat', 130));
      game.enemies.push(new Enemy(2300, 140, 'bat', 130));
      game.enemies.push(new Enemy(280, 400, 'porcupine', 110));
      game.enemies.push(new Enemy(1080, 370, 'porcupine', 110));
      game.enemies.push(new Enemy(1900, 360, 'porcupine', 110));
    }
  },

  'final': {
    id: 'final',
    name: 'Final Stage: Star Palace',
    subtitle: 'The Giant Word Titan Boss Arena',
    themeIndex: 4,
    playerStart: { x: 120, y: 340 },
    build(game) {
      const theme = STAGES[4];
      // Grand Neoclassical Arena
      game.platforms.push({ x: 0, y: 440, width: 1900, height: 160, isOneWay: false, theme });

      // Royal Left & Right Tiers
      game.platforms.push({ x: 160, y: 310, width: 180, height: 24, isOneWay: true, theme });
      game.platforms.push({ x: 220, y: 190, width: 160, height: 24, isOneWay: true, theme });

      game.platforms.push({ x: 1460, y: 310, width: 180, height: 24, isOneWay: true, theme });
      game.platforms.push({ x: 1420, y: 190, width: 160, height: 24, isOneWay: true, theme });

      // Central Dais & Trampolines
      game.platforms.push({ x: 760, y: 280, width: 280, height: 24, isOneWay: true, theme });
      game.platforms.push({ x: 420, y: 420, width: 70, height: 18, isBouncePad: true, isOneWay: true });
      game.platforms.push({ x: 1310, y: 420, width: 70, height: 18, isBouncePad: true, isOneWay: true });

      const stars = [
        { x: 250, y: 250 }, { x: 300, y: 130 }, { x: 455, y: 220 },
        { x: 820, y: 220 }, { x: 900, y: 220 }, { x: 980, y: 220 },
        { x: 1345, y: 220 }, { x: 1500, y: 130 }, { x: 1550, y: 250 }, { x: 900, y: 380 }
      ];
      for (const pos of stars) game.collectibles.push(new Collectible(pos.x, pos.y, 'star'));

      game.collectibles.push(new Collectible(300, 140, 'shield'));
      game.collectibles.push(new Collectible(900, 230, 'spread'));
      game.collectibles.push(new Collectible(1500, 140, 'heal'));

      game.collectibles.push(new Collectible(250, 260, 'chest'));
      game.collectibles.push(new Collectible(1550, 260, 'chest'));

      // The Word Titan Boss!
      game.enemies.push(new Enemy(1100, 350, 'boss', 380));
      game.enemies.push(new Enemy(650, 390, 'slime', 100));
      game.enemies.push(new Enemy(1350, 390, 'slime', 100));
    }
  }
};

// Curated vocabulary quiz dictionary
const WORD_CHALLENGES = [
  { id: 'apple', topic: 'food', question: 'What is this delicious fruit?', answer: 'apple', choices: ['apple', 'banana', 'orange', 'grape'] },
  { id: 'star', topic: 'objects', question: 'What shines brightly in the sky?', answer: 'star', choices: ['star', 'moon', 'sun', 'cloud'] },
  { id: 'dog', topic: 'animals', question: 'Who is Wordi the friendly puppy?', answer: 'dog', choices: ['dog', 'cat', 'rabbit', 'bear'] },
  { id: 'book', topic: 'objects', question: 'You read stories in a...', answer: 'book', choices: ['book', 'table', 'chair', 'pen'] },
  { id: 'castle', topic: 'places', question: 'A kingdom has a majestic...', answer: 'castle', choices: ['castle', 'tent', 'bridge', 'boat'] },
  { id: 'heart', topic: 'objects', question: 'Symbol of health and love:', answer: 'heart', choices: ['heart', 'star', 'circle', 'square'] },
  { id: 'car', topic: 'places', question: 'A motor vehicle with four wheels:', answer: 'car', choices: ['car', 'boat', 'plane', 'rocket'] },
  { id: 'pizza', topic: 'food', question: 'Baked Italian dough with cheese:', answer: 'pizza', choices: ['pizza', 'apple', 'salad', 'soup'] },
  { id: 'tree', topic: 'objects', question: 'Tall plant with a trunk and leaves:', answer: 'tree', choices: ['tree', 'flower', 'grass', 'bush'] },
  { id: 'sun', topic: 'objects', question: 'The star at the center of our solar system:', answer: 'sun', choices: ['sun', 'moon', 'star', 'comet'] },
  { id: 'cat', topic: 'animals', question: 'A furry companion that purrs:', answer: 'cat', choices: ['cat', 'dog', 'cow', 'lion'] },
  { id: 'wave', topic: 'places', question: 'Ocean water that rises and curls:', answer: 'wave', choices: ['wave', 'wind', 'stone', 'fire'] },
];

/* ==========================================================================
   PROGRESS MANAGER (localStorage Sync)
   ========================================================================== */
class ProgressManager {
  constructor() {
    this._mem = {};
    this.stars = parseInt(this._get('wordyssey_stars') || '0', 10);
    this.coins = parseInt(this._get('wordyssey_coins') || '50', 10);
    this.highScore = parseInt(this._get('wordyssey_high_score') || '0', 10);
    this.difficulty = this._get('wordyssey_difficulty') || 'normal';

    const savedLevels = this._get('wordyssey_unlocked_levels');
    this.unlockedLevels = savedLevels ? JSON.parse(savedLevels) : [...ALL_LEVEL_IDS];
    if (!this.unlockedLevels || this.unlockedLevels.length < ALL_LEVEL_IDS.length) {
      this.unlockedLevels = [...ALL_LEVEL_IDS];
    }

    this.activeLevelId = '1-1';
  }

  _get(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return Object.prototype.hasOwnProperty.call(this._mem, key) ? this._mem[key] : null;
    }
  }

  _set(key, val) {
    this._mem[key] = val;
    try {
      localStorage.setItem(key, val);
    } catch (_) {}
  }

  setDifficulty(diff) {
    if (DIFFICULTY_CONFIG[diff]) {
      this.difficulty = diff;
      this._set('wordyssey_difficulty', diff);
      this.updateDifficultyUI();
      if (window.sound && window.sound.playPowerup) {
        window.sound.playPowerup();
      }
      if (window.game) {
        window.game.applyDifficulty(diff);
      }
      const cfg = DIFFICULTY_CONFIG[diff];
      const colorMap = { casual: '#30d158', normal: '#0a84ff', hero: '#ff9f0a' };
      if (window.suite && window.suite.showToast) {
        window.suite.showToast(`${cfg.name} · ${cfg.maxHp} HP · ${cfg.scoreMultiplier}x Score`, colorMap[diff]);
      }
    }
  }

  updateDifficultyUI() {
    const diff = DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG.normal;
    const hudBadge = document.getElementById('hudDifficultyBadge');
    if (hudBadge) {
      hudBadge.textContent = diff.badge;
      hudBadge.className = 'diff-badge ' + diff.badgeClass;
      hudBadge.title = `${diff.name} · Click to switch`;
    }
    const mapDiffPill = document.getElementById('mapNodeDifficultyPill');
    if (mapDiffPill) {
      mapDiffPill.textContent = `${diff.name} · ${diff.scoreMultiplier}x`;
    }
    const mapNodeChip = document.getElementById('mapNodeDifficultyBtn');
    if (mapNodeChip) {
      const dot = mapNodeChip.querySelector('.chip-dot');
      if (dot) {
        const dotColors = { casual: '#30d158', normal: '#0a84ff', hero: '#ff9f0a' };
        dot.style.background = dotColors[this.difficulty] || '#0a84ff';
        dot.style.boxShadow = `0 0 8px ${dotColors[this.difficulty] || '#0a84ff'}`;
      }
    }
    const diffDesc = document.getElementById('difficultyDesc');
    if (diffDesc) {
      diffDesc.textContent = diff.desc;
    }
    document.querySelectorAll('#difficultyPicker .seg-btn, #headerDifficultyPicker .seg-btn, #mapDifficultyPicker .seg-btn').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.diff === this.difficulty);
    });
  }

  save() {
    this._set('wordyssey_stars', this.stars.toString());
    this._set('wordyssey_coins', this.coins.toString());
    this._set('wordyssey_high_score', this.highScore.toString());
    this._set('wordyssey_difficulty', this.difficulty);
    this._set('wordyssey_unlocked_levels', JSON.stringify(this.unlockedLevels));
    this.updateNavUI();
    this.updateDifficultyUI();
  }

  addStars(n) {
    this.stars += n;
    this.save();
  }

  addCoins(n) {
    this.coins += n;
    this.save();
  }

  unlockNextLevel(currentLevelId) {
    const allIds = ALL_LEVEL_IDS;
    const curIdx = allIds.indexOf(currentLevelId);
    if (curIdx !== -1 && curIdx < allIds.length - 1) {
      const nextId = allIds[curIdx + 1];
      if (!this.unlockedLevels.includes(nextId)) {
        this.unlockedLevels.push(nextId);
      }
    }
    this.save();
  }

  updateNavUI() {
    const sEl = document.getElementById('navTotalStars');
    const cEl = document.getElementById('navTotalCoins');
    if (sEl) sEl.textContent = this.stars;
    if (cEl) cEl.textContent = this.coins;
    this.updateDifficultyUI();
  }
}

const progress = new ProgressManager();

/* ==========================================================================
   VECTOR SHAPE & CLUE DRAWING UTILITIES
   ========================================================================== */
function drawFacetedStar(ctx, cx, cy, outerRadius, innerRadius) {
  const points = 5;
  const step = Math.PI / points;

  for (let i = 0; i < points; i++) {
    const angleOuter = (i * 2 * step) - Math.PI / 2;
    const angleInner = angleOuter + step;

    const ox = cx + Math.cos(angleOuter) * outerRadius;
    const oy = cy + Math.sin(angleOuter) * outerRadius;
    const ix = cx + Math.cos(angleInner) * innerRadius;
    const iy = cy + Math.sin(angleInner) * innerRadius;

    ctx.fillStyle = '#ffbe0b';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
    ctx.closePath();
    ctx.fill();

    const prevInner = angleOuter - step;
    const pix = cx + Math.cos(prevInner) * innerRadius;
    const piy = cy + Math.sin(prevInner) * innerRadius;

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(pix, piy);
    ctx.lineTo(ox, oy);
    ctx.closePath();
    ctx.fill();
  }
}

function drawClueIllustration(canvasId, clueId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.translate(cx, cy);

  if (clueId === 'apple') {
    const grad = ctx.createRadialGradient(-8, -8, 4, 0, 4, 34);
    grad.addColorStop(0, '#ff6b6b');
    grad.addColorStop(0.6, '#ee0a24');
    grad.addColorStop(1, '#9b0012');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(-26, -26, -34, 10, -16, 26);
    ctx.bezierCurveTo(-6, 32, 0, 24, 0, 24);
    ctx.bezierCurveTo(0, 24, 6, 32, 16, 26);
    ctx.bezierCurveTo(34, 10, 26, -26, 0, -18);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-12, -8, 6, 12, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#5c4033';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(4, -30, 8, -34);
    ctx.stroke();

    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.moveTo(3, -24);
    ctx.quadraticCurveTo(18, -32, 22, -22);
    ctx.quadraticCurveTo(12, -18, 3, -24);
    ctx.fill();

  } else if (clueId === 'star') {
    ctx.shadowColor = '#ffbe0b';
    ctx.shadowBlur = 18;
    drawFacetedStar(ctx, 0, 0, 32, 14);

  } else if (clueId === 'dog') {
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-16, -16); ctx.lineTo(-24, -36); ctx.lineTo(-4, -22); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, -22); ctx.lineTo(24, -36); ctx.lineTo(16, -16); ctx.fill();

    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.ellipse(0, 8, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(-8, -2, 3.8, 0, Math.PI * 2);
    ctx.arc(8, -2, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 5, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6b81';
    ctx.beginPath();
    ctx.arc(0, 12, 4, 0, Math.PI);
    ctx.fill();

  } else if (clueId === 'book') {
    ctx.fillStyle = '#3949ab';
    ctx.fillRect(-26, -20, 52, 40);
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2;
    ctx.strokeRect(-22, -16, 44, 32);
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(-26, -20, 8, 40);
    ctx.fillStyle = '#fff8e1';
    ctx.fillRect(20, -18, 6, 36);

  } else if (clueId === 'castle') {
    ctx.fillStyle = '#78909c';
    ctx.fillRect(-20, -10, 40, 36);
    ctx.fillRect(-24, -22, 48, 12);
    ctx.clearRect(-14, -22, 8, 6);
    ctx.clearRect(6, -22, 8, 6);
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.lineTo(0, -36); ctx.stroke();
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(0, -36); ctx.lineTo(14, -31); ctx.lineTo(0, -26); ctx.fill();

  } else if (clueId === 'heart') {
    const grad = ctx.createRadialGradient(-6, -6, 2, 0, 0, 30);
    grad.addColorStop(0, '#ff5252');
    grad.addColorStop(0.7, '#d50000');
    grad.addColorStop(1, '#8b0000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.bezierCurveTo(-26, 4, -26, -22, -6, -22);
    ctx.bezierCurveTo(0, -22, 0, -14, 0, -14);
    ctx.bezierCurveTo(0, -14, 0, -22, 6, -22);
    ctx.bezierCurveTo(26, -22, 26, 4, 0, 24);
    ctx.fill();

  } else if (clueId === 'cat') {
    // Sleek Vector Kitty Portrait
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 4, 22, 0, Math.PI * 2);
    ctx.fill();
    // Pointed ears
    ctx.beginPath();
    ctx.moveTo(-18, -6); ctx.lineTo(-22, -28); ctx.lineTo(-4, -15); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18, -6); ctx.lineTo(22, -28); ctx.lineTo(4, -15); ctx.fill();
    ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    ctx.moveTo(-16, -8); ctx.lineTo(-19, -22); ctx.lineTo(-7, -14); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -8); ctx.lineTo(19, -22); ctx.lineTo(7, -14); ctx.fill();
    // Eyes
    ctx.fillStyle = '#30d158';
    ctx.beginPath();
    ctx.arc(-8, 1, 3.8, 0, Math.PI * 2);
    ctx.arc(8, 1, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(-8, 1, 1.4, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 1, 1.4, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pink nose & whiskers
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(-3, 7); ctx.lineTo(3, 7); ctx.lineTo(0, 11); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-12, 8); ctx.lineTo(-28, 6);
    ctx.moveTo(-12, 11); ctx.lineTo(-28, 13);
    ctx.moveTo(12, 8); ctx.lineTo(28, 6);
    ctx.moveTo(12, 11); ctx.lineTo(28, 13);
    ctx.stroke();

  } else if (clueId === 'car') {
    // Sleek Red Coupe
    ctx.fillStyle = '#0a84ff';
    ctx.beginPath();
    ctx.roundRect(-28, -2, 56, 18, 6);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-18, -2); ctx.lineTo(-10, -16); ctx.lineTo(12, -16); ctx.lineTo(20, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.moveTo(-14, -3); ctx.lineTo(-8, -13); ctx.lineTo(10, -13); ctx.lineTo(16, -3);
    ctx.closePath();
    ctx.fill();
    // Wheels
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(-16, 16, 7.5, 0, Math.PI * 2);
    ctx.arc(16, 16, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(-16, 16, 3.2, 0, Math.PI * 2);
    ctx.arc(16, 16, 3.2, 0, Math.PI * 2);
    ctx.fill();

  } else if (clueId === 'pizza') {
    // Crisp Cheese & Pepperoni Slice
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(-22, -24, 44, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath();
    ctx.moveTo(-20, -17);
    ctx.lineTo(20, -17);
    ctx.lineTo(0, 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-6, -8, 4.5, 0, Math.PI * 2);
    ctx.arc(7, -5, 4, 0, Math.PI * 2);
    ctx.arc(0, 7, 4.2, 0, Math.PI * 2);
    ctx.fill();

  } else if (clueId === 'tree') {
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(-6, 4, 12, 24, 2);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(0, -10, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#30d158';
    ctx.beginPath();
    ctx.arc(-12, -2, 13, 0, Math.PI * 2);
    ctx.arc(12, -2, 13, 0, Math.PI * 2);
    ctx.arc(0, -20, 14, 0, Math.PI * 2);
    ctx.fill();

  } else if (clueId === 'wave') {
    const wGrad = ctx.createLinearGradient(0, -20, 0, 24);
    wGrad.addColorStop(0, '#38bdf8');
    wGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = wGrad;
    ctx.beginPath();
    ctx.moveTo(-30, 18);
    ctx.bezierCurveTo(-24, -18, 6, -24, 16, -6);
    ctx.bezierCurveTo(6, -12, -2, -2, 6, 8);
    ctx.bezierCurveTo(16, 16, 28, 6, 30, 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, -12);
    ctx.quadraticCurveTo(18, -14, 22, -6);
    ctx.stroke();

  } else {
    // Sun Clue
    ctx.fillStyle = '#ffb300';
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 4);
      ctx.fillRect(-2.5, -28, 5, 10);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* ==========================================================================
   PARTICLE ENGINE
   ========================================================================== */
class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.color = '#fff'; this.size = 4;
    this.maxLife = 1.0; this.life = 0;
    this.type = 'circle'; this.gravity = 0;
    this.active = false; this.rotation = 0; this.vRot = 0;
  }

  init(x, y, vx, vy, color, size, maxLife, gravity = 0, type = 'circle') {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.size = size;
    this.maxLife = maxLife; this.life = maxLife;
    this.gravity = gravity; this.type = type;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 8;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.rotation += this.vRot * dt;
  }

  draw(ctx, camX) {
    if (!this.active) return;
    const progress = this.life / this.maxLife;
    const alpha = Math.max(0, Math.min(1, progress));
    const renderX = this.x - camX;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(renderX, this.y);
    ctx.rotate(this.rotation);

    if (this.type === 'confetti') {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else if (this.type === 'star') {
      ctx.fillStyle = this.color;
      drawFacetedStar(ctx, 0, 0, this.size, this.size * 0.45);
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, this.size * progress), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class ParticleSystem {
  constructor(maxParticles = 350) {
    this.pool = Array.from({ length: maxParticles }, () => new Particle());
  }

  spawn(x, y, vx, vy, color, size, life, gravity = 0, type = 'circle') {
    const p = this.pool.find(item => !item.active);
    if (p) p.init(x, y, vx, vy, color, size, life, gravity, type);
  }

  burst(x, y, count = 12, colors = ['#ffbe0b', '#ff9533', '#fff'], type = 'circle') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 50;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.spawn(x, y, vx, vy, color, 3 + Math.random() * 5, 0.4 + Math.random() * 0.4, 300, type);
    }
  }

  createDust(x, y) {
    for (let i = 0; i < 4; i++) {
      this.spawn(x, y, (Math.random() - 0.5) * 80, -10 - Math.random() * 30, 'rgba(255, 255, 255, 0.6)', 3, 0.35, 20, 'dust');
    }
  }

  createConfetti(x, y, count = 50) {
    const palette = ['#ffbe0b', '#ff006e', '#8338ec', '#3a86ff', '#fb5607', '#38b000'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 1.5) + (Math.random() - 0.5) * 1.2;
      const speed = 150 + Math.random() * 300;
      this.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, palette[Math.floor(Math.random() * palette.length)], 8, 1.2 + Math.random() * 0.8, 450, 'confetti');
    }
  }

  update(dt) {
    for (const p of this.pool) if (p.active) p.update(dt);
  }

  draw(ctx, camX) {
    for (const p of this.pool) if (p.active) p.draw(ctx, camX);
  }

  clear() {
    for (const p of this.pool) p.active = false;
  }
}

/* ==========================================================================
   ENTITIES: PLAYER, PROJECTILES, ENEMIES, COLLECTIBLES
   ========================================================================== */
class WordiPlayer {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset(x = 100, y = 300) {
    this.x = x; this.y = y;
    this.width = 46; this.height = 44;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.canDoubleJump = true;
    this.onIce = false;
    this.standingPlatform = null;

    const diff = DIFFICULTY_CONFIG[progress.difficulty] || DIFFICULTY_CONFIG.normal;
    this.maxHealth = diff.maxHp;
    this.health = diff.maxHp;
    this.invulnTimer = 0;

    this.shieldTimer = 0;
    this.spreadTimer = 0;
    this.speedTimer = 0;
    this.magnetTimer = 0;

    this.animTime = 0;
    this.isBarking = false;
    this.barkAnimTimer = 0;
  }

  applyPowerup(type, duration = 12) {
    if (type === 'shield') {
      this.shieldTimer = duration;
      this.game.sound.playPowerup();
    } else if (type === 'spread') {
      this.spreadTimer = duration;
      this.game.sound.playPowerup();
    } else if (type === 'speed') {
      this.speedTimer = duration;
      this.game.sound.playPowerup();
    } else if (type === 'magnet') {
      this.magnetTimer = duration;
      this.game.sound.playPowerup();
    } else if (type === 'heal') {
      if (this.health < this.maxHealth) {
        this.health++;
        this.game.updateHeartsUI();
      }
      this.game.sound.playPickupStar();
      this.game.particles.burst(this.x + this.width / 2, this.y, 16, ['#ff3366', '#ff99c8']);
    }
    this.game.updatePowerupsUI();
  }

  takeDamage(amount = 1) {
    if (this.invulnTimer > 0) return false;

    if (this.shieldTimer > 0) {
      this.shieldTimer = 0;
      this.invulnTimer = 0.8;
      this.game.triggerScreenShake(8);
      this.game.sound.playEnemyDefeat();
      this.game.particles.burst(this.x + this.width / 2, this.y + this.height / 2, 20, ['#0071e3', '#00f5d4']);
      this.game.updatePowerupsUI();
      return false;
    }

    this.health -= amount;
    const diff = DIFFICULTY_CONFIG[progress.difficulty] || DIFFICULTY_CONFIG.normal;
    this.invulnTimer = diff.invulnDuration;
    this.vy = -260;
    this.vx = -this.facing * 180;
    this.game.triggerScreenShake(14);
    this.game.sound.playPlayerHurt();
    this.game.particles.burst(this.x + this.width / 2, this.y + this.height / 2, 16, ['#ff453a', '#fff']);
    this.game.updateHeartsUI();

    if (this.health <= 0) {
      this.game.gameOver();
    }
    return true;
  }

  update(dt, input) {
    this.animTime += dt;

    if (this.shieldTimer > 0) this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    if (this.spreadTimer > 0) this.spreadTimer = Math.max(0, this.spreadTimer - dt);
    if (this.speedTimer > 0) this.speedTimer = Math.max(0, this.speedTimer - dt);
    if (this.magnetTimer > 0) this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);

    if (this.barkAnimTimer > 0) {
      this.barkAnimTimer -= dt;
      if (this.barkAnimTimer <= 0) this.isBarking = false;
    }

    const currentSpeed = this.speedTimer > 0 ? CONFIG.PLAYER_BOOST_SPEED : CONFIG.PLAYER_SPEED;
    let moveDir = 0;
    if (input.left) moveDir -= 1;
    if (input.right) moveDir += 1;

    if (moveDir !== 0) {
      this.vx = moveDir * currentSpeed;
      this.facing = moveDir;
      if (this.onGround && Math.random() < 0.25) {
        this.game.particles.createDust(this.x + this.width / 2, this.y + this.height);
      }
    } else {
      const friction = this.onIce ? 0.96 : 0.72;
      this.vx *= friction;
      if (Math.abs(this.vx) < 5) this.vx = 0;
    }

    if (input.jumpPressed) {
      if (this.onGround) {
        this.vy = CONFIG.JUMP_FORCE;
        this.onGround = false;
        this.canDoubleJump = true;
        this.game.sound.playJump();
        this.game.particles.createDust(this.x + this.width / 2, this.y + this.height);
      } else if (this.canDoubleJump) {
        this.vy = CONFIG.DOUBLE_JUMP_FORCE;
        this.canDoubleJump = false;
        this.game.sound.playJump();
        this.game.particles.burst(this.x + this.width / 2, this.y + this.height, 8, ['#ffbe0b', '#fff']);
      }
      input.jumpPressed = false;
    }

    this.vy += CONFIG.GRAVITY * dt;
    if (this.vy > CONFIG.MAX_FALL_SPEED) this.vy = CONFIG.MAX_FALL_SPEED;

    this.x += this.vx * dt;
    this.checkHorizontalCollisions();

    this.y += this.vy * dt;
    this.checkVerticalCollisions();

    if (this.y > CONFIG.CANVAS_HEIGHT + 150) {
      this.takeDamage(1);
      if (this.health > 0) {
        this.x = Math.max(50, this.x - 220);
        this.y = 80;
        this.vy = 0;
      }
    }

    if (input.shootPressed) {
      this.shootBark();
      input.shootPressed = false;
    }

    if (this.magnetTimer > 0) {
      const pCenter = { x: this.x + this.width / 2, y: this.y + this.height / 2 };
      for (const item of this.game.collectibles) {
        if (!item.collected && (item.type === 'star' || item.type === 'coin')) {
          const dx = pCenter.x - item.x;
          const dy = pCenter.y - item.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 260) {
            item.x += (dx / dist) * 280 * dt;
            item.y += (dy / dist) * 280 * dt;
          }
        }
      }
    }
  }

  shootBark() {
    this.isBarking = true;
    this.barkAnimTimer = 0.22;
    this.game.sound.playBark();

    const spawnX = this.facing === 1 ? this.x + this.width + 4 : this.x - 12;
    const spawnY = this.y + this.height / 2 - 4;

    if (this.spreadTimer > 0) {
      this.game.spawnProjectile(spawnX, spawnY, this.facing * 520, -70);
      this.game.spawnProjectile(spawnX, spawnY, this.facing * 550, 0);
      this.game.spawnProjectile(spawnX, spawnY, this.facing * 520, 70);
    } else {
      this.game.spawnProjectile(spawnX, spawnY, this.facing * 540, 0);
    }

    this.game.particles.burst(spawnX, spawnY, 6, ['#ffbe0b', '#ff9533']);
  }

  checkHorizontalCollisions() {
    const pBounds = this.getBounds();
    for (const plat of this.game.platforms) {
      if (plat.isOneWay) continue;
      if (rectsIntersect(pBounds, plat)) {
        if (this.vx > 0) {
          this.x = plat.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = plat.x + plat.width;
          this.vx = 0;
        }
      }
    }
  }

  checkVerticalCollisions() {
    this.onGround = false;
    this.standingPlatform = null;
    this.onIce = false;
    const pBounds = this.getBounds();

    for (const plat of this.game.platforms) {
      if (plat.fallen || (plat.isQuantum && !plat.isSolid)) continue;

      if (plat.isHazard) {
        if (rectsIntersect(pBounds, plat)) {
          this.takeDamage(1);
        }
        continue;
      }

      if (plat.isOneWay) {
        if (this.vy > 0 && (this.y + this.height - this.vy * 0.05) <= plat.y + 12) {
          if (this.x + this.width > plat.x + 4 && this.x < plat.x + plat.width - 4) {
            if (this.y + this.height >= plat.y && this.y + this.height <= plat.y + 20) {
              this.y = plat.y - this.height;
              this.vy = 0;
              this.onGround = true;
              this.standingPlatform = plat;

              if (plat.isBouncePad) {
                this.vy = -760;
                this.canDoubleJump = true;
                this.game.sound.playJump();
                this.game.particles.burst(this.x + this.width / 2, plat.y, 16, ['#00f5d4', '#ffbe0b', '#fff']);
                this.game.triggerScreenShake(4);
              }

              if (plat.isIce) {
                this.onIce = true;
              }

              if (plat.isCrumbling && !plat.crumbling) {
                plat.crumbling = true;
                plat.crumbleTimer = 0.8;
              }
            }
          }
        }
      } else {
        if (rectsIntersect(pBounds, plat)) {
          if (this.vy > 0) {
            this.y = plat.y - this.height;
            this.vy = 0;
            this.onGround = true;
            this.standingPlatform = plat;
            if (plat.isIce) this.onIce = true;
          } else if (this.vy < 0) {
            this.y = plat.y + plat.height;
            this.vy = 0;
          }
        }
      }
    }
  }

  getBounds() {
    return {
      x: this.x + 6,
      y: this.y + 4,
      width: this.width - 12,
      height: this.height - 4
    };
  }

  draw(ctx, camX) {
    if (this.invulnTimer > 0 && Math.floor(this.animTime * 15) % 2 === 0) return;

    const renderX = this.x - camX;
    const renderY = this.y;

    ctx.save();
    ctx.translate(renderX + this.width / 2, renderY + this.height / 2);
    ctx.scale(this.facing, 1);

    // Jump Squash & Stretch Dynamics
    if (!this.onGround) {
      const squashY = this.vy < 0 ? 1.12 : 0.92;
      const squashX = this.vy < 0 ? 0.9 : 1.08;
      ctx.scale(squashX, squashY);
    }

    if (this.shieldTimer > 0) {
      const shieldPulse = Math.sin(this.animTime * 6) * 3;
      ctx.beginPath();
      ctx.arc(0, 0, 32 + shieldPulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 113, 227, 0.22)';
      ctx.fill();
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(this.animTime * 3);
      ctx.beginPath();
      ctx.ellipse(0, 0, 34 + shieldPulse, 12, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.6)';
      ctx.stroke();
      ctx.restore();
    }

    // Tail Wag
    const tailAngle = Math.sin(this.animTime * 10) * 0.35;
    ctx.save();
    ctx.translate(-16, -2);
    ctx.rotate(tailAngle);
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.arc(-8, -4, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(-11, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body with Volumetric Gradient
    const bodyGrad = ctx.createRadialGradient(-2, 4, 4, -2, 4, 18);
    bodyGrad.addColorStop(0, '#ffa94d');
    bodyGrad.addColorStop(0.8, '#ff9533');
    bodyGrad.addColorStop(1, '#ea580c');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(-2, 4, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cream Belly
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.ellipse(3, 7, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Animated Paws
    const runCycle = Math.sin(this.animTime * 14);
    const frontPawOff = this.onGround && Math.abs(this.vx) > 10 ? runCycle * 6 : 0;
    const backPawOff = this.onGround && Math.abs(this.vx) > 10 ? -runCycle * 6 : 0;

    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(-10 + backPawOff, 17, 5, 0, Math.PI * 2);
    ctx.arc(6 + frontPawOff, 17, 5, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const headBob = this.onGround && Math.abs(this.vx) > 10 ? Math.cos(this.animTime * 14) * 2 : 0;
    ctx.save();
    ctx.translate(6, -6 + headBob);

    // Perked Ears
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.moveTo(-10, -10); ctx.lineTo(-14, -24); ctx.lineTo(-2, -14); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2, -14); ctx.lineTo(12, -24); ctx.lineTo(12, -9); ctx.fill();

    // Pink Inner Ears
    ctx.fillStyle = '#ffccd5';
    ctx.beginPath();
    ctx.moveTo(-9, -11); ctx.lineTo(-12, -21); ctx.lineTo(-3, -14); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, -13); ctx.lineTo(10, -21); ctx.lineTo(10, -10); ctx.fill();

    // Head Sphere with Volumetric Gradient
    const headGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 16);
    headGrad.addColorStop(0, '#ffa94d');
    headGrad.addColorStop(0.8, '#ff9533');
    headGrad.addColorStop(1, '#ea580c');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Cream Cheeks & Muzzle
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(6, 4, 10, 0, Math.PI * 2);
    ctx.arc(-4, 6, 8, 0, Math.PI * 2);
    ctx.fill();

    // Soft Pink Cheek Blush
    ctx.fillStyle = 'rgba(255, 107, 129, 0.45)';
    ctx.beginPath();
    ctx.ellipse(8, 2, 3, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(-4, 4, 2.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy Eyes with Catchlight
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(4, -2, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(5, -3, 1.2, 0, Math.PI * 2); ctx.fill();

    // Cute Button Nose
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(11, 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10.5, 1.5, 0.8, 0, Math.PI * 2); ctx.fill();

    // Open Happy Mouth / Bark
    if (this.isBarking || Math.abs(this.vx) > 20) {
      ctx.fillStyle = '#ff6b81';
      ctx.beginPath();
      ctx.arc(8, 7, 3.5, 0, Math.PI); ctx.fill();
    }

    // Sonic Bark Visual Effect (Acoustic Cone)
    if (this.isBarking) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(16, 4, 10, -0.6, 0.6);
      ctx.stroke();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(16, 4, 18, -0.7, 0.7);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Signature Blue Bandana with White Paw Print
    ctx.save();
    ctx.translate(4, 3 + headBob);
    ctx.fillStyle = '#2f7be5';
    ctx.beginPath();
    ctx.moveTo(-10, -3); ctx.lineTo(14, -2); ctx.lineTo(2, 10); ctx.closePath();
    ctx.fill();

    // Crisp White Paw Icon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, 3, 2.2, 0, Math.PI * 2); // Pad
    ctx.arc(0, 0.5, 1.1, 0, Math.PI * 2); // Toes
    ctx.arc(2, -0.5, 1.1, 0, Math.PI * 2);
    ctx.arc(4, 0.5, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}

class Projectile {
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.radius = 12; this.active = true; this.life = 1.6; this.rot = 0;
    this.isHostile = false;
  }

  update(dt, game) {
    this.life -= dt;
    if (this.life <= 0) { this.active = false; return; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += 12 * dt;

    for (const plat of game.platforms) {
      if (!plat.isOneWay && rectsIntersect(this.getBounds(), plat)) {
        this.active = false;
        game.particles.burst(this.x, this.y, 8, ['#ffbe0b', '#fff']);
        return;
      }
    }

    if (this.isHostile) {
      if (rectsIntersect(this.getBounds(), game.player.getBounds())) {
        this.active = false;
        game.player.takeDamage(1);
        game.particles.burst(this.x, this.y, 14, ['#f43f5e', '#a855f7', '#fff']);
        return;
      }
    } else {
      for (const enemy of game.enemies) {
        if (enemy.active && circlesIntersect(this, enemy)) {
          this.active = false;
          enemy.hit(1, game);
          game.particles.burst(this.x, this.y, 12, ['#ffbe0b', '#ff453a', '#fff']);
          return;
        }
      }
    }
  }

  getBounds() {
    return { x: this.x - this.radius, y: this.y - this.radius, width: this.radius * 2, height: this.radius * 2 };
  }

  draw(ctx, camX) {
    const renderX = this.x - camX;
    ctx.save();
    ctx.translate(renderX, this.y);
    ctx.rotate(this.rot);
    if (this.isHostile) {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      drawFacetedStar(ctx, 0, 0, this.radius + 3, this.radius * 0.45);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

class Enemy {
  constructor(x, y, type = 'slime', patrolRange = 140) {
    this.x = x; this.y = y; this.type = type;
    this.startX = x; this.patrolRange = patrolRange;
    this.active = true; this.facing = 1; this.animTime = Math.random() * 5;

    const diff = DIFFICULTY_CONFIG[progress.difficulty] || DIFFICULTY_CONFIG.normal;
    const speedMult = diff.enemySpeedMultiplier || 1.0;

    if (type === 'slime') {
      this.width = 36; this.height = 30; this.radius = 16; this.speed = 70 * speedMult; this.hp = 1;
      this.letter = ['A', 'E', 'I', 'O', 'U'][Math.floor(Math.random() * 5)];
    } else if (type === 'bat') {
      this.width = 38; this.height = 26; this.radius = 16; this.speed = 100 * speedMult; this.hp = 1; this.baseY = y;
    } else if (type === 'porcupine') {
      this.width = 42; this.height = 32; this.radius = 18; this.speed = 85 * speedMult; this.hp = 2;
    } else if (type === 'boss') {
      this.width = 76; this.height = 70; this.radius = 35; this.speed = 60 * speedMult;
      const bossHp = diff.id === 'hero' ? 16 : diff.id === 'casual' ? 8 : 12;
      this.hp = bossHp; this.maxHp = bossHp;
      this.attackTimer = 0;
      this.summonTimer = 0;
    }
  }

  hit(damage, game) {
    this.hp -= damage;
    game.sound.playEnemyDefeat();

    if (this.hp <= 0) {
      this.active = false;
      const points = this.type === 'boss' ? 1000 : 150;
      game.addScore(points);
      progress.addCoins(this.type === 'boss' ? 30 : 5);
      game.particles.burst(this.x + this.width / 2, this.y + this.height / 2, 24, ['#8338ec', '#ff006e', '#ffbe0b']);

      if (Math.random() < 0.45 || this.type === 'boss') {
        const types = ['heal', 'shield', 'spread', 'speed', 'magnet'];
        game.spawnCollectible(this.x, this.y - 10, types[Math.floor(Math.random() * types.length)]);
      }
    }
  }

  update(dt, game) {
    if (!this.active) return;
    this.animTime += dt;

    if (this.type === 'slime' || this.type === 'porcupine') {
      this.x += this.facing * this.speed * dt;
      if (this.x > this.startX + this.patrolRange) this.facing = -1;
      else if (this.x < this.startX - this.patrolRange) this.facing = 1;
    } else if (this.type === 'bat') {
      this.x += this.facing * this.speed * dt;
      this.y = this.baseY + Math.sin(this.animTime * 4) * 28;
      if (this.x > this.startX + this.patrolRange) this.facing = -1;
      else if (this.x < this.startX - this.patrolRange) this.facing = 1;
    } else if (this.type === 'boss') {
      this.facing = game.player.x > this.x ? 1 : -1;
      this.x += this.facing * this.speed * dt;

      // Boss Star Rune Ranged Attack
      this.attackTimer = (this.attackTimer || 0) + dt;
      if (this.attackTimer > 3.2) {
        this.attackTimer = 0;
        const dx = game.player.x - this.x;
        const dy = game.player.y - (this.y - 10);
        const dist = Math.hypot(dx, dy) || 1;
        const projSpeed = 240;
        game.spawnBossProjectile(this.x + this.width / 2, this.y, (dx / dist) * projSpeed, (dy / dist) * projSpeed);
        game.sound.playBark();
        game.particles.burst(this.x + this.width / 2, this.y, 10, ['#f43f5e', '#a855f7']);
      }

      // Boss Minion Summon
      this.summonTimer = (this.summonTimer || 0) + dt;
      if (this.summonTimer > 7.5 && game.enemies.length < 6) {
        this.summonTimer = 0;
        game.triggerScreenShake(8);
        game.enemies.push(new Enemy(this.x + (Math.random() > 0.5 ? 90 : -90), this.y + 20, 'slime', 100));
        game.particles.burst(this.x + this.width / 2, this.y + this.height, 18, ['#a855f7', '#00f5d4']);
      }
    }

    if (rectsIntersect(this.getBounds(), game.player.getBounds())) {
      game.player.takeDamage(1);
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  draw(ctx, camX) {
    if (!this.active) return;
    const renderX = this.x - camX + this.width / 2;
    const renderY = this.y + this.height / 2;

    ctx.save();
    ctx.translate(renderX, renderY);
    ctx.scale(this.facing, 1);

    if (this.type === 'slime') {
      const squash = Math.sin(this.animTime * 8) * 0.15;
      const slimeGrad = ctx.createRadialGradient(-4, -4, 4, 0, 0, 18);
      slimeGrad.addColorStop(0, '#c084fc');
      slimeGrad.addColorStop(0.7, '#8b5cf6');
      slimeGrad.addColorStop(1, '#581c87');
      ctx.fillStyle = slimeGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18 * (1 + squash), 15 * (1 - squash), 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(-6, -6, 5, 2.5, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -3, 4, 0, Math.PI * 2); ctx.arc(-2, -3, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(7, -3, 2, 0, Math.PI * 2); ctx.arc(-1, -3, 1.6, 0, Math.PI * 2); ctx.fill();

      // Inner Floating Alphabet Glyph
      ctx.fillStyle = '#00f5d4';
      ctx.font = 'bold 12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.letter, 0, 4);

    } else if (this.type === 'bat') {
      const wingFlap = Math.sin(this.animTime * 12);
      // Wings
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-22, -14 * wingFlap);
      ctx.lineTo(-12, 2);
      ctx.lineTo(-18, 10 * wingFlap);
      ctx.lineTo(-2, 4);
      ctx.closePath();
      ctx.fill();

      // Body
      const batGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
      batGrad.addColorStop(0, '#4338ca');
      batGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = batGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Ruby Eye
      ctx.fillStyle = '#ff006e';
      ctx.beginPath();
      ctx.arc(5, -2, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(6, -2.5, 0.8, 0, Math.PI * 2); ctx.fill();

      // Sharp beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(8, -1); ctx.lineTo(13, 0); ctx.lineTo(8, 2); ctx.fill();

    } else if (this.type === 'porcupine') {
      // Body
      const porcGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, 16);
      porcGrad.addColorStop(0, '#ec4899');
      porcGrad.addColorStop(1, '#831843');
      ctx.fillStyle = porcGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 16, Math.PI, 0); ctx.fill();

      // Quills with Sharp Gradients
      for (let i = -3; i <= 3; i++) {
        ctx.save();
        ctx.rotate((i * 0.28) - Math.PI / 2);
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(-3, -12); ctx.lineTo(0, -24); ctx.lineTo(3, -12); ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Snout & Eye
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(10, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(14, -1, 2, 0, Math.PI * 2); ctx.fill();
      ctx.arc(7, -4, 1.8, 0, Math.PI * 2); ctx.fill();

    } else if (this.type === 'boss') {
      // Word Titan Boss Body
      const bossGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 36);
      bossGrad.addColorStop(0, '#8b5cf6');
      bossGrad.addColorStop(0.6, '#5b21b6');
      bossGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bossGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();

      // Ancient Runic Armor Ring
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing Eyes
      ctx.fillStyle = '#ffbe0b';
      ctx.beginPath();
      ctx.arc(10, -8, 6, 0, Math.PI * 2);
      ctx.arc(-10, -8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(11, -9, 2.2, 0, Math.PI * 2);
      ctx.arc(-9, -9, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Floating Crown of Letters (Always upright and unmirrored)
      ctx.save();
      ctx.scale(this.facing, 1);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      for (let k = 0; k < 3; k++) {
        const kx = (k - 1) * 16 * this.facing;
        const ky = -42 + Math.sin(this.animTime * 4 + k) * 3;
        ctx.fillText(['W', 'O', 'R', 'D'][k], kx, ky);
      }
      ctx.restore();

      ctx.restore();

      // Apple Pill Style Boss Health Bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(renderX - 36, renderY - 54, 72, 8, 4);
      ctx.fill();

      const hpPercent = Math.max(0, this.hp / this.maxHp);
      const hpGrad = ctx.createLinearGradient(renderX - 36, 0, renderX + 36, 0);
      hpGrad.addColorStop(0, '#f43f5e');
      hpGrad.addColorStop(1, '#fbbf24');
      ctx.fillStyle = hpGrad;
      ctx.beginPath();
      ctx.roundRect(renderX - 36, renderY - 54, 72 * hpPercent, 8, 4);
      ctx.fill();
      return;
    }

    ctx.restore();
  }
}

class Collectible {
  constructor(x, y, type = 'star') {
    this.x = x; this.y = y; this.baseY = y;
    this.type = type; this.collected = false;
    this.radius = 15; this.animTime = Math.random() * 5;
  }

  update(dt, game) {
    if (this.collected) return;
    this.animTime += dt;
    this.y = this.baseY + Math.sin(this.animTime * 3.5) * 5;

    const pBounds = game.player.getBounds();
    if (circlesIntersect(this, { x: pBounds.x + pBounds.width / 2, y: pBounds.y + pBounds.height / 2, radius: pBounds.width / 2 })) {
      this.collected = true;
      if (this.type === 'star') {
        game.collectStar(this.x, this.y);
      } else if (this.type === 'chest') {
        game.openWordChallenge();
      } else {
        game.player.applyPowerup(this.type);
        game.particles.burst(this.x, this.y, 16, ['#ffbe0b', '#0071e3', '#fff']);
      }
    }
  }

  draw(ctx, camX) {
    if (this.collected) return;
    const renderX = this.x - camX;

    ctx.save();
    ctx.translate(renderX, this.y);

    if (this.type === 'star') {
      ctx.save();
      ctx.rotate(this.animTime * 1.5);
      drawFacetedStar(ctx, 0, 0, 16, 7.5);
      ctx.restore();
    } else if (this.type === 'chest') {
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(-14, -8, 28, 18);
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-14, -8, 28, 18);
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(-4, -3, 8, 8);
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.arc(0, -8, 14, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', 0, -10);
    } else if (this.type === 'heal') {
      const grad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 14);
      grad.addColorStop(0, '#ff5252'); grad.addColorStop(0.7, '#d50000'); grad.addColorStop(1, '#8b0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.bezierCurveTo(-14, 2, -14, -12, -3, -12);
      ctx.bezierCurveTo(0, -12, 0, -8, 0, -8);
      ctx.bezierCurveTo(0, -8, 0, -12, 3, -12);
      ctx.bezierCurveTo(14, -12, 14, 2, 0, 12);
      ctx.fill();
    } else if (this.type === 'shield') {
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 113, 227, 0.28)'; ctx.fill();
      ctx.strokeStyle = '#00f5d4'; ctx.lineWidth = 2; ctx.stroke();
    } else if (this.type === 'spread') {
      ctx.fillStyle = '#ff9500';
      for (let angle of [-0.4, 0, 0.4]) {
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-10, -3); ctx.lineTo(6, -3); ctx.lineTo(6, -7); ctx.lineTo(12, 0); ctx.lineTo(6, 7); ctx.lineTo(6, 3); ctx.lineTo(-10, 3);
        ctx.fill();
        ctx.restore();
      }
    } else if (this.type === 'speed') {
      ctx.fillStyle = '#ffbe0b';
      ctx.beginPath();
      ctx.moveTo(2, -14); ctx.lineTo(-10, 0); ctx.lineTo(-2, 0); ctx.lineTo(-6, 14); ctx.lineTo(8, -2); ctx.lineTo(0, -2); ctx.fill();
    } else if (this.type === 'magnet') {
      ctx.lineWidth = 5; ctx.strokeStyle = '#d4d4d8';
      ctx.beginPath(); ctx.arc(0, -2, 9, Math.PI, 0); ctx.lineTo(9, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -2, 9, Math.PI, 0); ctx.lineTo(-9, 7); ctx.stroke();
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-11.5, 7, 5, 5);
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(6.5, 7, 5, 5);
    }

    ctx.restore();
  }
}

/* ==========================================================================
   VOLUMETRIC ACTION PLATFORMER GAME ENGINE
   ========================================================================== */
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = window.sound;

    this.state = 'START';
    this.score = 0;
    this.currentStageIndex = 0;
    this.starsCollected = 0;
    this.wordsMastered = 0;

    this.cameraX = 0;
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;

    this.player = new WordiPlayer(this);
    this.particles = new ParticleSystem(400);
    this.platforms = [];
    this.enemies = [];
    this.projectiles = [];
    this.collectibles = [];
    this.bridges = [];

    this.ambientParticles = [];
    this.initAmbientParticles();

    this.lastTime = performance.now();

    this.input = { left: false, right: false, up: false, down: false, jumpPressed: false, shootPressed: false };

    this.activeQuiz = null;
    this.quizTimer = 0;
    this.quizMaxTime = 10;

    this.dom = {
      viewport: document.getElementById('gameViewport'),
      hudScore: document.getElementById('hudScore'),
      hudHighScore: document.getElementById('hudHighScore'),
      hudStarCount: document.getElementById('hudStarCount'),
      hudHearts: document.getElementById('hudHearts'),
      hudStageBadge: document.getElementById('hudStageBadge'),
      hudPowerupBar: document.getElementById('hudPowerupBar'),
      modalStart: document.getElementById('modalStart'),
      modalWordChallenge: document.getElementById('modalWordChallenge'),
      modalPause: document.getElementById('modalPause'),
      modalStageClear: document.getElementById('modalStageClear'),
      modalGameOver: document.getElementById('modalGameOver'),
      quizQuestionText: document.getElementById('quizQuestionText'),
      quizOptionsGrid: document.getElementById('quizOptionsGrid'),
      quizTimerFill: document.getElementById('quizTimerFill'),
      goFinalScore: document.getElementById('goFinalScore'),
      goHighScore: document.getElementById('goHighScore'),
      goStage: document.getElementById('goStage'),
      goWords: document.getElementById('goWords'),
    };

    this.initHighDPI();
    this.bindInputs();
    this.loadStage(0);

    requestAnimationFrame((t) => this.loop(t));
  }

  initHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = CONFIG.CANVAS_WIDTH * dpr;
    this.canvas.height = CONFIG.CANVAS_HEIGHT * dpr;
    this.ctx.scale(dpr, dpr);
  }

  initAmbientParticles() {
    this.ambientParticles = [];
    for (let i = 0; i < 35; i++) {
      this.ambientParticles.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        speedX: -15 - Math.random() * 25,
        speedY: (Math.random() - 0.5) * 15,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.5,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  loadLevel(levelId) {
    const config = LEVEL_CONFIGS[levelId] || LEVEL_CONFIGS['1-1'];
    this.currentLevelId = config.id;
    progress.activeLevelId = config.id;
    this.currentStageIndex = ALL_LEVEL_IDS.indexOf(config.id);
    if (this.currentStageIndex === -1) this.currentStageIndex = 0;

    const stageTheme = STAGES[config.themeIndex % STAGES.length];
    this.currentStageData = stageTheme;
    this.starsCollected = 0;

    this.platforms = [];
    this.bridges = [];
    this.enemies = [];
    this.projectiles = [];
    this.collectibles = [];
    this.particles.clear();

    const pStart = config.playerStart || { x: 100, y: 340 };
    this.player.reset(pStart.x, pStart.y);
    this.cameraX = 0;

    // Build the unique handcrafted level blueprint
    config.build(this);

    this.dom.hudStageBadge.textContent = config.name;
    progress.updateDifficultyUI();
    this.updateHeartsUI();
    this.updateHUD();
  }

  loadStage(stageIndex) {
    const levelId = ALL_LEVEL_IDS[stageIndex % ALL_LEVEL_IDS.length];
    this.loadLevel(levelId);
  }

  applyDifficulty(diff) {
    const cfg = DIFFICULTY_CONFIG[diff] || DIFFICULTY_CONFIG.normal;
    if (this.player) {
      const oldMax = this.player.maxHealth;
      this.player.maxHealth = cfg.maxHp;
      if (cfg.maxHp > oldMax && this.player.health > 0) {
        this.player.health = Math.min(cfg.maxHp, this.player.health + (cfg.maxHp - oldMax));
      } else {
        this.player.health = Math.min(this.player.health, cfg.maxHp);
      }
      this.updateHeartsUI();
      this.updateHUD();
    }
  }

  spawnProjectile(x, y, vx, vy) {
    this.projectiles.push(new Projectile(x, y, vx, vy));
  }

  spawnBossProjectile(x, y, vx, vy) {
    const p = new Projectile(x, y, vx, vy);
    p.isHostile = true;
    this.projectiles.push(p);
  }

  spawnCollectible(x, y, type) {
    this.collectibles.push(new Collectible(x, y, type));
  }

  collectStar(x, y) {
    this.starsCollected++;
    this.addScore(100);
    progress.addStars(1);
    this.sound.playPickupStar();
    this.particles.burst(x, y, 14, ['#ffbe0b', '#fff']);
    this.updateHUD();

    if (this.starsCollected >= CONFIG.STARS_PER_STAGE) {
      this.stageClear();
    }
  }

  addScore(points) {
    const diff = DIFFICULTY_CONFIG[progress.difficulty] || DIFFICULTY_CONFIG.normal;
    const multiplied = Math.round(points * diff.scoreMultiplier);
    this.score += multiplied;
    if (this.score > progress.highScore) {
      progress.highScore = this.score;
      progress.save();
    }
    this.updateHUD();
  }

  triggerScreenShake(intensity = 10) {
    this.screenShakeIntensity = intensity;
    this.screenShakeTime = 0.25;
    this.dom.viewport.classList.add('screen-shake');
    setTimeout(() => this.dom.viewport.classList.remove('screen-shake'), 250);
  }

  openWordChallenge() {
    this.state = 'WORD_CHALLENGE';
    this.sound.playPowerup();

    const q = WORD_CHALLENGES[Math.floor(Math.random() * WORD_CHALLENGES.length)];
    const diff = DIFFICULTY_CONFIG[progress.difficulty] || DIFFICULTY_CONFIG.normal;
    this.activeQuiz = q;
    this.quizMaxTime = diff.quizTime;
    this.quizTimer = this.quizMaxTime;

    this.dom.quizQuestionText.textContent = q.question;
    drawClueIllustration('quizClueCanvas', q.id);

    this.dom.quizOptionsGrid.innerHTML = '';
    const shuffledChoices = [...q.choices].sort(() => Math.random() - 0.5);

    shuffledChoices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice;
      btn.onclick = () => this.handleQuizAnswer(choice, btn);
      this.dom.quizOptionsGrid.appendChild(btn);
    });

    this.dom.modalWordChallenge.classList.add('active');
  }

  handleQuizAnswer(choice, btnElement) {
    const isCorrect = choice === this.activeQuiz.answer;
    const allButtons = this.dom.quizOptionsGrid.querySelectorAll('.choice-btn');
    allButtons.forEach(b => (b.disabled = true));

    if (isCorrect) {
      btnElement.classList.add('correct');
      this.sound.playCorrectWord();
      this.addScore(500);
      progress.addCoins(15);
      this.wordsMastered++;
      this.player.applyPowerup('shield', 15);
      this.player.applyPowerup('spread', 15);

      setTimeout(() => {
        this.dom.modalWordChallenge.classList.remove('active');
        this.state = 'PLAYING';
      }, 750);
    } else {
      btnElement.classList.add('wrong');
      this.sound.playWrongWord();
      allButtons.forEach(b => {
        if (b.textContent === this.activeQuiz.answer) b.classList.add('correct');
      });

      setTimeout(() => {
        this.dom.modalWordChallenge.classList.remove('active');
        this.state = 'PLAYING';
      }, 1000);
    }
  }

  startGame() {
    this.sound.init();
    this.sound.startMusic();
    this.dom.modalStart.classList.remove('active');
    this.dom.modalGameOver.classList.remove('active');
    this.dom.modalPause.classList.remove('active');
    this.dom.modalStageClear.classList.remove('active');

    this.score = 0;
    this.wordsMastered = 0;
    this.loadLevel(this.currentLevelId || '1-1');
    this.state = 'PLAYING';
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.dom.modalPause.classList.add('active');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.dom.modalPause.classList.remove('active');
    }
  }

  stageClear() {
    this.state = 'STAGE_CLEAR';
    this.sound.playStageClear();
    this.addScore(1000);
    progress.addStars(3);
    progress.addCoins(50);
    progress.unlockNextLevel(progress.activeLevelId);

    this.particles.createConfetti(CONFIG.CANVAS_WIDTH / 2 + this.cameraX, CONFIG.CANVAS_HEIGHT / 2, 70);
    this.dom.modalStageClear.classList.add('active');
  }

  nextStage() {
    this.dom.modalStageClear.classList.remove('active');
    const curIdx = ALL_LEVEL_IDS.indexOf(this.currentLevelId);
    const nextIdx = (curIdx + 1) % ALL_LEVEL_IDS.length;
    this.loadLevel(ALL_LEVEL_IDS[nextIdx]);
    this.state = 'PLAYING';
  }

  gameOver() {
    this.state = 'GAME_OVER';
    this.sound.playGameOver();

    this.dom.goFinalScore.textContent = this.score;
    this.dom.goHighScore.textContent = progress.highScore;
    this.dom.goStage.textContent = (LEVEL_CONFIGS[this.currentLevelId] ? LEVEL_CONFIGS[this.currentLevelId].name : STAGES[this.currentStageIndex].name);
    this.dom.goWords.textContent = this.wordsMastered;

    this.dom.modalGameOver.classList.add('active');
  }

  restart() {
    this.dom.modalGameOver.classList.remove('active');
    this.dom.modalPause.classList.remove('active');
    this.dom.modalStageClear.classList.remove('active');
    this.score = 0;
    this.loadLevel(this.currentLevelId || '1-1');
    this.state = 'PLAYING';
  }

  updateHUD() {
    this.dom.hudScore.textContent = this.score;
    this.dom.hudHighScore.textContent = progress.highScore;
    this.dom.hudStarCount.textContent = this.starsCollected;
    this.updateHeartsUI();
    this.updatePowerupsUI();
  }

  updateHeartsUI() {
    let heartsHtml = '';
    const heartSvgPath = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
    for (let i = 0; i < this.player.maxHealth; i++) {
      if (i < this.player.health) {
        heartsHtml += `<svg class="hud-heart" viewBox="0 0 24 24"><path d="${heartSvgPath}"/></svg>`;
      } else {
        heartsHtml += `<svg class="hud-heart lost" viewBox="0 0 24 24"><path d="${heartSvgPath}"/></svg>`;
      }
    }
    this.dom.hudHearts.innerHTML = heartsHtml;
  }

  updatePowerupsUI() {
    let html = '';
    const shieldSvg = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>';
    const spreadSvg = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/></svg>';
    const speedSvg = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>';
    const magnetSvg = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M3 7v6c0 4.97 4.03 9 9 9s9-4.03 9-9V7h-4v6c0 2.76-2.24 5-5 5s-5-2.24-5-5V7H3z"/></svg>';

    if (this.player.shieldTimer > 0) html += `<div class="buff">${shieldSvg} SHIELD ${Math.ceil(this.player.shieldTimer)}s</div>`;
    if (this.player.spreadTimer > 0) html += `<div class="buff">${spreadSvg} TRIPLE ${Math.ceil(this.player.spreadTimer)}s</div>`;
    if (this.player.speedTimer > 0) html += `<div class="buff">${speedSvg} SPEED ${Math.ceil(this.player.speedTimer)}s</div>`;
    if (this.player.magnetTimer > 0) html += `<div class="buff">${magnetSvg} MAGNET ${Math.ceil(this.player.magnetTimer)}s</div>`;
    this.dom.hudPowerupBar.innerHTML = html;
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      this.sound.resume();

      if (e.code === 'KeyA' || e.key === 'ArrowLeft') this.input.left = true;
      if (e.code === 'KeyD' || e.key === 'ArrowRight') this.input.right = true;
      if (e.code === 'KeyW' || e.key === 'ArrowUp' || e.code === 'Space') {
        if (!this.input.up) this.input.jumpPressed = true;
        this.input.up = true;
      }
      if (e.code === 'KeyS' || e.key === 'ArrowDown') this.input.down = true;

      if (e.code === 'KeyJ') this.input.shootPressed = true;
      if (e.code === 'KeyR') this.restart();
      if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause();
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA' || e.key === 'ArrowLeft') this.input.left = false;
      if (e.code === 'KeyD' || e.key === 'ArrowRight') this.input.right = false;
      if (e.code === 'KeyW' || e.key === 'ArrowUp' || e.code === 'Space') this.input.up = false;
      if (e.code === 'KeyS' || e.key === 'ArrowDown') this.input.down = false;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.state === 'PLAYING') this.input.shootPressed = true;
    });

    const touchLeft = document.getElementById('btnTouchLeft');
    const touchRight = document.getElementById('btnTouchRight');
    const touchJump = document.getElementById('btnTouchJump');
    const touchBark = document.getElementById('btnTouchBark');

    const bindTouch = (elem, onStart, onEnd) => {
      if (!elem) return;
      elem.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(); }, { passive: false });
      elem.addEventListener('touchend', (e) => { e.preventDefault(); onEnd(); }, { passive: false });
    };

    bindTouch(touchLeft, () => { this.input.left = true; }, () => { this.input.left = false; });
    bindTouch(touchRight, () => { this.input.right = true; }, () => { this.input.right = false; });
    bindTouch(touchJump, () => { this.input.jumpPressed = true; this.input.up = true; }, () => { this.input.up = false; });
    bindTouch(touchBark, () => { this.input.shootPressed = true; }, () => {});

    const setClick = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.onclick = fn;
    };

    setClick('btnStartGame', () => this.startGame());
    setClick('btnPause', () => this.togglePause());
    setClick('btnResume', () => this.togglePause());
    setClick('btnRestartFromPause', () => this.restart());
    setClick('btnNextStage', () => this.nextStage());
    setClick('btnRestartGameOver', () => this.restart());
  }

  loop(currentTime) {
    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    const dt = Math.min(rawDt, 0.05);

    if (this.state === 'PLAYING') {
      this.update(dt);
    } else if (this.state === 'WORD_CHALLENGE') {
      this.quizTimer -= dt;
      const fillPct = Math.max(0, (this.quizTimer / this.quizMaxTime) * 100);
      this.dom.quizTimerFill.style.width = fillPct + '%';
      if (this.quizTimer <= 0) {
        this.dom.modalWordChallenge.classList.remove('active');
        this.state = 'PLAYING';
      }
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    const targetCamX = this.player.x - CONFIG.CANVAS_WIDTH * 0.35;
    this.cameraX += (targetCamX - this.cameraX) * 0.1;
    if (this.cameraX < 0) this.cameraX = 0;

    if (this.screenShakeTime > 0) this.screenShakeTime -= dt;

    // Update dynamic platforms (moving, crumbling, quantum)
    for (const plat of this.platforms) {
      if (plat.isMoving) {
        if (plat.vx) {
          plat.x += plat.vx * dt;
          if (plat.x > plat.maxX) { plat.x = plat.maxX; plat.vx = -Math.abs(plat.vx); }
          else if (plat.x < plat.minX) { plat.x = plat.minX; plat.vx = Math.abs(plat.vx); }
        }
        if (plat.vy) {
          plat.y += plat.vy * dt;
          if (plat.y > plat.maxY) { plat.y = plat.maxY; plat.vy = -Math.abs(plat.vy); }
          else if (plat.y < plat.minY) { plat.y = plat.minY; plat.vy = Math.abs(plat.vy); }
        }
        if (this.player.standingPlatform === plat) {
          this.player.x += (plat.vx || 0) * dt;
          this.player.y += (plat.vy || 0) * dt;
        }
      }

      if (plat.isCrumbling) {
        if (plat.crumbling && !plat.fallen) {
          plat.crumbleTimer -= dt;
          plat.shakeX = (Math.random() - 0.5) * 5;
          if (plat.crumbleTimer <= 0) {
            plat.fallen = true;
            plat.respawnTimer = 3.5;
            this.particles.burst(plat.x + plat.width / 2, plat.y + plat.height / 2, 14, ['#8d6e63', '#d7ccc8']);
            this.sound.playEnemyDefeat();
          }
        } else if (plat.fallen) {
          plat.respawnTimer -= dt;
          if (plat.respawnTimer <= 0) {
            plat.fallen = false;
            plat.crumbling = false;
            plat.crumbleTimer = 0.8;
            plat.shakeX = 0;
            this.particles.burst(plat.x + plat.width / 2, plat.y, 8, ['#a5d6a7', '#fff']);
          }
        }
      }

      if (plat.isQuantum) {
        plat.phaseTimer = (plat.phaseTimer || 0) + dt;
        const cycle = plat.phaseTimer % 4.0;
        if (cycle < 2.4) {
          plat.isSolid = true;
          plat.alpha = 1.0;
        } else if (cycle < 3.0) {
          plat.isSolid = true;
          plat.alpha = Math.sin(plat.phaseTimer * 20) > 0 ? 0.9 : 0.3;
        } else {
          plat.isSolid = false;
          plat.alpha = 0.15;
        }
      }
    }

    this.player.update(dt, this.input);

    for (const proj of this.projectiles) proj.update(dt, this);
    this.projectiles = this.projectiles.filter(p => p.active);

    for (const enemy of this.enemies) enemy.update(dt, this);
    this.enemies = this.enemies.filter(e => e.active);

    for (const item of this.collectibles) item.update(dt, this);

    this.particles.update(dt);

    for (const p of this.ambientParticles) {
      p.x += p.speedX * dt;
      p.wobble += dt * 2;
      p.y += p.speedY * dt + Math.sin(p.wobble) * 0.5;
      if (p.x < 0) p.x = CONFIG.CANVAS_WIDTH + 10;
      if (p.y < 0) p.y = CONFIG.CANVAS_HEIGHT;
      if (p.y > CONFIG.CANVAS_HEIGHT) p.y = 0;
    }
  }

  render() {
    const ctx = this.ctx;
    const stage = this.currentStageData || STAGES[this.currentStageIndex % STAGES.length];

    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 1. Sky & Sun
    this.drawSky(ctx, stage);

    // 2. Far Mountains
    this.drawFarMountains(ctx, stage);

    // 3. Midground Scenery (Windmills/Castles)
    this.drawMidground(ctx, stage);

    // 4. Volumetric Platforms
    for (const plat of this.platforms) this.drawPlatform(ctx, plat, stage);

    // 5. Suspension Bridges
    for (const bridge of this.bridges) this.drawBridge(ctx, bridge, stage);

    // 6. Collectibles
    for (const item of this.collectibles) item.draw(ctx, this.cameraX);

    // 7. Enemies
    for (const enemy of this.enemies) enemy.draw(ctx, this.cameraX);

    // 8. Projectiles
    for (const proj of this.projectiles) proj.draw(ctx, this.cameraX);

    // 9. Player
    this.player.draw(ctx, this.cameraX);

    // 10. Particles
    this.particles.draw(ctx, this.cameraX);

    // 11. Ambient Particles
    this.drawAmbient(ctx, stage);
  }

  drawSky(ctx, stage) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    skyGrad.addColorStop(0, stage.skyTop);
    skyGrad.addColorStop(0.5, stage.skyMid);
    skyGrad.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Sun with corona
    const sunX = CONFIG.CANVAS_WIDTH * 0.78;
    const sunY = 90;
    const corona = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 64);
    corona.addColorStop(0, stage.sunColor);
    corona.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    corona.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 64, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = stage.sunColor;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFarMountains(ctx, stage) {
    ctx.fillStyle = stage.mountainBack;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.CANVAS_HEIGHT);
    const mStep = 240;
    const mOffset = (this.cameraX * 0.16) % mStep;
    for (let x = -mStep; x <= CONFIG.CANVAS_WIDTH + mStep; x += mStep) {
      ctx.lineTo(x - mOffset + 120, 230);
      ctx.lineTo(x - mOffset + mStep, 340);
    }
    ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  drawMidground(ctx, stage) {
    const camOffset = this.cameraX * 0.45;
    const spacing = 540;
    const startIdx = Math.floor((camOffset - 300) / spacing);

    for (let i = startIdx; i <= startIdx + 3; i++) {
      const sceneX = i * spacing - camOffset + 80;

      if (stage.id === 1) {
        // Stage 1: Dutch Windmills & Country Cottages
        ctx.fillStyle = '#b0bec5';
        ctx.beginPath();
        ctx.moveTo(sceneX - 18, 410); ctx.lineTo(sceneX - 12, 360); ctx.lineTo(sceneX + 12, 360); ctx.lineTo(sceneX + 18, 410);
        ctx.fill();

        // Rotating sails
        const rot = performance.now() * 0.0012;
        ctx.save();
        ctx.translate(sceneX, 358);
        ctx.rotate(rot);
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#fff9c4';
        for (let a = 0; a < 4; a++) {
          ctx.save();
          ctx.rotate((a * Math.PI) / 2);
          ctx.strokeRect(0, -3, 30, 6);
          ctx.fillRect(8, -10, 20, 7);
          ctx.restore();
        }
        ctx.restore();
      } else if (stage.id === 2) {
        // Stage 2: Terracotta Village Houses & Arched Chimneys
        ctx.fillStyle = '#d84315';
        ctx.beginPath();
        ctx.moveTo(sceneX - 35, 415); ctx.lineTo(sceneX, 365); ctx.lineTo(sceneX + 35, 415);
        ctx.fill();
        ctx.fillStyle = '#ffcc80';
        ctx.fillRect(sceneX - 28, 415, 56, 30);
        // Chimney
        ctx.fillStyle = '#bf360c';
        ctx.fillRect(sceneX + 12, 360, 10, 22);
      } else if (stage.id === 3) {
        // Stage 3: Alpine Mountain Stone Fortress & Turrets
        ctx.fillStyle = '#455a64';
        ctx.fillRect(sceneX - 25, 340, 50, 70);
        ctx.fillStyle = '#263238';
        // Turret battlements
        for (let b = 0; b < 3; b++) {
          ctx.fillRect(sceneX - 25 + b * 18, 330, 14, 12);
        }
        // Royal Banner
        ctx.fillStyle = '#e53935';
        ctx.fillRect(sceneX - 4, 310, 8, 20);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.strokeRect(sceneX - 4, 310, 8, 20);
      } else if (stage.id === 4) {
        // Stage 4: Cyberpunk Metropolis Skyscrapers & Neon Antennas
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(sceneX - 30, 310, 60, 100);
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(sceneX - 30, 310, 60, 100);
        // Illuminated cyber windows
        ctx.fillStyle = '#00f5d4';
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillRect(sceneX - 22 + c * 16, 325 + r * 18, 8, 10);
          }
        }
        // Antenna Spire with pulsing beacon
        ctx.strokeStyle = '#ec4899';
        ctx.beginPath();
        ctx.moveTo(sceneX, 310); ctx.lineTo(sceneX, 260); ctx.stroke();
        ctx.fillStyle = Math.sin(performance.now() * 0.008) > 0 ? '#ec4899' : '#fff';
        ctx.beginPath();
        ctx.arc(sceneX, 260, 4, 0, Math.PI * 2); ctx.fill();
      } else if (stage.id === 5) {
        // Stage 5: Neoclassical Star Palace Marble Colonnade
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(sceneX - 60, 280, 120, 130);
        // Fluted Marble Pillars
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(sceneX - 50, 300, 14, 110);
        ctx.fillRect(sceneX - 10, 300, 14, 110);
        ctx.fillRect(sceneX + 30, 300, 14, 110);
        // Pediment Roof
        ctx.fillStyle = '#ffbe0b';
        ctx.beginPath();
        ctx.moveTo(sceneX - 60, 300); ctx.lineTo(sceneX, 260); ctx.lineTo(sceneX + 60, 300);
        ctx.closePath();
        ctx.fill();
        // Floating celestial star
        ctx.save();
        ctx.translate(sceneX, 230);
        ctx.rotate(performance.now() * 0.001);
        drawFacetedStar(ctx, 0, 0, 14, 6);
        ctx.restore();
      }
    }
  }

  drawPlatform(ctx, plat, stage) {
    const renderX = plat.x - this.cameraX + (plat.shakeX || 0);
    if (renderX + plat.width < -80 || renderX > CONFIG.CANVAS_WIDTH + 80) return;
    if (plat.fallen) return;

    ctx.save();
    if (plat.isQuantum && plat.alpha !== undefined) {
      ctx.globalAlpha = plat.alpha;
    }

    // 1. Trampoline Bounce Pad
    if (plat.isBouncePad) {
      const w = plat.width;
      const h = plat.height;
      // Spring coils underneath
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      for (let sx = 14; sx <= w - 14; sx += 18) {
        ctx.beginPath();
        ctx.moveTo(renderX + sx - 5, plat.y + h + 8);
        ctx.lineTo(renderX + sx + 5, plat.y + h + 4);
        ctx.lineTo(renderX + sx - 5, plat.y + h);
        ctx.stroke();
      }
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y + h - 4, w, 8, 4);
      ctx.fill();

      const bounceGrad = ctx.createLinearGradient(renderX, plat.y, renderX, plat.y + h);
      bounceGrad.addColorStop(0, '#00f5d4');
      bounceGrad.addColorStop(1, '#00bbf9');
      ctx.fillStyle = bounceGrad;
      ctx.beginPath();
      ctx.roundRect(renderX + 2, plat.y, w - 4, h, 6);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let cx = renderX + 16; cx <= renderX + w - 16; cx += 18) {
        ctx.beginPath();
        ctx.moveTo(cx - 4, plat.y + 12);
        ctx.lineTo(cx, plat.y + 6);
        ctx.lineTo(cx + 4, plat.y + 12);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // 2. Floor Spike Hazard Traps
    if (plat.isHazard) {
      const w = plat.width;
      const h = plat.height;
      ctx.fillStyle = '#475569';
      ctx.fillRect(renderX, plat.y + h - 6, w, 6);

      const spikeWidth = 14;
      const numSpikes = Math.floor(w / spikeWidth);
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.2;

      for (let i = 0; i < numSpikes; i++) {
        const sx = renderX + i * spikeWidth;
        ctx.beginPath();
        ctx.moveTo(sx, plat.y + h - 6);
        ctx.lineTo(sx + spikeWidth / 2, plat.y);
        ctx.lineTo(sx + spikeWidth, plat.y + h - 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // 3. Frosty Slippery Ice Platform
    if (plat.isIce) {
      const w = plat.width;
      const h = plat.height;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y + 4, w, h, 8);
      ctx.fill();

      // Translucent glassy cyan gradient
      const iceGrad = ctx.createLinearGradient(renderX, plat.y, renderX, plat.y + h);
      iceGrad.addColorStop(0, '#e0f2fe');
      iceGrad.addColorStop(0.3, '#38bdf8');
      iceGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = iceGrad;
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y, w, h, 6);
      ctx.fill();

      // Hanging Icicles
      ctx.fillStyle = '#bae6fd';
      for (let ix = 8; ix < w - 8; ix += 16) {
        ctx.beginPath();
        ctx.moveTo(renderX + ix, plat.y + h);
        ctx.lineTo(renderX + ix + 4, plat.y + h + 10 + (ix % 3) * 4);
        ctx.lineTo(renderX + ix + 8, plat.y + h);
        ctx.closePath();
        ctx.fill();
      }

      // Glass shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(renderX + 6, plat.y + 2, w - 12, 3);
      ctx.restore();
      return;
    }

    // 4. Moving Wooden Merchant Cart
    if (plat.isMoving && stage.id === 2) {
      const w = plat.width;
      const h = plat.height;
      // Guide rail behind
      if (plat.minX !== undefined && plat.maxX !== undefined) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(plat.minX - this.cameraX, plat.y + h / 2);
        ctx.lineTo(plat.maxX + w - this.cameraX, plat.y + h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Wooden Wagon Wheels
      ctx.fillStyle = '#5d4037';
      ctx.strokeStyle = '#d7ccc8';
      ctx.lineWidth = 2;
      [renderX + 24, renderX + w - 24].forEach(wx => {
        ctx.beginPath();
        ctx.arc(wx, plat.y + h + 6, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Hub
        ctx.fillStyle = '#ffb74d';
        ctx.beginPath();
        ctx.arc(wx, plat.y + h + 6, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Timber Cart Body
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y, w, h, 4);
      ctx.fill();

      // Brass Corner Plates
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(renderX + 2, plat.y + 2, 8, 8);
      ctx.fillRect(renderX + w - 10, plat.y + 2, 8, 8);

      // Planks
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 1.5;
      for (let px = 20; px < w; px += 24) {
        ctx.beginPath();
        ctx.moveTo(renderX + px, plat.y);
        ctx.lineTo(renderX + px, plat.y + h);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // 5. Moving Cyber Monorail Car
    if (plat.isMoving && stage.id === 4) {
      const w = plat.width;
      const h = plat.height;
      // Monorail Magnetic Track
      if (plat.minX !== undefined && plat.maxX !== undefined) {
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(plat.minX - this.cameraX, plat.y + h + 6);
        ctx.lineTo(plat.maxX + w - this.cameraX, plat.y + h + 6);
        ctx.stroke();
      }

      // Cyber Train Chassis
      const trainGrad = ctx.createLinearGradient(renderX, plat.y, renderX, plat.y + h);
      trainGrad.addColorStop(0, '#00f5d4');
      trainGrad.addColorStop(0.5, '#7928ca');
      trainGrad.addColorStop(1, '#10002b');
      ctx.fillStyle = trainGrad;
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y, w, h, 6);
      ctx.fill();

      // Glowing Cockpit Windows
      ctx.fillStyle = '#fff';
      ctx.fillRect(renderX + 16, plat.y + 4, w - 32, 6);

      // Jet Thrusters
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(renderX + 10, plat.y + h, 14, 4);
      ctx.fillRect(renderX + w - 24, plat.y + h, 14, 4);
      ctx.restore();
      return;
    }

    // 6. Quantum Holographic Grid Block
    if (plat.isQuantum) {
      const w = plat.width;
      const h = plat.height;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y, w, h, 6);
      ctx.fill();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.strokeRect(renderX, plat.y, w, h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let gx = 12; gx < w; gx += 16) {
        ctx.beginPath();
        ctx.moveTo(renderX + gx, plat.y);
        ctx.lineTo(renderX + gx, plat.y + h);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // 7. Crumbling Wooden Planks
    if (plat.isCrumbling) {
      const w = plat.width;
      const h = plat.height;
      ctx.fillStyle = plat.crumbling ? '#b45309' : '#78350f';
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y, w, h, 4);
      ctx.fill();

      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(renderX + 20, plat.y + 2);
      ctx.lineTo(renderX + 28, plat.y + h - 2);
      ctx.moveTo(renderX + w - 30, plat.y + 4);
      ctx.lineTo(renderX + w - 24, plat.y + h - 4);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 8. Standard One-Way Ledges
    if (plat.isOneWay) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y + 4, plat.width, plat.height, 8);
      ctx.fill();

      ctx.fillStyle = stage.dirtDark;
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y + 6, plat.width, plat.height - 6, [0, 0, 8, 8]);
      ctx.fill();

      ctx.fillStyle = stage.grassTop;
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y, plat.width, 7, [8, 8, 0, 0]);
      ctx.fill();
    } else {
      // 9. Standard Volumetric Base Island
      const w = plat.width;
      const h = plat.height;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(renderX + w / 2, plat.y + h + 10, w * 0.45, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(renderX, plat.y + 16);
      ctx.lineTo(renderX + w, plat.y + 16);
      ctx.lineTo(renderX + w - 16, plat.y + h - 20);
      ctx.lineTo(renderX + w * 0.65, plat.y + h);
      ctx.lineTo(renderX + w * 0.35, plat.y + h + 8);
      ctx.lineTo(renderX + 16, plat.y + h - 18);
      ctx.closePath();

      ctx.fillStyle = stage.dirtLight;
      ctx.fill();

      ctx.fillStyle = stage.dirtDark;
      ctx.fillRect(renderX + 10, plat.y + 36, w - 20, 16);
      ctx.fillRect(renderX + 18, plat.y + 72, w - 36, 18);

      ctx.strokeStyle = stage.grassBevel;
      ctx.lineWidth = 2.5;
      for (let vx = 28; vx < w - 28; vx += 44) {
        ctx.beginPath();
        ctx.moveTo(renderX + vx, plat.y + 20);
        ctx.quadraticCurveTo(renderX + vx - 4, plat.y + 40, renderX + vx + 2, plat.y + 52);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = stage.grassBevel;
      ctx.fillRect(renderX, plat.y + 14, w, 6);

      ctx.fillStyle = stage.grassTop;
      ctx.beginPath();
      ctx.roundRect(renderX, plat.y, w, 15, [6, 6, 0, 0]);
      ctx.fill();
    }
    ctx.restore();
  }

  drawBridge(ctx, bridge, stage) {
    const renderX = bridge.x - this.cameraX;
    if (renderX + bridge.w < -20 || renderX > CONFIG.CANVAS_WIDTH + 20) return;

    const sag = 12;
    const planks = 10;

    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(renderX, bridge.y - 14);
    ctx.quadraticCurveTo(renderX + bridge.w / 2, bridge.y - 14 + sag, renderX + bridge.w, bridge.targetY - 14);
    ctx.stroke();

    for (let i = 0; i < planks; i++) {
      const t = i / (planks - 1);
      const px = renderX + t * bridge.w;
      const py = bridge.y + t * (bridge.targetY - bridge.y) + Math.sin(t * Math.PI) * sag;

      ctx.fillStyle = '#5d4037';
      ctx.fillRect(px - 4, py, 9, 7);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(px - 4, py, 9, 2);
    }
  }

  drawAmbient(ctx, stage) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (const p of this.ambientParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}

/* ==========================================================================
   GEOMETRY HELPER FUNCTIONS
   ========================================================================== */
function rectsIntersect(r1, r2) {
  return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
}

function circlesIntersect(c1, c2) {
  return Math.hypot(c1.x - c2.x, c1.y - c2.y) < (c1.radius + c2.radius);
}

/* ==========================================================================
   OVERWORLD MAP ENGINE (Image 3 Implementation)
   ========================================================================== */
class WorldMapEngine {
  constructor(gameSuite) {
    this.suite = gameSuite;
    this.canvas = document.getElementById('worldMapCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.hoveredNode = null;
    this.selectedNode = null;
    this.animTime = 0;
    this.rafId = null;
    this.lastTick = 0;

    this.domCard = document.getElementById('mapNodeCard');
    this.domTitle = document.getElementById('mapNodeTitle');
    this.domDesc = document.getElementById('mapNodeDesc');
    this.domBtnLaunch = document.getElementById('btnLaunchMapLevel');

    this.initHighDPI();
    this.initEvents();
  }

  initHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = CONFIG.CANVAS_WIDTH * dpr;
    this.canvas.height = CONFIG.CANVAS_HEIGHT * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  startLoop() {
    if (this.rafId) return;
    this.lastTick = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - this.lastTick) / 1000, 0.05);
      this.lastTick = now;
      this.render(dt);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  initEvents() {
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));

    if (this.domBtnLaunch) {
      this.domBtnLaunch.onclick = () => {
        if (this.selectedNode) {
          this.suite.startLevelFromMap(this.selectedNode);
        }
      };
    }
  }

  getNodeUnderCursor(mx, my) {
    for (const island of MAP_ISLANDS) {
      for (const node of island.nodes) {
        const dist = Math.hypot(mx - node.x, my - node.y);
        if (dist <= 22) return node;
      }
    }
    return null;
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
    const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const node = this.getNodeUnderCursor(mx, my);
    if (node !== this.hoveredNode) {
      this.hoveredNode = node;
      this.canvas.style.cursor = node ? 'pointer' : 'default';
      this.render();
    }
  }

  onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
    const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const node = this.getNodeUnderCursor(mx, my);
    if (node) {
      this.selectNode(node);
    }
  }

  selectNode(node) {
    this.selectedNode = node;
    progress.activeLevelId = node.id;
    this.suite.sound.playJump();

    if (this.domTitle) this.domTitle.textContent = node.title;
    const isUnlocked = progress.unlockedLevels.includes(node.id);
    if (this.domDesc) {
      this.domDesc.textContent = isUnlocked ? node.desc : 'Locked Stage - Complete previous levels to unlock';
    }
    if (this.domBtnLaunch) {
      this.domBtnLaunch.disabled = !isUnlocked;
      this.domBtnLaunch.innerHTML = isUnlocked
        ? '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>Play</span>'
        : '<span>Locked</span>';
    }

    if (this.domCard) this.domCard.classList.remove('hidden');
    if (!this.rafId) this.render(0);
  }

  render(dt = 0.016) {
    const ctx = this.ctx;
    this.animTime += dt * 1.15;

    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 1. Dynamic Ocean with Sunlit Caustics & Horizon
    this.drawOcean(ctx);

    // 2. Distant Horizon Mountains & Islands
    this.drawHorizon(ctx);

    // 3. Drifting Fluffy Ambient Clouds
    this.drawClouds(ctx);

    // 4. Rocky Sea Stacks / Islets
    this.drawSeaStacks(ctx);

    // 5. Marine Life & Vessels (Whale & Sailboat)
    this.drawSailboat(ctx, 510, 430);
    this.drawWhale(ctx, 600, 485);

    // 6. Connective Wooden Rope Bridges Between Islands
    this.drawWoodenBridge(ctx, 260, 370, 290, 240); // Isl 1 -> Isl 2
    this.drawWoodenBridge(ctx, 440, 200, 520, 200); // Isl 2 -> Isl 3
    this.drawWoodenBridge(ctx, 690, 220, 770, 270); // Isl 3 -> Isl 4
    this.drawStardustTrail(ctx, 840, 340, 830, 410); // Isl 4 -> Isl 5 (Magical stardust path)

    // 7. Waterfalls Spilling from Islands into Ocean
    this.drawIslandWaterfalls(ctx);

    // 8. Render The 5 Volumetric Floating Islands
    for (const island of MAP_ISLANDS) {
      this.drawMapIsland(ctx, island);
    }

    // 9. Handcrafted Procedural Landmarks for Each Island
    this.drawAllLandmarks(ctx);

    // 10. Clear Island Signboards (Rendered in front of landmarks without obstruction)
    this.drawAllIslandSignboards(ctx);

    // 11. Interactive Stage Nodes & Paths
    this.drawStageNodes(ctx);

    // 11. Animated Illustrated Wordi on Map
    this.drawWordiOnMap(ctx);

    // 12. Storybook Compass Scroll & Top Ribbon Banner
    this.drawMapBadges(ctx);
  }

  drawOcean(ctx) {
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    oceanGrad.addColorStop(0, '#1e88e5');
    oceanGrad.addColorStop(0.24, '#0284c7');
    oceanGrad.addColorStop(0.62, '#0c4a6e');
    oceanGrad.addColorStop(1, '#062038');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Soft atmospheric sunlit horizon sheen
    const horizonGlow = ctx.createRadialGradient(
      CONFIG.CANVAS_WIDTH * 0.54, 110, 20,
      CONFIG.CANVAS_WIDTH * 0.54, 140, 480
    );
    horizonGlow.addColorStop(0, 'rgba(186, 230, 253, 0.28)');
    horizonGlow.addColorStop(0.45, 'rgba(56, 189, 248, 0.08)');
    horizonGlow.addColorStop(1, 'rgba(8, 47, 73, 0)');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Subtle aerial mist separator
    const mistGrad = ctx.createLinearGradient(0, 115, 0, 190);
    mistGrad.addColorStop(0, 'rgba(186, 230, 253, 0.14)');
    mistGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 115, CONFIG.CANVAS_WIDTH, 75);

    // Ambient shimmering ocean ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    for (let r = 0; r < 22; r++) {
      const rx = (r * 74 + Math.sin(this.animTime * 0.9 + r * 1.1) * 18 + this.animTime * 14) % (CONFIG.CANVAS_WIDTH + 80) - 40;
      const ry = 148 + (r * 21) % (CONFIG.CANVAS_HEIGHT - 175);
      const waveW = 24 + (r % 3) * 14;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + waveW * 0.5, ry - 2.5, rx + waveW, ry);
      ctx.stroke();
    }
  }

  drawHorizon(ctx) {
    // Layered misty horizon mountain ranges
    ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
    ctx.beginPath();
    ctx.moveTo(0, 128);
    ctx.quadraticCurveTo(95, 78, 195, 114);
    ctx.quadraticCurveTo(295, 74, 415, 118);
    ctx.quadraticCurveTo(540, 68, 665, 115);
    ctx.quadraticCurveTo(790, 78, 960, 110);
    ctx.lineTo(960, 155);
    ctx.lineTo(0, 155);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(125, 211, 252, 0.14)';
    ctx.beginPath();
    ctx.moveTo(0, 138);
    ctx.quadraticCurveTo(160, 96, 320, 128);
    ctx.quadraticCurveTo(490, 92, 650, 132);
    ctx.quadraticCurveTo(810, 94, 960, 125);
    ctx.lineTo(960, 160);
    ctx.lineTo(0, 160);
    ctx.closePath();
    ctx.fill();
  }

  drawClouds(ctx) {
    const clouds = [
      { bx: 120, y: 70, s: 0.9, speed: 6 },
      { bx: 460, y: 48, s: 1.1, speed: 4.5 },
      { bx: 780, y: 92, s: 0.85, speed: 7 },
      { bx: 300, y: 310, s: 0.7, speed: 5 },
      { bx: 890, y: 390, s: 0.75, speed: 6.2 },
    ];

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (const c of clouds) {
      const cx = (c.bx + this.animTime * c.speed) % (CONFIG.CANVAS_WIDTH + 160) - 80;
      const cy = c.y + Math.sin(this.animTime + c.bx) * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 * c.s, 0, Math.PI * 2);
      ctx.arc(cx + 18 * c.s, cy - 8 * c.s, 16 * c.s, 0, Math.PI * 2);
      ctx.arc(cx + 34 * c.s, cy, 18 * c.s, 0, Math.PI * 2);
      ctx.arc(cx + 16 * c.s, cy + 6 * c.s, 14 * c.s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSeaStacks(ctx) {
    // Rocky sea stacks / islets with mini waterfalls from Image 3
    const stacks = [
      { x: 445, y: 340, w: 32, h: 42, hasCascade: false },
      { x: 420, y: 460, w: 42, h: 56, hasCascade: true },
      { x: 675, y: 380, w: 26, h: 32, hasCascade: false },
      { x: 935, y: 465, w: 30, h: 36, hasCascade: false }
    ];

    for (const st of stacks) {
      // Shadow
      ctx.fillStyle = 'rgba(3, 105, 161, 0.45)';
      ctx.beginPath();
      ctx.ellipse(st.x, st.y + st.h * 0.45, st.w * 0.8, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rock pillar
      const rockGrad = ctx.createLinearGradient(st.x - st.w / 2, st.y, st.x + st.w / 2, st.y);
      rockGrad.addColorStop(0, '#5d4037');
      rockGrad.addColorStop(0.5, '#795548');
      rockGrad.addColorStop(1, '#4e342e');
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.moveTo(st.x - st.w * 0.4, st.y - st.h * 0.4);
      ctx.lineTo(st.x + st.w * 0.4, st.y - st.h * 0.4);
      ctx.lineTo(st.x + st.w * 0.5, st.y + st.h * 0.4);
      ctx.lineTo(st.x - st.w * 0.5, st.y + st.h * 0.4);
      ctx.closePath();
      ctx.fill();

      // Lush grassy cap
      ctx.fillStyle = '#52b788';
      ctx.beginPath();
      ctx.ellipse(st.x, st.y - st.h * 0.4, st.w * 0.45, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mini cascading water if equipped
      if (st.hasCascade) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(st.x - 4, st.y - 4);
        ctx.lineTo(st.x + 3, st.y - 4);
        ctx.lineTo(st.x + 5, st.y + st.h * 0.45);
        ctx.lineTo(st.x - 6, st.y + st.h * 0.45);
        ctx.closePath();
        ctx.fill();

        // Water splash ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(st.x, st.y + st.h * 0.45, 10 + Math.sin(this.animTime * 6) * 3, 3.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  drawSailboat(ctx, x, y) {
    const bob = Math.sin(this.animTime * 2.5) * 3;
    const tilt = Math.cos(this.animTime * 2.5) * 0.04;

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(tilt);

    // Boat shadow
    ctx.fillStyle = 'rgba(2, 44, 34, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden hull
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.lineTo(13, 10);
    ctx.lineTo(-13, 10);
    ctx.closePath();
    ctx.fill();

    // Blue waterline stripe
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-16, 2, 32, 2.5);

    // Mast
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, -28);
    ctx.stroke();

    // Main Sail (large triangle)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(2, -26);
    ctx.lineTo(16, -4);
    ctx.lineTo(2, -4);
    ctx.closePath();
    ctx.fill();

    // Jib Sail (front small triangle)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-2, -22);
    ctx.lineTo(-15, -4);
    ctx.lineTo(-2, -4);
    ctx.closePath();
    ctx.fill();

    // Blue Pennant flag on top
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(7 + Math.sin(this.animTime * 8) * 2, -26);
    ctx.lineTo(0, -24);
    ctx.closePath();
    ctx.fill();

    // Water wake ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-14, 8, 8, 0.8, 2.4);
    ctx.stroke();

    ctx.restore();
  }

  drawWhale(ctx, x, y) {
    const swim = Math.sin(this.animTime * 1.8) * 3;
    ctx.save();
    ctx.translate(x, y + swim);

    // Whale shadow
    ctx.fillStyle = 'rgba(3, 105, 161, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 32, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Whale body (Smooth sleek marine navy)
    const whaleGrad = ctx.createLinearGradient(0, -14, 0, 14);
    whaleGrad.addColorStop(0, '#1e3a8a');
    whaleGrad.addColorStop(0.7, '#2563eb');
    whaleGrad.addColorStop(1, '#93c5fd');
    ctx.fillStyle = whaleGrad;
    ctx.beginPath();
    ctx.moveTo(-32, 2);
    ctx.quadraticCurveTo(-14, -16, 16, -12);
    ctx.quadraticCurveTo(34, -4, 34, 4);
    ctx.quadraticCurveTo(24, 16, -4, 12);
    ctx.quadraticCurveTo(-22, 10, -32, 2);
    ctx.closePath();
    ctx.fill();

    // Whale Tail Fluke
    ctx.beginPath();
    ctx.moveTo(-30, 2);
    ctx.lineTo(-44, -9);
    ctx.lineTo(-38, 2);
    ctx.lineTo(-44, 13);
    ctx.closePath();
    ctx.fill();

    // Whale Eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(24, -3, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Friendly smile
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(24, 2, 4, 0.2, 1.6);
    ctx.stroke();

    // Dual Water Spout / Spray Fountain
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    const spray1 = Math.sin(this.animTime * 5) * 4;
    const spray2 = Math.cos(this.animTime * 5) * 3;

    ctx.beginPath();
    ctx.moveTo(10, -13);
    ctx.quadraticCurveTo(6, -26 + spray1, 2, -28 + spray1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(12, -13);
    ctx.quadraticCurveTo(16, -28 + spray2, 22, -29 + spray2);
    ctx.stroke();

    // Water droplet sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -30 + spray1, 2, 0, Math.PI * 2);
    ctx.arc(24, -31 + spray2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawWoodenBridge(ctx, x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.floor(dist / 14);
    const sag = 12;

    // Bridge Guide Cables
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 8);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 + sag;
    ctx.quadraticCurveTo(midX, midY - 8, x2, y2 - 8);
    ctx.stroke();

    // Wooden Planks along cable curve
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * midX + t * t * x2;
      const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * midY + t * t * y2;

      // Vertical suspension rope
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Thick wood plank
      ctx.fillStyle = i % 2 === 0 ? '#8d6e63' : '#6d4c41';
      ctx.beginPath();
      ctx.ellipse(px, py, 7, 3, Math.atan2(y2 - y1, x2 - x1), 0, Math.PI * 2);
      ctx.fill();
    }

    // Anchor Timber Posts at ends
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(x1 - 3, y1 - 12, 6, 14);
    ctx.fillRect(x2 - 3, y2 - 12, 6, 14);
  }

  drawStardustTrail(ctx, x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.floor(dist / 18);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t + Math.sin(this.animTime * 3 + i) * 3;
      const py = y1 + (y2 - y1) * t;

      const pulse = (Math.sin(this.animTime * 4 + i * 0.8) + 1) * 0.5;

      // Radiant orbital disc
      ctx.beginPath();
      ctx.arc(px, py, 6 + pulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.4})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd166';
      ctx.fill();
    }
  }

  drawIslandWaterfalls(ctx) {
    // Island 2 Waterfall (cascading into sea)
    const w2x = 300, w2y = 230, w2h = 55;
    this.drawSingleWaterfall(ctx, w2x, w2y, w2h, 14);

    // Island 4 Waterfall
    const w4x = 835, w4y = 310, w4h = 45;
    this.drawSingleWaterfall(ctx, w4x, w4y, w4h, 12);
  }

  drawSingleWaterfall(ctx, x, y, h, width) {
    // Water stream
    const flowGrad = ctx.createLinearGradient(x, y, x, y + h);
    flowGrad.addColorStop(0, 'rgba(186, 230, 253, 0.9)');
    flowGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.95)');
    flowGrad.addColorStop(1, 'rgba(255, 255, 255, 0.98)');

    ctx.fillStyle = flowGrad;
    ctx.beginPath();
    ctx.moveTo(x - width / 2, y);
    ctx.lineTo(x + width / 2, y);
    ctx.lineTo(x + width / 2 + 2, y + h);
    ctx.lineTo(x - width / 2 - 2, y + h);
    ctx.closePath();
    ctx.fill();

    // Shimmer foam lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const lineX = x - width / 2 + 3 + i * (width / 3);
      const off = (this.animTime * 60 + i * 15) % h;
      ctx.beginPath();
      ctx.moveTo(lineX, y + off);
      ctx.lineTo(lineX, y + Math.min(off + 8, h));
      ctx.stroke();
    }

    // Splash Foam Ring at base
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(x, y + h, width * 0.9 + Math.sin(this.animTime * 8) * 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMapIsland(ctx, island) {
    const x = island.x;
    const y = island.y;
    const w = island.w;
    const h = island.h;

    // 1. Deep Volumetric Ocean Shadow
    ctx.fillStyle = 'rgba(2, 44, 34, 0.38)';
    ctx.beginPath();
    ctx.ellipse(x, y + h * 0.52, w * 0.48, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. White Shore Foam Surf Ring (Pulsing gently)
    const foamPulse = Math.sin(this.animTime * 3 + x) * 2.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(x, y + h * 0.48, w * 0.46 + foamPulse, 18 + foamPulse * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Sandy Beach Shore Rim
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, w * 0.52, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Volumetric Island Cliff Base (Layered rock strata & facets)
    const cliffGrad = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y + h * 0.6);
    cliffGrad.addColorStop(0, island.cliffColor || '#5d4037');
    cliffGrad.addColorStop(0.5, '#4e342e');
    cliffGrad.addColorStop(1, '#271c19');

    ctx.fillStyle = cliffGrad;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, y);
    ctx.quadraticCurveTo(x - w * 0.42, y + h * 0.35, x - w * 0.25, y + h * 0.5);
    ctx.lineTo(x, y + h * 0.62); // Pointed bottom keel
    ctx.quadraticCurveTo(x + w * 0.28, y + h * 0.48, x + w * 0.5, y);
    ctx.closePath();
    ctx.fill();

    // Rock Strata & Crevice Lines on cliff
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.35, y + h * 0.18);
    ctx.lineTo(x + w * 0.25, y + h * 0.28);
    ctx.moveTo(x - w * 0.18, y + h * 0.36);
    ctx.lineTo(x + w * 0.12, y + h * 0.44);
    ctx.stroke();

    // 5. Lush Grassy Top Plateau Plate
    const grassGrad = ctx.createLinearGradient(x, y - h * 0.4, x, y + h * 0.2);
    if (island.id === 'island-3') {
      grassGrad.addColorStop(0, '#e2e8f0'); // Snow top for mountain
      grassGrad.addColorStop(0.4, '#cbd5e1');
      grassGrad.addColorStop(1, '#64748b');
    } else if (island.id === 'island-4') {
      grassGrad.addColorStop(0, '#34d399');
      grassGrad.addColorStop(0.6, '#059669');
      grassGrad.addColorStop(1, '#065f46');
    } else if (island.id === 'island-5') {
      grassGrad.addColorStop(0, '#fef08a');
      grassGrad.addColorStop(0.6, '#fde047');
      grassGrad.addColorStop(1, '#ca8a04');
    } else {
      grassGrad.addColorStop(0, '#86efac');
      grassGrad.addColorStop(0.5, '#4ade80');
      grassGrad.addColorStop(1, '#16a34a');
    }

    ctx.fillStyle = grassGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.48, h * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crisp Highlights on Top Rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

  }

  drawAllIslandSignboards(ctx) {
    const signboardCoords = [
      { num: '01', name: 'Basic', x: 185, y: 318, accent: '#30d158' },
      { num: '02', name: 'Daily Life', x: 320, y: 138, accent: '#ff9f0a' },
      { num: '03', name: 'Adventure', x: 580, y: 168, accent: '#64d2ff' },
      { num: '04', name: 'Future', x: 820, y: 210, accent: '#0a84ff' },
      { num: '05', name: 'Star Citadel', x: 810, y: 492, accent: '#ffd60a' }
    ];
    for (const sb of signboardCoords) {
      this.drawIslandSignboard(ctx, sb.x, sb.y, sb.num, sb.name, sb.accent);
    }
  }

  drawIslandSignboard(ctx, x, y, num, name, accent) {
    const font = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.save();
    ctx.font = `600 11px ${font}`;
    const textW = ctx.measureText(name).width;
    const bw = Math.round(textW + 44);
    const bh = 22;

    ctx.translate(x, y);

    // Subtle elevation shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2 + 2, bw, bh, bh / 2);
    ctx.fill();

    // Apple Obsidian Glass Capsule
    ctx.fillStyle = 'rgba(12, 18, 30, 0.80)';
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fill();

    // Hairline glass border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Accent world index dot/badge
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(-bw / 2 + 4, -7, 20, 14, 7);
    ctx.fill();

    ctx.fillStyle = '#09090b';
    ctx.font = `700 9px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num, -bw / 2 + 14, 0.5);

    // Crisp World Name
    ctx.fillStyle = '#f5f5f7';
    ctx.font = `600 11px ${font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, -bw / 2 + 30, 0.5);

    ctx.restore();
  }

  drawAllLandmarks(ctx) {
    // Island 1: Dutch Windmill, Blue Cottage, START Signpost, Daisies
    this.drawIsland1Landmarks(ctx, 180, 380);

    // Island 2: European Village, Stone Bridge, Apple Orchard
    this.drawIsland2Landmarks(ctx, 320, 190);

    // Island 3: Snowy Peaks, 3-Turret Fairy Tale Castle, Evergreens
    this.drawIsland3Landmarks(ctx, 580, 160);

    // Island 4: Futuristic High-Rises, Rotating Ferris Wheel, Red Bus
    this.drawIsland4Landmarks(ctx, 820, 260);

    // Island 5: Neoclassical Citadel & Radiant 3D Golden Star
    this.drawIsland5Landmarks(ctx, 810, 440);
  }

  // --- ISLAND 1: BASIC (Meadow, Windmill, Cottage, START post) ---
  drawIsland1Landmarks(ctx, ix, iy) {
    // 1. Dutch Windmill
    const wx = ix + 55, wy = iy - 34;
    ctx.save();
    ctx.translate(wx, wy);

    // Windmill Body
    ctx.fillStyle = '#d7ccc8';
    ctx.beginPath();
    ctx.moveTo(-12, 16);
    ctx.lineTo(-9, -14);
    ctx.lineTo(9, -14);
    ctx.lineTo(12, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Conical Roof
    ctx.fillStyle = '#e65100';
    ctx.beginPath();
    ctx.moveTo(-11, -14);
    ctx.lineTo(0, -26);
    ctx.lineTo(11, -14);
    ctx.closePath();
    ctx.fill();

    // Central axle hub
    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.arc(0, -14, 3, 0, Math.PI * 2);
    ctx.fill();

    // 4 Animated Rotating Lattice Sails
    const sailAngle = this.animTime * 1.6;
    for (let s = 0; s < 4; s++) {
      ctx.save();
      ctx.translate(0, -14);
      ctx.rotate(sailAngle + (s * Math.PI) / 2);

      // Timber spar
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(24, 0);
      ctx.stroke();

      // White canvas lattice sail
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(6, -6, 16, 5);
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(6, -6, 16, 5);

      ctx.restore();
    }
    ctx.restore();

    // 2. Blue-Roof Cottage
    const cx = ix - 45, cy = iy - 32;
    ctx.save();
    ctx.translate(cx, cy);

    // Stone walls
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-14, -6, 28, 18);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(-14, -6, 28, 18);

    // Cobalt Blue Roof
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(-17, -6);
    ctx.lineTo(0, -19);
    ctx.lineTo(17, -6);
    ctx.closePath();
    ctx.fill();

    // Red brick chimney & smoke
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(7, -18, 5, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const smokeY = Math.sin(this.animTime * 3) * 3;
    ctx.beginPath();
    ctx.arc(9, -22 + smokeY, 2.5, 0, Math.PI * 2);
    ctx.arc(11, -27 + smokeY, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Wooden door & warm lit window
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-4, 2, 7, 10);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(5, -2, 6, 6);

    ctx.restore();

    // 3. START Wooden Signpost (as in Image 3 near 1-1)
    const sx = ix - 95, sy = iy + 14;
    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-3, 0, 6, 20); // Post

    ctx.fillStyle = '#a16207';
    ctx.beginPath();
    ctx.roundRect(-24, -14, 48, 16, 4); // Board
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START', 0, -6);

    ctx.restore();

    // 4. White Picket Fence & Blooming Daisies
    ctx.fillStyle = '#ffffff';
    for (let f = 0; f < 4; f++) {
      ctx.fillRect(ix - 12 + f * 7, iy - 6, 3, 10);
    }
    ctx.fillRect(ix - 14, iy - 2, 26, 2);

    // Daisies
    const flowers = [{ x: ix - 20, y: iy + 25 }, { x: ix + 22, y: iy + 35 }, { x: ix + 72, y: iy + 14 }];
    for (const fl of flowers) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fl.x - 2, fl.y, 2, 0, Math.PI * 2);
      ctx.arc(fl.x + 2, fl.y, 2, 0, Math.PI * 2);
      ctx.arc(fl.x, fl.y - 2, 2, 0, Math.PI * 2);
      ctx.arc(fl.x, fl.y + 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- ISLAND 2: DAILY LIFE (Terracotta Village, River, Orchard) ---
  drawIsland2Landmarks(ctx, ix, iy) {
    // Terracotta Townhouses Cluster
    const houses = [
      { x: ix - 36, y: iy - 26, w: 22, h: 16, roof: '#ea580c', wall: '#ffedd5' },
      { x: ix - 10, y: iy - 32, w: 26, h: 20, roof: '#c2410c', wall: '#fef3c7' },
      { x: ix + 22, y: iy - 24, w: 24, h: 16, roof: '#dc2626', wall: '#fed7aa' }
    ];

    for (const h of houses) {
      ctx.save();
      ctx.translate(h.x, h.y);

      // Facade
      ctx.fillStyle = h.wall;
      ctx.fillRect(-h.w / 2, 0, h.w, h.h);

      // Terracotta pitched roof
      ctx.fillStyle = h.roof;
      ctx.beginPath();
      ctx.moveTo(-h.w / 2 - 3, 0);
      ctx.lineTo(0, -11);
      ctx.lineTo(h.w / 2 + 3, 0);
      ctx.closePath();
      ctx.fill();

      // Windows
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-h.w / 4, 3, 4, 4);
      ctx.fillRect(h.w / 4 - 3, 3, 4, 4);

      ctx.restore();
    }

    // Cobblestone Arch Bridge over stream
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(ix - 6, iy + 6, 18, 9, 3);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(ix + 3, iy + 14, 5, Math.PI, 0);
    ctx.fill();

    // Apple Trees
    const trees = [{ x: ix - 60, y: iy - 6 }, { x: ix + 58, y: iy - 4 }];
    for (const t of trees) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(t.x - 2, t.y, 4, 10);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(t.x, t.y - 2, 10, 0, Math.PI * 2);
      ctx.fill();
      // Apples
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(t.x - 4, t.y - 4, 2, 0, Math.PI * 2);
      ctx.arc(t.x + 3, t.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- ISLAND 3: ADVENTURE (Snowy Peaks, 3-Turret Fairy Tale Castle) ---
  drawIsland3Landmarks(ctx, ix, iy) {
    // 1. Jagged Snowy Peaks in Background
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(ix - 70, iy - 10);
    ctx.lineTo(ix - 35, iy - 58);
    ctx.lineTo(ix, iy - 20);
    ctx.lineTo(ix + 40, iy - 62);
    ctx.lineTo(ix + 75, iy - 10);
    ctx.closePath();
    ctx.fill();

    // Pure White Snowcaps
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(ix - 35, iy - 58);
    ctx.lineTo(ix - 45, iy - 44);
    ctx.lineTo(ix - 35, iy - 48);
    ctx.lineTo(ix - 25, iy - 44);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(ix + 40, iy - 62);
    ctx.lineTo(ix + 28, iy - 46);
    ctx.lineTo(ix + 40, iy - 50);
    ctx.lineTo(ix + 52, iy - 46);
    ctx.closePath();
    ctx.fill();

    // 2. Grand 3-Turret Fairy Tale Castle (Image 3 centerpiece)
    const kx = ix, ky = iy - 20;
    ctx.save();
    ctx.translate(kx, ky);

    // Stone Castle Base Keep
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-28, -12, 56, 26);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-28, -12, 56, 26);

    // Arched portcullis doorway
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 14, 7, Math.PI, 0);
    ctx.lineTo(7, 14);
    ctx.lineTo(-7, 14);
    ctx.closePath();
    ctx.fill();

    // 3 Cylindrical Turrets (Left, Center Tall Keep, Right)
    const turrets = [
      { x: -26, y: -24, w: 14, h: 28, roofH: 18 },
      { x: 0, y: -34, w: 18, h: 36, roofH: 24 },
      { x: 26, y: -24, w: 14, h: 28, roofH: 18 }
    ];

    for (const tur of turrets) {
      // Turret Wall
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(tur.x - tur.w / 2, tur.y, tur.w, tur.h);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(tur.x - tur.w / 2, tur.y, tur.w, tur.h);

      // Royal Blue Conical Spires
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.moveTo(tur.x - tur.w / 2 - 2, tur.y);
      ctx.lineTo(tur.x, tur.y - tur.roofH);
      ctx.lineTo(tur.x + tur.w / 2 + 2, tur.y);
      ctx.closePath();
      ctx.fill();

      // Gold Sconce Orb
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(tur.x, tur.y - tur.roofH, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Fluttering Crimson Pennant Flag on Top
      const flagWave = Math.sin(this.animTime * 7 + tur.x) * 2;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(tur.x, tur.y - tur.roofH);
      ctx.lineTo(tur.x + 9 + flagWave, tur.y - tur.roofH - 3);
      ctx.lineTo(tur.x, tur.y - tur.roofH - 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // 3. Snow-Dusted Evergreen Pines
    const pines = [{ x: ix - 58, y: iy + 4 }, { x: ix + 62, y: iy + 2 }];
    for (const p of pines) {
      ctx.fillStyle = '#1e3a5f';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 18);
      ctx.lineTo(p.x - 9, p.y);
      ctx.lineTo(p.x + 9, p.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 18);
      ctx.lineTo(p.x - 4, p.y - 10);
      ctx.lineTo(p.x + 4, p.y - 10);
      ctx.closePath();
      ctx.fill();
    }
  }

  // --- ISLAND 4: FUTURE (Skyscrapers, Rotating Ferris Wheel, Red Bus) ---
  drawIsland4Landmarks(ctx, ix, iy) {
    // 1. Futuristic Glass Skyscrapers
    const towers = [
      { x: ix - 48, y: iy - 50, w: 16, h: 48, col1: '#0284c7', col2: '#0f172a' },
      { x: ix - 28, y: iy - 65, w: 20, h: 64, col1: '#38bdf8', col2: '#1e1b4b' },
      { x: ix - 6, y: iy - 55, w: 18, h: 54, col1: '#06b6d4', col2: '#0f172a' },
      { x: ix + 60, y: iy - 42, w: 16, h: 40, col1: '#6366f1', col2: '#1e1b4b' }
    ];

    for (const t of towers) {
      const bGrad = ctx.createLinearGradient(t.x, t.y, t.x + t.w, t.y + t.h);
      bGrad.addColorStop(0, t.col1);
      bGrad.addColorStop(1, t.col2);
      ctx.fillStyle = bGrad;
      ctx.fillRect(t.x, t.y, t.w, t.h);

      // Cyan grid window lights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let wy = t.y + 4; wy < t.y + t.h - 6; wy += 8) {
        ctx.fillRect(t.x + 3, wy, t.w - 6, 2.5);
      }
    }

    // 2. Animated Rotating Ferris Wheel (Image 3)
    const fx = ix + 34, fy = iy - 32, fr = 26;
    ctx.save();
    ctx.translate(fx, fy);

    // Support A-Frame Legs
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-14, 30);
    ctx.moveTo(0, 0); ctx.lineTo(14, 30);
    ctx.stroke();

    // Wheel Ring & Spokes (Rotating)
    const wheelAngle = this.animTime * 0.8;
    ctx.save();
    ctx.rotate(wheelAngle);

    // Outer Rim
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, fr, 0, Math.PI * 2);
    ctx.stroke();

    // 8 Radial Spokes & Cabins
    const gondolaColors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6', '#f97316'];
    for (let sp = 0; sp < 8; sp++) {
      const sa = (sp * Math.PI) / 4;
      const gx = Math.cos(sa) * fr;
      const gy = Math.sin(sa) * fr;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      // Gondola cabin (Keeps upright in world space)
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(-wheelAngle); // Counter-rotate so cabins hang upright
      ctx.fillStyle = gondolaColors[sp];
      ctx.beginPath();
      ctx.roundRect(-4, -4, 8, 8, 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Center Axle Hub
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 3. Cheerful Red Double-Decker Bus (Image 3)
    const rx = ix + 36, ry = iy + 14;
    ctx.save();
    ctx.translate(rx, ry);

    // Bus body
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-16, -10, 32, 16, 3);
    ctx.fill();

    // Window Rows
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(-13, -8, 26, 4); // Upper deck
    ctx.fillRect(-13, -2, 26, 4); // Lower deck

    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-8, 7, 3, 0, Math.PI * 2);
    ctx.arc(8, 7, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- ISLAND 5: FINAL STAGE (Neoclassical Star Citadel & Radiant 3D Star) ---
  drawIsland5Landmarks(ctx, ix, iy) {
    const tx = ix, ty = iy - 16;
    ctx.save();
    ctx.translate(tx, ty);

    // Grand Ceremonial Royal Blue Staircase
    ctx.fillStyle = '#1e40af';
    ctx.beginPath();
    ctx.moveTo(-18, 18);
    ctx.lineTo(18, 18);
    ctx.lineTo(12, 4);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Marble Temple Platform Base
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-36, -4, 72, 10, 3);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Fluted Marble Columns
    ctx.fillStyle = '#f1f5f9';
    const cols = [-26, -14, 14, 26];
    for (const c of cols) {
      ctx.fillRect(c - 2.5, -24, 5, 20);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(c - 3.5, -24, 7, 2);
      ctx.fillRect(c - 3.5, -6, 7, 2);
      ctx.fillStyle = '#f1f5f9';
    }

    // Blue Vaulted Arch Pediment Roof
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(-34, -28, 68, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(0, -28, 22, Math.PI, 0);
    ctx.fill();

    // GIANT RADIANT 3D GOLDEN STAR (Perched & Floating atop Citadel)
    const starBob = Math.sin(this.animTime * 3) * 4;
    const starY = -52 + starBob;

    // Radiant Sunbeam Glow Aura
    const glowRad = 32 + Math.sin(this.animTime * 4) * 6;
    const glowGrad = ctx.createRadialGradient(0, starY, 4, 0, starY, glowRad);
    glowGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    glowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
    glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, starY, glowRad, 0, Math.PI * 2);
    ctx.fill();

    // Faceted 3D Golden Star
    this.drawFacetedStar(ctx, 0, starY, 18, 9);

    ctx.restore();
  }

  drawFacetedStar(ctx, cx, cy, outerR, innerR) {
    const points = 5;
    const step = Math.PI / points;

    // Outer Star Silhouette with Gold Trim
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = i * step - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3D Faceted Triangular Shading for brilliant depth
    for (let i = 0; i < points; i++) {
      const a1 = (i * 2) * step - Math.PI / 2;
      const a2 = (i * 2 + 1) * step - Math.PI / 2;
      const a3 = (i * 2 + 2) * step - Math.PI / 2;

      // Light side of facet
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR);
      ctx.lineTo(cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR);
      ctx.closePath();
      ctx.fill();

      // Shadow side of facet
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR);
      ctx.lineTo(cx + Math.cos(a3) * outerR, cy + Math.sin(a3) * outerR);
      ctx.closePath();
      ctx.fill();
    }

    // Central bright gleam
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawStageNodes(ctx) {
    for (const island of MAP_ISLANDS) {
      // Dotted Cobblestone Connector Path
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      island.nodes.forEach((n, idx) => {
        if (idx === 0) ctx.moveTo(n.x, n.y);
        else ctx.lineTo(n.x, n.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Nodes
      for (const node of island.nodes) {
        const isUnlocked = progress.unlockedLevels.includes(node.id);
        const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;
        const isSelected = this.selectedNode && this.selectedNode.id === node.id;
        const isActive = progress.activeLevelId === node.id;

        // Concentric Breathing Pulse Ring on Active/Hover/Select
        if (isHovered || isSelected || isActive) {
          const pulse = (Math.sin(this.animTime * 4) + 1) * 0.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 20 + pulse * 5, 0, Math.PI * 2);
          ctx.strokeStyle = node.id === 'final'
            ? `rgba(255, 214, 10, ${0.55 - pulse * 0.3})`
            : `rgba(10, 132, 255, ${0.65 - pulse * 0.3})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Soft Drop Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.arc(node.x, node.y + 2, 16, 0, Math.PI * 2);
        ctx.fill();

        // Glossy Spherical Node Pill
        ctx.beginPath();
        ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
        const nodeGrad = ctx.createLinearGradient(node.x, node.y - 16, node.x, node.y + 16);
        if (node.id === 'final') {
          nodeGrad.addColorStop(0, '#ffd60a');
          nodeGrad.addColorStop(1, '#d97706');
        } else if (isUnlocked) {
          nodeGrad.addColorStop(0, '#38bdf8');
          nodeGrad.addColorStop(1, '#0a84ff');
        } else {
          nodeGrad.addColorStop(0, '#64748b');
          nodeGrad.addColorStop(1, '#334155');
        }
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        // Crisp White Rim
        ctx.strokeStyle = isSelected || isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.88)';
        ctx.lineWidth = isSelected || isHovered ? 2.5 : 2;
        ctx.stroke();

        // Node Label / Crisp Vector Star
        if (node.id === 'final') {
          this.drawFacetedStar(ctx, node.x, node.y, 8, 3.8);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 10.5px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.id, node.x, node.y + 0.5);
        }
      }
    }
  }

  drawWordiOnMap(ctx) {
    const activeId = progress.activeLevelId || '1-1';
    let targetNode = null;
    for (const isl of MAP_ISLANDS) {
      for (const n of isl.nodes) {
        if (n.id === activeId) { targetNode = n; break; }
      }
    }
    if (!targetNode) targetNode = MAP_ISLANDS[0].nodes[0];

    const wx = targetNode.x;
    const wy = targetNode.y - 35;

    ctx.save();
    ctx.translate(wx, wy);

    // Subtle breathing bounce
    const bounceY = Math.sin(this.animTime * 6) * 2;
    ctx.translate(0, bounceY);

    // Wordi Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Animated Wagging Curly Tail
    const tailWag = Math.sin(this.animTime * 10) * 0.4;
    ctx.save();
    ctx.translate(-10, 2);
    ctx.rotate(tailWag);
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.arc(-6, -4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(-8, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cream Belly
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.ellipse(2, 8, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paws
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(-6, 15, 3.5, 0, Math.PI * 2);
    ctx.arc(6, 15, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.save();
    ctx.translate(0, -4);

    // Ears
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.moveTo(-10, -8); ctx.lineTo(-14, -20); ctx.lineTo(-2, -12); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2, -12); ctx.lineTo(14, -20); ctx.lineTo(10, -8); ctx.fill();

    // Inner Pink Ears
    ctx.fillStyle = '#ffccd5';
    ctx.beginPath();
    ctx.moveTo(-9, -9); ctx.lineTo(-12, -17); ctx.lineTo(-4, -12); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, -12); ctx.lineTo(12, -17); ctx.lineTo(9, -9); ctx.fill();

    // Head Sphere
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    // Cream Cheeks
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(-5, 4, 6.5, 0, Math.PI * 2);
    ctx.arc(5, 4, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Cheerful Glossy Eyes
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(-4, -1, 2.5, 0, Math.PI * 2);
    ctx.arc(4, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3.2, -2, 1, 0, Math.PI * 2);
    ctx.arc(4.8, -2, 1, 0, Math.PI * 2);
    ctx.fill();

    // Cute Button Nose
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(0, 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Friendly Smile
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(-1.5, 4, 2, 0.2, Math.PI - 0.2);
    ctx.arc(1.5, 4, 2, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore();

    // Signature Blue Bandana with White Paw Print
    ctx.fillStyle = '#2f7be5';
    ctx.beginPath();
    ctx.moveTo(-9, 1);
    ctx.lineTo(9, 1);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 4, 1.8, 0, Math.PI * 2); // Paw pad
    ctx.arc(-1.6, 2.5, 0.9, 0, Math.PI * 2); // Toes
    ctx.arc(0, 1.8, 0.9, 0, Math.PI * 2);
    ctx.arc(1.6, 2.5, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Callout ("Let's Go"): pill + tail are ONE outlined shape, so there is no seam
    const bw = 72, bh = 22;
    const bx = 14, by = -40;
    const hot = !!this._calloutHot;

    ctx.save();
    ctx.translate(0, hot ? -2 : 0);

    // Hard offset shadow
    ctx.fillStyle = '#0b0a0e';
    ctx.beginPath();
    ctx.roundRect(bx + 3, by + 3, bw, bh, 7);
    ctx.fill();

    // Pill + pointer tail aimed at Wordi: outline pass, then fill pass hides any inner seam
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 7);
    ctx.moveTo(bx + 5, by + bh - 1);
    ctx.lineTo(bx - 3, by + bh + 9);
    ctx.lineTo(bx + 16, by + bh - 1);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0b0a0e';
    ctx.stroke();
    ctx.fillStyle = hot ? '#d9ff74' : '#c6ff3d';
    ctx.fill();

    // Paw badge
    ctx.fillStyle = '#0b0a0e';
    [[bx + 13, by + bh / 2 + 1.5, 2.6], [bx + 10.5, by + bh / 2 - 1.5, 1.1],
     [bx + 13, by + bh / 2 - 2.5, 1.1], [bx + 15.5, by + bh / 2 - 1.5, 1.1]]
      .forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });

    // Label
    ctx.font = '800 11px "Bricolage Grotesque", "Arial Black", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText("Let's Go", bx + 21, by + bh / 2 + 0.5);
    ctx.restore();

    ctx.restore();
  }

  drawMapBadges(ctx) {
    // 1. Bottom-Left Apple Glass Compass Capsule
    this.drawCompassScroll(ctx, 18, CONFIG.CANVAS_HEIGHT - 58, 228, 42);

    // 2. Top-Left Apple Obsidian Title Pill
    this.drawTopRibbonBanner(ctx, 20, 18);
  }

  drawCompassScroll(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);

    // Elevation Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(0, 2, w, h, 21);
    ctx.fill();

    // Frosted Obsidian Glass Capsule
    ctx.fillStyle = 'rgba(12, 18, 30, 0.72)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 21);
    ctx.fill();

    // Hairline Glass Rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Vector Nautical Compass Rose Emblem
    const cx = 22, cy = h / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4 + Math.sin(this.animTime * 1.2) * 0.08);

    // North Pointer (Apple Orange-Red)
    ctx.fillStyle = '#ff453a';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(3, 0);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();

    // South Pointer (Cool Silver)
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(3, 0);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();

    // Pivot Cap
    ctx.fillStyle = '#f5f5f7';
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Clean San Francisco Quote
    ctx.fillStyle = 'rgba(235, 235, 245, 0.85)';
    ctx.font = '500 10.5px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('"One word at a time,', 42, cy - 6.5);
    ctx.fillStyle = 'rgba(235, 235, 245, 0.62)';
    ctx.fillText('you can go a long way."', 42, cy + 7);

    ctx.restore();
  }

  drawTopRibbonBanner(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    const w = 276, h = 40;

    // Elevation Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(0, 3, w, h, 20);
    ctx.fill();

    // Frosted Obsidian Capsule (Matches right Difficulty Pill)
    ctx.fillStyle = 'rgba(12, 18, 30, 0.72)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 20);
    ctx.fill();

    // Hairline Glass Rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Subtle Top Specular Edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(20, 0.5);
    ctx.lineTo(w - 20, 0.5);
    ctx.stroke();

    // --- Wordi Emblem Medallion ---
    const cx = 20, cy = 20, r = 13.5;
    const goldGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    goldGrad.addColorStop(0, '#ffd60a');
    goldGrad.addColorStop(1, '#ff9f0a');
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Wordi miniature face vector
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.moveTo(-6, -3); ctx.lineTo(-9, -10); ctx.lineTo(-3, -6); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, -3); ctx.lineTo(9, -10); ctx.lineTo(3, -6); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff9f0a';
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 2, 4, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(0, 1, 1.3, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2.8, -1.2, 1.1, 0, Math.PI * 2);
    ctx.arc(2.8, -1.2, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a84ff';
    ctx.beginPath();
    ctx.moveTo(-2.5, 5.2); ctx.lineTo(2.5, 5.2); ctx.lineTo(0, 7.5); ctx.closePath();
    ctx.fill();
    ctx.restore();

    // --- Crisp Apple Typography ---
    const sf = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif';
    ctx.fillStyle = '#f5f5f7';
    ctx.font = `700 12.5px ${sf}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Wordyssey', 42, 18.5);

    // Subtle Micro Tag Pill ("5 WORLDS")
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(114, 9, 52, 12, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(235, 235, 245, 0.78)';
    ctx.font = `600 7.5px ${sf}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('5 WORLDS', 140, 15.2);

    // Subtitle Line (100% contained cleanly inside)
    ctx.fillStyle = 'rgba(235, 235, 245, 0.65)';
    ctx.font = `400 10px ${sf}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Your English Journey Begins Here', 42, 31.5);

    ctx.restore();
  }
}

/* ==========================================================================
   DEDICATED QUIZ ARENA ("SOAL UJIAN" - Image 1 Scene 3)
   ========================================================================== */
class QuizArenaEngine {
  constructor(suite) {
    this.suite = suite;
    this.activeTopic = 'all';
    this.streak = 0;
    this.totalQuestions = 0;
    this.correctAnswers = 0;
    this.coinsEarned = 0;
    this.currentQuestion = null;

    this.domPrompt = document.getElementById('arenaQuestionPrompt');
    this.domGrid = document.getElementById('arenaChoicesGrid');
    this.domStreak = document.getElementById('arenaStreak');
    this.domAccuracy = document.getElementById('arenaAccuracy');
    this.domCoins = document.getElementById('arenaCoins');

    this.initEvents();
  }

  initEvents() {
    const topicBtns = document.querySelectorAll('.filter-btn');
    topicBtns.forEach(btn => {
      btn.onclick = () => {
        topicBtns.forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        this.activeTopic = btn.dataset.topic;
        this.nextQuestion();
      };
    });

    const audioBtn = document.getElementById('btnPlayWordAudio');
    if (audioBtn) {
      audioBtn.onclick = () => this.suite.sound.playPowerup();
    }
  }

  nextQuestion() {
    let pool = WORD_CHALLENGES;
    if (this.activeTopic !== 'all') {
      pool = WORD_CHALLENGES.filter(q => q.topic === this.activeTopic);
      if (pool.length === 0) pool = WORD_CHALLENGES;
    }

    const q = pool[Math.floor(Math.random() * pool.length)];
    this.currentQuestion = q;

    if (this.domPrompt) this.domPrompt.textContent = q.question;
    drawClueIllustration('arenaClueCanvas', q.id);

    if (this.domGrid) {
      this.domGrid.innerHTML = '';
      const choices = [...q.choices].sort(() => Math.random() - 0.5);

      choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice;
        btn.onclick = () => this.handleAnswer(choice, btn);
        this.domGrid.appendChild(btn);
      });
    }
  }

  handleAnswer(choice, btn) {
    const isCorrect = choice === this.currentQuestion.answer;
    this.totalQuestions++;

    const allButtons = this.domGrid.querySelectorAll('.choice-btn');
    allButtons.forEach(b => (b.disabled = true));

    if (isCorrect) {
      btn.classList.add('correct');
      this.streak++;
      this.correctAnswers++;
      const bonus = 10 + (this.streak > 3 ? 5 : 0);
      this.coinsEarned += bonus;
      progress.addCoins(bonus);
      this.suite.sound.playCorrectWord();
    } else {
      btn.classList.add('wrong');
      this.streak = 0;
      this.suite.sound.playWrongWord();
      allButtons.forEach(b => {
        if (b.textContent === this.currentQuestion.answer) b.classList.add('correct');
      });
    }

    this.updateStats();
    setTimeout(() => this.nextQuestion(), 1100);
  }

  updateStats() {
    if (this.domStreak) this.domStreak.textContent = `${this.streak}x`;
    const acc = Math.round((this.correctAnswers / Math.max(1, this.totalQuestions)) * 100);
    if (this.domAccuracy) this.domAccuracy.textContent = `${acc}%`;
    if (this.domCoins) this.domCoins.textContent = `+${this.coinsEarned}`;
  }
}

/* ==========================================================================
   WORDI CHARACTER PROFILE & GUIDE (Image 2)
   ========================================================================== */
class ProfileView {
  constructor() {
    this.canvas = document.getElementById('profileFaceCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.activeExpr = 'happy';
      this.currentView = 'front';
      this.initEvents();
      this.render();
    }
  }

  initEvents() {
    const exprCards = document.querySelectorAll('.expr-card:not(.character-view-btn)');
    exprCards.forEach(card => {
      card.onclick = () => {
        exprCards.forEach(c => c.classList.remove('on'));
        card.classList.add('on');
        this.activeExpr = card.dataset.expr;
        this.render();
      };
    });

    const viewBtns = document.querySelectorAll('.character-view-btn');
    viewBtns.forEach(btn => {
      btn.onclick = () => {
        viewBtns.forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        this.currentView = btn.dataset.view;
        this.render();
      };
    });
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    if (this.currentView === 'side') {
      this.drawSideView(ctx, cx, cy);
    } else if (this.currentView === 'back') {
      this.drawBackView(ctx, cx, cy);
    } else {
      this.drawFrontView(ctx, cx, cy, this.activeExpr);
    }
  }

  drawExpression(expr) {
    this.activeExpr = expr;
    this.currentView = 'front';
    this.render();
  }

  drawFrontView(ctx, cx, cy, expr) {
    ctx.save();
    ctx.translate(cx, cy);

    // Warm radial glow behind portrait
    const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 80);
    glow.addColorStop(0, 'rgba(255, 149, 51, 0.2)');
    glow.addColorStop(1, 'rgba(255, 149, 51, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.fill();

    // Head Base Sphere with volumetric shading
    const headGrad = ctx.createRadialGradient(-10, -10, 8, 0, 0, 52);
    headGrad.addColorStop(0, '#ffa94d');
    headGrad.addColorStop(0.7, '#ff9533');
    headGrad.addColorStop(1, '#e65100');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();

    // Perked Ears
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.moveTo(-30, -28); ctx.lineTo(-46, -72); ctx.lineTo(-8, -44); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -44); ctx.lineTo(46, -72); ctx.lineTo(30, -28); ctx.fill();

    // Inner Ears with soft pink blush
    ctx.fillStyle = '#ffccd5';
    ctx.beginPath();
    ctx.moveTo(-25, -32); ctx.lineTo(-38, -63); ctx.lineTo(-14, -42); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, -42); ctx.lineTo(38, -63); ctx.lineTo(25, -32); ctx.fill();

    // Ear Fur Tufts
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.moveTo(-16, -32); ctx.lineTo(-24, -40); ctx.lineTo(-14, -38); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -32); ctx.lineTo(24, -40); ctx.lineTo(14, -38); ctx.fill();

    // Cream Cheeks & Muzzle
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.ellipse(0, 18, 34, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft Pink Cheek Blush
    ctx.fillStyle = 'rgba(255, 107, 129, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-26, 12, 9, 6, -0.1, 0, Math.PI * 2);
    ctx.ellipse(26, 12, 9, 6, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Signature Blue Bandana with Fold & White Paw
    const bandGrad = ctx.createLinearGradient(0, 38, 0, 74);
    bandGrad.addColorStop(0, '#3b82f6');
    bandGrad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = bandGrad;
    ctx.beginPath();
    ctx.moveTo(-36, 40);
    ctx.lineTo(36, 40);
    ctx.lineTo(0, 74);
    ctx.closePath();
    ctx.fill();

    // Crisp White Paw Print on Bandana
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 53, 5, 4, 0, 0, Math.PI * 2); // Main pad
    ctx.arc(-4.5, 47, 2, 0, Math.PI * 2); // Left toe
    ctx.arc(0, 45, 2.2, 0, Math.PI * 2); // Middle toe
    ctx.arc(4.5, 47, 2, 0, Math.PI * 2); // Right toe
    ctx.fill();

    // Facial Expressions (Image 2)
    ctx.fillStyle = '#1c1917';
    if (expr === 'happy') {
      // Cheerful curved closed eyes
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = '#1c1917';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(-18, -6, 9, Math.PI + 0.2, -0.2); ctx.stroke();
      ctx.beginPath();
      ctx.arc(18, -6, 9, Math.PI + 0.2, -0.2); ctx.stroke();

      // Cheerful open smile with tongue
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 24, 11, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#ff85a1';
      ctx.beginPath();
      ctx.arc(0, 29, 6, 0, Math.PI); ctx.fill();

    } else if (expr === 'surprised') {
      // Wide circular astonished eyes
      ctx.beginPath();
      ctx.arc(-18, -6, 8, 0, Math.PI * 2);
      ctx.arc(18, -6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-16, -8, 2.8, 0, Math.PI * 2);
      ctx.arc(20, -8, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Small round 'O' mouth
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(0, 24, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (expr === 'sad') {
      // Drooping puppy eyes with tear
      ctx.beginPath();
      ctx.arc(-18, -4, 7, 0, Math.PI * 2);
      ctx.arc(18, -4, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-19, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(17, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Glistening tear
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-26, 4, 3.5, 0, Math.PI * 2);
      ctx.arc(-24, 12, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Frown mouth (Image 2: Sedih)
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = '#1c1917';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-7, 26);
      ctx.quadraticCurveTo(0, 20, 7, 26);
      ctx.stroke();

    } else if (expr === 'excited') {
      // Sparkling golden star eyes!
      ctx.fillStyle = '#f59e0b';
      drawFacetedStar(ctx, -18, -6, 13, 5.5);
      drawFacetedStar(ctx, 18, -6, 13, 5.5);

      // Huge ecstatic open smile
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 22, 13, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#ff85a1';
      ctx.beginPath();
      ctx.arc(0, 28, 8, 0, Math.PI); ctx.fill();
    }

    // Cute Shiny Button Nose
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(0, 10, 5.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-1.5, 8.5, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawSideView(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    // Body
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.ellipse(-8, 12, 34, 26, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Cream Belly
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.ellipse(4, 18, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paws
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(-22, 38, 8, 0, Math.PI * 2); // Back paw
    ctx.arc(14, 38, 8, 0, Math.PI * 2); // Front paw
    ctx.fill();

    // Curly Tail Wagging Up
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.arc(-34, -4, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(-40, -8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.arc(16, -16, 28, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.ellipse(34, -12, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(46, -16, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(24, -20, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(26, -22, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Perked Ears
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.moveTo(6, -34); ctx.lineTo(14, -62); ctx.lineTo(26, -38); ctx.fill();
    ctx.fillStyle = '#ffccd5';
    ctx.beginPath();
    ctx.moveTo(9, -36); ctx.lineTo(15, -56); ctx.lineTo(23, -40); ctx.fill();

    // Blue Bandana
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(10, 4); ctx.lineTo(26, 4); ctx.lineTo(18, 22); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(18, 12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawBackView(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    // Body (Round back)
    const bodyGrad = ctx.createRadialGradient(0, 16, 4, 0, 16, 32);
    bodyGrad.addColorStop(0, '#ffa94d');
    bodyGrad.addColorStop(0.8, '#ff9533');
    bodyGrad.addColorStop(1, '#ea580c');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 16, 32, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paws
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(-18, 42, 8, 0, Math.PI * 2);
    ctx.arc(18, 42, 8, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy Curly Tail perched prominently on right hip/back (Image 2)
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.arc(20, 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff9ee';
    ctx.beginPath();
    ctx.arc(26, -4, 9, 0, Math.PI * 2);
    ctx.fill();

    // Head from Back
    ctx.fillStyle = '#ff9533';
    ctx.beginPath();
    ctx.arc(0, -18, 28, 0, Math.PI * 2);
    ctx.fill();

    // Back of Ears (showing dark/orange tips)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-24, -30); ctx.lineTo(-38, -62); ctx.lineTo(-8, -40); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -40); ctx.lineTo(38, -62); ctx.lineTo(24, -30); ctx.fill();

    // Tied Bandana Knot & Streamers around Neck (Image 2)
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(0, 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-4, 8); ctx.lineTo(-14, 24); ctx.lineTo(-2, 18); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 8); ctx.lineTo(14, 24); ctx.lineTo(2, 18); ctx.fill();

    ctx.restore();
  }
}

/* ==========================================================================
   SUITE COORDINATOR & NAVIGATION
   ========================================================================== */
class WordysseySuite {
  constructor() {
    this.sound = window.sound;
    this.map = new WorldMapEngine(this);
    this.quiz = new QuizArenaEngine(this);
    this.profile = new ProfileView();
    window.suite = this;

    this.activeTab = 'map';
    this.initNavigation();
    progress.updateNavUI();

    // Start live 60fps World Map animation
    this.map.startLoop();
  }

  showToast(text, color = '#0a84ff') {
    const toast = document.getElementById('appleToast');
    if (!toast) return;
    toast.innerHTML = `<span class="toast-dot" style="background:${color};box-shadow:0 0 8px ${color};"></span><span>${text}</span>`;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  initNavigation() {
    const setClick = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.onclick = fn;
    };

    document.querySelectorAll('.dock-btn').forEach(btn => {
      btn.onclick = () => this.switchTab(btn.dataset.tab);
    });

    // Wire All Interactive Apple Segmented Difficulty Selectors (Header, Map Floating, Modal Start)
    document.querySelectorAll('#difficultyPicker .seg-btn, #headerDifficultyPicker .seg-btn, #mapDifficultyPicker .seg-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const diff = btn.dataset.diff;
        progress.setDifficulty(diff);
      };
    });

    // Wire Map Node Card Interactive Chip Button
    const mapNodeDiffBtn = document.getElementById('mapNodeDifficultyBtn');
    if (mapNodeDiffBtn) {
      mapNodeDiffBtn.onclick = (e) => {
        e.stopPropagation();
        const order = ['casual', 'normal', 'hero'];
        const nextIdx = (order.indexOf(progress.difficulty) + 1) % order.length;
        progress.setDifficulty(order[nextIdx]);
      };
    }

    // Wire HUD In-Game Difficulty Badge as clickable toggle
    const hudDiffBadge = document.getElementById('hudDifficultyBadge');
    if (hudDiffBadge) {
      hudDiffBadge.onclick = (e) => {
        e.stopPropagation();
        const order = ['casual', 'normal', 'hero'];
        const nextIdx = (order.indexOf(progress.difficulty) + 1) % order.length;
        progress.setDifficulty(order[nextIdx]);
      };
    }

    setClick('brandHomeBtn', () => this.switchTab('map'));

    setClick('btnSound', () => {
      const isMuted = this.sound.toggleMute();
      const el = document.getElementById('btnSound');
      if (el) el.classList.toggle('on', !isMuted);
    });

    setClick('btnMusic', () => {
      const isMuted = this.sound.toggleMusic();
      const el = document.getElementById('btnMusic');
      if (el) el.classList.toggle('on', !isMuted);
    });

    setClick('btnReturnToMapFromHud', () => {
      if (window.game && window.game.state === 'PLAYING') {
        window.game.togglePause();
      }
      this.switchTab('map');
    });

    setClick('btnReturnToMapFromStart', () => {
      this.switchTab('map');
    });

    setClick('btnReturnToMapFromQuiz', () => {
      this.switchTab('map');
    });

    setClick('btnReturnToMapFromProfile', () => {
      this.switchTab('map');
    });

    setClick('btnReturnToMapFromPause', () => {
      if (window.game) window.game.togglePause();
      this.switchTab('map');
    });

    setClick('btnReturnToMapWin', () => {
      const m = document.getElementById('modalStageClear');
      if (m) m.classList.remove('active');
      this.switchTab('map');
    });

    setClick('btnReturnToMapFail', () => {
      const m = document.getElementById('modalGameOver');
      if (m) m.classList.remove('active');
      this.switchTab('map');
    });

    setClick('btnUnlockAllStages', () => {
      progress.unlockedLevels = [...ALL_LEVEL_IDS];
      progress.save();
      this.sound.playPickupStar();
      if (this.map) this.map.render();
    });
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.sound.resume();

    document.querySelectorAll('.dock-btn').forEach(b => {
      b.classList.toggle('on', b.dataset.tab === tab);
    });

    const views = {
      map: document.getElementById('viewWorldMap'),
      game: document.getElementById('viewActionGame'),
      quiz: document.getElementById('viewQuizArena'),
      profile: document.getElementById('viewProfile')
    };

    Object.entries(views).forEach(([k, el]) => {
      if (el) el.classList.toggle('on', k === tab);
    });

    if (tab === 'map') {
      this.map.startLoop();
    } else {
      this.map.stopLoop();
      if (tab === 'quiz') {
        this.quiz.nextQuestion();
      }
    }
  }

  startLevelFromMap(node) {
    this.switchTab('game');
    if (window.game) {
      window.game.loadLevel(node.id);
      window.game.startGame();
    }
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
  window.suite = new WordysseySuite();
});

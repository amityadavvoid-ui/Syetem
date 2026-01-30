/* ================================
   CORE PLAYER STATE (STABLE + SAFE)
   Modified for Task 2: Suppression Logic
================================ */

const PLAYER_KEY = "solo_player";

/* ---------- LOAD PLAYER ---------- */
function loadPlayer() {
  const saved = localStorage.getItem(PLAYER_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn("Corrupt player data, resetting.");
    }
  }
  return {
    level: 1,
    xp: 0,
    stats: { str:10, agi:10, int:10, vit:10, will:10 }
  };
}

let player = loadPlayer();
let lastLevel = player.level;

/* ---------- SAVE PLAYER ---------- */
function savePlayer() {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
}

/* ---------- XP CURVE ---------- */
function xpNeeded(level) {
  return Math.floor(100 + level * level * 1.2);
}

/* ---------- TITLE LOGIC (UNCHANGED) ---------- */
function getTitle(level) {
  if (level >= 150) return "Grim Reaper";
  if (level >= 100) return "Shadow Monarch";
  if (level >= 71) return "Monarch Candidate";
  if (level >= 50) return "S Rank Hunter";
  if (level >= 30) return "Awakened";
  return "Unawakened";
}

/* ---------- SUPPRESSION CHECK (TASK 2) ---------- */
function isSuppressed() {
  const today = new Date().toDateString();
  const suppressionDate = localStorage.getItem("solo_suppression_date");
  return suppressionDate === today;
}

/* ---------- XP GAIN ---------- */
function gainXP(amount) {
  // TASK 2: Block XP gain if suppressed
  if (isSuppressed() && amount > 0) {
    console.log("XP Gain Blocked: Suppression Active");
    return;
  }

  player.xp += amount;

  while (player.xp >= xpNeeded(player.level)) {
    player.xp -= xpNeeded(player.level);
    player.level++;
  }

  while (player.xp < 0 && player.level > 1) {
    player.level--;
    player.xp += xpNeeded(player.level);
  }

  savePlayer();
  if (typeof updateUI === 'function') updateUI();
  applyLevelGlow(player.level);
  checkLevelChange();
}

/* ---------- LEVEL CHANGE DETECTION ---------- */
function checkLevelChange() {
  if (player.level > lastLevel) {
    const ring = document.getElementById('xpRing');
    if(ring) {
        ring.classList.add('level-up');
        setTimeout(() => ring.classList.remove('level-up'), 500);
    }
    lastLevel = player.level;
  } else if (player.level < lastLevel) {
    const ring = document.getElementById('xpRing');
    if(ring) {
        ring.classList.add('level-down');
        setTimeout(() => ring.classList.remove('level-down'), 500);
    }
    lastLevel = player.level;
  }
}

/* ================================
   LEVEL-BASED GLOW CONTROLLER
   VISUAL ONLY – SAFE (UNCHANGED)
================================ */

function applyLevelGlow(level) {
  const root = document.documentElement;
  const avatarWrapper = document.querySelector('.avatar-wrapper');

  // Remove all level classes
  if (avatarWrapper) {
    avatarWrapper.classList.remove('level-low', 'level-mid', 'level-high', 'level-max');

    let color = "rgba(120,180,255,0.6)";
    let permanent = false;

    if (level >= 150) {
      color = "rgba(180,0,0,0.9)";
      permanent = true;
      avatarWrapper.classList.add('level-max');
    } else if (level >= 100) {
      color = "rgba(40,0,80,0.9)";
      avatarWrapper.classList.add('level-high');
    } else if (level >= 71) {
      color = "rgba(90,0,160,0.8)";
      avatarWrapper.classList.add('level-mid');
    } else if (level >= 50) {
      color = "rgba(200,140,40,0.8)";
      avatarWrapper.classList.add('level-high');
    } else if (level >= 30) {
      color = "rgba(160,80,255,0.7)";
      avatarWrapper.classList.add('level-mid');
    } else if (level >= 10) {
      color = "rgba(0,200,255,0.6)";
      avatarWrapper.classList.add('level-low');
    } else {
      avatarWrapper.classList.add('level-low');
    }

    root.style.setProperty("--glow-color", color);

    document.querySelectorAll(".glow, .glow-permanent").forEach(el => {
      el.classList.remove("glow-permanent");
      if (permanent) el.classList.add("glow-permanent");
    });

    // Apply golden effects to attributes
    if (level >= 50) {
      document.querySelectorAll('.attr').forEach(attr => {
        attr.classList.add('golden');
      });
    } else {
      document.querySelectorAll('.attr').forEach(attr => {
        attr.classList.remove('golden');
      });
    }

    // Golden XP ring
    const xpRing = document.getElementById('xpRing');
    if (xpRing) {
      if (level >= 50) {
        xpRing.classList.add('golden');
      } else {
        xpRing.classList.remove('golden');
      }
    }
  }
}

/* ---------- INITIAL SAVE (IMPORTANT) ---------- */
savePlayer();
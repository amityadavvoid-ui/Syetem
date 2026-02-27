  particle.style.width = size + 'px';
  particle.style.height = size + 'px';

  // Origin: BELOW the viewport
  particle.style.left = Math.random() * 100 + '%';
  particle.style.bottom = '-10vh';

  // Tier-based settings
  let duration, maxOpacity, speedMultiplier;
  if (tier === 3) { // Grim Reaper: Bright, ceremonial, authoritative
    duration = 20000;
    maxOpacity = 0.8;
    speedMultiplier = 0.5; // Slow rise
  } else if (tier === 2) { // Shadow Monarch: Darker, heavy
    duration = 15000;
    maxOpacity = 0.6;
    speedMultiplier = 0.7;
  } else { // Tier 1: Faint, sparse
    duration = 12000;
    maxOpacity = 0.4;
    speedMultiplier = 1.0; // Faster
  }

  // Initial state
  particle.style.opacity = '0';
  particle.style.transform = 'translateY(0)';

  container.appendChild(particle);
  activeParticles.push(particle);

  // Lifecycle Animation Loop
  let startTime = Date.now();

  function update() {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      // End of life
      if (particle.parentNode) particle.parentNode.removeChild(particle);
      activeParticles = activeParticles.filter(p => p !== particle);
      return;
    }

    // Opacity Logic: Fade in -> Sustain -> Fade out
    let currentOpacity = 0;
    if (progress < 0.1) { // Fast fade in (10%)
      currentOpacity = (progress / 0.1) * maxOpacity;
    } else if (progress < 0.9) { // Long sustain (80%)
      currentOpacity = maxOpacity;
    } else { // Fade out (10%)
      currentOpacity = maxOpacity * (1 - (progress - 0.9) / 0.1);
    }

    // Movement Logic: Rise across ENTIRE screen (100vh + buffer)
    // Start at -10vh, move up by 120vh to clear top
    const moveY = -1 * (progress * 120);

    particle.style.opacity = currentOpacity;
    particle.style.transform = `translateY(${moveY}vh)`;

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function initParticleSystem() {
  const container = document.getElementById('bgParticles');
  if (container) container.innerHTML = '';

  setInterval(() => {
    const tier = getNumericTier();
    // Spawn chance
    let spawnChance = 0.3;
    if (tier === 3) spawnChance = 0.5;
    if (tier === 2) spawnChance = 0.4;

    if (Math.random() < spawnChance) {
      spawnParticle();
    }
  }, 800);
}

/* ================================
   ISSUE 2: QUEST XP SCALING (ENVELOPE)
   Override completeQuest to use Weighted Envelope
================================ */

const DAILY_XP_ENVELOPE = 100;

function calculateDailyXP() {
    // 1. Get Active Quests (visible)
    // We assume 'dailyQuests' is global from daily.js
    if (typeof dailyQuests === 'undefined') return;

    // Filter to same logic as render (isQuestVisible is below)
    const activeQuests = dailyQuests.filter(q => isQuestVisible(q));
    const activeCount = activeQuests.length;

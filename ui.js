/* ================================
   UI.JS – FULL IMPLEMENTATION
   System Repair: Particles, Interference, Calendar, Tiers
================================ */

/* ================================
   ISSUE 1: PARTICLE SYSTEM
   Fixed lifecycle, positioning, and tiers
================================ */

const PARTICLE_CAP = 25;
let activeParticles = [];

function getTier() {
  if (player.level >= 150) return 3;
  if (player.level >= 100) return 2;
  return 1;
}

// Helper to check precise sub-tier for Tier 1
function getSubTier() {
  if (player.level >= 71) return '1c';
  if (player.level >= 50) return '1b';
  if (player.level >= 30) return '1a';
  return '1';
}

function spawnParticle() {
  if (activeParticles.length >= PARTICLE_CAP) return;

  const container = document.getElementById('bgParticles');
  if (!container) return;

  const tier = getTier();
  const particle = document.createElement('div');
  particle.className = 'crystal-particle';
  
  // Size variation
  const size = Math.random() * 3 + 2;
  particle.style.width = size + 'px';
  particle.style.height = size + 'px';

  // Random horizontal position
  particle.style.left = Math.random() * 100 + '%';

  // Start BELOW viewport (Issue 1 Requirement)
  particle.style.bottom = '-15vh';
  
  // Tier-based spawn settings
  let duration, opacity;

  // Issue 1: "Motion slightly faster than current but still restrained"
  // Previous: T1=28s, T2=38s, T3=50s
  // Adjusted: Faster = Lower duration
  if (tier === 1) {
    duration = 20000 + Math.random() * 5000; // 20-25s
    opacity = 0.25;
  } else if (tier === 2) {
    duration = 25000 + Math.random() * 8000; // 25-33s
    opacity = 0.35;
  } else {
    duration = 35000 + Math.random() * 10000; // 35-45s
    opacity = 0.45;
  }

  particle.style.opacity = '0';
  container.appendChild(particle);

  activeParticles.push({
    el: particle,
    createdAt: performance.now(),
    duration: duration,
    maxOpacity: opacity,
    fadeInDuration: duration * 0.15, // 15% fade in
    sustainDuration: duration * 0.70  // 70% sustain
    // Remaining 15% fade out
  });
}

function animateParticles(timestamp) {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    const elapsed = timestamp - p.createdAt;

    // Remove when complete
    if (elapsed >= p.duration) {
      if (p.el.parentNode) {
        p.el.parentNode.removeChild(p.el);
      }
      activeParticles.splice(i, 1);
      continue;
    }

    // Calculate opacity
    let currentOpacity;
    if (elapsed < p.fadeInDuration) {
      currentOpacity = (elapsed / p.fadeInDuration) * p.maxOpacity;
    } else if (elapsed < p.fadeInDuration + p.sustainDuration) {
      currentOpacity = p.maxOpacity;
    } else {
      const fadeOutDuration = p.duration - p.fadeInDuration - p.sustainDuration;
      const fadeProgress = (elapsed - p.fadeInDuration - p.sustainDuration) / fadeOutDuration;
      currentOpacity = p.maxOpacity * (1 - fadeProgress);
    }

    // Calculate position (Rise across ENTIRE screen)
    // Start at -15vh, End at 115vh (total 130vh travel)
    const travelDist = 130;
    const progress = elapsed / p.duration;
    const currentBottom = -15 + (progress * travelDist);

    p.el.style.opacity = currentOpacity;
    // We use 'bottom' in style or transform translateY?
    // spawnParticle sets 'bottom: -15vh'.
    // Better to use transform for performance.
    // Let's assume CSS sets `bottom: -15vh` as base, and we translate UP.
    // Actually, `spawnParticle` sets `bottom: -15vh`.
    // Let's just update `transform: translateY(...)`.
    // Moving UP means negative Y.
    // Total distance 130vh.
    const translateY = -(progress * 130);
    p.el.style.transform = `translateY(${translateY}vh)`;
  }

  requestAnimationFrame(animateParticles);
}

function initParticleSystem() {
  requestAnimationFrame(animateParticles);

  setInterval(() => {
    // Tier-based spawn rate
    // T1: faint, sparse (lower rate)
    // T2: heavier (higher rate)
    // T3: ceremonial (medium rate but impactful)
    const tier = getTier();
    let chance = 0.3;
    if (tier === 1) chance = 0.2;
    if (tier === 2) chance = 0.4;

    if (Math.random() < chance) {
      spawnParticle();
    }
  }, 1000);
}

/* ================================
   ISSUE 2, 3: INTERFERENCE & SYSTEM MESSAGE
================================ */

function logInterference(types) {
  const today = new Date().toISOString().split('T')[0];
  const log = JSON.parse(localStorage.getItem('solo_interference_log') || '{}');
  
  if (!log[today]) {
    log[today] = [];
  }
  
  // Issue 3: Multiple types may be selected, append unique
  types.forEach(type => {
    if (!log[today].includes(type)) {
      log[today].push(type);
    }
  });
  
  localStorage.setItem('solo_interference_log', JSON.stringify(log));
  updateSystemMessage();
}

function hasInterferenceToday() {
  const today = new Date().toISOString().split('T')[0];
  const log = JSON.parse(localStorage.getItem('solo_interference_log') || '{}');
  // Issue 3: If >= 1 interference logged -> Day Marked Complete
  return log[today] && log[today].length > 0;
}

function showInterferenceConfirmation() {
  const modal = document.getElementById('systemModal');
  const title = document.getElementById('systemModalTitle');
  const body = document.getElementById('systemModalBody');
  
  if (!modal) return;
  
  title.textContent = 'INTERFERENCE LOGGED';
  title.style.color = '#ef4444';
  body.textContent = 'Interference detected. System unstable.';
  body.style.color = '#e5e5e5';
  body.style.textAlign = 'center';
  body.style.fontSize = '15px';
  modal.classList.remove('hidden');
}

// Bind interference buttons
const btnInterference = document.getElementById('btnInterference');
if (btnInterference) {
  btnInterference.onclick = () => {
    const modal = document.getElementById('interferenceModal');
    if (modal) modal.classList.remove('hidden');
  };
}

const saveInterferenceBtn = document.getElementById('saveInterference');
if (saveInterferenceBtn) {
  saveInterferenceBtn.onclick = () => {
    const checkboxes = document.querySelectorAll('#interferenceList input[type="checkbox"]:checked');
    const types = Array.from(checkboxes).map(cb => cb.value);
    
    if (types.length > 0) {
      logInterference(types);
      showInterferenceConfirmation();
    }
    
    // Clear checkboxes
    document.querySelectorAll('#interferenceList input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });
    
    const modal = document.getElementById('interferenceModal');
    if (modal) modal.classList.add('hidden');
  };
}

const closeInterferenceBtn = document.getElementById('closeInterference');
if (closeInterferenceBtn) {
  closeInterferenceBtn.onclick = () => {
    const modal = document.getElementById('interferenceModal');
    if (modal) modal.classList.add('hidden');
  };
}

function updateSystemMessage() {
  const messageEl = document.getElementById('systemMessage');
  const badgeEl = document.getElementById('systemStatusBadge');
  const panel = document.querySelector('.player-status-panel');
  
  if (!messageEl || !badgeEl || !panel) return;
  
  const suppressed = typeof isSuppressed === 'function' && isSuppressed();
  const interferenceToday = hasInterferenceToday();
  
  panel.classList.remove('state-STABLE', 'state-WARNING', 'state-UNSTABLE', 'state-DEGRADING', 'state-SUPPRESSION');
  
  if (suppressed) {
    badgeEl.textContent = 'SYSTEM STATUS: SUPPRESSION';
    badgeEl.className = 'system-status-badge state-SUPPRESSION';
    messageEl.textContent = 'Reward systems disabled. Suppression active.';
    panel.classList.add('state-SUPPRESSION');
  } else if (interferenceToday) {
    badgeEl.textContent = 'SYSTEM STATUS: UNSTABLE';
    badgeEl.className = 'system-status-badge state-UNSTABLE';
    messageEl.textContent = 'Interference detected. Efficiency compromised.';
    panel.classList.add('state-UNSTABLE');
  } else {
    badgeEl.textContent = 'SYSTEM STATUS: STABLE';
    badgeEl.className = 'system-status-badge state-STABLE';
    messageEl.textContent = 'Systems operational. Continue training.';
    panel.classList.add('state-STABLE');
  }
  
  updateUnknownProgress();
}

/* ================================
   ISSUE 5: UNKNOWN ENTITY PROGRESS
================================ */

function updateUnknownProgress() {
  const unknownProgress = document.getElementById('unknownProgress');
  const unknownProgressValue = document.getElementById('unknownProgressValue');
  const shadowProgress = document.getElementById('shadowProgress');
  const grimProgress = document.getElementById('grimProgress');
  const grimProgressValue = document.getElementById('grimProgressValue');
  
  if (!unknownProgress || !shadowProgress || !grimProgress) return;
  
  const level = player.level;
  
  // Shadow Monarch progress (0-100)
  if (level < 100) {
    unknownProgress.style.display = 'block';
    shadowProgress.style.display = 'none';
    
    const progress = Math.min(level, 100);
    const percentage = (progress / 100 * 100).toFixed(1);
    if (unknownProgressValue) {
      unknownProgressValue.textContent = `Progress: ${percentage}%`;
    }
  } else {
    unknownProgress.style.display = 'none';
    shadowProgress.style.display = 'block';
  }
  
  // Grim Reaper progress (100-150)
  if (level < 100) {
    grimProgress.style.display = 'none';
  } else if (level < 150) {
    grimProgress.style.display = 'block';
    grimProgress.classList.add('locked');
    
    const progress = level - 100;
    const percentage = (progress / 50 * 100).toFixed(1);
    if (grimProgressValue) {
      grimProgressValue.textContent = `Alignment Drift: ${percentage}%`;
    }
  } else {
    grimProgress.style.display = 'block';
    grimProgress.classList.remove('locked');
    if (grimProgressValue) {
      grimProgressValue.textContent = 'Authority Recognized';
    }
  }
}

/* ================================
   ISSUE 8/4: CALENDAR EXPAND & NOTES
================================ */

// Notes Expand
let notesExpanded = false;
const notesTextarea = document.getElementById('systemNotes');
const notesPanel = document.querySelector('.notes-panel');

if (notesPanel && notesTextarea) {
  // Only add if not already present (check specific logic if needed, but safe here)
  // Clean up previous buttons if any (simple implementation)
  const existingBtn = notesPanel.querySelector('button.notes-toggle');
  if (existingBtn) existingBtn.remove();

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'notes-toggle';
  toggleBtn.textContent = 'EXPAND';
  toggleBtn.style.width = 'auto';
  toggleBtn.style.padding = '4px 8px';
  toggleBtn.style.fontSize = '10px';
  toggleBtn.style.marginTop = '8px';
  
  toggleBtn.onclick = () => {
    notesExpanded = !notesExpanded;
    if (notesExpanded) {
      notesTextarea.style.height = '400px';
      toggleBtn.textContent = 'COLLAPSE';
    } else {
      notesTextarea.style.height = '100px';
      toggleBtn.textContent = 'EXPAND';
    }
  };
  
  notesPanel.appendChild(toggleBtn);
  
  const savedNotes = localStorage.getItem('solo_system_notes');
  if (savedNotes) {
    notesTextarea.value = savedNotes;
  }
  
  notesTextarea.addEventListener('input', () => {
    localStorage.setItem('solo_system_notes', notesTextarea.value);
  });
}

// Issue 4: Calendar Expand
const toggleCalendarBtn = document.getElementById('toggleCalendarBtn');
const streakCalendar = document.getElementById('streakCalendar');

if (toggleCalendarBtn && streakCalendar) {
  toggleCalendarBtn.onclick = () => {
    // Toggle class
    streakCalendar.classList.toggle('expanded');

    // Update button text
    if (streakCalendar.classList.contains('expanded')) {
      toggleCalendarBtn.textContent = 'COLLAPSE';
    } else {
      toggleCalendarBtn.textContent = 'EXPAND';
    }
  };
}

/* ================================
   MAIN UI UPDATE & ISSUE 5 (TIERS)
================================ */

function updateUI() {
  const levelCenter = document.getElementById('levelCenter');
  const levelTextInline = document.getElementById('levelTextInline');
  const xpText = document.getElementById('xpText');
  const xpRing = document.getElementById('xpRing');
  
  if (levelCenter) levelCenter.textContent = player.level;
  if (levelTextInline) levelTextInline.textContent = player.level;
  
  const needed = xpNeeded(player.level);
  if (xpText) {
    xpText.textContent = `XP ${player.xp} / ${needed}`;
  }
  
  if (xpRing) {
    const percent = (player.xp / needed) * 100;
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (percent / 100) * circumference;
    xpRing.style.strokeDashoffset = offset;
  }
  
  const stats = ['str', 'agi', 'int', 'vit', 'will'];
  stats.forEach(stat => {
    const val = player.stats[stat] || 0;
    const valEl = document.getElementById(stat + 'Val');
    const barEl = document.getElementById(stat + 'Bar');
    
    if (valEl) valEl.textContent = val;
    if (barEl) {
      const percent = Math.min((val / 100) * 100, 100);
      barEl.style.width = percent + '%';
    }
  });
  
  const title = getTitle(player.level);
  const playerTitle = document.getElementById('playerTitle');
  const titleMeta = document.getElementById('titleMeta');
  if (playerTitle) playerTitle.textContent = title;
  if (titleMeta) titleMeta.textContent = title;
  
  const rankText = document.getElementById('rankText');
  if (rankText) {
    let rank = 'E';
    if (player.level >= 150) rank = 'SSS';
    else if (player.level >= 120) rank = 'SS';
    else if (player.level >= 100) rank = 'S';
    else if (player.level >= 80) rank = 'A';
    else if (player.level >= 60) rank = 'B';
    else if (player.level >= 40) rank = 'C';
    else if (player.level >= 20) rank = 'D';
    
    rankText.innerHTML = `Rank ${rank} · Level <span>${player.level}</span>`;
  }
  
  // Issue 5: Tier & Sub-tier Classes
  const tier = getTier();
  const subTier = getSubTier();

  document.body.className = '';

  if (tier === 3) {
    document.body.classList.add('tier-3');
  } else if (tier === 2) {
    document.body.classList.add('tier-2');
  } else {
    // Tier 1 Logic
    document.body.classList.add('tier-1');
    document.body.classList.add(`tier-${subTier}`);
  }
  
  updateSystemMessage();
}

/* ================================
   AVATAR UPLOAD
================================ */

const avatarImage = document.getElementById('avatarImage');
const avatarInput = document.getElementById('avatarInput');

if (avatarImage && avatarInput) {
  avatarImage.onclick = () => avatarInput.click();
  
  avatarInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        avatarImage.src = dataUrl;
        localStorage.setItem('solo_avatar', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const savedAvatar = localStorage.getItem('solo_avatar');
  if (savedAvatar) {
    avatarImage.src = savedAvatar;
  }
}

/* ================================
   COSMIC STARS
================================ */

function initCosmicStars() {
  const container = document.getElementById('cosmic-stars');
  if (!container) return;
  
  for (let i = 0; i < 40; i++) {
    const star = document.createElement('div');
    star.className = 'cosmic-star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDuration = (Math.random() * 40 + 80) + 's';
    star.style.animationDelay = Math.random() * -80 + 's';
    container.appendChild(star);
  }
}

/* ================================
   INITIALIZATION
================================ */

document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  initParticleSystem();
  initCosmicStars();
  
  const todayStr = new Date().toDateString();
  const lastPenaltyDate = localStorage.getItem('solo_last_penalty_date');
  
  if (lastPenaltyDate === todayStr) {
    const penaltyModal = document.getElementById('penaltyModal');
    if (penaltyModal) {
      penaltyModal.classList.remove('hidden');
      
      const closeBtn = document.getElementById('closePenaltyModal');
      if (closeBtn) {
        closeBtn.onclick = () => {
          penaltyModal.classList.add('hidden');
          localStorage.removeItem('solo_last_penalty_date');
        };
      }
    }
  }
});

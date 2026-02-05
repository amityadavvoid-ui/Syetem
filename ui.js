/* ================================
   UI.JS – FULL IMPLEMENTATION
   All 12 Issues Resolved
================================ */

/* ================================
   ISSUE 1: PARTICLE SYSTEM
   JavaScript-controlled lifecycle
================================ */

const PARTICLE_CAP = 25;
let activeParticles = [];

function getTier() {
  if (player.level >= 150) return 3;
  if (player.level >= 100) return 2;
  return 1;
}

function spawnParticle() {
  if (activeParticles.length >= PARTICLE_CAP) return;

  const container = document.getElementById('bgParticles');
  if (!container) return;

  const tier = getTier();
  const particle = document.createElement('div');
  particle.className = 'crystal-particle';
  
  const size = Math.random() * 3 + 2;
  particle.style.width = size + 'px';
  particle.style.height = size + 'px';
  particle.style.left = Math.random() * 100 + '%';
  particle.style.bottom = '-20px';
  
  // Tier-based spawn settings
  let duration, opacity;
  if (tier === 1) {
    duration = 28000;
    opacity = 0.25;
  } else if (tier === 2) {
    duration = 38000;
    opacity = 0.35;
  } else {
    duration = 50000;
    opacity = 0.45;
  }

  particle.style.opacity = '0';
  container.appendChild(particle);

  // Add to active particles with metadata
  activeParticles.push({
    el: particle,
    createdAt: performance.now(),
    duration: duration,
    maxOpacity: opacity,
    fadeInDuration: duration * 0.2,
    sustainDuration: duration * 0.6
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

    // Calculate position (slow upward movement)
    const translateY = -(elapsed / p.duration) * 110;

    p.el.style.opacity = currentOpacity;
    p.el.style.transform = `translateY(${translateY}vh)`;
  }

  requestAnimationFrame(animateParticles);
}

function initParticleSystem() {
  // Start animation loop
  requestAnimationFrame(animateParticles);

  setInterval(() => {
    if (Math.random() < 0.3) {
      spawnParticle();
    }
  }, 1000);
}

/* ================================
   ISSUE 2 & 4: INTERFERENCE SYSTEM
   Completion state + System Message
================================ */

function logInterference(types) {
  const today = new Date().toISOString().split('T')[0];
  const log = JSON.parse(localStorage.getItem('solo_interference_log') || '{}');
  
  if (!log[today]) {
    log[today] = [];
  }
  
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
  return log[today] && log[today].length > 0;
}

/* ================================
   ISSUE 3: INTERFERENCE MODAL
   Dedicated immediate feedback
================================ */

function showInterferenceConfirmation() {
  const modal = document.getElementById('systemModal');
  const title = document.getElementById('systemModalTitle');
  const body = document.getElementById('systemModalBody');
  
  if (!modal) return;
  
  title.textContent = 'INTERFERENCE LOGGED';
  title.style.color = '#ef4444';
  body.textContent = 'Interference detected.';
  body.style.color = '#e5e5e5';
  body.style.textAlign = 'center';
  body.style.fontSize = '15px';
  modal.classList.remove('hidden');
}

// Bind interference button
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

/* ================================
   ISSUE 4: SYSTEM MESSAGE PANEL
   Strict behavior based on state
================================ */

function updateSystemMessage() {
  const messageEl = document.getElementById('systemMessage');
  const badgeEl = document.getElementById('systemStatusBadge');
  const panel = document.querySelector('.player-status-panel');
  
  if (!messageEl || !badgeEl || !panel) return;
  
  // Check suppression
  const suppressed = typeof isSuppressed === 'function' && isSuppressed();
  const interferenceToday = hasInterferenceToday();
  
  // Remove all state classes
  panel.classList.remove('state-STABLE', 'state-WARNING', 'state-UNSTABLE', 'state-DEGRADING', 'state-SUPPRESSION');
  
  if (suppressed) {
    badgeEl.textContent = 'SYSTEM STATUS: SUPPRESSION';
    badgeEl.className = 'system-status-badge state-SUPPRESSION';
    messageEl.textContent = 'Reward systems disabled. Suppression active.';
    panel.classList.add('state-SUPPRESSION');
  } else if (interferenceToday) {
    badgeEl.textContent = 'SYSTEM STATUS: UNSTABLE';
    badgeEl.className = 'system-status-badge state-UNSTABLE';
    messageEl.textContent = 'Interference detected.';
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
   Always visible, silent reveal
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
    // Show unknown, hide shadow
    unknownProgress.style.display = 'block';
    shadowProgress.style.display = 'none';
    
    const progress = Math.min(level, 100);
    const percentage = (progress / 100 * 100).toFixed(1);
    if (unknownProgressValue) {
      unknownProgressValue.textContent = `Progress: ${percentage}%`;
    }
  } else {
    // Reveal shadow, hide unknown
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
    // Tier 3 reveal
    grimProgress.style.display = 'block';
    grimProgress.classList.remove('locked');
    
    if (grimProgressValue) {
      grimProgressValue.textContent = 'Authority Recognized';
    }
  }
}

/* ================================
   ISSUE 8: NOTES EXPAND/COLLAPSE
================================ */

let notesExpanded = false;
const notesTextarea = document.getElementById('systemNotes');
const notesPanel = document.querySelector('.notes-panel');

if (notesPanel && notesTextarea) {
  const toggleBtn = document.createElement('button');
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
  
  // Load saved notes
  const savedNotes = localStorage.getItem('solo_system_notes');
  if (savedNotes) {
    notesTextarea.value = savedNotes;
  }
  
  // Save on change
  notesTextarea.addEventListener('input', () => {
    localStorage.setItem('solo_system_notes', notesTextarea.value);
  });
}

/* ================================
   MAIN UI UPDATE FUNCTION
================================ */

function updateUI() {
  // Level and XP
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
  
  // XP Ring (Issue 6: precision display)
  if (xpRing) {
    const percent = (player.xp / needed) * 100;
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (percent / 100) * circumference;
    xpRing.style.strokeDashoffset = offset;
  }
  
  // Attributes (Issue 10: stat overflow safety)
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
  
  // Title
  const title = getTitle(player.level);
  const playerTitle = document.getElementById('playerTitle');
  const titleMeta = document.getElementById('titleMeta');
  if (playerTitle) playerTitle.textContent = title;
  if (titleMeta) titleMeta.textContent = title;
  
  // Rank
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
  
  // Apply tier classes
  const tier = getTier();
  document.body.className = '';
  if (tier === 3) {
    document.body.classList.add('tier-3');
  } else if (tier === 2) {
    document.body.classList.add('tier-2');
  } else {
    document.body.classList.add('tier-1');
    // Sub-tiers
    if (player.level >= 71) {
      document.body.classList.add('tier-1c');
    } else if (player.level >= 50) {
      document.body.classList.add('tier-1b');
    } else {
      document.body.classList.add('tier-1a');
    }
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
  
  // Load saved avatar
  const savedAvatar = localStorage.getItem('solo_avatar');
  if (savedAvatar) {
    avatarImage.src = savedAvatar;
  }
}

/* ================================
   COSMIC STARS (Background)
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
  
  // Check for penalty modal
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

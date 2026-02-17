/* ================================
   UI.JS – SYSTEM INTERFACE CONTROLLER
   Overriding and Enhancing Core Systems
================================ */

/* ================================
   TIER LOGIC (STRICT)
================================ */

function getExtendedTier() {
  // Safety check for player object
  if (typeof player === 'undefined') return '1';

  const level = player.level;
  if (level >= 150) return '3';    // Grim Reaper
  if (level >= 100) return '2';    // Shadow Monarch
  if (level >= 71) return '1c';    // Monarch Candidate
  if (level >= 50) return '1b';    // S Rank Hunter
  if (level >= 30) return '1a';    // Awakened
  return '1';                      // Unawakened (Base)
}

function getNumericTier() {
  const t = getExtendedTier();
  if (t === '3') return 3;
  if (t === '2') return 2;
  return 1;
}

/* ================================
   ISSUE 1: PARTICLE SYSTEM (STRICT)
   Full Screen Rise, Origin Below, Hard Cap
================================ */

const PARTICLE_CAP = 25;
let activeParticles = [];

function updateParticlesLoop() {
  const now = Date.now();

  // Iterate backwards to safely remove items
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    const elapsed = now - p.startTime;
    const progress = elapsed / p.duration;

    if (progress >= 1) {
      // End of life
      if (p.element.parentNode) p.element.parentNode.removeChild(p.element);
      activeParticles.splice(i, 1);
      continue;
    }

    // Opacity Logic: Fade in -> Sustain -> Fade out
    let currentOpacity = 0;
    if (progress < 0.1) { // Fast fade in (10%)
      currentOpacity = (progress / 0.1) * p.maxOpacity;
    } else if (progress < 0.9) { // Long sustain (80%)
      currentOpacity = p.maxOpacity;
    } else { // Fade out (10%)
      currentOpacity = p.maxOpacity * (1 - (progress - 0.9) / 0.1);
    }

    // Movement Logic: Rise across ENTIRE screen (100vh + buffer)
    // Start at -10vh, move up by 120vh to clear top
    const moveY = -1 * (progress * 120);

    p.element.style.opacity = currentOpacity;
    p.element.style.transform = `translateY(${moveY}vh)`;
  }

  requestAnimationFrame(updateParticlesLoop);
}

function spawnParticle() {
  if (activeParticles.length >= PARTICLE_CAP) return;

  const container = document.getElementById('bgParticles');
  if (!container) return;

  const tier = getNumericTier(); // 1, 2, or 3
  const particle = document.createElement('div');
  particle.className = 'crystal-particle';
  
  // Randomize size
  const size = Math.random() * 3 + 2; // 2px to 5px
  particle.style.width = size + 'px';
  particle.style.height = size + 'px';

  // Origin: BELOW the viewport
  particle.style.left = Math.random() * 100 + '%';
  particle.style.bottom = '-10vh';
  
  // Tier-based settings
  let duration, maxOpacity;
  if (tier === 3) { // Grim Reaper: Bright, ceremonial, authoritative
    duration = 20000;
    maxOpacity = 0.8;
  } else if (tier === 2) { // Shadow Monarch: Darker, heavy
    duration = 15000;
    maxOpacity = 0.6;
  } else { // Tier 1: Faint, sparse
    duration = 12000;
    maxOpacity = 0.4;
  }

  // Initial state
  particle.style.opacity = '0';
  particle.style.transform = 'translateY(0)';

  container.appendChild(particle);

  activeParticles.push({
    element: particle,
    startTime: Date.now(),
    duration: duration,
    maxOpacity: maxOpacity
  });
}

function initParticleSystem() {
  const container = document.getElementById('bgParticles');
  if (container) container.innerHTML = '';

  // Start centralized loop
  requestAnimationFrame(updateParticlesLoop);

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

    if (activeCount === 0) return;

    // 2. Compute MAX POSSIBLE WEIGHT
    // maxWeight = (number of active quests) × 1.20
    const maxPossibleWeight = activeCount * 1.20;

    // 3. Sum completed weights
    let completedWeight = 0;
    activeQuests.forEach(q => {
        if (q.completed) {
            let w = 1.0; // Normal
            if (q.importance === 'important') w = 1.1;
            if (q.importance === 'critical') w = 1.2;
            completedWeight += w;
        }
    });

    // 4. Compute efficiency
    // efficiency = completedWeight / maxWeight
    const efficiency = completedWeight / maxPossibleWeight;

    // 5. Final XP Target
    // XP = dailyEnvelope × efficiency
    // Floor to integer
    const targetXP = Math.floor(DAILY_XP_ENVELOPE * efficiency);

    // 6. Incremental Grant
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('solo_xp_date');
    let awarded = parseInt(localStorage.getItem('solo_daily_xp_awarded') || '0');

    // Reset if new day
    if (lastDate !== today) {
        awarded = 0;
        localStorage.setItem('solo_xp_date', today);
        localStorage.setItem('solo_daily_xp_awarded', '0');
    }

    const delta = targetXP - awarded;

    if (delta > 0) {
        gainXP(delta);
        localStorage.setItem('solo_daily_xp_awarded', awarded + delta);
    }
}

// Override completeQuest from daily.js
window.completeQuest = function(index) {
  if (typeof dailyQuests === 'undefined') return;
  const quest = dailyQuests[index];
  if (!quest || quest.completed) return;

  quest.completed = true;

  // Stat Reward (Standard +1) - Blocked if suppressed
  if (typeof isSuppressed === 'function' && isSuppressed()) {
      console.log("Stat Gain Blocked: Suppression Active");
  } else {
      const statKey = quest.stat.toLowerCase();
      if (player.stats[statKey] !== undefined) {
        player.stats[statKey] += 1;
      }
  }

  // XP Reward (Envelope System)
  calculateDailyXP();

  saveQuests();
  updateUI();
  if (typeof renderQuests === 'function') renderQuests();
  checkStreak();
};

/* ================================
   ISSUE 3: INTERFERENCE & DAY COMPLETION
================================ */

function logInterference(types) {
  const todayISO = new Date().toISOString().split('T')[0];
  const log = JSON.parse(localStorage.getItem('solo_interference_log') || '{}');
  
  if (!log[todayISO]) {
    log[todayISO] = [];
  }
  
  let newLog = false;
  types.forEach(type => {
    if (!log[todayISO].includes(type)) {
      log[todayISO].push(type);
      newLog = true;
    }
  });
  
  if (newLog) {
      localStorage.setItem('solo_interference_log', JSON.stringify(log));
      updateSystemMessage();
      showInterferenceConfirmation();

      // ISSUE 3: Mark Day Complete if Interference Logged
      const todayDate = new Date().toDateString();
      const streaks = JSON.parse(localStorage.getItem("dailyStreaks") || "{}");
      if (!streaks[todayDate]) {
          streaks[todayDate] = true;
          localStorage.setItem("dailyStreaks", JSON.stringify(streaks));
          // Update calendar if visible
          if (typeof renderStreakCalendar === 'function') renderStreakCalendar();
      }
  }
}

function hasInterferenceToday() {
  const today = new Date().toISOString().split('T')[0];
  const log = JSON.parse(localStorage.getItem('solo_interference_log') || '{}');
  return log[today] && log[today].length > 0;
}

function showInterferenceConfirmation() {
  let modal = document.getElementById('dedicatedInterferenceModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'dedicatedInterferenceModal';
    modal.className = 'modal';
    modal.style.zIndex = '2000';
    modal.innerHTML = `
      <div class="modal-content" style="border-color: #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);">
        <h3 style="color: #ef4444; margin-bottom: 10px;">INTERFERENCE LOGGED</h3>
        <p style="color: #cbd5e1; text-align: center; margin-bottom: 20px;">Day marked complete. No XP gained.</p>
        <button id="dismissInterference" style="border-color: #ef4444; color: #ef4444;">ACKNOWLEDGE</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('dismissInterference').onclick = () => modal.remove();
  }
}

// Bind Interference Buttons
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
    }
    
    document.querySelectorAll('#interferenceList input[type="checkbox"]').forEach(cb => cb.checked = false);
    const modal = document.getElementById('interferenceModal');
    if (modal) modal.classList.add('hidden');
  };
}

/* ================================
   ISSUE 4: CALENDAR EXPAND (VERTICAL)
================================ */

let isCalendarExpandedUI = false;

window.renderStreakCalendar = function() {
  const streakContainer = document.getElementById("streakCalendar");
  const currentStreakEl = document.getElementById("currentStreak");
  const maxStreakEl = document.getElementById("maxStreak");

  if (!streakContainer) return;

  const STREAK_KEY = "dailyStreaks"; // Use the key from daily.js logic (checked in completeQuest)
  // Wait, daily.js usually uses "dailyStreaks". ui.js earlier used "solo_streak_days".
  // Let's stick to what completeQuest updates: "dailyStreaks".
  const streaks = JSON.parse(localStorage.getItem("dailyStreaks")) || {};

  streakContainer.innerHTML = "";

  // ISSUE 4: Class for expansion
  if (isCalendarExpandedUI) {
      streakContainer.classList.add('expanded');
  } else {
      streakContainer.classList.remove('expanded');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ISSUE 4: 365 days when expanded
  const daysToShow = isCalendarExpandedUI ? 365 : 30;

  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStr = d.toDateString(); // Matches dailyStreaks key
    const dayNum = d.getDate();
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });

    const wrapper = document.createElement("div");
    wrapper.className = "calendar-day-wrapper";

    const label = document.createElement("div");
    label.className = "calendar-day-label";
    label.textContent = dayName;

    const dayEl = document.createElement("div");
    dayEl.className = "calendar-day";
    dayEl.textContent = dayNum;

    if (streaks[dayStr]) {
      dayEl.classList.add("completed");
    }

    if (d.getTime() === today.getTime()) {
      dayEl.classList.add("today");
    }

    wrapper.appendChild(label);
    wrapper.appendChild(dayEl);
    streakContainer.appendChild(wrapper);
  }

  if (!isCalendarExpandedUI) {
      // Scroll to end (today) only in strip view
      setTimeout(() => {
        streakContainer.scrollLeft = streakContainer.scrollWidth;
      }, 100);
  } else {
      // In expanded view, maybe scroll to bottom?
      setTimeout(() => {
        streakContainer.scrollTop = streakContainer.scrollHeight;
      }, 100);
  }

  // Calculate Stats (Basic)
  // ... (Simplified logic for display) ...
  // We can just count current streak here or assume streak.js handles it.
  // The original ui.js had some logic. Let's preserve basic display updates if elements exist.
  // Actually, let's defer to streak.js if it exists, but ui.js overrides it.
  // We need to calculate it.

  if (currentStreakEl || maxStreakEl) {
      const sortedDates = Object.keys(streaks).map(d => new Date(d).getTime()).sort((a,b) => a-b);
      let current = 0;
      let max = 0;
      let temp = 0;

      if (sortedDates.length > 0) {
          // Max Streak
          for (let i = 0; i < sortedDates.length; i++) {
              if (i === 0) {
                  temp = 1;
              } else {
                  const diff = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24);
                  if (Math.round(diff) === 1) temp++;
                  else {
                      if (temp > max) max = temp;
                      temp = 1;
                  }
              }
          }
          if (temp > max) max = temp;

          // Current Streak
          const todayTime = new Date().setHours(0,0,0,0);
          const yesterdayTime = todayTime - (1000 * 60 * 60 * 24);

          if (streaks[new Date(todayTime).toDateString()] || streaks[new Date(yesterdayTime).toDateString()]) {
             let count = 1;
             for (let i = sortedDates.length - 2; i >= 0; i--) {
                 const diff = (sortedDates[i+1] - sortedDates[i]) / (1000 * 60 * 60 * 24);
                 if (Math.round(diff) === 1) count++;
                 else break;
             }
             current = count;
          }
      }

      if (currentStreakEl) currentStreakEl.textContent = current;
      if (maxStreakEl) maxStreakEl.textContent = max;
  }
};

function bindCalendarToggle() {
    const toggleBtn = document.getElementById("toggleCalendarBtn");
    if (toggleBtn) {
        const newBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

        newBtn.addEventListener("click", () => {
            isCalendarExpandedUI = !isCalendarExpandedUI;
            newBtn.textContent = isCalendarExpandedUI ? "COLLAPSE" : "EXPAND";
            renderStreakCalendar();
        });
    }
}

/* ================================
   ISSUE 5: UI COLOR AUTHORITY
================================ */

function updateUI() {
  // 1. Apply Tier Classes (Strict)
  const extTier = getExtendedTier();
  document.body.className = ''; // Reset
  document.body.classList.add('tier-' + extTier); // tier-1, tier-1a, tier-2, etc.

  // Also add base tier for CSS fallback if needed
  if (extTier.startsWith('1')) document.body.classList.add('tier-1');

  // 2. Update Text/Stats
  if (typeof player !== 'undefined') {
      const levelCenter = document.getElementById('levelCenter');
      const levelTextInline = document.getElementById('levelTextInline');
      const xpText = document.getElementById('xpText');
      const xpRing = document.getElementById('xpRing');

      if (levelCenter) levelCenter.textContent = player.level;
      if (levelTextInline) levelTextInline.textContent = player.level;

      const needed = (typeof xpNeeded === 'function') ? xpNeeded(player.level) : 100;
      if (xpText) {
          const pct = ((player.xp / needed) * 100).toFixed(1);
          xpText.textContent = `XP ${player.xp} / ${needed} (${pct}%)`;
      }
      if (xpRing) {
          const percent = (player.xp / needed) * 100;
          const circumference = 2 * Math.PI * 60;
          const offset = circumference - (percent / 100) * circumference;
          xpRing.style.strokeDashoffset = offset;
      }

      // Update Attributes
      const stats = ['str', 'agi', 'int', 'vit', 'will'];
      stats.forEach(stat => {
          if (player.stats && player.stats[stat] !== undefined) {
              const val = player.stats[stat];
              const valEl = document.getElementById(stat + 'Val');
              const barEl = document.getElementById(stat + 'Bar');
              if (valEl) valEl.textContent = val;
              if (barEl) {
                  const percent = Math.min((val / 100) * 100, 100);
                  barEl.style.width = percent + '%';
              }
          }
      });

      // Update Titles
      const title = (typeof getTitle === 'function') ? getTitle(player.level) : 'System';
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
  }

  updateSystemMessage();
}

// Strict System Message
function updateSystemMessage() {
  const messageEl = document.getElementById('systemMessage');
  const badgeEl = document.getElementById('systemStatusBadge');
  const panel = document.querySelector('.player-status-panel');

  if (!messageEl || !badgeEl || !panel) return;

  const interference = hasInterferenceToday();
  const suppressed = typeof isSuppressed === 'function' && isSuppressed();

  panel.classList.remove('state-STABLE', 'state-WARNING', 'state-UNSTABLE', 'state-DEGRADING', 'state-SUPPRESSION');

  if (suppressed) {
    badgeEl.textContent = 'SYSTEM STATUS: SUPPRESSION';
    badgeEl.className = 'system-status-badge state-SUPPRESSION';
    messageEl.textContent = 'Reward systems disabled.';
    panel.classList.add('state-SUPPRESSION');
    panel.style.display = 'block';
  } else if (interference) {
    badgeEl.textContent = 'SYSTEM STATUS: UNSTABLE';
    badgeEl.className = 'system-status-badge state-UNSTABLE';
    messageEl.textContent = 'Interference detected.';
    panel.classList.add('state-UNSTABLE');
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }

  updateUnknownProgress();
}

function updateUnknownProgress() {
    // ... (Existing logic for progress reveals) ...
    const unknownProgress = document.getElementById('unknownProgress');
    const unknownValue = document.getElementById('unknownProgressValue');
    const shadowProgress = document.getElementById('shadowProgress');
    const grimProgress = document.getElementById('grimProgress');
    const grimValue = document.getElementById('grimProgressValue');

    if (!unknownProgress || !shadowProgress || !grimProgress || typeof player === 'undefined') return;

    if (player.level < 100) {
        unknownProgress.style.display = 'block';
        shadowProgress.style.display = 'none';
        unknownProgress.classList.remove('revealed');
        if (unknownValue) unknownValue.textContent = `Progress: ${Math.min(player.level, 100).toFixed(1)}%`;
        const label = unknownProgress.querySelector('.locked-label');
        if (label) label.style.visibility = 'hidden';
    } else {
        unknownProgress.style.display = 'none';
        shadowProgress.style.display = 'block';
    }

    grimProgress.style.display = 'block';
    if (player.level < 150) {
        grimProgress.classList.add('locked');
        if (grimValue) {
            const prog = Math.max(0, player.level - 100);
            const pct = Math.min((prog / 50) * 100, 100).toFixed(1);
            grimValue.textContent = `Alignment Drift: ${pct}%`;
        }
        const label = grimProgress.querySelector('.locked-label');
        if (label) label.style.visibility = 'hidden';
    } else {
        grimProgress.classList.remove('locked');
        if (grimValue) grimValue.textContent = 'Authority Recognized';
        const label = grimProgress.querySelector('.locked-label');
        if (label) {
            label.style.visibility = 'visible';
            label.textContent = 'GRIM REAPER';
        }
    }
}

// NOTES
const notesTextarea = document.getElementById('systemNotes');
const notesPanel = document.querySelector('.notes-panel');

if (notesPanel && notesTextarea) {
  let toggleBtn = notesPanel.querySelector('#toggleNotesBtn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggleNotesBtn';
    toggleBtn.textContent = 'EXPAND';
    toggleBtn.style.width = 'auto';
    toggleBtn.style.padding = '4px 8px';
    toggleBtn.style.fontSize = '10px';
    toggleBtn.style.marginTop = '8px';
    toggleBtn.style.float = 'right';
    notesPanel.appendChild(toggleBtn);
  }

  let notesExpanded = false;
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

  const savedNotes = localStorage.getItem('solo_system_notes');
  if (savedNotes) notesTextarea.value = savedNotes;
  
  notesTextarea.addEventListener('input', () => {
    localStorage.setItem('solo_system_notes', notesTextarea.value);
  });
}

// QUEST HELPERS
function isQuestVisible(quest) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const cadence = quest.cadence || 'daily';

  if (cadence === 'daily') return true;
  if (cadence === 'alternate') {
    if (!quest.createdDate) return true;
    const created = new Date(quest.createdDate);
    created.setHours(0,0,0,0);
    const diffDays = Math.round(Math.abs(today - created) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays % 2 !== 0;
  }
  if (cadence === 'specific') {
    if (!quest.targetDate) return false;
    const target = new Date(quest.targetDate);
    target.setHours(0,0,0,0);
    if (today < target) return false;
    if (today.getTime() === target.getTime()) return true;
    if (quest.repeatMode === 'daily') return true;
    if (quest.repeatMode === 'alternate') {
       const diffDays = Math.round(Math.abs(today - target) / (1000 * 60 * 60 * 24));
       return diffDays > 0 && diffDays % 2 !== 0;
    }
    return false;
  }
  return true;
}

window.renderQuests = function() {
  const dailyList = document.getElementById("dailyList");
  const questCount = document.getElementById("questCount");

  if (!dailyList || typeof dailyQuests === 'undefined') return;
  dailyList.innerHTML = "";

  const visibleQuests = dailyQuests.map((q, i) => ({...q, originalIndex: i}))
                                   .filter(q => isQuestVisible(q));

  visibleQuests.forEach((quest) => {
    const div = document.createElement("div");
    div.className = "quest-item";

    if (quest.importance === 'important') div.classList.add('quest-important');
    if (quest.importance === 'critical') div.classList.add('quest-critical');
    if (quest.completed) div.classList.add("completed");

    div.innerHTML = `
      <div class="quest-info">
        <span class="quest-name"></span>
        <span class="quest-reward">+1 ${quest.stat}</span>
      </div>
      ${quest.cadence === 'alternate' ? '<span class="quest-tag">ALT</span>' : ''}
      ${quest.cadence === 'specific' ? '<span class="quest-tag">DATE</span>' : ''}
    `;

    div.querySelector('.quest-name').textContent = quest.name;

    div.addEventListener("click", () => {
        completeQuest(quest.originalIndex);
    });

    div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openQuestModal(quest.originalIndex);
    });

    dailyList.appendChild(div);
  });

  if (questCount) {
      questCount.textContent = `Active Tasks: ${visibleQuests.length}`;
  }
};

window.openQuestModal = function(index) {
  const modal = document.getElementById("questModal");
  const input = document.getElementById("editQuestInput");
  const statSelect = document.getElementById("editQuestStat");
  const modalTitle = document.getElementById("modalTitle");

  if (!modal || !input) return;

  // ... (Ensure controls exist logic, same as previous) ...
  let extraControls = document.getElementById('questExtraControls');
  if (!extraControls) {
    extraControls = document.createElement('div');
    extraControls.id = 'questExtraControls';
    extraControls.style.marginBottom = '16px';
    extraControls.innerHTML = `
      <div style="margin-bottom:8px;">
        <label style="color:#6c7a89; font-size:10px; display:block; margin-bottom:4px;">IMPORTANCE</label>
        <select id="questImportance" style="width:100%; background:rgba(0,0,0,0.4); color:#fff; padding:8px; border:1px solid rgba(255,255,255,0.1); border-radius:4px;">
          <option value="normal">Normal</option>
          <option value="important">Important</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div style="margin-bottom:8px;">
        <label style="color:#6c7a89; font-size:10px; display:block; margin-bottom:4px;">CADENCE</label>
        <select id="questCadence" style="width:100%; background:rgba(0,0,0,0.4); color:#fff; padding:8px; border:1px solid rgba(255,255,255,0.1); border-radius:4px;">
          <option value="daily">Daily</option>
          <option value="alternate">Alternate Day</option>
          <option value="specific">Specific Date</option>
        </select>
      </div>
      <div id="questDateContainer" style="display:none; margin-bottom:8px;">
        <label style="color:#6c7a89; font-size:10px; display:block; margin-bottom:4px;">TARGET DATE</label>
        <input type="date" id="questTargetDate" style="width:100%; background:rgba(0,0,0,0.4); color:#fff; padding:8px; border:1px solid rgba(255,255,255,0.1); border-radius:4px;">
        <label style="color:#6c7a89; font-size:10px; display:block; margin-top:4px; margin-bottom:4px;">REPEAT AFTER DATE?</label>
        <select id="questRepeat" style="width:100%; background:rgba(0,0,0,0.4); color:#fff; padding:8px; border:1px solid rgba(255,255,255,0.1); border-radius:4px;">
          <option value="none">None (One-time)</option>
          <option value="daily">Daily</option>
          <option value="alternate">Alternate Day</option>
        </select>
      </div>
    `;
    const buttons = modal.querySelector('.modal-buttons');
    modal.querySelector('.modal-content').insertBefore(extraControls, buttons);

    const cadenceSelect = document.getElementById('questCadence');
    cadenceSelect.onchange = () => {
      document.getElementById('questDateContainer').style.display =
        cadenceSelect.value === 'specific' ? 'block' : 'none';
    };
  }

  const importanceSel = document.getElementById('questImportance');
  const cadenceSel = document.getElementById('questCadence');
  const dateInput = document.getElementById('questTargetDate');
  const repeatSel = document.getElementById('questRepeat');
  const dateContainer = document.getElementById('questDateContainer');

  if (index === -1) {
    modalTitle.textContent = "NEW QUEST";
    input.value = "";
    statSelect.style.display = "block";
    importanceSel.value = 'normal';
    cadenceSel.value = 'daily';
    dateInput.value = '';
    repeatSel.value = 'none';
    dateContainer.style.display = 'none';
    if (document.getElementById("deleteQuest")) document.getElementById("deleteQuest").style.display = "none";
  } else {
    const q = dailyQuests[index];
    modalTitle.textContent = "EDIT QUEST";
    input.value = q.name;
    statSelect.style.display = "none";
    importanceSel.value = q.importance || 'normal';
    cadenceSel.value = q.cadence || 'daily';
    dateInput.value = q.targetDate || '';
    repeatSel.value = q.repeatMode || 'none';
    dateContainer.style.display = q.cadence === 'specific' ? 'block' : 'none';
    if (document.getElementById("deleteQuest")) document.getElementById("deleteQuest").style.display = "block";
  }

  const saveBtn = document.getElementById("saveQuestEdit");
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

  newSaveBtn.onclick = () => {
      const name = input.value.trim();
      if (!name) return;

      const newQuestData = {
          name,
          importance: importanceSel.value,
          cadence: cadenceSel.value,
          targetDate: dateInput.value,
          repeatMode: repeatSel.value,
          createdDate: (index === -1 || !dailyQuests[index].createdDate) ? new Date().toISOString() : dailyQuests[index].createdDate
      };

      if (index === -1) {
          dailyQuests.push({ ...newQuestData, stat: statSelect.value, completed: false });
      } else {
          Object.assign(dailyQuests[index], newQuestData);
      }

      saveQuests();
      renderQuests();
      modal.classList.add("hidden");
  };

  const deleteBtn = document.getElementById("deleteQuest");
  if (deleteBtn) {
    const newDeleteBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
    newDeleteBtn.onclick = () => {
      if(index !== -1) {
          dailyQuests.splice(index, 1);
          saveQuests();
          renderQuests();
      }
      modal.classList.add("hidden");
    };
  }

  const cancelBtn = document.getElementById("cancelQuestEdit");
  if (cancelBtn) cancelBtn.onclick = () => modal.classList.add("hidden");
};

// Daily Penalty Override
window.applyDailyPenalty = function() {
  let penaltyApplied = false;
  if (typeof dailyQuests !== 'undefined') {
      dailyQuests.forEach(q => {
        if (isQuestVisible(q) && !q.completed) {
          // Failure Logic: Decrease stat?
          // Requirement: "Importance increases... penalty when incomplete"
          // We will stick to -1 stat for now, maybe weighted later if requested,
          // but Issue 2 focused on XP scaling.
          // IMPORTANT: Do NOT subtract XP here, as envelope system handles it by NOT awarding XP.
          const statKey = q.stat.toLowerCase();
          if (player.stats[statKey] > 0) {
            player.stats[statKey]--;
            penaltyApplied = true;
          }
        }
      });
  }

  if (penaltyApplied) {
    savePlayer();
    updateUI();
    const todayStr = new Date().toDateString();
    localStorage.setItem('solo_last_penalty_date', todayStr);
    const penaltyModal = document.getElementById('penaltyModal');
    if (penaltyModal) penaltyModal.classList.remove('hidden');
  }
};

window.resetDailyCompletion = function() {
  if (typeof dailyQuests !== 'undefined') {
      dailyQuests.forEach(q => q.completed = false);
      saveQuests();
      renderQuests();
  }
};

window.runDailySystemOnce = function() {
  const DAY_KEY = "solo_last_day";
  const today = new Date().toDateString();
  const lastDay = localStorage.getItem(DAY_KEY);

  const suppressionDate = localStorage.getItem("solo_suppression_date");
  if (suppressionDate && suppressionDate !== today) {
      localStorage.removeItem("solo_suppression_date");
  }

  if (lastDay !== today) {
    applyDailyPenalty();
    resetDailyCompletion();
    if (typeof checkForSuppression === 'function') checkForSuppression();

    // Reset XP Envelope state
    localStorage.setItem('solo_daily_xp_awarded', '0');
    localStorage.setItem('solo_xp_date', today);

    localStorage.setItem(DAY_KEY, today);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  initParticleSystem();
  if (typeof renderQuests === 'function') renderQuests();
  bindCalendarToggle();
  if (typeof renderStreakCalendar === 'function') renderStreakCalendar();
});

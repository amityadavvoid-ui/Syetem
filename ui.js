/* ================================
   UI.JS – SYSTEM INTERFACE CONTROLLER
   Overriding and Enhancing Core Systems
================================ */

/* ================================
   ISSUE 1: PARTICLE SYSTEM (STRICT)
   Strict JS Lifecycle, No CSS Looping
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
  
  // Randomize size slightly
  const size = Math.random() * 3 + 2; // 2px to 5px
  particle.style.width = size + 'px';
  particle.style.height = size + 'px';

  // Random start position
  particle.style.left = Math.random() * 100 + '%';
  particle.style.bottom = '-10px'; // Start just below view
  
  // Tier-based settings
  let duration, maxOpacity, speedMultiplier;
  if (tier === 3) { // Grim Reaper: Heavy, slow, lingering
    duration = 45000;
    maxOpacity = 0.5;
    speedMultiplier = 0.5;
  } else if (tier === 2) { // Shadow Monarch: Moderate
    duration = 35000;
    maxOpacity = 0.4;
    speedMultiplier = 0.8;
  } else { // Base
    duration = 25000;
    maxOpacity = 0.3;
    speedMultiplier = 1.0;
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
    if (progress < 0.2) { // Fade in (20%)
      currentOpacity = (progress / 0.2) * maxOpacity;
    } else if (progress < 0.8) { // Sustain (60%)
      currentOpacity = maxOpacity;
    } else { // Fade out (20%)
      currentOpacity = maxOpacity * (1 - (progress - 0.8) / 0.2);
    }

    // Movement Logic: Slow upward drift
    const moveY = -1 * (progress * 100) * speedMultiplier; // Move up to 100vh * multiplier

    particle.style.opacity = currentOpacity;
    particle.style.transform = `translateY(${moveY}vh)`;

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function initParticleSystem() {
  // Clear existing CSS particles if any
  const container = document.getElementById('bgParticles');
  if (container) container.innerHTML = '';

  setInterval(() => {
    // Spawn chance based on tier (fewer but heavier for high tiers?)
    const tier = getTier();
    let spawnChance = 0.4;
    if (tier === 3) spawnChance = 0.6;

    if (Math.random() < spawnChance) {
      spawnParticle();
    }
  }, 1000);
}

/* ================================
   ISSUE 2, 3, 4: INTERFERENCE SYSTEM
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
  updateSystemMessage(); // Update panel immediately
  showInterferenceConfirmation(); // Show dedicated modal
}

function hasInterferenceToday() {
  const today = new Date().toISOString().split('T')[0];
  const log = JSON.parse(localStorage.getItem('solo_interference_log') || '{}');
  return log[today] && log[today].length > 0;
}

function showInterferenceConfirmation() {
  // Dedicated ephemeral modal
  let modal = document.getElementById('dedicatedInterferenceModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'dedicatedInterferenceModal';
    modal.className = 'modal';
    modal.style.zIndex = '2000';
    modal.innerHTML = `
      <div class="modal-content" style="border-color: #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);">
        <h3 style="color: #ef4444; margin-bottom: 10px;">INTERFERENCE LOGGED</h3>
        <p style="color: #cbd5e1; text-align: center; margin-bottom: 20px;">Interference detected.</p>
        <button id="dismissInterference" style="border-color: #ef4444; color: #ef4444;">ACKNOWLEDGE</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('dismissInterference').onclick = () => {
      modal.remove();
    };
  }
}

// Bind the log button to open the SELECTION modal (existing in HTML)
const btnInterference = document.getElementById('btnInterference');
if (btnInterference) {
  btnInterference.onclick = () => {
    const modal = document.getElementById('interferenceModal');
    if (modal) modal.classList.remove('hidden');
  };
}

// Bind Save button in Selection Modal
const saveInterferenceBtn = document.getElementById('saveInterference');
if (saveInterferenceBtn) {
  saveInterferenceBtn.onclick = () => {
    const checkboxes = document.querySelectorAll('#interferenceList input[type="checkbox"]:checked');
    const types = Array.from(checkboxes).map(cb => cb.value);
    
    if (types.length > 0) {
      logInterference(types);
    }
    
    // Clear and close
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

// Strict System Message Panel
function updateSystemMessage() {
  const messageEl = document.getElementById('systemMessage');
  const badgeEl = document.getElementById('systemStatusBadge');
  const panel = document.querySelector('.player-status-panel');
  
  if (!messageEl || !badgeEl || !panel) return;

  const interference = hasInterferenceToday();
  const suppressed = typeof isSuppressed === 'function' && isSuppressed();

  // Reset classes
  panel.classList.remove('state-STABLE', 'state-WARNING', 'state-UNSTABLE', 'state-DEGRADING', 'state-SUPPRESSION');
  
  if (suppressed) {
    // Suppression takes precedence
    badgeEl.textContent = 'SYSTEM STATUS: SUPPRESSION';
    badgeEl.className = 'system-status-badge state-SUPPRESSION';
    messageEl.textContent = 'Reward systems disabled.';
    panel.classList.add('state-SUPPRESSION');
    panel.style.display = 'block';
  } else if (interference) {
    // Interference Mode
    badgeEl.textContent = 'SYSTEM STATUS: UNSTABLE';
    badgeEl.className = 'system-status-badge state-UNSTABLE';
    messageEl.textContent = 'Interference detected.';
    panel.classList.add('state-UNSTABLE');
    panel.style.display = 'block';
  } else {
    // Stable Mode - HIDDEN
    panel.style.display = 'none';
  }
  
  // Also update progress panels
  updateUnknownProgress();
}

/* ================================
   ISSUE 5 & 6: PROGRESS & REVEALS
================================ */

function updateUnknownProgress() {
  const unknownProgress = document.getElementById('unknownProgress');
  const unknownValue = document.getElementById('unknownProgressValue');
  const shadowProgress = document.getElementById('shadowProgress');
  const grimProgress = document.getElementById('grimProgress');
  const grimValue = document.getElementById('grimProgressValue');
  
  if (!unknownProgress || !shadowProgress || !grimProgress) return;

  const level = player.level;
  
  // 1. Shadow Monarch Track (0-100)
  if (level < 100) {
    // Not revealed
    unknownProgress.style.display = 'block';
    shadowProgress.style.display = 'none';
    
    // Remove "locked" text behavior via CSS classes or text content
    unknownProgress.classList.remove('revealed');
    if (unknownValue) {
      const pct = Math.min((level / 100) * 100, 100).toFixed(1);
      unknownValue.textContent = `Progress: ${pct}%`;
    }
    const label = unknownProgress.querySelector('.locked-label');
    if (label) label.style.visibility = 'hidden';

  } else {
    // Revealed
    unknownProgress.style.display = 'none';
    shadowProgress.style.display = 'block';
  }

  // 2. Grim Reaper Track (100-150)
  grimProgress.style.display = 'block';
  
  if (level < 150) {
    // Not revealed
    grimProgress.classList.add('locked');
    if (grimValue) {
      const prog = Math.max(0, level - 100);
      const pct = Math.min((prog / 50) * 100, 100).toFixed(1);
      grimValue.textContent = `Alignment Drift: ${pct}%`;
    }
    const label = grimProgress.querySelector('.locked-label');
    if (label) label.style.visibility = 'hidden';
  } else {
    // Revealed
    grimProgress.classList.remove('locked');
    if (grimValue) {
      grimValue.textContent = 'Authority Recognized';
    }
    const label = grimProgress.querySelector('.locked-label');
    if (label) label.style.visibility = 'visible';
    if (label) label.textContent = 'GRIM REAPER';
  }
}

/* ================================
   ISSUE 7 & 8: CALENDAR & NOTES
================================ */

// Override renderStreakCalendar from streak.js explicitly to ensure functionality
let isCalendarExpandedUI = false; // Internal UI state

window.renderStreakCalendar = function() {
  const streakContainer = document.getElementById("streakCalendar");
  const currentStreakEl = document.getElementById("currentStreak");
  const maxStreakEl = document.getElementById("maxStreak");
  const toggleBtn = document.getElementById("toggleCalendarBtn");

  if (!streakContainer) return;

  const STREAK_KEY = "solo_streak_days";
  const streakDays = JSON.parse(localStorage.getItem(STREAK_KEY)) || [];

  streakContainer.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // TASK 5: Expand to 365 days
  const daysToShow = isCalendarExpandedUI ? 365 : 30;

  // Generate days
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
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

    if (streakDays.includes(dayStr)) {
      dayEl.classList.add("completed");
    }

    if (d.getTime() === today.getTime()) {
      dayEl.classList.add("today");
    }

    wrapper.appendChild(label);
    wrapper.appendChild(dayEl);
    streakContainer.appendChild(wrapper);
  }

  // Scroll to end (today)
  setTimeout(() => {
    streakContainer.scrollLeft = streakContainer.scrollWidth;
  }, 100);

  // Update Stats (Recalculate logic here to be safe or rely on streak.js if helper exists)
  // We'll reimplement calculateStreakStats logic locally to ensure independence

  if (currentStreakEl || maxStreakEl) {
      const sorted = [...streakDays].sort();
      let current = 0;
      let max = 0;
      let temp = 0;

      for (let i = 0; i < sorted.length; i++) {
        if (i === 0) { temp = 1; }
        else {
          const prev = new Date(sorted[i-1]);
          const curr = new Date(sorted[i]);
          const diffDays = Math.ceil(Math.abs(curr - prev) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) temp++;
          else if (diffDays > 1) {
            if (temp > max) max = temp;
            temp = 1;
          }
        }
      }
      if (temp > max) max = temp;

      // Current Streak
      const todayStr = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (streakDays.includes(todayStr) || streakDays.includes(yesterdayStr)) {
          let count = 1;
          let lastDate = new Date(sorted[sorted.length - 1]);
          for (let i = sorted.length - 2; i >= 0; i--) {
              const currDate = new Date(sorted[i]);
              const diff = (lastDate - currDate) / (1000 * 60 * 60 * 24);
              if (diff === 1) { count++; lastDate = currDate; }
              else { break; }
          }
          current = count;
      } else { current = 0; }

      if (currentStreakEl) currentStreakEl.textContent = current;
      if (maxStreakEl) maxStreakEl.textContent = max;
  }
};

// Bind Calendar Toggle
function bindCalendarToggle() {
    const toggleBtn = document.getElementById("toggleCalendarBtn");
    if (toggleBtn) {
        // Remove old listeners by cloning
        const newBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

        newBtn.addEventListener("click", () => {
            isCalendarExpandedUI = !isCalendarExpandedUI;
            newBtn.textContent = isCalendarExpandedUI ? "COLLAPSE" : "EXPAND";
            renderStreakCalendar();
        });
    }
}


// NOTES
const notesTextarea = document.getElementById('systemNotes');
const notesPanel = document.querySelector('.notes-panel');

if (notesPanel && notesTextarea) {
  // Check if button exists, if not create it
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

  // Persistence
  const savedNotes = localStorage.getItem('solo_system_notes');
  if (savedNotes) notesTextarea.value = savedNotes;
  
  notesTextarea.addEventListener('input', () => {
    localStorage.setItem('solo_system_notes', notesTextarea.value);
  });
}

/* ================================
   ISSUE 11: QUEST SYSTEM OVERRIDES
   Cadence, Importance, Penalty Logic
================================ */

// --- Helper: Quest Visibility ---
function isQuestVisible(quest) {
  const today = new Date();
  today.setHours(0,0,0,0);

  // Default to Daily if undefined
  const cadence = quest.cadence || 'daily';

  if (cadence === 'daily') {
    return true;
  }

  if (cadence === 'alternate') {
    if (!quest.createdDate) return true; // Fallback
    const created = new Date(quest.createdDate);
    created.setHours(0,0,0,0);

    const diffTime = Math.abs(today - created);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 && diffDays % 2 !== 0;
  }

  if (cadence === 'specific') {
    if (!quest.targetDate) return false;
    const target = new Date(quest.targetDate);
    target.setHours(0,0,0,0); // compare dates only

    if (today < target) return false;
    if (today.getTime() === target.getTime()) return true;

    if (quest.repeatMode === 'daily') return true;
    if (quest.repeatMode === 'alternate') {
       const diffTime = Math.abs(today - target);
       const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
       return diffDays > 0 && diffDays % 2 !== 0;
    }

    return false; // One-time quest, passed date
  }

  return true;
}

// --- Override: Render Quests (XSS FIX) ---
window.renderQuests = function() {
  const dailyList = document.getElementById("dailyList");
  const questCount = document.getElementById("questCount");

  if (!dailyList) return;
  dailyList.innerHTML = "";

  // Filter visible quests
  const visibleQuests = dailyQuests.map((q, i) => ({...q, originalIndex: i}))
                                   .filter(q => isQuestVisible(q));

  visibleQuests.forEach((quest) => {
    const div = document.createElement("div");
    div.className = "quest-item";

    // Importance Styling
    if (quest.importance === 'important') div.classList.add('quest-important');
    if (quest.importance === 'critical') div.classList.add('quest-critical');

    if (quest.completed) div.classList.add("completed");

    // SAFE RENDERING (textContent)
    div.innerHTML = `
      <div class="quest-info">
        <span class="quest-name"></span>
        <span class="quest-reward">+1 ${quest.stat}</span>
      </div>
      ${quest.cadence === 'alternate' ? '<span class="quest-tag">ALT</span>' : ''}
      ${quest.cadence === 'specific' ? '<span class="quest-tag">DATE</span>' : ''}
    `;

    // Inject safely
    div.querySelector('.quest-name').textContent = quest.name;

    // Click to complete
    div.addEventListener("click", (e) => {
        completeQuest(quest.originalIndex);
    });

    // Context menu / Long press for Edit
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

// --- Override: Open Quest Modal (Inject Inputs) ---
const originalOpenQuestModal = window.openQuestModal;
window.openQuestModal = function(index) {
  const modal = document.getElementById("questModal");
  const input = document.getElementById("editQuestInput");
  const statSelect = document.getElementById("editQuestStat");
  const modalTitle = document.getElementById("modalTitle");

  if (!modal || !input) return;

  editingQuestIndex = index;
  modal.classList.remove("hidden");

  // Inject new UI if missing
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
    // Insert before buttons
    const buttons = modal.querySelector('.modal-buttons');
    modal.querySelector('.modal-content').insertBefore(extraControls, buttons);

    // Toggle Date Input
    const cadenceSelect = document.getElementById('questCadence');
    cadenceSelect.onchange = () => {
      document.getElementById('questDateContainer').style.display =
        cadenceSelect.value === 'specific' ? 'block' : 'none';
    };
  }

  // Populate Fields
  const importanceSel = document.getElementById('questImportance');
  const cadenceSel = document.getElementById('questCadence');
  const dateInput = document.getElementById('questTargetDate');
  const repeatSel = document.getElementById('questRepeat');
  const dateContainer = document.getElementById('questDateContainer');

  if (index === -1) {
    modalTitle.textContent = "NEW QUEST";
    input.value = "";
    statSelect.style.display = "block";

    // Defaults
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

  // Bind Save
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
          const stat = statSelect.value;
          dailyQuests.push({
              ...newQuestData,
              stat: stat,
              completed: false
          });
      } else {
          const q = dailyQuests[index];
          Object.assign(q, newQuestData);
      }

      saveQuests();
      renderQuests();
      modal.classList.add("hidden");
  };

  // Bind Delete
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
  if (cancelBtn) {
    cancelBtn.onclick = () => modal.classList.add("hidden");
  }
};

// --- Override: Apply Daily Penalty ---
window.applyDailyPenalty = function() {
  let penaltyApplied = false;

  if (typeof dailyQuests !== 'undefined') {
      dailyQuests.forEach(q => {
        if (isQuestVisible(q) && !q.completed) {
          const statKey = q.stat.toLowerCase();
          if (player.stats[statKey] > 0) {
            player.stats[statKey]--;
            penaltyApplied = true;
          }
          gainXP(-10);
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

// --- Override: Reset Daily Completion ---
window.resetDailyCompletion = function() {
  if (typeof dailyQuests !== 'undefined') {
      dailyQuests.forEach(q => {
        q.completed = false;
      });
      saveQuests();
      renderQuests();
  }
};

/* ================================
   GENERAL UI UPDATES
================================ */

function updateUI() {
  // Update Player Level/XP
  const levelCenter = document.getElementById('levelCenter');
  const levelTextInline = document.getElementById('levelTextInline');
  const xpText = document.getElementById('xpText');
  const xpRing = document.getElementById('xpRing');
  
  if (levelCenter) levelCenter.textContent = player.level;
  if (levelTextInline) levelTextInline.textContent = player.level;
  
  const needed = xpNeeded(player.level);
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
  
  // Stats
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
  
  // Title & Rank
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
  
  // Tiers
  const tier = getTier();
  document.body.className = '';
  if (tier === 3) {
    document.body.classList.add('tier-3');
  } else if (tier === 2) {
    document.body.classList.add('tier-2');
  } else {
    document.body.classList.add('tier-1');
    if (player.level >= 71) document.body.classList.add('tier-1c');
    else if (player.level >= 50) document.body.classList.add('tier-1b');
    else document.body.classList.add('tier-1a');
  }
  
  updateSystemMessage();
}

/* ================================
   INITIALIZATION
================================ */
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  initParticleSystem();
  if (typeof renderQuests === 'function') renderQuests();
  bindCalendarToggle(); // Ensure toggle is bound
  if (typeof renderStreakCalendar === 'function') renderStreakCalendar(); // Force render
});

// --- CRITICAL OVERRIDE: runDailySystemOnce ---
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

    localStorage.setItem(DAY_KEY, today);
  }
};

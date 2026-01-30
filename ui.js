// attached_assets/ui_1767330037940.js
// REFACTORED FOR STABILITY - STRICT NO-CRASH POLICY

/* ================================
   SAFE UTILITIES & STUBS
   Handle missing logic gracefully
================================ */

// STUBS to prevent ReferenceErrors
if (typeof checkSystemStateTransitions !== 'function') window.checkSystemStateTransitions = function(state) { console.log("Stub: checkSystemStateTransitions", state); };

// IMPLEMENTED STUB: Visual update for Shadow Monarch progress
if (typeof updateShadowMonarchProgress !== 'function') window.updateShadowMonarchProgress = function() {
    const el = document.getElementById("shadowProgress");
    if (el && typeof player !== 'undefined') {
        const percent = Math.min((player.level / 100) * 100, 100);
        el.style.width = percent + "%";
        // Text is removed/hidden by visibility logic if not unlocked
        if (player.level >= 100) el.classList.add("monarch-active");
    }
};

if (typeof updateShadowEntityIdentity !== 'function') window.updateShadowEntityIdentity = function() {};
if (typeof checkLevelMilestoneSurge !== 'function') window.checkLevelMilestoneSurge = function(level) {};
if (typeof triggerCosmicSurge !== 'function') window.triggerCosmicSurge = function(duration) {};
if (typeof generateBackgroundClouds !== 'function') window.generateBackgroundClouds = function() {};
if (typeof initInterference !== 'function') window.initInterference = function() {};

function safeCall(fnName, ...args) {
    if (typeof window[fnName] === 'function') {
        return window[fnName](...args);
    }
    return null;
}

// 1. Missing Calculation Functions
function calculateTotalXP(level, xp) {
    if (typeof xpNeeded !== 'function') return 0;
    let total = xp;
    for (let i = 1; i < level; i++) {
        total += xpNeeded(i);
    }
    return total;
}

function getCleanDays() {
    try {
        const log = JSON.parse(localStorage.getItem("solo_interference_log") || "{}");
        const today = new Date();
        let clean = 0;
        for (let i = 1; i <= 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            if (log[dateStr] && log[dateStr].length > 0) break;
            clean++;
        }
        return clean;
    } catch (e) { return 0; }
}

function getSystemState(last7) {
    if (last7 >= 5) return "SUPPRESSION";
    if (last7 >= 3) return "DEGRADING";
    if (last7 >= 1) return "WARNING";
    return "STABLE"; // Default
}

// 3. System Modal Safe Fallback
function triggerSystemModal(titleText, bodyText) {
    let targetModal = document.getElementById("systemModal");
    let targetTitle = document.getElementById("systemModalTitle");
    let targetBody = document.getElementById("systemModalBody");

    if (!targetModal) {
        targetModal = document.getElementById("systemStateModal");
        targetTitle = document.getElementById("systemStateTitle");
        targetBody = document.getElementById("systemStateText");
    }

    if (targetModal && targetTitle && targetBody) {
        targetTitle.textContent = titleText || "SYSTEM NOTICE";
        if (targetBody.tagName === 'P' || targetBody.tagName === 'DIV') {
             targetBody.innerText = bodyText || "";
        } else {
             targetBody.textContent = bodyText || "";
        }
        targetModal.classList.remove("hidden");
        targetModal.classList.add("open");
    } else {
        console.warn("System Modal DOM elements missing. Message:", titleText, bodyText);
    }
}

/* ================================
   CORE UI LOGIC
================================ */

const avatarImg = document.getElementById("avatarImage");
const avatarInput = document.getElementById("avatarInput");

function loadAvatar() {
  try {
      const savedAvatar = localStorage.getItem("solo_avatar");
      if (savedAvatar && avatarImg) avatarImg.src = savedAvatar;
  } catch (e) { console.error("Avatar load error", e); }
}

if (avatarImg && avatarInput) {
  avatarImg.onclick = () => {
      if (avatarInput) avatarInput.click();
  };

  avatarInput.onchange = e => {
    try {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          if (avatarImg) avatarImg.src = reader.result;
          localStorage.setItem("solo_avatar", reader.result);
        };
        reader.readAsDataURL(file);
    } catch (e) { console.error("Avatar change error", e); }
  };
}

function getRank(level) {
  if (level >= 150) return "SSS";
  if (level >= 100) return "S";
  if (level >= 50) return "A";
  if (level >= 30) return "B";
  if (level >= 15) return "C";
  if (level >= 5) return "D";
  return "E";
}

function applyRankGlow(rank) {
  const avatarWrap = document.querySelector(".avatar-wrapper");
  if (avatarWrap) {
    const classesToRemove = ['rank-E', 'rank-D', 'rank-C', 'rank-B', 'rank-A', 'rank-S', 'rank-SSS'];
    avatarWrap.classList.remove(...classesToRemove);
    avatarWrap.classList.add(`rank-${rank}`);
  }
}

function applyVisualTier(level) {
  const body = document.body;
  if (!body) return;

  body.classList.remove('tier-1', 'tier-2', 'tier-3');

  if (level >= 150) {
    body.classList.add('tier-3');
  } else if (level >= 100) {
    body.classList.add('tier-2');
  } else {
    body.classList.add('tier-1');
    body.classList.remove('tier-1a', 'tier-1b', 'tier-1c');

    if (level >= 60) {
      body.classList.add('tier-1c');
    } else if (level >= 30) {
      body.classList.add('tier-1b');
    } else if (level >= 10) {
      body.classList.add('tier-1a');
    }
  }
}

function initNotes() {
    const notesArea = document.getElementById("systemNotes");
    if (!notesArea) return;

    try {
        const savedNotes = localStorage.getItem("solo_notes");
        if (savedNotes) {
            notesArea.value = savedNotes;
        }

        notesArea.addEventListener("input", () => {
            localStorage.setItem("solo_notes", notesArea.value);
        });
    } catch(e) { console.warn("Notes init error", e); }
}

function getInterferenceStats() {
    try {
        const log = JSON.parse(localStorage.getItem("solo_interference_log") || "{}");
        const today = new Date();
        let last7 = 0;
        let last30 = 0;

        for(let i=0; i<30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            if (log[dateStr] && log[dateStr].length > 0) {
                last30++;
                if (i < 7) last7++;
            }
        }

        return { last7, last30 };
    } catch (e) { return { last7: 0, last30: 0 }; }
}

/* ================================
   SYSTEM TEXT & LORE
================================ */
const SYSTEM_LORE = [
    "SYSTEM NOTICE: The weak do not decide how they die.",
    "SYSTEM NOTICE: Power is not granted, it is taken.",
    "SYSTEM NOTICE: Your potential is... intriguing.",
    "SYSTEM NOTICE: The shadows whisper your name.",
    "SYSTEM NOTICE: Do not look away. The abyss gazes back.",
    "SYSTEM NOTICE: A Monarch does not hesitate.",
    "SYSTEM NOTICE: Level up. Survive. Prevail.",
    "SYSTEM NOTICE: History is written by the victors.",
    "SYSTEM NOTICE: Even the darkness trembles."
];

const SYSTEM_TRUTH = [
    "SYSTEM NOTICE: No one is coming to save you.",
    "SYSTEM NOTICE: The world does not owe you understanding.",
    "SYSTEM NOTICE: Pain is the only currency that matters.",
    "SYSTEM NOTICE: Rest is a privilege for the strong.",
    "SYSTEM NOTICE: Your excuses are irrelevant to the System.",
    "SYSTEM NOTICE: Weakness is a choice. You chose it."
];

const SYSTEM_MEMORY_LINES = [
  "This pattern has occurred before.",
  "The system remembers repeated hesitation.",
  "Recovery does not erase history.",
  "Discipline is measured over time.",
  "Previous deviations have been recorded.",
  "Silence does not imply forgiveness."
];

function maybeTriggerSystemMemory() {
  try {
      const memoryCount = parseInt(localStorage.getItem("systemMemoryCount") || "0");
      const lastTrigger = parseInt(localStorage.getItem("lastSystemMemoryTrigger") || "0");
      const now = Date.now();

      if (now - lastTrigger < 48 * 60 * 60 * 1000) return null;
      if (memoryCount < 2) return null;

      const line = SYSTEM_MEMORY_LINES[Math.floor(Math.random() * SYSTEM_MEMORY_LINES.length)];
      localStorage.setItem("lastSystemMemoryTrigger", now.toString());
      return line;
  } catch (e) { return null; }
}

function updateSystemStatusVisibility() {
    if (typeof player === 'undefined') return;

    // 2️⃣ SYSTEM STATUS PANEL — VISIBILITY GATING (CRITICAL)
    const shadowEl = document.getElementById("shadowProgress");
    const grimEl = document.getElementById("grimProgress");
    const unknownEl = document.getElementById("unknownProgress");

    // Default to hidden
    if (shadowEl) shadowEl.style.display = "none";
    if (grimEl) grimEl.style.display = "none";
    if (unknownEl) unknownEl.style.display = "none";

    // Tier 2: Shadow Monarch (Level 100+)
    if (player.level >= 100) {
        if (shadowEl) shadowEl.style.display = "block";
    }

    // Tier 3: Grim Reaper (Level 150+)
    if (player.level >= 150) {
        if (grimEl) grimEl.style.display = "block";
    }

    // Unknown Entity logic (Level 71+ or similar per core logic)
    if (player.level >= 71) {
        if (unknownEl) unknownEl.style.display = "block";
    }
}

function updateSystemMessage() {
    const msgEl = document.getElementById('systemMessage');
    const badgeEl = document.getElementById('systemStatusBadge');
    const panelEl = document.querySelector('.player-status-panel');

    if(!msgEl) return;
    if (msgEl.getAttribute("data-locked") === "true") return;

    try {
        const stats = getInterferenceStats();
        const count7 = stats.last7;
        const cleanDays = getCleanDays();
        
        // 4️⃣ STRICT INTERFERENCE ENFORCEMENT
        let isSuppressed = false;
        if (typeof window.isSuppressed === 'function') {
            isSuppressed = window.isSuppressed(); // From core.js
        } else {
            // Fallback check if core logic missing
            const suppressionDate = localStorage.getItem("solo_suppression_date");
            isSuppressed = (suppressionDate === new Date().toDateString());
        }

        const state = isSuppressed ? "SUPPRESSION" : getSystemState(count7);

        let msg = "";
        let color = "#cbd5e1";
        let statusText = "STABLE";
        let statusClass = "system-stable";

        switch(state) {
            case "SUPPRESSION":
                msg = "SYSTEM DIRECTIVE: INTERFERENCE LIMIT EXCEEDED. ALL REWARDS SUSPENDED.";
                color = "#ef4444";
                statusText = "SUPPRESSED";
                statusClass = "system-suppression";
                break;
            case "DEGRADING":
                msg = "SYSTEM INTEGRITY: CRITICAL. MOTIVATION PROCESSORS OFFLINE.";
                color = "#ef4444";
                statusText = "DEGRADING";
                statusClass = "system-degrading";
                break;
            case "UNSTABLE":
            case "WARNING":
                msg = "WARNING: INTERFERENCE DETECTED. FOCUS REQUIRED.";
                color = "#eab308";
                statusText = "WARNING";
                statusClass = "system-warning";
                break;
            case "STABLE":
            default:
                statusText = "STABLE";
                statusClass = "system-stable";
                color = "#36ffd1";
                
                // Normal Logic
                if (typeof player !== 'undefined' && typeof player.level === 'number') {
                     if (player.level >= 200) {
                        msg = "SYSTEM NOTICE: Singularity achieved. You are the System.";
                    } else if (player.level >= 150) {
                        msg = "SYSTEM NOTICE: Monarch vessel stabilizing. Reality bending.";
                    } else if (player.level >= 100) {
                        msg = "SYSTEM NOTICE: Threshold breached. Authority expanding.";
                    } else {
                        if (typeof xpNeeded === 'function') {
                            const need = xpNeeded(player.level);
                            const percent = (player.xp / need) * 100;
                            if (percent < 15) {
                                 msg = `SYSTEM ALERT: Stagnation detected (${Math.floor(percent)}%). Move or die.`;
                                 color = "#fbbf24";
                            } else if (percent > 85) {
                                 msg = `SYSTEM STABLE. Evolution imminent (${Math.floor(percent)}%). Push.`;
                            } else {
                                msg = "SYSTEM NOTICE: Strength accumulates quietly.";
                            }
                        }
                    }
                }
                
                // Random lore/truth overrides
                if (Math.random() < 0.08) msg = SYSTEM_TRUTH[Math.floor(Math.random() * SYSTEM_TRUTH.length)];
                if (Math.random() < 0.08) msg = SYSTEM_LORE[Math.floor(Math.random() * SYSTEM_LORE.length)];
                
                const memoryLine = maybeTriggerSystemMemory();
                if (memoryLine) msg = "SYSTEM MEMORY: " + memoryLine;

                if (cleanDays >= 30) msg = "SYSTEM RECORD: Authority regained.";
                else if (cleanDays >= 7) msg = "SYSTEM RECORD: Discipline stabilized.";
                break;
        }

        msgEl.innerText = msg;
        msgEl.style.color = color;

        if (badgeEl) {
            badgeEl.innerText = `SYSTEM STATUS: ${statusText}`;
            badgeEl.className = "system-status-badge " + statusClass;
        }

        if (panelEl) {
            panelEl.classList.remove('system-stable', 'system-warning', 'system-unstable', 'system-degrading', 'system-suppression');
            panelEl.classList.add(statusClass);
        }
        
        if (typeof checkSystemStateTransitions === 'function') checkSystemStateTransitions(state);
        if (typeof updateShadowMonarchProgress === 'function') updateShadowMonarchProgress();

    } catch(e) { console.error("Update System Message Error", e); }
}

let lastXP = 0;

function updateUI() {
  try {
      if (typeof player === 'undefined') {
          console.warn("Player undefined in updateUI");
          return;
      }

      const levelText = document.getElementById("levelTextInline");
      const levelCenter = document.getElementById("levelCenter");
      const xpText = document.getElementById("xpText");
      const xpRing = document.getElementById("xpRing");
      const playerTitle = document.getElementById("playerTitle");
      const titleMeta = document.getElementById("titleMeta");
      const rankText = document.getElementById("rankText");

      if (levelText) levelText.textContent = player.level;
      if (levelCenter) levelCenter.textContent = player.level;

      let need = 100;
      if (typeof xpNeeded === 'function') {
         need = xpNeeded(player.level);
      }

      if (xpText) xpText.textContent = `XP ${player.xp} / ${need}`;

      if (xpRing) {
        const percent = Math.min(Math.max(player.xp / need, 0), 1);
        const radius = 60;
        const circumference = 2 * Math.PI * radius; 
        xpRing.style.strokeDashoffset = 377 - percent * 377; // 377 is approx circ

        xpRing.classList.remove("xp-up", "xp-down");
        if (player.xp > lastXP) xpRing.classList.add("xp-up");
        if (player.xp < lastXP) xpRing.classList.add("xp-down");
      }
      lastXP = player.xp;

      const title = (typeof getTitle === 'function') ? getTitle(player.level) : "Unawakened";
      if (playerTitle) playerTitle.textContent = title;
      if (titleMeta) titleMeta.textContent = title;

      const rank = getRank(player.level);
      if (rankText) {
        rankText.innerHTML = `Rank ${rank} · Level <span id="levelTextInline">${player.level}</span>`;
      }

      applyRankGlow(rank);
      applyVisualTier(player.level);
      
      updateSystemStatusVisibility(); // Strict Gating
      updateSystemMessage();
      updateUnknownEntityProgress();
      
      if (typeof updateShadowEntityIdentity === 'function') updateShadowEntityIdentity();
      if (typeof checkMilestones === 'function') checkMilestones();
      if (typeof checkLevelMilestoneSurge === 'function') checkLevelMilestoneSurge(player.level);

      if (player.stats) {
          for (let k in player.stats) {
            const valEl = document.getElementById(k + "Val");
            const barEl = document.getElementById(k + "Bar");
            if (valEl) valEl.textContent = player.stats[k];
            if (barEl) barEl.style.width = Math.min((player.stats[k] / 50) * 100, 100) + "%";
          }
      }
  } catch (error) {
      console.error("Critical UI Error:", error);
  }
}

function checkMilestones() {
    try {
        const milestones = JSON.parse(localStorage.getItem("solo_milestones") || "{}");
        const today = new Date().toDateString();
        let msg = "";

        if (!milestones.first_quest && typeof dailyQuests !== 'undefined' && dailyQuests.some(q => q.completed)) {
            milestones.first_quest = today;
            msg = "SYSTEM RECORD: First quest completed. Awakening initiated.";
        }

        const currentStreakStr = document.getElementById("currentStreak")?.textContent || "0";
        const currentStreak = parseInt(currentStreakStr);

        if (!milestones.streak_7 && currentStreak >= 7) {
            milestones.streak_7 = today;
            msg = "SYSTEM RECORD: 7 Day Streak. Momentum building.";
        }
        if (!milestones.streak_30 && currentStreak >= 30) {
            milestones.streak_30 = today;
            msg = "SYSTEM RECORD: 30 Day Streak. Unstoppable force.";
        }

        const currentTier = document.body.classList.contains("tier-3") ? 3 :
                            document.body.classList.contains("tier-2") ? 2 : 1;
        const lastTier = parseInt(localStorage.getItem("solo_last_tier") || "1");

        if (currentTier > lastTier) {
            localStorage.setItem("solo_last_tier", currentTier);
            if (milestones.init_done) {
                 msg = currentTier === 2 ? "SYSTEM RECORD: Shadow Monarch awakening." :
                       currentTier === 3 ? "SYSTEM RECORD: Grim Reaper evolution." : "";
            }
        }
        if (!milestones.init_done) milestones.init_done = true;

        if (msg) {
            localStorage.setItem("solo_milestones", JSON.stringify(milestones));
            const msgEl = document.getElementById('systemMessage');
            if (msgEl) {
                 msgEl.innerText = msg;
                 msgEl.style.color = "#36ffd1";
                 msgEl.setAttribute("data-locked", "true");
                 setTimeout(() => {
                     msgEl.removeAttribute("data-locked");
                     updateSystemMessage();
                 }, 5000);
            }
        }
    } catch (e) { console.error("Milestone Check Error", e); }
}

function updateUnknownEntityProgress() {
  try {
      const el = document.getElementById("grimProgressValue");
      if (!el) return;

      const body = document.body;
      let goalXP = 100000;
      if (typeof xpNeeded === 'function') {
         goalXP = 0;
         for (let l = 1; l <= 250; l++) goalXP += xpNeeded(l);
      }

      if (typeof player === 'undefined') return;

      const totalXP = calculateTotalXP(player.level, player.xp);
      let percent = (totalXP / goalXP) * 100;
      if (percent < 0) percent = 0;

      el.textContent = `Alignment Drift: ${percent.toFixed(2)}%`;

      if (body) {
          if (percent < 10) body.setAttribute("data-drift-level", "low");
          else if (percent < 35) body.setAttribute("data-drift-level", "medium");
          else body.setAttribute("data-drift-level", "high");
      }
  } catch(e) { console.error("Unknown Entity Progress Error", e); }
}

function checkPenaltyModal() {
    try {
        const todayStr = new Date().toDateString();
        const lastPenaltyDate = localStorage.getItem('solo_last_penalty_date');
        const modalShownDate = localStorage.getItem('solo_penalty_modal_shown');

        if (lastPenaltyDate === todayStr && modalShownDate !== todayStr) {
            const modal = document.getElementById('penaltyModal');
            if (modal) {
                modal.classList.remove('hidden');

                const closeBtn = document.getElementById('closePenaltyModal');
                if (closeBtn) {
                    closeBtn.onclick = () => {
                        modal.classList.add('hidden');
                        localStorage.setItem('solo_penalty_modal_shown', todayStr);
                    };
                }
            }
        }
    } catch(e) { console.error("Penalty Modal Error", e); }
}

function initNotifications() {
    if (!('Notification' in window)) return;
    try {
        if (Notification.permission === 'default') {
            const requestPermission = () => {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('Notification permission granted.');
                    }
                });
                document.removeEventListener('click', requestPermission);
            };
            document.addEventListener('click', requestPermission);
        }
    } catch(e) { console.warn("Notifications init error", e); }
}

function spawnParticles() {
  const container = document.getElementById("bgParticles");
  if (!container) return;

  try {
      let count = 20;
      if (document.body.classList.contains("tier-3")) count = 38;
      else if (document.body.classList.contains("tier-2")) count = 30;

      container.innerHTML = "";
      createShard(container, "legendary");

      const sparkleCount = Math.floor(Math.random() * 2) + 1;
      for(let i=0; i<sparkleCount; i++) createShard(container, "sparkle");

      const remaining = count - 1 - sparkleCount;
      for(let i=0; i<remaining; i++) createShard(container);
  } catch(e) { console.error("Particle Spawn Error", e); }
}

function createShard(container, type) {
  try {
    const p = document.createElement("div");
    p.classList.add("crystal-particle");
    if(type) p.classList.add(type);

    let size = Math.random() * 6 + 4;
    if(type === "legendary") size = Math.random() * 8 + 10;
    if(type === "sparkle") size = Math.random() * 4 + 2;

    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.left = Math.random() * 100 + "vw";
    p.style.top = Math.random() * 100 + "vh";

    const duration = Math.random() * 5 + 8;
    p.style.animationDuration = duration + "s";
    p.style.animationDelay = "-" + (Math.random() * 5) + "s";

    container.appendChild(p);
  } catch(e) { console.warn("Shard creation error", e); }
}

// 1️⃣ INTERFERENCE BUTTON RELIABILITY (CRITICAL)
function initInterferenceLogic() {
  const btn = document.getElementById("btnInterference");
  const modal = document.getElementById("interferenceModal");
  const saveBtn = document.getElementById("saveInterference");
  const closeBtn = document.getElementById("closeInterference");

  if (btn) {
    // Clone to remove old listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    const openModal = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (modal) modal.classList.remove("hidden");
    };

    // Reliable touch/click binding
    newBtn.addEventListener("pointerup", openModal);
    newBtn.addEventListener("click", openModal);
  }

  if (saveBtn) {
    const newSave = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSave, saveBtn);

    newSave.onclick = () => {
       const inputs = document.querySelectorAll("#interferenceList input:checked");
       if (inputs.length > 0) {
           const todayStr = new Date().toISOString().split("T")[0];
           const log = JSON.parse(localStorage.getItem("solo_interference_log") || "{}");
           if (!log[todayStr]) log[todayStr] = [];
           
           inputs.forEach(input => {
               log[todayStr].push(input.value);
               input.checked = false; // Reset
           });
           
           localStorage.setItem("solo_interference_log", JSON.stringify(log));
           
           // Trigger suppression check
           if (typeof checkForSuppression === 'function') checkForSuppression();
           
           if (modal) modal.classList.add("hidden");
           updateSystemMessage();
           
           // Visual confirmation
           const saveText = newSave.textContent;
           newSave.textContent = "LOGGED";
           setTimeout(() => newSave.textContent = saveText, 1000);
       }
    };
  }
  
  if (closeBtn) {
      // Clone to remove old listeners
      const newClose = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newClose, closeBtn);
      newClose.onclick = () => { if(modal) modal.classList.add("hidden"); };
  }
}

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  try {
      if (typeof initNotes === 'function') initNotes();
      loadAvatar();
      
      initInterferenceLogic();
      
      if (typeof player !== 'undefined') {
          updateUI();
          if (typeof checkPenaltyModal === 'function') checkPenaltyModal();
          
          spawnParticles();
          setInterval(spawnParticles, 8000);
          
          initNotifications();
      }
  } catch(e) { console.error("Init Error", e); }
});
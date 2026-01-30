const DAY_KEY = "solo_last_day";

function updateTimer() {
  const now = new Date();

  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const diff = midnight - now;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const resetTimer = document.getElementById("resetTimer");
  if (resetTimer) {
    resetTimer.textContent = `${h}h ${m}m ${s}s`;
  }
  
  checkScheduledNotifications();
}

function runDailySystemOnce() {
  const today = new Date().toDateString();
  const lastDay = localStorage.getItem(DAY_KEY);

  // Clear yesterdays suppression (SUPPRESSION IS ONE DAY ONLY)
  // "Suppression auto-clears after the day ends"
  const suppressionDate = localStorage.getItem("solo_suppression_date");
  if (suppressionDate && suppressionDate !== today) {
      localStorage.removeItem("solo_suppression_date");
      // Notify clearance? Maybe.
  }

  if (lastDay !== today) {
    applyDailyPenalty();
    resetDailyCompletion();
    
    // TASK 2: Check for 7-day Interference Escalation
    checkForSuppression();

    localStorage.setItem(DAY_KEY, today);
  }
}

// TASK 2: Strict Interference Escalation
function checkForSuppression() {
    try {
        const log = JSON.parse(localStorage.getItem("solo_interference_log") || "{}");
        const today = new Date();
        let consecutiveInterference = 0;

        // Check last 7 days (yesterday backwards)
        // "If the user logs ≥ 1 interference on EACH of 7 consecutive days"
        for (let i = 1; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i); // Check yesterday, day before, etc.
            const dateStr = d.toISOString().split("T")[0];
            
            if (log[dateStr] && log[dateStr].length > 0) {
                consecutiveInterference++;
            } else {
                break; // Streak broken
            }
        }

        if (consecutiveInterference >= 7) {
            // Trigger Suppression for TODAY
            const todayStr = today.toDateString();
            localStorage.setItem("solo_suppression_date", todayStr);
            
            // Trigger Notification
            sendNotification("SYSTEM CRITICAL", "Suppression Mode Active. No rewards today.");
            
            // Force UI update immediately if possible
            if(typeof updateSystemMessage === 'function') updateSystemMessage();
        }

    } catch (e) { console.error("Suppression Check Error", e); }
}

function applyDailyPenalty() {
  let penaltyApplied = false;
  
  if (typeof dailyQuests !== 'undefined') {
      dailyQuests.forEach(q => {
        if (!q.completed) {
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
    if (typeof updateUI === 'function') updateUI();
    
    // Track penalty date for modal
    const todayStr = new Date().toDateString();
    localStorage.setItem('solo_last_penalty_date', todayStr);
    
    // Notification C: Penalty Applied
    sendNotification("System Alert", "Penalty enforced. Attributes and XP reduced.");
  }
}

function resetDailyCompletion() {
  if (typeof dailyQuests !== 'undefined') {
      dailyQuests.forEach(q => q.completed = false);
      saveQuests();
      renderQuests();
  }
}

/* ================================
   NOTIFICATION SYSTEM (LOCAL)
   Service Worker Based
================================ */
function hasIncompleteQuests() {
    if (typeof dailyQuests === 'undefined') return false;
    return dailyQuests.some(q => !q.completed);
}

function sendNotification(title, body) {
    if (!('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'granted') return;

    navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
            reg.showNotification(title, {
                body: body,
                icon: 'icon-192.png',
                vibrate: [200, 100, 200],
                tag: 'solo-system-alert'
            });
        }
    });
}

function checkScheduledNotifications() {
    const now = new Date();
    const hours = now.getHours();
    const todayStr = now.toDateString();

    // Notification A: 6:00 PM (18:00)
    if (hours >= 18 && localStorage.getItem("solo_notif_6pm") !== todayStr) {
        if (hasIncompleteQuests()) {
            sendNotification("System Alert", "Daily quests pending. Complete them before midnight.");
        }
        localStorage.setItem("solo_notif_6pm", todayStr);
    }

    // Notification B: 10:00 PM (22:00)
    if (hours >= 22 && localStorage.getItem("solo_notif_10pm") !== todayStr) {
        if (hasIncompleteQuests()) {
            sendNotification("System Warning", "Penalty imminent.");
        }
        localStorage.setItem("solo_notif_10pm", todayStr);
    }
}

/* ================================
   POMODORO TIMER (NEW)
   35 Minutes Fixed
   Small Reward (+5 XP)
================================ */
let pomoTime = 35 * 60;
let pomoRunning = false;
let pomoInterval = null;

const pomoDisplay = document.getElementById('pomodoroDisplay');
const startPomoBtn = document.getElementById('startPomodoro');
const resetPomoBtn = document.getElementById('resetPomodoro');

function updatePomoDisplay() {
    if(!pomoDisplay) return;
    const m = Math.floor(pomoTime / 60).toString().padStart(2, '0');
    const s = (pomoTime % 60).toString().padStart(2, '0');
    pomoDisplay.textContent = `${m}:${s}`;
}

if(startPomoBtn) {
    startPomoBtn.onclick = () => {
        if(pomoRunning) return;
        pomoRunning = true;
        pomoInterval = setInterval(() => {
            pomoTime--;
            updatePomoDisplay();
            if(pomoTime <= 0) {
                clearInterval(pomoInterval);
                pomoRunning = false;
                pomoTime = 35 * 60;
                gainXP(5);
                if (typeof showPomodoroRewardModal === 'function') showPomodoroRewardModal();
                updatePomoDisplay();
            }
        }, 1000);
    };
}

if(resetPomoBtn) {
    resetPomoBtn.onclick = () => {
        if(pomoInterval) clearInterval(pomoInterval);
        pomoRunning = false;
        pomoTime = 35 * 60;
        updatePomoDisplay();
    };
}

window.addEventListener('DOMContentLoaded', () => {
  runDailySystemOnce();
  setInterval(updateTimer, 1000);
  updateTimer();
  updatePomoDisplay();
});
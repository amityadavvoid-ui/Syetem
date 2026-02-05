const MAX_DAILY_QUESTS = 15;
const DAILY_XP_ENVELOPE = 100;

const addQuestBtn = document.getElementById("addQuestBtn");
const dailyList = document.getElementById("dailyList");
const questCount = document.getElementById("questCount");

let dailyQuests = JSON.parse(localStorage.getItem("dailyQuests")) || [];
let editingQuestIndex = -1;

function saveQuests() {
  localStorage.setItem("dailyQuests", JSON.stringify(dailyQuests));
}

function getImportanceWeight(importance) {
  if (importance === 'Critical') return 1.2;
  if (importance === 'Important') return 1.1;
  return 1.0;
}

function calculateDailyXP() {
  if (dailyQuests.length === 0) return 0;

  let completedWeight = 0;
  dailyQuests.forEach(q => {
    if (q.completed) {
      completedWeight += getImportanceWeight(q.importance || 'Normal');
    }
  });

  // Max possible weight is based on ACTIVE quests count * 1.20
  const maxWeight = dailyQuests.length * 1.2;
  if (maxWeight === 0) return 0;

  const efficiency = completedWeight / maxWeight;
  return Math.floor(DAILY_XP_ENVELOPE * efficiency);
}

function updateDailyXP() {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem('solo_xp_date');

  if (lastDate !== today) {
    localStorage.setItem('solo_today_xp', '0');
    localStorage.setItem('solo_xp_date', today);
  }

  const newTarget = calculateDailyXP();
  const currentAwarded = parseInt(localStorage.getItem('solo_today_xp') || '0', 10);

  const diff = newTarget - currentAwarded;

  if (diff !== 0) {
    if (typeof gainXP === 'function') {
      gainXP(diff);
    }
    localStorage.setItem('solo_today_xp', newTarget.toString());
  }
}

function renderQuests() {
  if (!dailyList) return;
  dailyList.innerHTML = "";

  dailyQuests.forEach((quest, index) => {
    const div = document.createElement("div");
    div.className = "quest-item";
    if (quest.completed) div.classList.add("completed");

    // Visual indicator for importance
    let importanceMark = "";
    if (quest.importance === "Critical") importanceMark = " (CRIT)";
    else if (quest.importance === "Important") importanceMark = " (!)";

    div.textContent = `${quest.name}${importanceMark} (+1 ${quest.stat})`;

    // Apply styling based on importance
    if (quest.importance === "Critical") {
      div.style.borderLeftColor = "#ef4444";
      div.style.background = "rgba(239, 68, 68, 0.1)";
    } else if (quest.importance === "Important") {
      div.style.borderLeftColor = "#eab308";
      div.style.background = "rgba(234, 179, 8, 0.1)";
    }

    let pressTimer = null;
    let longPressTriggered = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    const LONG_PRESS_DELAY = 800;

    const clearTimer = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    div.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;

        longPressTriggered = false;
        hasMoved = false;
        startX = e.clientX;
        startY = e.clientY;

        clearTimer();
        pressTimer = setTimeout(() => {
            longPressTriggered = true;
            if (navigator.vibrate) navigator.vibrate(50);
            openQuestModal(index);
        }, LONG_PRESS_DELAY);
    });

    div.addEventListener("pointermove", (e) => {
        if (hasMoved) return;

        if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
            hasMoved = true;
            clearTimer();
        }
    });

    div.addEventListener("pointerup", (e) => {
        clearTimer();
        if (longPressTriggered) {
             setTimeout(() => { longPressTriggered = false; }, 400);
        }
    });

    div.addEventListener("click", (e) => {
        if (hasMoved || longPressTriggered) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        completeQuest(index);
    });

    div.addEventListener("pointercancel", clearTimer);
    div.addEventListener("mouseleave", clearTimer);

    div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearTimer();

        if (!longPressTriggered && !hasMoved) {
            longPressTriggered = true;
            openQuestModal(index);
            setTimeout(() => { longPressTriggered = false; }, 400);
        }
        return false;
    });

    dailyList.appendChild(div);
  });

  if (questCount) {
      questCount.textContent = `Daily Quests: ${dailyQuests.length} / ${MAX_DAILY_QUESTS}`;
  }
}

if (addQuestBtn) {
  addQuestBtn.onclick = () => {
    if (dailyQuests.length >= MAX_DAILY_QUESTS) return;
    openQuestModal(-1);
  };
}

function completeQuest(index) {
  const quest = dailyQuests[index];
  if (!quest) return;

  // Toggle completion
  quest.completed = !quest.completed;

  // TASK 2: Block Stat gains if suppressed
  if (typeof isSuppressed === 'function' && isSuppressed()) {
      console.log("Stat Gain Blocked: Suppression Active");
  } else {
      const statKey = quest.stat.toLowerCase();
      // Only add stat if completing, remove if uncompleting
      if (quest.completed) {
        player.stats[statKey] += 1;
      } else {
        player.stats[statKey] = Math.max(0, player.stats[statKey] - 1);
      }
  }

  // Update Daily XP based on Envelope
  updateDailyXP();

  saveQuests();
  if (typeof updateUI === 'function') updateUI();
  renderQuests();
  checkStreak();
}

function openQuestModal(index) {
  const modal = document.getElementById("questModal");
  const input = document.getElementById("editQuestInput");
  const statSelect = document.getElementById("editQuestStat");
  const deleteBtn = document.getElementById("deleteQuest");
  const modalTitle = document.getElementById("modalTitle");

  if (!modal || !input) return;

  // DYNAMICALLY ADD IMPORTANCE SELECT IF MISSING
  let impSelect = document.getElementById("editQuestImportance");
  if (!impSelect) {
    impSelect = document.createElement("select");
    impSelect.id = "editQuestImportance";
    impSelect.style.width = "100%";
    impSelect.style.background = "rgba(0,0,0,0.4)";
    impSelect.style.color = "#fff";
    impSelect.style.padding = "10px";
    impSelect.style.border = "1px solid rgba(255,255,255,0.1)";
    impSelect.style.borderRadius = "4px";
    impSelect.style.marginBottom = "8px";

    const opts = ["Normal", "Important", "Critical"];
    opts.forEach(opt => {
      const el = document.createElement("option");
      el.value = opt;
      el.textContent = opt;
      impSelect.appendChild(el);
    });

    // Insert after name input
    input.parentNode.insertBefore(impSelect, statSelect);
  }

  editingQuestIndex = index;
  modal.classList.remove("hidden");

  if (index === -1) {
      modalTitle.textContent = "NEW QUEST";
      input.value = "";
      input.placeholder = "Quest Name";
      statSelect.style.display = "block";
      impSelect.value = "Normal";
      deleteBtn.style.display = "none";
  } else {
      modalTitle.textContent = "EDIT QUEST";
      input.value = dailyQuests[index].name;
      statSelect.style.display = "none"; // Hide stat select on edit
      impSelect.value = dailyQuests[index].importance || "Normal";
      deleteBtn.style.display = "block";
  }

  const saveBtn = document.getElementById("saveQuestEdit");
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

  newSaveBtn.onclick = () => {
      const name = input.value.trim();
      const importance = impSelect.value;

      if (!name) return;

      if (editingQuestIndex === -1) {
          const stat = statSelect.value;
          dailyQuests.push({
              name,
              stat: stat,
              importance: importance,
              completed: false
          });
      } else {
          const quest = dailyQuests[editingQuestIndex];
          quest.name = name;
          quest.importance = importance;
          // Note: Resetting completion on edit is standard, but keeping it is fine too.
          // Let's keep existing logic: if completed, it resets?
          if (quest.completed) {
            quest.completed = false;
            // Also need to reverse stat gain?
            // If we reset completed, we should probably handle the stat reversal logic
            // But completeQuest handles the toggle.
            // If we manually set completed = false here, we bypass completeQuest logic.
            // Better to leave it alone or handle correctly.
            // For safety, let's just reset state to false and assume user accepts loss.
             const statKey = quest.stat.toLowerCase();
             player.stats[statKey] = Math.max(0, player.stats[statKey] - 1);
          }
      }

      // Update XP because maxWeight might have changed or completion changed
      updateDailyXP();

      saveQuests();
      renderQuests();
      modal.classList.add("hidden");
  };

  if (deleteBtn) {
    const newDeleteBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

    newDeleteBtn.onclick = () => {
      if(editingQuestIndex !== -1) {
          const quest = dailyQuests[editingQuestIndex];
          if (quest.completed) {
              const statKey = quest.stat.toLowerCase();
              player.stats[statKey] = Math.max(0, player.stats[statKey] - 1);
          }

          dailyQuests.splice(editingQuestIndex, 1);

          updateDailyXP();
          saveQuests();
          renderQuests();
      }
      modal.classList.add("hidden");
    };
  }

  const cancelBtn = document.getElementById("cancelQuestEdit");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      modal.classList.add("hidden");
    };
  }
}

function checkStreak() {
  const allCompleted = dailyQuests.length > 0 && dailyQuests.every(q => q.completed);
  if (allCompleted) {
    const todayStr = new Date().toISOString().split("T")[0];
    const STREAK_KEY = "solo_streak_days";
    let streakDays = JSON.parse(localStorage.getItem(STREAK_KEY)) || [];

    if (!streakDays.includes(todayStr)) {
        streakDays.push(todayStr);
        localStorage.setItem(STREAK_KEY, JSON.stringify(streakDays));
    }

    if (typeof renderStreakCalendar === 'function') renderStreakCalendar();
  }
}

// Initial calculation on load to ensure consistency
updateDailyXP();
renderQuests();
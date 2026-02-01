const MAX_DAILY_QUESTS = 15;

const addQuestBtn = document.getElementById("addQuestBtn");
const dailyList = document.getElementById("dailyList");
const questCount = document.getElementById("questCount");

let dailyQuests = JSON.parse(localStorage.getItem("dailyQuests")) || [];
let editingQuestIndex = -1;

function saveQuests() {
  localStorage.setItem("dailyQuests", JSON.stringify(dailyQuests));
}

function renderQuests() {
  if (!dailyList) return;
  dailyList.innerHTML = "";

  dailyQuests.forEach((quest, index) => {
    const div = document.createElement("div");
    div.className = "quest-item";
    if (quest.completed) div.classList.add("completed");

    div.textContent = `${quest.name} (+1 ${quest.stat})`;

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
  if (!quest || quest.completed) return;

  quest.completed = true;

  // TASK 2: Block Stat gains if suppressed
  if (typeof isSuppressed === 'function' && isSuppressed()) {
      console.log("Stat Gain Blocked: Suppression Active");
      // Still mark complete but NO stats
  } else {
      const statKey = quest.stat.toLowerCase();
      player.stats[statKey] += 1;
  }
  
  // gainXP handles suppression check internally now
  gainXP(20);

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

  editingQuestIndex = index;
  modal.classList.remove("hidden");

  if (index === -1) {
      modalTitle.textContent = "NEW QUEST";
      input.value = "";
      input.placeholder = "Quest Name";
      statSelect.style.display = "block";
      deleteBtn.style.display = "none";
  } else {
      modalTitle.textContent = "EDIT QUEST";
      input.value = dailyQuests[index].name;
      statSelect.style.display = "none";
      deleteBtn.style.display = "block";
  }

  const saveBtn = document.getElementById("saveQuestEdit");
  // Remove old listeners to prevent duplicates (simple clone)
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

  newSaveBtn.onclick = () => {
      const name = input.value.trim();
      if (!name) return;

      if (editingQuestIndex === -1) {
          const stat = statSelect.value;
          dailyQuests.push({
              name,
              stat: stat,
              completed: false
          });
      } else {
          const quest = dailyQuests[editingQuestIndex];
          quest.name = name;
          if (quest.completed) {
            quest.completed = false; // Reset on edit
          }
      }

      saveQuests();
      renderQuests();
      modal.classList.add("hidden");
  };

  if (deleteBtn) {
    // Clone to remove listeners
    const newDeleteBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
    
    newDeleteBtn.onclick = () => {
      if(editingQuestIndex !== -1) {
          dailyQuests.splice(editingQuestIndex, 1);
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
    const today = new Date().toISOString().split("T")[0];
    const streaks = JSON.parse(localStorage.getItem("solo_streak_days") || "[]");

    if (!streaks.includes(today)) {
      streaks.push(today);
      localStorage.setItem("solo_streak_days", JSON.stringify(streaks));
    }

    if (typeof renderStreakCalendar === 'function') renderStreakCalendar();
  }
}

renderQuests();
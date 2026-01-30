// ==============================
// STREAK SYSTEM – ENHANCED 365 DAYS (TASK 5)
// ==============================

const streakContainer = document.getElementById("streakCalendar");
const currentStreakEl = document.getElementById("currentStreak");
const maxStreakEl = document.getElementById("maxStreak");
const STREAK_KEY = "solo_streak_days";

// Load saved streak data
let streakDays = JSON.parse(localStorage.getItem(STREAK_KEY)) || [];
let isCalendarExpanded = false;

// Save streak
function saveStreak() {
  localStorage.setItem(STREAK_KEY, JSON.stringify(streakDays));
}

// Calculate Stats
function calculateStreakStats() {
  if (!streakDays.length) return { current: 0, max: 0 };

  // Sort dates asc
  const sorted = [...streakDays].sort();
  
  let current = 0;
  let max = 0;
  let temp = 0;

  // Max Streak Logic
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      temp = 1;
    } else {
      const prev = new Date(sorted[i-1]);
      const curr = new Date(sorted[i]);
      const diffTime = Math.abs(curr - prev);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        temp++;
      } else if (diffDays > 1) {
        if (temp > max) max = temp;
        temp = 1;
      }
    }
  }
  if (temp > max) max = temp;

  // Current Streak Logic
  // Check if today or yesterday is in the list to maintain streak
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (streakDays.includes(todayStr) || streakDays.includes(yesterdayStr)) {
      // Trace back from last entry
      let count = 1;
      let lastDate = new Date(sorted[sorted.length - 1]);
      
      for (let i = sorted.length - 2; i >= 0; i--) {
          const currDate = new Date(sorted[i]);
          const diff = (lastDate - currDate) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
              count++;
              lastDate = currDate;
          } else {
              break;
          }
      }
      current = count;
  } else {
      current = 0;
  }

  return { current, max };
}

// Render calendar
function renderStreakCalendar() {
  if (!streakContainer) return;

  streakContainer.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // TASK 5: Expand to 365 days
  const daysToShow = isCalendarExpanded ? 365 : 30;

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

  // Update Stats
  const stats = calculateStreakStats();
  if (currentStreakEl) currentStreakEl.textContent = stats.current;
  if (maxStreakEl) maxStreakEl.textContent = stats.max;
}

// TASK 5: Toggle Expansion
const toggleBtn = document.getElementById("toggleCalendarBtn");
if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        isCalendarExpanded = !isCalendarExpanded;
        toggleBtn.textContent = isCalendarExpanded ? "COLLAPSE" : "EXPAND";
        renderStreakCalendar();
    });
}

// Init
document.addEventListener("DOMContentLoaded", renderStreakCalendar);
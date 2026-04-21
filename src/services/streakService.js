/**
 * Streak computation and badge logic.
 *
 * Streak rules:
 *  - A "good day" = (Took count) / (Took + Missed count) >= 0.80 (80% threshold)
 *  - Snoozed logs are ignored (neutral)
 *  - If a day has zero Took + Missed logs: skipped (neutral, doesn't break streak)
 *  - A month provides ONE "Mercy Freeze" — one bad day can be skipped to keep the streak alive
 *  - Freeze is automatically applied and recorded; UI shows "Streak Saved! 🛡️"
 *
 * Badge rules:
 *  - "Perfect Day" badge criteria = 100% adherence
 *  - Numerical streak counter uses 80% threshold
 */

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
const GOOD_DAY_THRESHOLD = 0.8;

export const BADGE_CONFIG = {
  getting_started: { icon: '🌱', label: 'Getting Started',   desc: 'First medicine ever taken' },
  streak_3:        { icon: '🔥', label: '3-Day Streak',      desc: '3 consecutive days ≥80%' },
  streak_7:        { icon: '⚡', label: 'Week Warrior',       desc: '7-day streak achieved' },
  streak_14:       { icon: '💎', label: 'Fortnight',          desc: '14-day streak achieved' },
  streak_30:       { icon: '🏆', label: 'Monthly Master',     desc: '30-day streak achieved' },
  streak_60:       { icon: '🦅', label: 'Iron Will',          desc: '60-day streak achieved' },
  streak_100:      { icon: '👑', label: 'Legend',             desc: '100-day streak achieved' },
  perfect_week:    { icon: '💯', label: 'Perfect Week',       desc: '7 consecutive days at 100%' },
};

/**
 * Groups adherence logs by calendar date string.
 * Only counts 'Took' and 'Missed' statuses.
 */
function groupByDate(logs) {
  const byDate = {};
  for (const log of logs) {
    if (log.status === 'Snoozed') continue;
    const dateStr = new Date(log.timestamp).toDateString();
    if (!byDate[dateStr]) byDate[dateStr] = { took: 0, missed: 0 };
    if (log.status === 'Took') byDate[dateStr].took++;
    else if (log.status === 'Missed') byDate[dateStr].missed++;
  }
  return byDate;
}

/**
 * Computes the current streak from adherence logs.
 *
 * @param {Array} logs - all adherence logs for the patient
 * @param {boolean} freezeAvailable - whether the monthly mercy freeze is still available
 * @returns {{ streak: number, freezeUsed: boolean, milestoneReached: number|null }}
 */
export function computeStreak(logs, freezeAvailable = false) {
  const byDate = groupByDate(logs);
  let streak = 0;
  let freezeUsed = false;

  for (let daysBack = 0; daysBack < 365; daysBack++) {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    const dateStr = d.toDateString();

    const dayData = byDate[dateStr];

    // No logs for this day
    if (!dayData) {
      if (daysBack === 0) continue; // Today not yet started → neutral, keep going
      // A past day with no logs breaks streak (unless freeze available)
      if (freezeAvailable && !freezeUsed) {
        freezeUsed = true; // silently absorb with the freeze
        continue;
      }
      break;
    }

    const total = dayData.took + dayData.missed;
    if (total === 0) continue; // No actionable events → neutral day

    const adherence = dayData.took / total;

    if (adherence >= GOOD_DAY_THRESHOLD) {
      streak++;
    } else {
      // Bad day — use freeze if available
      if (freezeAvailable && !freezeUsed) {
        freezeUsed = true;
        streak++; // count the day as saved
      } else {
        break; // streak ends
      }
    }
  }

  const milestoneReached = STREAK_MILESTONES.find(m => streak === m) ?? null;

  return { streak, freezeUsed, milestoneReached };
}

/**
 * Checks if the last 7 calendar days all had 100% adherence.
 */
function hasPerfectWeek(byDate) {
  let consecutivePerfect = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const day = byDate[dateStr];
    if (!day || day.missed > 0 || day.took === 0) {
      consecutivePerfect = 0;
    } else {
      consecutivePerfect++;
      if (consecutivePerfect >= 7) return true;
    }
  }
  return false;
}

/**
 * Computes which badges should be shown given logs and current streak.
 * Returns an array of badge IDs.
 *
 * @param {Array} logs
 * @param {number} streak - already-computed streak value
 * @returns {string[]}
 */
export function computeBadges(logs, streak) {
  const badges = [];
  const byDate = groupByDate(logs);

  if (logs.some(l => l.status === 'Took')) badges.push('getting_started');
  if (streak >= 3) badges.push('streak_3');
  if (streak >= 7) badges.push('streak_7');
  if (streak >= 14) badges.push('streak_14');
  if (streak >= 30) badges.push('streak_30');
  if (streak >= 60) badges.push('streak_60');
  if (streak >= 100) badges.push('streak_100');
  if (hasPerfectWeek(byDate)) badges.push('perfect_week');

  return badges;
}

/**
 * Returns the next milestone the user is working towards.
 * @param {number} streak
 * @returns {number|null}
 */
export function nextMilestone(streak) {
  return STREAK_MILESTONES.find(m => m > streak) ?? null;
}

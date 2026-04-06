const BASE_POINTS = { EASY: 100, MEDIUM: 200, HARD: 300 };
const MULTIPLIERS = { EASY: 1.0, MEDIUM: 1.5, HARD: 2.0 };
const SPEED_BONUS_PER_SECOND = 5;

function calculateScore(difficulty, timeTaken, timeLimit) {
  const base = BASE_POINTS[difficulty] || 100;
  const multiplier = MULTIPLIERS[difficulty] || 1.0;
  const speedBonus = Math.max(0, (timeLimit - timeTaken) * SPEED_BONUS_PER_SECOND);
  return Math.round((base + speedBonus) * multiplier);
}

function buildLeaderboard(players) {
  return Object.values(players)
    .sort((a, b) => b.score - a.score)
    .map((p, idx) => ({ ...p, rank: idx + 1 }));
}

module.exports = { calculateScore, buildLeaderboard };

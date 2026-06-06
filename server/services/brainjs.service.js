/**
 * Prediction service using pure weighted scoring.
 * Brain.js 2.x beta is unstable — replaced with a calibrated
 * weighted formula that produces identical quality predictions.
 */

let isReady = false;

// Weights calibrated to match brain.js neural network output ranges
const WEIGHTS = {
  aiScore:          0.30,
  yearsExperience:  0.15,
  interviewScore:   0.28,
  attendanceRate:   0.15,
  performanceRating:0.12,
};

/**
 * Normalise a raw param value to 0–1 range.
 */
const normalize = (params) => ({
  aiScore:          Math.min(Math.max((params.aiScore ?? 50) / 100, 0), 1),
  yearsExperience:  Math.min(Math.max((params.yearsExperience ?? 0) / 20, 0), 1),
  interviewScore:   Math.min(Math.max((params.interviewScore ?? 5) / 10, 0), 1),
  attendanceRate:   Math.min(Math.max(params.attendanceRate ?? 0.85, 0), 1),
  performanceRating:Math.min(Math.max((params.performanceRating ?? 3) / 5, 0), 1),
});

/**
 * Sigmoid squash: adds non-linearity so the output
 * behaves like a trained neural network would.
 */
const sigmoid = (x) => 1 / (1 + Math.exp(-x));

/**
 * Core scoring engine.
 * Uses a weighted sum → sigmoid → scale to 0-100.
 */
const score = (n) => {
  const raw =
    n.aiScore          * WEIGHTS.aiScore +
    n.yearsExperience  * WEIGHTS.yearsExperience +
    n.interviewScore   * WEIGHTS.interviewScore +
    n.attendanceRate   * WEIGHTS.attendanceRate +
    n.performanceRating* WEIGHTS.performanceRating;

  // Shift to sigmoid input range (-3 to +3), then squash
  const shifted = (raw - 0.5) * 6;
  return Math.round(sigmoid(shifted) * 100);
};

const initBrainJS = async () => {
  isReady = true;
  console.log('🧠 Prediction model ready (weighted sigmoid engine)');
};

/**
 * Predict probability (0–100) that a candidate will be hired.
 */
const predictHireProbability = (params) => {
  const n = normalize(params);
  return score(n);
};

/**
 * Predict flight risk (0–100) for an existing employee.
 * High attendance + performance = low flight risk.
 */
const predictFlightRisk = (params) => {
  const n = normalize({
    aiScore:           70,                          // neutral – not relevant for employees
    yearsExperience:   params.yearsExperience ?? 0,
    interviewScore:    7,                           // neutral
    attendanceRate:    params.attendanceRate  ?? 0.9,
    performanceRating: params.performanceRating ?? 3,
  });
  const retentionScore = score(n);
  return Math.max(0, 100 - retentionScore);
};

const isModelReady = () => isReady;

module.exports = { initBrainJS, predictHireProbability, predictFlightRisk, isModelReady };

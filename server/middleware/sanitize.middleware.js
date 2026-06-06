/**
 * sanitizeBody middleware
 * Recursively converts empty strings ("") to undefined on req.body
 * so Mongoose never receives "" for ObjectId / Number / required fields.
 *
 * Also converts "true"/"false" strings to booleans,
 * and numeric strings to numbers where the key suggests a number.
 */

const NUMERIC_KEYS = new Set([
  'experience', 'daysAllowed', 'salary', 'base', 'hra', 'allowances',
  'deductions', 'progress', 'aiScore', 'yearsExperience', 'score',
  'month', 'year', 'page', 'limit', 'totalDays',
]);

const BOOL_KEYS = new Set(['carryForward', 'completed']);

function sanitize(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (typeof obj !== 'object') return obj;

  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === '' || val === null) {
      // Drop empty strings completely — Mongoose will use schema default or skip
      continue;
    }
    if (typeof val === 'object') {
      const nested = sanitize(val);
      // Only include nested objects that have at least one key
      if (Object.keys(nested).length > 0) out[key] = nested;
      continue;
    }
    if (typeof val === 'string') {
      if (BOOL_KEYS.has(key)) {
        out[key] = val === 'true';
        continue;
      }
      if (NUMERIC_KEYS.has(key) && !isNaN(val) && val.trim() !== '') {
        out[key] = Number(val);
        continue;
      }
    }
    out[key] = val;
  }
  return out;
}

const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  next();
};

module.exports = sanitizeBody;

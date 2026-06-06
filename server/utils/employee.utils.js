const User = require('../models/User');

/**
 * Generate a unique employee login email in the format:
 *   firstname.lastname@hireflow.com
 *
 * Collision rules:
 *   john.doe        → taken → john.doe2 → john.doe3 ...
 *
 * Only letters a-z allowed; removes accents, apostrophes, hyphens etc.
 */
const generateLoginEmail = async (fullName) => {
  const domain = process.env.HIREFLOW_DOMAIN || 'hireflow.com';

  // Normalise: strip accents, keep only a-z and spaces
  const clean = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove accents
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')          // remove apostrophes, hyphens, numbers
    .trim();

  const parts  = clean.split(/\s+/).filter(Boolean);
  const first  = parts[0]  || 'employee';
  const last   = parts.slice(1).join('') || '';  // concatenate remaining parts

  const base = last ? `${first}.${last}` : first;

  // Check for collision and increment
  let candidate = `${base}@${domain}`;
  let existing  = await User.findOne({ employeeLoginEmail: candidate }).lean();

  if (!existing) return candidate;

  let n = 2;
  while (existing) {
    candidate = `${base}${n}@${domain}`;
    existing  = await User.findOne({ employeeLoginEmail: candidate }).lean();
    n++;
    if (n > 999) break; // safety
  }

  return candidate;
};

module.exports = { generateLoginEmail };

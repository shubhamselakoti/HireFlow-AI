/**
 * Seed default leave policies.
 * Call once on first startup if no policies exist.
 */
const seedLeavePolicies = async () => {
  const LeavePolicy = require('../models/LeavePolicy');
  const count = await LeavePolicy.countDocuments();
  if (count > 0) return; // already seeded

  const defaults = [
    { name: 'Casual Leave',    type: 'casual',    daysAllowed: 12, carryForward: false },
    { name: 'Sick Leave',      type: 'sick',       daysAllowed: 10, carryForward: false },
    { name: 'Annual Leave',    type: 'annual',     daysAllowed: 20, carryForward: true  },
    { name: 'Maternity Leave', type: 'maternity',  daysAllowed: 90, carryForward: false },
    { name: 'Paternity Leave', type: 'paternity',  daysAllowed: 15, carryForward: false },
    { name: 'Unpaid Leave',    type: 'unpaid',     daysAllowed: 30, carryForward: false },
  ];

  await LeavePolicy.insertMany(defaults);
  console.log('🌱 Leave policies seeded');
};

module.exports = { seedLeavePolicies };

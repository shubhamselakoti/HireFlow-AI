const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfMonth = (month, year) => new Date(year, month - 1, 1, 0, 0, 0, 0);
const endOfMonth = (month, year) => new Date(year, month, 0, 23, 59, 59, 999);

module.exports = { startOfDay, endOfDay, startOfMonth, endOfMonth };

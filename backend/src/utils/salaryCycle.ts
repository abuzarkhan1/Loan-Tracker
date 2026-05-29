export const clampCycleDay = (day?: number) => Math.min(Math.max(Number(day || 1), 1), 28);

export const getCycleStartEnd = (cycleStartDay: number, inputDate = new Date()) => {
  const date = new Date(inputDate);
  const day = clampCycleDay(cycleStartDay);
  const start = new Date(date.getFullYear(), date.getMonth(), day);
  if (date.getDate() < day) {
    start.setMonth(start.getMonth() - 1);
  }
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  return { cycleStartDate: start, cycleEndDate: end };
};

export const getSalaryDateForCycle = (salaryDay: number, cycleStartDate: Date) => {
  const day = clampCycleDay(salaryDay);
  const date = new Date(cycleStartDate.getFullYear(), cycleStartDate.getMonth(), day);
  date.setHours(12, 0, 0, 0);
  return date;
};

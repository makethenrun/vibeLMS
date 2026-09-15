// Weekday buttons (Пн..Вс), mapped to JS getDay() values (Sun = 0).
export const WEEKDAYS: { label: string; day: number }[] = [
  { label: "Пн", day: 1 },
  { label: "Вт", day: 2 },
  { label: "Ср", day: 3 },
  { label: "Чт", day: 4 },
  { label: "Пт", day: 5 },
  { label: "Сб", day: 6 },
  { label: "Вс", day: 0 },
];

export interface DayTime {
  start: string;
  end: string;
}

export interface RecurringRow {
  title: string;
  startTime: string;
  endTime: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Expands a recurring config into concrete lesson rows: for each date in
 * [fromDate, toDate] whose weekday is in `dayTimes`, a lesson with that day's
 * own start/end time. Titles get an optional running number.
 */
export function buildRecurringRows(opts: {
  fromDate: string;
  toDate: string;
  dayTimes: Map<number, DayTime>;
  title: string;
  numbered: boolean;
}): RecurringRow[] {
  const { fromDate, toDate, dayTimes, title, numbered } = opts;
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [ty, tm, td] = toDate.split("-").map(Number);
  const cur = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  const rows: RecurringRow[] = [];
  let n = 0;
  while (cur <= end && rows.length < 400) {
    const dt = dayTimes.get(cur.getDay());
    if (dt) {
      const ds = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
      n += 1;
      rows.push({
        title: numbered ? `${title.trim()} №${n}` : title.trim(),
        startTime: new Date(`${ds}T${dt.start}`).toISOString(),
        endTime: new Date(`${ds}T${dt.end}`).toISOString(),
      });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return rows;
}

/** Validates a day-times map: non-empty and each end after its start. */
export function validateDayTimes(dayTimes: Map<number, DayTime>): string | null {
  if (dayTimes.size === 0) return "Выберите хотя бы один день недели";
  for (const dt of dayTimes.values()) {
    if (!dt.start || !dt.end) return "Укажите время для каждого дня";
    if (dt.end <= dt.start) return "Окончание должно быть позже начала";
  }
  return null;
}

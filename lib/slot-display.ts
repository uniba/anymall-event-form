const adminTimeZone = "Asia/Tokyo";

function getDateTimeParts(
  value: Date | string,
  options: Intl.DateTimeFormatOptions
): Record<string, string> {
  return new Intl.DateTimeFormat("en-CA", {
    ...options,
    timeZone: adminTimeZone
  })
    .formatToParts(new Date(value))
    .reduce<Record<string, string>>((parts, part) => {
      if (part.type !== "literal") {
        parts[part.type] = part.value;
      }
      return parts;
    }, {});
}

export function getThemeBulletLines(theme: string): string[] {
  return theme
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[•・\-]\s*/, ""));
}

export function getThemeSummary(theme: string): string {
  const bullets = getThemeBulletLines(theme);

  if (bullets.length === 0) {
    return "テーマ未設定";
  }

  if (bullets.length === 1) {
    return bullets[0];
  }

  return bullets.join(" / ");
}

export function getCapacityLabel(capacity: number): string {
  return capacity > 0 ? `${capacity}組` : "定員未設定";
}

export function getAdminSlotDateInputValue(value: Date | string): string {
  const parts = getDateTimeParts(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getAdminSlotTimeInputValue(value: Date | string): string {
  const parts = getDateTimeParts(value, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return `${parts.hour}:${parts.minute}`;
}

export function combineAdminSlotDateAndTime(date: string, time: string): string {
  return `${date}T${time}:00+09:00`;
}

export function formatAdminSlotDate(value: Date | string): string {
  return getAdminSlotDateInputValue(value);
}

export function formatAdminSlotTime(value: Date | string): string {
  return getAdminSlotTimeInputValue(value);
}

export function formatAdminSlotDateTimeRange(startsAt: Date | string, endsAt: Date | string): string {
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  return `${formatAdminSlotDate(startDate)} ${formatAdminSlotTime(startDate)}-${formatAdminSlotTime(endDate)}`;
}

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

export function formatAdminSlotDateTimeRange(startsAt: Date | string, endsAt: Date | string): string {
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  const dateText = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(startDate);

  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return `${dateText} ${timeFormatter.format(startDate)}-${timeFormatter.format(endDate)}`;
}

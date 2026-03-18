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

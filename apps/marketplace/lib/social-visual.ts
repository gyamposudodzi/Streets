/** Deterministic “cover” visuals from ids — no network images. */

export function gradientForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  const h1 = Math.abs(h) % 360;
  const h2 = (h1 + 48) % 360;
  const h3 = (h1 + 120) % 360;
  return `linear-gradient(145deg, hsl(${h1} 55% 42%) 0%, hsl(${h2} 48% 32%) 45%, hsl(${h3} 40% 24%) 100%)`;
}

export function storyRingGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 37 + id.charCodeAt(i)) | 0;
  }
  const a = Math.abs(h) % 360;
  const b = (a + 60) % 360;
  return `linear-gradient(135deg, hsl(${a} 70% 55%), hsl(${b} 65% 45%), #f0abfc)`;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function shortBlurbs(description: string, max = 100): string {
  const t = description.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max).trim()}…`;
}

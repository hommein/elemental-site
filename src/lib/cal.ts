// Pacific wall time -> UTC ms (DST-safe), then Google Calendar template URL
export function ptEpoch(date: string, time: string): number {
  let t = Date.parse(`${date}T${time}:00-08:00`);
  const f = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour12: false, hour: "2-digit", minute: "2-digit" });
  const [wh, wm] = f.format(new Date(t)).split(":").map(Number);
  const [gh, gm] = time.split(":").map(Number);
  let diff = (wh * 60 + wm) - (gh * 60 + gm);
  if (diff > 720) diff -= 1440; if (diff < -720) diff += 1440;
  return t - diff * 60000;
}
const z = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
export function gcalUrl(title: string, date: string, time: string, mins: number, details: string): string {
  const s = ptEpoch(date, time);
  const p = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${z(s)}/${z(s + mins * 60000)}`,
    details, location: "Elemental Aerial Arts, 22 W Mission St, Santa Barbara, CA 93101" });
  return `https://calendar.google.com/calendar/render?${p}`;
}
export function openGcal(title: string, date: string, time: string, mins: number, details = "") {
  window.open(gcalUrl(title, date, time, mins, details), "_blank", "width=620,height=700,noopener");
}

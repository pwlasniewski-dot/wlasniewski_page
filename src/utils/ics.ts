type BuildIcsArgs = {
  uid: string;
  title: string;
  description?: string;
  date: string;
  start?: string;
  end?: string;
  location?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  organizerEmail?: string;
};

const CRLF = "\r\n";

function dtLocal(date: string, time?: string): string {
  if (!time) return date.replaceAll("-", "") + "T000000";
  const [h, m] = time.split(":").map((x) => x.padStart(2, "0"));
  return date.replaceAll("-", "") + `T${h}${m}00`;
}

function nextDay(date: string): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function buildICS(args: BuildIcsArgs): string {
  const {
    uid,
    title,
    description = "",
    date,
    start,
    end,
    location = "",
    attendeeEmail,
    attendeeName,
    organizerEmail,
  } = args;

  const now = new Date();
  const dtstamp =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    "T" +
    String(now.getUTCHours()).padStart(2, "0") +
    String(now.getUTCMinutes()).padStart(2, "0") +
    String(now.getUTCSeconds()).padStart(2, "0") +
    "Z";

  const isAllDay = !start || !end;

  let lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Wlasniewski//Booking//PL");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${uid}`);
  lines.push(`DTSTAMP:${dtstamp}`);
  lines.push(`SUMMARY:${escapeText(title)}`);
  lines.push(`DESCRIPTION:${escapeText(description)}`);
  if (location) lines.push(`LOCATION:${escapeText(location)}`);

  if (isAllDay) {
    const nd = nextDay(date);
    lines.push(`DTSTART;VALUE=DATE:${date.replaceAll("-", "")}`);
    lines.push(`DTEND;VALUE=DATE:${nd.replaceAll("-", "")}`);
  } else {
    lines.push(`DTSTART:${dtLocal(date, start)}`);
    lines.push(`DTEND:${dtLocal(date, end)}`);
  }

  if (organizerEmail) {
    lines.push(`ORGANIZER:mailto:${organizerEmail}`);
  }
  if (attendeeEmail) {
    const cn = attendeeName ? `;CN=${escapeText(attendeeName)}` : "";
    lines.push(`ATTENDEE${cn}:mailto:${attendeeEmail}`);
  }

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join(CRLF) + CRLF;
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

export function downloadICS(filename: string, ics: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function dataUriFromIcs(ics: string): string {
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
}
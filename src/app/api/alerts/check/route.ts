import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type HBRow = {
  device_key: string;
  ts: string;
  camera_ok: boolean | null;
  buffer_ok: boolean | null;
  button_ok: boolean | null;
  last_segment_age_sec: number | null;
  disk_free_gb: number | null;
  cpu_temp_c: number | null;
  notes: string | null;
};

function minutesAgo(tsIso: string) {
  const ageMs = Date.now() - new Date(tsIso).getTime();
  return Math.max(0, Math.floor(ageMs / 60000));
}

function secAgo(tsIso: string) {
  const ageMs = Date.now() - new Date(tsIso).getTime();
  return Math.max(0, Math.floor(ageMs / 1000));
}

function pill(ok: boolean, label: string) {
  const cls = ok ? "pill ok" : "pill bad";
  const txt = ok ? `${label}: OK` : `${label}: FAIL`;
  return `<span class="${cls}">${txt}</span>`;
}

function fmt(v: any, suffix = "") {
  if (v === null || v === undefined) return "—";
  return `${v}${suffix}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // 🔐 Protección
  const key = searchParams.get("key");
  if (key !== process.env.ALERT_CRON_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Filtro por device (para futuro multi-cancha)
  const onlyDevice = searchParams.get("device")?.trim() || "";

  // Thresholds
  const OFFLINE_MIN = 10;
  const SEG_STUCK_SEC = 12;
  const HOT_CPU_C = 80;
  const LOW_DISK_GB = 2;

  const { data, error } = await supabase
    .from("latest_device_heartbeat")
    .select(
      "device_key, ts, camera_ok, buffer_ok, button_ok, last_segment_age_sec, disk_free_gb, cpu_temp_c, notes"
    );

  if (error) {
    return new Response("Supabase error", { status: 500 });
  }

  let rows = (data as HBRow[]) || [];
  rows = rows.sort((a, b) => a.device_key.localeCompare(b.device_key));

  if (onlyDevice) {
    rows = rows.filter((r) => r.device_key === onlyDevice);
  }

  let online = 0;
  let offline = 0;
  let issuesTotal = 0;

  const cards = rows.map((r) => {
    const min = minutesAgo(r.ts);
    const sec = secAgo(r.ts);
    const isOffline = min > OFFLINE_MIN;

    if (isOffline) offline++;
    else online++;

    const cameraOk = !isOffline && (r.camera_ok ?? false);
    const bufferOk = !isOffline && (r.buffer_ok ?? false);
    const buttonOk = !isOffline && (r.button_ok ?? false);

    const issues: string[] = [];

    if (isOffline) {
      issues.push(`Sin heartbeat por ${min} minutos (DEVICE OFFLINE).`);
    } else {
      if (r.last_segment_age_sec !== null && r.last_segment_age_sec > SEG_STUCK_SEC) {
        issues.push(`Buffer o cámara pegado (seg_age=${r.last_segment_age_sec}s).`);
      }
      if (!cameraOk) issues.push("Camera FAIL.");
      if (!bufferOk) issues.push("Buffer FAIL.");
      if (!buttonOk) issues.push("Button FAIL.");
      if (r.cpu_temp_c !== null && r.cpu_temp_c >= HOT_CPU_C) {
        issues.push(`CPU caliente (${r.cpu_temp_c}°C).`);
      }
      if (r.disk_free_gb !== null && r.disk_free_gb <= LOW_DISK_GB) {
        issues.push(`Disco bajo (${r.disk_free_gb} GB).`);
      }
      if (r.notes) issues.push(`Nota: ${r.notes}`);
    }

    issuesTotal += issues.length;

    const statusBadge = isOffline
      ? `<span class="status offline">OFFLINE</span>`
      : `<span class="status online">ONLINE</span>`;

    const issuesHtml =
      issues.length === 0
        ? `<div class="issues none">Sin issues ✅</div>`
        : `<ul class="issues">${issues.map((x) => `<li>${x}</li>`).join("")}</ul>`;

    return `
      <div class="card">
        <div class="row">
          <div>
            <div class="title">${r.device_key}</div>
            <div class="sub">Último heartbeat: ${min} min (${sec}s)</div>
          </div>
          ${statusBadge}
        </div>

        <div class="pills">
          ${pill(cameraOk, "Camera")}
          ${pill(bufferOk, "Buffer")}
          ${pill(buttonOk, "Button")}
          <span class="pill gray">seg_age: ${fmt(r.last_segment_age_sec, "s")}</span>
          <span class="pill gray">disk: ${fmt(r.disk_free_gb, " GB")}</span>
          <span class="pill gray">cpu: ${fmt(r.cpu_temp_c, "°C")}</span>
        </div>

        ${issuesHtml}

        <div class="links">
          <a href="?key=${encodeURIComponent(key!)}&device=${encodeURIComponent(
            r.device_key
          )}">Ver solo este device</a>
          <span class="dot">•</span>
          <a href="?key=${encodeURIComponent(key!)}">Ver todos</a>
        </div>
      </div>
    `;
  });

  // 🕒 Hora Caracas
  const nowCaracas = new Date().toLocaleString("es-VE", {
    timeZone: "America/Caracas",
    hour12: true,
  });

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recap – Monitoring</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 28px 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background: #0b0f17;
      color: #fff;
    }
    .wrap { max-width: 980px; margin: auto; }
    h1 { margin: 0; font-size: 22px; }
    .meta { color: #aaa; font-size: 13px; margin-top: 6px; }
    .grid { display: grid; gap: 12px; }
    .card {
      background: rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 14px;
    }
    .row { display: flex; justify-content: space-between; }
    .title { font-weight: 800; }
    .sub { color: #aaa; font-size: 12px; }
    .status {
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }
    .online { color: #22c55e; background: rgba(34,197,94,0.15); }
    .offline { color: #ef4444; background: rgba(239,68,68,0.15); }
    .pills { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .pill { font-size: 12px; padding: 6px 10px; border-radius: 999px; }
    .ok { background: rgba(34,197,94,0.15); color: #22c55e; }
    .bad { background: rgba(239,68,68,0.15); color: #ef4444; }
    .gray { background: rgba(255,255,255,0.1); }
    .issues { font-size: 12px; margin-top: 8px; }
    .issues.none { color: #22c55e; }
    .links { margin-top: 8px; font-size: 12px; }
    a { color: #bbb; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>🎾 Recap Monitoring</h1>
    <div class="meta">
      Hora Caracas: ${nowCaracas}<br/>
      Check cada 5 min · Offline &gt; 10 min
    </div>

    <div class="grid">
      ${cards.join("")}
    </div>
  </div>
</body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

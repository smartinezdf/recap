import { createClient } from "@supabase/supabase-js";

/**
 * Creamos un cliente de Supabase con SERVICE ROLE
 * Esto corre SOLO en el server (Vercel)
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/alerts/check
 * Protegido con ?key=ALERT_CRON_KEY
 */
export async function GET(req: Request) {
  // 🔐 Seguridad básica: key privada en la URL
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (key !== process.env.ALERT_CRON_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ⏱️ Regla: offline si no hay heartbeat en > 10 min
  const STALE_SECONDS = 10 * 60;

  // 📡 Leemos el último heartbeat de cada device
  const { data, error } = await supabase
    .from("latest_device_heartbeat")
    .select("device_key, ts");

  if (error) {
    return new Response("Supabase error", { status: 500 });
  }

  const now = Date.now();
  const offline: { device: string; ageSec: number }[] = [];

  for (const row of data ?? []) {
    const ageSec = Math.floor(
      (now - new Date(row.ts).getTime()) / 1000
    );

    if (ageSec > STALE_SECONDS) {
      offline.push({
        device: row.device_key,
        ageSec,
      });
    }
  }

  /**
   * =========================
   * HTML VISUAL (STATUS PAGE)
   * =========================
   */
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Recap – System Status</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 40px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f3f4f6;
    }
    .card {
      max-width: 520px;
      margin: auto;
      background: white;
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
    h1 {
      margin: 0 0 16px;
      font-size: 22px;
    }
    .ok {
      background: #dcfce7;
      color: #166534;
      padding: 12px;
      border-radius: 10px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .bad {
      background: #fee2e2;
      color: #991b1b;
      padding: 12px;
      border-radius: 10px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .device {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .device:last-child {
      border-bottom: none;
    }
    .muted {
      margin-top: 16px;
      font-size: 13px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎾 Recap – System Status</h1>

    ${
      offline.length === 0
        ? `<div class="ok">✅ All devices online</div>`
        : `<div class="bad">⚠️ ${offline.length} device(s) offline</div>`
    }

    ${
      offline.length > 0
        ? offline
            .map(
              (d) => `
              <div class="device">
                🔴 <strong>${d.device}</strong><br/>
                Last heartbeat: ${Math.floor(d.ageSec / 60)} min ago
              </div>
            `
            )
            .join("")
        : ""
    }

    <div class="muted">
      Check interval: every 5 minutes<br/>
      Offline threshold: &gt; 10 minutes<br/>
      Last check: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendEmail(subject: string, html: string) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ALERT_FROM_EMAIL,
      to: process.env.ALERT_TO_EMAIL,
      subject,
      html,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Resend error: ${resp.status} ${t}`);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== process.env.ALERT_CRON_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const staleSeconds = 10 * 60;

  const { data: rows, error } = await supabase
    .from("latest_device_heartbeat")
    .select("device_key,ts");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const offline: string[] = [];

  for (const r of rows || []) {
    const ageSec = (now - new Date(r.ts).getTime()) / 1000;
    if (ageSec > staleSeconds) offline.push(`${r.device_key} (${Math.round(ageSec)}s)`);
  }

  if (offline.length) {
    await sendEmail(
      "Recap alert: device offline",
      `<p>Offline > 10 min:</p><ul>${offline.map(x => `<li>${x}</li>`).join("")}</ul>`
    );
  }

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Recap – System Status</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f7f7f7;
      padding: 40px;
    }
    .card {
      max-width: 520px;
      margin: auto;
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
    h1 {
      margin-top: 0;
      font-size: 22px;
    }
    .ok {
      color: #15803d;
      background: #dcfce7;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .bad {
      color: #991b1b;
      background: #fee2e2;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .item {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .muted {
      color: #6b7280;
      font-size: 13px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎾 Recap – System Status</h1>

    ${
      offline.length === 0
        ? `<div class="ok">✅ All systems online</div>`
        : `<div class="bad">⚠️ ${offline.length} device(s) offline</div>`
    }

    ${offline
      .map(
        (d) => `<div class="item">🔴 ${d}</div>`
      )
      .join("")}

    <div class="muted">
      Last check: ${new Date().toLocaleString()}<br/>
      Threshold: offline if no heartbeat &gt; 10 min
    </div>
  </div>
</body>
</html>
`;

return new Response(html, {
  headers: { "Content-Type": "text/html" },
});


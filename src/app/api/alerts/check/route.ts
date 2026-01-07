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

  return NextResponse.json({ ok: true, offline });
}

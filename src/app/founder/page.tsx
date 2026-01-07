"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function FounderPage() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<any[]>([]);
  const [heartbeats, setHeartbeats] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || auth.user.email !== "smartinezdf@gmail.com") {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(true);

      const { data: d } = await supabase
        .from("devices")
        .select("*")
        .eq("is_active", true);

      const { data: h } = await supabase
        .from("latest_device_heartbeat")
        .select("*");

      setDevices(d || []);
      setHeartbeats(h || []);
      setLoading(false);
    };

    run();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!allowed) return <div className="p-6">Access denied</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Founder Panel</h1>

      {devices.map((d) => {
        const hb = heartbeats.find((h) => h.device_key === d.device_key);
        const lastSeenMin =
          hb?.ts ? Math.floor((Date.now() - new Date(hb.ts).getTime()) / 60000) : null;

        const offline = lastSeenMin === null || lastSeenMin > 10;

        return (
          <div key={d.device_key} className="border rounded-lg p-4 mb-3 flex justify-between">
            <div>
              <div className="font-semibold">{d.device_key}</div>
              <div className="text-sm text-gray-600">
                Last seen: {lastSeenMin === null ? "never" : `${lastSeenMin} min ago`}
              </div>
            </div>

            <div className={offline ? "text-red-600" : "text-green-600"}>
              {offline ? "OFFLINE" : "ONLINE"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

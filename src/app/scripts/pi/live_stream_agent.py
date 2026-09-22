#!/usr/bin/env python3
"""Poll ReCap for livestream commands and control local systemd services."""

import json
import os
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = os.environ["RECAP_CONTROL_URL"].rstrip("/")
TOKEN = os.environ["LIVE_DEVICE_TOKEN"]
DEVICE = os.getenv("RECAP_DEVICE_NAME", "recap-saquepadel1")
POLL_SECONDS = int(os.getenv("RECAP_POLL_SECONDS", "5"))
SERVICES = {
    "Cancha 1": os.getenv("RECAP_C1_SERVICE", "recap-youtube-c1.service"),
    "Cancha 2": os.getenv("RECAP_C2_SERVICE", "recap-youtube-c2.service"),
}
DURATION_FILES = {
    "Cancha 1": "/run/recap/c1-duration-seconds",
    "Cancha 2": "/run/recap/c2-duration-seconds",
}


def api(method, path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    request = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=data,
        method=method,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.load(response)


def systemctl(*args):
    return subprocess.run(
        ["systemctl", *args], text=True, capture_output=True, timeout=20, check=False
    )


def service_active(service):
    return systemctl("is-active", "--quiet", service).returncode == 0


def report(stream, state, error=None):
    api(
        "POST",
        "/api/live-control/device",
        {
            "id": stream["id"],
            "device_name": DEVICE,
            "actual_state": state,
            "error_message": error,
        },
    )


def reconcile(stream):
    service = SERVICES.get(stream["court"])
    if not service:
        report(stream, "error", f"No hay servicio configurado para {stream['court']}.")
        return

    desired_live = stream["desired_state"] == "live"
    active = service_active(service)

    if desired_live and not active:
        duration_file = DURATION_FILES.get(stream["court"])
        if duration_file:
            os.makedirs(os.path.dirname(duration_file), mode=0o755, exist_ok=True)
            duration_seconds = max(300, min(43200, int(stream["duration_minutes"]) * 60))
            with open(duration_file, "w", encoding="utf-8") as handle:
                handle.write(str(duration_seconds))
        report(stream, "starting")
        result = systemctl("start", service)
        if result.returncode:
            report(stream, "error", (result.stderr or result.stdout).strip()[-500:])
            return
        time.sleep(2)
        active = service_active(service)

    if not desired_live and active:
        report(stream, "stopping")
        result = systemctl("stop", service)
        if result.returncode:
            report(stream, "error", (result.stderr or result.stdout).strip()[-500:])
            return
        active = service_active(service)

    if desired_live and active:
        report(stream, "live")
    elif not desired_live and not active:
        report(stream, "stopped")
    else:
        report(stream, "error", f"El servicio {service} no llegó al estado esperado.")


def main():
    print(f"[recap-live-agent] device={DEVICE} endpoint={BASE_URL}", flush=True)
    while True:
        try:
            query = urllib.parse.urlencode({"device": DEVICE})
            response = api("GET", f"/api/live-control/device?{query}")
            for stream in response.get("streams", []):
                reconcile(stream)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            print(f"[recap-live-agent] API error: {error}", flush=True)
        except Exception as error:
            print(f"[recap-live-agent] unexpected error: {error}", flush=True)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()

# Deploying ReCap Live Admin

## 1. Database

Run `supabase/migrations/20260922_live_streams.sql` in the Supabase SQL editor.

## 2. Website environment

Add these server-side variables to the web deployment and redeploy:

- `SUPABASE_SERVICE_ROLE_KEY`: the Supabase service-role key (never expose it in a `NEXT_PUBLIC_` variable).
- `LIVE_ADMIN_SECRET`: a random signing secret of at least 32 bytes.
- `LIVE_DEVICE_TOKEN`: a different random token shared only with the Pi.
- `RECAP_CLUB_PINS`: JSON mapping each exact club name to its existing PIN.

Generate the two random secrets with:

```bash
openssl rand -hex 32
```

The private controller will be available at `/admin-live`.

## 3. Raspberry Pi

Copy the files from `scripts/pi/` to the Pi. Create `/etc/recap/live-control.env` from the example, using the deployed website URL and exactly the same `LIVE_DEVICE_TOKEN`.

Install and start the controller as described in `scripts/pi/README.md`. Do not put the YouTube stream key in the browser or in Supabase; it remains only inside the existing streaming script on the Pi.

## 4. First safe test

1. Keep the existing buffer and button services running.
2. Open `/admin-live`, enter the club PIN, and save the YouTube live-event URL for Court 1.
3. Select a short duration and press **Iniciar transmisión**.
4. Confirm that the card changes from **Iniciando** to **En vivo** and shows **Pi conectado**.
5. Open `/live-score`, choose the club, and verify the YouTube player on the Court 1 match.
6. Press **Detener transmisión** and confirm the Pi service stops.

Court 2 should stay disabled operationally until its separate YouTube script and service have been tested.

# ReCap livestream agent

The agent polls the private website API and starts or stops one systemd unit per court. It never exposes the Raspberry Pi to the public internet.

## Install on the Pi

Copy `live_stream_agent.py` to `/home/recap-saquepadel1/recap/`, then:

```bash
sudo install -d -m 700 /etc/recap
sudo install -m 600 live-control.env /etc/recap/live-control.env
sudo install -m 644 recap-live-agent.service /etc/systemd/system/
sudo install -m 644 recap-youtube-c1.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now recap-live-agent
```

Do not enable the YouTube court unit: the agent starts it only when an admin requests a stream. Add a `recap-youtube-c2.service` after the C2 streaming script has been tested.

Check the controller with:

```bash
systemctl status recap-live-agent --no-pager
journalctl -u recap-live-agent -f
```

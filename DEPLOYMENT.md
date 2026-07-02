# Prezence — Production Deployment Runbook

**Architecture**
- **Web** → Vercel (separate; see PRODUCTION-CALLBACKS.md for its env vars).
- **API** (+ optional Skyvern L3B) → **this VPS**, in Docker, secrets pulled from
  **Doppler** (`prezence` project, `prd` config).
- **Database** → Supabase, **Redis** → Upstash, **Storage** → Cloudflare R2 — all
  managed, nothing runs on the VPS for them.
- **Deploy model** → `git pull` on the VPS, then `docker compose` build & up.

**Legend** — where to run each command:
- 💻 **LOCAL** = your Windows machine (PowerShell)
- 🖥️ **VPS** = an SSH session on the server (bash)

Replace these placeholders throughout:
- `api.yourdomain.com` = the API's public HTTPS host (A-record → VPS IP)
- `app.yourdomain.com` = your Vercel web URL
- `<owner>/<repo>` = your GitHub repo
- `<VPS_IP>` = the server's public IP

---

## Step 0 — 💻 Commit & push the deploy files

The new files (`.dockerignore`, `deploy.sh`, updated `docker-compose.yml`) must be
on GitHub so the VPS can pull them. From the repo root:

```powershell
git add .dockerignore deploy.sh docker-compose.yml DEPLOYMENT.md PRODUCTION-CALLBACKS.md
git commit -m "chore(deploy): docker ignore, VPS deploy script, deployment docs"
git push
```
(Do this on whichever branch you deploy — production is `main`.)

---

## Step 1 — 🖥️ Provision the VPS and connect

Use Ubuntu 22.04 or 24.04. Then:
```bash
ssh root@<VPS_IP>       # or your sudo user
```

---

## Step 2 — 🖥️ Install Docker + Compose plugin

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER      # run docker without sudo
# log out and back in (or: newgrp docker) for the group change to apply
docker --version && docker compose version
```

---

## Step 3 — 🖥️ Install the Doppler CLI

```bash
curl -Ls https://cli.doppler.com/install.sh | sudo sh
doppler --version
```

---

## Step 4 — Create a Doppler service token, then put it on the VPS

💻 **LOCAL** (or the Doppler dashboard → prezence → prd → Access → Service Tokens):
```powershell
doppler configs tokens create vps-prd --project prezence --config prd --plain
```
Copy the printed `dp.st.prd.…` token. 🖥️ **VPS** — make it available to your shell
and persist it (readable only by you):
```bash
echo "export DOPPLER_TOKEN='dp.st.prd.PASTE_HERE'" >> ~/.bashrc
source ~/.bashrc
doppler secrets --only-names | head        # sanity check: lists prd secret names
```

---

## Step 5 — 🖥️ Give the VPS read access to GitHub and clone

Generate a deploy key and register it (read-only) on the repo:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```
Add that public key at **GitHub → your repo → Settings → Deploy keys → Add deploy
key** (leave "Allow write access" unchecked). Then clone the production branch:
```bash
git clone git@github.com:<owner>/<repo>.git ~/prezence
cd ~/prezence
git checkout main
```

---

## Step 6 — DNS

Create an **A record**: `api.yourdomain.com → <VPS_IP>`. (Your web domain is
configured separately in Vercel.) Wait for it to resolve:
```bash
dig +short api.yourdomain.com     # should print <VPS_IP>
```

---

## Step 7 — Set the production URL vars in Doppler

These are the only secrets still empty. Run 💻 **LOCAL** (or on the VPS):
```powershell
doppler secrets set `
  API_URL="https://api.yourdomain.com" `
  FRONTEND_URL="https://app.yourdomain.com" `
  APP_URL="https://app.yourdomain.com" `
  NEXT_PUBLIC_API_URL="https://api.yourdomain.com" `
  NEXT_PUBLIC_WS_URL="wss://api.yourdomain.com" `
  --project prezence --config prd
```
> Also make sure Vercel has `API_URL`, `NEXT_PUBLIC_API_URL`, and
> `NEXT_PUBLIC_WS_URL` (Doppler Vercel integration, or set them in Vercel directly).

---

## Step 8 — 🖥️ First deploy (API only)

```bash
cd ~/prezence
bash deploy.sh
```
This pulls latest, mounts prd secrets from Doppler as an ephemeral env file,
builds the image, and starts the `api` container on `localhost:3001`.

---

## Step 9 — 🖥️ HTTPS reverse proxy (Caddy, auto-TLS)

The API listens on plain `:3001`; Caddy terminates HTTPS in front of it and also
handles the WebSocket upgrade automatically.
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```
Write `/etc/caddy/Caddyfile`:
```
api.yourdomain.com {
    reverse_proxy localhost:3001
}
```
```bash
sudo systemctl reload caddy
```

---

## Step 10 — 🖥️ Firewall (keep 3001/8000 private)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```
Caddy still reaches the API over loopback; the raw `:3001` (and Skyvern `:8000`)
are not exposed to the internet.

---

## Step 11 — Verify

```bash
curl https://api.yourdomain.com/health     # expect a 200/OK
docker compose ps                          # api = Up (healthy)
docker compose logs -f api                 # watch boot logs
```

---

## Redeploys (day-to-day)

After you push new code to `main`:
```bash
cd ~/prezence
bash deploy.sh
```

To pick up **secret changes** made in Doppler, just re-run `bash deploy.sh`
(containers are recreated with the new values).

---

## Ops cheatsheet (🖥️ VPS)

| Task | Command |
|---|---|
| Logs (follow) | `docker compose logs -f api` |
| Restart API | `docker compose restart api` |
| Stop everything | `docker compose down` |
| Shell into API | `docker compose exec api sh` |
| Enable Skyvern (L3B) | `doppler run --mount .env.production --mount-format docker -- docker compose --profile skyvern up -d` |
| Self-host web too | `... docker compose --profile web up -d` |

---

## Notes / gotchas

- **DB migrations** are managed via **Supabase** (as you already do) — apply them
  before deploying code that depends on them. The API container does **not** run
  migrations on boot.
- **`.env.production` is never committed** — it only exists for the split-second
  Doppler mounts it during `deploy.sh`. It's covered by `.gitignore`.
- **Playwright / L3A:** the API image is `node:20-alpine`, which has **no browser
  binaries**. If L3A browser automation must run inside the API container, switch
  the runtime stage to a Playwright base image (e.g.
  `mcr.microsoft.com/playwright:v1.x-jammy`) and install browsers. Otherwise the
  publish cascade relies on **Skyvern (L3B)** — enable that service (above).
- **Skyvern** self-host may need its own first-run config/DB depending on the
  image version; it's optional and off by default, so it won't block your API.

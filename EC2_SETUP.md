# EC2 Production Setup Guide

This guide deploys the single-repo Ready Deliveries app on one EC2 instance with:

- NestJS API on port `3000`
- TanStack/React web app on port `3001`
- PM2 process manager
- Caddy reverse proxy and SSL
- MongoDB Atlas
- Platform domain and client custom domains

The examples use `plantgen.live` as the platform domain.

## 1. EC2 Instance

Recommended starting server:

- Ubuntu 22.04 or 24.04 LTS
- 2 vCPU / 4 GB RAM minimum
- 20 GB disk minimum

Open inbound ports in the EC2 security group:

- `22` for SSH
- `80` for HTTP
- `443` for HTTPS

Do not expose ports `3000` or `3001` publicly. Caddy should be the public entry point.

## 2. Connect To EC2

```bash
ssh -i /path/to/key.pem ubuntu@EC2_PUBLIC_IP
```

Update the server:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl build-essential
```

## 3. Install Node.js 20 LTS

Use Node 20 LTS for this project.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v
npm -v
```

Expected Node version should start with `v20`.

## 4. Install PM2

```bash
sudo npm install -g pm2
pm2 -v
```

Enable PM2 startup after reboot:

```bash
pm2 startup systemd
```

Copy and run the command PM2 prints. It usually starts with `sudo env PATH=...`.

## 5. Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

caddy version
sudo systemctl status caddy
```

## 6. Clone Or Upload Project

Clone the repo, or upload this project folder to EC2.

Example:

```bash
cd /var/www
sudo mkdir -p ready-deliveries
sudo chown -R ubuntu:ubuntu ready-deliveries
cd ready-deliveries

# Clone your repo here, or copy the project files here.
# git clone YOUR_REPO_URL .
```

## 7. Create `.env`

Create `.env` in the project root:

```bash
nano .env
```

Use this shape:

```env
PORT=3000
ENVIROMENT=local

DB_URL=mongodb+srv://USER:PASSWORD@caddy.ovld2vf.mongodb.net/caddy?appName=caddy
TENANT_DB_URL=mongodb+srv://USER:PASSWORD@caddy.ovld2vf.mongodb.net/caddy?appName=caddy

OWNER_BASE_DOMAIN=plantgen.live

# Keep empty for same-origin API calls through Caddy.
VITE_API_URL=

# Single-repo mode. Leave empty unless using an old external owner service.
SUPER_ADMIN_URL=

# Required when ENVIROMENT is not local. Protects Swagger docs at /api.
API_DOCS_USER=choose-a-docs-username
API_DOCS_PASSWORD=choose-a-strong-docs-password

# Required only for chatbot/embedding endpoints.
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_EMBEDDING_DIMENSIONS=1536
```

Important notes:

- The MongoDB URL must include `/caddy`. If omitted, data may be written to the default `test` database.
- `ENVIROMENT=local` keeps OTP as `1234`. If you set `ENVIROMENT=live`, OTP becomes random and SMS sending must be wired first.
- If `ENVIROMENT` is not `local`, set `API_DOCS_USER` and `API_DOCS_PASSWORD`.
- Keep `.env` private. Do not commit it.
- Rotate any keys or database passwords that were shared outside the server.

## 8. MongoDB Atlas Setup

In MongoDB Atlas:

1. Go to **Database Access**.
2. Create or confirm a user with `readWrite` permission on database `caddy`.
3. Go to **Network Access**.
4. Add your EC2 public IP.
5. For temporary testing only, `0.0.0.0/0` works, but restrict it before production.

Test Mongo from EC2:

```bash
node - <<'NODE'
require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient(process.env.DB_URL, { serverSelectionTimeoutMS: 20000 });
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('mongo-ping=ok');
    console.log('app-db=' + client.db().databaseName);
  } finally {
    await client.close().catch(() => {});
  }
})();
NODE
```

Expected:

```text
mongo-ping=ok
app-db=caddy
```

## 9. Install Dependencies And Build

From the project root:

```bash
npm install --legacy-peer-deps
npm run build
npm run build:web
```

Build outputs:

- API: `dist-api/main.js`
- Web client/server: `dist/client` and `dist/server/server.mjs`

## 10. Start With PM2

The repo includes `ecosystem.config.cjs`.

Start both processes:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

Expected apps:

- `ready-deliveries-api` on port `3000`
- `ready-deliveries-web` on port `3001`

Check logs:

```bash
pm2 logs ready-deliveries-api
pm2 logs ready-deliveries-web
```

Check local HTTP on EC2:

```bash
curl -I http://127.0.0.1:3001/signup
curl -I http://127.0.0.1:3001/connect-domain
curl 'http://127.0.0.1:3000/subscription-plans/get-subscription-plan-list?location=india'
```

## 11. DNS Setup

At your DNS provider, point the platform domain to EC2:

```text
plantgen.live       A      EC2_PUBLIC_IP
*.plantgen.live     A      EC2_PUBLIC_IP
api.plantgen.live   A      EC2_PUBLIC_IP
```

The wildcard record is required so generated tenant subdomains work, for example:

```text
restaurant-name.plantgen.live
admin.restaurant-name.plantgen.live
vendor.restaurant-name.plantgen.live
```

## 12. Configure Caddy

Copy the example:

```bash
sudo cp Caddyfile.example /etc/caddy/Caddyfile
```

Edit it:

```bash
sudo nano /etc/caddy/Caddyfile
```

Use this structure:

```caddyfile
{
  email admin@plantgen.live

  on_demand_tls {
    ask http://127.0.0.1:3000/ready-delivery/owner/domain/ask
    interval 2m
    burst 10
  }
}

api.plantgen.live {
  reverse_proxy 127.0.0.1:3000
}

:80, :443 {
  tls {
    on_demand
  }

  @api path /ready-delivery/* /subscription-plans* /auth/* /admin* /customer/* /restaurant/* /order/* /vendor/* /driver/* /payment/* /razorpay/* /wallet/* /address/* /category/* /food/* /coupon/* /review/* /favourite/* /configuration* /image-upload /csv-upload
  reverse_proxy @api 127.0.0.1:3000

  reverse_proxy 127.0.0.1:3001
}
```

Validate and reload:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
```

The `ask` URL is important. It prevents Caddy from issuing certificates for random domains pointed at your EC2 instance. The API allows only `plantgen.live`, its subdomains, and custom domains already saved through `/connect-domain`.

## 13. Verify Public URLs

After DNS has propagated:

```bash
curl -I https://plantgen.live
curl -I https://plantgen.live/signup
curl -I https://plantgen.live/connect-domain
curl https://api.plantgen.live/subscription-plans/get-subscription-plan-list?location=india
```

Also test same-origin API routing:

```bash
curl https://plantgen.live/subscription-plans/get-subscription-plan-list?location=india
```

## 14. Owner Signup Flow

In browser:

1. Open `https://plantgen.live/signup`.
2. Enter owner details.
3. Click **Send OTP**.
4. Use OTP `1234` while `ENVIROMENT=local`.
5. Register the business.
6. The app generates tenant links using `OWNER_BASE_DOMAIN=plantgen.live`.
7. Open `/connect-domain` to connect a client custom domain.

After first signup, MongoDB Atlas should show an `owners` collection inside database `caddy`.

## 15. Client Custom Domain Flow

Client opens `/connect-domain` and enters their domain, for example:

```text
orders.clientdomain.com
```

The app returns:

- TXT record for domain ownership
- CNAME record pointing to the tenant subdomain

Client adds records at their DNS provider.

Then client clicks **Verify DNS and SSL**.

The app checks:

- TXT record exists
- CNAME points to the expected tenant subdomain
- HTTPS is reachable with active SSL

The UI shows:

- Green dot: **Active SSL**
- Red dot: **Not verified**

DNS and SSL can take time. The UI shows a timer so clients do not panic.

## 16. PM2 Maintenance Commands

Restart after code changes:

```bash
npm install --legacy-peer-deps
npm run build
npm run build:web
pm2 restart ecosystem.config.cjs
pm2 save
```

View status:

```bash
pm2 status
```

View logs:

```bash
pm2 logs ready-deliveries-api --lines 100
pm2 logs ready-deliveries-web --lines 100
```

Stop apps:

```bash
pm2 stop ready-deliveries-api ready-deliveries-web
```

Delete apps:

```bash
pm2 delete ready-deliveries-api ready-deliveries-web
```

## 17. Caddy Maintenance Commands

Validate config:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

Reload config:

```bash
sudo systemctl reload caddy
```

View logs:

```bash
journalctl -u caddy -f
```

Restart Caddy:

```bash
sudo systemctl restart caddy
```

## 18. Troubleshooting

### Signup API returns 404

Cause: API route is not being proxied to port `3000`.

Check:

```bash
curl -I http://127.0.0.1:3000/ready-delivery/owner/register
curl -I https://plantgen.live/signup
sudo caddy validate --config /etc/caddy/Caddyfile
```

Make sure the Caddy `@api` matcher includes `/ready-delivery/*` and `/subscription-plans*`.

### API cannot connect to MongoDB

Check Atlas Network Access and database permissions.

```bash
node - <<'NODE'
require('dotenv').config();
const { MongoClient } = require('mongodb');
(async () => {
  const client = new MongoClient(process.env.DB_URL, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  console.log('connected to', client.db().databaseName);
  await client.close();
})();
NODE
```

Also confirm the URI includes the database name:

```text
mongodb+srv://USER:PASSWORD@HOST/caddy?appName=caddy
```

### OTP is not `1234`

Check:

```bash
grep ENVIROMENT .env
pm2 env ready-deliveries-api | grep ENVIROMENT
```

Use:

```env
ENVIROMENT=local
```

Then restart:

```bash
pm2 restart ready-deliveries-api --update-env
```

### Web is running but API calls fail

Check both processes:

```bash
pm2 status
curl http://127.0.0.1:3000/subscription-plans/get-subscription-plan-list?location=india
curl http://127.0.0.1:3001/signup
```

Check Caddy:

```bash
curl https://plantgen.live/subscription-plans/get-subscription-plan-list?location=india
journalctl -u caddy -n 100 --no-pager
```

### SSL not active for client domain

Check DNS:

```bash
dig TXT _readydeliveries.orders.clientdomain.com
dig CNAME orders.clientdomain.com
```

Then retry verification from `/connect-domain`.

## 19. Security Checklist Before Real Production

- Rotate MongoDB password if it was shared anywhere.
- Rotate Gemini API key if it was shared anywhere.
- Restrict MongoDB Atlas Network Access to the EC2 public IP.
- Keep `.env` out of Git.
- Keep only ports `80`, `443`, and controlled SSH open publicly.
- Replace fixed OTP with real SMS before setting `ENVIROMENT=live`.
- Consider adding backups for MongoDB Atlas.
- Consider PM2 log rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
```

# EC2, Caddy, PM2, and Custom Domains

This repo now has a client-facing domain connection page at `/connect-domain`.

## Built-in owner API

The owner/signup/domain APIs are now part of this Nest backend. The frontend calls:

- `POST /ready-delivery/owner/register`
- `POST /ready-delivery/owner/login`
- `PUT /ready-delivery/owner/verify-otp`
- `POST /ready-delivery/owner/add-business`
- `POST /ready-delivery/owner/domain/connect`
- `POST /ready-delivery/owner/domain/verify`
- `GET /subscription-plans/get-subscription-plan-list`
- `POST /subscription-plans/make-payment`

The domain endpoints send:

Both requests send:

```json
{
  "domain": "orders.clientdomain.com"
}
```

`connect` saves the requested custom domain against the signed-in owner and returns DNS records:

```json
{
  "success": true,
  "message": "DNS records generated",
  "data": {
    "domain": "orders.clientdomain.com",
    "status": "pending",
    "ssl_status": "pending",
    "records": [
      {
        "type": "TXT",
        "name": "_readydeliveries.orders.clientdomain.com",
        "value": "readydeliveries-domain-verification=OWNER_OR_RANDOM_TOKEN"
      },
      {
        "type": "CNAME",
        "name": "orders.clientdomain.com",
        "value": "tenant-subdomain.readydeliveries.com"
      }
    ]
  }
}
```

`verify` checks the TXT record, CNAME target, and HTTPS availability. It returns active only after DNS is correct and SSL is available:

```json
{
  "success": true,
  "message": "Domain verified. SSL is active.",
  "data": {
    "domain": "orders.clientdomain.com",
    "verified": true,
    "sslActive": true,
    "status": "verified",
    "ssl_status": "active"
  }
}
```

## PM2

Build and run the Nest API plus the web/domain UI:

```bash
npm install --legacy-peer-deps
npm run build
npm run build:web
pm2 start ecosystem.config.cjs
pm2 save
```

Required production environment:

- `DB_URL`: MongoDB URL for the owner records and default app data.
- `OWNER_BASE_DOMAIN`: your platform base domain, currently `plantgen.live`.
- `PORT=3000` for the Nest API process.
- `ENVIROMENT=local` or any non-`live` value keeps OTP as `1234`.

Make sure the MongoDB URL includes the database name, for example `mongodb+srv://USER:PASSWORD@HOST/caddy?appName=caddy`. If the database name is omitted, the driver may write app data into the default `test` database.

Use `.env.example` as the starting point for the EC2 environment values.

Optional production environment:

- `TENANT_DB_URL_TEMPLATE`: use this if each tenant should get its own DB URL. Put `{tenant}` where the generated subdomain slug should go.
- `TENANT_DB_URL`: fallback tenant DB URL if you do not use a template. For your current setup, use the same MongoDB URL as `DB_URL`.
- `CNAME_TARGET_DOMAIN`: use this if all client domains should CNAME to one fixed host instead of `tenant.OWNER_BASE_DOMAIN`.
- `VITE_API_URL`: set this at web build time only if the frontend should call a separate API hostname. If empty, Caddy routes API paths from the same domain to port `3000`.
- `SUPER_ADMIN_URL`: leave unset now unless you intentionally want tenant lookup to call an external old super-admin service.
- `API_DOCS_USER` and `API_DOCS_PASSWORD`: required when `ENVIROMENT` is not `local`; protects Swagger docs at `/api`.
- `GEMINI_API_KEY`: required only for chatbot and embedding endpoints. Signup, business registration, and domain connection work without it.
- `GEMINI_CHAT_MODEL`: optional, defaults to `gemini-2.5-flash`.
- `GEMINI_EMBEDDING_MODEL`: optional, defaults to `gemini-embedding-2`.
- `GEMINI_EMBEDDING_DIMENSIONS`: optional, defaults to `1536` to match the existing vector-search code/index shape. After switching from OpenAI embeddings to Gemini embeddings, run the embedding backfill before relying on semantic search quality.

## Caddy

Use `Caddyfile.example` as a starting point. Replace the email, then copy it to `/etc/caddy/Caddyfile`.

The example sends your API hostname to the Nest API on port `3000`. Tenant subdomains and client custom domains go to the web app on port `3001`, where Caddy can issue SSL automatically with on-demand TLS.

The global `on_demand_tls ask` URL points to `/ready-delivery/owner/domain/ask` so Caddy only issues certificates for your platform domain/subdomains or custom domains already saved by `/connect-domain`.

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## DNS instructions for clients

Ask clients to create:

- A `TXT` record for domain ownership verification.
- A `CNAME` record from their chosen host, for example `orders.clientdomain.com`, to their Ready Deliveries subdomain.

After DNS updates, they can click **Verify DNS and SSL** on `/connect-domain`. The UI polls for up to 90 seconds and shows either **Active SSL** with a green dot or **Not verified** with a red dot.

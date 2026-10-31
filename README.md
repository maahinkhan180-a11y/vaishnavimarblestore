# Vaishnavi Marble

The project is split into a Vite/React storefront in `frontend/` and an Express/MySQL REST API in `backend/`. Supabase and Vercel are not part of this setup.

## Local development

Requirements: Node.js 20 or newer and MySQL 8 or newer.

1. Create an empty MySQL database and run `backend/sql/schema.sql` against it.
2. Copy `backend/.env.example` to `backend/.env` and set the database credentials, a random `JWT_SECRET` of at least 32 characters, and a one-time `ADMIN_SETUP_KEY`.
3. Create the API admin account. Start the API, then send `POST /api/auth/register` with header `x-admin-setup-key` matching `ADMIN_SETUP_KEY` and a JSON body containing `email` and a password of at least 12 characters. This endpoint only creates the first admin account; subsequent requests are rejected.
4. In one terminal, run `npm install` and `npm run dev` from `backend/`.
5. In another terminal, copy `frontend/.env.example` to `frontend/.env`, run `npm install`, then `npm run dev` from `frontend/`. Vite proxies `/api` to the local API.

The public API provides categories, subcategories, products, featured products, product search, and published blog posts. Admin catalog and blog writes require a signed admin token. Admins can upload JPG, PNG, WEBP, and GIF images up to 5 MB from the category, subcategory, and product forms; files are stored in `backend/uploads/` and their `/uploads/...` URLs are saved in `image_url`. The upload endpoint also requires an admin token. Passwords are stored as bcrypt hashes; setup keys, database credentials, and JWT secrets must remain on the server.

Vite proxies both `/api` and `/uploads` to the local backend. In production, preserve and back up `backend/uploads/`, and route the frontend's `/uploads` path to the backend serving those files. If frontend and API use different public origins, configure that same-origin `/uploads` route in the hosting or reverse-proxy setup so the stored root-relative image URLs resolve correctly.

For a local first-admin setup, use PowerShell after starting the backend (replace the placeholders; do not put this setup key in frontend code):

```powershell
$headers = @{ 'x-admin-setup-key' = 'YOUR_ADMIN_SETUP_KEY' }
$body = @{ email = 'admin@example.com'; password = 'YOUR_LONG_UNIQUE_PASSWORD' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/register' -Method Post -Headers $headers -ContentType 'application/json' -Body $body
```

## Hostinger deployment

1. Confirm the hosting plan supports Node.js applications and MySQL, then create the MySQL database and import `backend/sql/schema.sql` using Hostinger's database tools.
2. Deploy `backend/` as the Hostinger Node.js application. Set the variables from `backend/.env.production.example` in Hostinger's application settings; replace every placeholder with values from hPanel or newly generated secrets, and do not upload an `.env` file. `AUTO_MIGRATE=true` applies the idempotent schema at API startup; alternatively run `npm run migrate` from `backend/`. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters, then run `npm run seed` from the backend application console to create the first admin. Seeding never changes an existing admin account. Remove `ADMIN_PASSWORD` from the hosting environment after successful setup. Configure `CLIENT_ORIGIN` for the final HTTPS website origin(s).
3. For the frontend build, set `VITE_API_URL` to the reachable API URL plus `/api` (for example, `https://api.example.com/api`), run `npm run build` from `frontend/`, and upload the contents of `frontend/dist/` to the website document root (`public_html`). The included `.htaccess` enables client-side route fallback on Apache hosting.
4. Ensure the public website routes `/uploads` requests to the Node.js backend and that `backend/uploads/` is writable and persistent across redeploys. Verify the API health endpoint, storefront data, admin login/CRUD and image uploads, blog pages, HTTPS, and deep links on the Hostinger preview/staging URL before changing DNS for `vaishnavimarble.com`.

The current storefront has a cart and enquiry flow but no customer checkout/order API. Customer accounts, orders, and store settings are therefore not introduced as unused tables/endpoints. Existing Supabase records are not copied by these source changes: export and validate the old data separately, map it to the MySQL schema, then import it before cutover. Do not remove the old deployment or change DNS until the replacement and data have been verified.

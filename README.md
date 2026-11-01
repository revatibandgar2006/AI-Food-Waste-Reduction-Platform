# Food Rescue

Food Rescue is a React/Vite application backed by an Express API and PostgreSQL. User accounts, profiles, donations, requests, volunteer activity, contact messages, and notifications are stored in the database.

## Run locally

1. Install the frontend and backend dependencies:

   ```sh
   npm install
   npm --prefix backend install
   ```

2. Start PostgreSQL and configure `backend/.env` with `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`, and `JWT_SECRET`. The configured database user must be able to connect to PostgreSQL and create the application database if it does not exist.

3. Start both the API and frontend from the project root:

   ```sh
   npm run dev
   ```

   On startup in development, the backend creates the configured database when needed, applies the idempotent schema in `backend/config/schema.sql`, and restores the sample workspaces and demo records without deleting existing data. Vite proxies `/api` requests to the backend on port 5000. Open the frontend URL printed by Vite, normally `http://localhost:5173`.

The backend can also be run separately with `npm run backend:dev`. To initialize the schema manually, use `npm --prefix backend run db:init`.

The three demo workspaces are available from the Login page: Donor (`donor@foodbridge.org`), Volunteer (`volunteer@foodbridge.org`), and Receiver (`receiver@foodbridge.org`). Each uses the password `password123`. In development, sample workspaces are seeded automatically; manual seeding is also available with `npm --prefix backend run seed`. Manual seeding does not delete existing data unless `SEED_RESET=true` is explicitly set.

## Main routes

- Public: `/`, `/about`, `/contact`, `/research`, `/impact`, `/map`
- Authentication: `/login`, `/signup`
- Donor: `/donor`, `/donor/add-food`, `/donor/listings`, `/donor/status`
- Receiver: `/receiver`, `/receiver/requests`, `/receiver/history`
- Volunteer: `/volunteer`, `/volunteer/pickup`, `/volunteer/delivery`, `/volunteer/profile`, `/volunteer/notifications`, `/volunteer/settings`
- Admin: `/admin`

## Build

```sh
npm run build
```

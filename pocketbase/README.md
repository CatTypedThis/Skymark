# PocketBase Setup

Sky Beacon uses PocketBase for email/password auth and SQLite-backed beacon persistence.

## Local Development

1. Download the PocketBase binary for Windows and place it at `pocketbase/pocketbase.exe`.
2. Start PocketBase:

   ```powershell
   npm run dev:backend
   ```

3. Create the first admin account in the PocketBase admin UI.
4. Migrations in `pocketbase/pb_migrations/` are applied automatically on serve. To apply them manually:

   ```powershell
   .\pocketbase\pocketbase.exe migrate up --migrationsDir .\pocketbase\pb_migrations --dir .\pocketbase\pb_data
   ```

5. Start the Next.js app:

   ```powershell
   npm run dev:lan
   ```

The frontend defaults to `NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090`.

## Production Notes

- Run PocketBase with persistent disk. Do not place `pb_data` on an ephemeral filesystem.
- Use HTTPS outside localhost for camera, geolocation, service worker, and auth flows.
- Configure SMTP before enabling email verification or password reset.
- Back up the PocketBase SQLite data file.

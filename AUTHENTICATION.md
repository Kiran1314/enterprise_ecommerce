# Unified authentication

The application uses one authentication implementation in `src/lib/auth.js` and one signed, HttpOnly `store_session` cookie for both admin and customer sessions. Admin authentication is handled by `POST`, `GET`, and `DELETE /api/admin/auth`.

## Admin login flow

1. `POST /api/admin/auth` looks up the admin in MongoDB's `admins` collection.
2. The initial SuperAdmin can be bootstrapped from server-only `DEFAULT_SUPER_ADMIN_EMAIL` and `DEFAULT_SUPER_ADMIN_PASSWORD` values when no admin with that email exists.
3. Passwords are stored using Node.js scrypt. A legacy plaintext admin password is upgraded to a scrypt hash after a successful login.
4. The server issues the signed `store_session` cookie. The cookie is HttpOnly, SameSite=Lax, and Secure in production.
5. `GET /api/admin/auth`, middleware, and protected API routes validate the same cookie/session format.
6. `DELETE /api/admin/auth` logs out by clearing that cookie. `/api/admin/auth/login` and `/api/admin/auth/logout` remain URL aliases only and do not implement a second authentication mechanism.

## Required deployment settings

- Set `MONGODB_URI` to your database connection string.
- Set `SESSION_SECRET` to a long random value and keep it identical across all app instances. Production startup/authentication fails closed if it is missing.
- Set a strong `DEFAULT_SUPER_ADMIN_EMAIL` and `DEFAULT_SUPER_ADMIN_PASSWORD` for first-time bootstrap. These are server-side variables, not `NEXT_PUBLIC_*` variables. Once the admin record exists, subsequent logins are checked against the stored admin account.
- Do not commit `.env.local` or actual credentials to source control or ZIP files. Rotate any credentials that were previously included in a shared archive.

## Verification checklist

- Log in at `/admin/login`.
- Confirm `POST /api/admin/auth` returns 200 and sets `store_session`.
- Confirm `GET /api/admin/auth` returns the current admin.
- Edit a product/category/brand in the admin panel and confirm its protected `PUT` returns success.
- Confirm unauthenticated requests return 401 and `/admin/*` redirects to `/admin/login`.
- Log out and confirm `store_session` is cleared and protected requests return 401.

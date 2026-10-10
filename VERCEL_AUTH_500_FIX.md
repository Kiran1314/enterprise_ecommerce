# Fix: POST /api/admin/auth returns 500 on Vercel

## Most likely cause
The supplied MongoDB URI appears to contain escaped punctuation and/or copied quote characters. Vercel environment variables should contain the raw value, without surrounding quotes or backslashes. A 500 can also occur when `MONGODB_URI` was only added to `.env.example` or `.env.local` but not to the Vercel project's Environment Variables.

## Set these in Vercel
Open the Vercel project that serves `enterprise-ecommerce-five.vercel.app` → Settings → Environment Variables. Add the variables below for Production (and Preview if you test Preview deployments):

- `MONGODB_URI`: `mongodb+srv://<URL_ENCODED_USERNAME>:<URL_ENCODED_PASSWORD>@<CLUSTER_HOST>/enterprise_ecommerce?retryWrites=true&w=majority&appName=<APP_NAME>`
- `SESSION_SECRET`: a unique random secret, at least 32 bytes
- `DEFAULT_SUPER_ADMIN_EMAIL`: the intended admin email
- `DEFAULT_SUPER_ADMIN_PASSWORD`: a new, strong, unique bootstrap password
- `NEXT_PUBLIC_SITE_URL`: `https://enterprise-ecommerce-five.vercel.app`

Do not include Markdown link brackets, surrounding quote marks, or backslashes in the variable values. If the MongoDB password contains reserved URI characters (`@`, `:`, `/`, `?`, `#`, `[`, `]`, or `%`), percent-encode the password component. Do not encode the whole URI.

## MongoDB Atlas checks
1. In Atlas → Database Access, confirm the database user and reset its password if the credential has been exposed.
2. In Atlas → Network Access, ensure access from Vercel is permitted. Prefer a secure network setup; avoid leaving broad access open unnecessarily.
3. Confirm the database user has permissions for the `enterprise_ecommerce` database.
4. Redeploy after changing Vercel environment variables.

## Bootstrap admin behavior
The first successful login creates the SuperAdmin record only when no Admin record exists for the supplied email. Once an Admin document exists, the environment bootstrap password does not override that database password. If an admin document already exists, use its current password or reset it through a secure admin-password reset process.

## Security
The configuration shared in chat included credentials/tokens. Rotate the MongoDB database password, Vercel Blob read/write token, and bootstrap admin password immediately. Update the new values in Vercel and redeploy. Never commit real secrets to `.env.example`, source control, screenshots, or chat.

## Diagnostics
The API deliberately returns a generic login error to clients. Open Vercel → Project → Logs and inspect the server log beginning `Admin login failed:`. Do not share the full MongoDB URI or any token when sharing logs.

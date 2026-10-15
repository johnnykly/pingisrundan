# Setup: Google service account, sheet sharing and Vercel

The app reads and writes the Google Sheet server-side using a **service account**
(a robot Google user). It needs three environment variables:
`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`.

## 1. Create a Google Cloud project

1. Go to <https://console.cloud.google.com/> and sign in with your HEAR Google account.
2. In the project picker (top left, next to the Google Cloud logo) click **New project**.
3. Name it `pingisrundan`, leave the organisation as is, click **Create**.
4. Make sure the new project is selected in the project picker.

## 2. Enable the Google Sheets API

1. Open <https://console.cloud.google.com/apis/library/sheets.googleapis.com>.
2. Check that `pingisrundan` is selected at the top, then click **Enable**.

## 3. Create the service account

1. Open **IAM & Admin → Service Accounts**
   (<https://console.cloud.google.com/iam-admin/serviceaccounts>).
2. Click **+ Create service account**.
3. Name: `pingisrundan`. The ID fills in automatically. Click **Create and continue**.
4. **Skip** the "Grant this service account access to project" step (no roles needed;
   access is granted by sharing the sheet). Click **Continue**, then **Done**.
5. Copy the service account email, e.g.
   `pingisrundan@pingisrundan-123456.iam.gserviceaccount.com`.
   This is `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

## 4. Create a JSON key

1. Click the service account you just made → tab **Keys** → **Add key → Create new key**.
2. Choose **JSON** → **Create**. A `.json` file downloads.
3. Open it in a text editor. The value of `"private_key"` (starts with
   `-----BEGIN PRIVATE KEY-----`) is `GOOGLE_PRIVATE_KEY`.
   Copy everything between the quotes, including the `\n` sequences.
4. Keep the file somewhere safe and never commit it. If the org policy
   *"Disable service account key creation"* blocks this step, a Workspace admin
   must allow key creation for this project.

## 5. Share the sheet with the service account

1. Open the sheet:
   <https://docs.google.com/spreadsheets/d/11MZ5oeTBDzZhFYWDWC1fqX76P1yem2H2jXjNK5w5css/edit>
2. Click **Share**, paste the service account email, set the role to **Editor**,
   untick **Notify people**, click **Share**.
   (If Google warns that the address is outside your organisation, confirm.)
3. `GOOGLE_SHEET_ID` is `11MZ5oeTBDzZhFYWDWC1fqX76P1yem2H2jXjNK5w5css`.

The sheet already has the expected tabs: **Spelare** (`ID | Namn | Skapad`) and
**Matcher** (`ID | Datum | Speltyp | Spelare1_ID | Poäng1 | Spelare2_ID | Poäng2 | Vinnare_ID | Skapad | Raderad`),
plus `Backup_Original_2026-10-15` with the original rows. Do not rename the tabs or
reorder the columns. Deleting a game in the app sets `Raderad` to `TRUE`; set it
back to `FALSE` in the sheet to restore it.

## 6. Run locally (optional)

```bash
cp .env.example .env.local   # fill in the three values
npm install
npm run dev                  # http://localhost:3000
```

Without credentials, `npm run dev:mock` uses an in-memory store.

## 7. Deploy on Vercel

1. Go to <https://vercel.com/new> and import the GitHub repo `pingisrundan`
   (grant Vercel access to it if it is not listed).
2. Framework preset: **Next.js** (auto-detected). Leave build settings as they are.
3. Expand **Environment Variables** and add, for Production, Preview and Development:
   | Name | Value |
   | --- | --- |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | the email from step 3 |
   | `GOOGLE_PRIVATE_KEY` | the private key from step 4 (paste as is, with `\n`) |
   | `GOOGLE_SHEET_ID` | `11MZ5oeTBDzZhFYWDWC1fqX76P1yem2H2jXjNK5w5css` |
4. Click **Deploy**. When it finishes, open the URL. If the page says the app
   isn't connected to the spreadsheet, a variable is missing; if it says it
   couldn't read data, check the sheet is shared with the service account.
5. After changing env vars later, redeploy (Deployments → ⋯ → Redeploy).

## 8. Install on iPhone

Open the URL in **Safari** → Share → **Add to Home Screen**. It opens full screen
like an app. On desktop Chrome/Edge, use the install icon in the address bar.

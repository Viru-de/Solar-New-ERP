# Hostinger Shared Hosting Deployment Guide for SolarPulse ERP

This guide provides step-by-step instructions to deploy the Solar ERP application on **Hostinger Shared Hosting** (cPanel / hPanel) with zero Node.js server dependency.

---

## 1. Architecture Overview

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS (compiled into high-performance static HTML, JS, and CSS chunks in `dist/`).
- **Web Server Routing:** Apache via `.htaccess` with SPA rewrite rules (`index.html` fallback), Gzip/Deflate compression, browser caching, and security headers.
- **Backend / AI Proxy:** Server-side PHP (`public/api/gemini.php`) proxying Gemini AI queries securely without exposing API keys to the browser.
- **Health Check:** `public/api/status.php` for validating PHP version, environment variable configuration, and write permissions.
- **Data Persistence:** Client-side local storage with full JSON backup, export, and import tools built-in. Optional MySQL integration (`public/api/db.php` & `schema.sql`) for custom database backends.

---

## 2. Quick Deployment Steps (hPanel File Manager or FTP)

### Step 1: Run the Production Build
If you are building locally or exporting the project:
```bash
npm run build
```
This generates the optimized `dist/` folder containing:
```
dist/
├── index.html
├── .htaccess            <-- Pre-configured Apache SPA rewrite rules automatically copied from public/.htaccess
├── assets/
│   ├── index-*.js
│   ├── index-*.css
│   └── vendor-*.js
└── api/
    ├── gemini.php       <-- Server-side Gemini AI proxy
    ├── status.php       <-- Hostinger system health check
    ├── db.php           <-- MySQL connectivity check
    └── schema.sql       <-- MySQL database schema
```

### Step 2: Upload Files to Hostinger `public_html`
1. Log in to **Hostinger hPanel**.
2. Navigate to **Websites** → select your domain → **File Manager** (or connect via FileZilla SFTP/FTP).
3. Open the **`public_html`** directory (or your target subdomain directory).
4. Upload all files and folders **from inside the `dist/` directory** directly into `public_html/`.
   - **Crucial:** Ensure the hidden file **`.htaccess`** is uploaded (enable "Show hidden files" in Hostinger File Manager settings). The `.htaccess` file prevents 404 errors on deep-link page refreshes (`/dashboard`, `/leads`, `/customers`, `/projects`, `/finance`, `/hrms`, `/settings`, etc.).

### Step 3: Configure Firebase Authentication & Environment Variables
The Solar ERP uses **Firebase Web SDK** for secure client-side authentication:
1. Go to the [Firebase Console](https://console.firebase.google.com/) and select or create your project.
2. In **Build → Authentication**, click **Get Started** and enable **Email/Password** provider.
3. In **Authentication → Settings → Authorized Domains**, add your Hostinger production domain (e.g., `yourdomain.com`) as well as `localhost`.
4. In **Project Settings → General → Your apps**, create a Web app (`</>`) and copy the Firebase config values.

**Two easy ways to configure Firebase:**
- **Option A (Build-time via `.env`):**
  Before running `npm run build`:
  ```ini
  VITE_FIREBASE_API_KEY=your_firebase_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
  ```
- **Option B (Zero-recompile in `public_html/firebase-config.js`):**
  If you uploaded the pre-compiled `dist/` directly and want to set credentials without running Node.js on Hostinger, open `public_html/firebase-config.js` in Hostinger File Manager and paste your Firebase keys inside `window.__FIREBASE_CONFIG__`.

5. For Gemini AI proxy on Hostinger, create or edit `public_html/.env`:
   ```ini
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   *(Protected automatically: `.htaccess` blocks public web downloads of `.env`).*

### Step 4 (Optional): Hostinger MySQL Database Setup
If you wish to connect Hostinger MySQL:
1. In Hostinger hPanel, navigate to **Databases** → **MySQL Databases** and create a new database (e.g., `u123456_solarpulse`).
2. Click **Enter phpMyAdmin** and import `public_html/api/schema.sql`.
3. In `public_html/.env`, add:
   ```ini
   DB_HOST=localhost
   DB_NAME=u123456_solarpulse
   DB_USER=u123456_solaruser
   DB_PASS=your_db_password
   ```
4. Verify connection status at `https://your-domain.com/api/db.php`.

### Step 5: Verify Deployment
1. Visit `https://your-domain.com/` in your browser. The Solar ERP sign-in interface will appear.
2. Sign in with your registered Firebase user account.
3. Check the API health endpoint: `https://your-domain.com/api/status.php`.
4. Test deep navigation: Click on **Projects**, **Customers**, **HRMS**, or **Finance**, and refresh the page (`F5`). The `.htaccess` rewrite rules will seamlessly route the request without 404 errors.

---

## 3. Subdirectory / Subdomain Hosting (Optional)

If hosting inside a subfolder (e.g., `https://your-domain.com/erp/`):
1. In `.htaccess`, adjust the `RewriteBase`:
   ```apache
   RewriteBase /erp/
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /erp/index.html [L]
   ```
2. In `vite.config.ts` (or via environment variable `VITE_BASE_PATH=/erp/`), rebuild with `npm run build`.

---

## 4. Troubleshooting Checklist

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **404 on page refresh** | `.htaccess` is missing or `mod_rewrite` is disabled | Ensure `.htaccess` is in `public_html/`. Hostinger enables `mod_rewrite` by default on all PHP shared plans. |
| **500 Internal Server Error** | Syntax error in `.htaccess` or old PHP version | Verify PHP version is 7.4, 8.1, 8.2, or 8.3 in hPanel. |
| **AI Assistant Error** | Missing `GEMINI_API_KEY` | Add `GEMINI_API_KEY` to `public_html/.env` or check `https://your-domain.com/api/status.php`. |
| **Stale Cache / Old Version** | Browser cache holding previous JS bundle | Clear browser cache or use Hard Reload (`Ctrl+F5` / `Cmd+Shift+R`). Chunks are cache-busted with unique hashes. |

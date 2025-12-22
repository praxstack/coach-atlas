# 🚀 How to Deploy Coach Atlas to Vercel

This guide will walk you through deploying your local `coach-atlas` project to the web using Vercel.

**Cost:** Free (Hobby Tier)
**Time:** ~5 minutes

---

## ✅ Prerequisites

1.  **GitHub Account**: You need a GitHub account.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com) using your GitHub account.
3.  **Code on GitHub**: Your local code must be pushed to a GitHub repository.

---

## 🛠️ Step 1: Push Code to GitHub

If you haven't pushed your code yet, run these commands in your VS Code terminal:

```bash
# 1. Initialize Git (if not done)
git init

# 2. Add all files
git add .

# 3. Commit changes
git commit -m "Ready for deployment"

# 4. Create a new repo on GitHub (https://github.com/new)
# 5. Link local repo to GitHub (replace URL with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/coach-atlas.git

# 6. Push code
git branch -M main
git push -u origin main
```

---

## ☁️ Step 2: Deploy on Vercel

1.  **Log in to Vercel Dashboard**: Go to [vercel.com/dashboard](https://vercel.com/dashboard).
2.  **Add New Project**:
    -   Click the **"Add New..."** button (top right).
    -   Select **"Project"**.
3.  **Import Git Repository**:
    -   You should see your `coach-atlas` repository in the list.
    -   Click **"Import"** next to it.
4.  **Configure Project**:
    -   **Project Name**: Leave as `coach-atlas` or change if you want.
    -   **Framework Preset**: Vercel should auto-detect **"Vite"**. If not, select it manually.
    -   **Root Directory**: Leave as `./` (default).
    -   **Build & Output Settings**:
        -   Build Command: `npm run build` (default)
        -   Output Directory: `dist` (default)
        -   Install Command: `npm install` (default)
    -   **Environment Variables**:
        -   ❌ **STOP!** You do **NOT** need to add variables like `OPENAI_API_KEY`.
        -   Coach Atlas is a **BYOK (Bring Your Own Key)** app. Users enter their keys in the browser.
5.  **Deploy**:
    -   Click the big **"Deploy"** button.
    -   Wait ~1 minute. You'll see building logs.

---

## 🎉 Step 3: Verify Deployment

Once finished, you'll see a "Congratulations!" screen.

1.  Click the **preview image** or the **Visit** button.
2.  Your app is now live at `https://coach-atlas.vercel.app` (or similar).
3.  **Test it**:
    -   Go to **Settings**.
    -   Enter your OpenAI/Anthropic API Key.
    -   Go to **Chat** and try sending a message.
    -   Refresh the page to ensure the current route works (e.g., refresh on `/settings`).

---

## 🔧 Troubleshooting

### "404 Not Found" on Refresh
If you refresh the page and get a 404 error:

1.  Create a file named `vercel.json` in your project root.
2.  Add this content:
    ```json
    {
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    }
    ```
3.  Push changes (`git add . && git commit -m "fix routing" && git push`).
4.  Vercel will auto-redeploy.

### "Build Failed"
Check the logs on Vercel. Common verify:
-   Did you run `npm install` locally before pushing?
-   Are there TypeScript errors? (Run `npm run build` locally to check).
-   If the build fails due to typescript errors, you can bypass it (not recommended but quick fix) by changing the build command to: `npm run build -- --emptyOutDir` or just `vite build`.

---

## 🌐 Optional: Custom Domain

1.  Go to your Project Settings on Vercel.
2.  Click **Domains**.
3.  Enter your domain (e.g., `coach-atlas.com`).
4.  Follow the DNS instructions (usually adding an A record or CNAME).

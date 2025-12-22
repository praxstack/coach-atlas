# 🚀 Deployment Guide

Coach Atlas is a **Static Single Page Application (SPA)**. It has no backend server or database dependency (database is in the browser). This makes it entirely free to deploy on static hosting services.

## 🏆 Best Free Options

We recommend **Vercel** or **Netlify** for the best performance and ease of use.

### Option 1: Vercel (Recommended)
*Best for: Performance, Zero-config, React support.*

1.  Push your code to **GitHub**.
2.  Go to [vercel.com](https://vercel.com) and sign up with GitHub.
3.  Click "Add New..." -> "Project".
4.  Import your `coach-atlas` repository.
5.  **Framework Preset**: Vercel detects `Vite` automatically.
6.  **Build Command**: `npm run build`
7.  **Output Directory**: `dist`
8.  Click **Deploy**.

**Fixing Routing Issues (404 on refresh):**
Create a `vercel.json` file in the root if you encounter routing issues:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

### Option 2: Netlify
*Best for: Drag-and-drop simplicity.*

**Method A: Git Integration (Automatic updates)**
1.  Log in to [netlify.com](https://www.netlify.com).
2.  Click "Add new site" -> "Import an existing project".
3.  Connect GitHub and select `coach-atlas`.
4.  **Build command**: `npm run build`
5.  **Publish directory**: `dist`
6.  Click **Deploy**.

**Method B: Drag & Drop (No Git needed)**
1.  Run `npm run build` locally.
2.  Drag the newly created `dist` folder onto the Netlify dashboard.

**Fixing Routing Issues:**
Create a `_redirects` file in your `public/` folder:
```
/*  /index.html  200
```

---

### Option 3: GitHub Pages
*Best for: Keeping everything in GitHub.*

1.  Open `package.json` and add your homepage property:
    ```json
    "homepage": "https://<your-username>.github.io/coach-atlas/"
    ```
2.  Install `gh-pages`:
    ```bash
    npm install -D gh-pages
    ```
3.  Add scripts to `package.json`:
    ```json
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
    ```
4.  Deploy:
    ```bash
    npm run deploy
    ```

**Note**: GitHub Pages has strict routing. You might need to use `HashRouter` instead of `BrowserRouter` in `src/app/App.tsx` if you don't have a custom domain.

---

## 🔑 Environment Variables
Coach Atlas relies on **Bring Your Own Key (BYOK)**. You do **NOT** need to set `OPENAI_API_KEY` or similar variables in your hosting provider.

-   **Users** verify their own keys in the browser.
-   **Security**: Keys never leave the user's device.

## 🐳 Docker Deployment
If you prefer self-hosting with Docker:

```dockerfile
# Build Stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve Stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

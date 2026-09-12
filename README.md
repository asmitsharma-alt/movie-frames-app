# 🎬 ARCHIVE.FRAME — Polaroid Cinema Index & Public API

A zero-database, serverless movie frame collection website and open REST API. Built with **Astro**, **Cloudflare Pages**, **Catbox.moe CDN**, and **TMDB**.

---

## ⚡ Key Highlights

* **Zero Database / Zero SQL:** Uses **Cloudflare KV** to map TMDB Movie IDs to arrays of image links. 
* **Zero Storage Hosting Costs:** Frames uploaded by users stream directly to **Catbox.moe API**, providing permanent direct hotlinks (`https://files.catbox.moe/xxxx.webp`). You host 0 bytes of images yourself.
* **Open Public API:** Any developer can query `GET /api/frames?movie_id=157336` to get high-res movie frames for their applications.
* **Aesthetic UI:** Tactile archival warm paper background with physics-driven Polaroid photo frames, washi tape, and full-screen cinema lightbox.
* **100% Lifetime Free:** Runs permanently on Cloudflare Pages free tier with zero bandwidth (egress) fees and no sleep timeouts.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Enter directory
cd movie-frames-app

# 2. Install dependencies (already installed)
npm install

# 3. Start local development server
npm run dev
```

Visit `http://localhost:4321` in your browser!

---

## 📡 Public API Documentation

### 1. Retrieve Frames for Any Movie
```http
GET /api/frames?movie_id={TMDB_ID}
```
**Example Response:**
```json
{
  "status": "success",
  "storage": "Catbox.moe + Cloudflare KV (Zero DB)",
  "movie": {
    "tmdbId": "157336",
    "title": "Interstellar",
    "year": "2014",
    "director": "Christopher Nolan"
  },
  "totalFrames": 5,
  "frames": [
    {
      "id": "frame-int-1",
      "url": "https://files.catbox.moe/gargantua.webp",
      "timestamp": "01:42:15.04",
      "tag": "Approaching Gargantua",
      "aspectRatio": "2.39:1",
      "uploadedAt": "2026-09-12T14:00:00.000Z"
    }
  ]
}
```

### 2. Upload a New Frame (Programmatic)
```bash
curl -X POST "http://localhost:4321/api/upload" \
  -F "tmdb_id=157336" \
  -F "timestamp=01:24:15" \
  -F "tag=Wormhole Entrance" \
  -F "aspect_ratio=2.39:1" \
  -F "frame=@/path/to/frame.jpg"
```

### 3. Search Movies via TMDB
```http
GET /api/search?q=Inception
```

---

## ☁️ Deploying to Cloudflare Pages (Free Forever)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/movie-frames-app.git
git push -u origin main
```

### Step 2: Connect to Cloudflare Pages
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ **Compute (Workers & Pages)** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**.
2. Select your `movie-frames-app` repository.
3. Set build configuration:
   * **Framework preset:** `Astro`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`

### Step 3: Bind Cloudflare KV
1. In Cloudflare Dashboard, navigate to **Storage & Databases** ➔ **KV** ➔ **Create a Namespace** named `FRAMES_KV`.
2. In your Pages project settings:
   * Go to **Settings** ➔ **Functions** ➔ **KV namespace bindings**.
   * Add binding variable name: `FRAMES_KV` and select your newly created namespace.
3. *(Optional)* Under **Environment Variables**, add `TMDB_API_KEY` with your free key from [themoviedb.org](https://www.themoviedb.org/).

### Step 4: Attach Your Custom Domain
1. In your Pages project, open the **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Type your domain (already managed in Cloudflare) and click **Activate**. Done!

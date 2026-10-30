# Northstar on Vercel

This is the Vercel-compatible Northstar source. It preserves the streaming-style interface and serves the live TMDB catalog and trailers through Vercel Functions in `api/`.

## Configure the TMDB token

In the Vercel project, open **Settings → Environment Variables** and add `TMDB_READ_ACCESS_TOKEN` with your TMDB API Read Access Token. Select the environments you use, then redeploy so the new variable is available to the functions. Do not put the token in source files, commit it, or use a `VITE_` prefix.

## Deploy from GitHub

Replace the existing repository files with these files and commit the change. Vercel will build the Vite frontend and deploy the `/api` functions from the repository root.

Full-length video playback still requires a direct video URL you are authorized to stream. TMDB supplies catalog details and trailer references, not full movie streams.

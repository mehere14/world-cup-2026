# Deploy on Render

1. Push this folder to a private or public GitHub repository.
2. In Render, choose **New → Blueprint** and connect that repository.
3. Render will read `render.yaml` and create the web service.
4. When prompted, set `FOOTBALL_DATA_TOKEN` to your football-data.org token.
5. Deploy and open the generated `onrender.com` URL.

The API token is read only by `server.mjs`. It is never sent to visitors or included
in the browser bundle.

The free Render service can sleep when inactive. If the cold-start delay becomes
annoying, change the service plan from `free` to a paid instance in Render.

# World Cup 2026 Brackets

An interactive radial World Cup knockout bracket with live match states, advancing-team flags, node-based match details, and responsive SVG animations.

## Backend and data

- **Runtime:** Node.js 18+
- **Server:** Node's built-in HTTP server (`server.mjs`)
- **Match data:** [football-data.org API](https://www.football-data.org/)
- **Frontend:** Vanilla HTML, CSS, JavaScript, and SVG

The browser calls the local `/api/world-cup` endpoint. The server adds the football-data.org token, caches responses briefly, and never sends the token to visitors.

## Run locally

1. Get a football-data.org API token.
2. Clone the repository and enter its directory.
3. Start the app with the token in your environment:

```bash
FOOTBALL_DATA_TOKEN="your-token" npm start
```

4. Open [http://localhost:4173](http://localhost:4173).

To use another port:

```bash
PORT=4176 FOOTBALL_DATA_TOKEN="your-token" npm start
```

## Deploy

The included `render.yaml` can deploy the app on Render:

1. Create a new **Blueprint** in Render and connect this repository.
2. Set `FOOTBALL_DATA_TOKEN` as a secret environment variable.
3. Deploy and open the generated URL.

Never commit an API token or place it in frontend JavaScript.

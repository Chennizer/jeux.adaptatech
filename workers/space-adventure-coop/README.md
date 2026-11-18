# Space Adventure Co-op

The pilot supports two browsers and one five-minute Normal round at a time. Each player chooses eye gaze or a switch that sends Space or Enter. The room owns the team score and pauses while a player reconnects.

Run these commands from `workers/space-adventure-coop` with Node.js 22 or newer.

```sh
npm ci
npm test
npm run dev
```

Open the URL printed by Wrangler. Choose an input mode and create a room. In a second browser profile or on another device, choose an input mode and enter the room code or open the invite link. A device on the same network needs the reachable address of the machine running Wrangler and a dev server bound to that interface.

## Cloudflare pilot

Sign in to the intended Cloudflare account through Wrangler, verify the account, and deploy.

```sh
npx wrangler login --device --scopes account:read user:read workers:write workers_scripts:write
npx wrangler whoami
npm run deploy
```

The deployment serves a standalone pilot at the Worker URL. The asset staging script copies the co-op page and its existing Space Adventure media from the site repository. The first deployment registers the SQLite-backed room class. Invite links use the origin from which the game was opened.

The page is available by direct link at `/arcade/space-adventure-coop/` and has a `noindex` directive. For a Netlify preview, add the preview's exact origin to `FRONTEND_ORIGINS` before deploying the Worker. If you deploy the Worker under a different hostname, update `defaultWorker` in `arcade/space-adventure-coop/client.js` for connections from Adaptatech.

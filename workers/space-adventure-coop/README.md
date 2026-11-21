# Space Adventure Co-op

The online page shares the original Space Adventure engine, menu styles, ships, enemies, music, and sound effects. The host selects Normal, Hard, or Master. Each player chooses eye gaze or a switch that sends Space or Enter. The match uses the original two-ship field, with the original gaze target grid when both players choose eye gaze.

The host runs the game engine in a shared 16:9 arena. The room relays the guest's inputs, mirrors the host's game state, and pauses when a player disconnects. Both players can replay from the results screen. Online scores stay in the room.

An idle lobby closes after five minutes. A round ends after two minutes without player input, with one minute on the results screen to start a replay. A player who disconnects during a round has one minute to rejoin. The room closes immediately after both players leave.

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

The deployment serves the online game at the Worker URL. The asset staging script copies the shared game and its media from the site repository. The second migration registers the SQLite-backed `OnlineRoom` class and preserves the earlier pilot's room class. Invite links use the origin from which the game was opened.

The page is available by direct link at `/arcade/space-adventure-coop/` and has a `noindex` directive. For a Netlify preview, add the preview's exact origin to `FRONTEND_ORIGINS` before deploying the Worker. If you deploy the Worker under a different hostname, update `defaultWorker` in `arcade/space-adventure-coop/client.js` for connections from Adaptatech.

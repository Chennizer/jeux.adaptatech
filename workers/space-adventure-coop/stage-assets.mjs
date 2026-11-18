import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_PATH } from '../../arcade/space-adventure-coop/protocol.js';

const root = new URL('../../', import.meta.url);
const staging = new URL('.assets/', import.meta.url);
const paths = [
  'arcade/space-adventure-coop',
  'arcade/space-invaders-fruits/game.css',
  'arcade/space-invaders-fruits/game.js',
  'css/control-panel.css',
  'css/games.css',
  'css/gaming.css',
  'css/layout.css',
  'css/video-stop-action.css',
  'fonts/PressStart2P-Regular.ttf',
  'fonts/pressstart2p-OFL.txt',
  'images/arcade/mariomoviecover.png',
  'images/spaceadventure',
  'js/translationmain.js',
  'sounds/spaceadventure',
  'songs/space/spacearcade1.mp3',
  'songs/space/spacearcade2.mp3',
  'songs/space/spacequest1.mp3'
];

await rm(staging, { recursive: true, force: true });
for (const path of paths) {
  const target = new URL(path, staging);
  await mkdir(dirname(fileURLToPath(target)), { recursive: true });
  await cp(new URL(path, root), target, { recursive: true });
}

const gameRoutes = [GAME_PATH.slice(0, -1), GAME_PATH, `${GAME_PATH}index.html`];
await writeFile(new URL('_headers', staging), gameRoutes.map(route => `${route}\n  X-Robots-Tag: noindex\n`).join('\n'));

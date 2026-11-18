import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const staging = new URL('.assets/', import.meta.url);
const paths = [
  'arcade/space-adventure-coop',
  'images/spaceadventure',
  'sounds/spaceadventure/missile.mp3',
  'sounds/spaceadventure/shipdestroyed.mp3',
  'sounds/spaceadventure/shield.mp3',
  'songs/space/spacearcade1.mp3'
];

await rm(staging, { recursive: true, force: true });
for (const path of paths) {
  const target = new URL(path, staging);
  await mkdir(dirname(fileURLToPath(target)), { recursive: true });
  await cp(new URL(path, root), target, { recursive: true });
}

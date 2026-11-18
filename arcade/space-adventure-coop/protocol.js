export const WORLD = { width: 960, height: 640 };
export const TILE_SIZE = 154;
export const DANGER_LINE = 508;
export const DWELL_MS = 1000;
export const SNAPSHOT_MS = 100;
export const ROOM_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ROOM_CODE = /^[23456789A-HJ-NP-Z]{8}$/;
export const INPUT_MODES = ['switch', 'gaze'];
export const GAME_PATH = '/arcade/space-adventure-coop/';
export const PARTIES_PATH = '/parties/game-room/';

export const ONLINE_PARTIES_PATH = '/parties/online-room/';
export const ONLINE_WORLD = { width: 1280, height: 720 };
export const FRAME_INTERVAL = 100;
export const MAX_FRAME_BYTES = 96_000;
export const ROOM_PING = '{"type":"ping"}';
export const ROOM_PONG = '{"type":"pong"}';
export const DIFFICULTIES = ['normal', 'hard', 'competitive'];
const PLAYER_NAME_LENGTH = 20;

export function cleanPlayerName(value) {
  if (typeof value !== 'string') return '';
  return Array.from(value.normalize('NFC').replace(/\s+/gu, ' ').replace(/[\p{Cc}\p{Bidi_Control}]/gu, '').trim())
    .slice(0, PLAYER_NAME_LENGTH).join('').trimEnd();
}

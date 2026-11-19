"""Local bridge between the Adaptatech calibration page and Talon.

Copy this file into ``~/.talon/user/adaptatech_calibration.py``.  Talon will
reload it automatically and expose a deliberately small HTTP API on localhost.
"""

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from talon import actions, app, cron


HOST = "127.0.0.1"
PORT = 8765
REQUEST_HEADER = "X-Adaptatech-Calibration"

_server = None
_thread = None


class CalibrationHandler(BaseHTTPRequestHandler):
    def _headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", f"Content-Type, {REQUEST_HEADER}")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def _json(self, value, status=200):
        self._headers(status)
        self.wfile.write(json.dumps(value).encode("utf-8"))

    def do_OPTIONS(self):
        self._headers(204)

    def do_GET(self):
        if self.path == "/status":
            self._json({"ready": True, "service": "adaptatech-talon-calibration"})
        else:
            self._json({"error": "not_found"}, 404)

    def do_POST(self):
        if self.path != "/calibrate":
            self._json({"error": "not_found"}, 404)
            return
        if self.headers.get(REQUEST_HEADER) != "1":
            self._json({"error": "missing_request_header"}, 403)
            return

        # Talon actions must run on Talon's main thread, not the HTTP thread.
        cron.after("0ms", actions.tracking.calibrate)
        self._json({"started": True})

    def log_message(self, format, *args):
        # Avoid filling Talon's log every time the page checks the connection.
        return


def start_bridge():
    global _server, _thread
    if _server is not None:
        return
    try:
        _server = ThreadingHTTPServer((HOST, PORT), CalibrationHandler)
    except OSError as error:
        app.notify("Adaptatech calibration", f"Local bridge could not start: {error}")
        return
    _thread = threading.Thread(target=_server.serve_forever, daemon=True)
    _thread.start()
    print(f"Adaptatech calibration bridge listening on http://{HOST}:{PORT}")


app.register("ready", start_bridge)

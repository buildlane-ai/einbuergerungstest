#!/usr/bin/env python3
"""Statischer Webserver für den Einbürgerungstest.

Unterschied zu `python -m http.server`: Es werden bewusste Cache-Header
gesetzt. Ohne sie cachen vor allem mobile Browser die index.html nach
eigenem Ermessen und zeigen tagelang eine veraltete Fassung.

  - HTML:               nie cachen, immer neu vom Server holen
  - versionierte Datei: (?v=…) ein Jahr cachen, ändert sich der Inhalt,
                        ändert sich die Versionsnummer und damit die URL
  - alles andere:       fünf Minuten
"""

import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

VERZEICHNIS = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8097"))
ADRESSE = os.environ.get("BIND", "127.0.0.1")


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        pfad = self.path.split("?")[0]
        versioniert = "?v=" in self.path

        if pfad.endswith((".html", "/")):
            self.send_header("Cache-Control", "no-cache, must-revalidate, max-age=0")
        elif versioniert:
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "public, max-age=300")

        # Die Seite braucht weder Einbettung noch Referrer-Weitergabe.
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def log_message(self, format, *args):
        pass  # systemd-Journal nicht mit Zugriffen fluten


if __name__ == "__main__":
    handler = partial(Handler, directory=VERZEICHNIS)
    with ThreadingHTTPServer((ADRESSE, PORT), handler) as server:
        print(f"Einbürgerungstest läuft auf http://{ADRESSE}:{PORT} aus {VERZEICHNIS}")
        server.serve_forever()

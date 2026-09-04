#!/usr/bin/env python3
"""Webserver für den Einbürgerungstest.

Liefert die statischen Dateien aus und stellt die JSON-Schnittstelle für
die synchrone Runde bereit (siehe spiel.py). Die Clients fragen den
Zustand per kurzem Polling ab; das ist unspektakulär, läuft aber
zuverlässig durch jeden Proxy und übersteht Funklöcher besser als eine
dauerhafte Verbindung.

Cache-Header sind bewusst gesetzt: ohne sie zeigen mobile Browser
tagelang eine veraltete Fassung.
"""

import json
import mimetypes
import os
import posixpath
import secrets
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from spiel import RUNDE

VERZEICHNIS = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8097"))
ADRESSE = os.environ.get("BIND", "127.0.0.1")
SCHLUESSELDATEI = os.path.join(VERZEICHNIS, ".moderationsschluessel")

SEITEN = {
    "/": "index.html",
    "/moderation": "moderation.html",
    "/solo": "solo.html",
}


def moderationsschluessel():
    """Schlüssel für die Moderationsseite, beim ersten Start erzeugt."""
    aus_umgebung = os.environ.get("MOD_SCHLUESSEL")
    if aus_umgebung:
        return aus_umgebung
    if os.path.exists(SCHLUESSELDATEI):
        with open(SCHLUESSELDATEI, encoding="utf-8") as f:
            vorhanden = f.read().strip()
            if vorhanden:
                return vorhanden
    neu = secrets.token_urlsafe(9)
    with open(SCHLUESSELDATEI, "w", encoding="utf-8") as f:
        f.write(neu)
    os.chmod(SCHLUESSELDATEI, 0o600)
    return neu


SCHLUESSEL = moderationsschluessel()


class Handler(BaseHTTPRequestHandler):
    server_version = "Kartoffelparty"

    # ---------- Hilfen ----------

    def _senden(self, code, koerper, typ, cache):
        self.send_response(code)
        self.send_header("Content-Type", typ)
        self.send_header("Content-Length", str(len(koerper)))
        self.send_header("Cache-Control", cache)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(koerper)

    def _json(self, daten, code=200):
        koerper = json.dumps(daten, ensure_ascii=False).encode("utf-8")
        self._senden(code, koerper, "application/json; charset=utf-8", "no-store")

    def _fehler(self, code, text):
        self._json({"fehler": text}, code)

    def _koerper_lesen(self):
        laenge = int(self.headers.get("Content-Length") or 0)
        if laenge <= 0 or laenge > 10_000:
            return {}
        try:
            return json.loads(self.rfile.read(laenge).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return {}

    def _abfrage(self):
        return urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)

    def _pfad(self):
        return urllib.parse.urlparse(self.path).path

    def _ist_gastgeber(self, daten=None):
        schluessel = (daten or {}).get("schluessel") or (self._abfrage().get("schluessel") or [""])[0]
        return secrets.compare_digest(str(schluessel), SCHLUESSEL)

    # ---------- statische Dateien ----------

    def _statisch(self, name):
        sicher = posixpath.normpath("/" + name).lstrip("/")
        ziel = os.path.join(VERZEICHNIS, sicher)
        if not os.path.abspath(ziel).startswith(VERZEICHNIS) or not os.path.isfile(ziel):
            return self._senden(404, b"Nicht gefunden", "text/plain; charset=utf-8", "no-store")

        typ = mimetypes.guess_type(ziel)[0] or "application/octet-stream"
        if typ.startswith("text/") or typ in ("application/javascript", "application/json"):
            typ += "; charset=utf-8"

        if sicher.endswith(".html"):
            cache = "no-cache, must-revalidate, max-age=0"
        elif "?v=" in self.path:
            cache = "public, max-age=31536000, immutable"
        else:
            cache = "public, max-age=300"

        with open(ziel, "rb") as f:
            self._senden(200, f.read(), typ, cache)

    # ---------- GET ----------

    def do_GET(self):
        pfad = self._pfad()

        if pfad == "/api/status":
            kennung = (self._abfrage().get("id") or [None])[0]
            if kennung:
                RUNDE.lebenszeichen(kennung)
            return self._json(RUNDE.status(kennung))

        if pfad == "/api/fragenzahl":
            return self._json({"vorhanden": len(RUNDE.alle_fragen)})

        if pfad in SEITEN:
            if pfad == "/moderation" and not self._ist_gastgeber():
                return self._senden(
                    403,
                    "Moderationsseite: Schlüssel fehlt oder ist falsch.".encode("utf-8"),
                    "text/plain; charset=utf-8", "no-store")
            return self._statisch(SEITEN[pfad])

        return self._statisch(pfad.lstrip("/"))

    do_HEAD = do_GET

    # ---------- POST ----------

    def do_POST(self):
        pfad = self._pfad()
        daten = self._koerper_lesen()

        if pfad == "/api/beitreten":
            kennung = RUNDE.beitreten(daten.get("name"))
            return self._json({"id": kennung, "status": RUNDE.status(kennung)})

        if pfad == "/api/antwort":
            kennung = daten.get("id")
            RUNDE.lebenszeichen(kennung)
            angenommen = RUNDE.abstimmen(kennung, daten.get("wahl"))
            return self._json({"angenommen": angenommen, "status": RUNDE.status(kennung)})

        if pfad.startswith("/api/mod/"):
            if not self._ist_gastgeber(daten):
                return self._fehler(403, "Falscher Schlüssel")
            befehl = pfad[len("/api/mod/"):]
            if befehl == "starten":
                RUNDE.starten(int(daten.get("anzahl") or 12))
            elif befehl == "aufloesen":
                RUNDE.aufloesen()
            elif befehl == "weiter":
                RUNDE.weiter()
            elif befehl == "beenden":
                RUNDE.beenden()
            elif befehl == "lobby":
                RUNDE.zurueck_in_lobby()
            else:
                return self._fehler(404, "Unbekannter Befehl")
            return self._json(RUNDE.status())

        return self._fehler(404, "Unbekannter Pfad")

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    with ThreadingHTTPServer((ADRESSE, PORT), Handler) as server:
        print(f"Einbürgerungstest läuft auf http://{ADRESSE}:{PORT}")
        print(f"Moderation: /moderation?schluessel={SCHLUESSEL}")
        server.serve_forever()

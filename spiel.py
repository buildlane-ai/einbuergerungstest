"""Zustand einer synchronen Einbürgerungstest-Runde.

Eine Runde läuft in Phasen:

    lobby      Gäste treten bei, Gastgeber sieht die Namen
    frage      alle beantworten dieselbe Frage
    aufloesung Ergebnis sichtbar, es wird geredet
    ende       Gesamtergebnis, jede Person kann ihre Urkunde ziehen

Der Zustand liegt im Arbeitsspeicher. Bei einem Neustart des Dienstes ist
die Runde weg; für einen Partyabend ist das die richtige Abwägung.
"""

import json
import os
import threading
import time
import uuid

VERZEICHNIS = os.path.dirname(os.path.abspath(__file__))

# Nach dieser Zeit ohne Lebenszeichen gilt jemand als weg und blockiert
# die Auflösung nicht mehr.
ABWESEND_NACH = 45.0


def _fragen_laden():
    with open(os.path.join(VERZEICHNIS, "fragen.json"), encoding="utf-8") as f:
        return json.load(f)


class Runde:
    def __init__(self):
        self._sperre = threading.Lock()
        daten = _fragen_laden()
        self.alle_fragen = daten["fragen"]
        self.amtliche_grenze = daten["bestehensgrenze"]
        self.amtliche_gesamtzahl = len(self.alle_fragen)
        self._zuruecksetzen(anzahl=12)

    # ---------- intern ----------

    def _zuruecksetzen(self, anzahl):
        self.anzahl = max(1, min(anzahl, len(self.alle_fragen)))
        self.reihenfolge = list(range(self.anzahl))
        self.phase = "lobby"
        self.frage_nr = 0
        self.teilnehmer = {}          # id -> {name, gesehen, punkte, verlauf}
        self.stimmen = {}             # id -> gewählter Index
        self.stand = 0                # zählt hoch, damit Clients Änderungen erkennen

    def _aendern(self):
        self.stand += 1

    def _aktive(self, jetzt=None):
        jetzt = jetzt or time.time()
        return [t for t in self.teilnehmer.values() if jetzt - t["gesehen"] < ABWESEND_NACH]

    def _erforderlich(self):
        """Bestehensgrenze anteilig zur gespielten Fragenzahl."""
        anteil = self.amtliche_grenze / self.amtliche_gesamtzahl
        return max(1, round(self.anzahl * anteil))

    def _frage_oeffentlich(self):
        if self.frage_nr >= self.anzahl:
            return None
        f = self.alle_fragen[self.reihenfolge[self.frage_nr]]
        return {"frage": f["frage"], "optionen": f["optionen"], "land": bool(f.get("land"))}

    def _richtige_option(self):
        return self.alle_fragen[self.reihenfolge[self.frage_nr]]["richtig"]

    # ---------- Gäste ----------

    def beitreten(self, name):
        with self._sperre:
            name = (name or "").strip()[:40] or "Ohne Namen"
            kennung = uuid.uuid4().hex[:12]
            self.teilnehmer[kennung] = {
                "name": name, "gesehen": time.time(), "punkte": 0, "verlauf": []
            }
            self._aendern()
            return kennung

    def lebenszeichen(self, kennung):
        t = self.teilnehmer.get(kennung)
        if t:
            t["gesehen"] = time.time()

    def abstimmen(self, kennung, wahl):
        with self._sperre:
            if self.phase != "frage" or kennung not in self.teilnehmer:
                return False
            if not isinstance(wahl, int) or not 0 <= wahl < 4:
                return False
            if kennung in self.stimmen:
                return False          # eine Stimme pro Frage, kein Ändern
            self.stimmen[kennung] = wahl
            self._aendern()
            if self._alle_haben_abgestimmt():
                self._aufloesen()
            return True

    def _alle_haben_abgestimmt(self):
        aktive = self._aktive()
        return bool(aktive) and all(
            k in self.stimmen for k, t in self.teilnehmer.items() if t in aktive
        )

    # ---------- Gastgeber ----------

    def starten(self, anzahl):
        with self._sperre:
            namen = {k: dict(v) for k, v in self.teilnehmer.items()}
            self._zuruecksetzen(anzahl)
            for k, v in namen.items():
                v.update({"punkte": 0, "verlauf": []})
                self.teilnehmer[k] = v
            self.phase = "frage"
            self._aendern()

    def aufloesen(self):
        with self._sperre:
            if self.phase == "frage":
                self._aufloesen()

    def _aufloesen(self):
        richtig = self._richtige_option()
        for kennung, t in self.teilnehmer.items():
            wahl = self.stimmen.get(kennung)
            korrekt = wahl == richtig
            t["verlauf"].append({"nr": self.frage_nr, "wahl": wahl, "korrekt": korrekt})
            if korrekt:
                t["punkte"] += 1
        self.phase = "aufloesung"
        self._aendern()

    def weiter(self):
        with self._sperre:
            if self.phase != "aufloesung":
                return
            self.frage_nr += 1
            self.stimmen = {}
            self.phase = "ende" if self.frage_nr >= self.anzahl else "frage"
            self._aendern()

    def beenden(self):
        with self._sperre:
            if self.phase == "frage":
                self._aufloesen()
            self.anzahl = max(1, self.frage_nr + (1 if self.phase == "aufloesung" else 0))
            self.phase = "ende"
            self._aendern()

    def zurueck_in_lobby(self):
        with self._sperre:
            self._zuruecksetzen(self.anzahl)
            self._aendern()

    # ---------- Auskunft ----------

    def status(self, kennung=None):
        with self._sperre:
            jetzt = time.time()
            aktive = self._aktive(jetzt)
            antwort = {
                "stand": self.stand,
                "phase": self.phase,
                "frage_nr": self.frage_nr,
                "anzahl": self.anzahl,
                "erforderlich": self._erforderlich(),
                "anwesend": len(aktive),
                "abgestimmt": len(self.stimmen),
                "namen": sorted(t["name"] for t in aktive),
            }

            if self.phase in ("frage", "aufloesung"):
                antwort["frage"] = self._frage_oeffentlich()
            if self.phase == "aufloesung":
                verteilung = [0, 0, 0, 0]
                for wahl in self.stimmen.values():
                    verteilung[wahl] += 1
                antwort["verteilung"] = verteilung
                antwort["richtig"] = self._richtige_option()
                antwort["ohne_stimme"] = max(0, len(aktive) - len(self.stimmen))

            if kennung and kennung in self.teilnehmer:
                ich = self.teilnehmer[kennung]
                antwort["ich"] = {
                    "name": ich["name"],
                    "punkte": ich["punkte"],
                    "hat_abgestimmt": kennung in self.stimmen,
                    "meine_wahl": self.stimmen.get(kennung),
                }

            if self.phase == "ende":
                antwort["rangliste"] = sorted(
                    ({"name": t["name"], "punkte": t["punkte"]} for t in self.teilnehmer.values()),
                    key=lambda e: (-e["punkte"], e["name"]),
                )
            return antwort


RUNDE = Runde()

(function () {
  "use strict";

  const el = (id) => document.getElementById(id);
  const BUCHSTABEN = ["A", "B", "C", "D"];
  const SCHLUESSEL = new URLSearchParams(location.search).get("schluessel") || "";

  const abschnitte = {
    lobby: el("m-lobby"), frage: el("m-frage"),
    aufloesung: el("m-aufloesung"), ende: el("m-ende")
  };
  let letzterStand = -1;
  let gezeichneteFrage = -1;

  function zeige(name) {
    Object.entries(abschnitte).forEach(([k, node]) => { node.hidden = k !== name; });
  }

  async function befehl(name, extra) {
    const antwort = await fetch("/api/mod/" + name, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ schluessel: SCHLUESSEL }, extra || {}))
    });
    if (antwort.ok) zeichnen(await antwort.json());
  }

  function optionenListe(behaelter, optionen) {
    behaelter.innerHTML = "";
    optionen.forEach((text, i) => {
      const zeile = document.createElement("li");
      zeile.className = "mod-option";
      zeile.innerHTML = '<span class="marke"></span><span class="mod-option-text"></span>';
      zeile.firstElementChild.textContent = BUCHSTABEN[i];
      zeile.lastElementChild.textContent = text;
      behaelter.appendChild(zeile);
    });
  }

  function zeichnen(status) {
    if (!status) return;

    el("z-anwesend").textContent = status.anwesend;
    el("z-abgestimmt").textContent = status.abgestimmt;
    el("z-frage").textContent = status.phase === "lobby" || status.phase === "ende"
      ? "–" : `${status.frage_nr + 1}/${status.anzahl}`;

    el("m-aufloesen").hidden = status.phase !== "frage";
    el("m-weiter").hidden = status.phase !== "aufloesung";
    el("m-beenden").hidden = !(status.phase === "frage" || status.phase === "aufloesung");
    el("m-lobby-zurueck").hidden = status.phase !== "ende";

    if (status.phase === "lobby") {
      const liste = el("m-namen");
      liste.innerHTML = "";
      status.namen.forEach((n) => {
        const eintrag = document.createElement("li");
        eintrag.textContent = n;
        liste.appendChild(eintrag);
      });
      if (!status.namen.length) {
        const leer = document.createElement("li");
        leer.className = "mod-leer";
        leer.textContent = "Noch niemand angemeldet";
        liste.appendChild(leer);
      }
      zeige("lobby");
      return;
    }

    if (status.phase === "frage") {
      if (gezeichneteFrage !== status.frage_nr) {
        el("m-fragetext").textContent = status.frage.frage;
        optionenListe(el("m-optionen"), status.frage.optionen);
        gezeichneteFrage = status.frage_nr;
      }
      el("m-landmarke").hidden = !status.frage.land;
      el("m-stand").textContent =
        `${status.abgestimmt} von ${status.anwesend} haben abgestimmt`;
      const fehlen = Math.max(0, status.anwesend - status.abgestimmt);
      el("m-fehlen").textContent = fehlen
        ? `Es fehlen noch ${fehlen}. Sobald alle abgestimmt haben, löst sich die Frage von selbst auf.`
        : "Alle haben abgestimmt.";
      zeige("frage");
      return;
    }

    if (status.phase === "aufloesung") {
      el("m-a-fragetext").textContent = status.frage.frage;
      optionenListe(el("m-a-optionen"), status.frage.optionen);
      const gesamt = status.verteilung.reduce((s, n) => s + n, 0) || 1;
      [...el("m-a-optionen").children].forEach((zeile, i) => {
        const anteil = Math.round(status.verteilung[i] / gesamt * 100);
        if (i === status.richtig) zeile.classList.add("ist-richtig");
        const streifen = document.createElement("span");
        streifen.className = "balkenanteil";
        streifen.style.width = anteil + "%";
        zeile.prepend(streifen);
        const zahl = document.createElement("span");
        zahl.className = "anteil";
        zahl.textContent = `${status.verteilung[i]} · ${anteil}%`;
        zeile.appendChild(zahl);
      });
      el("m-a-hinweis").textContent = status.ohne_stimme
        ? `${status.ohne_stimme} Anwesende haben nicht abgestimmt.`
        : "Alle haben abgestimmt.";
      gezeichneteFrage = -1;
      zeige("aufloesung");
      return;
    }

    if (status.phase === "ende") {
      const liste = el("m-rangliste");
      liste.innerHTML = "";
      (status.rangliste || []).forEach((e) => {
        const zeile = document.createElement("li");
        const bestanden = e.punkte >= status.erforderlich;
        zeile.className = bestanden ? "hat-bestanden" : "";
        zeile.innerHTML = '<span></span><strong></strong>';
        zeile.firstElementChild.textContent = e.name;
        zeile.lastElementChild.textContent =
          `${e.punkte} von ${status.anzahl}` + (bestanden ? " · bestanden" : "");
        liste.appendChild(zeile);
      });
      zeige("ende");
    }
  }

  async function abfragen() {
    try {
      const antwort = await fetch("/api/status");
      const status = await antwort.json();
      if (status.stand !== letzterStand || status.phase === "frage" || status.phase === "lobby") {
        letzterStand = status.stand;
        zeichnen(status);
      }
    } catch (e) { /* nächster Versuch */ }
  }

  el("m-starten").addEventListener("click",
    () => befehl("starten", { anzahl: parseInt(el("m-anzahl").value, 10) }));
  el("m-aufloesen").addEventListener("click", () => befehl("aufloesen"));
  el("m-weiter").addEventListener("click", () => befehl("weiter"));
  el("m-beenden").addEventListener("click", () => {
    if (confirm("Runde jetzt beenden? Alle sehen dann ihr Endergebnis.")) befehl("beenden");
  });
  el("m-lobby-zurueck").addEventListener("click", () => {
    if (confirm("Neue Runde starten? Alle Punkte werden zurückgesetzt.")) befehl("lobby");
  });

  el("gastlink").textContent = location.host;
  abfragen();
  setInterval(abfragen, 1500);
})();

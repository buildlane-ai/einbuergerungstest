(function () {
  "use strict";

  const el = (id) => document.getElementById(id);
  const seiten = {
    anmeldung: el("anmeldung"), warten: el("warten"), frage: el("frage"),
    aufloesung: el("aufloesung"), ergebnis: el("ergebnis"), urkunde: el("urkunde-seite")
  };

  const BUCHSTABEN = ["A", "B", "C", "D"];
  const SPEICHER = "kartoffeltest-id";

  let kennung = null;
  let letzterStand = -1;
  let gezeichneteFrage = -1;
  let aufUrkunde = false;

  function zeige(name) {
    Object.entries(seiten).forEach(([k, node]) => { node.hidden = k !== name; });
  }

  function knopfReihe(behaelter, optionen, beiKlick) {
    behaelter.innerHTML = "";
    optionen.forEach((text, i) => {
      const knopf = document.createElement("button");
      knopf.type = "button";
      knopf.className = "option";
      knopf.dataset.nr = String(i);
      knopf.setAttribute("aria-pressed", "false");
      knopf.innerHTML = `<span class="marke">${BUCHSTABEN[i]}</span><span></span>`;
      knopf.lastElementChild.textContent = text;
      if (beiKlick) knopf.addEventListener("click", () => beiKlick(i));
      else knopf.disabled = true;
      behaelter.appendChild(knopf);
    });
  }

  // ---------- Netz ----------

  async function holen(pfad, daten) {
    const optionen = daten
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(daten) }
      : {};
    const antwort = await fetch(pfad, optionen);
    if (!antwort.ok) throw new Error("HTTP " + antwort.status);
    return antwort.json();
  }

  async function beitreten() {
    const name = el("name").value.trim().replace(/\s+/g, " ");
    el("anmeldefehler").hidden = true;
    try {
      const antwort = await holen("/api/beitreten", { name });
      kennung = antwort.id;
      try { localStorage.setItem(SPEICHER, kennung); } catch (e) { /* Privatmodus */ }
      zeichnen(antwort.status);
    } catch (e) {
      el("anmeldefehler").textContent =
        "Anmeldung fehlgeschlagen. Verbindung prüfen und erneut versuchen.";
      el("anmeldefehler").hidden = false;
    }
  }

  async function abstimmen(wahl) {
    [...el("optionen").children].forEach((k) => { k.disabled = true; });
    try {
      const antwort = await holen("/api/antwort", { id: kennung, wahl });
      zeichnen(antwort.status);
    } catch (e) {
      [...el("optionen").children].forEach((k) => { k.disabled = false; });
    }
  }

  // ---------- Darstellung ----------

  function zeichnen(status) {
    if (!status) return;

    if (status.phase === "lobby") {
      el("warten-titel").textContent = "Gleich geht es los";
      el("warten-text").textContent =
        "Die Prüfungsleitung eröffnet das Verfahren in Kürze. Bitte legen Sie das " +
        "Gerät nicht weg, es geht ohne Vorwarnung los.";
      el("warten-namen").textContent = status.namen.join(" · ") || "noch niemand";
      zeige("warten");
      return;
    }

    if (status.phase === "frage") {
      const ich = status.ich || {};
      if (ich.hat_abgestimmt) {
        el("warten-titel").textContent = "Antwort abgegeben";
        el("warten-text").textContent =
          `Ihre Antwort ist eingegangen und kann nicht mehr geändert werden. ` +
          `Es fehlen noch ${Math.max(0, status.anwesend - status.abgestimmt)} von ` +
          `${status.anwesend} Anwesenden.`;
        el("warten-namen").textContent =
          `${status.abgestimmt} von ${status.anwesend} haben abgestimmt`;
        zeige("warten");
        return;
      }

      if (gezeichneteFrage !== status.frage_nr) {
        el("fragetext").textContent = status.frage.frage;
        knopfReihe(el("optionen"), status.frage.optionen, abstimmen);
        gezeichneteFrage = status.frage_nr;
      }
      el("zaehler").textContent = `Frage ${status.frage_nr + 1} von ${status.anzahl}`;
      el("landmarke").hidden = !status.frage.land;
      el("balkenfüllung").style.width = (status.frage_nr / status.anzahl * 100) + "%";
      el("abgestimmt-hinweis").hidden = false;
      el("abgestimmt-hinweis").textContent =
        `${status.abgestimmt} von ${status.anwesend} haben abgestimmt`;
      zeige("frage");
      return;
    }

    if (status.phase === "aufloesung") {
      el("a-zaehler").textContent = `Frage ${status.frage_nr + 1} von ${status.anzahl}`;
      el("a-fragetext").textContent = status.frage.frage;

      const ich = status.ich || {};
      const korrekt = ich.meine_wahl === status.richtig;
      const stempel = el("a-stempel");
      stempel.textContent = ich.meine_wahl == null
        ? "Keine Stimme" : (korrekt ? "Richtig" : "Falsch");
      stempel.className = "stempel " + (korrekt ? "bestanden" : "nicht");

      knopfReihe(el("a-optionen"), status.frage.optionen, null);
      const gesamt = status.verteilung.reduce((s, n) => s + n, 0) || 1;
      [...el("a-optionen").children].forEach((knopf, i) => {
        const anteil = Math.round(status.verteilung[i] / gesamt * 100);
        knopf.classList.add("a-option");
        if (i === status.richtig) knopf.classList.add("ist-richtig");
        if (i === ich.meine_wahl && i !== status.richtig) knopf.classList.add("ist-meine-falsche");
        const streifen = document.createElement("span");
        streifen.className = "balkenanteil";
        streifen.style.width = anteil + "%";
        knopf.prepend(streifen);
        const zahl = document.createElement("span");
        zahl.className = "anteil";
        zahl.textContent = `${status.verteilung[i]} · ${anteil}%`;
        knopf.appendChild(zahl);
      });

      el("a-hinweis").textContent = status.ohne_stimme
        ? `${status.ohne_stimme} Anwesende ohne Stimme. Die Prüfungsleitung schaltet weiter.`
        : "Die Prüfungsleitung schaltet zur nächsten Frage weiter.";
      gezeichneteFrage = -1;
      zeige("aufloesung");
      return;
    }

    if (status.phase === "ende") {
      const ich = status.ich || { name: "", punkte: 0 };
      const bestanden = ich.punkte >= status.erforderlich;
      const stempel = el("stempel");
      stempel.textContent = bestanden ? "Bestanden" : "Nicht bestanden";
      stempel.className = "stempel " + (bestanden ? "bestanden" : "nicht");
      el("punkte").textContent = `${ich.punkte} von ${status.anzahl} richtig`;
      el("urteil").textContent = bestanden
        ? `Erforderlich waren ${status.erforderlich} richtige Antworten.`
        : `Erforderlich waren ${status.erforderlich} richtige Antworten.`;

      const liste = el("rangliste");
      liste.innerHTML = "";
      (status.rangliste || []).forEach((e) => {
        const zeile = document.createElement("li");
        zeile.textContent = `${e.name}: ${e.punkte} von ${status.anzahl}`;
        liste.appendChild(zeile);
      });

      el("urkunde-zeigen").onclick = () => {
        urkundeFuellen({
          name: ich.name === "Ohne Namen" ? "" : ich.name,
          richtig: ich.punkte, gesamt: status.anzahl, erforderlich: status.erforderlich
        });
        aufUrkunde = true;
        zeige("urkunde");
      };
      if (!aufUrkunde) zeige("ergebnis");
    }
  }

  // ---------- Takt ----------

  async function abfragen() {
    if (!kennung) return;
    try {
      const status = await holen("/api/status?id=" + encodeURIComponent(kennung));
      if (status.stand !== letzterStand) {
        letzterStand = status.stand;
        zeichnen(status);
      } else if (status.phase === "frage" || status.phase === "lobby") {
        zeichnen(status);   // Zähler laufen lassen
      }
    } catch (e) { /* nächster Versuch in 1,5 Sekunden */ }
  }

  el("beitreten").addEventListener("click", beitreten);
  el("name").addEventListener("keydown", (e) => { if (e.key === "Enter") beitreten(); });
  el("urkunde-zurueck").addEventListener("click", () => { aufUrkunde = false; zeige("ergebnis"); });
  el("urkunde-drucken").addEventListener("click", () => window.print());

  try {
    const gemerkt = localStorage.getItem(SPEICHER);
    if (gemerkt) { kennung = gemerkt; abfragen(); }
  } catch (e) { /* Privatmodus */ }

  setInterval(abfragen, 1500);
})();

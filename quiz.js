(function () {
  "use strict";

  const el = (id) => document.getElementById(id);
  const bildschirme = {
    start: el("start"), test: el("test"),
    ergebnis: el("ergebnis"), urkunde: el("urkunde-seite")
  };

  let index = 0;
  let gewaehlt = null;
  let teilnehmer = "";
  let letztesErgebnis = { richtig: 0, bestanden: false };
  const antworten = new Array(FRAGEN.length).fill(null);

  function zeige(name) {
    Object.entries(bildschirme).forEach(([k, node]) => { node.hidden = k !== name; });
    window.scrollTo(0, 0);
  }

  function buchstabe(i) { return ["A", "B", "C", "D"][i] || String(i + 1); }

  function frageZeichnen() {
    const f = FRAGEN[index];

    el("zaehler").textContent = `Frage ${index + 1} von ${FRAGEN.length}`;
    el("landmarke").hidden = !f.land;
    el("balkenfüllung").style.width = ((index) / FRAGEN.length * 100) + "%";
    el("fragetext").textContent = f.frage;

    const behaelter = el("optionen");
    behaelter.innerHTML = "";
    f.optionen.forEach((text, i) => {
      const knopf = document.createElement("button");
      knopf.type = "button";
      knopf.className = "option";
      knopf.setAttribute("aria-pressed", "false");
      knopf.innerHTML = `<span class="marke">${buchstabe(i)}</span><span>${text}</span>`;
      knopf.addEventListener("click", () => waehlen(i));
      behaelter.appendChild(knopf);
    });

    gewaehlt = null;
    el("weiter").disabled = true;
    el("weiter").textContent = index === FRAGEN.length - 1 ? "Test abschließen" : "Weiter";
  }

  function waehlen(i) {
    gewaehlt = i;
    [...el("optionen").children].forEach((k, j) => {
      k.setAttribute("aria-pressed", String(j === i));
    });
    el("weiter").disabled = false;
  }

  function weiter() {
    if (gewaehlt === null) return;
    antworten[index] = gewaehlt;
    index++;
    if (index < FRAGEN.length) {
      frageZeichnen();
    } else {
      auswerten();
    }
  }

  function auswerten() {
    const richtige = antworten.reduce(
      (summe, wahl, i) => summe + (wahl === FRAGEN[i].richtig ? 1 : 0), 0);
    const bestanden = richtige >= BESTEHENSGRENZE;
    letztesErgebnis = { richtig: richtige, bestanden };

    const stempel = el("stempel");
    stempel.textContent = bestanden ? "Bestanden" : "Nicht bestanden";
    stempel.className = "stempel " + (bestanden ? "bestanden" : "nicht");

    el("punkte").textContent = `${richtige} von ${FRAGEN.length} richtig`;
    const fehlend = BESTEHENSGRENZE - richtige;
    el("urteil").textContent = bestanden
      ? `Erforderlich waren ${BESTEHENSGRENZE} richtige Antworten.`
      : `Erforderlich waren ${BESTEHENSGRENZE} richtige Antworten, Ihnen ${fehlend === 1 ? "fehlt eine" : "fehlen " + fehlend}.`;

    el("schluss").innerHTML = bestanden
      ? `<p>Sehr geehrte Damen und Herren,</p>
         <p>der Test ist hiermit beendet. Sie haben die erforderliche Anzahl richtiger
         Antworten erreicht und den Einbürgerungstest <strong>bestanden</strong>.
         Wir beglückwünschen Sie zu diesem Ergebnis.</p>
         <p>Über das Bestehen dieses Tests hinaus erwerben Sie hiermit keinerlei
         Rechte, insbesondere keinen Anspruch auf Einbürgerung, auf ein zweites
         Stück Kartoffelgratin oder auf das letzte Rauchbier.</p>
         <p>Wir danken Ihnen für Ihre Teilnahme.</p>`
      : `<p>Sehr geehrte Damen und Herren,</p>
         <p>der Test ist hiermit beendet. Die erforderliche Anzahl richtiger Antworten
         wurde nicht erreicht; der Test gilt damit als <strong>nicht bestanden</strong>.</p>
         <p>Ein Rechtsbehelf ist nicht vorgesehen. Eine Wiederholung ist unbegrenzt oft
         möglich und kostenfrei. Wir empfehlen die Einnahme einer Stärkung auf
         Kartoffelbasis und einen weiteren Versuch.</p>
         <p>Wir danken Ihnen für Ihre Teilnahme.</p>`;

    const liste = el("auswertungsliste");
    liste.innerHTML = "";
    FRAGEN.forEach((f, i) => {
      const wahl = antworten[i];
      const korrekt = wahl === f.richtig;
      const eintrag = document.createElement("li");
      eintrag.innerHTML =
        `${f.frage}
         <span class="deine ${korrekt ? "" : "falsch"}">Ihre Antwort: ${f.optionen[wahl]} ${korrekt ? "✓" : "✗"}</span>
         ${korrekt ? "" : `<span class="richtig-war">Richtig: ${f.optionen[f.richtig]}</span>`}`;
      liste.appendChild(eintrag);
    });

    zeige("ergebnis");
  }

  function neustart() {
    index = 0;
    gewaehlt = null;
    antworten.fill(null);
    frageZeichnen();
    zeige("test");
  }

  function urkundeZeichnen() {
    const { richtig, bestanden } = letztesErgebnis;

    const namensfeld = el("u-name");
    if (teilnehmer) {
      namensfeld.textContent = teilnehmer;
      namensfeld.classList.remove("leer");
    } else {
      namensfeld.textContent = " ".repeat(20);
      namensfeld.classList.add("leer");
    }

    const heute = new Date().toLocaleDateString("de-DE",
      { day: "numeric", month: "long", year: "numeric" });

    el("u-unter").textContent = bestanden
      ? "Bescheid über das Bestehen des Einbürgerungstests"
      : "Bescheid über das Nichtbestehen des Einbürgerungstests";

    el("u-fliesstext").textContent =
      `am ${heute} den Einbürgerungstest abgelegt und dabei ${richtig} von ` +
      `${FRAGEN.length} Fragen zutreffend beantwortet hat. Zum Bestehen waren ` +
      `${BESTEHENSGRENZE} richtige Antworten erforderlich.`;

    const urteil = el("u-urteil");
    urteil.textContent = bestanden ? "Bestanden" : "Nicht bestanden";
    urteil.className = "u-urteil " + (bestanden ? "bestanden" : "nicht");

    const paragraphen = bestanden ? [
      ["§ 2 Rechtsfolgen",
       "Aus diesem Bescheid erwächst kein Anspruch auf Einbürgerung, wohl aber " +
       "auf Nachschlag am Buffet und auf den aufrechten Gang für den Rest des Abends."],
      ["§ 3 Rechtsbehelfsbelehrung",
       "Gegen diesen Bescheid kann binnen einer Frist von null Minuten Widerspruch " +
       "eingelegt werden. Der Widerspruch ist mündlich und laut bei der Person an der " +
       "Grillzange vorzubringen. Er hat keine aufschiebende Wirkung."],
      ["§ 4 Gebühren",
       "Die Verwaltungsgebühr beträgt ein Gericht auf Kartoffelbasis und gilt mit " +
       "Abgabe am Buffet als entrichtet."]
    ] : [
      ["§ 2 Rechtsfolgen",
       "Aus diesem Bescheid erwächst weder ein Anspruch auf Einbürgerung noch ein " +
       "Anspruch auf das letzte Bier. Der Zugang zum Buffet bleibt hiervon unberührt."],
      ["§ 3 Rechtsbehelfsbelehrung",
       "Gegen diesen Bescheid kann binnen einer Frist von null Minuten Widerspruch " +
       "eingelegt werden. Der Widerspruch ist mündlich und laut bei der Person an der " +
       "Grillzange vorzubringen. Er hat keine aufschiebende Wirkung."],
      ["§ 4 Wiederholung",
       "Eine Wiederholung der Prüfung ist unbegrenzt oft, gebührenfrei und ohne " +
       "Einhaltung einer Wartefrist zulässig. Von einer Wiederholung nach der dritten " +
       "Bierprobe wird abgeraten."]
    ];

    const behaelter = el("u-paragraphen");
    behaelter.innerHTML = "";
    paragraphen.forEach(([titel, text]) => {
      const abschnitt = document.createElement("div");
      abschnitt.className = "u-paragraph";
      const h = document.createElement("p");
      h.className = "u-paragraph-titel";
      h.textContent = titel;
      const p = document.createElement("p");
      p.className = "u-paragraph-text";
      p.textContent = text;
      abschnitt.append(h, p);
      behaelter.appendChild(abschnitt);
    });

    el("u-ort").textContent = `Hamburg, den ${heute}`;

    // Aktenzeichen deterministisch aus Name und Ergebnis
    let summe = 0;
    const basis = (teilnehmer || "ohne Namensangabe") + "|" + richtig;
    for (let i = 0; i < basis.length; i++) summe = (summe * 31 + basis.charCodeAt(i)) % 100000;
    el("u-akte").textContent =
      `Aktenzeichen KP-${new Date().getFullYear()}-${String(summe).padStart(5, "0")}`;

    zeige("urkunde");
  }

  el("starten").addEventListener("click", () => {
    teilnehmer = el("name").value.trim().replace(/\s+/g, " ");
    frageZeichnen();
    zeige("test");
  });
  el("name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") el("starten").click();
  });
  el("weiter").addEventListener("click", weiter);
  el("nochmal").addEventListener("click", neustart);
  el("urkunde-zeigen").addEventListener("click", urkundeZeichnen);
  el("urkunde-zurueck").addEventListener("click", () => zeige("ergebnis"));
  el("urkunde-drucken").addEventListener("click", () => window.print());

  // Vorschau zum Prüfen, ohne alle 33 Fragen auszufüllen:
  //   ?demo=28              → Ergebnisseite mit 28 richtigen Antworten
  //   &name=Marianna        → Name für die Urkunde
  //   &urkunde=1            → springt direkt auf die Urkunde
  (function vorschau() {
    const p = new URLSearchParams(location.search);
    if (!p.has("demo")) return;

    const gewuenscht = parseInt(p.get("demo"), 10);
    const anzahl = Math.max(0, Math.min(FRAGEN.length, isNaN(gewuenscht) ? 0 : gewuenscht));

    teilnehmer = (p.get("name") || "").trim().replace(/\s+/g, " ");
    el("name").value = teilnehmer;

    FRAGEN.forEach((f, i) => {
      antworten[i] = i < anzahl ? f.richtig : (f.richtig + 1) % 4;
    });
    index = FRAGEN.length;

    auswerten();
    if (p.get("urkunde") === "1") urkundeZeichnen();
  })();
})();

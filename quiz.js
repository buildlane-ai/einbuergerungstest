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

    el("u-fliesstext").textContent =
      `am ${heute} vor der Prüfungsstelle Kartoffelparty den Einbürgerungstest ` +
      `abgelegt und dabei ${richtig} von ${FRAGEN.length} Fragen zutreffend ` +
      `beantwortet hat. Zum Bestehen waren ${BESTEHENSGRENZE} richtige Antworten erforderlich.`;

    const urteil = el("u-urteil");
    urteil.textContent = bestanden ? "Bestanden" : "Nicht bestanden";
    urteil.className = "u-urteil " + (bestanden ? "bestanden" : "nicht");

    el("u-nachsatz").textContent = bestanden
      ? "Diese Urkunde berechtigt ausdrücklich nicht zur Einbürgerung, wohl aber " +
        "zum Nachschlag am Buffet und zum aufrechten Gang für den Rest des Abends."
      : "Diese Urkunde berechtigt weder zur Einbürgerung noch zum letzten Bier. " +
        "Eine Wiederholung ist unbegrenzt oft und kostenfrei möglich.";

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
})();

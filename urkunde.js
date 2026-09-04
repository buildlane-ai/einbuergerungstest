/* Füllt die Kartoffelurkunde. Wird vom Einzelmodus und von der
   gemeinsamen Runde gleichermaßen benutzt. */

function urkundeFuellen({ name, richtig, gesamt, erforderlich }) {
  const el = (id) => document.getElementById(id);
  const bestanden = richtig >= erforderlich;

  const namensfeld = el("u-name");
  if (name) {
    namensfeld.textContent = name;
    namensfeld.classList.remove("leer");
  } else {
    namensfeld.textContent = " ".repeat(20);   // Linie zum Eintragen von Hand
    namensfeld.classList.add("leer");
  }

  const heute = new Date().toLocaleDateString("de-DE",
    { day: "numeric", month: "long", year: "numeric" });

  el("u-unter").textContent = bestanden
    ? "Bescheid über das Bestehen des Einbürgerungstests"
    : "Bescheid über das Nichtbestehen des Einbürgerungstests";

  el("u-fliesstext").textContent =
    `am ${heute} den Einbürgerungstest abgelegt und dabei ${richtig} von ` +
    `${gesamt} Fragen zutreffend beantwortet hat. Zum Bestehen waren ` +
    `${erforderlich} richtige Antworten erforderlich.`;

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

  let summe = 0;
  const basis = (name || "ohne Namensangabe") + "|" + richtig;
  for (let i = 0; i < basis.length; i++) summe = (summe * 31 + basis.charCodeAt(i)) % 100000;
  el("u-akte").textContent =
    `Aktenzeichen KP-${new Date().getFullYear()}-${String(summe).padStart(5, "0")}`;
}

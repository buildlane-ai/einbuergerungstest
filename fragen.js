// 33 Fragen nach Vorbild des Tests "Leben in Deutschland":
// 30 allgemeine Fragen + 3 Fragen zum Bundesland Hamburg.
// Bestanden ab 17 richtigen Antworten.
// Hinweis: aus dem offiziellen Fragenkatalog zusammengestellt, ohne amtliche Gewähr.

const FRAGEN = [
  {
    frage: "Wie heißt die deutsche Verfassung?",
    optionen: ["Grundgesetz", "Bundesverfassung", "Verfassungsvertrag", "Bundesgesetzbuch"],
    richtig: 0
  },
  {
    frage: "Wie viele Bundesländer hat Deutschland?",
    optionen: ["12", "14", "16", "18"],
    richtig: 2
  },
  {
    frage: "Welche Farben hat die deutsche Flagge?",
    optionen: ["schwarz, rot, gold", "schwarz, rot, grün", "blau, weiß, rot", "schwarz, gelb, rot"],
    richtig: 0
  },
  {
    frage: "Wann wurde die Bundesrepublik Deutschland gegründet?",
    optionen: ["1919", "1945", "1949", "1990"],
    richtig: 2
  },
  {
    frage: "Wer wählt in Deutschland die Bundeskanzlerin oder den Bundeskanzler?",
    optionen: ["das Volk direkt", "der Bundestag", "der Bundesrat", "die Bundesversammlung"],
    richtig: 1
  },
  {
    frage: "Wer ernennt in Deutschland die Ministerinnen und Minister der Bundesregierung?",
    optionen: ["der Bundestag", "das Bundesverfassungsgericht", "die Bundespräsidentin oder der Bundespräsident", "der Bundesrat"],
    richtig: 2
  },
  {
    frage: "Alle wie viele Jahre wird der Deutsche Bundestag gewählt?",
    optionen: ["alle 3 Jahre", "alle 4 Jahre", "alle 5 Jahre", "alle 6 Jahre"],
    richtig: 1
  },
  {
    frage: "Wie viele Stimmen hat man bei einer Bundestagswahl?",
    optionen: ["eine Stimme", "zwei Stimmen", "drei Stimmen", "so viele wie Parteien antreten"],
    richtig: 1
  },
  {
    frage: "Ab welchem Alter darf man in Deutschland den Bundestag wählen?",
    optionen: ["ab 16", "ab 18", "ab 21", "ab 25"],
    richtig: 1
  },
  {
    frage: "Wann ist der Tag der Deutschen Einheit?",
    optionen: ["1. Mai", "17. Juni", "3. Oktober", "9. November"],
    richtig: 2
  },
  {
    frage: "Was bedeutet \"Rechtsstaat\" in Deutschland?",
    optionen: [
      "Der Staat steht über dem Gesetz.",
      "Alle müssen sich an die Gesetze halten, auch der Staat selbst.",
      "Nur Gerichte müssen sich an Gesetze halten.",
      "Das Recht wird von der Regierung frei ausgelegt."
    ],
    richtig: 1
  },
  {
    frage: "Welches Recht gehört zu den Grundrechten in Deutschland?",
    optionen: ["Recht auf Arbeit", "Meinungsfreiheit", "Recht auf eine Wohnung", "Recht auf ein Auto"],
    richtig: 1
  },
  {
    frage: "In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil …",
    optionen: [
      "hier Meinungsfreiheit gilt.",
      "die Menschen Steuern zahlen.",
      "die Regierung das erlaubt hat.",
      "hier Religionsfreiheit gilt."
    ],
    richtig: 0
  },
  {
    frage: "Was ist Deutschland nicht?",
    optionen: ["eine Demokratie", "ein Rechtsstaat", "eine Monarchie", "ein Sozialstaat"],
    richtig: 2
  },
  {
    frage: "Die Bundesrepublik Deutschland ist ein demokratischer und … Bundesstaat.",
    optionen: ["sozialer", "sozialistischer", "liberaler", "konservativer"],
    richtig: 0
  },
  {
    frage: "Welche drei Bundesländer sind Stadtstaaten?",
    optionen: [
      "Hamburg, Bremen, Berlin",
      "Hamburg, München, Berlin",
      "Bremen, Köln, Berlin",
      "Hamburg, Bremen, Hannover"
    ],
    richtig: 0
  },
  {
    frage: "Was ist keine Aufgabe der Bundespräsidentin oder des Bundespräsidenten?",
    optionen: [
      "Gesetze unterzeichnen",
      "das Land im Ausland vertreten",
      "die Regierungspolitik bestimmen",
      "Orden verleihen"
    ],
    richtig: 2
  },
  {
    frage: "Was ist keine staatliche Gewalt in Deutschland?",
    optionen: ["die Gesetzgebung", "die Rechtsprechung", "die vollziehende Gewalt", "die Wirtschaft"],
    richtig: 3
  },
  {
    frage: "Wer beschließt in Deutschland die Bundesgesetze?",
    optionen: ["die Bundesregierung allein", "der Bundestag", "das Bundesverfassungsgericht", "die Bundespräsidentin"],
    richtig: 1
  },
  {
    frage: "Welche Aufgabe hat der Bundesrat?",
    optionen: [
      "Er wählt den Bundeskanzler.",
      "Die Bundesländer wirken an der Gesetzgebung des Bundes mit.",
      "Er überwacht die Gerichte.",
      "Er beschließt den Haushalt allein."
    ],
    richtig: 1
  },
  {
    frage: "Was bedeutet \"Volkssouveränität\"?",
    optionen: [
      "Alle Staatsgewalt geht vom Volke aus.",
      "Der Bundespräsident bestimmt allein.",
      "Das Volk zahlt die Steuern.",
      "Ein König herrscht über das Volk."
    ],
    richtig: 0
  },
  {
    frage: "Was ist das höchste Gericht in Deutschland?",
    optionen: ["der Bundesgerichtshof", "das Bundesverfassungsgericht", "das Landgericht", "der Europäische Gerichtshof"],
    richtig: 1
  },
  {
    frage: "Wer war der erste Bundeskanzler der Bundesrepublik Deutschland?",
    optionen: ["Willy Brandt", "Helmut Schmidt", "Konrad Adenauer", "Ludwig Erhard"],
    richtig: 2
  },
  {
    frage: "Wann fiel die Berliner Mauer?",
    optionen: ["1961", "1987", "1989", "1990"],
    richtig: 2
  },
  {
    frage: "Was geschah am 17. Juni 1953 in der DDR?",
    optionen: ["Gründung der DDR", "Volksaufstand", "Bau der Mauer", "Beitritt zur NATO"],
    richtig: 1
  },
  {
    frage: "Wie heißt die Nationalhymne der Bundesrepublik Deutschland?",
    optionen: [
      "\"Die Wacht am Rhein\"",
      "\"Das Lied der Deutschen\"",
      "\"Auferstanden aus Ruinen\"",
      "\"Deutschland über alles\""
    ],
    richtig: 1
  },
  {
    frage: "Wofür steht die Abkürzung EU?",
    optionen: ["Europäische Union", "Europäisches Übereinkommen", "Einheit und Unabhängigkeit", "Europäische Urkunde"],
    richtig: 0
  },
  {
    frage: "Wer bestimmt in Deutschland überwiegend die Schulpolitik?",
    optionen: ["der Bund", "die Bundesländer", "die Europäische Union", "die Gemeinden"],
    richtig: 1
  },
  {
    frage: "Bei welcher Behörde meldet man in Deutschland seinen Wohnsitz an?",
    optionen: ["beim Finanzamt", "beim Einwohnermeldeamt", "beim Arbeitsamt", "beim Ordnungsamt"],
    richtig: 1
  },
  {
    frage: "Wie viele Fragen muss man im echten Einbürgerungstest richtig beantworten, um zu bestehen?",
    optionen: ["12 von 33", "15 von 33", "17 von 33", "22 von 33"],
    richtig: 2
  },
  {
    frage: "Hamburg: Wie heißt das Landesparlament?",
    optionen: ["Landtag", "Hamburgische Bürgerschaft", "Abgeordnetenhaus", "Senat"],
    richtig: 1,
    land: true
  },
  {
    frage: "Hamburg: Wie heißt die Regierung des Bundeslandes?",
    optionen: ["Senat", "Kabinett", "Magistrat", "Staatsrat"],
    richtig: 0,
    land: true
  },
  {
    frage: "Hamburg: Wie wird die Regierungschefin oder der Regierungschef genannt?",
    optionen: [
      "Ministerpräsidentin oder Ministerpräsident",
      "Erste Bürgermeisterin oder Erster Bürgermeister",
      "Landeshauptfrau oder Landeshauptmann",
      "Senatspräsidentin oder Senatspräsident"
    ],
    richtig: 1,
    land: true
  }
];

const BESTEHENSGRENZE = 17;

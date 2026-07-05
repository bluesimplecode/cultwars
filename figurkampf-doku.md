# FigurKampf — Projektdokumentation

---

## Funktionale Anforderungen

**Sammeln**
- Figuren per NFC-Tag scannen und der eigenen Sammlung hinzufügen
- Jede Figur hat: Name, Emoji als Sprite, Größe (1×1 / 2×2 / 3×3 Felder), Bewegungsmuster (5×5 Grid wie Schach), Bewegungsart (springt/gleitet), Story-Text
- Neue, noch nicht gescannte Figuren sind im Kodex als `???` verschleiert sichtbar
- Beim ersten Öffnen einer neu gescannten Figur verschwindet der NEU-Badge
- Der Spieler startet mit genau einer Figur: dem eigenen **Höchsten Cultwesen** (Katalog-ID 9, der Pflicht-König) — muss nie per NFC gefunden werden, alle anderen Figuren müssen erst gescannt werden
- Name und Emoji des höchsten Cultwesens ändern sich ausschließlich über mit dem Sammelfortschritt freigeschaltete Titel-Stufen (Figur-Detailansicht) — kein frei eingebbarer Name/Emoji, nur Auswahl aus freigeschalteten Optionen; Bewegungsmuster (identisch zur "König"-Vorlage) bleibt fix
- Das Design wird mit jeder zusätzlich gesammelten Figur kontinuierlich okkulter und düsterer, bis Stufe 33 (siehe eigener Abschnitt unten)

**Spielen — Solo**
- Spielfeldgröße wählen (6×6, 8×8, 10×10)
- Eigene Figuren aus der Sammlung auswählen — der König muss dabei sein, sonst kein Spielstart möglich
- Figuren in den untersten 3 Reihen frei platzieren (inkl. Kollisionsprüfung und Größenberücksichtigung) — der König muss ebenfalls platziert werden
- Rundenbasiertes Spiel: Spieler zieht, dann KI. Auch der Gegner hat immer einen eigenen König
- Sieg/Niederlage wird erkannt und in Statistiken gespeichert — fällt der eigene oder gegnerische König, endet die Schlacht sofort, unabhängig von übrigen Figuren

**Spielen — Multiplayer**
- Zwei Rollen: Sender und Host
- Sender platziert Figuren (inkl. Pflicht-König) → generiert QR-Code aus seiner Aufstellung
- Host platziert Figuren (inkl. Pflicht-König) → scannt den QR-Code des Senders mit der Kamera
- Beide Aufstellungen werden auf einem Gerät (Host) zusammengeführt, Sender-Figuren werden gespiegelt
- Beide spielen dann abwechselnd rundenbasiert auf dem Host-Gerät (kein KI-Zug)

**Kodex**
- Alle im System bekannten Figuren anzeigen
- Nicht gesammelte Figuren als anonyme Silhouette zeigen

**Statistiken**
- Kills pro Figur zählen und persistieren
- Nutzungshäufigkeit pro Figur zählen
- Globale Werte: Spiele gesamt, Siege, Niederlagen

**Admin-Generator** *(separate Datei, nicht verteilen)*
- Figuren erstellen: Name, Emoji, Größe, Story, Bewegungsmuster, Bewegungsart (springt/gleitet), König-Flag
- Figuren-Bibliothek (localStorage)
- Fertige Figuren auf NFC-Tags schreiben (Web NFC API)

---

## Nicht-funktionale Anforderungen

- **Plattform:** Android, Chrome (primär); alle anderen Browser mit Kamera als Fallback für QR-Scan
- **Offline-fähig:** Keine Internetverbindung nötig — weder für Spielbetrieb noch für den Admin-Generator
- **Kein Server:** Alles lokal — localStorage für Persistenz, keine Backend-API
- **Zwei Dateien:** `cultwars.html` (Spiel) und `figuren-admin.html` (Generator); beide eigenständig
- **Selbstenthalten:** QR-Bibliotheken sind eingebettet (kein CDN-Aufruf zur Laufzeit nötig)
- **Datenmenge NFC-Tag:** Eine Figur ≈ 280 Bytes → NTAG215 (504 B) mindestens; NTAG216 (888 B) empfohlen. Eine Aufstellung ≈ 260–475 Bytes → QR-Code ausreichend

---

## Okkulte Design-Eskalation

Die App startet als schlichtes Dark-Theme mit nur dem eigenen höchsten Cultwesen in der Sammlung. Mit jeder zusätzlich gescannten Figur verschiebt sich die Optik **kontinuierlich** (nicht in großen Sprüngen) Richtung düster/okkult, bis Stufe 33 (Maximum). Die "Stufe" entspricht 1:1 der Anzahl zusätzlich gesammelter Figuren (`ownedFigures().length - STARTER_OWNED_COUNT`, aktuell `STARTER_OWNED_COUNT = 1`).

Technisch: `applyCorruptionTheme()` läuft bei jedem `rebuildFigures()`-Aufruf, interpoliert zwischen vier handgesetzten Farb-Ankerpunkten (`THEME_STOPS` bei Stufe 0, 8, 20, 33) und schreibt das Ergebnis als Inline-CSS-Variablen auf `<body>` (`--bg`, `--accent`, `--accent2`, `--accent-rgb`, `--gold`, `--text/2/3`, `--header-grad-top`, `--nfc-grad-1/2`, `--border`, `--vignette-opacity`, `--bg-image-opacity`). Dadurch verschiebt sich die Farbgebung mit *jeder einzelnen* neuen Figur ein kleines Stück, statt in wenigen diskreten Stufen zu springen. Ab Stufe 20 bekommt `<body>` zusätzlich die Klasse `.deep-corruption`, die eine dezente Flacker-Animation auf Vignette und Titel aktiviert (respektiert `prefers-reduced-motion`).

Eine Ausnahme ist `--player-rgb`: die Farbe der eigenen Spielfiguren auf dem Brett ist bewusst von der allgemeinen Akzentfarbe entkoppelt (bleibt violett/magenta statt nach Rot zu wandern), damit sie bei hoher Korruptionsstufe nicht mit der (fest roten) Gegnerfarbe verschmilzt.

**Hintergrundbild:** `bg.png` liegt als fixer Layer (`#bg-layer`, `z-index:-1`) hinter dem gesamten Inhalt, standardmäßig unsichtbar (`--bg-image-opacity: 0`). Die Opacity steigt mit derselben Stufe linear bis max. 0.55 bei Stufe 33. Das Bild wird per CSS (`grayscale` + `contrast` + roter `mix-blend-mode: multiply`-Overlay) rot eingefärbt, ohne die Originaldatei zu verändern.

**Titel-Freischaltung für das höchste Cultwesen:** Mit steigender Stufe schaltet `KING_TITLE_TIERS` neue Titel+Emoji-Kombinationen frei, die in der Figur-Detailansicht wählbar werden (gesperrte Stufen erscheinen als "🔒 ???"):

| Stufe | Titel | Emoji |
|---|---|---|
| 1 | Gewöhnliches | 👁 |
| 2 | Geheimnisvolles | 🌙 |
| 3 | Verspieltes | ♟ |
| 5 | Verdorbenes | 🖤 |
| 8 | Verfluchtes | ☠️ |
| 10 | Blutrünstiges | 🩸 |
| 12 | Übernatürliches | ✨ |
| 13 | Hinterlistiges | 🐍 |
| 15 | Entsetzliches | 😱 |
| 20 | Transzendentes | 👑 |
| 22 | Kosmisches | 🌌 |
| 25 | Allgegenwärtiges | ♾️ |
| 30 | Heißes | 🔥 |
| 33 | Allmächtiges | 🧿 |

Ein gewählter Titel wird dem festen Basisnamen "Höchstes Cultwesen" vorangestellt (z.B. "Verdorbenes Höchstes Cultwesen") und erscheint überall, wo der Figurenname angezeigt wird. Es gibt keine freie Name- oder Emoji-Eingabe mehr — auswählbar sind ausschließlich die freigeschalteten Titel-Stufen.

**Test-Cheat:** `cultwars.html?maxed=N` bzw. `?maxxed=N` (beide Schreibweisen funktionieren, z.B. `?maxed=30`) fügt beim Laden `N` synthetische Testfiguren zur Sammlung hinzu, um jede Eskalationsstufe ohne echtes Scannen begutachten zu können. Funktioniert auch beim direkten Öffnen per `file://` (kein Server nötig). Wirkt nur clientseitig für die laufende Sitzung und verändert `localStorage` nicht von sich aus — ein Reload ohne den Parameter zeigt wieder den echten Spielstand. (Bewusst als URL-Parameter statt als separate `cultwars-maxxed-out.html`-Kopie umgesetzt, damit keine zweite, potenziell veraltende Kopie der App gepflegt werden muss.)

---

## Features (vollständig umgesetzt)

### Haupt-App (`cultwars.html`)

| Feature | Status |
|---|---|
| 4-Tab-Navigation (Sammeln / Spielen / Kodex / Statistiken) | ✅ |
| Figuren-Sammlung mit NEU-Badge und Größen-Filter | ✅ |
| Figur-Detailansicht (Story, Bewegungsmuster, Kampfstats) | ✅ |
| NFC-Scan mit Web NFC API (`NDEFReader`) | ✅ |
| NFC-Support-Hinweis im UI | ✅ |
| Neue Figuren via NFC auch zum Katalog hinzufügen, falls unbekannt | ✅ |
| Kodex mit Silhouette für ungescannte Figuren | ✅ |
| Statistiken (Kills, Nutzung, Spiele/Siege persistent) | ✅ |
| localStorage-Persistenz (`figurkampf_save_v1`) | ✅ |
| Spielfeldgröße wählbar | ✅ |
| Platzierungsphase: freie Positionierung in den untersten 3 Reihen | ✅ |
| Platzierung berücksichtigt Figurengröße (1×1, 2×2, 3×3 als Block) | ✅ |
| Emoji als skalierter Block-Overlay (nicht einzelne Felder) | ✅ |
| Bewegungsursprung bei Mehrfelderfiguren korrekt (Mittelpunkt) | ✅ |
| Rundenbasiertes Spiel (Spieler → KI → Spieler …) | ✅ |
| Einfache Gegner-KI (bevorzugt Captures) | ✅ |
| Sieg/Niederlage-Erkennung und Speicherung | ✅ |
| Multiplayer: Host-Rolle mit eigener Platzierungsphase | ✅ |
| Multiplayer: Sender-Rolle mit eigener Platzierungsphase | ✅ |
| Sender generiert QR-Code aus Aufstellung (qrcodejs, eingebettet) | ✅ |
| Host scannt QR-Code via `BarcodeDetector` (Chrome/Android, nativ) | ✅ |
| Host scannt QR-Code via `jsQR` (Firefox/Safari/Desktop, Fallback) | ✅ |
| Sender-Figuren werden beim Host vertikal gespiegelt platziert | ✅ |
| Warnung bei unbekannten Figuren-IDs im empfangenen QR-Code | ✅ |
| Kamera-Ressource wird sauber freigegeben nach Scan-Abbruch | ✅ |
| Multiplayer-Kampfphase: Host + Sender abwechselnd am selben Gerät (kein KI-Zug) | ✅ |
| PWA: Manifest + Service Worker (installierbar, Offline-Caching) | ✅ |
| App-Icon (192/512, maskable) + Favicon | ✅ |
| Gleit-Bewegung: Figuren mit `moveMode:'slide'` werden durch Figuren auf geraden Zuglinien blockiert | ✅ |
| Sprung-Bewegung (Standard): ignoriert andere Figuren zwischen Start und Ziel | ✅ |
| König-Pflichtfigur: Auswahl vor Spielstart erzwungen, Platzierung vor Kampfstart erzwungen (Solo + Multiplayer) | ✅ |
| König-Tod beendet die Schlacht sofort — unabhängig von übrigen Figuren | ✅ |
| König-Hervorhebung: goldener Rahmen, Krone, Puls-Glow auf Spielbrett | ✅ |
| Solo-Gegner-KI bekommt garantiert ebenfalls einen König | ✅ |
| Höchstes Cultwesen (König, Katalog-ID 9) fest im Katalog, für jeden Spieler von Anfang an freigeschaltet | ✅ |
| Emoji des höchsten Cultwesens spielerseitig wählbar (Figur-Detailansicht, Override in `saveData` gespeichert) | ✅ |
| App umbenannt: `figuren-spiel.html` → `cultwars.html`, Seitentitel "Cultwars", Kodex-Überschrift "Cultwesenkodex" | ✅ |
| Okkulte Design-Eskalation: Theme verschiebt sich kontinuierlich mit jeder Figur, Maximum bei Stufe 33 | ✅ |
| Spieler-/Gegner-Figuren auf dem Brett bleiben auch bei maximaler Korruption farblich unterscheidbar (separate `--player-rgb`) | ✅ |
| Spieler startet mit genau einer Figur (dem eigenen höchsten Cultwesen), alle anderen müssen gescannt werden | ✅ |
| 14 freischaltbare Titel+Emoji-Kombinationen für das höchste Cultwesen (Stufe 1 bis 33), keine freie Name-/Emoji-Eingabe | ✅ |
| Rot eingefärbter Hintergrund-Layer (`bg.png`) wird mit Sammelfortschritt zunehmend sichtbar | ✅ |
| App-Icons (192/512/maskable/Favicon) aus `icon.png` generiert | ✅ |

### Admin-Generator (`figuren-admin.html`)

| Feature | Status |
|---|---|
| Figur erstellen (Name, Emoji-Picker, Größe, Story) | ✅ |
| 5×5 Bewegungsmuster per Klick editieren | ✅ |
| Bewegungsmuster-Vorlagen (Läufer, Turm, Springer, König, Ring, Kreuz) | ✅ |
| NFC-Tag beschreiben (Web NFC `write`) | ✅ (echter `NDEFReader.write()`-Aufruf, keine Simulation) |
| Figuren-Bibliothek in localStorage | ✅ |
| JSON-Export aller Figuren | ✅ |
| NFC Payload-Vorschau (Bytes-Anzeige) | ✅ |
| Bewegungsart wählbar: Springt (Standard) / Gleitet (wird blockiert) | ✅ |
| König-Flag ("Ist der König") mit frei wählbarem Emoji, goldene Hervorhebung in Vorschau + Bibliothek | ✅ |

---

## Aktueller Stand

Die App ist ein vollständig funktionsfähiger **Klick-Prototyp** im Browser und als PWA installierbar. Alle Kern-Features sind implementiert und verbunden. Die wichtigsten Einschränkungen betreffen Hardware-APIs, die nur auf echten Android-Geräten in Chrome testbar sind:

- **Web NFC** (`NDEFReader`, Lesen *und* Schreiben) ist im Browser nur auf Android/Chrome verfügbar und kann in keinem anderen Kontext (Desktop, iOS, Claude-Vorschau) getestet werden. Es gibt keine Simulation mehr als Ersatz — ohne Web-NFC-Support zeigt die App nur einen Hinweis an.
- **QR-Scan** funktioniert browserübergreifend (nativ via `BarcodeDetector` in Chrome/Android, via eingebetteter `jsQR`-Bibliothek in Firefox/Safari/Desktop). In der Claude-Vorschau ist Kamerazugriff aus Sicherheitsgründen nicht möglich.
- **localStorage** funktioniert in der Claude-Artifact-Vorschau nicht (Browser-Beschränkung des Sandboxes). Auf einem echten Gerät funktioniert die Persistenz vollständig.
- **Service Worker** braucht HTTPS oder `localhost` zum Registrieren (Browser-Sicherheitsanforderung); lokal getestet über `python -m http.server`.
- **König im Multiplayer:** Der Host löst die vom Sender empfangenen Figuren-IDs über seinen eigenen `FIGURES_CATALOG` auf. Kennt der Host den König des Senders nicht (z.B. eigene Admin-Tool-Kreation, nie per NFC synchronisiert), fehlt er in der Aufstellung und die Schlacht kann sofort enden — die App warnt in diesem Fall explizit.

Gesamtgröße der Haupt-App-Datei: ~250 KB (inkl. eingebetteter QR-Bibliotheken qrcodejs ≈ 20 KB + jsQR ≈ 130 KB), zzgl. `manifest.json`, `service-worker.js` und Icons. **Achtung:** `bg.png` (~2,5 MB) wird vom Service Worker vorgecacht und ist damit der mit Abstand größte Ladeposten der App — auf einer schwachen Mobilfunkverbindung beim ersten Laden spürbar. Bei Bedarf könnte das Bild verlustfrei bzw. verlustarm komprimiert werden, ohne den sichtbaren Effekt zu verändern.

---

## ToDos

**Kurzfristig (für echte Android-Nutzung)**
- [x] Web NFC im Admin-Tool tatsächlich verdrahten (`write()`-Aufruf mit echtem NDEF-Record, nicht nur simuliert) — `writeFigureToTag()` nutzt `NDEFReader.write()` mit `text`-Record, zeigt bei fehlendem Web-NFC-Support nur eine Hinweismeldung (keine Simulation)
- [x] NDEF-Record-Format zwischen Admin-Write und App-Scan abgeglichen — beide Seiten nutzen `recordType: 'text'` mit rohem JSON-String, passt zu `parseFigurePayload()`
- [ ] Web NFC (Schreiben *und* Lesen) auf echtem Android-Gerät verifizieren — kann nicht aus der Entwicklungsumgebung getestet werden, nur Code-Review möglich
- [x] PWA-Manifest + Service Worker → App installierbar machen + Offline-Caching (`manifest.json`, `service-worker.js`, in `cultwars.html` eingebunden)
- [x] App-Icon und Splash Screen (`icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png`, `icons/favicon.png`)

**Mittelfristig**
- [ ] Multiplayer: Ergebnis-Rückkanal Host → Sender (derzeit kein Rückkanal; Optionen: QR-Code auf Host-Bildschirm, den Sender scannt)
- [ ] Platzierungsphase im Multiplayer: Gegner-Startpositionen für den Sender visuell anzeigen (er sieht nur sein eigenes Feld, nicht das des Hosts)
- [ ] Zugzwang-Prüfung (Spiel endet auch, wenn ein Spieler keine gültigen Züge mehr hat)
- [ ] Figuren-Sync zwischen Admin-Tool und Haupt-App (aktuell manuell per NFC-Tag; könnte via exportiertem JSON-Import oder geteiltem localStorage-Namespace gehen)

**Langfristig / Nice-to-have**
- [ ] Figuren-Katalog im Admin-Tool per QR-Code exportieren (statt nur NFC), damit auch Geräte ohne NFC neue Figuren erhalten können
- [ ] Mehrere Sammlungen / Profile (aktuell nur ein `saveData`-Slot)
- [ ] Animationen beim Kampf (Figur-Eliminierung, Zuganimation)
- [ ] Sound-Effekte (optional per Toggle)
- [ ] Figuren mit mehr als einem Emoji / animierten Sprites

---

## Gestrichene Features

| Feature | Grund |
|---|---|
| **Flucht-Tracking** (Statistik wenn Host Ergebnis nicht zurücksendet) | Kein Rückkanal möglich ohne Internet oder Hardware; gestrichen auf Wunsch |
| **NFC Phone-to-Phone** (direkte Übertragung Sender → Host durch Annähern der Handys) | Technisch nicht möglich mit Web NFC API — `NDEFReader` kommuniziert nur mit passiven Tags, nicht mit anderen Phones. Android Beam (die frühere Lösung) ist seit Android 10 abgekündigt und in Browsern nie verfügbar gewesen |
| **Bluetooth-Datentransfer** | Web Bluetooth unterstützt kein Peer-to-Peer zwischen zwei Browser-Tabs auf verschiedenen Geräten; nur Central↔Peripheral-Verbindungen zu nativen BLE-Services möglich |
| **WiFi Direct / Nearby Connections** | Reine Android-Native-APIs, nicht im Browser erreichbar |
| **QR-Code als Hauptdatenaustausch via NFC-Tag als Zwischenspeicher** | NFC-Tags (NTAG215) haben mit 504 Bytes zu knapp Platz für große Aufstellungen; QR-Code auf Bildschirm ist einfacher und braucht keinen Extra-Tag |
| **KI-Story im Spiel selbst** | Würde Internetverbindung im Spiel erfordern |
| **KI-Story-Generierung im Admin-Tool** (`generateAIStory()`, Aufruf an `api.anthropic.com`) | Auf Wunsch entfernt; funktionierte ohnehin nur innerhalb der Claude-Sandbox (kein eingebetteter API-Key, direkter Browser-Call scheiterte außerhalb an CORS/Auth). Story-Text wird jetzt ausschließlich manuell eingegeben |
| **Simuliertes NFC-Lesen/-Schreiben als Fallback** (`scanNFCFallback()` in der Haupt-App, `simulateScan()` + Simulations-Zweig in `writeFigureToTag()` im Admin-Tool) | Auf Wunsch entfernt; ohne echtes Web NFC (Chrome/Android) zeigt die App jetzt nur noch einen Hinweis statt zufällige/simulierte Ergebnisse vorzutäuschen |
| **Privatsphäre-Screen beim Multiplayer-Zugwechsel** ("Handy übergeben"-Overlay, das das Feld verdeckt) | Auf Wunsch gestrichen; die Zug-Anzeige zeigt weiterhin den Text-Hinweis "Gib das Gerät weiter", aber kein eigenes Overlay |

# Cosmos V2 – Theme Builder Visual Specifications

**Version:** 1.0  
**Status:** Proposed authoritative visual product specification  
**Scope:** Theme Builder Experience  
**Implementation:** None  
**Primary reference viewport:** 1600 × 1000  
**Minimum productive viewport:** 1280 × 800

---

# 1. Product Vision

Der Theme Builder ist ein hochwertiges Creative Tool zum Erschaffen visueller Welten.

Er fühlt sich an wie:

- ein ruhiges digitales Atelier;
- eine kuratierte Asset-Sammlung;
- eine große visuelle Arbeitsfläche;
- eine Präsentationsbühne für das entstehende Theme.

Er fühlt sich ausdrücklich nicht an wie:

- ein Admin-Panel;
- ein Datenbank-Frontend;
- ein Entwicklereditor;
- ein Schema- oder JSON-Editor;
- eine vereinfachte Runtime;
- ein Base Builder.

Die sichtbare Arbeit folgt den Begriffen des Künstlers:

- Bild
- Form
- Fläche
- Material
- Look
- Layer
- Variante
- Bewegung
- Vorschau
- Theme Pack

Technische Identitäten, Versionen und Kompatibilitätsdetails bleiben verfügbar, dominieren aber niemals die Arbeitsfläche.

---

# 2. Verbindliche Produktgrenzen

Der Theme Builder erstellt und bearbeitet:

- Visual Assets
- Asset-Library-Einträge
- Room Shell Templates
- Object Templates
- Skins
- Materialien
- Hintergründe
- visuelle Zustände
- deklarative Animationen
- Theme Packs
- Asset- und Look-Packs
- Artist-Handoff-Pakete

Der Theme Builder erstellt nicht:

- persistente Rooms
- Room Presets
- Base Compositions
- Navigation
- Workspace-Definitionen
- Interaction Zones
- Hitbox Definition Packs
- Function Bindings
- Runtime Targets
- Aktionen oder Berechtigungen

Preview Fixtures und Showcase-Anordnungen sind ausschließlich visuelle Prüfmittel. Sie werden niemals als Room, Preset oder Funktion exportiert.

---

# 3. Experience-Modell

Der Theme Builder verwendet ein Studio-Modell.

Die permanenten Hauptbereiche sind:

1. Theme Board
2. Asset Library
3. Templates
4. Looks
5. Showcase
6. Release

Templates enthält:

- Room Shell Studio
- Object Studio

Looks enthält:

- Skins
- Materialien
- Hintergründe
- visuelle Varianten

Animation ist kein dauerhaftes Hauptstudio. Die Timeline öffnet sich kontextuell innerhalb des Studios, in dem die Bewegung verwendet wird.

Alle Studios teilen dieselbe Bediengrammatik:

- links: Navigation oder arbeitsbezogener Kontext;
- Mitte: visuelle Hauptarbeitsfläche;
- rechts: Inspector;
- unten: kontextueller Drawer;
- oben: Projektorientierung und globale Aktionen.

Ein Künstler lernt diese Struktur einmal und verwendet sie überall.

---

# 4. Gesamtlayout

## 4.1 Builder Surface

Der Theme Builder erscheint innerhalb von Cosmos als eine zusammenhängende fokussierte Arbeitsfläche.

Interne Bereiche sind keine frei schwebenden Cosmos Tool Windows. Sie sind Bestandteile einer einzigen Creative Surface.

Das verhindert:

- verschachtelte Fensterrahmen;
- konkurrierende Header;
- versehentlich geschlossene Kernbereiche;
- den Eindruck eines allgemeinen Desktop-Editors.

## 4.2 Referenzaufteilung

Bei 1600 × 1000:

| Region | Zielgröße |
|---|---:|
| Top Bar | 64 hoch |
| Studio Rail | 72 breit |
| Kontextpanel links | 240–280 breit |
| Inspector rechts | 320–360 breit |
| Bottom Drawer | geschlossen, kompakt oder etwa ein Drittel der Arbeitshöhe |
| Canvas | mindestens 58 %, typischerweise 62–72 % der horizontalen Fläche |

Der Canvas erhält immer den verbleibenden Raum. Panels erhalten feste sinnvolle Bereiche und wachsen nicht unbegrenzt.

Wenn der Canvas unter eine produktive Breite fällt:

1. Das linke Kontextpanel klappt ein.
2. Der Inspector wechselt in eine überlagernde oder ersetzende Detailansicht.
3. Der Canvas bleibt verwendbar.
4. Erst danach werden Toolbar-Beschriftungen reduziert.

## 4.3 Studio Rail

Die Studio Rail bleibt auf normalen Desktopgrößen dauerhaft sichtbar.

Sie enthält:

- Theme Board
- Library
- Templates
- Looks
- Showcase
- Release

Eigenschaften:

- 72 breit;
- großes klares Icon;
- kurzer Tooltip;
- aktiver Bereich deutlich markiert;
- keine Untermenüs im Ruhezustand;
- Templates und Looks öffnen ihre Unterbereiche in einem angrenzenden Kontextpanel.

Die Rail kann manuell auf etwa 220–240 Breite erweitert werden. Sie zeigt dann Icon, Namen und kurze Statusinformationen.

Die Auswahl eines Studios verändert nicht die Position der Rail.

## 4.4 Top Bar

Die Top Bar enthält dauerhaft:

- Theme-Name
- Breadcrumb
- aktuellen Studio- oder Artefaktnamen
- Save-Status
- Undo
- Redo
- Preview-Profil
- Theme Check
- Export vorbereiten

Der Theme-Name steht links und bleibt bei jedem Kontextwechsel sichtbar.

Globale Aktionen stehen rechts. Die Mitte bleibt frei genug, damit lange Artefaktnamen nicht mit Aktionen kollidieren.

Nicht dauerhaft sichtbar:

- technische Theme-ID;
- Registry-Zustand;
- Dependency-Liste;
- Contract-Version;
- Dateipfade.

Diese Informationen befinden sich in Release oder Advanced Details.

## 4.5 Kontextpanel links

Das linke Kontextpanel wechselt seine Aufgabe je Studio:

| Kontext | Inhalt |
|---|---|
| Theme Board | normalerweise geschlossen |
| Asset Library | Systemansichten und Scope |
| Room Shell Studio | Shells, Art/Structure-Layer |
| Object Studio | Object Templates, Layer, Slots |
| Looks Studio | Skins, Slots, Varianten, Materialien |
| Showcase | geschlossen |
| Release | Exportabschnitte oder Paketinhalt |

Das Panel ist niemals eine universelle Scene Tree.

## 4.6 Inspector rechts

Der Inspector ist standardmäßig 336 breit.

Er darf zwischen ungefähr 304 und 400 Breite angepasst werden. Darüber wächst er nicht weiter; zusätzlicher Raum gehört dem Canvas.

Der Inspector zeigt ausschließlich Informationen zur aktuellen Auswahl oder zum aktuellen Dokument.

Ohne Auswahl zeigt er:

- Canvas- oder Preview-Kontext;
- Theme-Default;
- aktuellen Modus;
- sinnvolle nächste Aktion.

## 4.7 Bottom Drawer

Der Bottom Drawer besitzt drei Zustände:

- geschlossen;
- kompakte Leiste;
- geöffnet.

Mögliche Inhalte:

- Asset Shelf
- Timeline
- Validation Findings
- Variantenvergleich
- Import Review

Der Drawer behält seine zuletzt gewählte Höhe pro Studio.

Auf großen Flächen verkleinert er den Canvas. Auf schmalen Flächen darf er den unteren Teil überlagern, muss aber klar als temporäre Arbeitsfläche erkennbar bleiben.

Es ist immer nur ein Bottom Drawer gleichzeitig geöffnet.

---

# 5. Theme Board

## 5.1 Aufgabe

Das Theme Board ist die visuelle Heimat des Themes.

Es beantwortet innerhalb weniger Sekunden:

- An welchem Theme arbeite ich?
- Wie fühlt sich die Welt an?
- Woran habe ich gearbeitet?
- Was kann ich als Nächstes tun?
- Welche Bereiche verwenden bereits eigene Looks?
- Wo werden noch Core-Fallbacks verwendet?

Es ist kein Dashboard mit Diagrammen und Kennzahlen.

## 5.2 Oberer Bereich

Oberhalb der Inhalte stehen:

- Theme-Name
- einzeilige kreative Beschreibung
- optionaler Autor
- aktueller Draft-/Release-Status
- Aktion „Preview Theme“

Der Theme-Name verwendet die größte Typografiestufe des Builders.

## 5.3 Hauptkomposition

Die erste sichtbare Reihe besteht aus:

- Hero Preview links;
- Continue Working rechts oben;
- Theme Coverage rechts unten.

### Hero Preview

Zielgröße bei 1600 × 1000:

- etwa zwei Drittel der verfügbaren Inhaltsbreite;
- 16:9;
- ungefähr 480–540 hoch;
- große ruhige Rundung;
- keine permanenten Bedienelemente über dem Motiv.

Das Hero zeigt eine kuratierte Showcase-Situation des Themes.

Im unteren Bereich können bei Hover oder Fokus erscheinen:

- Preview öffnen
- anderes Hero-Motiv wählen
- Core Default vergleichen

Das Hero bleibt auch dann visuell sinnvoll, wenn noch kein eigener Inhalt existiert. In diesem Fall zeigt es die Core-Fallback-Welt mit dezenten leeren kreativen Slots.

### Continue Working

Zielgröße:

- ungefähr ein Drittel der Hauptreihe;
- zwei bis drei übereinanderliegende Arbeitskarten;
- jede Karte etwa 88–112 hoch.

Eine Arbeitskarte zeigt:

- Thumbnail;
- Artefaktname;
- Typ, etwa Room Shell oder Skin;
- letzten bekannten Arbeitszustand;
- eine klare Aktion „Continue“.

Solange kein autoritativer persistenter Recency-Vertrag existiert, zeigt dieser Bereich:

- offene Drafts;
- aktuelle Session;
- zuletzt im Builder wiederhergestellten Arbeitskontext.

Er zeigt keine erfundenen Zeitangaben.

### Theme Coverage

Zielgröße:

- gleiche Breite wie Continue Working;
- etwa 190–230 hoch.

Coverage verwendet keine Prozentzahl.

Es zeigt visuelle Bereiche:

- Cosmos
- Base
- Rooms
- Objects
- Windows
- Materials
- Motion

Jeder Bereich besitzt einen von vier Zuständen:

- eigener Look vorhanden;
- teilweise eigener Look;
- verwendet Core-Fallback;
- benötigt Aufmerksamkeit.

„Uses Core Fallback“ ist neutral und kein Fehler.

## 5.4 Moodboard

Das Moodboard liegt unter der Hauptreihe.

Layout:

- volle Inhaltsbreite;
- 4–6 visuelle Felder;
- Standardhöhe etwa 160–190;
- ein hervorgehobenes Hauptmotiv darf zwei Spalten belegen;
- unterschiedliche Bildformate werden innerhalb ruhiger fester Kartenrahmen gezeigt.

Moodboard-Karten zeigen:

- ausschließlich das Motiv;
- optional eine sehr kurze Notiz;
- Herkunft oder Asset-Zuordnung erst im Detail.

Das Moodboard fühlt sich wie eine kuratierte Wand im Atelier an, nicht wie eine Dateiliste.

## 5.5 Recent Assets

Der Bereich heißt in Version 1 sichtbar „Recent this session“, solange keine dauerhafte Nutzungshistorie existiert.

Layout:

- horizontale visuelle Reihe;
- 5–7 Karten bei großer Breite;
- Karten ungefähr 176–208 breit;
- kompakter als die vollständige Asset Library;
- Preview nimmt mindestens zwei Drittel der Karte ein.

Die Reihe darf horizontal scrollen, ohne den gesamten Theme-Board-Scroll zu blockieren.

## 5.6 Collections

Die aktuelle Asset-Library-Architektur besitzt noch kein freigegebenes persistentes Collections-Modell.

Daher zeigt der Theme-Builder in Version 1 systembasierte Theme-Shelves:

- Room Shells
- Object Templates
- Skins
- Materials
- Motion

Darstellung:

- 3–4 große Collection Cards pro Reihe;
- ungefähr 280–340 breit;
- 170–210 hoch;
- Collage aus maximal vier Vorschaubildern;
- Name und Anzahl unterhalb der Collage;
- keine Ordnerdarstellung.

Spätere benutzerdefinierte Collections verwenden dieselbe Karte und enthalten Referenzen, keine kopierten Assets.

## 5.7 Visuelle Priorität

Reihenfolge der Wahrnehmung:

1. Theme und Hero-Welt
2. Continue Working
3. Coverage
4. Moodboard
5. aktuelle Assets
6. Theme-Shelves

Der erste Bildschirm zeigt keine Lizenzdaten, Versionslisten oder Paketfehler.

---

# 6. Asset Library

## 6.1 Grundwirkung

Die Asset Library wirkt wie eine moderne visuelle Galerie.

Die Preview ist das primäre Erkennungsmerkmal. Text, Status und Herkunft sind unterstützend.

Die Library verwendet viel ruhige Fläche und keine dicht gepackte Tabellenansicht.

## 6.2 Layout

Desktopaufteilung:

- linke Library Navigation: etwa 208–224 breit;
- zentrale Gallery: flexibel;
- Detail Inspector: etwa 360–420 breit, nur bei Auswahl;
- Discovery Toolbar über der Gallery.

Wenn der Detail Inspector geöffnet wird, darf die Galerie nicht unter eine sinnvolle Kartengröße fallen. Andernfalls ersetzt der Detailbereich die Galerie temporär.

## 6.3 Asset Cards

### Standardgröße

Default Density:

- 196–224 breit;
- etwa 240–280 hoch;
- Preview nimmt 66–72 % der Kartenhöhe ein.

Weitere Dichten:

- Compact: 160–184 breit;
- Large Preview: 256–288 breit.

Default bleibt die normale Einstiegseinstellung.

### Kartenstruktur

Eine Karte enthält höchstens:

1. Preview
2. Name
3. Kategorie oder Theme-Kontext
4. primärer Status, falls nötig

Nicht dauerhaft sichtbar:

- Dateiname zusätzlich zum Anzeigenamen;
- technische ID;
- Version;
- Creator;
- Lizenz;
- Formatdetails;
- mehrere Statusbadges.

### Preview

- fester visueller Rahmen;
- transparente Assets auf ruhigem Prüfuntergrund;
- Assets werden vollständig sichtbar gehalten;
- kein unkontrolliertes Cropping;
- keine erfundenen Layer;
- Animationen starten nicht automatisch.

Ein Video oder animiertes Asset zeigt ein Poster und ein kleines Motion-Symbol.

### Status

Normale katalogisierte Assets besitzen keinen sichtbaren Statusbadge.

Sichtbare Zustände:

- Needs Details
- Needs Preview
- Warning
- Ready for Catalog
- Deprecated
- Rejected, ausschließlich im Import Review

Pro Karte erscheint nur ein primärer Status.

Weitere Findings werden als kompakte Anzahl angedeutet und im Detail erklärt.

## 6.4 Hover

Hover:

- hebt die Karte leicht von der Fläche ab;
- verstärkt ihre Begrenzung;
- lässt die Preview minimal näher wirken;
- blendet höchstens zwei Quick Actions ein;
- verändert niemals Kartenabmessung oder Grid-Position.

Quick Actions:

- Open Details
- kontextuelle Hauptaktion, etwa „Choose Visual“

Alle Hover-Aktionen bleiben über Tastatur und Touch erreichbar.

## 6.5 Auswahl

Eine ausgewählte Karte erhält:

- klare innere Auswahlkontur;
- ruhige Flächenbetonung;
- sichtbares Auswahlzeichen;
- unveränderte Kartengröße.

Fokus und Auswahl sind unterscheidbar:

- Fokus zeigt Navigationsbereitschaft;
- Auswahl zeigt aktuelle Verwendung oder Mehrfachauswahl.

Beides wird nicht ausschließlich durch Farbe kommuniziert.

## 6.6 Mehrfachauswahl

Mehrfachauswahl startet durch:

- expliziten Select-Modus;
- Modifier-Taste;
- Auswahlbox in der Gallery.

Bei aktiver Mehrfachauswahl:

- zeigt jede Karte ein Auswahlzeichen;
- erscheint eine kontextuelle Action Bar oberhalb oder unterhalb der Gallery;
- bleibt die Such- und Filterkonfiguration sichtbar;
- wird der normale Detail Inspector durch eine Zusammenfassung ersetzt.

Die Action Bar zeigt:

- Anzahl der gewählten Elemente;
- erlaubte gemeinsame Aktionen;
- Clear Selection.

Batch Editing wird erst sichtbar, wenn der zugrunde liegende Produktvertrag es erlaubt.

## 6.7 Drag & Drop

### Externe Dateien in die Library

Beim Eintritt über die Library-Fläche:

- erhält die gesamte Gallery eine ruhige Drop-Überlagerung;
- die erwartete Destination wird benannt;
- der aktuelle Theme- oder Personal-Kontext bleibt sichtbar;
- einzelne Karten treten optisch zurück.

Nach dem Drop öffnet sich Import Review im Bottom Drawer oder als fokussierte Arbeitsfläche.

### Assets aus der Library in ein Studio

Der Drag-Ghost zeigt:

- Thumbnail;
- Namen;
- Assettyp;
- bei Mehrfachauswahl einen gestapelten Ghost und Anzahl.

Gültige Ziele reagieren bereits vor dem Drop:

- Slot oder Layer hebt sich hervor;
- das erwartete Ergebnis wird benannt;
- ungültige Ziele erklären kurz den Grund.

Ein Drop erzeugt nur eine visuelle Zuweisung oder Referenz. Er erzeugt keine Platzierung, Interaction oder Funktion.

## 6.8 Suche

Die Suchleiste ist 420–560 breit und bleibt prominent.

Sie enthält:

- Suchsymbol;
- Suchtext;
- Clear Action;
- optionalen Shortcut-Hinweis.

Die Ergebniszahl wird in der Nähe, aber nicht im Eingabefeld gezeigt.

Suche bleibt beim Öffnen und Schließen des Detail Inspectors erhalten.

## 6.9 Filter

Häufige Filter erscheinen als Chips:

- Category
- Scope
- Theme
- Status
- Format

Weitere Filter öffnen eine kompakte Filterfläche.

Aktive Filter:

- bleiben sichtbar;
- können einzeln entfernt werden;
- bieten Clear All;
- zeigen picker-imposed Constraints als gesperrte Chips.

Das Filterpanel überdeckt nicht dauerhaft die Gallery.

---

# 7. Room Shell Studio

## 7.1 Wirkung

Das Room Shell Studio fühlt sich wie ein Architektur- und Environment-Atelier an.

Die Shell erscheint als großer Raum, nicht als Diagramm.

## 7.2 Layout

- Studio Rail links
- Shell-/Layer-Kontextpanel
- großer zentraler 16:9-Canvas
- Inspector rechts
- optionaler Asset Shelf oder Findings Drawer unten

Canvas-Zielanteil:

- mit beiden Panels etwa 60–65 %;
- mit eingeklapptem Kontextpanel etwa 72–78 %;
- im Focus Mode fast die gesamte Arbeitsfläche.

## 7.3 Canvas

Der Canvas besitzt einen ruhigen neutralen Außenbereich.

Die Shell selbst:

- ist zentriert;
- erhält maximal sinnvolle Größe;
- zeigt keine dauerhaften technischen Labels;
- besitzt eine dezente äußere Begrenzung;
- kann gezoomt und verschoben werden.

Außerhalb der Shell können temporär liegen:

- Maßstabsreferenz;
- Preview Fixtures;
- Vergleichsvorschau;
- Hinweise.

## 7.4 Arbeitsmodi

Eine kompakte Toolbar über dem Canvas wechselt zwischen:

- Art
- Structure
- Responsive

### Art

Standardmodus.

Sichtbar:

- Architektur;
- Hintergrund;
- Materialien;
- Atmosphäre;
- ausgewählte visuelle Layer.

Hilfslinien erscheinen nur bei Auswahl oder direkter Manipulation.

### Structure

Sichtbar:

- Architecture Surfaces
- Placement Surfaces
- Placement Areas
- Layout Bounds
- Anchors
- Safe Areas
- semantische Layer-Bänder

Technische Strukturen verwenden halbtransparente Overlays und verständliche Namen. Die Kunst bleibt darunter erkennbar.

Keine Interaction- oder Function-Overlays erscheinen.

### Responsive

Der Artist kann wählen:

- einzelne Preview-Größe;
- zwei Größen nebeneinander;
- alle Kernprofile als Vergleich.

Der aktive Frame ist größer. Weitere Frames bleiben erkennbar, aber visuell sekundär.

## 7.5 Shell-Auswahl

Das linke Kontextpanel zeigt:

- große Shell-Thumbnails;
- Namen;
- Perspektivfamilie;
- Draft-/Ready-Zustand.

Die Shell-Auswahl ist keine Dateibaumstruktur.

## 7.6 Preview Fixtures

Neutrale Möbel oder Maßstabsfiguren können eingeblendet werden.

Sie sind:

- visuell entsättigt;
- leicht transparent;
- mit „Preview only“ markiert;
- nicht Teil der Layerliste des Themes;
- nicht exportierbar.

---

# 8. Object Studio

## 8.1 Wirkung

Das Object Studio wirkt wie ein fokussierter Produktfotografie- und Formarbeitsplatz.

Ein Objekt steht allein im Mittelpunkt.

## 8.2 Layout

Linkes Kontextpanel:

- Object Templates
- Layer
- Slots
- Related Assets/Skins

Mitte:

- Object Stage

Rechts:

- Inspector

Unten:

- Asset Shelf
- Variantenvergleich
- Timeline

## 8.3 Object Stage

Die Stage zeigt:

- Objekt auf neutralem Hintergrund;
- Referenzfläche oder Wand;
- Maßstabsreferenz;
- Pivot und Bounds nur bei Bedarf;
- optionale Licht-/Kontrastumschaltung für Inspektion.

Das Objekt darf den Großteil der verfügbaren Höhe einnehmen, ohne abgeschnitten zu werden.

## 8.4 Startmöglichkeiten

Leerer Object-Canvas zeigt drei große Startkarten:

- Use Visual Asset
- Start from Object Template
- Duplicate Existing Object

„Use Visual Asset“ ist die visuell primäre Route.

## 8.5 Arbeitsansichten

- Look
- Bounds
- Placement
- Variants

Diese Ansichten verändern die Overlays, nicht das Dokument.

### Look

Artwork, Material und sichtbare Layer.

### Bounds

Visual, Layout und Effect Bounds.

### Placement

Pivot, Kontaktflächen, erlaubte Ausrichtung, Anchors und neutrale Testflächen.

### Variants

Skins und visuelle Zustände nebeneinander.

Es gibt keine Function- oder Hitbox-Ansicht.

---

# 9. Looks Studio

## 9.1 Aufgabe

Das Looks Studio verbindet Templates mit visueller Gestaltung.

Es enthält:

- Skins
- Materialien
- Hintergründe
- visuelle Zustände
- Animation-Zuweisungen

## 9.2 Layout

Linkes Kontextpanel:

- Look Type
- Ziel-Template
- Slots
- Varianten
- Materialien

Canvas:

- große Zielvorschau;
- optionaler Vergleich;
- State Preview.

Inspector:

- aktuelle Slot-, Material- oder Varianteneigenschaften.

Bottom Drawer:

- Asset Picker
- Timeline
- Variant Comparison

## 9.3 Skin-Arbeit

Der Artist wählt zuerst ein Ziel-Template.

Danach zeigt der Canvas dessen verfügbare visuelle Slots direkt an der passenden Stelle.

Ein leerer Slot erscheint als:

- dezente Platzhalterfläche;
- verständlicher Slotname;
- „Choose Visual“;
- Hinweis, ob der Slot optional ist oder einen Fallback verwendet.

Slots wirken wie kreative Einsetzbereiche, nicht wie Formularzeilen.

## 9.4 Materialien

Materialien erscheinen als visuelle Swatch Cards.

Eine Materialkarte zeigt:

- Materialvorschau;
- Name;
- Materialfamilie;
- Verwendung im aktuellen Theme.

Die Bearbeitung erfolgt mit:

- neutraler Swatch Preview;
- Surface Preview;
- Target Preview.

Es gibt keinen Node Graph.

## 9.5 Hintergründe

Hintergründe verwenden eine breite Preview Card.

Sichtbar:

- Motiv;
- Crop/Fit-Zustand;
- Motion-Symbol;
- Poster-/Reduced-Motion-Vollständigkeit.

Hintergründe können direkt in Responsive Frames beurteilt werden.

## 9.6 Visuelle Zustände

Zustände erscheinen als horizontale Tabs oder kompakte Preview Cards:

- Default
- Hover
- Selected
- Disabled
- weitere vom Template bereitgestellte Zustände

Fehlende Varianten zeigen sichtbar:

- Uses Default
- Uses Core Overlay
- Uses Theme Fallback

Sie erscheinen nicht als leere Fehlerkarte.

---

# 10. Properties Panel

## 10.1 Grundstruktur

Der Inspector besitzt:

1. Selection Header
2. Primary Controls
3. kontextuelle Sections
4. Advanced Details

## 10.2 Selection Header

Höhe etwa 72–88.

Enthält:

- kleines Thumbnail oder Typicon;
- Namen;
- Elementtyp;
- einen primären Status;
- Overflow Menu.

Bei Auswahl eines Layers zeigt er zusätzlich den zugehörigen Parent-Kontext.

## 10.3 Standardmäßig sichtbare Sections

Je nach Auswahl:

- Appearance
- Transform oder Layout
- Material
- Placement
- Variant
- Motion
- Related

Es werden nur relevante Sections gezeigt.

Ein Background benötigt beispielsweise keine Object-Placement-Section.

## 10.4 Standardmäßig eingeklappte Sections

- Compatibility
- Performance
- Accessibility Details
- Version History
- Technical Facts
- IDs and References
- Export Details

Ein Blocker kann eine eingeklappte Section automatisch mit einem Finding markieren, öffnet sie aber nicht während aktiver Direktmanipulation.

## 10.5 Vererbte Eigenschaften

Vererbte Werte bleiben vollständig lesbar.

Darstellung:

- kleines Verknüpfungssymbol;
- Label „Uses Theme Default“ oder „Uses Parent Look“;
- Wert in normal lesbarer, aber zurückhaltender Darstellung;
- Quelle auf Hover/Fokus.

Der Wert sieht nicht disabled aus.

Wird er bearbeitet, entsteht sichtbar ein lokaler Override.

## 10.6 Overrides

Override-Darstellung:

- kleiner gefüllter Marker neben dem Label;
- subtile seitliche Section-Markierung;
- Text „Customized here“;
- Reset-to-Inherited-Aktion.

Keine Reihe großer Override-Badges.

Reset erscheint:

- bei Hover;
- bei Fokus;
- im Kontextmenü;
- dauerhaft, wenn ein Finding den Override betrifft.

## 10.7 Direkte Manipulation

Canvas und Inspector aktualisieren sich gemeinsam.

Während eines Drag:

- ändern sich Werte kontinuierlich;
- Eingabefelder bleiben stabil;
- die Section springt nicht;
- Findings erscheinen erst nach Abschluss, außer eine harte Grenze verhindert die Bewegung.

## 10.8 Mehrfachauswahl

Der Inspector zeigt:

- Anzahl der Elemente;
- gemeinsame Eigenschaften;
- Mixed Values;
- nur sichere gemeinsame Aktionen.

Uneinheitliche Werte werden als „Mixed“ angezeigt, nicht als leer.

---

# 11. Layer-System

## 11.1 Layer Row

Eine Layer Row ist etwa 40–44 hoch.

Sie enthält:

- Ausklappindikator bei Gruppen;
- Thumbnail, ungefähr 28–32;
- Layer-Type-Icon;
- Name;
- optionalen Motion-Indikator;
- Visibility;
- Solo;
- Lock.

Visibility, Solo und Lock erscheinen bei Hover oder Fokus. Aktive Zustände bleiben dauerhaft sichtbar.

## 11.2 Thumbnails

Thumbnails zeigen den tatsächlichen visuellen Inhalt.

Bei nichtbildlichen Elementen:

- Material-Swatch;
- Gradient Preview;
- Effect-Symbol;
- Group-Collage.

Technische Typicons ergänzen das Thumbnail, ersetzen es aber nicht unnötig.

## 11.3 Gruppierung

Layer werden zuerst nach semantischen Bands gruppiert:

- Background
- Rear Architecture
- Behind Objects
- Objects
- In Front
- Atmosphere
- Foreground
- Labels, wenn unterstützt

Bands sind klar getrennte Abschnitte, keine normalen Layer.

Gruppen innerhalb eines Bands können vom Artist benannt werden.

## 11.4 Drag

Während eines Layer-Drags:

- bleibt eine kompakte Ghost Row sichtbar;
- zeigt eine Insert Line die genaue Position;
- hebt sich der gültige Ziel-Band hervor;
- bleiben ungültige Bands zurückhaltend;
- erklärt ein kurzer Hinweis unzulässige Ziele.

Beim Loslassen in einem ungültigen Bereich kehrt der Layer ruhig an seine Position zurück.

## 11.5 Locks

Lock verhindert direkte Veränderungen.

Ein gelockter Layer:

- bleibt auswählbar;
- bleibt inspizierbar;
- zeigt ein dauerhaftes Lock-Symbol;
- wirkt nicht deaktiviert oder unsichtbar.

## 11.6 Solo

Solo isoliert den Layer oder die Gruppe visuell.

Während Solo aktiv ist:

- erscheint ein klarer Hinweis über dem Canvas;
- andere Layer werden verborgen oder stark zurückgenommen;
- Export und Showcase verwenden weiterhin die normale vollständige Komposition.

## 11.7 Animationen in der Layerliste

Ein Motion-Indikator zeigt:

- Animation vorhanden;
- Animation im aktuellen Zustand aktiv;
- Reduced-Motion-Ersatz vorhanden oder fehlend.

Keyframes und Tracks erscheinen ausschließlich in der Timeline.

Ein Klick auf den Motion-Indikator öffnet die Timeline und fokussiert den passenden Track.

---

# 12. Showcase

## 12.1 Grundwirkung

Showcase ist die Premiere des Themes.

Es soll sich emotional, ruhig und hochwertig anfühlen. Der Künstler betrachtet seine Welt, statt sie zu konfigurieren.

Die Builder-Oberfläche tritt weitgehend zurück.

## 12.2 Layout

- Preview nimmt etwa 86–92 % der sichtbaren Fläche ein;
- keine permanente linke Sidebar;
- kein permanenter Inspector;
- Top Bar reduziert sich auf Theme, Preview-Kontext und Exit;
- Preview-Steuerung liegt als kompakte schwebende Leiste am unteren Rand.

Nach kurzer Inaktivität treten nicht notwendige Controls zurück. Sie erscheinen bei Pointerbewegung, Tastaturfokus oder Touch erneut.

## 12.3 Showcase Switcher

Der zentrale Switcher bietet:

- Cosmos
- Base
- Room
- Object
- Responsive

Er erscheint als zusammenhängende Segmentsteuerung.

Beim Wechsel:

- bleibt das Theme visuell präsent;
- wechselt die Kamera beziehungsweise Bühne;
- erscheint kein harter weißer oder leerer Zwischenzustand;
- bleibt der zuletzt verwendete Unterkontext erhalten.

## 12.4 Cosmos

Zeigt:

- Cosmos-Hintergrund
- Nodes und Connections
- Theme-relevante Map Looks
- Companion-/Base-Entry-Präsentation, wenn vorhanden

Die Szene wirkt weit und offen.

## 12.5 Base

Zeigt:

- ausgewählte Room Shell;
- neutrale Preview Fixtures;
- Materialien;
- Hintergrund;
- Atmosphäre.

Keine Funktion wird simuliert.

## 12.6 Room

Bietet eine fokussierte Environment-Präsentation verschiedener Shells.

Der Artist wechselt über kleine visuelle Room-Thumbnails.

## 12.7 Object

Zeigt:

- Hero Object;
- Object Gallery;
- Varianten;
- Material- und State-Wechsel;
- neutrale Podest- oder Surface-Präsentation.

## 12.8 Responsive

Zeigt:

- Referenz
- Narrow
- Wide
- Ultrawide

Mögliche Darstellung:

- ein großer aktiver Frame plus kleinere Vergleichsframes;
- oder mehrere gleichwertige Frames.

Die Auswahl zwischen beiden Ansichten bleibt im Responsive-Bereich.

## 12.9 Vergleich

„Compare Core Default“ bietet:

- Split View;
- Press-and-Hold;
- Side-by-Side bei breiten Viewports.

Der Vergleich verändert keine Theme-Daten.

## 12.10 Emotionalität

Showcase darf atmosphärischer wirken als die Studios.

Erlaubt:

- mehr Tiefe;
- sanfte Raumbewegung;
- kontrollierte Übergänge;
- Theme-Audio später nur nach expliziter Aktivierung;
- volle Darstellung der Theme-Atmosphäre.

Nicht erlaubt:

- automatische laute Wiedergabe;
- unkontrollierte Loop-Flut;
- sichtbare technische Overlays;
- Validierungslisten über der Welt.

Ein kompakter Health-Indikator darf auf Probleme hinweisen und öffnet bei Bedarf die Findings.

---

# 13. Release Studio

## 13.1 Wirkung

Release ist eine kuratierte Abschlussgalerie, kein Administrationsformular.

Der Artist soll das Gefühl haben, eine Ausstellung oder ein Art Pack fertigzustellen.

## 13.2 Layout

Obere Hauptreihe:

- große Pack Preview links, etwa 60–65 %;
- Release Summary rechts, etwa 35–40 %.

Darunter:

- Included Content als visuelle Shelves;
- Rights & Attribution;
- Compatibility;
- Performance;
- Validation;
- Release Notes.

Am unteren Rand bleibt die primäre Exportaktion sichtbar.

## 13.3 Release Summary

Zeigt:

- Pack Name
- Cover
- Version
- Pack Type
- Zielumfang
- Health
- Gesamtgröße als verständliche Einordnung
- primäre Exportaktion

Keine vollständige Manifesttabelle.

## 13.4 Included Content

Inhalt wird als visuelle Gruppen dargestellt:

- Room Shells
- Object Templates
- Skins
- Materials
- Backgrounds
- Animations
- Assets

Jede Gruppe zeigt:

- Collage;
- Anzahl;
- Blocker oder Warnung;
- Open Section.

## 13.5 Findings

Findings sind gruppiert als:

- Must Fix
- Needs Attention
- Recommendations
- Uses Fallback

Jeder Eintrag besitzt:

- verständlichen Titel;
- Konsequenz;
- betroffenen Inhalt;
- „Go to“;
- optional sichere Fix-Aktion.

Technische Codes befinden sich in Details.

## 13.6 Export

Die letzte Bestätigung zeigt:

- Pack Cover
- Name und Version
- enthaltene Bereiche
- offene nicht-blockierende Warnungen
- Ziel des Exports

Export und Aktivierung sind getrennt.

---

# 14. Builder-Animationen und Übergänge

## 14.1 Grundprinzip

Builder-Motion vermittelt Kontinuität.

Sie soll:

- räumliche Herkunft erklären;
- Fokus unterstützen;
- Veränderungen nachvollziehbar machen;
- niemals Aufmerksamkeit um ihrer selbst willen beanspruchen.

Keine federnden oder spielerisch übertriebenen Standardübergänge.

## 14.2 Hover

Hover:

- erhöht visuelle Präsenz leicht;
- verstärkt Begrenzung oder Oberfläche;
- blendet kontextuelle Aktionen ein;
- bewegt keine benachbarten Elemente.

## 14.3 Auswahl

Eine Auswahl erscheint ruhig und unmittelbar.

Bei Auswahl über einen anderen Kontext:

- wird das Element kurz lokalisiert;
- öffnet sich der Inspector mit bestehender Struktur;
- scrollt die Layerliste nur so weit wie nötig.

Kein dauerhaftes Pulsieren.

## 14.4 Drag

Beim Drag:

- löst sich das Element sichtbar von seiner Quelle;
- bleibt die Quelle als Platzhalter erhalten;
- reagiert das Ziel vor dem Drop;
- zeigt der Ghost das erwartete Objekt;
- führt ein erfolgreicher Drop in die neue Darstellung über.

Ungültige Drops verwenden keine aggressive Shake-Animation.

## 14.5 Panel-Wechsel

Panels wechseln mit räumlicher Kontinuität:

- Inspector-Inhalte wechseln innerhalb des bestehenden Rahmens;
- linke Unterbereiche gleiten aus der Studio Rail hervor;
- Detailansichten ersetzen ihren Ursprung nachvollziehbar;
- Back führt visuell zum vorherigen Kontext zurück.

## 14.6 Bottom Drawer

Der Drawer steigt aus dem unteren Rand auf.

Der Canvas:

- verkleinert sich auf großen Flächen;
- bleibt an derselben Auswahl zentriert;
- verliert weder Zoom noch Kameraposition.

Beim Schließen gewinnt der Canvas seinen Raum zurück, ohne zu springen.

## 14.7 Zoom

Zoom:

- zentriert sich auf Pointer oder Auswahl;
- erhält den visuellen Fokus;
- lässt Overlays in verständlicher Größe;
- zeigt bei starkem Zoom eine Orientierungsmöglichkeit.

Fit und 100 % sind jederzeit erreichbar.

## 14.8 Studio-Wechsel

Beim Studio-Wechsel:

- bleibt das aktuelle Artefakt im Breadcrumb sichtbar;
- wird ein verwandtes Ziel nach Möglichkeit weiterverfolgt;
- verwendet der Wechsel eine kurze ruhige Überblendung;
- werden keine leeren Ladeflächen gezeigt.

## 14.9 Reduced Motion

Reduced Motion ersetzt räumliche Bewegungen durch:

- direkte Zustandswechsel;
- kurze Überblendungen;
- statische Hervorhebungen.

Die Informationshierarchie bleibt identisch.

---

# 15. Leere Zustände

## 15.1 Grundregel

Ein leerer Zustand zeigt immer:

1. eine inspirierende visuelle Andeutung;
2. eine klare Erklärung;
3. eine primäre kreative Aktion;
4. höchstens eine sekundäre Alternative.

Keine leere Tabelle. Kein technischer Platzhalter. Kein „No data“.

## 15.2 Leeres Theme

Das Theme Board zeigt:

- Core-Fallback-Hero;
- sanfte leere kreative Slots;
- drei Startpunkte:
  - Import Artwork
    - Create Room Shell
      - Create First Look

      Coverage zeigt „Uses Core Fallback“, nicht Fehler.

      ## 15.3 Leere Library

      Die Gallery zeigt eine große ruhige Drop-Zone:

      - abstrakte Asset-Silhouetten;
      - „Bring your artwork into Cosmos“;
      - Import Assets;
      - Browse Core Assets als sekundäre Aktion.

      Die Library Navigation bleibt sichtbar.

      ## 15.4 Keine Assets im aktuellen Theme

      Zeigt:

      - einige vorhandene Personal/Core Assets als Inspiration;
      - Add Existing Asset;
      - Import New Artwork.

      Assets werden nicht automatisch dem Theme hinzugefügt.

      ## 15.5 Leerer Canvas

      Der Canvas zeigt kontextabhängige Startmöglichkeiten.

      Room Shell:

      - Starter-Silhouetten verschiedener Perspektiven.

      Object Studio:

      - Drop Visual Asset;
      - Choose from Library;
      - Start from Template.

      Looks Studio:

      - Ziel-Template mit leeren visuellen Slots;
      - Create First Look.

      ## 15.6 Keine Looks

      Das Ziel-Template erscheint mit Core-Fallback.

      Daneben:

      - Create Skin;
      - Apply Material;
      - Choose Background, falls passend.

      Der Core-Look wird klar als Fallback und nicht als eigener Theme-Inhalt bezeichnet.

      ## 15.7 Keine Room Shells

      Zeigt eine kleine Starter Gallery:

      - Illustrated Fixed
      - Orthographic
      - Perspective
      - Duplicate Existing

      Jede Karte verwendet eine neutrale räumliche Miniatur und eine kurze verständliche Beschreibung.

      ## 15.8 Keine Suchergebnisse

      Zeigt:

      - aktive Suche;
      - wichtige Filter;
      - Clear Filters;
      - optionalen Link zu passenden Drafts.

      Die Suche wird nicht automatisch erweitert.

      ## 15.9 Fehlerzustände

      Wenn nur ein Teil betroffen ist:

      - bleibt der übrige Inhalt sichtbar;
      - erhält der betroffene Bereich eine Erklärung;
      - bleiben Nutzereingaben erhalten.

      Ein vollständiger Error Screen wird nur verwendet, wenn die gesamte Arbeitsfläche nicht hergestellt werden kann.

      ---

      # 16. Erstbenutzung

      ## 16.1 Start

      Der Artist sieht eine Theme-Galerie:

      - Continue
      - New Theme
      - Import Theme Pack
      - Duplicate Theme

      „New Theme“ ist visuell primär.

      ## 16.2 Theme erstellen

      Der Artist wählt:

      - Starter Theme
      - Empty Theme
      - Extend Existing Theme
      - Asset/Look Pack

      Danach:

      - Theme-Name;
      - kurze kreative Absicht;
      - optionales Moodbild;
      - gewünschter Umfang.

      Keine IDs oder Versionsfragen.

      ## 16.3 Theme Board kennenlernen

      Das neue Theme öffnet auf dem Theme Board.

      Eine zurückhaltende First-Use-Leiste zeigt:

      1. Add Artwork
      2. Build a Shell or Object
      3. Create a Look
      4. Preview
      5. Export

      Diese Leiste ist:

      - nicht modal;
      - überspringbar;
      - ausblendbar;
      - kein erzwungener Wizard.

      ## 16.4 Erstes Asset importieren

      Der Artist zieht Artwork auf das Theme Board oder öffnet Import Assets.

      Import Review:

      - zeigt große Previews;
      - trennt akzeptierte und problematische Dateien;
      - erkennt technische Fakten automatisch;
      - fragt nur nach kreativem Kontext und Herkunft;
      - erlaubt Fortsetzen mit gültigen Dateien.

      Nach Abschluss landet das Asset in Drafts oder Current Theme.

      ## 16.5 Erstes Object Template

      Der Artist wählt ein Asset und „Create reusable object“.

      Object Studio öffnet:

      - das Artwork bereits auf der Stage;
      - verständliche Schritte für Scale, Pivot und Placement;
      - einen automatisch fokussierten Default Look;
      - neutrale Testflächen.

      Es entsteht visuell erkennbar:

      - ein Object Template;
      - ein Default Skin;
      - eine Verbindung zum Visual Asset.

      Keine Funktion wird abgeleitet.

      ## 16.6 Erste Room Shell

      Der Artist wählt eine Perspektivgrundlage.

      Im Art Mode gestaltet er:

      - Architektur;
      - Hintergrund;
      - Oberflächen.

      Im Structure Mode prüft er:

      - Flächen;
      - Bounds;
      - Placement-Bereiche;
      - Responsive-Verhalten.

      Preview Fixtures helfen bei Maßstab und Lesbarkeit.

      ## 16.7 Erster Look

      Im Looks Studio:

      - wählt der Artist das Ziel-Template;
      - zieht Assets auf Slots;
      - weist Materialien zu;
      - betrachtet Default und weitere visuelle Zustände;
      - sieht Fallbacks.

      ## 16.8 Erste Animation

      „Animate“ öffnet die Timeline.

      Der Artist:

      - wählt eine visuelle Eigenschaft;
      - erstellt eine kurze Bewegung;
      - prüft Loop oder State-Zuweisung;
      - definiert Reduced-Motion-Verhalten;
      - spielt die Preview explizit ab.

      ## 16.9 Showcase

      Der Artist öffnet Showcase.

      Er wechselt durch:

      - Cosmos
      - Base
      - Room
      - Object
      - Responsive

      Die Welt steht im Mittelpunkt. Builder-Chrome tritt zurück.

      ## 16.10 Theme Check

      Theme Check zeigt:

      - Blocker;
      - Warnungen;
      - Fallbacks;
      - Empfehlungen.

      „Go to“ führt direkt zur betroffenen Stelle und erhält Showcase- oder Studio-Kontext.

      ## 16.11 Release

      Release zeigt das Theme als fertiges Pack.

      Der Artist ergänzt:

      - Cover;
      - Pack-Name;
      - Version;
      - Release Notes;
      - Rechte und Attribution.

      Nach bestandenem Release Check exportiert er das Theme Pack.

      Der Builder bleibt geöffnet und der Draft bleibt erhalten.

      ---

      # 17. Design-System

      ## 17.1 Neutralität

      Die Builder-Hülle bleibt neutral.

      Das bearbeitete Theme darf:

      - farbintensiv;
      - atmosphärisch;
      - hell oder dunkel;
      - stark texturiert sein.

      Diese Eigenschaften dürfen nicht auf die Builder-Chrome übergreifen.

      Auswahl, Fokus und Findings müssen unabhängig vom Theme lesbar bleiben.

      ## 17.2 Spacing System

      Grundraster:

      - 4 für Mikroabstände;
      - 8 für eng zusammengehörige Elemente;
      - 12 für Controls;
      - 16 für normale Komponenteninnenräume;
      - 24 für Section-Abstände;
      - 32 für größere Flächen;
      - 48 und 64 für Theme-Board- und Empty-State-Kompositionen.

      Unregelmäßige Zwischenwerte werden vermieden.

      ## 17.3 Rundungen

      Hierarchie:

      | Element | Rundung |
      |---|---|
      | kompakte Inputs und Buttons | 8 |
      | Cards und Inspector Sections | 12 |
      | Panels und Drawer | 14–16 |
      | Hero Preview und große Bühnen | 18–22 |
      | Chips und Status | vollständig gerundet |

      Nicht jede innere Section erhält einen eigenen abgerundeten Container.

      ## 17.4 Cards

      Cards besitzen:

      - klare ruhige Außenform;
      - dominante Preview;
      - eine begrenzende Linie oder Flächendifferenz;
      - sehr zurückhaltende Tiefe;
      - keine mehrfach verschachtelten Card-Rahmen.

      Karten innerhalb einer Reihe verwenden einheitliche Höhe.

      ## 17.5 Panel-Hierarchie

      Visuelle Ebenen:

      1. Environment oder Arbeitsflächenhintergrund
      2. Canvas
      3. stationäre Sidebars
      4. Inspector und Bottom Drawer
      5. Popover, Picker und Dialog
      6. Drag Ghost, Tooltip und Fokusindikator

      Auf einer Ansicht sollten nicht mehr als drei deutlich wahrnehmbare Tiefenebenen gleichzeitig konkurrieren.

      ## 17.6 Schatten

      Schatten kommunizieren Hierarchie, nicht Dekoration.

      - stationäre Panels: kaum oder kein sichtbarer Schatten;
      - Cards: sehr geringe Abhebung;
      - Inspector/Drawer: klare, aber weiche Trennung;
      - Popover/Dialog: stärkste Abhebung;
      - Drag Ghost: klar schwebend.

      ## 17.7 Transparenz und Glas

      Glas-Effekte werden sparsam eingesetzt.

      Geeignet:

      - Top Bar;
      - schwebende Showcase Controls;
      - Popover;
      - Inspector über stark visueller Stage;
      - Dialoge.

      Nicht geeignet:

      - jede Asset Card;
      - jede Inspector Section;
      - Layer Rows;
      - Textflächen;
      - mehrere übereinanderliegende transparente Panels.

      Textflächen müssen ausreichend ruhig und deckend bleiben.

      Es dürfen nicht mehr als zwei Glasflächen sichtbar übereinander liegen.

      ## 17.8 Borders

      Borders sind fein und sekundär.

      Sie trennen:

      - Panel von Canvas;
      - Card von Gallery;
      - Section-Gruppen;
      - aktive Auswahl.

      Borders dürfen nicht das gesamte Interface in Kästchen zerlegen.

      ## 17.9 Typografie

      Empfohlene Hierarchie:

      | Ebene | Verwendung |
      |---|---|
      | Display, 32–40 | Theme-Name und große Empty-State-Aussage |
      | Title, 24–28 | Studio oder Hauptansicht |
      | Section Title, 17–20 | große Theme-Board-Bereiche |
      | Component Title, 14–16 | Karten, Inspector Sections |
      | Body, 14–15 | Beschreibungen und Werte |
      | Label, 12–13 | Feldnamen und Metadaten |
      | Micro, 11–12 | technische Ergänzungen und Hilfstexte |

      Titel sind ruhig und klar. Dauerhafte Versalien werden nur für sehr kurze Kategorien oder Eyebrows verwendet.

      Metadaten sind kleiner, aber nicht kontrastarm bis zur Unlesbarkeit.

      ## 17.10 Icons

      Icons verwenden eine konsistente klare Formensprache.

      Größen:

      - 16 für Inline-Aktionen;
      - 20 für Standardcontrols;
      - 24 für Studio Rail;
      - größer nur in Empty States und Create Cards.

      Icons besitzen immer Text oder Tooltip, wenn ihre Bedeutung nicht universell ist.

      ## 17.11 Focus

      Jedes interaktive Element besitzt einen klaren sichtbaren Fokus.

      Fokus:

      - wird nicht von Border oder Auswahl verschluckt;
      - bleibt auch auf starkem Theme-Artwork sichtbar;
      - ist niemals nur eine leichte Farbverschiebung.

      ---

      # 18. Verbindliche Interaktionsprinzipien

      ## 18.1 Canvas First

      Wenn Raum knapp wird, wird zuerst ein sekundäres Panel reduziert, niemals der Canvas unter seine produktive Mindestgröße gedrückt.

      ## 18.2 Automatisches Verschwinden

      Panels dürfen automatisch verschwinden:

      - beim Eintritt in Showcase;
      - beim Aktivieren von Focus Mode;
      - auf schmalen Layouts, wenn sonst der Canvas unbrauchbar würde;
      - nach erfolgreicher Auswahl aus einem temporären Asset Picker;
      - wenn ein Kontextpanel im aktuellen Studio keinen Inhalt besitzt.

      Panels dürfen nicht automatisch verschwinden:

      - während Texteingabe;
      - während Metadatenbearbeitung;
      - während eines Drag;
      - während Findings gelesen werden;
      - wenn dadurch die aktuelle Auswahl unklar würde.

      ## 18.3 Inspector-Verhalten

      Der Inspector bleibt offen, wenn:

      - zwischen Layern desselben Artefakts gewechselt wird;
      - ein Wert direkt auf dem Canvas verändert wird;
      - zwischen visuellen Zuständen gewechselt wird.

      Er darf einklappen, wenn:

      - Showcase beginnt;
      - die Library als Fullscreen Picker geöffnet wird;
      - Focus Mode aktiviert wird;
      - die Breite den Canvas gefährdet.

      ## 18.4 Bottom Drawer

      Der Drawer öffnet sich nur durch:

      - bewusste Aktion;
      - Auswahl eines Motion-Indikators;
      - Import Review;
      - „Show Findings“;
      - kontextuelle Asset-Auswahl.

      Er öffnet sich nicht allein aufgrund einer Warnung.

      ## 18.5 Drag & Drop

      Jeder Drag muss vor dem Drop vermitteln:

      - Was wird bewegt?
      - Wohin kann es?
      - Was wird nach dem Drop entstehen?
      - Warum ist ein Ziel ungültig?

      Ein Drop darf keine unerwartete zweite Aktion ausführen.

      Insbesondere:

      - Asset Drop veröffentlicht nicht;
      - Asset Drop aktiviert kein Theme;
      - Asset Drop erstellt keine Funktion;
      - Skin Drop verändert kein Template;
      - Preview-Fixture-Drop erstellt keinen Room.

      ## 18.6 Kontextwechsel

      Beim Wechsel zwischen Studios werden pro Studio bewahrt:

      - Auswahl;
      - Canvas-Kamera;
      - Zoom;
      - Scrollposition;
      - Filter;
      - geöffneter Drawer;
      - Inspector-Zustand.

      Breadcrumb und Studio Rail machen den Wechsel jederzeit nachvollziehbar.

      ## 18.7 Dauerhaft sichtbare Informationen

      Immer sichtbar:

      - aktuelles Theme;
      - aktuelles Studio;
      - aktuelles Artefakt, wenn eines geöffnet ist;
      - Save-Status;
      - aktives Preview-Profil;
      - Exportblocker als kompakter Zustand;
      - aktueller Library Scope in Library-Kontexten.

      Nicht dauerhaft sichtbar:

      - technische IDs;
      - vollständige Finding-Listen;
      - Versionshistorie;
      - Performance-Details;
      - Rechte-Details außerhalb Import und Release.

      ## 18.8 Eine primäre Aktion

      Jede fokussierte Fläche besitzt höchstens eine visuell dominante Hauptaktion.

      Beispiele:

      - Import Assets
      - Choose Visual
      - Create Look
      - Open Showcase
      - Export Theme Pack

      Weitere Aktionen bleiben sekundär.

      ## 18.9 Progressive Disclosure

      Anfänger sehen:

      - Preview
      - Namen
      - kreative Auswahl
      - direkte Manipulation
      - klare nächste Aktion

      Fortgeschrittene Artists erreichen:

      - Bounds
      - Placement Details
      - Variants
      - Motion
      - Compatibility
      - Performance
      - Versionsdetails

      Beide arbeiten im selben Tool, ohne getrennten Expert Editor.

      ---

      # 19. Erweiterbarkeit

      Neue Features müssen in die bestehende visuelle Grammatik passen.

      Ein neues Artefakt verwendet nach Möglichkeit:

      - vorhandene Gallery Cards;
      - vorhandenen Canvas;
      - vorhandenen Inspector;
      - vorhandene Layer Rows;
      - vorhandenen Drawer;
      - vorhandene Showcase Frames;
      - vorhandene Release Sections.

      Ein neues permanentes Panel ist nur zulässig, wenn seine Aufgabe nicht kontextuell gelöst werden kann.

      Neue Studios werden nur angelegt, wenn:

      - ein vollständig eigener kreativer Workflow entsteht;
      - dieser nicht als Modus eines bestehenden Studios verständlich ist;
      - ein eigener Canvas-Kontext notwendig wird.

      Spätere mögliche Erweiterungen:

      - Audio
      - Particles
      - advanced Motion
      - collaborative review
      - marketplace publishing
      - user Collections
      - generation workflows

      Sie dürfen die Studio Rail erweitern oder als Unterbereich erscheinen, aber nicht die Grundstruktur ersetzen.

      ---

      # 20. Erforderliche Mockup-Zustände

      Aus dieser Spezifikation sollten mindestens folgende Mockups entstehen können:

      1. Theme Board – bestehendes Theme
      2. Theme Board – neues leeres Theme
      3. Asset Library – Gallery
      4. Asset Library – Detail Inspector
      5. Asset Library – Mehrfachauswahl
      6. Asset Import Review
      7. Room Shell Studio – Art Mode
      8. Room Shell Studio – Structure Mode
      9. Room Shell Studio – Responsive Mode
      10. Object Studio – Asset-first Start
      11. Object Studio – Bounds/Placement
      12. Looks Studio – Skin Slots
      13. Looks Studio – Material Editing
      14. Timeline Drawer
      15. Properties – inherited values
      16. Properties – local Overrides
      17. Layer Panel – Drag und Gruppen
      18. Showcase – Cosmos
      19. Showcase – Base/Room
      20. Showcase – Object
      21. Showcase – Responsive
      22. Theme Check
      23. Release Studio
      24. Export Confirmation
      25. zentrale Empty States
      26. Narrow Creative Layout
      27. Canvas Focus Mode

      ---

      # 21. Abnahmekriterien der Visual Experience

      Die Visual Specification ist erfolgreich umgesetzt, wenn:

      - der Canvas in jedem Studio visuell dominiert;
      - ein Artist innerhalb weniger Sekunden erkennt, was er gestaltet;
      - Asset, Template und Skin visuell unterscheidbar bleiben;
      - keine Oberfläche Function-, Interaction- oder Runtime-Arbeit suggeriert;
      - technische Details erreichbar, aber nicht aufdringlich sind;
      - Showcase sich emotional wie die Premiere des Themes anfühlt;
      - Core-Fallbacks nicht wie Fehler aussehen;
      - Empty States zum Beginnen einladen;
      - Panels kontextuell zurücktreten;
      - neue Artefakttypen ohne neue Grundnavigation ergänzt werden können;
      - die Builder-Hülle unabhängig vom bearbeiteten Theme lesbar bleibt;
      - ein vollständiger Theme-Workflow ohne JSON-, Schema- oder Registry-Kenntnis möglich ist.

      ---

      # 22. Guiding Statement

      Der Theme Builder zeigt dem Künstler immer zuerst die Welt, dann das Werkstück und erst zuletzt dessen technische Details.

      Er fühlt sich nicht an wie ein System, das Theme-Daten verwaltet.

      Er fühlt sich an wie der Ort, an dem neue Welten entstehen.

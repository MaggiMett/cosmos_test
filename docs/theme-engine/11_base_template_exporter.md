# Base Template Exporter

Status: implementiert für `base.main-room.v1`
Scope: Design-Template-Export, keine Runtime-Migration

Hinweis: Dieses Dokument beschreibt den technischen Base-Vertical-Slice. Der
offizielle Exportvertrag wurde in
`docs/theme-engine/12_art_pack_exporter.md` um einen Artist-Export erweitert.

Nach der Architekturentscheidung in
`docs/theme-engine/13_room_composition_system.md` bleibt dieser Base-Export ein
Kompatibilitäts- und Migrationsartefakt. Neue Art Packs werden getrennt für Room
Shells und Catalog Objects erzeugt. Ein Room Preset exportiert nur Referenzen
und optional eine nicht autoritative Gesamtvorschau.

## Architektur

Der Exporter liegt bewusst außerhalb des Browser-Bundles unter
`frontend/scripts/theme-art-exporter.ts`. Er ist ein wiederverwendbares,
Node-seitiges Modul und konsumiert ausschließlich bestehende Theme-Engine-Verträge:

- ein validiertes `EnvironmentTemplate`,
- die passende validierte `Composition`,
- stabile `RuntimeFunctionBinding`-Einträge,
- ein explizites Zielverzeichnis,
- optionale deterministische Formatoptionen.

Die öffentliche Funktion lautet:

```ts
exportEnvironmentArtPack({
  template,
  composition,
  functionBindings,
  outputDirectory,
  formatOptions,
})
```

Die zusätzlichen Eingaben `composition` und `functionBindings` sind gegenüber der
ursprünglichen API-Skizze notwendig: Visual-, Interaction-, Layout-, Effect- und
Label-Bounds sowie die stabilen Funktionsbindungen liegen nicht vollständig im
Environment Template selbst.

## Exportfluss

1. JSON-Schema-Validierung von Template und Composition.
2. Vollständigkeitsprüfung aller kanonischen Base-Slots, Flächenkonturen,
   Funktionsobjekte, Bounds, Anchors und Function Bindings.
3. Aufbau eines normalisierten, nur lesbaren Exportmodells.
4. Aufbau technischer Vektordokumente aus denselben Template- und Scene-Daten.
5. Byte-stabile Serialisierung der kanonischen Clean-SVG.
6. Deterministisches Rasterisieren der technischen Dokumente in PNG.
7. Sortierte JSON-Spec und stabiler Markdown-Brief.
8. Schreiben der acht technischen Dateien und der vier ergänzenden
   Artist-Dateien in deterministische Zielpfade.

Der Export verändert weder Template, Composition noch Runtime-Bindings.

## Erzeugte Dateien

Standardziel: `frontend/theme-art-packs/base.main-room.v1/`

| Datei | Inhalt |
|---|---|
| `base-template-clean.svg` | Kanonische neutrale Canvas-, Slot- und Zonenkonturen mit stabilen IDs |
| `base-template-clean.png` | Rasterversion derselben technischen Vorlage |
| `base-template-zones.png` | Alle acht Flächenslots, fünf Asset-Funktionsobjekte und `base-exit` |
| `base-template-hitboxes.png` | Getrennte Visual Bounds und Interaction Bounds mit Rolle |
| `base-template-safe-areas.png` | Visual, Layout, Effect, Label, Anchors und kritische Safe Areas |
| `base-template-depth.png` | Layer-Bands und lokale Objektreihenfolge mit Legende |
| `base-template-spec.json` | Maschinenlesbarer Gesamtvertrag des Art Packs |
| `base-template-brief.md` | Kurzanleitung und Beispielauftrag für Artists/Bildgeneratoren |

## IDs und Farblegende

IDs werden nicht aus sichtbaren Labels abgeleitet. Verwendet werden die stabilen
Vertrags-IDs:

- Slots: `base.slot.*`
- Flächen: `base.surface.*`
- Funktionszonen: `base.zone.*`
- Scene Nodes: `core.scene.base.*`
- Anchors: `<zone-id>.visual`, `.interaction`, `.label`

Die technische Palette ist neutral und nicht Teil eines Cosmos-Themes:

- Blau: Visual Bounds
- Rot: Interaction Bounds
- Orange: Layout Bounds
- Violett: Effect Bounds und erlaubter visueller Overflow
- Grün: Label Bounds
- Schwarz: Anchors und technische Konturen
- Cyan: Safe Area
- Pink/Rot: kritische, funktional unveränderliche Safe Area

Die Zonen- und Depth-Farben sind reine Diagnosefarben. Sie sind keine Skin Tokens
und dürfen nicht als Theme-Art übernommen werden.

## Deterministische Regeln

- Feste Canvasgröße `1600 × 900`.
- Feste Dateinamen und feste Dateireihenfolge.
- Keine Zeitstempel; `generatedAt` ist absichtlich `null`.
- Rekursiv sortierte JSON-Objektschlüssel und LF-Zeilenenden.
- Stabile Array-Reihenfolgen nach ID beziehungsweise Layer-Minimum.
- Stabile SVG-Element-, Attribut- und Zahlenformatierung.
- SHA-256-Fingerprint über Template, Composition und Function Bindings.
- Interner RGBA-/PNG-Encoder mit festem Filter und konfigurierbarer,
  validierter Deflate-Stufe.
- Keine Fonts, Browser-Renderer, Grafikprogramme oder Netzwerkressourcen als
  Exportabhängigkeit.

Die PNG-Kompression ist innerhalb derselben Node-/zlib-Laufzeit deterministisch.
PNG-Bytes zwischen unterschiedlichen zlib-Versionen sind nicht als
plattformübergreifender Vertrag definiert; Pixelinhalt und Canvas bleiben gleich.

## Nutzung mit ChatGPT oder Bildgeneratoren

Als Eingabepaket sollten mindestens Clean-SVG, Zones, Hitboxes, Safe Areas, Depth,
Spec und Brief gemeinsam übergeben werden. Der Bildauftrag beschreibt nur die
gewünschte Welt und Stimmung, zum Beispiel:

> Fantasy-Base im Inneren eines Elfenbaums mit zwei Türen und zwei Workspaces

Das generierte Motiv wird anschließend in Einzelassets für die im Brief und in der
Spec genannten `base.slot.*`-Slots zerlegt. Function Bindings, Anchors, Bounds,
Canvas und `base-exit` bleiben unverändert. Theme-Dateien dürfen ausschließlich
deklarative Bild-, Vektor- oder vorbereitete Videoassets referenzieren.

## Sicherheitsgrenzen

- Schemafehler werden nicht korrigiert, sondern verständlich abgelehnt.
- Fehlende Pflichtslots, Flächenkonturen, Funktionsobjekte, Bounds, Anchors oder
  Bindings brechen den Export ab.
- Das Modul lädt keine URLs und interpretiert keine ausführbaren Inhalte.
- Ausgabedateien haben fest codierte Namen; jede Zieldatei wird vor dem Schreiben
  erneut gegen das aufgelöste Zielverzeichnis geprüft.
- Das vom Aufrufer gewählte Zielverzeichnis ist die Schreibberechtigung. Der
  Exporter schreibt weder Geschwisterdateien noch abgeleitete Pfade außerhalb.

## Tests

`artPackExporter.test.ts` deckt ab:

- vollständigen Export und alle Pflichtdateien,
- Template-ID, Version, Canvas, Slots und Funktionsobjekte,
- getrennte Visual und Interaction Bounds,
- byte-stabile JSON- und SVG-Ausgabe,
- Fehler bei fehlendem Slot, Surface Bounds und Function Binding,
- Zielverzeichnis-Containment,
- unveränderte Runtime-Eingaben,
- PNG-Signatur und `1600 × 900`-IHDR,
- erfolgreichen CLI-Aufruf.

Die bestehenden Foundation-Tests prüfen zusätzlich Schema-Validierung,
Template-/Asset-Registries, MIME- und Pfadsicherheit, Fallbacks,
Override-Reihenfolge, Zyklen sowie frei skalierbare Interaction Bounds.

## Nutzung

Aus `frontend/`:

```sh
pnpm theme:export-base-template
```

Für ein abweichendes Ziel:

```sh
pnpm theme:export-base-template -- --output <directory>
```

## Bekannte Einschränkungen

- Der Exporter unterstützt in diesem Vertical Slice ausschließlich
  `base.main-room.v1`.
- Es werden technische Platzhalter, keine finale Theme-Art erzeugt.
- Der interne Rasterizer ist für technische Rechtecke, Ellipsen, Polygone,
  Linien und Bitmap-Labels ausgelegt, nicht für allgemeines SVG-Rendering.
- Es gibt noch keine Builder-UI, keine BaseView-Anbindung und keine Imports
  fertiger Art Packs.
- Node-, Connection-, Room- und Workspace-Templates werden nicht exportiert.

## Nächster Schritt

Diese Empfehlung ist durch Contract 1.1 ersetzt. Vor jeder
`BaseView.vue`-Anbindung wird `base.main-room.v1` in Room Shell, Room Preset,
Catalog Objects und Function Containers zerlegt. Erst die daraus erzeugten
separaten Art Packs erhalten neue Import-/Preview-Adapter.

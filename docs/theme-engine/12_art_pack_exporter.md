# Art Pack Exporter

Status: offizieller Exportvertrag, erste Implementierung für
`base.main-room.v1`

Architekturhinweis: `13_room_composition_system.md` macht den bestehenden
Base-Adapter zum Kompatibilitätsadapter. Die generische API bleibt richtig;
künftige produktive Adapter exportieren Room Shells und Catalog Objects
unabhängig. Zusammengesetzte Room-Preset-Previews dürfen niemals zur
autoritativen Asset- oder Template-Quelle werden.

## Zweck

Der Art Pack Exporter erzeugt aus einem kanonischen Theme-Engine-Template zwei
komplementäre Pakette:

1. Der Technical Export dokumentiert IDs, Bounds, Layer, Zustände,
   Funktionsbindungen und Sicherheitsgrenzen.
2. Der Artist Export liefert eine neutrale, unmittelbar bemalbare Vorlage,
   eine reine Vektorkontur, eine Binärmaske und einen allgemein verständlichen
   Prompt.

Damit kann dieselbe kanonische Geometrie von Theme-Engine-Entwicklung,
menschlichen Artists und bildgenerierenden Werkzeugen verwendet werden. Der
Export verändert keine Runtime-Daten und ist weder an einen Browser noch an
einen konkreten Renderer gebunden.

## Architektur

Der generische Einstieg lautet:

```ts
exportArtPack({
  template,
  composition,
  functionBindings,
  outputDirectory,
  formatOptions,
})
```

`ArtPackTemplateAdapter` trennt die öffentliche Export-API von
templatespezifischer Geometrie. Die Adapter-Registry entscheidet anhand von
`templateKind` und stabiler Template-ID, welcher Exporter zuständig ist. Aktuell
ist ausschließlich der Adapter für `base.main-room.v1` registriert.

`exportEnvironmentArtPack(...)` bleibt als kompatibler Einstieg bestehen und
delegiert an `exportArtPack(...)`. Bestehende Aufrufer erhalten dadurch keine
Breaking Change.

Die vorbereiteten Template-Familien sind:

- Base
- Rooms
- Workspaces
- Project Nodes
- Cluster Nodes
- Object Nodes
- Connections
- Companion
- Window Templates

Diese Liste ist ein Capability-Vertrag, keine vorgetäuschte Implementierung.
Nicht registrierte Templates werden mit `unsupported_template` verständlich
abgelehnt.

## Exportablauf

1. Passenden Template-Adapter deterministisch auswählen.
2. Template und Composition gegen die vorhandenen JSON-Schemas validieren.
3. Slots, Surface-Geometrie, Scene Nodes, Bounds, Anchors und Function Bindings
   vollständig prüfen.
4. Ein normalisiertes, nur lesbares Exportmodell aufbauen.
5. Technical Export aus Template- und Composition-Daten erzeugen.
6. Artist Export aus denselben Visual Bounds und Slotkonturen ableiten.
7. Dateien mit festen Namen und stabiler Reihenfolge serialisieren.
8. Ausschließlich innerhalb des expliziten Zielverzeichnisses schreiben.

Es gibt keine Zeitstempel, Netzwerkzugriffe, externen Fonts, Browser-Renderer
oder ausführbaren Theme-Inhalte.

## Ausgabe

Das Standardziel für die erste Implementierung ist:

`frontend/theme-art-packs/base.main-room.v1/`

### Technical Export

- `base-template-clean.svg`
- `base-template-clean.png`
- `base-template-zones.png`
- `base-template-hitboxes.png`
- `base-template-safe-areas.png`
- `base-template-depth.png`
- `base-template-spec.json`
- `base-template-brief.md`

### Artist Export

- `artist/base-template-artist.png`
- `artist/base-template-outline.svg`
- `artist/base-template-mask.png`
- `artist/prompt.md`

## Technical Export und Artist Export

| Eigenschaft | Technical Export | Artist Export |
|---|---|---|
| Zielgruppe | Entwicklung, QA, Integratoren | Artists und Bildgeneratoren |
| IDs | sichtbar und maschinenlesbar | nicht enthalten |
| Labels und Legenden | enthalten | nicht enthalten |
| Hitboxen | explizit | nicht sichtbar, aber zu respektieren |
| Layerinformationen | explizit | nicht sichtbar |
| Farben | Diagnosefarben | transparent und monochrom |
| Kanonische Geometrie | vollständig dokumentiert | als neutrale Kontur nutzbar |
| Prompt | technischer Brief | allgemein verständlicher Creative Prompt |

## Artist-Dateien

### `base-template-artist.png`

Die zentrale Designvorlage besitzt einen transparenten Canvas. Sie enthält nur
schwarze Außenkonturen, schwarze Objektkonturen und dezente monochrome
Slotbegrenzungen. Es gibt keine Texte, IDs, Diagnosefarben, Legenden,
Layerinformationen oder Hitboxen.

Die Datei ist zum direkten Übermalen oder als Image-Conditioning-Vorlage
gedacht. Transparente Pixel bleiben vollständig transparent; Konturpixel sind
schwarz beziehungsweise neutral grau durch Alpha-Abstufung.

### `base-template-outline.svg`

Die Outline ist eine eigenständige, minimale Vektorvorlage. Sie enthält nur
Canvas-, Surface- und Visual-Slot-Konturen. Das SVG besitzt:

- keine Element-IDs,
- keine `data-*`-Attribute,
- keine Texte oder Titel,
- keine eingebetteten Styles, Scripts oder externen Referenzen,
- ausschließlich schwarze Linien mit `fill="none"`.

### `base-template-mask.png`

Die Maske ist eine opake Binärdatei:

- Schwarz: nicht ausgewählte Fläche
- Weiß: Asset-Slot-Fläche

Da dekorative Environment-Slots wie Background, Foreground und Ambient
denselben Canvas überlagern, werden großflächige Surface-Slots als
deterministische weiße Flächenbänder dargestellt. Funktionale Asset-Slots
werden als gefüllte weiße Visual-Silhouetten ausgegeben. Dadurch bleiben alle
Slotklassen in einer einzelnen Binärmaske erkennbar, ohne dass überlappende
Full-Canvas-Slots die komplette Maske weiß machen.

Die Zuordnung und exakten Bounds bleiben in `base-template-spec.json`
maschinenlesbar.

### `prompt.md`

Der Prompt wird aus Template- und Composition-Daten erzeugt. Er enthält:

- Canvasgröße,
- Perspektive und Kamerawinkel,
- Anzahl der Türen und Workspaces,
- Companion-Position,
- Regeln für Hintergrund und Vordergrund,
- erlaubten Visual Overflow,
- unveränderliche Interaction Bounds und Layoutregeln,
- gewünschte Asset-Dateiformate,
- einen neutralen Abschnitt `Creative Prompt`.

## Artist Workflow

1. `base-template-artist.png` oder `base-template-outline.svg` in einem
   Grafikprogramm öffnen.
2. Artwork auf separaten Ebenen unter beziehungsweise über den Konturen
   anlegen.
3. Hitboxen und Safe Areas bei Bedarf in den technischen PNGs gegenprüfen.
4. Dekorativen Overflow nur innerhalb der dokumentierten Effect Bounds nutzen.
5. Artwork entlang der Slotliste aus `base-template-spec.json` in Einzelassets
   zerlegen.
6. Konturen, technische Beschriftungen und Hilfsebenen vor dem finalen Export
   entfernen.

## ChatGPT Workflow

1. Artist-PNG, Masken-PNG und `prompt.md` gemeinsam bereitstellen.
2. Die gewünschte Welt, Materialität und Stimmung ergänzen.
3. Ausdrücklich verlangen, dass Anzahl und Position von Türen, Workspaces,
   Companion und Ausgang unverändert bleiben.
4. Einen ersten Gesamtentwurf erzeugen lassen.
5. Mit Technical Zones, Hitboxes und Safe Areas vergleichen.
6. Korrekturen über die Binärmaske oder einzelne Asset-Slots anfordern.

## Higgsfield Workflow

Der Workflow bleibt bewusst unabhängig von einer konkreten Produktoberfläche:

1. Die Artist-PNG als visuelle Referenz beziehungsweise Conditioning-Bild
   verwenden.
2. Den Abschnitt `Creative Prompt` zusammen mit der gewünschten Stilrichtung
   einsetzen.
3. Für gezielte Varianten oder Inpainting die Binärmaske verwenden.
4. Kamerabewegung, Perspektivwechsel und Geometrieverformung deaktivieren oder
   im Prompt ausschließen.
5. Das Ergebnis anschließend gegen Technical Export und Spec prüfen.

Falls die verwendete Higgsfield-Oberfläche keine Referenzbilder oder Masken
unterstützt, bleibt der Artist Export die verbindliche Vorlage für einen
nachgelagerten Compositing-Schritt.

## Determinismus

- Feste Canvasgröße aus dem Template.
- Feste, relative Dateinamen.
- Codepoint-basierte Sortierung ohne Locale-Abhängigkeit.
- Keine generierten IDs im Artist Export.
- Keine Zeit- oder Runtime-Instanzdaten.
- Interner deterministischer RGBA-/PNG-Encoder.
- Stabile SVG-Attribut- und Zahlenformatierung.
- Identische Eingaben erzeugen byte-identische Artist-Dateien innerhalb
  derselben Node-/zlib-Laufzeit.

## Zukünftige Template-Unterstützung

Ein neuer Template-Typ benötigt einen eigenen `ArtPackTemplateAdapter`. Dieser
definiert:

- welche Template-ID beziehungsweise Rolle unterstützt wird,
- wie Visual- und Slotkonturen gewonnen werden,
- welche Funktionsobjekte zwingend erhalten bleiben,
- wie überlappende Slots in einer Binärmaske repräsentiert werden,
- welche Angaben in den generierten Prompt gehören.

Object Templates können dadurch später dieselbe öffentliche API verwenden,
ohne Base-Sonderlogik in generische Renderer oder Runtime-Komponenten zu
verteilen.

Room Composition Contract 1.1 priorisiert die nächsten Adapter in dieser
Reihenfolge:

1. Room Shell;
2. Catalog Object;
3. Function-Container-Dokumentationsoverlay ohne Artwork;
4. Room Preset als Referenzmanifest mit optionaler Gesamtvorschau.

Der Preset-Export dupliziert keine Objektassets.

## Bekannte Einschränkungen

- Nur `base.main-room.v1` besitzt aktuell einen produktiven Adapter.
- Der Artist Export erzeugt keine finale Theme-Art.
- Die einzelne Binärmaske kann überlappende Full-Canvas-Slots nicht als
  getrennte Farbklassen kodieren; die genaue Zuordnung bleibt Aufgabe der Spec.
- Es existiert noch kein Importer, keine Preview-UI und keine Theme-Builder-UI.
- `BaseView.vue` und das bestehende Laufzeitverhalten bleiben unberührt.

## Nächster Schritt

Nach Definition der neuen Schemas sollte zuerst ein Room-Shell-Adapter anhand
der aus `base.main-room.v1` extrahierten Architektur implementiert werden.
Danach folgt ein kleiner Catalog-Object-Adapter für Door oder Workspace
Furniture. Project Nodes, Connections und Window Templates bleiben
nachgelagert.

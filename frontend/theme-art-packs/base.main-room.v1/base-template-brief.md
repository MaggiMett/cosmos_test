# Art brief: base.main-room.v1

## Auftrag

Erstelle einen austauschbaren Dekorsatz für die technische Base-Vorlage. Beispiel: „Fantasy-Base im Inneren eines Elfenbaums mit zwei Türen und zwei Workspaces“.

## Dokument

- Canvas: 1600 × 900 du, Ursprung links oben
- Perspektive: frontale Innenraumansicht; die kanonische Geometrie definiert Türen, Workspaces, Companion und Exit
- Kanonische Quelle: `base-template-clean.svg`
- Kontrollansichten: Zones, Hitboxes, Safe Areas und Depth als PNG

## Unveränderliche Regeln

- Slot-IDs, Funktionsrollen, Function Bindings, Canvas und Anchor-IDs dürfen nicht geändert werden.
- Interaction Bounds, Layout Bounds, Labels und der kritische Base-Exit dürfen nicht verdeckt oder in ihrer Funktion verändert werden.
- Themes enthalten keine Scripts, HTML-, Shader- oder sonstigen ausführbaren Inhalte.
- Externe Netzwerkreferenzen sind verboten.

## Erlaubter visueller Overflow

Dekoration darf innerhalb der jeweiligen Effect Bounds über die Visual Bounds hinausragen. Sie darf keine kritische Safe Area, fremde Hitbox oder den Base-Exit blockieren. Transparenter Overflow ist für SVG, PNG und WebP erlaubt; Ambient- und Foreground-Animationen dürfen später als WebM/MP4 geliefert werden.

## Benötigte Einzelassets

- `base.slot.background`: Full Base background; png, webp, svg, webm, mp4
- `base.slot.rear-wall`: Rear wall surface; png, webp, svg
- `base.slot.left-wall`: Left wall surface; png, webp, svg
- `base.slot.right-wall`: Right wall surface; png, webp, svg
- `base.slot.floor`: Floor surface; png, webp, svg
- `base.slot.ceiling`: Ceiling surface; png, webp, svg
- `base.slot.foreground`: Foreground surface; png, webp, svg, webm, mp4
- `base.slot.ambient`: Ambient surface; png, webp, svg, webm, mp4
- `base.slot.left-door`: Left Door visual; png, webp, svg
- `base.slot.right-door`: Right Door visual; png, webp, svg
- `base.slot.left-workspace`: Left Workspace visual; png, webp, svg
- `base.slot.right-workspace`: Right Workspace visual; png, webp, svg
- `base.slot.companion`: Companion visual; png, webp, svg

Rasterassets müssen die im Spec genannten Pixelmaße und sRGB verwenden. SVG bleibt rein deklarativ. Die Dateinamen im finalen Skin Pack werden über Asset References gebunden; die stabilen Slot-IDs sind die Übergabepunkte.

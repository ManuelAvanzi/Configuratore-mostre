# Materiali PBR di Spazio

18 set da **ambientCG**, autore del catalogo Lennart Demes. Licenza **Creative Commons CC0 1.0 Universal**, che permette modifica e redistribuzione dei file nel progetto. Verifica della licenza: 14 settembre 2026.

- Condizioni: https://docs.ambientcg.com/license/
- Licenza completa: https://creativecommons.org/publicdomain/zero/1.0/
- Fonte di ogni materiale, URL di download e hash SHA-256 dello ZIP: `manifest.json`.
- Metadati originali dell'API: `catalog-source.json`.

Set inclusi: Bricks097, Concrete031, Concrete034, Fabric019, Fabric030, Marble006, Marble012, Metal007, Metal032, PaintedPlaster017, Plaster001, Terrazzo001, Tiles093, Tiles107, Wood051, WoodFloor043, WoodFloor051, WoodFloor064.

Ogni set è scaricato in versione 2K-JPG. L'app include colore WebP a 2048 × 2048 (qualità 92), normal map OpenGL e rugosità a 1024 × 1024 (WebP lossless dopo ridimensionamento), anteprima 256 × 256. Non sono introdotte geometrie di displacement. Dimensioni fisiche documentate dal fornitore ove disponibili; negli altri casi il modulo predefinito è una scelta di progetto modificabile.

`node scripts/prepare-materials.mjs` rigenera gli asset locali dai collegamenti nei metadati. Gli ZIP in `downloads/` sono cache locali escluse da Git. Tinta unita e resina continua sono finiture uniformi del renderer e non utilizzano asset ambientCG.

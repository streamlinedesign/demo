# Streamline

Website for Streamline's branded menu packages for bars, clubs and restaurants:
a homepage with a live menu demo and the packages, and a free menu builder.

Plain HTML, CSS and JavaScript. There is no build step and nothing to install.

## Run locally

```sh
npx serve .
```

Then open the address it prints. Any static file server works. Opening the files
straight from disk mostly works too, but exports are more reliable from a server.

## Pages

- `index.html`: the homepage, with a live demo, the packages, the free demo and the inquiry form.
- `demo.html`: the menu builder. It has logo, name, theme, accent color, categories and items,
  contact and opening hours, a QR code, and exports.

The builder saves to the visitor's browser (`localStorage`), and the homepage demo
carries the name and theme into it.

## Where to change things

| What | Where |
| --- | --- |
| Site fonts, colors, spacing, radii | `css/tokens.css` |
| Site font files (Geist) | `css/site-font.css`, `fonts/` |
| Menu themes (Dan, Noć, Craft) | `css/menu.css`, one variable block per theme |
| Theme names visitors see | `THEMES` in `js/menu.js` |
| Menu font files | `css/fonts.css`, `fonts/` |
| Starting menu | `js/default-menu.js` |
| Contact email for inquiries | `CONTACT_EMAIL` in `js/menu.js` |
| Your website, linked from exported menus | `SITE_URL` in `js/menu.js` |
| A5 / A4 print layout | `js/print.js` |

## Exports (builder)

- **Web page**: one self-contained HTML file. It loads the menu fonts from Google Fonts.
- **PDF**: A5 or A4. The libraries for it (`js/vendor/html2canvas.min.js`,
  `js/vendor/jspdf.umd.min.js`) only load on the first PDF export.
- **Print**: the same A5 or A4 layout, sent to the browser's print dialog.

Print and PDF use one or two columns, depending on how many items there are.
Short categories are never split across columns unless that would need an extra page.
Contact and opening hours appear on the web menu only.

## Third-party files

- Fonts in `fonts/`: Geist, Hanken Grotesk, DM Serif Display, Space Grotesk and Fraunces.
  All are under the SIL Open Font License.
- `js/vendor/qrcode.js`: qrcode-generator (MIT).
- `js/vendor/html2canvas.min.js`: html2canvas 1.4.1 (MIT).
- `js/vendor/jspdf.umd.min.js`: jsPDF 2.5.2 (MIT).

`css/legacy.css` holds unused styles from the first version. No page links to it.

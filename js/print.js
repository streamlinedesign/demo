// A5 and A4 layout for printing and for the PDF export.
//
// The menu is split into real pages here rather than left to the browser, so
// that printing and the PDF give the same result. A menu that needs more than one
// page in a single column is laid out in two columns instead.

window.Print = (() => {
    const PX_PER_MM = 96 / 25.4;
    const mm = (n) => n * PX_PER_MM;

    // Paper sizes in mm. `scale` sizes the type: A4 is the same design, just larger.
    const FORMATS = {
        a5: { label: 'A5', w: 148, h: 210, margin: 12, gap: 8, footer: 9, scale: 1 },
        a4: { label: 'A4', w: 210, h: 297, margin: 16, gap: 10, footer: 11, scale: 1.3 },
    };

    function pageOf(format) {
        const f = FORMATS[format] ?? FORMATS.a5;
        return {
            ...f,
            id: format in FORMATS ? format : 'a5',
            w: mm(f.w), h: mm(f.h), margin: mm(f.margin), gap: mm(f.gap), footer: mm(f.footer),
            mmW: f.w, mmH: f.h,
        };
    }

    // The footer has its own strip at the bottom of every page, so the menu can't run into it.
    function pageCss(P) {
        const px = (n) => `${(n * P.scale).toFixed(2)}px`;
        return `
@page { size: ${P.label}; margin: 0; }
*, *::before, *::after { box-sizing: border-box; }
html, body, h4, h5, p { margin: 0; }
img { display: block; max-width: 100%; }
.p-page {
    display: flex;
    flex-direction: column;
    width: ${P.w}px;
    height: ${P.h}px;
    padding: ${P.margin}px ${P.margin}px 0;
    overflow: hidden;
    break-after: page;
    font-family: 'Hanken Grotesk', system-ui, sans-serif;
}
.p-page:last-child { break-after: auto; }
.p-page > .menu { flex: none; height: ${P.h - P.margin - P.footer}px; min-height: 0; overflow: hidden; }
.p-page > .m-foot {
    flex: none;
    display: flex;
    align-items: center;
    height: ${P.footer}px;
    max-width: none;
    margin: 0;
    padding: 0;
    font-size: ${px(8)};
    opacity: .6;
}
.p-cols { display: flex; gap: ${P.gap}px; align-items: flex-start; }
.p-col { flex: 1; min-width: 0; }
/* keeps each heading's top margin inside its block, so measuring a block counts it */
.p-page .m-cat { display: flow-root; }
.p-page .m-head { padding: 0 0 ${mm(6 * P.scale)}px; }
.p-page .m-tabs { display: none; }
.p-page .menu { font-size: ${px(11)}; }
.p-page .m-head h4 { font-size: ${px(26)}; }
.p-page .m-head p { font-size: ${px(11)}; }
/* category names are the point of a printed menu, so they stay large */
.p-page .m-cat h5 { margin: 0 0 ${mm(3 * P.scale)}px; font-size: ${px(20)}; }
.p-page .m-cat + .m-cat h5 { margin-top: ${mm(7 * P.scale)}px; }
.p-page .m-item { padding: ${px(5)} 0; }
.p-page .m-item small { font-size: ${px(9.5)}; }
.p-page .m-logo { margin-bottom: ${mm(3 * P.scale)}px; }
.p-page .m-logo-empty { width: ${px(64)}; height: ${px(64)}; font-size: ${px(24)}; }
.p-two .m-logo-img { max-height: ${mm(16 * P.scale)}px; }
`;
    }

    // One printable chunk: a category heading with its first item, or a single item.
    function blocks(state) {
        const full = Menu.html(state);
        const doc = new DOMParser().parseFromString(full, 'text/html');
        const out = [];

        doc.querySelectorAll('.m-cat').forEach((cat, c) => {
            const items = [...cat.querySelectorAll('.m-item')];
            const heading = cat.querySelector('h5')?.outerHTML ?? '';
            // the heading never ends a column on its own
            out.push({ cat: c, starts: true, html: `<section class="m-cat">${heading}${items[0]?.outerHTML ?? ''}</section>` });
            items.slice(1).forEach((item) => out.push({ cat: c, starts: false, html: `<section class="m-cat is-cont">${item.outerHTML}</section>` }));
        });

        return {
            head: doc.querySelector('.m-head')?.outerHTML ?? '',
            menuClass: doc.querySelector('.menu').className.replace('menu', '').trim(),
            menuStyle: doc.querySelector('.menu').getAttribute('style') ?? '',
            blocks: out,
        };
    }

    // Lays the blocks out in columns of a fixed height and returns the pages.
    // On the first page the header spans every column, so each column there starts below it.
    // With `keepWhole`, a category that would be split but fits in a fresh column moves there.
    function paginate(P, parts, heights, cols, headHeight, keepWhole) {
        const colHeight = P.h - P.margin - P.footer - 2; // 2px of slack for rounding
        const pages = [];
        let page = { head: true, cols: [[]] };
        let used = headHeight;

        // a whole category's height, to keep short categories in one column
        const catHeight = (c) => parts.blocks.reduce((sum, b, i) => sum + (b.cat === c ? heights[i] : 0), 0);

        parts.blocks.forEach((block, i) => {
            const h = heights[i];
            const room = colHeight - (page.cols.length < cols && page.head ? headHeight : 0);
            const whole = block.starts ? catHeight(block.cat) : 0;
            const moveWhole = keepWhole && block.starts && used + whole > colHeight && whole <= room;
            if ((used + h > colHeight || moveWhole) && page.cols.at(-1).length) {
                if (page.cols.length < cols) {
                    page.cols.push([]);
                    used = page.head ? headHeight : 0;
                } else {
                    pages.push(page);
                    page = { head: false, cols: [[]] };
                    used = 0;
                }
            }
            page.cols.at(-1).push(block.html);
            used += h;
        });

        pages.push(page);
        return pages;
    }

    function pagesHtml(P, pages, parts, cols) {
        return pages.map((page) => `
            <div class="p-page ${cols === 2 ? 'p-two' : ''}">
                <div class="menu ${parts.menuClass}" style="${parts.menuStyle}">
                    ${page.head ? parts.head : ''}
                    <div class="p-cols">
                        ${Array.from({ length: cols }, (_, i) =>
            `<div class="p-col">${(page.cols[i] ?? []).join('')}</div>`).join('')}
                    </div>
                </div>
                <footer class="m-foot">${Menu.footer()}</footer>
            </div>`).join('');
    }

    // Renders the blocks off-screen at the real column width and measures them.
    // Fonts only start loading once text needs them, so the content is laid out
    // first and measured after the fonts have arrived.
    async function measure(P, frameDoc, parts, cols) {
        const colWidth = (P.w - P.margin * 2 - P.gap * (cols - 1)) / cols;
        const host = frameDoc.getElementById('measure');
        host.className = `p-page ${cols === 2 ? 'p-two' : ''}`;
        host.innerHTML = `
            <div class="menu ${parts.menuClass}" style="${parts.menuStyle}">
                <div id="m-head" style="width:${P.w - P.margin * 2}px">${parts.head}</div>
                <div id="m-blocks" style="width:${colWidth}px">${parts.blocks.map((b) => b.html).join('')}</div>
            </div>`;
        void host.offsetHeight;
        await frameDoc.fonts.ready;

        // positions rather than heights, so margins between blocks are counted too
        const els = [...frameDoc.getElementById('m-blocks').children];
        const tops = els.map((el) => el.getBoundingClientRect().top);
        const end = els.length ? els.at(-1).getBoundingClientRect().bottom : 0;
        const menu = frameDoc.defaultView.getComputedStyle(host.querySelector('.menu'));

        return {
            head: frameDoc.getElementById('m-head').getBoundingClientRect().height,
            heights: tops.map((top, i) => (tops[i + 1] ?? end) - top),
            // the theme's own colors, written into the page CSS, so the paper
            // is the menu's color edge to edge
            bg: menu.backgroundColor,
            fg: menu.color,
        };
    }

    function frame(css) {
        const el = document.createElement('iframe');
        el.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;height:1200px;border:0';
        document.body.append(el);
        el.contentDocument.write(`<!DOCTYPE html><html><head><style>${css}
#measure { position: absolute; height: auto; overflow: visible; display: block; }
#measure .menu { height: auto; }</style></head>
<body><div id="measure"></div></body></html>`);
        el.contentDocument.close();
        return el;
    }

    // Returns { html, pages, cols, page } for a complete, paginated document.
    // `menuCss` is css/fonts.css (with absolute font URLs) followed by css/menu.css.
    async function layout(state, menuCss, format = 'a5') {
        const P = pageOf(format);
        const css = `${menuCss}\n${pageCss(P)}`;
        const el = frame(css);
        const parts = blocks(state);

        // Categories stay whole when that costs no extra page; otherwise they are split.
        const best = (m, cols) => {
            const split = paginate(P, parts, m.heights, cols, m.head, false);
            const whole = paginate(P, parts, m.heights, cols, m.head, true);
            return whole.length <= split.length ? whole : split;
        };

        let cols = 1;
        let m = await measure(P, el.contentDocument, parts, 1);
        let pages = best(m, 1);

        // more than one page in a single column: two columns read better
        if (pages.length > 1) {
            cols = 2;
            m = await measure(P, el.contentDocument, parts, 2);
            pages = best(m, 2);
        }

        el.remove();

        return {
            cols,
            pages: pages.length,
            page: P,
            html: `<!DOCTYPE html>
<html lang="hr">
<head>
<meta charset="UTF-8">
<title>${Menu.esc(state.name.trim() || 'Meni')} – ${P.label}</title>
<style>${css}
html, body, .p-page { background: ${m.bg}; color: ${m.fg}; }
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
</head>
<body>${pagesHtml(P, pages, parts, cols)}</body>
</html>`,
        };
    }

    return { layout, FORMATS, pageOf };
})();

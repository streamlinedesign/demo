// Demo menu builder. Edits a menu state, previews it live and saves it to localStorage.

const LOGO_MAX = 256; // px, logos are downscaled so they fit in storage

let state = Menu.load();

const $ = (id) => document.getElementById(id);
const form = $('settings');
const screens = document.querySelectorAll('[data-menu]');
const catsEl = $('cats');
const esc = Menu.esc;

// ---------- render ----------

let saveTimer;
function update() {
    Menu.render(screens, state);
    $('qr-code').innerHTML = Menu.qrSvg(state.url);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => Menu.save(state), 300);
}

// the save above waits for a pause in typing: don't lose the last edit when the page closes
addEventListener('pagehide', () => Menu.save(state));

function renderEditor() {
    catsEl.innerHTML = state.categories.map((c, ci) => `
        <div class="cat" data-ci="${ci}">
            <div class="cat-head">
                <input class="input" data-field="title" value="${esc(c.title)}" placeholder="Kategorija" aria-label="Naziv kategorije">
                <button type="button" class="btn btn-ghost btn-sm btn-icon" data-action="remove-cat" aria-label="Ukloni kategoriju">✕</button>
            </div>
            ${c.items.map((it, ii) => `
                <div class="item-row" data-ii="${ii}">
                    <input class="input" data-field="name" value="${esc(it.name)}" placeholder="Artikl" aria-label="Naziv artikla">
                    <input class="input" data-field="price" type="number" min="0" step="0.1" value="${esc(it.price)}" placeholder="0,00" aria-label="Cijena">
                    <button type="button" class="btn btn-ghost btn-sm btn-icon" data-action="remove-item" aria-label="Ukloni artikl">✕</button>
                    <input class="input input-desc" data-field="desc" value="${esc(it.desc)}" placeholder="Opis (neobavezno)" aria-label="Opis">
                </div>`).join('')}
            <button type="button" class="btn btn-ghost btn-sm" data-action="add-item">+ Dodaj artikl</button>
        </div>`).join('');
}

function fillForm() {
    const f = form.elements;
    f.name.value = state.name;
    f.tagline.value = state.tagline;
    f.contact.value = state.contact;
    f.hours.value = state.hours;
    f.currency.value = state.currency;
    f.showPrices.checked = state.showPrices;
    f.showDesc.checked = state.showDesc;
    f.showLogo.checked = state.showLogo;
    f.showName.checked = state.showName;
    f.showTagline.checked = state.showTagline;
    f.url.value = state.url;
    form.elements.paper.value = state.paper;
    $('themes').innerHTML = Menu.THEMES.map((t) => `
        <label><input type="radio" name="theme" value="${t.id}"${t.id === state.theme ? ' checked' : ''}> ${t.label}</label>
    `).join('');
    renderLogo();
    renderEditor();
}

function renderLogo() {
    $('logo-preview').innerHTML = state.logo ? `<img src="${esc(state.logo)}" alt="">` : '';
    $('logo-remove').hidden = !state.logo;
}

// The color input shows the theme's accent until the user picks their own.
// ("Kreni ispočetka" puts every theme back to its own color.)
function syncAccent() {
    const menu = document.querySelector('.menu');
    const value = state.accents[state.theme] || getComputedStyle(menu).getPropertyValue('--m-accent').trim();
    if (/^#[0-9a-f]{6}$/i.test(value)) $('accent').value = value;
}

// ---------- form events ----------

form.addEventListener('input', (e) => {
    const t = e.target;
    const row = t.closest('[data-ci]');

    if (row) {
        const cat = state.categories[row.dataset.ci];
        const item = t.closest('[data-ii]');
        if (item) cat.items[item.dataset.ii][t.dataset.field] = t.value;
        else cat[t.dataset.field] = t.value;
    } else if (t.type === 'checkbox') {
        state[t.name] = t.checked;
    } else if (t.name === 'accent') {
        // each theme keeps its own accent
        state.accents = { ...state.accents, [state.theme]: t.value };
    } else if (t.name && t.name !== 'view' && t.type !== 'file') {
        state[t.name] = t.value;
    }

    update();
    if (t.name === 'theme' || t.name === 'accent') syncAccent();
});

form.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const ci = btn.closest('[data-ci]')?.dataset.ci;
    const ii = btn.closest('[data-ii]')?.dataset.ii;

    switch (btn.dataset.action) {
        case 'add-cat':
            state.categories.push({ title: '', items: [{ name: '', desc: '', price: '' }] });
            break;
        case 'remove-cat':
            state.categories.splice(ci, 1);
            break;
        case 'add-item':
            state.categories[ci].items.push({ name: '', desc: '', price: '' });
            break;
        case 'remove-item':
            state.categories[ci].items.splice(ii, 1);
            break;
    }

    renderEditor();
    update();

    // focus the new field so typing can start right away
    if (btn.dataset.action === 'add-cat') catsEl.querySelector('.cat:last-child [data-field="title"]').focus();
    if (btn.dataset.action === 'add-item') [...catsEl.querySelectorAll(`[data-ci="${ci}"] [data-field="name"]`)].at(-1)?.focus();
});

// ---------- logo ----------

$('logo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.logo = await downscale(file, LOGO_MAX);
    e.target.value = '';
    renderLogo();
    update();
});

$('logo-remove').addEventListener('click', () => {
    state.logo = null;
    renderLogo();
    update();
});

function downscale(file, max) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(img.src);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// ---------- QR downloads ----------

function download(href, filename) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.append(a);  // Safari and Firefox ignore a click on a detached link
    a.click();
    a.remove();
}

const slug = () => (state.name || 'meni').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meni';

$('qr-svg').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([Menu.qrSvg(state.url)], { type: 'image/svg+xml' }));
    download(url, `${slug()}-qr.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$('qr-png').addEventListener('click', () => {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.drawImage(img, 0, 0, 1024, 1024);
        download(canvas.toDataURL('image/png'), `${slug()}-qr.png`);
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Menu.qrSvg(state.url));
});

// ---------- export ----------
// Both exports are self-contained HTML: the menu markup from menu.js plus menu.css inlined.

// Loaded once at startup: a download must start straight from the click,
// before any await, or the browser drops it.
let MENU_CSS = '';

// The website export gets menu.css only (its fonts come from Google Fonts);
// the A5 print and PDF also get css/fonts.css, with the font URLs made absolute
// so the generated documents can reach the files in fonts/.
let PRINT_CSS = '';

async function loadCss(path) {
    let text = '';
    try {
        const res = await fetch(path);
        if (res.ok) text = await res.text();
    } catch { }
    if (!text) {
        // file:// pages can't fetch; read the already-loaded stylesheet instead
        const sheet = [...document.styleSheets].find((s) => s.href?.endsWith(path));
        try { text = [...sheet.cssRules].map((r) => r.cssText).join('\n'); } catch { }
    }
    const base = new URL(path, location.href);
    return text.replace(/url\((['"]?)(?!data:|https?:)([^'")]+)\1\)/g, (_, q, url) => `url("${new URL(url, base)}")`);
}

async function loadMenuCss() {
    const [fonts, menu] = await Promise.all([loadCss('css/fonts.css'), loadCss('css/menu.css')]);
    PRINT_CSS = `${fonts}\n${menu}`;
    return menu;
}

// html2canvas and jsPDF are ~560 KB together: loaded on the first PDF export, not with the page.
const vendor = {};
function loadScript(src) {
    vendor[src] ??= new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.onload = resolve;
        el.onerror = () => { delete vendor[src]; reject(new Error(`Could not load ${src}`)); };
        document.head.append(el);
    });
    return vendor[src];
}

const EXPORT_BASE = `
:root { --ease: cubic-bezier(.2, .7, .2, 1); }
*, *::before, *::after { box-sizing: border-box; }
html, body, h4, h5, p { margin: 0; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
img { display: block; max-width: 100%; }
`;

// scroll-to-category and active tab for the exported website
const EXPORT_SCRIPT = `
const tabs = document.querySelector('.m-tabs');
const setActive = (i) => tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b.dataset.cat === String(i)));
let lockUntil = 0;
let lockCat = null;
tabs?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const sec = document.querySelector('.m-cat[data-cat="' + btn.dataset.cat + '"]');
    lockUntil = Date.now() + 900;
    lockCat = btn.dataset.cat;
    setActive(lockCat);
    window.scrollTo({ top: sec.getBoundingClientRect().top + scrollY - tabs.offsetHeight, behavior: 'smooth' });
});
addEventListener('scroll', () => {
    if (!tabs || Date.now() < lockUntil) return;
    // the last categories can't reach the top of the page: keep the clicked tab
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    if (atBottom && lockCat !== null) return setActive(lockCat);
    let current = 0;
    document.querySelectorAll('.m-cat').forEach((s) => { if (s.getBoundingClientRect().top <= tabs.offsetHeight + 8) current = s.dataset.cat; });
    lockCat = null;
    setActive(current);
}, { passive: true });
`;

const pageTitle = () => esc(state.name.trim() || 'Meni');

function websiteHtml() {
    const footer = Menu.footer(Menu.SITE_URL);
    return `<!DOCTYPE html>
<html lang="hr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${pageTitle()}</title>
${Menu.FONT_LINK}
<style>${EXPORT_BASE}
${MENU_CSS}
.menu { min-height: 100vh; }
</style>
</head>
<body>
${Menu.html(state).replace(/(<footer class="m-foot">).*?(<\/footer>)/, `$1${footer}$2`)}
<script>${EXPORT_SCRIPT}<\/script>
</body>
</html>`;
}

$('export-web').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([websiteHtml()], { type: 'text/html' }));
    download(url, `${slug()}-meni.html`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$('export-pdf').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
        const [layout] = await Promise.all([
            Print.layout(state, PRINT_CSS, state.paper),
            loadScript('js/vendor/html2canvas.min.js'),
            loadScript('js/vendor/jspdf.umd.min.js'),
        ]);
        await savePdf(layout);
    } finally {
        btn.disabled = false;
    }
});

$('export-print').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
        const { html } = await Print.layout(state, PRINT_CSS, state.paper);
        const frame = document.createElement('iframe');
        frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
        frame.srcdoc = html;
        document.body.append(frame);
        await new Promise((done) => { frame.onload = done; });
        // print only once the menu's fonts are in, or the browser prints a fallback font
        // whose different line heights push the menu out of its page
        await frame.contentDocument.fonts.ready;
        frame.contentWindow.print();
        setTimeout(() => frame.remove(), 1000);
    } finally {
        btn.disabled = false;
    }
});

// Each page is drawn to a canvas and placed on its own PDF page.
async function savePdf({ html, page: P }) {
    const frame = document.createElement('iframe');
    frame.style.cssText = `position:fixed;left:-9999px;top:0;border:0;width:${P.w}px;height:${P.h}px`;
    frame.srcdoc = html;
    document.body.append(frame);
    await new Promise((done) => { frame.onload = done; });

    const doc = frame.contentDocument;
    await doc.fonts?.ready;

    const pdf = new jspdf.jsPDF({ unit: 'mm', format: P.id });
    const pages = [...doc.querySelectorAll('.p-page')];

    for (const [i, page] of pages.entries()) {
        const canvas = await html2canvas(page, {
            scale: 3,
            backgroundColor: getComputedStyle(page).backgroundColor,
            width: P.w,
            height: P.h,
            logging: false,
        });
        if (i) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, P.mmW, P.mmH);
    }

    pdf.save(`${slug()}-meni-${P.id}.pdf`);
    frame.remove();
}

// ---------- actions ----------

$('send').addEventListener('click', () => {
    const theme = Menu.THEMES.find((t) => t.id === state.theme)?.label;
    const items = state.categories.reduce((n, c) => n + c.items.length, 0);
    const body = [
        `Lokal: ${state.name}`,
        `Tema: ${theme}`,
        `Kategorija: ${state.categories.length}, artikala: ${items}`,
        `Adresa menija: ${state.url}`,
        '',
        'Poruka:',
    ].join('\n');
    location.href = `mailto:${Menu.CONTACT_EMAIL}?subject=${encodeURIComponent('Demo meni: ' + state.name)}&body=${encodeURIComponent(body)}`;
});

$('reset').addEventListener('click', () => {
    if (!confirm('Obrisati sve izmjene i krenuti ispočetka?')) return;
    Menu.clear();
    state = Menu.defaults();
    fillForm();
    update();
    syncAccent();
});

// ---------- preview device toggle ----------

document.getElementById('view').addEventListener('change', (e) => {
    document.querySelector('.devices').dataset.view = e.target.value;
    fitPhone();
    update();
});

// The phone preview is a real 390 × 844 screen; shrink it only when the window is too short.
const phoneFit = document.querySelector('.phone-fit');
function fitPhone() {
    // fit the whole phone on the first screen, below the header and toolbar.
    // Measured from the builder grid, not the preview: the preview is sticky, so
    // once the page is scrolled its own position says nothing about the first screen.
    const builder = $('builder');
    const preview = $('preview');
    const builderTop = builder.getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(builder).paddingTop);
    const top = builderTop + (phoneFit.parentElement.getBoundingClientRect().top - preview.getBoundingClientRect().top);
    const room = window.innerHeight - top - 24;
    phoneFit.parentElement.style.setProperty('--preview-h', `${Math.max(room, 420)}px`);
    const scale = Math.min(1, room / 854, phoneFit.clientWidth / 400);
    phoneFit.style.setProperty('--scale', Math.max(scale, 0.4).toFixed(3));
}
window.addEventListener('resize', fitPhone);

// ---------- full view ----------

const fullview = $('fullview');
document.querySelectorAll('[data-fullview]').forEach((btn) =>
    btn.addEventListener('click', () => {
        fullview.showModal();
        fullview.querySelector('.screen').scrollTop = 0;
        update();
    }));
$('fullview-close').addEventListener('click', () => fullview.close());

// On small screens a floating button jumps back to the preview. It hides over
// the page footer, so it never covers the footer links.
const toPreview = $('to-preview');
const inView = new Map();
const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => inView.set(e.target, e.isIntersecting));
    toPreview.classList.toggle('is-visible', ![...inView.values()].some(Boolean));
});
io.observe($('preview'));
io.observe(document.querySelector('.site-footer'));

// ---------- init ----------

screens.forEach(Menu.bind);
fillForm();
update();
fitPhone();
loadMenuCss().then((css) => { MENU_CSS = css; });
syncAccent();
$('year').textContent = new Date().getFullYear();

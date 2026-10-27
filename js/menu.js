// Shared bar-menu renderer, used by the homepage demo and the builder.
// Themes live in css/menu.css; the list here only names them.

window.Menu = (() => {
    // Where inquiry forms send mail. Change to the real address.
    const CONTACT_EMAIL = 'info@example.com';
    // Your website, used in the exported menu's footer. Set it once you have a domain.
    const SITE_URL = '';

    // id = the class in css/menu.css (named after your design file), label = what visitors see
    const THEMES = [
        { id: 'light', label: 'Dan' },
        { id: 'dark', label: 'Noć' },
        { id: 'afternoon', label: 'Craft' },
    ];

    // The exported website is a single file, so it can't carry fonts/ along:
    // it loads the same fonts (same weights as css/fonts.css) from Google Fonts.
    const FONT_LINK = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2'
        + '?family=DM+Serif+Display'
        + '&family=Fraunces:opsz,wght@40,500'
        + '&family=Hanken+Grotesk:wght@400;600'
        + '&family=Space+Grotesk:wght@600'
        + '&display=swap">';

    // The starting menu lives in js/default-menu.js.
    const DEFAULT = window.DEFAULT_MENU;

    // bumped when the saved shape changes, so old saves don't carry stale settings
    const STORAGE_KEY = 'streamline-demo-v2';

    function defaults() {
        return {
            name: DEFAULT.name,
            tagline: DEFAULT.tagline,
            theme: 'light',
            accents: {},        // own accent color per theme: { light: '#…' }
            paper: 'a5',        // print and PDF size: a5 or a4
            currency: '€',
            showPrices: true,
            showDesc: true,
            showLogo: true,
            showName: true,
            showTagline: true,
            contact: '',        // free text, website only (not printed)
            hours: '',          // free text, website only (not printed)
            logo: null,
            url: 'https://streamline.example/moj-bar',
            categories: structuredClone(DEFAULT.categories),
        };
    }

    function load() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            const state = saved ? { ...defaults(), ...saved } : defaults();
            if (!THEMES.some((t) => t.id === state.theme)) state.theme = THEMES[0].id;
            // earlier saves had one accent for every theme: keep it on the theme it was picked on
            if (typeof state.accent === 'string') {
                if (state.accent) state.accents = { [state.theme]: state.accent, ...state.accents };
                delete state.accent;
            }
            return state;
        } catch {
            return defaults();
        }
    }

    function save(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            // storage full or blocked: the demo still works, it just won't persist
        }
    }

    function clear() {
        try { localStorage.removeItem(STORAGE_KEY); } catch { }
    }

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const priceFormat = new Intl.NumberFormat('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const YEAR = new Date().getFullYear();

    // `link` turns the brand into a link (used by the exported website).
    function footer(link) {
        const brand = link
            ? `<a href="${esc(link)}" target="_blank" rel="noopener">Streamline</a>`
            : '<span>Streamline</span>';
        return `© ${YEAR} Created with ${brand}`;
    }

    function html(s) {
        // Uploaded logos keep their own shape; without one, the first letter stands in.
        const initial = s.name.trim().charAt(0).toUpperCase();
        let logo = '';
        if (s.showLogo && s.logo) logo = `<img class="m-logo m-logo-img" src="${esc(s.logo)}" alt="">`;
        else if (s.showLogo && initial) logo = `<div class="m-logo m-logo-empty">${esc(initial)}</div>`;

        const name = s.showName && s.name.trim() ? `<h4>${esc(s.name)}</h4>` : '';
        const tagline = s.showTagline && s.tagline.trim() ? `<p>${esc(s.tagline)}</p>` : '';
        const head = logo || name || tagline ? `<header class="m-head">${logo}${name}${tagline}</header>` : '';

        const cats = s.categories.filter((c) => c.title.trim() || c.items.length);

        const tabs = cats.map((c, i) =>
            `<button type="button" data-cat="${i}"${i === 0 ? ' class="is-active"' : ''}>${esc(c.title) || '—'}</button>`).join('');

        const sections = cats.map((c, i) => `
            <section class="m-cat" data-cat="${i}">
                <h5>${esc(c.title)}</h5>
                ${c.items.map((it) => `
                    <div class="m-item">
                        <span>${esc(it.name)}${s.showDesc && it.desc ? `<small>${esc(it.desc)}</small>` : ''}</span>
                        ${s.showPrices && it.price !== '' && it.price != null ? `<b>${priceFormat.format(Number(it.price) || 0)} ${esc(s.currency)}</b>` : ''}
                    </div>`).join('')}
            </section>`).join('');

        const accent = s.accents?.[s.theme];
        const style = accent ? ` style="--m-accent:${esc(accent)}"` : '';

        // contact and hours: free text, line breaks kept; the print layout leaves them out
        const block = (title, text) => text?.trim() ? `<div><h5>${title}</h5><p>${esc(text.trim())}</p></div>` : '';
        const info = block('Kontakt', s.contact) + block('Radno vrijeme', s.hours);

        return `
            <div class="menu theme-${esc(s.theme)}"${style}>
                ${head}
                ${cats.length ? `<nav class="m-tabs">${tabs}</nav>` : ''}
                <div class="m-body">${sections || '<p class="m-empty">Dodajte kategorije i artikle.</p>'}</div>
                ${info ? `<aside class="m-info">${info}</aside>` : ''}
                <footer class="m-foot">${footer()}</footer>
            </div>`;
    }

    // Renders into every screen and keeps each screen's scroll position.
    // When only the theme or accent changed, the existing menu is restyled in place
    // instead of rebuilt: nothing is re-laid out (no logo reloading, no jump), and the
    // colors cross-fade through the .menu transition.
    function render(screens, state) {
        const markup = html(state);
        const root = markup.match(/<div class="menu ([^"]*)"(?: style="([^"]*)")?>/);
        const content = markup.slice(markup.indexOf(root[0]) + root[0].length);

        screens.forEach((screen) => {
            const menu = screen.firstElementChild;
            if (menu?.classList.contains('menu') && contents.get(screen) === content) {
                menu.className = `menu ${root[1]}`;
                if (root[2]) menu.setAttribute('style', root[2]); else menu.removeAttribute('style');
                return;
            }
            const top = screen.scrollTop;
            screen.innerHTML = markup.trim();
            contents.set(screen, content);
            screen.scrollTop = top;
            syncTabs(screen);
        });
    }

    const contents = new WeakMap();

    function setActive(screen, i) {
        screen.querySelectorAll('.m-tabs button').forEach((b) =>
            b.classList.toggle('is-active', b.dataset.cat === String(i)));
    }

    // While a tab click is scrolling, that tab stays active (no flicker through the
    // categories in between, and short last categories that can't reach the top still win).
    const locks = new WeakMap();

    function syncTabs(screen) {
        const tabs = screen.querySelector('.m-tabs');
        if (!tabs || !screen.clientHeight) return; // hidden screens have no layout to read

        const lock = locks.get(screen);
        if (lock && lock.until > Date.now()) return setActive(screen, lock.cat);

        const sections = [...screen.querySelectorAll('.m-cat')];
        const atBottom = screen.scrollTop + screen.clientHeight >= screen.scrollHeight - 2;
        if (atBottom && lock) return setActive(screen, lock.cat);

        const line = tabs.getBoundingClientRect().bottom + 8;
        let current = 0;
        sections.forEach((sec) => {
            if (sec.getBoundingClientRect().top <= line) current = sec.dataset.cat;
        });
        locks.delete(screen);
        setActive(screen, current);
    }

    // Tab clicks scroll inside the device screen; scrolling updates the active tab.
    function bind(screen) {
        screen.addEventListener('click', (e) => {
            const btn = e.target.closest('.m-tabs button');
            if (!btn) return;
            const sec = screen.querySelector(`.m-cat[data-cat="${btn.dataset.cat}"]`);
            const tabs = screen.querySelector('.m-tabs');
            if (!sec) return;
            const secTop = sec.getBoundingClientRect().top - screen.getBoundingClientRect().top + screen.scrollTop;
            const stuck = (parseFloat(getComputedStyle(tabs).top) || 0) + tabs.offsetHeight;
            locks.set(screen, { cat: btn.dataset.cat, until: Date.now() + 900 });
            screen.scrollTo({ top: secTop - stuck, behavior: 'smooth' });
            tabs.scrollTo({ left: btn.offsetLeft - tabs.clientWidth / 2 + btn.offsetWidth / 2, behavior: 'smooth' });
            setActive(screen, btn.dataset.cat);
        });
        screen.addEventListener('scroll', () => syncTabs(screen), { passive: true });
        screen.addEventListener('scrollend', () => {
            const lock = locks.get(screen);
            if (lock) lock.until = 0;
            syncTabs(screen);
        });
    }

    function qrSvg(text) {
        if (!window.qrcode) return '';
        qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
        const qr = qrcode(0, 'M');
        qr.addData(text || ' ');
        qr.make();
        return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    }

    // Every theme's heading font is fetched up front, so switching themes never
    // shows a fallback font for a moment before the real one arrives.
    if (document.fonts?.load) {
        ['400 1em "DM Serif Display"', '600 1em "Space Grotesk"', '500 1em "Fraunces"', '600 1em "Hanken Grotesk"']
            .forEach((font) => document.fonts.load(font, 'Aa Čč').catch(() => { }));
    }

    return { CONTACT_EMAIL, SITE_URL, THEMES, FONT_LINK, footer, defaults, load, save, clear, html, render, bind, qrSvg, esc };
})();

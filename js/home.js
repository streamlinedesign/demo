// Homepage: live demo menu (landing + free demo block), price calculator, inquiry form.

const CYCLE_MS = 3200;

const state = Menu.load();
const screens = document.querySelectorAll('[data-menu=""]');
// Screens with a theme in data-menu (the free demo phone) always show that theme.
const fixedScreens = document.querySelectorAll('[data-menu]:not([data-menu=""])');
const nameInputs = document.querySelectorAll('[data-name-input]');
const themeGroups = document.querySelectorAll('[data-theme-group]');

// ---------- live demo ----------
// Every name field and theme picker on the page drives the same menu state.

themeGroups.forEach((group, g) => {
    group.innerHTML = Menu.THEMES.map((t) => `
        <label><input type="radio" name="demo-theme-${g}" value="${t.id}"> ${t.label}</label>
    `).join('');
});

function syncControls() {
    nameInputs.forEach((input) => { if (input !== document.activeElement) input.value = state.name; });
    themeGroups.forEach((group) => { group.querySelector(`input[value="${state.theme}"]`).checked = true; });
}

const render = () => {
    Menu.render(screens, state);
    fixedScreens.forEach((el) => Menu.render([el], { ...state, theme: el.dataset.menu, accents: {} }));
    syncControls();
};

document.querySelectorAll('[data-menu]').forEach(Menu.bind);
render();

// Themes rotate on their own until the visitor touches a demo.
let cycle = setInterval(() => {
    const i = Menu.THEMES.findIndex((t) => t.id === state.theme);
    state.theme = Menu.THEMES[(i + 1) % Menu.THEMES.length].id;
    render();
}, CYCLE_MS);

const stopCycle = () => clearInterval(cycle);
const heroDemo = document.querySelector('.hero-demo');
heroDemo.addEventListener('pointerdown', stopCycle);
heroDemo.addEventListener('focusin', stopCycle);
if (matchMedia('(prefers-reduced-motion: reduce)').matches) stopCycle();

nameInputs.forEach((input) => input.addEventListener('input', () => {
    state.name = input.value;
    render();
}));

themeGroups.forEach((group) => group.addEventListener('change', (e) => {
    state.theme = e.target.value;
    render();
}));

// Carry the visitor's name and theme into the builder.
document.querySelectorAll('[data-open-builder]').forEach((a) =>
    a.addEventListener('click', () => Menu.save(state)));

// ---------- price calculator → inquiry form ----------
// Prices in euros. Change them here; the page shows them from these numbers.

const PRICES = {
    set: 89,      // set za stol, per table
    web: 1000,    // web meni, dizajn i izrada
    site: 1000,   // web stranica + fotografija (the web meni is added on top)
    // the monthly support plan has no set price: "po dogovoru"
};

const calc = document.getElementById('calc');
const form = document.getElementById('inquiry');
const euro = new Intl.NumberFormat('hr-HR', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0,
});

calc.querySelectorAll('[data-price-of]').forEach((el) => { el.textContent = euro.format(PRICES[el.dataset.priceOf]); });

// What the calculator starts with, and what an inquiry sends if nothing is picked.
const DEFAULTS = { sets: 30, web: false, site: false, plan: 'once' };

const PLANS = {
    once: ['Podrška, jednokratno', 'uključeno'],
    monthly: ['Podrška, mjesečno', 'po dogovoru'],
};

function sets() {
    const n = Math.round(Number(calc.elements.sets.value));
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 999) : 0;
}

function picked() {
    const c = calc.elements;
    return { sets: sets(), web: c.web.checked, site: c.site.checked, plan: c.plan.value };
}

// A package as lines of [label, price], plus the total.
function quote(p) {
    const lines = [['Dizajn i tisak fizičkog cjenika', 'uključeno']];
    if (p.sets > 0) lines.push([`Set za stol × ${p.sets}`, p.sets * PRICES.set]);
    if (p.web || p.site) lines.push(['Web meni', PRICES.web]);
    if (p.site) lines.push(['Web stranica + fotografija', PRICES.site]);
    const total = lines.reduce((sum, [, price]) => sum + (typeof price === 'number' ? price : 0), 0);
    return { lines, total, empty: total === 0, plan: PLANS[p.plan] || PLANS.once };
}

const price = (value) => (typeof value === 'number' ? euro.format(value) : value);

function updateCalc() {
    const c = calc.elements;
    // the website always comes with the web menu
    c.web.disabled = c.site.checked;
    if (c.site.checked) c.web.checked = true;

    const q = quote(picked());
    const rows = q.empty ? [] : [...q.lines, q.plan];
    calc.querySelector('.calc-lines').innerHTML = rows.length
        ? rows.map(([label, value]) => `<li><span>${label}</span> <span>${price(value)}</span></li>`).join('')
        : '<li class="calc-empty">Odaberite barem jednu stavku.</li>';
    c.total.value = euro.format(q.total);
}

calc.addEventListener('input', updateCalc);
calc.addEventListener('change', () => { calc.elements.sets.value = sets(); updateCalc(); });
calc.addEventListener('submit', (e) => e.preventDefault());

calc.querySelectorAll('[data-step]').forEach((btn) => btn.addEventListener('click', () => {
    calc.elements.sets.value = Math.min(Math.max(sets() + Number(btn.dataset.step), 0), 999);
    updateCalc();
}));

document.querySelector('[data-to-inquiry]').addEventListener('click', () => {
    setTimeout(() => form.elements.name.focus({ preventScroll: true }), 400);
});

calc.elements.sets.value = DEFAULTS.sets;
updateCalc();

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    // nothing picked in the calculator: send the starting package
    let q = quote(picked());
    if (q.empty) q = quote({ ...DEFAULTS, plan: calc.elements.plan.value });
    const pick = [...q.lines, q.plan].map(([label, value]) => `• ${label}: ${price(value)}`).join('\n');
    const subject = `Upit: ${euro.format(q.total)}`;
    const body = `Ime: ${f.name.value}\n\nPaket:\n${pick}\nUkupno: ${euro.format(q.total)}\n\n${f.message.value}`;
    location.href = `mailto:${Menu.CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

document.getElementById('year').textContent = new Date().getFullYear();

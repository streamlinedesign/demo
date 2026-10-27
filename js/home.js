// Homepage: live demo menu (landing + free demo block), package buttons, inquiry form.

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

// ---------- packages → inquiry form ----------

const form = document.getElementById('inquiry');

document.querySelectorAll('[data-package]').forEach((btn) => {
    btn.addEventListener('click', () => {
        form.elements.package.value = btn.dataset.package;
        setTimeout(() => form.elements.name.focus({ preventScroll: true }), 400);
    });
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    const subject = `Upit: ${f.package.value}`;
    const body = `Ime: ${f.name.value}\nPaket: ${f.package.value}\n\n${f.message.value}`;
    location.href = `mailto:${Menu.CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

document.getElementById('year').textContent = new Date().getFullYear();

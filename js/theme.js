// Light/dark switch, shared by both pages.
// The new colors all land in the same frame (transitions are paused for it),
// and browsers with view transitions cross-fade the whole page.

const root = document.documentElement;
const button = document.getElementById('theme');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function applyTheme(next) {
    root.classList.add('theme-switching');
    root.dataset.theme = next;
    button.setAttribute('aria-pressed', String(next === 'dark'));
    try { localStorage.theme = next; } catch { }
    // two frames: the new colors are painted before transitions come back
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
}

button.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));

button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (document.startViewTransition && !reduceMotion.matches) {
        document.startViewTransition(() => applyTheme(next));
    } else {
        applyTheme(next);
    }
});

// In-page links (#packages, #inquiry, ...) scroll here in script, so they also
// work when the page is shown inside a frame that ignores anchor jumps.
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    const target = link && document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
});

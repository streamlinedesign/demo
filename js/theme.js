// Light/dark toggle. Switches instantly, no transition animation.
document.getElementById('theme').addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.theme = next; } catch { }
});

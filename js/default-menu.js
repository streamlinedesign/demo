// The menu every visitor starts from in the builder and on the homepage demo.
// Replace the categories below with your own; the shape is:
//   { title: 'Category', items: [{ name: 'Item', desc: 'optional', price: 1.5 }] }

window.DEFAULT_MENU = {
    name: 'Moj bar',
    tagline: 'Kava, kokteli i dobra glazba',
    categories: [
        {
            title: 'Kava', items: [
                { name: 'Espresso', desc: '', price: 1.8 },
                { name: 'Macchiato', desc: '', price: 2 },
                { name: 'Cappuccino', desc: 's mliječnom pjenom', price: 2.4 },
                { name: 'Latte', desc: '', price: 2.8 },
            ],
        },
        {
            title: 'Kokteli', items: [
                { name: 'Aperol Spritz', desc: 'Aperol, prosecco, soda', price: 7.5 },
                { name: 'Mojito', desc: 'rum, limeta, menta', price: 8 },
                { name: 'Negroni', desc: 'gin, Campari, vermut', price: 8.5 },
                { name: 'Gin tonic', desc: 'gin, tonik, limeta', price: 7 },
            ],
        },
        {
            title: 'Pivo', items: [
                { name: 'Točeno 0,5 l', desc: '', price: 3.5 },
                { name: 'Točeno 0,3 l', desc: '', price: 2.5 },
                { name: 'Craft IPA 0,33 l', desc: '', price: 4.8 },
            ],
        },
        {
            title: 'Vino', items: [
                { name: 'Bijelo 0,2 l', desc: 'graševina', price: 3 },
                { name: 'Crno 0,2 l', desc: 'plavac mali', price: 3.5 },
                { name: 'Prosecco 0,1 l', desc: '', price: 4 },
            ],
        },
        {
            title: 'Bezalkoholno', items: [
                { name: 'Cedevita', desc: '', price: 2.2 },
                { name: 'Coca-Cola 0,25 l', desc: '', price: 2.8 },
                { name: 'Prirodni sok', desc: 'naranča ili jabuka', price: 3.2 },
                { name: 'Voda 0,33 l', desc: 'gazirana ili negazirana', price: 2 },
            ],
        },
    ],
};

/* ==========================================================================
   LAYOUT.JS - EN-TÊTE ET PIED DE PAGE COMMUNS
   Remplace les éléments #site-header et #site-footer de la page.
   À déclarer avant les autres scripts, qui lisent la navigation.
   ========================================================================== */

const COPYRIGHT_YEAR = new Date().getFullYear();

const NAV_ITEMS = [
    { anchor: '#presentation', label: 'Présentation' },
    { anchor: '#parcours',     label: 'Parcours' },
    { anchor: '#projets',      label: 'Projets' },
    { anchor: '#competences',  label: 'Compétences' }
];

const FOOTER_ITEMS = [
    { href: 'https://github.com/KibyPoyo', label: 'GitHub', newTab: true },
    { href: 'https://www.linkedin.com/in/tony-perottino-812a22325/', label: 'LinkedIn', newTab: true },
    { href: 'cv.html', label: 'CV' },
    { href: 'piscine_a_balles.html', label: 'Surprise', cssClass: 'btn-surprise' }
];

// Ancre portant la classe active selon la valeur de data-page sur le body.
const ACTIVE_ANCHOR_BY_PAGE = {
    home: '#presentation',
    project: '#projets',
    cv: ''
};

// Construit le code de l'en-tête. Sur la page d'accueil les ancres restent nues,
// pour une navigation interne plutôt qu'un rechargement complet.
function buildHeader(isHome, activeAnchor) {
    const prefix = isHome ? '' : 'index.html';

    const links = NAV_ITEMS.map(item => {
        const activeClass = (item.anchor === activeAnchor) ? ' active' : '';
        return `                <a href="${prefix}${item.anchor}" class="category-btn${activeClass}">${item.label}</a>`;
    }).join('\n');

    return `<header class="global-header">
        <div class="nav-container">
            <a href="${prefix}#presentation" class="home-btn">Perottino Tony</a>
            <nav class="categories-nav">
${links}
            </nav>
        </div>
    </header>`;
}

// Construit le code du pied de page.
function buildFooter() {
    const links = FOOTER_ITEMS.map(item => {
        const target = item.newTab ? ' target="_blank"' : '';
        const cssClass = item.cssClass ? ` class="${item.cssClass}"` : '';
        return `            <a href="${item.href}"${target}${cssClass}>${item.label}</a>`;
    }).join('\n');

    return `<footer class="main-footer">
        <div class="footer-links">
${links}
        </div>
        <p class="copyright">© ${COPYRIGHT_YEAR} Perottino Tony. Tous droits réservés.</p>
    </footer>`;
}

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    const isHome = (page === 'home');
    const activeAnchor = ACTIVE_ANCHOR_BY_PAGE[page] || '';

    const headerSlot = document.getElementById('site-header');
    if (headerSlot) {
        headerSlot.outerHTML = buildHeader(isHome, activeAnchor);
    }

    const footerSlot = document.getElementById('site-footer');
    if (footerSlot) {
        footerSlot.outerHTML = buildFooter();
    }
});

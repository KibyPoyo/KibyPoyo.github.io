/* ==========================================================================
   APP.JS - GESTION GLOBALE ET INITIALISATION
   ========================================================================== */

const BIRTH_DATE = "2005-04-01";

// Délai au-delà duquel on descend vers l'ancre même sans annonce de la frise.
const SCROLL_FALLBACK_DELAY_MS = 2000;

document.addEventListener("DOMContentLoaded", () => {
    loadPresentation();
    displayAge();
    initScrollObserver();
    initAnchorScroll();
});


// Descend vers l'ancre de l'URL dès que la frise annonce sa fin de construction,
// ou au plus tard après SCROLL_FALLBACK_DELAY_MS.
function initAnchorScroll() {
    if (!window.location.hash) return;

    let hasScrolled = false;

    const scrollToAnchor = () => {
        if (hasScrolled) return;
        hasScrolled = true;

        const target = document.getElementById(window.location.hash.slice(1));
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    document.addEventListener('parcours-pret', scrollToAnchor, { once: true });
    setTimeout(scrollToAnchor, SCROLL_FALLBACK_DELAY_MS);
}


async function loadPresentation() {
    const element = document.getElementById('presentation-text');
    if (!element) return;

    try {
        const response = await fetch('data/presentation.json');
        if (!response.ok) throw new Error("Impossible de récupérer presentation.json");

        const data = await response.json();
        element.textContent = data.presentation;

    } catch (error) {
        console.error("Erreur présentation :", error);
        element.textContent = "[ERREUR SYSTÈME] Échec du chargement de la présentation.";
    }
}


// Renvoie le nombre d'années révolues entre une date ISO et aujourd'hui.
function computeAge(isoDate) {
    const birth = new Date(isoDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}


// Injecte l'âge calculé dans le sous-titre de présentation.
function displayAge() {
    const element = document.getElementById('profile-age');
    if (element) {
        element.textContent = computeAge(BIRTH_DATE);
    }
}


// Met en surbrillance le lien de navigation de la section visible à l'écran.
function initScrollObserver() {
    const sections = document.querySelectorAll(".portfolio-section");
    const navButtons = document.querySelectorAll(".category-btn");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const id = entry.target.getAttribute("id");
            navButtons.forEach(btn => {
                btn.classList.toggle("active", btn.getAttribute("href") === `#${id}`);
            });
        });
    }, { rootMargin: "-20% 0px -60% 0px" });

    sections.forEach(section => observer.observe(section));
}

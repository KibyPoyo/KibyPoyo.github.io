/* ==========================================================================
   APP.JS - GESTION GLOBALE ET INITIALISATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    chargerPresentation();

    // Initialise la roue si l'élément existe
    if (typeof initWheel === 'function') {
        initWheel();
    }

    initScrollObserver();

    // Correctif pour le retour de page (ancre)
    if (window.location.hash) {
        setTimeout(() => {
            const cible = document.querySelector(window.location.hash);

            if (cible) {
                cible.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }, 300);
    }
});


async function chargerPresentation() {

    try {

        const response =
            await fetch('data/presentation.json');


        if (!response.ok) {
            throw new Error(
                "Impossible de récupérer presentation.json"
            );
        }


        const data =
            await response.json();


        const element =
            document.getElementById(
                'presentation-text'
            );


        if (element) {
            element.textContent =
                data.presentation;
        }

    } catch (error) {

        console.error(
            "Erreur présentation :",
            error
        );
    }
}


function initScrollObserver() {

    const sections =
        document.querySelectorAll(
            ".portfolio-section"
        );


    const navButtons =
        document.querySelectorAll(
            ".category-btn"
        );


    const observer =
        new IntersectionObserver(
            (entries) => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        const id =
                            entry.target.getAttribute(
                                "id"
                            );


                        navButtons.forEach(btn => {

                            btn.classList.toggle(
                                "active",
                                btn.getAttribute(
                                    "href"
                                ) === `#${id}`
                            );
                        });
                    }
                });

            },
            {
                rootMargin:
                    "-20% 0px -60% 0px"
            }
        );


    sections.forEach(
        section =>
            observer.observe(section)
    );
}
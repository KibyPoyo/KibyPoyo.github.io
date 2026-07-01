// ==========================================================================
// ⚙️ CONFIGURATION GLOBALE ET VARIABLES DE LA ROUE DES PROJETS
// ==========================================================================
let projects = []; // Rempli dynamiquement par projects.json
let currentIndex = 0;
let currentRotation = 0;
let totalItems = 0;
const anglePerItem = 60; 

const wheel = document.getElementById('wheel');
const titleElement = document.getElementById('project-title');
const descElement = document.getElementById('project-desc');
let slices; 

// ==========================================================================
// 📥 INITIALISATION GLOBALE AU CHARGEMENT DE LA PAGE
// ==========================================================================
// ==========================================================================
// 📥 INITIALISATION GLOBALE AU CHARGEMENT DE LA PAGE
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Chargement de la présentation textuelle (depuis data.json)
    chargerPresentation();

    // 2. Chargement et génération de la roue des projets (depuis projects.json)
    chargerProjets();

    // 3. Activation du suivi du menu au défilement (Scroll Observer)
    initScrollObserver();

    // 🛠️ NOUVEAU : CORRECTIF POUR LE RETOUR DE PAGE (DÉCALAGE ASYNCHRONE)
    // Si l'URL contient une ancre (comme #projets), on attend un tout petit instant
    // que le parcours et la roue soient injectés pour scroller au bon endroit.
    if (window.location.hash) {
        setTimeout(() => {
            const cible = document.querySelector(window.location.hash);
            if (cible) {
                cible.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 300); // 300ms de sursis pour laisser le HTML se déployer
    }
});

// ==========================================================================
// 📝 FONCTION : CHARGEMENT DYNAMIQUE DE LA PRÉSENTATION (data.json)
// ==========================================================================
async function chargerPresentation() {
    try {
        const response = await fetch('presentation.json');
        if (!response.ok) throw new Error("Impossible de récupérer data.json");
        
        const data = await response.json();
        const element = document.getElementById('presentation-text');
        
        if (element) {
            element.textContent = data.presentation;
        }
    } catch (error) {
        console.error("Erreur lors du chargement de la présentation :", error);
        const element = document.getElementById('presentation-text');
        if (element) {
            element.textContent = "Erreur de chargement de la description de présentation.";
        }
    }
}

// ==========================================================================
// 🎡 FONCTIONS : LOGIQUE ET ARCHITECTURE DE LA ROUE DES PROJETS
// ==========================================================================
function chargerProjets() {
    fetch('projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("Impossible de charger le fichier projects.json");
            }
            return response.json();
        })
        .then(data => {
            projects = data;
            totalItems = projects.length;

            generateWheel();
            updateText(currentIndex);
        })
        .catch(error => {
            console.error("Erreur lors du chargement des projets :", error);
            if (titleElement) titleElement.textContent = "Erreur de chargement";
            if (descElement) descElement.textContent = "Le fichier projects.json n'a pas pu être lu.";
        });
}

function generateWheel() {
    if (!wheel) return;

    projects.forEach((project, i) => {
        const slice = document.createElement('div');
        slice.className = 'slice'; 
        slice.style.backgroundColor = project.color; 
        
        slice.style.setProperty('--initial-angle', `${-i * anglePerItem}deg`);
        slice.innerHTML = `<span>P.${i + 1}</span>`; 
        
        // Navigation fluide via le clic sur les triangles de la roue
        slice.addEventListener('click', () => {
            let diff = i - currentIndex;
            if (diff > totalItems / 2) diff -= totalItems;
            if (diff < -totalItems / 2) diff += totalItems;

            if (diff === 0) {
                // 1. On génère l'identifiant propre du projet
                const snakeCaseTitle = project.title
                    .toLowerCase()
                    .trim()
                    .replace(/[\s\-]+/g, '_')  
                    .replace(/[^a-z0-9_]/g, ''); 
                
                // 2. MODIFICATION ICI : On redirige vers la page unique project.html
                window.location.href = `project.html?id=${snakeCaseTitle}`;
                
            } else if (Math.abs(diff) <= 2) {
                // Rotation de la roue pour amener le projet sélectionné sur la base du triangle
                currentRotation += diff * anglePerItem;
                currentIndex = (currentIndex + diff + totalItems) % totalItems;

                wheel.style.transform = `rotate(${currentRotation}deg)`;
                updateText(currentIndex);
            }
        });
        
        wheel.appendChild(slice);
    });

    slices = document.querySelectorAll('.slice');
}

function updateText(index) {
    if (projects.length === 0) return;

    if (titleElement) titleElement.textContent = projects[index].title;
    if (descElement) descElement.innerHTML = projects[index].desc; 
    
    // Modification optionnelle de la couleur des particules en fond d'écran
    if (window.changeBackgroundParticlesColor && projects[index].color) {
        window.changeBackgroundParticlesColor(projects[index].color);
    }
    
    // Gestion visuelle de l'affichage sélectif (Voisins visibles VS Projet actif)
    if (slices) {
        slices.forEach((slice, i) => {
            let diff = i - index;
            if (diff > totalItems / 2) diff -= totalItems;
            if (diff < -totalItems / 2) diff += totalItems;
            
            slice.classList.remove('active', 'visible');
            
            if (Math.abs(diff) <= 2) {
                slice.classList.add('visible');
                if (diff === 0) {
                    slice.classList.add('active');
                }
            }
        });
    }
}

// ==========================================================================
// 👁️ FONCTION : SYNCHRONISATION DU HEADER AU DÉFILEMENT (INTERSECTION OBSERVER)
// ==========================================================================
function initScrollObserver() {
    const sections = document.querySelectorAll(".portfolio-section");
    const navButtons = document.querySelectorAll(".category-btn");

    const observerOptions = {
        root: null,
        rootMargin: "-20% 0px -60% 0px", // Déclenchement précis au passage écran
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                
                navButtons.forEach(btn => {
                    if (btn.getAttribute("href") === `#${id}`) {
                        btn.classList.add("active");
                    } else {
                        btn.classList.remove("active");
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}
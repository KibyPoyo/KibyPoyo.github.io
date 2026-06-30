// Ton catalogue étendu à 12 projets pour tester la cache
const projects = [
    { title: "Projet 1 : E-Commerce", desc: "Plateforme marchande complète avec panier dynamique." },
    { title: "Projet 2 : Algorithmique Java", desc: "Optimisation de structures de données complexes." },
    { title: "Projet 3 : Mini-Jeu JS", desc: "Jeu de plateforme rétro développé en JavaScript natif." },
    { title: "Projet 4 : API RESTful", desc: "Backend sécurisé et robuste avec architecture MVC." },
    { title: "Projet 5 : UI Mobile", desc: "Design System complet et maquettage avancé sur Figma." },
    { title: "Projet 6 : Data Analytics", desc: "Analyse automatique de logs et graphiques Python." },
    { title: "Projet 7 : DevOps & Docker", desc: "Conteneurisation d'applications et pipelines CI/CD." },
    { title: "Projet 8 : Application Blockchain", desc: "Développement et déploiement d'un Smart Contract." },
    { title: "Projet 9 : Machine Learning", desc: "Modèle de classification d'images avec TensorFlow." },
    { title: "Projet 10 : Extension Navigateur", desc: "Outil de productivité pour bloquer les traqueurs." },
    { title: "Projet 11 : Audit SEO", desc: "Optimisation des performances et référencement Google." },
    { title: "Projet 12 : Automatisation Bash", desc: "Scripts de sauvegarde et gestion de serveurs Linux." }
];

let currentIndex = 0;
let currentRotation = 0;
const totalItems = projects.length;
const anglePerItem = 60; // On GARDE STRICTEMENT l'angle de 60° pour préserver les grandes parts

const wheel = document.getElementById('wheel');
const titleElement = document.getElementById('project-title');
const descElement = document.getElementById('project-desc');

// --- GÉNÉRATION DES TRIANGLES SUR LEURS ANGLES FIXES ---
projects.forEach((project, i) => {
    const slice = document.createElement('div');
    const colorNumber = (i % 6) + 1;
    slice.className = `slice color-${colorNumber}`;
    
    // Chaque triangle se voit attribuer un emplacement fixe espacé de 60°
    slice.style.setProperty('--initial-angle', `${i * anglePerItem}deg`);
    slice.innerHTML = `<span>Projet ${i + 1}</span>`;
    
    wheel.appendChild(slice);
});

const slices = document.querySelectorAll('.slice');

// --- LOGIQUE DE SÉLECTION ET FILTRAGE DES 5 VISIBLES ---
function updateText(index) {
    titleElement.textContent = projects[index].title;
    descElement.textContent = projects[index].desc;
    
    slices.forEach((slice, i) => {
        // Calcul de la distance cyclique (plus court chemin) dans le tableau
        let diff = i - index;
        if (diff > totalItems / 2) diff -= totalItems;
        if (diff < -totalItems / 2) diff += totalItems;
        
        // Nettoyage des états précédents
        slice.classList.remove('active', 'visible');
        
        // FILTRE MAGIQUE : On affiche uniquement l'élément central (0), les 2 à droite (1, 2) et les 2 à gauche (-1, -2)
        if (Math.abs(diff) <= 2) {
            slice.classList.add('visible');
            
            // Si c'est l'élément pile au centre (0), il devient GROS
            if (diff === 0) {
                slice.classList.add('active');
            }
        }
    });
}

function rotateWheel(direction) {
    if (direction === 'right') {
        currentRotation -= anglePerItem; // Pivot anti-horaire
        currentIndex = (currentIndex + 1) % totalItems;
    } else if (direction === 'left') {
        currentRotation += anglePerItem; // Pivot horaire
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
    }

    // On fait tourner la roue entière
    wheel.style.transform = `rotate(${currentRotation}deg)`;
    updateText(currentIndex);
}

// Premier lancement au chargement
updateText(currentIndex);
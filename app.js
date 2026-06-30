// Les 12 projets convertis en placeholders cleans
const projects = [
    { title: "Projet 1", desc: "Le site est en cours de création :)", color: "#3498db" },     // Bleu
    { title: "Projet 2", desc: "Description à faire. Beaucoup de texte. Beaucoup de texte. Beaucoup de texte. Beaucoup de texte. Beaucoup de texte. Beaucoup de texte.", color: "#9b59b6" },     // Violet
    { title: "Projet 3", desc: "Description à faire.", color: "#e74c3c" },     // Rouge
    { title: "Projet 4", desc: "Description à faire.", color: "#1abc9c" },     // Turquoise
    { title: "Projet 5", desc: "Description à faire.", color: "#f1c40f" },     // Jaune
    { title: "Projet 6", desc: "Description à faire.", color: "#e67e22" },     // Orange
    { title: "Projet 7", desc: "Description à faire.", color: "#2ecc71" },     // Vert
    { title: "Projet 8", desc: "Description à faire.", color: "#95a5a6" },     // Gris
    { title: "Projet 9", desc: "Description à faire.", color: "#34495e" },     // Bleu nuit
    { title: "Projet 10", desc: "Description à faire.", color: "#d35400" },    // Terre cuite
    { title: "Projet 11", desc: "Description à faire.", color: "#8e44ad" },    // Violet foncé
    { title: "Projet 12", desc: "Description à faire.", color: "#27ae60" }     // Vert sapin
];

let currentIndex = 0;
let currentRotation = 0;
const totalItems = projects.length;
const anglePerItem = 60; 

const wheel = document.getElementById('wheel');
const titleElement = document.getElementById('project-title');
const descElement = document.getElementById('project-desc');

// --- GÉNÉRATION DYNAMIQUE DE LA ROUE ---
projects.forEach((project, i) => {
    const slice = document.createElement('div');
    slice.className = 'slice'; 
    slice.style.backgroundColor = project.color; 
    
    slice.style.setProperty('--initial-angle', `${i * anglePerItem}deg`);
    slice.innerHTML = `<span>P.${i + 1}</span>`; 
    
    wheel.appendChild(slice);
});

const slices = document.querySelectorAll('.slice');

// --- LOGIQUE DE MISE À POUR ---
function updateText(index) {
    titleElement.textContent = projects[index].title;
    descElement.textContent = projects[index].desc;
    
    if (window.changeBackgroundParticlesColor && projects[index].color) {
        window.changeBackgroundParticlesColor(projects[index].color);
    }
    
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

function rotateWheel(direction) {
    if (direction === 'right') {
        currentRotation -= anglePerItem; 
        currentIndex = (currentIndex + 1) % totalItems;
    } else if (direction === 'left') {
        currentRotation += anglePerItem; 
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
    }

    wheel.style.transform = `rotate(${currentRotation}deg)`;
    updateText(currentIndex);
}

// Lancement au chargement
updateText(currentIndex);
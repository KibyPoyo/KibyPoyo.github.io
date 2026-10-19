/* ==========================================================================
   PROJECTS.JS - PAGE DE DÉTAIL D'UN PROJET
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // N'agit que sur la page de détail d'un projet
    const titleContainer = document.getElementById('dynamic-project-title');
    if (!titleContainer) return; 

    // 1. Identifiant du projet lu dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        showError("Aucun projet spécifié.");
        return;
    }

    // 2. Chargement du fichier JSON
    fetch('data/projects.json') 
        .then(response => {
            if (!response.ok) throw new Error("Erreur de chargement du fichier JSON");
            return response.json();
        })
        .then(projects => {
            const activeProject = projects.find(p => {
                // Même transformation que dans wheel.js, accents compris
                const slug = p.title
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase()
                    .trim()
                    .replace(/['\u2019\s\-]+/g, '_')
                    .replace(/[^a-z0-9_]/g, '')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');
                return slug === projectId;
            });

            if (activeProject) {
                // 3. Injection des données principales
                document.title = `${activeProject.title} - Perottino Tony`;
                titleContainer.textContent = activeProject.title;

                const subtitleElement = document.getElementById('dynamic-project-subtitle');
                if (activeProject.subtitle && activeProject.date) {
                    subtitleElement.textContent = `${activeProject.subtitle} - ${activeProject.date}`;
                } else {
                    // Repli si l'un des deux manque dans le JSON
                    subtitleElement.textContent = activeProject.subtitle || activeProject.date || "Spécification technique";
                }

                const descElement = document.getElementById('dynamic-project-desc');
                descElement.innerHTML = activeProject.long_desc || activeProject.short_desc || "Aucune description disponible.";

                // 4. Couleur des billes/particules en arrière-plan
                if (window.changeBackgroundParticlesColor && activeProject.color) {
                    window.changeBackgroundParticlesColor(activeProject.color);
                }
            } else {
                showError("Projet introuvable dans la base de données.");
            }
        })
        .catch(error => {
            console.error(error);
            showError("Échec de la synchronisation avec le protocole Projets.");
        });
});

function showError(message) {
    const title = document.getElementById('dynamic-project-title');
    const subtitle = document.getElementById('dynamic-project-subtitle');
    const desc = document.getElementById('dynamic-project-desc');
    
    if (title) title.textContent = "[ERREUR 404]";
    if (subtitle) subtitle.textContent = "Accès refusé ou ressource inexistante";
    if (desc) desc.innerHTML = `<p class="error-message">${message}</p>`;
}
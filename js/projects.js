/* ==========================================================================
   PROJECTS.JS - LOGIQUE DÉTAIL PROJET (AVEC SOUS-TITRE, DATE & LONG_DESC)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Sécurité : On vérifie si on est bien sur la page de détail
    const titleContainer = document.getElementById('dynamic-project-title');
    if (!titleContainer) return; 

    // 1. On récupère l'identifiant du projet dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        afficherErreur("Aucun projet spécifié.");
        return;
    }

    // 2. Chargement du fichier JSON
    fetch('data/projects.json') 
        .then(response => {
            if (!response.ok) throw new Error("Erreur de chargement du fichier JSON");
            return response.json();
        })
        .then(projects => {
            const projetActif = projects.find(p => {
                const slug = p.title
                    .toLowerCase()
                    .trim()
                    .replace(/[\s\-]+/g, '_')  
                    .replace(/[^a-z0-9_]/g, '');
                return slug === projectId;
            });

            if (projetActif) {
                // 3. Injection des données principales
                document.title = `${projetActif.title} - Perottino Tony`;
                titleContainer.textContent = projetActif.title;

                // --- ADAPTATION : GESTION DU SOUS-TITRE ET DE LA DATE ---
                const subtitleElement = document.getElementById('dynamic-project-subtitle');
                if (projetActif.subtitle && projetActif.date) {
                    // Si le sous-titre ET la date existent, on les sépare par un tiret
                    subtitleElement.textContent = `${projetActif.subtitle} - ${projetActif.date}`;
                } else {
                    // Repli de sécurité si l'un des deux est manquant dans le JSON
                    subtitleElement.textContent = projetActif.subtitle || projetActif.date || "Spécification technique";
                }

                // --- ADAPTATION : CORRECTION DU CHEMIN DE DESCRIPTION (long_desc) ---
                const descElement = document.getElementById('dynamic-project-desc');
                descElement.innerHTML = projetActif.long_desc || projetActif.short_desc || "Aucune description disponible.";

                // 4. Couleur des billes/particules en arrière-plan
                if (window.changeBackgroundParticlesColor && projetActif.color) {
                    setTimeout(() => {
                        window.changeBackgroundParticlesColor(projetActif.color);
                    }, 50);
                }
            } else {
                afficherErreur("Projet introuvable dans la base de données.");
            }
        })
        .catch(error => {
            console.error(error);
            afficherErreur("Échec de la synchronisation avec le protocole Projets.");
        });
});

function afficherErreur(message) {
    const title = document.getElementById('dynamic-project-title');
    const sub = document.getElementById('dynamic-project-subtitle');
    const desc = document.getElementById('dynamic-project-desc');
    
    if (title) title.textContent = "[ERREUR 404]";
    if (sub) sub.textContent = "Accès refusé ou ressource inexistante";
    if (desc) desc.innerHTML = `<p style="color: #ff4a4a;">${message}</p>`;
}
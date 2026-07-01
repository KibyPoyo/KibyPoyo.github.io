document.addEventListener("DOMContentLoaded", () => {
    // 1. On récupère l'identifiant du projet dans l'URL (?id=mon_projet)
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        afficherErreur("Aucun projet spécifié.");
        return;
    }

    // 2. On charge ton fichier de données existant
    fetch('projects.json')
        .then(response => {
            if (!response.ok) throw new Error("Erreur de chargement du fichier JSON");
            return response.json();
        })
        .then(projects => {
            // On cherche le projet dont le titre converti correspond à l'ID de l'URL
            const projetActif = projects.find(p => {
                const slug = p.title
                    .toLowerCase()
                    .trim()
                    .replace(/[\s\-]+/g, '_')  
                    .replace(/[^a-z0-9_]/g, '');
                return slug === projectId;
            });

            if (projetActif) {
                // 3. Injection des données dans le HTML
                document.title = `${projetActif.title} - Perottino Tony`;
                document.getElementById('dynamic-project-title').textContent = projetActif.title;
                document.getElementById('dynamic-project-subtitle').textContent = `Spécification technique`;
                document.getElementById('dynamic-project-desc').innerHTML = projetActif.desc;

                // 4. On change la couleur des billes en fond avec la couleur du projet !
                if (window.changeBackgroundParticlesColor && projetActif.color) {
                    // Petit délai pour laisser le canvas s'initialiser proprement
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
    document.getElementById('dynamic-project-title').textContent = "[ERREUR 404]";
    document.getElementById('dynamic-project-subtitle').textContent = "Accès refusé ou ressource inexistante";
    document.getElementById('dynamic-project-desc').innerHTML = `<p style="color: #ff4a4a;">${message}</p>`;
}
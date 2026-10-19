/* ==========================================================================
    EFFECT.JS - GESTION DES EASTER EGGS ET DU PROJET SECRET

    Contrainte de chargement : ce fichier remplace window.fetch dès son
    exécution. projects.js et wheel.js ne lisent projects.json qu'au
    DOMContentLoaded ; il suffit donc que ce fichier soit un script classique,
    sans async, exécuté avant cet événement. Sa place parmi les balises
    <script> est indifférente. Sinon, project.html?id=audace affiche
    "Projet introuvable" sans aucune erreur en console.
    ========================================================================== */

// Interception immédiate du fetch pour simuler le projet secret "audace"
const originalFetch = window.fetch;
window.fetch = async function(url, options) {
    if (typeof url === 'string' && url.includes('projects.json')) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('id') === 'audace') {
            const secretProject = [{
                title: "Audace",
                subtitle: "La compétence cachée parmi les compétences",
                date: "",
                short_desc: "",
                long_desc: "T'es arrivé au bout de l'easter egg, j'espère que l'idée t'a plu.<br><br>Je vous propose une petite réflexion de ma concoction, à lire attentivement : \"Que préférez vous entre la curiosité et l'audace ? Réfléchissez y. Si vous préférez la curiosité, vous avez dû faire un choix et renoncer à l'audace : or renoncer implique de perdre le désir de savoir ce que le choix de l'audace produit. Si vous avez choisi l'audace, c'était sans doute un mauvais choix : l'audace elle-même ne se serait pas choisie car cela est conventionnel. L'audace aurait renoncé au choix, ou bien cherché à choisir les deux, voire aucun ! puisque l'absence de choix est un choix en soi. Alors que faut-il choisir entre curiosité et audace ? Probablement de ne pas lire cette réflexion, car en dépit d'avoir répondu à cette question, je t'ai volé 1 minute de ta vie.\" Et si tu te demandes pourquoi ce texte abstrait continue, c'est pour noyer le poisson et éviter que tu n'ailles lire la fin trop vite : tu cherchais une compétence cachée ? Tu croyais que c'était l'audace ? Et bien tu t'es trompé : c'est la bêtise ! Ou l'humour, au choix.<br><br>Prends cette réflexion comme ta récompense à être parvenu à trouver cette page !",
                color: "#f0b756"
            }];
            return new Response(JSON.stringify(secretProject), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    return originalFetch.apply(this, arguments);
};

document.addEventListener('DOMContentLoaded', () => {
    // Mots secrets et leur révélation
    const textSecrets = [
        { id: 'secret-curiosité', target: 'curiosité', replacement: 'audace' },
        { id: 'secret-outils', target: 'outils', replacement: 'Clavier' },
        { id: 'secret-infos', target: 'informations', replacement: 'u mot' }
    ];

    // Remplace le mot secret par sa révélation, en ambre.
    const revealSecret = (element, secret) => {
        element.textContent = secret.replacement;
        element.style.transition = "all 0.5s ease";
        element.style.color = "var(--color-egg)";
    };

    // 1. Activation par sélection de texte (mouseup)
    document.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim().toLowerCase();

        textSecrets.forEach(secret => {
            const targetElement = document.getElementById(secret.id);
            if (targetElement && selectedText === secret.target.toLowerCase() && targetElement.contains(selection.anchorNode)) {
                revealSecret(targetElement, secret);
                selection.removeAllRanges();
            }
        });
    });

    // 2. Activation par double-clic (dblclick)
    textSecrets.forEach(secret => {
        const targetElement = document.getElementById(secret.id);
        if (targetElement) {
            targetElement.addEventListener('dblclick', () => revealSecret(targetElement, secret));
        }
    });

    // 3. Détection du mot tapé au clavier : "audace"
    const secretCode = "audace";
    let typedKeys = "";

    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

        typedKeys += e.key.toLowerCase();

        if (typedKeys.length > secretCode.length) {
            typedKeys = typedKeys.slice(-secretCode.length);
        }

        if (typedKeys === secretCode) {
            window.location.href = 'project.html?id=audace';
        }
    });
});
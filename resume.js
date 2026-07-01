// --- CONFIGURATION DE L'EFFET DE CRYPTAGE / DÉCRYPTAGE & ANIMATIONS ---
const CRYPTO_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?";
const SCRAMBLE_SPEED_MS = 32;       // Vitesse de mutation ambiante (texte rouge fermé)
const DECRYPT_SPEED_MS = 25;        // Vitesse d'animation de décryptage/recryptage (texte vert)
const VIRUS_ANIM_SPEED_MS = 1000;   // ⏱️ CADENCE DE L'ANIMATION SACCADÉE DU VIRUS (1000ms = 1s)

// 📥 ÉTAPE 1 : ÉCOUTEUR AU CHARGEMENT DE LA PAGE
document.addEventListener('DOMContentLoaded', () => {
    chargerEtBatirParcours();
});

// 🛠️ ÉTAPE 2 : RECUPÉRATION DU JSON ET INJECTION DANS LE HTML
async function chargerEtBatirParcours() {
    try {
        const response = await fetch('resume.json');
        if (!response.ok) throw new Error("Impossible de charger le fichier resume.json");
        
        const data = await response.json();
        const container = document.getElementById('timeline-container');
        
        if (!container) return;
        container.innerHTML = ""; // On efface le texte de chargement

        // On rebâtit les rangées
        data.forEach((item) => {
            const row = document.createElement('div');
            row.className = `timeline-row ${item.side}`;

            const paragraphsHTML = item.paragraphs
                .map(para => `<p>${para}</p>`)
                .join('');

            // Le HTML structurel (sans le onclick inline qui buggait)
            row.innerHTML = `
                <div class="timeline-item-container" style="cursor: pointer;">
                    <div class="timeline-header-band">
                        <div class="timeline-meta">
                            <span class="${item.badgeClass}">${item.badgeText}</span>
                            <span class="timeline-date">${item.date}</span>
                        </div>
                        <h3>${item.title}</h3>
                        <span class="timeline-institution">${item.institution}</span>
                        <span class="toggle-arrow">▼</span>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-content-inner">
                            ${paragraphsHTML}
                        </div>
                    </div>
                </div>
            `;

            // 🎯 LA CORRECTION : On attache l'événement proprement en pur JavaScript
            const itemContainer = row.querySelector('.timeline-item-container');
            itemContainer.addEventListener('click', (event) => {
                // Sécurité : si on clique sur le texte déplié (pour le surligner par ex), on ne referme pas.
                if (event.target.closest('.timeline-content-inner')) {
                    return; 
                }
                // Sinon, on lance le toggle !
                toggleTimeline(itemContainer);
            });

            container.appendChild(row);
        });

        // 🚀 ÉTAPE 3 : Initialisation des effets cyberpunk
        initialiserVirusEtCryptage();

    } catch (error) {
        console.error("Erreur lors de la génération de la frise chronologique :", error);
        const container = document.getElementById('timeline-container');
        if (container) {
            container.innerHTML = `<p style="text-align: center; color: #ff4a4a;">[ERREUR SYSTÈME] Échec du chargement du protocole Parcours.</p>`;
        }
    }
}

// 👾 ÉTAPE 4 : EFFETS VISUELS ET BOUCLES D'ANIMATIONS
function initialiserVirusEtCryptage() {
    const items = document.querySelectorAll('.timeline-item-container');
    
    items.forEach((item, index) => {
        const sideClass = (index % 2 === 0) ? 'virus-left' : 'virus-right';

        const virusSvg = `
            <svg class="timeline-virus ${sideClass}" viewBox="0 0 11 8" xmlns="http://www.w3.org/2000/svg">
                <path d="M2,0h1v1h-1V0z M8,0h1v1h-1V0z M3,1h1v1h-1V1z M7,1h1v1h-1V1z M2,2h7v1H2V2z M1,3h2v1H1V3z M4,3h3v1H4V3z M8,3h2v1H8V3z M0,4h11v1H0V4z M0,5h1v1H0V5z M2,5h7v1H2V5z M10,5h1v1h-1V5z M0,6h1v1H0V6z M2,6h1v1H2V6z M8,6h1v1H8V6z M10,6h1v1h-1V6z M3,7h2v1H3V7z M6,7h2v1H6V7z"/>
            </svg>
        `;

        item.insertAdjacentHTML('beforeend', virusSvg);

        const paragraphs = item.querySelectorAll('.timeline-content p');
        paragraphs.forEach(p => {
            p.dataset.originalHtml = p.innerHTML;
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = p.innerHTML;
            const realText = tempDiv.textContent;
            p.dataset.originalText = realText;

            let initialScramble = "";
            for (let i = 0; i < realText.length; i++) {
                if (realText[i] === " " || realText[i] === "\n") {
                    initialScramble += realText[i];
                } else {
                    initialScramble += CRYPTO_CHARS.charAt(Math.floor(Math.random() * CRYPTO_CHARS.length));
                }
            }
            p.textContent = initialScramble;
        });
    });

    setInterval(() => {
        const viruses = document.querySelectorAll('.timeline-virus');
        viruses.forEach(virus => {
            const randomAngle = Math.floor(Math.random() * 91) - 45;
            virus.style.setProperty('--virus-angle', `${randomAngle}deg`);
        });
    }, VIRUS_ANIM_SPEED_MS);

    setInterval(scrambleClosedTabs, SCRAMBLE_SPEED_MS);
}

function scrambleClosedTabs() {
    const closedItems = document.querySelectorAll('.timeline-item-container:not(.open)');
    
    closedItems.forEach(item => {
        if (item.dataset.isAnimating === "true") return;

        const paragraphs = item.querySelectorAll('.timeline-content p');
        paragraphs.forEach(p => {
            const realText = p.dataset.originalText;
            if (!realText) return;

            let currentText = p.textContent;
            let textArray = currentText.split("");
            let randIndex = Math.floor(Math.random() * realText.length);
            
            if (realText[randIndex] !== " " && realText[randIndex] !== "\n") {
                textArray[randIndex] = CRYPTO_CHARS.charAt(Math.floor(Math.random() * CRYPTO_CHARS.length));
            }
            
            p.textContent = textArray.join("");
        });
    });
}

function toggleTimeline(container) {
    const isOpen = container.classList.toggle('open');
    const paragraphs = container.querySelectorAll('.timeline-content p');

    container.dataset.isAnimating = "true";

    paragraphs.forEach(p => {
        const realText = p.dataset.originalText;
        const originalHtml = p.dataset.originalHtml;
        
        if (p.cryptoInterval) clearInterval(p.cryptoInterval);

        let validIndices = [];
        for (let i = 0; i < realText.length; i++) {
            if (realText[i] !== " " && realText[i] !== "\n") {
                validIndices.push(i);
            }
        }

        let assignedOrder = validIndices.sort(() => Math.random() - 0.5);
        let countPerTick = Math.ceil(validIndices.length / 15); 

        if (isOpen) {
            let currentTextArray = p.textContent.split("");

            p.cryptoInterval = setInterval(() => {
                for (let i = 0; i < countPerTick; i++) {
                    if (assignedOrder.length > 0) {
                        let targetIndex = assignedOrder.pop();
                        currentTextArray[targetIndex] = realText[targetIndex];
                    }
                }

                p.textContent = currentTextArray.join("");

                if (assignedOrder.length === 0) {
                    clearInterval(p.cryptoInterval);
                    p.innerHTML = originalHtml;
                    container.dataset.isAnimating = "false";
                }
            }, DECRYPT_SPEED_MS);

        } else {
            p.textContent = realText; 
            let currentTextArray = realText.split("");

            p.cryptoInterval = setInterval(() => {
                for (let i = 0; i < countPerTick; i++) {
                    if (assignedOrder.length > 0) {
                        let targetIndex = assignedOrder.pop();
                        currentTextArray[targetIndex] = CRYPTO_CHARS.charAt(Math.floor(Math.random() * CRYPTO_CHARS.length));
                    }
                }

                p.textContent = currentTextArray.join("");

                if (assignedOrder.length === 0) {
                    clearInterval(p.cryptoInterval);
                    container.dataset.isAnimating = "false";
                }
            }, DECRYPT_SPEED_MS);
        }
    });
}
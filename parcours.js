// --- CONFIGURATION DE L'EFFET DE CRYPTAGE / DÉCRYPTAGE & ANIMATIONS ---
const CRYPTO_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?";
const SCRAMBLE_SPEED_MS = 32;       // Vitesse de mutation ambiante (texte rouge fermé)
const DECRYPT_SPEED_MS = 25;        // Vitesse d'animation de décryptage/recryptage (texte vert)
const VIRUS_ANIM_SPEED_MS = 1000;   // ⏱️ CADENCE DE L'ANIMATION SACCADÉE DU VIRUS (1000ms = 1s)

document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.timeline-item-container');
    
    items.forEach((item, index) => {
        // Alternance sécurisée : index pair = gauche, index impair = droite
        const sideClass = (index % 2 === 0) ? 'virus-left' : 'virus-right';

        // Dessin en Pixel Art du Space Invader (SVG ultra-net)
        const virusSvg = `
            <svg class="timeline-virus ${sideClass}" viewBox="0 0 11 8" xmlns="http://www.w3.org/2000/svg">
                <path d="M2,0h1v1h-1V0z M8,0h1v1h-1V0z M3,1h1v1h-1V1z M7,1h1v1h-1V1z M2,2h7v1H2V2z M1,3h2v1H1V3z M4,3h3v1H4V3z M8,3h2v1H8V3z M0,4h11v1H0V4z M0,5h1v1H0V5z M2,5h7v1H2V5z M10,5h1v1h-1V5z M0,6h1v1H0V6z M2,6h1v1H2V6z M8,6h1v1H8V6z M10,6h1v1h-1V6z M3,7h2v1H3V7z M6,7h2v1H6V7z"/>
            </svg>
        `;

        // Injection du virus dans le conteneur
        item.insertAdjacentHTML('beforeend', virusSvg);

        const paragraphs = item.querySelectorAll('.timeline-content p');
        paragraphs.forEach(p => {
            p.dataset.originalHtml = p.innerHTML;
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = p.innerHTML;
            const realText = tempDiv.textContent;
            p.dataset.originalText = realText;

            // Cryptage INSTANTANÉ au chargement
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

    // 👾 ANIMATION DE ROTATION ALÉATOIRE ET SACCADÉE (-45° à 45°)
    setInterval(() => {
        const viruses = document.querySelectorAll('.timeline-virus');
        viruses.forEach(virus => {
            // Calcule un angle entier aléatoire entre -45 et 45
            const randomAngle = Math.floor(Math.random() * 91) - 45;
            // On injecte l'angle directement dans la variable CSS du virus
            virus.style.setProperty('--virus-angle', `${randomAngle}deg`);
        });
    }, VIRUS_ANIM_SPEED_MS);

    setInterval(scrambleClosedTabs, SCRAMBLE_SPEED_MS);
});

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

function toggleTimeline(element) {
    const container = element.parentElement;
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
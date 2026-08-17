/* ==========================================================================
   WHEEL.JS - LOGIQUE LINÉAIRE, CARRÉ & LETTER-SPACING SANS FADE
   ========================================================================== */

let projects = [];
let totalProjects = 0;
let currentIndex = 0;
let isAnimating = false;

const ANGLE_PER_SLOT = 60;
const ANIMATION_DURATION = 600; // Durée fixe de l'animation en millisecondes (0.6 seconde)
const ACTIVE_SCALE = 1.3;        // Facteur d'agrandissement pour le triangle actif (en bas)
const TEXT_STRETCH_SCALE = 1.15; // Constante pour accentuer l'effet d'étirement horizontal

/* ==========================================================================
   CONFIGURATION CENTRALE DES SLOTS (SCALABLE)
   ========================================================================== */
const SLOTS_CONFIG = {
    0: { name: 'Bas',         angle: 0,   diff: 0,  isHidden: false, clickable: true  }, // Slot actif (plus gros et cliquable vers une page)
    1: { name: 'Bas-gauche',   angle: 60,  diff: -1, isHidden: false, clickable: true  },
    2: { name: 'Haut-gauche',  angle: 120, diff: -2, isHidden: false, clickable: true  },
    3: { name: 'Haut',         angle: 180, diff: 3,  isHidden: true,  clickable: false }, // Slot caché / sommet
    4: { name: 'Haut-droite',  angle: 240, diff: 2,  isHidden: false, clickable: true  },
    5: { name: 'Bas-droite',   angle: 300, diff: 1,  isHidden: false, clickable: true  }
};

const TOTAL_SLOTS = Object.keys(SLOTS_CONFIG).length;
const ACTIVE_SLOTS_ORDER = [2, 1, 0, 5, 4];

const wheel = document.getElementById('wheel');
const titleElement = document.getElementById('project-title');
const descElement = document.getElementById('project-desc');

let activeSlices = [];

const getIndex = i =>
    ((i % totalProjects) + totalProjects) % totalProjects;


/* ==========================================================================
   CALCUL DYNAMIQUE CUBIC-BEZIER & CONSTANTE OPTIMISÉE
   ========================================================================== */

function getCubicBezierTime(targetY, x1, y1, x2, y2) {
    let u = targetY;
    for (let i = 0; i < 15; i++) {
        const currentY = 3 * Math.pow(1 - u, 2) * u * y1 + 3 * (1 - u) * Math.pow(u, 2) * y2 + Math.pow(u, 3);
        const derivativeY = 3 * (1 - u) * (1 - 3 * u) * y1 + 3 * u * (2 - 3 * u) * y2 + 3 * u * u;
        
        if (Math.abs(currentY - targetY) < 1e-7) break;
        if (Math.abs(derivativeY) < 1e-7) break;
        
        u -= (currentY - targetY) / derivativeY;
        u = Math.max(0, Math.min(1, u));
    }
    return 3 * Math.pow(1 - u, 2) * u * x1 + 3 * (1 - u) * Math.pow(u, 2) * x2 + Math.pow(u, 3);
}

// Constante pré-calculée pour le mitan (fraction 0.5) avec cubic-bezier(0.25, 1, 0.5, 1)
const BEZIER_HALF_TIME = getCubicBezierTime(0.5, 0.25, 1, 0.5, 1);


/* ==========================================================================
   CALCUL DES PROJETS & NAVIGATION
   ========================================================================== */

function getProjectIndex(slotIndex, baseIndex) {
    const slot = SLOTS_CONFIG[slotIndex];
    if (!slot) return baseIndex;
    return getIndex(baseIndex + slot.diff);
}

function openCurrentProject() {
    if (!projects.length) return;
    const currentProj = projects[currentIndex];
    if (!currentProj) return;

    if (currentProj.link) {
        window.location.href = currentProj.link;
        return;
    }

    const id = currentProj.title
        .toLowerCase()
        .trim()
        .replace(/[\s\-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    window.location.href = `project.html?id=${id}`;
}


/* ==========================================================================
   INITIALISATION GLOBALE
   ========================================================================== */

function initWheel() {
    fetch('data/projects.json')
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
            projects = data;
            totalProjects = data.length;
            currentIndex = 0;

            renderWheelInstant();
        })
        .catch(err =>
            console.error('Erreur chargement projets :', err)
        );
}


/* ==========================================================================
   FABRICATION D'UN TRIANGLE
   ========================================================================== */

function createSliceElement(slotIndex, project) {
    const sliceElement = document.createElement('div');
    sliceElement.className = 'slice visible';
    sliceElement.innerHTML = '<span></span>';
    applySliceContent(sliceElement, project);

    const slotConfig = SLOTS_CONFIG[slotIndex];
    const isActive = (slotIndex === 0);

    sliceElement.classList.toggle('active', isActive);
    sliceElement.style.zIndex = isActive ? '5' : '2';

    sliceElement.addEventListener('click', e => {
        e.stopPropagation();
        if (isAnimating) return;

        // Si c'est le triangle du bas (Slot 0, actif), redirection vers la page projet
        if (slotIndex === 0) {
            openCurrentProject();
            return;
        }

        if (!slotConfig.clickable) return;

        let steps = slotConfig.diff;
        rotateBy(steps);
    });

    return sliceElement;
}


/* ==========================================================================
   RENDU INSTANTANÉ (INITIALISATION)
   ========================================================================== */

function renderWheelInstant() {
    if (!totalProjects) return;

    wheel.innerHTML = '';
    activeSlices = [];

    ACTIVE_SLOTS_ORDER.forEach(slotIndex => {
        const projectIndex = getProjectIndex(slotIndex, currentIndex);
        const project = projects[projectIndex];
        const sliceElement = createSliceElement(slotIndex, project);
        const slotConfig = SLOTS_CONFIG[slotIndex];

        const scale = (slotIndex === 0) ? ` scale(${ACTIVE_SCALE})` : '';
        sliceElement.style.transform = `rotate(${slotConfig.angle}deg)${scale}`;
        sliceElement.style.transition = 'none';
        sliceElement.style.opacity = '1';

        wheel.appendChild(sliceElement);

        activeSlices.push({
            element: sliceElement,
            slotIndex: slotIndex,
            projectIndex: projectIndex
        });
    });

    updateTextDescription(currentIndex, false);
}

function applySliceContent(sliceElement, project) {
    if (!project) return;
    sliceElement.style.backgroundColor = project.color;

    if (sliceElement.dataset.projectTitle === project.title)
        return;

    sliceElement.dataset.projectTitle = project.title;

    const span = sliceElement.querySelector('span');

    if (span) {
        span.innerText = project.title;
        wrapTextIntoTriangle(sliceElement);
    }
}


/* ==========================================================================
   DESCRIPTION & ANIMATION OPTIMISÉE (SANS FADE & SANS LAG)
   ========================================================================== */

function updateTextDescription(index, animate = true) {
    if (!totalProjects) return;

    const project = projects[index];
    const subtitle = document.getElementById('project-subtitle');
    const elementsToAnimate = [titleElement, subtitle, descElement].filter(Boolean);

    if (!animate) {
        if (titleElement) titleElement.textContent = project.title;
        if (subtitle) {
            subtitle.textContent = project.subtitle
                ? `${project.subtitle} - ${project.date || ''}`
                : project.date || '';
        }
        if (descElement) descElement.innerHTML = project.short_desc;
        if (window.changeBackgroundParticlesColor && project.color) {
            window.changeBackgroundParticlesColor(project.color);
        }
        return;
    }

    // Phase 1 : Expansion horizontale accentuée et réduction (GPU)
    elementsToAnimate.forEach(el => {
        el.style.transition = 'transform 300ms cubic-bezier(0.25, 1, 0.5, 1)';
        el.style.opacity = '1';
        el.style.transform = `scaleX(${TEXT_STRETCH_SCALE}) scale(0.95)`;
    });

    // Phase 2 : Mise à jour du contenu au milieu et retour à la normale
    setTimeout(() => {
        if (titleElement)
            titleElement.textContent = project.title;

        if (subtitle) {
            subtitle.textContent = project.subtitle
                ? `${project.subtitle} - ${project.date || ''}`
                : project.date || '';
        }

        if (descElement)
            descElement.innerHTML = project.short_desc;

        elementsToAnimate.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'scaleX(1) scale(1)';
        });
    }, 300);

    if (window.changeBackgroundParticlesColor && project.color) {
        window.changeBackgroundParticlesColor(project.color);
    }
}

function animateSliceTextsTransition(nextIndex) {
    // Phase 1 : Expansion horizontale accentuée des lignes dans les triangles (GPU)
    activeSlices.forEach(sliceObj => {
        const span = sliceObj.element.querySelector('span');
        if (span) {
            const lineDivs = span.querySelectorAll('div');
            lineDivs.forEach(div => {
                div.style.transition = 'transform 300ms cubic-bezier(0.25, 1, 0.5, 1)';
                div.style.opacity = '1';
                div.style.transform = `scaleX(${TEXT_STRETCH_SCALE}) scale(0.90)`;
            });
        }
    });

    // Phase 2 : Mise à jour et retour à la normale au milieu de l'animation
    setTimeout(() => {
        activeSlices.forEach(sliceObj => {
            const newProjIndex = getProjectIndex(sliceObj.slotIndex, nextIndex);
            const newProj = projects[newProjIndex];
            if (newProj) {
                applySliceContent(sliceObj.element, newProj);
                sliceObj.projectIndex = newProjIndex;
            }
            const span = sliceObj.element.querySelector('span');
            if (span) {
                const lineDivs = span.querySelectorAll('div');
                lineDivs.forEach(div => {
                    div.style.opacity = '1';
                    div.style.transform = 'scaleX(1) scale(1)';
                });
            }
        });
    }, 300);
}


/* ==========================================================================
   GESTION DES MOUVEMENTS & TIMINGS
   ========================================================================== */

function assign_movements(steps) {
    const nextIndex = getIndex(currentIndex + steps);
    const absSteps = Math.abs(steps);
    const maxDuration = ANIMATION_DURATION; // Durée fixe globale

    let persistingSlices = [];
    let outgoingSlices = [];
    let rawIncomingSlots = [];

    const hiddenSlotEntry = Object.entries(SLOTS_CONFIG).find(([k, v]) => v.isHidden);
    const hiddenSlotIndex = hiddenSlotEntry ? parseInt(hiddenSlotEntry[0]) : 3;
    const hiddenSlotConfig = SLOTS_CONFIG[hiddenSlotIndex];
    const initialEnteringAngle = hiddenSlotConfig ? hiddenSlotConfig.angle : 180;

    // 1. Analyse des triangles actifs (persistants ou traversant le sommet)
    for (let i = 0; i < activeSlices.length; i++) {
        const slice = activeSlices[i];
        const currentConfig = SLOTS_CONFIG[slice.slotIndex];
        const currentAngle = currentConfig.angle;

        let stepsToTop = 0;
        for (let d = 1; d <= absSteps; d++) {
            const slotAtStep = (slice.slotIndex + (steps > 0 ? d : -d) + TOTAL_SLOTS) % TOTAL_SLOTS;
            if (SLOTS_CONFIG[slotAtStep] && SLOTS_CONFIG[slotAtStep].isHidden) {
                stepsToTop = d;
                break;
            }
        }

        const targetAngle = currentAngle + (steps * ANGLE_PER_SLOT);
        const newSlot = (slice.slotIndex + steps + TOTAL_SLOTS) % TOTAL_SLOTS;
        const targetScale = (newSlot === 0) ? ` scale(${ACTIVE_SCALE})` : '';
        const targetTransform = `rotate(${targetAngle}deg)${targetScale}`;

        if (stepsToTop > 0) {
            const fraction = stepsToTop / absSteps;
            const timeFraction = (fraction === 0.5) ? BEZIER_HALF_TIME : getCubicBezierTime(fraction, 0.25, 1, 0.5, 1);
            const hitTopTime = timeFraction * maxDuration;

            outgoingSlices.push({
                element: slice.element,
                targetTransform: targetTransform,
                duration: maxDuration,
                delay: 0,
                hitTopTime: hitTopTime
            });
        } else {
            persistingSlices.push({
                element: slice.element,
                targetTransform: targetTransform,
                duration: maxDuration,
                delay: 0,
                newSlot: newSlot,
                isActive: (newSlot === 0)
            });
        }
    }

    // 2. Configuration des slots entrants depuis le slot caché (synchronisés avec la courbe)
    for (let i = 0; i < absSteps; i++) {
        const distance = i + 1;
        const enteringSlot = (hiddenSlotIndex + (steps > 0 ? distance : -distance) + TOTAL_SLOTS) % TOTAL_SLOTS;
        rawIncomingSlots.push({ slot: enteringSlot, distance: distance });
    }

    const incomingSlices = rawIncomingSlots.map(item => {
        const enteringSlot = item.slot;
        const distance = item.distance;

        let delay = 0;
        let duration = maxDuration;

        if (distance < absSteps) {
            const fraction = (absSteps - distance) / absSteps;
            const timeFraction = (fraction === 0.5) ? BEZIER_HALF_TIME : getCubicBezierTime(fraction, 0.25, 1, 0.5, 1);
            delay = timeFraction * maxDuration;
            duration = maxDuration - delay;
        }

        const enteringProjectIndex = getProjectIndex(enteringSlot, nextIndex);
        const enteringProject = projects[enteringProjectIndex];

        const element = createSliceElement(enteringSlot, enteringProject);
        element.style.transform = `rotate(${initialEnteringAngle}deg)`;
        element.style.opacity = '1';
        element.style.transition = 'none';

        const targetAngle = SLOTS_CONFIG[enteringSlot].angle;
        const targetScale = (enteringSlot === 0) ? ` scale(${ACTIVE_SCALE})` : '';
        const targetTransform = `rotate(${targetAngle}deg)${targetScale}`;

        return {
            element: element,
            isEntering: true,
            targetTransform: targetTransform,
            duration: duration,
            delay: delay,
            newSlot: enteringSlot,
            isActive: (enteringSlot === 0),
            projectIndex: enteringProjectIndex
        };
    });

    const allAnims = [...persistingSlices, ...incomingSlices];
    const newActiveSlices = ACTIVE_SLOTS_ORDER.map(slotIndex => {
        const projIdx = getProjectIndex(slotIndex, nextIndex);
        const anim = allAnims.find(a => a.newSlot === slotIndex);
        return {
            element: anim.element,
            slotIndex: slotIndex,
            projectIndex: projIdx
        };
    });

    return {
        nextIndex,
        maxDuration,
        persistingSlices,
        outgoingSlices,
        incomingSlices,
        newActiveSlices
    };
}


/* ==========================================================================
   EXÉCUTION DES MOUVEMENTS
   ========================================================================== */

function move_all_triangles(movementMap) {
    movementMap.incomingSlices.forEach(anim => {
        wheel.appendChild(anim.element);
    });

    void wheel.offsetHeight;

    // Triangles persistants
    movementMap.persistingSlices.forEach(anim => {
        const el = anim.element;
        el.style.transition = `transform ${anim.duration}ms cubic-bezier(0.25, 1, 0.5, 1) ${anim.delay}ms`;
        el.style.transform = anim.targetTransform;
        el.style.opacity = '1';
        el.classList.toggle('active', anim.isActive);
        el.style.zIndex = anim.isActive ? '5' : '2';
    });

    // Triangles entrants
    movementMap.incomingSlices.forEach(anim => {
        const el = anim.element;
        el.style.transition = `transform ${anim.duration}ms cubic-bezier(0.25, 1, 0.5, 1) ${anim.delay}ms`;
        el.style.transform = anim.targetTransform;
        el.style.opacity = '1';
        el.classList.toggle('active', anim.isActive);
        el.style.zIndex = anim.isActive ? '5' : '2';
    });

    // Triangles sortants : détruits exactement au moment où ils atteignent le sommet (Slot 3)
    movementMap.outgoingSlices.forEach(anim => {
        const el = anim.element;
        el.style.transition = `transform ${anim.duration}ms cubic-bezier(0.25, 1, 0.5, 1) ${anim.delay}ms`;
        el.style.transform = anim.targetTransform;
        el.style.opacity = '1';

        setTimeout(() => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        }, anim.hitTopTime);
    });

    activeSlices = movementMap.newActiveSlices;

    setTimeout(() => {
        currentIndex = movementMap.nextIndex;
        renderWheelInstant();
        isAnimating = false;
    }, movementMap.maxDuration);
}


/* ==========================================================================
   ROTATION PRINCIPALE
   ========================================================================== */

function rotateBy(steps) {
    if (!totalProjects || !steps || isAnimating) return;

    isAnimating = true;

    const nextIndex = getIndex(currentIndex + steps);

    // Lancement des animations optimisées (sans fade & sans lag)
    updateTextDescription(nextIndex, true);
    animateSliceTextsTransition(nextIndex);

    const movementMap = assign_movements(steps);
    move_all_triangles(movementMap);
}


/* ==========================================================================
   API
   ========================================================================== */

const rotateLeft = () => rotateBy(-1);
const rotateRight = () => rotateBy(1);
const rotateByFunc = rotateBy;

window.rotateLeft = rotateLeft;
window.rotateRight = rotateRight;
window.rotateBy = rotateByFunc;


/* ==========================================================================
   TEXTE DANS LES TRIANGLES
   ========================================================================== */

function wrapTextIntoTriangle(container) {
    const span = container.querySelector('span');
    if (!span) return;

    const words = span.innerText.split(' ');
    const triangleHeight = 220;
    const containerWidth = 254;
    const lineHeight = 18;
    const maxLines = Math.floor(triangleHeight * 0.75 / lineHeight);
    const lineConfigs = [];

    for (let i = 0; i < maxLines; i++) {
        const lineBottomY = triangleHeight - i * lineHeight;
        const usefulWidth = 238 * ((lineBottomY - 12) / 208);
        const width = Math.max(0, usefulWidth - 16) / containerWidth * 100;
        lineConfigs.push({ width, words: [] });
    }

    const combinations = [
        [2],
        [3, 2],
        [3, 2, 1],
        [4, 3, 2, 1],
        [5, 4, 3, 2, 1],
        [6, 5, 4, 3, 2, 1],
        [6, 5, 4, 3, 2, 1, 0]
    ];

    function tryDistribute(lineIndices) {
        lineIndices.forEach(i => { if (lineConfigs[i]) lineConfigs[i].words = []; });
        const remaining = [...words];

        for (let i = lineIndices.length - 1; i >= 0; i--) {
            const line = lineConfigs[lineIndices[i]];
            if (!line) return false;

            while (remaining.length) {
                line.words.unshift(remaining.pop());
                const text = line.words.join(' ');
                const estimatedWidth = text.length * 9.1;
                const maxWidth = line.width / 100 * containerWidth;

                if (estimatedWidth > maxWidth && line.words.length > 1) {
                    remaining.push(line.words.shift());
                    break;
                }
            }
        }
        return remaining.length === 0;
    }

    let distributed = false;
    for (const combination of combinations) {
        if (tryDistribute(combination)) {
            distributed = true;
            break;
        }
    }

    if (!distributed) {
        tryDistribute(Array.from({ length: lineConfigs.length }, (_, i) => i).reverse());
    }

    let maxVisibleIndex = 0;
    lineConfigs.forEach((line, i) => {
        if (line.words.length) maxVisibleIndex = Math.max(maxVisibleIndex, i);
    });

    let html = '';
    for (let i = maxVisibleIndex; i >= 0; i--) {
        const line = lineConfigs[i];
        html += `
            <div style="
                display:block;
                width:${line.width}%;
                height:${lineHeight}px;
                margin:0 auto;
                text-align:center;
                font-size:11px;
                font-weight:700;
                line-height:${lineHeight}px;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
                box-sizing:border-box;
                transform-origin: center;
                transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            ">
                ${line.words.length ? line.words.join(' ') : '&nbsp;'}
            </div>
        `;
    }

    span.innerHTML = html;
}


/* ==========================================================================
   DOM READY
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('wheel')) {
        initWheel();

        const descBox = document.querySelector('.description-box');
        if (descBox) {
            descBox.addEventListener('click', openCurrentProject);
        }
    }
});
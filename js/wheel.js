/* ==========================================================================
   WHEEL.JS - ROUE DES PROJETS

   Six emplacements espacés de 60°, cinq visibles et un caché au sommet,
   masqué par le triangle sombre posé par-dessus. Chaque triangle a un rang
   fixe (entier non replié) : le triangle de rang n montre le projet
   wrapIndex(n) et se trouve en bas quand la position de la roue vaut n.
   Tous les angles se déduisent de cette seule position : la roue tourne
   d'un seul tenant, et un clic en pleine rotation la relance depuis là où
   elle se trouve. Les triangles qui atteignent le sommet sont détruits
   (sortants), d'autres en sortent (entrants).
   ========================================================================== */

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const ANGLE_PER_SLOT = 60;
const HALF_TURN = 180 / ANGLE_PER_SLOT;   // Crans entre le bas et le sommet
const ANIMATION_DURATION = 600;   // Durée d'une rotation, en millisecondes
const TEXT_SWAP_DELAY = 300;      // Instant où le texte sous la roue bascule
const ACTIVE_SCALE = 1.3;         // Agrandissement du triangle du bas
const TEXT_STRETCH_SCALE = 1.15;  // Étirement horizontal du texte pendant la bascule

// Courbe de toutes les animations de la roue. Le CSS des lignes de texte (.slice span div) la reprend.
const EASING_POINTS = [0.25, 1, 0.5, 1];
const EASING = `cubic-bezier(${EASING_POINTS.join(', ')})`;

// Géométrie d'un triangle, en pixels. Doit rester accordée au CSS de .slice.
const SLICE_WIDTH = 254;
const SLICE_HEIGHT = 220;
const LINE_HEIGHT = 18;
const CHAR_WIDTH = 9.1;   // Largeur moyenne d'un caractère, pour estimer les coupures

// Découpe du triangle par le clip-path de .slice : pointe à 12px du haut, base rentrée de 8px de chaque côté.
const CLIP_TOP = 12;
const CLIP_SIDE = 8;
const TEXT_HEIGHT_RATIO = 0.75;   // Part de la hauteur du triangle réservée au texte
const TEXT_SIDE_MARGIN = 16;      // Marge horizontale totale d'une ligne de texte


/* ==========================================================================
   ÉTAT
   ========================================================================== */

let projects = [];
let totalProjects = 0;

// Rang amené (ou en train d'être amené) en bas.
let target = 0;

// Rotation en cours : la position va de from à to, selon EASING, à partir de start
// (horloge des animations). null à l'arrêt.
let motion = null;
let isTicking = false;

// Triangles affichés, par rang : { element, rank, scaleFrom, scaleTo, animation }
const slices = new Map();

const wheel = document.getElementById('wheel');
const titleElement = document.getElementById('project-title');
const subtitleElement = document.getElementById('project-subtitle');
const descElement = document.getElementById('project-desc');
const counterElement = document.getElementById('project-counter');
const keysHint = document.getElementById('wheel-keys');


/* ==========================================================================
   OUTILS
   ========================================================================== */

// Ramène un indice de projet dans les bornes de la liste.
function wrapIndex(i) {
    return ((i % totalProjects) + totalProjects) % totalProjects;
}

// Transforme un titre en identifiant d'adresse. Doit rester identique à projects.js.
function slugFromTitle(title) {
    return title
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim()
        .replace(/['’\s\-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

// Transformation d'un triangle situé à `offset` crans du bas.
function transformOf(offset, scale) {
    return `rotate(${offset * ANGLE_PER_SLOT}deg) scale(${scale})`;
}


/* ==========================================================================
   COURBE D'ANIMATION

   Le navigateur anime les triangles ; le script a besoin de savoir où en est
   la roue à un instant donné (pour créer, détruire ou relancer). Il évalue la
   même cubic-bezier : on cherche le paramètre dont l'abscisse vaut la fraction
   de durée écoulée (méthode de Newton), puis on lit son ordonnée.
   ========================================================================== */

function bezier(u, p1, p2) {
    return 3 * (1 - u) * (1 - u) * u * p1 + 3 * (1 - u) * u * u * p2 + u * u * u;
}

function bezierSlope(u, p1, p2) {
    return 3 * (1 - u) * (1 - 3 * u) * p1 + 3 * u * (2 - 3 * u) * p2 + 3 * u * u;
}

function easeAt(timeFraction) {
    const [x1, y1, x2, y2] = EASING_POINTS;
    let u = timeFraction;

    for (let i = 0; i < 15; i++) {
        const error = bezier(u, x1, x2) - timeFraction;
        const slope = bezierSlope(u, x1, x2);

        if (Math.abs(error) < 1e-7 || Math.abs(slope) < 1e-7) break;

        u = Math.max(0, Math.min(1, u - error / slope));
    }

    return bezier(u, y1, y2);
}

// Avancement de la rotation en cours (0 à 1) à l'instant time ; 1 à l'arrêt.
function progressAt(time) {
    return motion ? easeAt(Math.min(1, (time - motion.start) / ANIMATION_DURATION)) : 1;
}

function positionAt(time) {
    return motion ? motion.from + (motion.to - motion.from) * progressAt(time) : target;
}


/* ==========================================================================
   FABRICATION D'UN TRIANGLE
   ========================================================================== */

function createSlice(rank) {
    const project = projects[wrapIndex(rank)];
    const element = document.createElement('div');
    element.className = 'slice';
    element.innerHTML = '<span></span>';
    element.style.backgroundColor = project.color;
    element.dataset.projectTitle = project.title;

    const span = element.querySelector('span');
    span.innerText = project.title;
    wrapTextIntoTriangle(element);

    element.addEventListener('mouseenter', () => setTextHover(element, true));
    element.addEventListener('mouseleave', () => setTextHover(element, false));

    // Un triangle cliqué est amené en bas, même en pleine rotation ; arrivé en bas, il ouvre son projet.
    element.addEventListener('click', event => {
        event.stopPropagation();
        if (rank !== target) turnTo(rank);
        else if (!motion) openCurrentProject();
    });

    return element;
}

// Signale le survol au CSS, qui écarte les lettres (.slice.is-hovered span div).
function setTextHover(element, hovered) {
    element.classList.toggle('is-hovered', hovered);
}

function addSlice(rank) {
    const slice = { element: createSlice(rank), rank, scaleFrom: 1, scaleTo: 1, animation: null };
    slices.set(rank, slice);
    placeSlice(slice);
    wheel.appendChild(slice.element);
}

// Pose l'état final d'un triangle et, pendant une rotation, l'anime depuis le début
// de celle-ci : un triangle créé en cours de route part directement du bon point.
function placeSlice(slice) {
    const { element, rank } = slice;
    const isActive = rank === target;

    element.classList.toggle('active', isActive);
    slice.scaleTo = isActive ? ACTIVE_SCALE : 1;
    element.style.transform = transformOf(target - rank, slice.scaleTo);

    if (slice.animation) slice.animation.cancel();
    if (!motion) return;

    slice.animation = element.animate(
        [{ transform: transformOf(motion.from - rank, slice.scaleFrom) }, { transform: element.style.transform }],
        { duration: ANIMATION_DURATION, easing: EASING }
    );
    slice.animation.startTime = motion.start;
}


/* ==========================================================================
   CONSTRUCTION DE LA ROUE

   Appelée une seule fois au chargement. Reste accessible comme filet de
   sécurité : buildWheel() remet la roue d'aplomb sur l'état courant.
   ========================================================================== */

function buildWheel() {
    if (!wheel || !totalProjects) return;

    wheel.innerHTML = '';
    slices.clear();
    motion = null;

    for (let rank = target - HALF_TURN + 1; rank < target + HALF_TURN; rank++) addSlice(rank);

    updateTextDescription(wrapIndex(target), false);
}


/* ==========================================================================
   ENCART DE DESCRIPTION SOUS LA ROUE
   ========================================================================== */

function writeDescription(project) {
    if (titleElement) titleElement.textContent = project.title;

    if (subtitleElement) {
        subtitleElement.textContent = project.subtitle
            ? `${project.subtitle} - ${project.date || ''}`
            : project.date || '';
    }

    if (descElement) descElement.innerHTML = project.short_desc;
}

// Affiche la position du projet courant dans la liste, par exemple 3/12.
function writeCounter(index) {
    if (counterElement) counterElement.textContent = `${index + 1}/${totalProjects}`;
}

function updateTextDescription(index, animate = true) {
    if (!totalProjects) return;

    const project = projects[index];

    if (window.changeBackgroundParticlesColor && project.color) {
        window.changeBackgroundParticlesColor(project.color);
    }

    if (!animate) {
        writeDescription(project);
        writeCounter(index);
        return;
    }

    const animated = [titleElement, subtitleElement, descElement].filter(Boolean);

    // Étirement, puis bascule du contenu à mi-course et retour à la normale.
    animated.forEach(el => {
        el.style.transition = `transform ${TEXT_SWAP_DELAY}ms ${EASING}`;
        el.style.transform = `scaleX(${TEXT_STRETCH_SCALE}) scale(0.95)`;
    });

    setTimeout(() => {
        writeDescription(project);
        writeCounter(index);
        animated.forEach(el => {
            el.style.transform = 'scaleX(1) scale(1)';
        });
    }, TEXT_SWAP_DELAY);
}

// Remplace l'encart par un message d'échec de chargement.
function showWheelError() {
    if (titleElement) titleElement.textContent = '[ERREUR SYSTÈME]';
    if (subtitleElement) subtitleElement.textContent = 'Accès refusé au protocole Projets';
    if (descElement) descElement.innerHTML = 'Échec du chargement du protocole Projets.';
    if (keysHint) keysHint.hidden = true;
}


/* ==========================================================================
   ROTATION
   ========================================================================== */

// Amène le rang `rank` en bas. En pleine rotation, la roue repart de sa position
// et de ses agrandissements du moment, sans attendre la fin du mouvement.
function turnTo(rank) {
    const now = document.timeline.currentTime;
    const progress = progressAt(now);
    const from = positionAt(now);

    slices.forEach(slice => { slice.scaleFrom += (slice.scaleTo - slice.scaleFrom) * progress; });

    target = rank;
    motion = { from, to: rank, start: now };
    slices.forEach(placeSlice);
    updateTextDescription(wrapIndex(target), true);

    if (!isTicking) {
        isTicking = true;
        requestAnimationFrame(tick);
    }
}

// À chaque image d'une rotation : détruit les triangles arrivés au sommet, crée ceux
// qui en sortent. Un triangle existe tant qu'il est à moins d'un demi-tour du bas.
function tick() {
    const now = document.timeline.currentTime;
    const position = positionAt(now);

    slices.forEach(slice => {
        if (Math.abs(position - slice.rank) < HALF_TURN) return;
        slice.element.remove();
        slices.delete(slice.rank);
    });

    for (let rank = Math.ceil(position - HALF_TURN); rank <= Math.floor(position + HALF_TURN); rank++) {
        if (Math.abs(position - rank) < HALF_TURN && !slices.has(rank)) addSlice(rank);
    }

    if (now - motion.start < ANIMATION_DURATION) {
        requestAnimationFrame(tick);
        return;
    }

    motion = null;
    isTicking = false;
}

// Ajoute des crans à la rotation, même en cours de route : la roue repart d'où elle est.
function rotateBy(steps) {
    if (!totalProjects || !steps) return;
    turnTo(target + steps);
}

const rotateLeft = () => rotateBy(-1);
const rotateRight = () => rotateBy(1);


/* ==========================================================================
   OUVERTURE D'UN PROJET
   ========================================================================== */

function openCurrentProject() {
    const project = projects[wrapIndex(target)];
    if (!project) return;

    window.location.href = `project.html?id=${slugFromTitle(project.title)}`;
}


/* ==========================================================================
   TEXTE DANS LES TRIANGLES

   Le triangle s'élargit vers le bas : chaque ligne dispose donc d'une largeur
   différente. On essaie plusieurs répartitions de mots, de la plus compacte à
   la plus étalée, et on garde la première qui fait tenir le titre entier.
   ========================================================================== */

const LINE_COMBINATIONS = [
    [2],
    [3, 2],
    [3, 2, 1],
    [4, 3, 2, 1],
    [5, 4, 3, 2, 1],
    [6, 5, 4, 3, 2, 1],
    [6, 5, 4, 3, 2, 1, 0]
];

function wrapTextIntoTriangle(container) {
    const span = container.querySelector('span');
    if (!span) return;

    const words = span.innerText.split(' ');
    const maxLines = Math.floor(SLICE_HEIGHT * TEXT_HEIGHT_RATIO / LINE_HEIGHT);

    // Largeur utile de chaque ligne, en pourcentage de la largeur du triangle.
    const lines = [];
    for (let i = 0; i < maxLines; i++) {
        const bottomY = SLICE_HEIGHT - i * LINE_HEIGHT;
        const usefulWidth = (SLICE_WIDTH - 2 * CLIP_SIDE) * ((bottomY - CLIP_TOP) / (SLICE_HEIGHT - CLIP_TOP));
        lines.push({ width: Math.max(0, usefulWidth - TEXT_SIDE_MARGIN) / SLICE_WIDTH * 100, words: [] });
    }

    function tryDistribute(lineIndices) {
        lineIndices.forEach(i => { if (lines[i]) lines[i].words = []; });
        const remaining = [...words];

        for (let i = lineIndices.length - 1; i >= 0; i--) {
            const line = lines[lineIndices[i]];
            if (!line) return false;

            while (remaining.length) {
                line.words.unshift(remaining.pop());
                const estimatedWidth = line.words.join(' ').length * CHAR_WIDTH;

                if (estimatedWidth > line.width / 100 * SLICE_WIDTH && line.words.length > 1) {
                    remaining.push(line.words.shift());
                    break;
                }
            }
        }

        return remaining.length === 0;
    }

    const fitted = LINE_COMBINATIONS.some(tryDistribute);
    if (!fitted) {
        tryDistribute(Array.from({ length: lines.length }, (_, i) => i).reverse());
    }

    let lastUsed = 0;
    lines.forEach((line, i) => { if (line.words.length) lastUsed = Math.max(lastUsed, i); });

    // Seules les dimensions calculées ici sont posées en ligne ; le reste vient de .slice span div.
    let html = '';
    for (let i = lastUsed; i >= 0; i--) {
        const line = lines[i];
        html += `<div style="width:${line.width}%; height:${LINE_HEIGHT}px; line-height:${LINE_HEIGHT}px;">${line.words.length ? line.words.join(' ') : '&nbsp;'}</div>`;
    }

    span.innerHTML = html;
}


/* ==========================================================================
   INTERACTIONS
   ========================================================================== */

// Vrai si la roue est au moins partiellement à l'écran.
function isWheelOnScreen() {
    if (!wheel) return false;

    const rect = wheel.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
}

function initInteractions() {
    const descBox = document.querySelector('.description-box');
    if (descBox) descBox.addEventListener('click', openCurrentProject);

    // Les flèches gauche et droite tournent la roue quand elle est visible, chaque appui
    // ajoutant un cran. Elles n'ont aucune action par défaut ici, la page ne défilant pas
    // latéralement. Une touche maintenue ne relance la roue qu'une fois celle-ci arrêtée.
    document.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
        if (!isWheelOnScreen()) return;

        event.preventDefault();
        if (event.repeat && motion) return;
        if (event.key === 'ArrowLeft') rotateLeft();
        else rotateRight();
        if (keysHint) keysHint.classList.add('is-used');
    });
}


/* ==========================================================================
   DÉMARRAGE
   ========================================================================== */

function initWheel() {
    fetch('data/projects.json')
        .then(res => res.ok ? res.json() : Promise.reject(new Error('projects.json indisponible')))
        .then(data => {
            projects = data;
            totalProjects = data.length;
            buildWheel();
        })
        .catch(err => {
            console.error('Erreur chargement projets :', err);
            showWheelError();
        });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!wheel) return;

    initWheel();
    initInteractions();
});


/* ==========================================================================
   API PUBLIQUE
   ========================================================================== */

window.rotateBy = rotateBy;
window.rotateLeft = rotateLeft;
window.rotateRight = rotateRight;
window.buildWheel = buildWheel;

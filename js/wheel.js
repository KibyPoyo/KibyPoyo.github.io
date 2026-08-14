/* ==========================================================================
   WHEEL.JS
   ========================================================================== */

let projects = [];
let currentIndex = 0;
let totalProjects = 0;
let isAnimating = false;

let lastMouseX = 0;
let lastMouseY = 0;
let mouseMoveHandler = null;

const VISIBLE_SLOTS = 6;
const ANGLE_PER_SLOT = 60;
const ANIMATION_DURATION = 600;
const offsets = [0, -1, -2, 3, 2, 1];

const wheel = document.getElementById('wheel');
const titleElement = document.getElementById('project-title');
const descElement = document.getElementById('project-desc');
let sliceElements = [];

window.addEventListener('mousemove', e => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
}, { passive: true });

const getIndex = i =>
    ((i % totalProjects) + totalProjects) % totalProjects;


/* ==========================================================================
   ROTATION
   ========================================================================== */

function prepareWheelBeforeRotation(steps, targetIndex) {
    sliceElements.forEach((slice, k) => {
        const landingOffset = offsets[(k + steps + VISIBLE_SLOTS) % VISIBLE_SLOTS];
        const project = projects[getIndex(targetIndex + landingOffset)];

        slice.style.backgroundColor = project.color;

        if (slice.dataset.projectTitle !== project.title) {
            slice.dataset.projectTitle = project.title;
            const span = slice.querySelector('span');

            if (span) {
                span.innerText = project.title;
                wrapTextIntoTriangle(slice);
            }
        }
    });
}

function rotateBy(steps) {
    if (!totalProjects || !steps || isAnimating || !wheel) return;

    isAnimating = true;

    if (mouseMoveHandler) {
        window.removeEventListener('mousemove', mouseMoveHandler);
        mouseMoveHandler = null;
    }

    wheel.classList.add('is-rotating', 'suppress-hover');

    const targetIndex = getIndex(currentIndex + steps);

    prepareWheelBeforeRotation(steps, targetIndex);

    sliceElements.forEach(slice => {
        const offset = Number(slice.dataset.offset);
        const active = offset === steps;

        slice.classList.toggle('active', active);
        slice.style.zIndex = active ? '5' : offset === 3 ? '1' : '2';
    });

    updateTextDescription(targetIndex);
    wheel.style.transform = `rotate(${steps * ANGLE_PER_SLOT}deg)`;

    setTimeout(() => {
        currentIndex = targetIndex;

        wheel.classList.add('no-transition');
        wheel.style.transform = 'rotate(0deg)';
        renderWheelContent();

        wheel.classList.remove('no-transition', 'is-rotating');
        void wheel.offsetHeight;

        const startX = lastMouseX;
        const startY = lastMouseY;

        mouseMoveHandler = e => {
            if (
                Math.abs(e.clientX - startX) < 2 &&
                Math.abs(e.clientY - startY) < 2
            ) return;

            wheel.classList.remove('suppress-hover');
            window.removeEventListener('mousemove', mouseMoveHandler);
            mouseMoveHandler = null;
        };

        window.addEventListener('mousemove', mouseMoveHandler);
        isAnimating = false;
    }, ANIMATION_DURATION);
}

const rotateLeft = () => rotateBy(-1);
const rotateRight = () => rotateBy(1);

window.rotateLeft = rotateLeft;
window.rotateRight = rotateRight;
window.rotateBy = rotateBy;


/* ==========================================================================
   PROJET ACTUEL
   ========================================================================== */

function openCurrentProject() {
    if (!projects.length) return;

    const id = projects[currentIndex].title
        .toLowerCase()
        .trim()
        .replace(/[\s\-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    window.location.href = `project.html?id=${id}`;
}


/* ==========================================================================
   INITIALISATION
   ========================================================================== */

function initWheel() {
    fetch('data/projects.json')
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
            projects = data;
            totalProjects = data.length;
            currentIndex = 0;

            buildStaticDOMSlots();
            renderWheelContent();
            updateTextDescription(0);
        })
        .catch(err => console.error('Erreur chargement projets :', err));
}

function buildStaticDOMSlots() {
    if (!wheel) return;

    wheel.innerHTML = '';
    sliceElements = [];

    for (let i = 0; i < VISIBLE_SLOTS; i++) {
        const slice = document.createElement('div');

        slice.className = 'slice visible';
        slice.style.setProperty('--initial-angle', `${i * ANGLE_PER_SLOT}deg`);
        slice.dataset.offset = offsets[i];
        slice.innerHTML = '<span></span>';

        slice.addEventListener('click', e => {
            e.stopPropagation();
            if (isAnimating) return;

            const offset = Number(slice.dataset.offset);

            if (offset === 3 || slice.classList.contains('is-top')) return;
            if (offset === 0) openCurrentProject();
            else rotateBy(offset);
        });

        wheel.appendChild(slice);
        sliceElements.push(slice);
    }
}


/* ==========================================================================
   CONTENU
   ========================================================================== */

function updateTextDescription(index) {
    if (!totalProjects) return;

    const project = projects[index];
    const subtitle = document.getElementById('project-subtitle');

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
}

function renderWheelContent() {
    if (!totalProjects) return;

    sliceElements.forEach(slice => {
        const offset = Number(slice.dataset.offset);
        const project = projects[getIndex(currentIndex + offset)];

        slice.style.backgroundColor = project.color;

        if (slice.dataset.projectTitle !== project.title) {
            slice.dataset.projectTitle = project.title;

            const span = slice.querySelector('span');
            if (span) {
                span.innerText = project.title;
                wrapTextIntoTriangle(slice);
            }
        }

        slice.classList.toggle('active', offset === 0);
        slice.classList.toggle('is-top', offset === 3);

        slice.style.zIndex =
            offset === 0 ? '5' :
            offset === 3 ? '1' : '2';
    });
}


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
        lineIndices.forEach(i => {
            if (lineConfigs[i]) lineConfigs[i].words = [];
        });

        const remaining = [...words];

        for (let i = lineIndices.length - 1; i >= 0; i--) {
            const line = lineConfigs[lineIndices[i]];
            if (!line) return false;

            while (remaining.length) {
                line.words.unshift(remaining.pop());

                const text = line.words.join(' ');
                const estimatedWidth = text.length * 9.1;
                const maxWidth = line.width / 100 * containerWidth;

                if (
                    estimatedWidth > maxWidth &&
                    line.words.length > 1
                ) {
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
        tryDistribute(
            Array.from({ length: lineConfigs.length }, (_, i) => i).reverse()
        );
    }

    let maxVisibleIndex = 0;

    lineConfigs.forEach((line, i) => {
        if (line.words.length) {
            maxVisibleIndex = Math.max(maxVisibleIndex, i);
        }
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
                transition:letter-spacing 0.4s cubic-bezier(0.2,1,0.3,1);
            ">
                ${line.words.length ? line.words.join(' ') : '&nbsp;'}
            </div>
        `;
    }

    span.innerHTML = html;
}


/* ==========================================================================
   DOM
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    if (!wheel) return;

    initWheel();

    const descBox = document.querySelector('.description-box');
    if (descBox) {
        descBox.addEventListener('click', openCurrentProject);
    }
});
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const mouse = { x: -1000, y: -1000 };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });

// Couleur des orbes normales : l'accent du site, déclaré dans le CSS.
let currentBallColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
let isAttracting = false; 

const orbs = [];
const totalOrbs = 250; 
const fixedRadius = 14; 

// La page piscine n'affiche ni Kirby ni ses effets. Reconnue à son body, pas à son
// adresse (GitHub Pages la sert aussi sans l'extension .html).
const isBallPitPage = document.body.dataset.page === 'ball-pit';

// Vitesse de croisière tirée entre 0.5 et 0.8.
function randomCruiseSpeed() {
    return Math.random() * 0.3 + 0.5;
}

// Place l'orbe au hasard dans le canvas et la lance dans une direction aléatoire.
function launchOrb(orb, cruiseSpeed) {
    const angle = Math.random() * Math.PI * 2;
    orb.x = Math.random() * canvas.width;
    orb.y = Math.random() * canvas.height;
    orb.vx = Math.cos(angle) * cruiseSpeed;
    orb.vy = Math.sin(angle) * cruiseSpeed;
    orb.cruiseSpeed = cruiseSpeed;
    return orb;
}

function createOrb(cruiseSpeed) {
    return launchOrb({ radius: fixedRadius, isKirby: false }, cruiseSpeed);
}

// Configuration de Kirby (easter egg). Sur la piscine, son image n'est chargée qu'à
// la première apparition (touche K, secrète).
const kirbyImg = new Image();
const KIRBY_IMAGE = 'data/images/kirby.png';
const KIRBY_RESPAWN_DELAY = 2000;
if (!isBallPitPage) {
    kirbyImg.src = KIRBY_IMAGE;
}

function createKirby() {
    return launchOrb({
        radius: fixedRadius,
        isKirby: true,
        rotation: 0,
        rotSpeed: 0.015,
        isDisappeared: false,
        isPermanentlyRemoved: false
    }, randomCruiseSpeed());
}

// Orbes normales ; hors de la piscine, une place est laissée à Kirby.
const normalOrbsCount = isBallPitPage ? totalOrbs : totalOrbs - 1;
for (let i = 0; i < normalOrbsCount; i++) {
    orbs.push(createOrb(randomCruiseSpeed()));
}

let overlay, overlayImg, poyoSound, wallHitSound, kirbyClickCount = 0;
let kirbyAssetsLoaded = false;

// Joue une copie du son : plusieurs « poyo » rapprochés se superposent au lieu de se couper.
function playSound(sound) {
    sound.cloneNode().play().catch(err => console.log("Audio bloqué :", err));
}

// Crée les sons et, hors de la piscine (seul endroit où le mur existe), déclenche le
// chargement de l'image du mur.
function loadKirbyAssets() {
    if (kirbyAssetsLoaded) return;
    kirbyAssetsLoaded = true;

    poyoSound = new Audio('data/poyo.mp3');
    if (isBallPitPage) return;
    wallHitSound = new Audio('data/wall_hit.mp3');
    overlayImg.src = 'data/images/kirby_wall.png';
}

// Kirby d'origine et son voile, absents de la piscine à balles.
if (!isBallPitPage) {
    orbs.push(createKirby());

    overlay = document.createElement('div');
    overlay.id = 'kirby-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:transparent;display:none;justify-content:center;align-items:center;z-index:99999;';

    // Sans attribut src, cette image ne déclenche aucun téléchargement.
    overlayImg = document.createElement('img');
    overlayImg.style.cssText = 'width:100vw;height:100vh;object-fit:contain;pointer-events:none;';
    overlay.appendChild(overlayImg);
    document.body.appendChild(overlay);
}

// Clic sur un Kirby, intercepté en phase de capture : « poyo », il disparaît puis revient.
// Hors de la piscine, le troisième clic fait tomber le mur ; dans la piscine, jamais.
window.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const kirby = orbs.find(o => o.isKirby && !o.isDisappeared && !o.isPermanentlyRemoved
        && Math.sqrt((clickX - o.x) ** 2 + (clickY - o.y) ** 2) < o.radius + 8);
    if (!kirby) return;

    loadKirbyAssets();

    if (isBallPitPage || ++kirbyClickCount <= 2) {
        playSound(poyoSound);

        kirby.isDisappeared = true;
        setTimeout(() => {
            if (!kirby.isPermanentlyRemoved) {
                launchOrb(kirby, randomCruiseSpeed());
                kirby.isDisappeared = false;
            }
        }, KIRBY_RESPAWN_DELAY);

    } else {
        playSound(wallHitSound);
        overlay.style.display = 'flex';

        kirby.isPermanentlyRemoved = true;
        kirby.isDisappeared = true;
    }
}, true);

let repulsionRadius = 160;   // Portée de la souris, réglable depuis la piscine
const repulsionStrength = 0.9;
const POOL_ORB_SPEED = 0.5; // Vitesse des orbes ajoutées depuis la piscine à balles

// Piscine à balles : cercle montrant la portée après un réglage, arc-en-ciel (une couleur
// par orbe), ondes de choc au clic, formations : chaque orbe est aspirée vers sa cible
// (un même point pour le rassemblement, les points d'un texte), puis projetée en tous sens.
const RANGE_SHOWN_DURATION = 800;
let rangeShownUntil = 0;
let isRainbow = false;
const SHOCK_RADIUS = 220;
const SHOCK_SPEED = 14;        // Vitesse donnée au centre de l'onde, en pixels par image
const IMPLODE_RATE = 0.05;     // Vitesse d'aspiration par pixel de distance (un peu au-delà du centre)
const SHOCK_DURATION = 350;    // Durée du cercle qui matérialise l'onde
const shockwaves = [];         // { x, y, start, inward }
let formationUntil = 0;        // Fin de la formation en cours (0 : aucune)
const GATHER_DURATION = 600;   // En millisecondes
const TEXT_DURATION = 5000;    // Le texte se forme, puis reste lisible jusqu'à la dispersion
const FORMATION_PULL = 0.12;   // Part du chemin restant parcourue à chaque image
const SCATTER_SPEED = 6;       // Vitesse minimale de la dispersion, en pixels par image
const TEXT_FONT_RATIO = 1;     // Taille de police, rapportée à la hauteur de la page
const TEXT_MIN_SPACING = 6;    // Écart minimal entre deux points du texte, en pixels

// Attire ou repousse l'orbe si elle est assez proche de la souris.
function applyPointerForce(orb) {
    const dx = orb.x - mouse.x;
    const dy = orb.y - mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= repulsionRadius) return;

    const force = (repulsionRadius - distance) / repulsionRadius;
    const angle = Math.atan2(dy, dx);
    const direction = isAttracting ? -1 : 1;
    orb.vx += Math.cos(angle) * force * repulsionStrength * direction;
    orb.vy += Math.sin(angle) * force * repulsionStrength * direction;
}

// Ramène l'orbe vers sa vitesse de croisière, avance sa position et la fait rebondir sur les quatre bords.
function updateOrb(orb) {
    const currentSpeed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
    if (currentSpeed > 0) {
        const nextSpeed = currentSpeed + (orb.cruiseSpeed - currentSpeed) * 0.04;
        orb.vx = (orb.vx / currentSpeed) * nextSpeed;
        orb.vy = (orb.vy / currentSpeed) * nextSpeed;
    }

    orb.x += orb.vx;
    orb.y += orb.vy;

    if (orb.x - orb.radius < 0) { orb.x = orb.radius; orb.vx *= -1; }
    if (orb.x + orb.radius > canvas.width) { orb.x = canvas.width - orb.radius; orb.vx *= -1; }
    if (orb.y - orb.radius < 0) { orb.y = orb.radius; orb.vy *= -1; }
    if (orb.y + orb.radius > canvas.height) { orb.y = canvas.height - orb.radius; orb.vy *= -1; }
}

// Lance une formation : chaque orbe normale reçoit sa cible, targetOf(index).
function startFormation(targetOf, duration) {
    orbs.filter(orb => !orb.isKirby).forEach((orb, i) => { orb.target = targetOf(i); });
    formationUntil = performance.now() + duration;
}

// Fin d'une formation : chaque orbe qui y participait repart dans une direction au hasard.
function scatterOrbs() {
    orbs.forEach(orb => {
        if (!orb.target) return;
        delete orb.target;
        const angle = Math.random() * Math.PI * 2;
        const speed = SCATTER_SPEED * (1 + Math.random());
        orb.vx = Math.cos(angle) * speed;
        orb.vy = Math.sin(angle) * speed;
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isForming = formationUntil > 0 && performance.now() < formationUntil;
    if (formationUntil > 0 && !isForming) {
        formationUntil = 0;
        scatterOrbs();
    }

    orbs.forEach(orb => {
        if (orb.isKirby) {
            if (orb.isDisappeared || orb.isPermanentlyRemoved) return;

            updateOrb(orb);

            ctx.save();
            ctx.globalAlpha = 0.2; 
            
            orb.rotation += orb.rotSpeed;
            ctx.translate(orb.x, orb.y);
            ctx.rotate(orb.rotation);

            if (kirbyImg.complete && kirbyImg.naturalHeight !== 0) {
                ctx.drawImage(kirbyImg, -orb.radius, -orb.radius, orb.radius * 2, orb.radius * 2);
            } else {
                ctx.fillStyle = '#ff69b4';
                ctx.beginPath();
                ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

        } else {
            if (isForming && orb.target) {
                orb.x += (orb.target.x - orb.x) * FORMATION_PULL;
                orb.y += (orb.target.y - orb.y) * FORMATION_PULL;
            } else {
                applyPointerForce(orb);
                updateOrb(orb);
            }

            ctx.globalAlpha = 0.45;
            ctx.fillStyle = isRainbow ? rainbowColorOf(orb) : currentBallColor;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    drawPitOverlays();

    ctx.globalAlpha = 1.0;
    requestAnimationFrame(animate);
}

// Couleur propre à une orbe en mode arc-en-ciel, tirée une fois pour toutes.
function rainbowColorOf(orb) {
    if (!orb.rainbowColor) orb.rainbowColor = `hsl(${Math.floor(Math.random() * 360)}, 85%, 60%)`;
    return orb.rainbowColor;
}

// Cercle de portée autour de la souris après un réglage, et ondes de choc qui s'élargissent.
function drawPitOverlays() {
    const now = performance.now();
    ctx.strokeStyle = currentBallColor;
    ctx.lineWidth = 2;

    if (now < rangeShownUntil && mouse.x >= 0) {
        ctx.globalAlpha = 0.6 * (rangeShownUntil - now) / RANGE_SHOWN_DURATION;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, repulsionRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const progress = (now - shockwaves[i].start) / SHOCK_DURATION;
        if (progress >= 1) {
            shockwaves.splice(i, 1);
            continue;
        }
        ctx.globalAlpha = 0.7 * (1 - progress);
        ctx.beginPath();
        const radius = SHOCK_RADIUS * (shockwaves[i].inward ? 1 - progress : progress);
        ctx.arc(shockwaves[i].x, shockwaves[i].y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Ajoute count orbes normales à des positions et directions aléatoires.
window.addOrbs = function(count) {
    for (let i = 0; i < count; i++) {
        orbs.push(createOrb(POOL_ORB_SPEED));
    }
};

// Retire les count dernières orbes de la liste.
window.removeOrbs = function(count) {
    for (let i = 0; i < count && orbs.length > 0; i++) {
        orbs.pop();
    }
};

window.changeBackgroundParticlesColor = function(newHexColor) {
    currentBallColor = newHexColor;
};

window.toggleAttractionMode = function() {
    isAttracting = !isAttracting;
    return isAttracting;
};

// Règle la portée de la souris, et l'affiche un instant autour d'elle.
window.setPointerRange = function(radius) {
    repulsionRadius = radius;
    rangeShownUntil = performance.now() + RANGE_SHOWN_DURATION;
};

window.toggleRainbow = function() {
    isRainbow = !isRainbow;
    return isRainbow;
};

// Onde de choc au point (x, y), à l'inverse du mode de la souris : en attraction, elle
// projette les orbes proches (d'autant plus fort qu'elles en sont près) ; en répulsion,
// elle les aspire (d'autant plus fort qu'elles en sont loin, pour qu'elles s'y rejoignent).
window.shockwaveAt = function(x, y) {
    const inward = !isAttracting;
    orbs.forEach(orb => {
        if (orb.isKirby) return;
        const dx = orb.x - x;
        const dy = orb.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= SHOCK_RADIUS) return;

        const angle = Math.atan2(dy, dx);
        const speed = inward ? -IMPLODE_RATE * distance : SHOCK_SPEED * (1 - distance / SHOCK_RADIUS);
        orb.vx += Math.cos(angle) * speed;
        orb.vy += Math.sin(angle) * speed;
    });
    shockwaves.push({ x, y, start: performance.now(), inward });
};

// Nombre d'orbes normales (Kirby non compris).
window.countOrbs = function() {
    return orbs.filter(orb => !orb.isKirby).length;
};

// Fait apparaître un Kirby de plus (piscine à balles, touche secrète).
window.spawnKirby = function() {
    if (!kirbyImg.src) kirbyImg.src = KIRBY_IMAGE;
    orbs.push(createKirby());
};

// Rassemble les orbes sous la souris, ou au centre si elle est hors de la page.
window.gatherOrbs = function() {
    const hasMouse = mouse.x >= 0 && mouse.y >= 0;
    const point = {
        x: hasMouse ? mouse.x : canvas.width / 2,
        y: hasMouse ? mouse.y : canvas.height / 2
    };
    startFormation(() => point, GATHER_DURATION);
};

// Points couvrant le texte écrit en très grand au centre de la page, espacés pour être
// à peu près aussi nombreux que `count` (sans descendre sous TEXT_MIN_SPACING).
function textPoints(text, count) {
    const { width, height } = canvas;
    const scratch = document.createElement('canvas');
    scratch.width = width;
    scratch.height = height;
    const sctx = scratch.getContext('2d', { willReadFrequently: true });

    const size = Math.min(height * TEXT_FONT_RATIO, width / (text.length * 0.7));
    sctx.font = `900 ${size}px sans-serif`;
    sctx.textAlign = 'center';
    // Centré sur l'encre réelle, pas sur la boîte de la police (les chiffres n'ont pas de jambage).
    const ink = sctx.measureText(text);
    sctx.fillText(text, width / 2, (height + ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2);
    const pixels = sctx.getImageData(0, 0, width, height).data;
    const isInk = (x, y) => pixels[(Math.floor(y) * width + Math.floor(x)) * 4 + 3] > 128;

    // Surface encrée, estimée sur une grille de 4 pixels.
    let inked = 0;
    for (let y = 0; y < height; y += 4) for (let x = 0; x < width; x += 4) if (isInk(x, y)) inked++;
    const spacing = Math.max(TEXT_MIN_SPACING, Math.sqrt(inked * 16 / count));

    const points = [];
    for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) if (isInk(x, y)) points.push({ x, y });
    }
    return points;
}

// Écrit le texte avec les orbes ; s'il y a plus d'orbes que de points, plusieurs
// partagent un point. Les points sont mélangés : les trajets se croisent.
window.formText = function(text) {
    const count = orbs.filter(orb => !orb.isKirby).length;
    const points = textPoints(text, count);
    if (!points.length) return;

    for (let i = points.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [points[i], points[j]] = [points[j], points[i]];
    }
    startFormation(i => points[i % points.length], TEXT_DURATION);
};

animate();
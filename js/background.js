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

// La page piscine n'affiche ni Kirby ni ses effets.
const isBallPitPage = window.location.pathname.includes('piscine_a_balles.html');

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

// Configuration de Kirby (easter egg).
const kirbyImg = new Image();
if (!isBallPitPage) {
    kirbyImg.src = 'data/images/kirby.png';
}

// Orbes normales ; hors de la piscine, une place est laissée à Kirby.
const normalOrbsCount = isBallPitPage ? totalOrbs : totalOrbs - 1;
for (let i = 0; i < normalOrbsCount; i++) {
    orbs.push(createOrb(randomCruiseSpeed()));
}

let overlay, overlayImg, poyoSound, wallHitSound, kirbyClickCount = 0;
let kirbyAssetsLoaded = false;

// Crée les deux sons et déclenche le chargement de l'image du mur.
function loadKirbyAssets() {
    if (kirbyAssetsLoaded) return;
    kirbyAssetsLoaded = true;

    poyoSound = new Audio('data/poyo.mp3');
    wallHitSound = new Audio('data/wall_hit.mp3');
    overlayImg.src = 'data/images/kirby_wall.png';
}

// Kirby et son voile, absents de la piscine à balles.
if (!isBallPitPage) {
    orbs.push(launchOrb({
        radius: fixedRadius,
        isKirby: true,
        rotation: 0,
        rotSpeed: 0.015,
        isDisappeared: false,
        isPermanentlyRemoved: false
    }, randomCruiseSpeed()));

    overlay = document.createElement('div');
    overlay.id = 'kirby-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:transparent;display:none;justify-content:center;align-items:center;z-index:99999;';

    // Sans attribut src, cette image ne déclenche aucun téléchargement.
    overlayImg = document.createElement('img');
    overlayImg.style.cssText = 'width:100vw;height:100vh;object-fit:contain;pointer-events:none;';
    overlay.appendChild(overlayImg);
    document.body.appendChild(overlay);

    // Clic sur Kirby, intercepté en phase de capture.
    window.addEventListener('click', (e) => {
        const kirby = orbs.find(o => o.isKirby);
        if (!kirby || kirby.isDisappeared || kirby.isPermanentlyRemoved) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const dx = clickX - kirby.x;
        const dy = clickY - kirby.y;
        
        if (Math.sqrt(dx * dx + dy * dy) < kirby.radius + 8) {
            loadKirbyAssets();
            kirbyClickCount++;

            if (kirbyClickCount <= 2) {
                poyoSound.currentTime = 0;
                poyoSound.play().catch(err => console.log("Audio bloqué :", err));

                kirby.isDisappeared = true;
                setTimeout(() => {
                    if (!kirby.isPermanentlyRemoved) {
                        launchOrb(kirby, randomCruiseSpeed());
                        kirby.isDisappeared = false;
                    }
                }, 2000);

            } else {
                wallHitSound.currentTime = 0;
                wallHitSound.play().catch(err => console.log("Audio bloqué :", err));
                overlay.style.display = 'flex'; 
                
                kirby.isPermanentlyRemoved = true; 
                kirby.isDisappeared = true;
            }
        }
    }, true);
}

const repulsionRadius = 160; 
const repulsionStrength = 0.9; 
const POOL_ORB_SPEED = 0.5; // Vitesse des orbes ajoutées depuis la piscine à balles

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

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
            const dx = orb.x - mouse.x;
            const dy = orb.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < repulsionRadius) {
                const force = (repulsionRadius - distance) / repulsionRadius;
                const angle = Math.atan2(dy, dx);
                const direction = isAttracting ? -1 : 1;
                orb.vx += Math.cos(angle) * force * repulsionStrength * direction;
                orb.vy += Math.sin(angle) * force * repulsionStrength * direction;
            }

            updateOrb(orb);

            ctx.globalAlpha = 0.45;
            ctx.fillStyle = currentBallColor;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.globalAlpha = 1.0; 
    requestAnimationFrame(animate);
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

animate();
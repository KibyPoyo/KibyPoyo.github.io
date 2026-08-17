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

let currentBallColor = '#3498db'; 
let isAttracting = false; 

const orbs = [];
const totalOrbs = 250; 
const fixedRadius = 14; 

// --- Vérification de la page (avec le "s" à balles) ---
const isPiscinePage = window.location.pathname.includes('piscine_a_balles.html');

// --- Configuration de Kirby (Easter Egg) - Uniquement si ce n'est pas la page piscine ---
const kirbyImg = new Image();
if (!isPiscinePage) {
    kirbyImg.src = 'data/kirby.png';
}

// 1. Création des orbes normales
const normalOrbsCount = isPiscinePage ? totalOrbs : totalOrbs - 1;
for (let i = 0; i < normalOrbsCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const cruiseSpeed = Math.random() * 0.3 + 0.5; 
    
    orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.cos(angle) * cruiseSpeed,
        vy: Math.sin(angle) * cruiseSpeed,
        cruiseSpeed: cruiseSpeed, 
        radius: fixedRadius,
        isKirby: false
    });
}

// 2. Ajout de Kirby uniquement si on n'est PAS sur piscine_a_balles.html
let overlay, poyoSound, wallHitSound, kirbyClickCount = 0;
if (!isPiscinePage) {
    const kirbyAngle = Math.random() * Math.PI * 2;
    const kirbySpeed = Math.random() * 0.3 + 0.5;
    orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.cos(kirbyAngle) * kirbySpeed,
        vy: Math.sin(kirbyAngle) * kirbySpeed,
        cruiseSpeed: kirbySpeed,
        radius: fixedRadius,
        isKirby: true,
        rotation: 0,
        rotSpeed: 0.015,
        isDisappeared: false,
        isPermanentlyRemoved: false
    });

    poyoSound = new Audio('data/poyo.mp3');
    wallHitSound = new Audio('data/wall_hit.mp3');

    overlay = document.createElement('div');
    overlay.id = 'kirby-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:transparent;display:none;justify-content:center;align-items:center;z-index:99999;';

    const overlayImg = document.createElement('img');
    overlayImg.src = 'data/kirby_wall.png';
    overlayImg.style.cssText = 'width:100vw;height:100vh;object-fit:contain;pointer-events:none;';
    overlay.appendChild(overlayImg);
    document.body.appendChild(overlay);

    // Détection globale avec capture pour Kirby
    window.addEventListener('click', (e) => {
        const kirby = orbs.find(o => o.isKirby);
        if (!kirby || kirby.isDisappeared || kirby.isPermanentlyRemoved) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const dx = clickX - kirby.x;
        const dy = clickY - kirby.y;
        
        if (Math.sqrt(dx * dx + dy * dy) < kirby.radius + 8) {
            kirbyClickCount++;

            if (kirbyClickCount <= 2) {
                poyoSound.currentTime = 0;
                poyoSound.play().catch(err => console.log("Audio bloqué :", err));

                kirby.isDisappeared = true;
                setTimeout(() => {
                    if (!kirby.isPermanentlyRemoved) {
                        kirby.x = Math.random() * canvas.width;
                        kirby.y = Math.random() * canvas.height;
                        const newAngle = Math.random() * Math.PI * 2;
                        const newSpeed = Math.random() * 0.3 + 0.5;
                        kirby.vx = Math.cos(newAngle) * newSpeed;
                        kirby.vy = Math.sin(newAngle) * newSpeed;
                        kirby.cruiseSpeed = newSpeed;
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

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    orbs.forEach(orb => {
        if (orb.isKirby) {
            if (orb.isDisappeared || orb.isPermanentlyRemoved) return;

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

window.changeBackgroundParticlesColor = function(newHexColor) {
    currentBallColor = newHexColor;
};

window.toggleAttractionMode = function() {
    isAttracting = !isAttracting;
    return isAttracting;
};

animate();
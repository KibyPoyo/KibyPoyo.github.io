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
let isAttracting = false; // Mode attraction/répulsion

const orbs = [];
const totalOrbs = 250; 
const fixedRadius = 14; 

for (let i = 0; i < totalOrbs; i++) {
    const angle = Math.random() * Math.PI * 2;
    const cruiseSpeed = Math.random() * 0.3 + 0.5; 
    
    orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.cos(angle) * cruiseSpeed,
        vy: Math.sin(angle) * cruiseSpeed,
        cruiseSpeed: cruiseSpeed, 
        radius: fixedRadius
    });
}

const repulsionRadius = 160; 
const repulsionStrength = 0.9; 

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = currentBallColor;

    orbs.forEach(orb => {
        // 1. Calcul de la force souris
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

        // 2. Gestion de la vitesse de croisière
        const currentSpeed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
        if (currentSpeed > 0) {
            const nextSpeed = currentSpeed + (orb.cruiseSpeed - currentSpeed) * 0.04; 
            orb.vx = (orb.vx / currentSpeed) * nextSpeed;
            orb.vy = (orb.vy / currentSpeed) * nextSpeed;
        }

        // 3. Mise à jour de la position
        orb.x += orb.vx;
        orb.y += orb.vy;

        // 4. Rebond sur les bords
        if (orb.x - orb.radius < 0) { orb.x = orb.radius; orb.vx *= -1; }
        if (orb.x + orb.radius > canvas.width) { orb.x = canvas.width - orb.radius; orb.vx *= -1; }
        if (orb.y - orb.radius < 0) { orb.y = orb.radius; orb.vy *= -1; }
        if (orb.y + orb.radius > canvas.height) { orb.y = canvas.height - orb.radius; orb.vy *= -1; }

        // 5. Dessin
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1.0; 
    requestAnimationFrame(animate);
}

// Passerelles pour app.js / html
window.changeBackgroundParticlesColor = function(newHexColor) {
    currentBallColor = newHexColor;
};

window.toggleAttractionMode = function() {
    isAttracting = !isAttracting;
    return isAttracting;
};

animate();
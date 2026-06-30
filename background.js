const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Suivi de la souris
const mouse = { x: -1000, y: -1000 };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });

// 1. COULEUR PAR DÉFAUT (Sera modifiée dynamiquement par app.js)
let currentBallColor = '#3498db'; 

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

    // 2. GESTION DE L'OPACITÉ GLOBALE DES BALLES
    ctx.globalAlpha = 0.45; // Gère la transparence (équivalent du 0.45 d'avant)
    ctx.fillStyle = currentBallColor; // Applique la couleur active à TOUTES les balles

    orbs.forEach(orb => {
        const dx = orb.x - mouse.x;
        const dy = orb.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < repulsionRadius) {
            const force = (repulsionRadius - distance) / repulsionRadius;
            const angle = Math.atan2(dy, dx);
            orb.vx += Math.cos(angle) * force * repulsionStrength;
            orb.vy += Math.sin(angle) * force * repulsionStrength;
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

        // Dessin de la balle
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // On remet l'opacité à 1 pour ne pas impacter d'autres éléments futurs du canvas
    ctx.globalAlpha = 1.0; 

    requestAnimationFrame(animate);
}

// 3. LA PASSERELLE : Cette fonction devient accessible partout, même dans app.js
window.changeBackgroundParticlesColor = function(newHexColor) {
    currentBallColor = newHexColor;
};

animate();
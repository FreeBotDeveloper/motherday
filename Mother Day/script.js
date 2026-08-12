// ---- URL Customizer ----
const urlParams = new URLSearchParams(window.location.search);
const messages = {
    th: urlParams.has('th') ? decodeURIComponent(urlParams.get('th')) : "ขอบคุณสำหรับความรักและความห่วงใยที่มีให้ผมเสมอมา ขอให้แม่มีความสุขมากๆ สุขภาพร่่างกายแข็งแรง เป็นร่มโพธิ์ร่มไทรของผมตลอดไป รักแม่ที่สุดนะครับ",
    en: urlParams.has('en') ? decodeURIComponent(urlParams.get('en')) : "Thank you for your endless love and care. I wish you all the happiness in the world and good health. You are the best mother anyone could ask for. I love you so much!"
};
const signatures = {
    th: urlParams.has('sign_th') ? decodeURIComponent(urlParams.get('sign_th')) : "ด้วยรักอย่างยิ่ง...",
    en: urlParams.has('sign_en') ? decodeURIComponent(urlParams.get('sign_en')) : "With all my love..."
};

let currentLang = 'th';

// ---- Preloader Logic ----
const preloader = document.getElementById('preloader');
const loadProgress = document.getElementById('load-progress');
let progress = 0;
const loadInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 5) + 1;
    if (progress >= 100) {
        progress = 100;
        clearInterval(loadInterval);
        setTimeout(() => {
            preloader.classList.add('fade-out');
        }, 800);
    }
    loadProgress.innerText = progress;
}, 30);

// ---- Custom Magnetic Cursor ----
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursor-follower');
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let followerX = window.innerWidth / 2;
let followerY = window.innerHeight / 2;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
});

function renderCursor() {
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';
    requestAnimationFrame(renderCursor);
}
renderCursor();

const interactives = document.querySelectorAll('button, .lang-btn, .polaroid');
interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursorFollower.classList.add('magnetic');
        cursor.style.transform = 'translate(-50%, -50%) scale(0)';
    });
    el.addEventListener('mouseleave', () => {
        cursorFollower.classList.remove('magnetic');
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    });
});

// ---- DOM Elements ----
const body = document.body;
const langBtnTh = document.getElementById('lang-th');
const langBtnEn = document.getElementById('lang-en');
const elementsWithData = document.querySelectorAll('[data-th]');
const magicMsg = document.getElementById('magic-msg');
const startOverlay = document.getElementById('start-overlay');
const cardScene = document.getElementById('card-scene');
const bgMusic = document.getElementById('bg-music');
const readBtn = document.getElementById('read-btn');
const closeBtn = document.getElementById('close-btn');
const fireworksBtn = document.getElementById('fireworks-btn');

let interactionStarted = false;

// ---- Language Toggle Logic ----
function setLanguage(lang) {
    if (currentLang === lang) return;
    currentLang = lang;

    if (lang === 'en') {
        body.classList.add('lang-en');
        langBtnEn.classList.add('active');
        langBtnTh.classList.remove('active');
    } else {
        body.classList.remove('lang-en');
        langBtnTh.classList.add('active');
        langBtnEn.classList.remove('active');
    }
    elementsWithData.forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });
    document.querySelector('.signature').textContent = signatures[lang];
    magicMsg.textContent = messages[lang];
}
langBtnTh.addEventListener('click', () => setLanguage('th'));
langBtnEn.addEventListener('click', () => setLanguage('en'));
magicMsg.textContent = messages[currentLang];
document.querySelector('.signature').textContent = signatures[currentLang];

// ---- Web Audio API Setup ----
let audioContext, analyser, dataArray;
let isAudioInitialized = false;

function initAudio() {
    if (isAudioInitialized) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaElementSource(bgMusic);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        isAudioInitialized = true;
    } catch (e) { console.log("Web Audio API init failed:", e); }
}

function getAudioFrequency() {
    if (!isAudioInitialized || !analyser) return 0;
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < 30; i++) sum += dataArray[i];
    return (sum / 30) / 255.0;
}

// ---- Day / Night Logic ----
const currentHour = new Date().getHours();
let targetNightValue = (currentHour >= 18 || currentHour < 6) ? 1.0 : 0.0;
let currentNightValue = targetNightValue;

// ---- Three.js Setup ----
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;

// Main Liquid Shader
const vertexShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uAudioFreq;
    varying vec2 vUv;
    varying float vElevation;

    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vUv = uv;
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        
        float audioBump = uAudioFreq * 1.5;
        float elevation = snoise(vec2(modelPosition.x * 2.0, modelPosition.y * 2.0 + uTime * 0.5)) * (0.2 + audioBump);
        elevation += snoise(vec2(modelPosition.x * 5.0 + uTime * 0.2, modelPosition.y * 5.0)) * 0.1;
        
        float distanceToMouse = distance(uMouse, modelPosition.xy);
        float mouseRipple = 0.0;
        if(distanceToMouse < 1.5) {
            mouseRipple = sin(distanceToMouse * 10.0 - uTime * 5.0) * (1.5 - distanceToMouse) * 0.1;
        }
        
        modelPosition.z += elevation + mouseRipple;
        vElevation = elevation + mouseRipple;
        
        gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }
`;

const fragmentShader = `
    uniform float uTime;
    uniform float uAudioFreq;
    uniform float uNight;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
        vec3 d1 = vec3(1.0, 0.76, 0.82); 
        vec3 d2 = vec3(0.91, 0.83, 0.71); 
        vec3 d3 = vec3(1.0, 0.94, 0.96);
        
        vec3 n1 = vec3(0.04, 0.07, 0.17); 
        vec3 n2 = vec3(0.29, 0.05, 0.31); 
        vec3 n3 = vec3(0.0, 0.9, 1.0);
        
        vec3 color1 = mix(d1, n1, uNight);
        vec3 color2 = mix(d2, n2, uNight);
        vec3 color3 = mix(d3, n3, uNight);
        
        float mixStrength = (vElevation + 0.3) * (1.5 + uAudioFreq);
        vec3 finalColor = mix(color1, color2, mixStrength);
        finalColor = mix(finalColor, color3, sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5);
        
        finalColor += vec3(vElevation * 0.5) + (uAudioFreq * 0.3);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

const geometry = new THREE.PlaneGeometry(15, 10, 128, 128);
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uAudioFreq: { value: 0 },
        uNight: { value: currentNightValue }
    }
});
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// ---- 3D Sparkles ----
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1500;
const posArray = new Float32Array(particlesCount * 3);
const randArray = new Float32Array(particlesCount);
for (let i = 0; i < particlesCount * 3; i += 3) {
    posArray[i] = (Math.random() - 0.5) * 20;
    posArray[i + 1] = (Math.random() - 0.5) * 20;
    posArray[i + 2] = (Math.random() - 0.5) * 5 + 1;
    randArray[i / 3] = Math.random();
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.04, color: 0xffffff, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// ---- Fireworks System ----
let fireworks = [];
function createFirework() {
    const fwGeometry = new THREE.BufferGeometry();
    const fwCount = 200;
    const fwPosArray = new Float32Array(fwCount * 3);
    const fwVelArray = [];
    const colors = [0xff0040, 0x0040ff, 0x80ff80, 0xff8000, 0xff00ff, 0x00ffff];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const originX = (Math.random() - 0.5) * 10;
    const originY = (Math.random() - 0.5) * 4 + 2;
    const originZ = (Math.random() - 0.5) * 2 + 1;

    for (let i = 0; i < fwCount; i++) {
        fwPosArray[i * 3] = originX;
        fwPosArray[i * 3 + 1] = originY;
        fwPosArray[i * 3 + 2] = originZ;

        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = Math.random() * 0.1 + 0.05;
        fwVelArray.push({
            x: Math.sin(phi) * Math.cos(theta) * speed,
            y: Math.sin(phi) * Math.sin(theta) * speed,
            z: Math.cos(phi) * speed
        });
    }
    fwGeometry.setAttribute('position', new THREE.BufferAttribute(fwPosArray, 3));
    const fwMaterial = new THREE.PointsMaterial({
        size: 0.08, color: color, transparent: true, opacity: 1.0,
        blending: THREE.AdditiveBlending, depthWrite: false
    });
    const fwMesh = new THREE.Points(fwGeometry, fwMaterial);
    scene.add(fwMesh);

    fireworks.push({ mesh: fwMesh, geometry: fwGeometry, velocities: fwVelArray, age: 0 });
}

let fireworksActive = false;
let fireworksTimer = 0;

// ---- WebGL Liquid Fog (Wiping Game) ----
const wipeCanvas = document.createElement('canvas');
wipeCanvas.width = window.innerWidth;
wipeCanvas.height = window.innerHeight;
const wipeCtx = wipeCanvas.getContext('2d');
wipeCtx.fillStyle = 'white';
wipeCtx.fillRect(0, 0, wipeCanvas.width, wipeCanvas.height);

const wipeTexture = new THREE.CanvasTexture(wipeCanvas);

const fogGeo = new THREE.PlaneGeometry(30, 20); // Large plane
const fogMat = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uWipeTex: { value: wipeTexture },
        uOpacity: { value: 0.0 }
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform sampler2D uWipeTex;
        uniform float uOpacity;
        varying vec2 vUv;

        // Simple noise for fog
        float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
        float noise(vec2 p){
            vec2 ip = floor(p);
            vec2 u = fract(p);
            u = u*u*(3.0-2.0*u);
            float res = mix(
                mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
                mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
            return res*res;
        }

        void main() {
            // Read wipe texture (white = fog, black = erased)
            float wipeMask = texture2D(uWipeTex, vUv).r;
            
            // Fluid pearlescent movement
            vec2 p = vUv * 5.0;
            float f = noise(p + uTime * 0.2);
            f += noise(p * 2.0 - uTime * 0.3) * 0.5;
            
            vec3 fogColor = mix(vec3(0.9, 0.9, 0.95), vec3(1.0, 0.8, 0.9), f); // Pearl white/pink
            
            // Combine mask and opacity
            float alpha = wipeMask * uOpacity * (0.7 + f * 0.3); // Semi-transparent fog
            
            gl_FragColor = vec4(fogColor, alpha);
        }
    `
});
const fogMesh = new THREE.Mesh(fogGeo, fogMat);
fogMesh.position.z = 4.5; // In front of particles, right before camera
scene.add(fogMesh);

const fogHint = document.getElementById('fog-hint');
let fogActive = false;
let erasedPixels = 0;
const totalPixels = wipeCanvas.width * wipeCanvas.height;
let fogTargetOpacity = 0.0;

function eraseFog(clientX, clientY) {
    if (!fogActive) return;

    // Draw black circle on virtual canvas
    wipeCtx.fillStyle = 'black';
    wipeCtx.beginPath();
    wipeCtx.arc(clientX, clientY, 80, 0, Math.PI * 2); // 80px brush
    wipeCtx.fill();
    wipeTexture.needsUpdate = true;

    erasedPixels += Math.PI * 80 * 80;

    // If ~30% is erased, clear all
    if (erasedPixels > totalPixels * 0.3) {
        fogActive = false;
        fogHint.classList.remove('active');
        fogTargetOpacity = 0.0; // Fade out shader

        cardScene.classList.add('active');
        setTimeout(() => {
            cardScene.classList.add('open');
            polaroidsContainer.classList.add('active');
        }, 500);
    }
}

let isErasing = false;
window.addEventListener('mousedown', () => { if (fogActive) isErasing = true; });
window.addEventListener('mouseup', () => { isErasing = false; });
window.addEventListener('mousemove', (e) => {
    if (isErasing && fogActive) eraseFog(e.clientX, e.clientY);
});
window.addEventListener('touchstart', (e) => {
    if (fogActive) { isErasing = true; eraseFog(e.touches[0].clientX, e.touches[0].clientY); }
});
window.addEventListener('touchmove', (e) => {
    if (isErasing && fogActive) eraseFog(e.touches[0].clientX, e.touches[0].clientY);
});
window.addEventListener('touchend', () => { isErasing = false; });


// ---- Interactive WebGL & Gyroscope ----
const clock = new THREE.Clock();
const mouse3D = new THREE.Vector2(-10, -10);
let targetMouse3D = new THREE.Vector2(-10, -10);
let isMobileDevice = false;

function onMouseMoveWebGl(event) {
    if (isMobileDevice) return; // Let gyro handle it if mobile
    targetMouse3D.x = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouse3D.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function handleOrientation(event) {
    isMobileDevice = true;
    let beta = event.beta;  // X-axis (front-back tilt)
    let gamma = event.gamma; // Y-axis (left-right tilt)

    if (beta === null || gamma === null) return;

    // Limit ranges for better UX
    if (beta > 90) beta = 90;
    if (beta < -90) beta = -90;

    // Map tilt angles to -1.0 to 1.0 range
    let x = gamma / 45.0; // Max tilt 45deg
    let y = (beta - 45.0) / 45.0; // Assume 45deg is resting position

    targetMouse3D.x = Math.max(-1.5, Math.min(1.5, x));
    targetMouse3D.y = Math.max(-1.5, Math.min(1.5, -y)); // Invert Y
}

// ---- Polaroid Physics ----
const polaroids = document.querySelectorAll('.polaroid');
const polaroidsContainer = document.getElementById('polaroids-container');
let draggedPol = null;
let lastDragX = 0, lastDragY = 0;

polaroids.forEach((pol, i) => {
    pol.posX = window.innerWidth / 2 + (Math.random() - 0.5) * 400 - 100;
    pol.posY = window.innerHeight / 2 + (Math.random() - 0.5) * 400 - 120;
    pol.vx = (Math.random() - 0.5) * 4;
    pol.vy = (Math.random() - 0.5) * 4;
    pol.rot = (Math.random() - 0.5) * 40;
    pol.isDragging = false;

    const startDrag = (clientX, clientY) => {
        if (fogActive || fireworksActive) return;
        draggedPol = pol;
        pol.isDragging = true;
        lastDragX = clientX; lastDragY = clientY;
        polaroids.forEach(p => p.style.zIndex = 1);
        pol.style.zIndex = 2;
    };

    pol.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
    pol.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX, e.touches[0].clientY));
});

window.addEventListener('mousemove', (e) => {
    if (draggedPol) {
        let dx = e.clientX - lastDragX;
        let dy = e.clientY - lastDragY;
        draggedPol.posX += dx; draggedPol.posY += dy;
        draggedPol.vx = dx * 0.5; draggedPol.vy = dy * 0.5;
        lastDragX = e.clientX; lastDragY = e.clientY;
    }
    onMouseMoveWebGl(e);
});
window.addEventListener('mouseup', () => { if (draggedPol) draggedPol.isDragging = false; draggedPol = null; });
window.addEventListener('touchend', () => { if (draggedPol) draggedPol.isDragging = false; draggedPol = null; });

function animatePolaroids() {
    polaroids.forEach(pol => {
        if (!pol.isDragging) {
            pol.posX += pol.vx; pol.posY += pol.vy;
            pol.vx *= 0.96; pol.vy *= 0.96;

            // Gyroscope Parallax force
            if (isMobileDevice) {
                pol.vx += targetMouse3D.x * 0.2;
                pol.vy += targetMouse3D.y * -0.2;
            }

            if (pol.posX < 0) { pol.posX = 0; pol.vx *= -1; }
            if (pol.posX > window.innerWidth - 200) { pol.posX = window.innerWidth - 200; pol.vx *= -1; }
            if (pol.posY < 0) { pol.posY = 0; pol.vy *= -1; }
            if (pol.posY > window.innerHeight - 240) { pol.posY = window.innerHeight - 240; pol.vy *= -1; }
        }
        pol.style.transform = `translate(${pol.posX}px, ${pol.posY}px) rotate(${pol.rot}deg)`;
    });
    requestAnimationFrame(animatePolaroids);
}
animatePolaroids();

// ---- Star Catching Mini-Game ----
const starCounter = document.getElementById('star-counter');
const secretGiftModal = document.getElementById('secret-gift-modal');
const closeGiftBtn = document.getElementById('close-gift-btn');
let starsCollected = 0;
const maxStars = 5;
let starInterval;
let activeStars = [];

function spawnStar() {
    if (starsCollected >= maxStars) return;
    const star = document.createElement('div');
    star.className = 'falling-star';
    star.innerHTML = '⭐';
    star.style.left = (Math.random() * (window.innerWidth - 100)) + 50 + 'px';
    star.style.top = '-50px';

    star.posY = -50;
    star.speed = Math.random() * 2 + 1;

    document.body.appendChild(star);

    star.addEventListener('mousedown', (e) => {
        if (star.classList.contains('star-burst')) return;
        e.stopPropagation();
        star.classList.add('star-burst');
        starsCollected++;
        starCounter.innerText = `⭐ ${starsCollected}/${maxStars}`;

        if (starsCollected >= maxStars) {
            clearInterval(starInterval);
            setTimeout(() => {
                secretGiftModal.classList.add('active');
            }, 1000);
        }

        setTimeout(() => {
            if (star.parentNode) star.parentNode.removeChild(star);
            activeStars = activeStars.filter(s => s.element !== star);
        }, 500);
    });

    activeStars.push({ element: star, speed: star.speed });
}

function animateFallingStars() {
    activeStars.forEach((s, index) => {
        if (!s.element.classList.contains('star-burst')) {
            s.element.posY += s.speed;
            s.element.style.transform = `translateY(${s.element.posY}px)`;

            if (s.element.posY > window.innerHeight) {
                if (s.element.parentNode) s.element.parentNode.removeChild(s.element);
                activeStars.splice(index, 1);
            }
        }
    });
    requestAnimationFrame(animateFallingStars);
}
animateFallingStars();

// ---- Cinematic Ending ----
const cinematicContainer = document.getElementById('cinematic-container');
const countdownNumber = document.getElementById('countdown-number');
const supernovaFlash = document.getElementById('supernova-flash');
const finalMessage = document.getElementById('final-message');

function startCinematicEnding() {
    cinematicContainer.classList.add('active');

    let count = 10;

    function tick() {
        if (count > 0) {
            countdownNumber.innerText = count;

            // Re-trigger animation
            countdownNumber.classList.remove('animate-tick');
            void countdownNumber.offsetWidth; // Trigger DOM reflow
            countdownNumber.classList.add('animate-tick');

            count--;
            setTimeout(tick, 1000);
        } else {
            // Reached 0 -> Supernova
            supernovaFlash.classList.add('flash');
            countdownNumber.style.display = 'none';

            // Fade in final message during the flash fade out
            setTimeout(() => {
                finalMessage.classList.add('reveal');
            }, 800);
        }
    }

    // Wait for the black background to fade in before starting
    setTimeout(tick, 1000);
}

closeGiftBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    secretGiftModal.classList.remove('active');

    // Trigger the grand finale!
    startCinematicEnding();
});

// ---- Flow Logic ----
function startExperience() {
    if (!interactionStarted) {
        interactionStarted = true;
        initAudio();
        if (bgMusic) {
            bgMusic.volume = 0.5;
            bgMusic.play().then(() => {
                if (audioContext && audioContext.state === 'suspended') audioContext.resume();
            }).catch(e => console.log("Audio block"));
        }

        // Request iOS 13+ Gyroscope Permission
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                }).catch(console.error);
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    }
}

// ---- Share Buttons Logic ----
document.getElementById('share-fb').addEventListener('click', (e) => {
    e.stopPropagation();
    const shareUrl = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
});

document.getElementById('share-line').addEventListener('click', (e) => {
    e.stopPropagation();
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(currentLang === 'th' ? "สุขสันต์วันแม่! สัมผัสประสบการณ์เว็บไซต์บอกรักแม่สุดอลังการ 🎇" : "Happy Mother's Day! Check out this amazing 3D experience 🎇");
    window.open(`https://social-plugins.line.me/lineit/share?url=${shareUrl}&text=${shareText}`, '_blank');
});

document.getElementById('share-x').addEventListener('click', (e) => {
    e.stopPropagation();
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(currentLang === 'th' ? "สุขสันต์วันแม่! สัมผัสประสบการณ์เว็บไซต์บอกรักแม่สุดอลังการ 🎇" : "Happy Mother's Day! Check out this amazing 3D experience 🎇");
    window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`, '_blank');
});

document.getElementById('share-copy').addEventListener('click', (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert(currentLang === 'th' ? "คัดลอกลิงก์สำเร็จแล้ว!" : "Link copied to clipboard!");
    });
});

readBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startExperience();
    startOverlay.classList.remove('active');

    // TRIGGER 3D FOG GAME
    fogActive = true;
    fogTargetOpacity = 1.0;
    fogHint.classList.add('active');
});

closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cardScene.classList.remove('open');
    polaroidsContainer.classList.remove('active');
    setTimeout(() => {
        cardScene.classList.remove('active');
        startOverlay.classList.add('active');
    }, 1500);
});

fireworksBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cardScene.classList.remove('open');
    polaroidsContainer.classList.remove('active');
    targetNightValue = 1.0;
    fireworksActive = true;

    starCounter.classList.add('active');
    starInterval = setInterval(spawnStar, 1500);
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Also resize wipe canvas
    wipeCanvas.width = window.innerWidth;
    wipeCanvas.height = window.innerHeight;
    wipeCtx.fillStyle = 'white';
    wipeCtx.fillRect(0, 0, wipeCanvas.width, wipeCanvas.height);
    wipeTexture.needsUpdate = true;
    erasedPixels = 0;
});

// ---- Render Loop ----
function animate() {
    const elapsedTime = clock.getElapsedTime();
    const audioFreq = getAudioFrequency();

    // Smooth mouse / gyro interpolation
    mouse3D.x += (targetMouse3D.x - mouse3D.x) * 0.1;
    mouse3D.y += (targetMouse3D.y - mouse3D.y) * 0.1;
    material.uniforms.uMouse.value.x = mouse3D.x * (window.innerWidth / window.innerHeight) * 3.5;
    material.uniforms.uMouse.value.y = mouse3D.y * 3.5;

    currentNightValue += (targetNightValue - currentNightValue) * 0.02;
    material.uniforms.uNight.value = currentNightValue;
    particlesMaterial.color.setHex(0xffffff).lerp(new THREE.Color(0x00e5ff), currentNightValue);

    material.uniforms.uTime.value = elapsedTime;
    material.uniforms.uAudioFreq.value = audioFreq;

    // Update Fog Shader
    fogMat.uniforms.uTime.value = elapsedTime;
    fogMat.uniforms.uOpacity.value += (fogTargetOpacity - fogMat.uniforms.uOpacity.value) * 0.05;

    const positions = particlesGeometry.attributes.position.array;
    for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += 0.01 + (randArray[i] * 0.01) + (audioFreq * 0.02);
        positions[i3] += Math.sin(elapsedTime + randArray[i] * 10) * 0.005;
        if (positions[i3 + 1] > 10) positions[i3 + 1] = -10;
    }
    particlesGeometry.attributes.position.needsUpdate = true;
    particlesMesh.rotation.y = Math.sin(elapsedTime * 0.1) * 0.1;

    if (fireworksActive) {
        fireworksTimer += 1;
        if (fireworksTimer > (30 - audioFreq * 20)) {
            createFirework();
            fireworksTimer = 0;
        }
    }

    for (let i = fireworks.length - 1; i >= 0; i--) {
        let fw = fireworks[i];
        fw.age += 1;
        let fwPos = fw.geometry.attributes.position.array;
        for (let j = 0; j < fwPos.length / 3; j++) {
            fwPos[j * 3] += fw.velocities[j].x;
            fwPos[j * 3 + 1] += fw.velocities[j].y;
            fwPos[j * 3 + 2] += fw.velocities[j].z;
            fw.velocities[j].y -= 0.002;
            fw.velocities[j].x *= 0.98;
            fw.velocities[j].y *= 0.98;
            fw.velocities[j].z *= 0.98;
        }
        fw.geometry.attributes.position.needsUpdate = true;
        fw.mesh.material.opacity = 1.0 - (fw.age / 100);

        if (fw.age > 100) {
            scene.remove(fw.mesh);
            fw.geometry.dispose();
            fw.mesh.material.dispose();
            fireworks.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

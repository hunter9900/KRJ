// 3D Jewellery Viewer - Three.js Implementation
// This file contains all the 3D rendering logic

let scene, camera, renderer, currentModel = null;
let controls = null;
let currentMetalColor = '#ffd700'; // Default yellow gold

// Metal colors and price multipliers
const metalOptions = {
    'yellow_gold': { color: '#ffd700', name: 'Yellow Gold', multiplier: 1.0, pricePerGram: 6500 },
    'white_gold': { color: '#e8e8e8', name: 'White Gold', multiplier: 1.05, pricePerGram: 6825 },
    'rose_gold': { color: '#e8a87c', name: 'Rose Gold', multiplier: 1.08, pricePerGram: 7020 },
    'platinum': { color: '#e5e4e2', name: 'Platinum', multiplier: 1.5, pricePerGram: 9750 }
};

// Initialize 3D scene
function init3DViewer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(2, 1.5, 3);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Add OrbitControls for interaction
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    
    // Add lights
    addLights();
    
    // Add environment
    addEnvironment();
    
    // Add a default ring model (will be replaced with actual product)
    createDefaultRing();
    
    // Start animation loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => onWindowResize(containerId));
}

function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(2, 5, 3);
    mainLight.castShadow = true;
    mainLight.receiveShadow = true;
    scene.add(mainLight);
    
    // Fill light from below
    const fillLight = new THREE.PointLight(0x4466cc, 0.3);
    fillLight.position.set(0, -2, 0);
    scene.add(fillLight);
    
    // Back rim light
    const rimLight = new THREE.PointLight(0xffaa66, 0.5);
    rimLight.position.set(-1, 1, -2);
    scene.add(rimLight);
    
    // Warm fill from front
    const warmLight = new THREE.PointLight(0xff8866, 0.4);
    warmLight.position.set(1, 1.5, 2);
    scene.add(warmLight);
    
    // Cool fill from side
    const coolLight = new THREE.PointLight(0x66aaff, 0.3);
    coolLight.position.set(2, 1, 1);
    scene.add(coolLight);
}

function addEnvironment() {
    // Ground reflection effect (invisible plane for shadows)
    const groundPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 5),
        new THREE.ShadowMaterial({ opacity: 0.5, color: 0x000000, transparent: true, side: THREE.DoubleSide })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.8;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);
    
    // Add a subtle grid helper
    const gridHelper = new THREE.GridHelper(5, 20, 0x88aaff, 0x335588);
    gridHelper.position.y = -0.75;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    scene.add(gridHelper);
    
    // Add floating particles (sparkle effect)
    const particleCount = 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        particlesPositions[i * 3] = (Math.random() - 0.5) * 8;
        particlesPositions[i * 3 + 1] = (Math.random() - 0.5) * 3 + 0.5;
        particlesPositions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    const particlesMaterial = new THREE.PointsMaterial({ color: 0xffaa66, size: 0.02, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
}

function createDefaultRing() {
    // Create a beautiful ring using torus geometry
    const ringGroup = new THREE.Group();
    
    // Main band
    const bandGeometry = new THREE.TorusGeometry(0.8, 0.12, 64, 128);
    const bandMaterial = new THREE.MeshStandardMaterial({ color: currentMetalColor, metalness: 0.9, roughness: 0.3, emissive: 0x221100 });
    const band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.rotation.x = Math.PI / 2;
    ringGroup.add(band);
    
    // Center stone (diamond)
    const stoneGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x88aaff, metalness: 0.1, roughness: 0.2, emissive: 0x224466 });
    const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
    stone.position.y = 0.15;
    ringGroup.add(stone);
    
    // Stone halo (small diamonds around)
    const haloCount = 8;
    for (let i = 0; i < haloCount; i++) {
        const angle = (i / haloCount) * Math.PI * 2;
        const smallStone = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xaaccff, metalness: 0.2, roughness: 0.1 })
        );
        smallStone.position.set(Math.cos(angle) * 0.65, 0.08, Math.sin(angle) * 0.65);
        ringGroup.add(smallStone);
    }
    
    // Side details
    const detailCount = 12;
    for (let i = 0; i < detailCount; i++) {
        const angle = (i / detailCount) * Math.PI * 2;
        const detail = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshStandardMaterial({ color: currentMetalColor, metalness: 0.95, roughness: 0.2 })
        );
        detail.position.set(Math.cos(angle) * 0.95, -0.1, Math.sin(angle) * 0.95);
        ringGroup.add(detail);
    }
    
    scene.add(ringGroup);
    currentModel = ringGroup;
}

function createPendantModel() {
    const pendantGroup = new THREE.Group();
    
    // Main pendant body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: currentMetalColor, metalness: 0.85, roughness: 0.25 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    pendantGroup.add(body);
    
    // Bail (top loop)
    const bailGeometry = new THREE.TorusGeometry(0.2, 0.08, 32, 64);
    const bailMaterial = new THREE.MeshStandardMaterial({ color: currentMetalColor, metalness: 0.9, roughness: 0.2 });
    const bail = new THREE.Mesh(bailGeometry, bailMaterial);
    bail.position.y = 0.55;
    bail.rotation.x = Math.PI / 2;
    pendantGroup.add(bail);
    
    // Center stone
    const stone = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x88aaff, metalness: 0.1, roughness: 0.15, emissive: 0x224466 })
    );
    stone.position.y = 0;
    pendantGroup.add(stone);
    
    scene.add(pendantGroup);
    currentModel = pendantGroup;
}

function createEarringModel() {
    const earringGroup = new THREE.Group();
    
    // Main circle
    const circleGeometry = new THREE.TorusGeometry(0.55, 0.1, 48, 96);
    const circleMaterial = new THREE.MeshStandardMaterial({ color: currentMetalColor, metalness: 0.9, roughness: 0.25 });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    earringGroup.add(circle);
    
    // Hanging pearl
    const pearl = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xffccaa, metalness: 0.1, roughness: 0.05, emissive: 0x442200 })
    );
    pearl.position.y = -0.65;
    earringGroup.add(pearl);
    
    // Small diamonds on circle
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const diamond = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xaaccff, metalness: 0.2, roughness: 0.1 })
        );
        diamond.position.set(Math.cos(angle) * 0.65, Math.sin(angle) * 0.65, 0);
        earringGroup.add(diamond);
    }
    
    scene.add(earringGroup);
    currentModel = earringGroup;
}

function createBraceletModel() {
    const braceletGroup = new THREE.Group();
    
    // Chain links
    const linkCount = 12;
    for (let i = 0; i < linkCount; i++) {
        const angle = (i / linkCount) * Math.PI * 2;
        const linkGeometry = new THREE.TorusGeometry(0.15, 0.06, 16, 32);
        const linkMaterial = new THREE.MeshStandardMaterial({ color: currentMetalColor, metalness: 0.85, roughness: 0.3 });
        const link = new THREE.Mesh(linkGeometry, linkMaterial);
        link.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.5 + 0.2, 0);
        link.rotation.z = angle;
        braceletGroup.add(link);
    }
    
    // Center charm
    const charm = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.1),
        new THREE.MeshStandardMaterial({ color: currentMetalColor, metalness: 0.9, roughness: 0.2 })
    );
    charm.position.set(0, 0.5, 0);
    braceletGroup.add(charm);
    
    scene.add(braceletGroup);
    currentModel = braceletGroup;
}

function updateModelMetalColor(color) {
    if (!currentModel) return;
    
    currentModel.traverse((child) => {
        if (child.isMesh && child.material) {
            // Only update metal parts (not stones)
            if (child.material.color.getHex() !== 0x88aaff && 
                child.material.color.getHex() !== 0xaaccff &&
                child.material.color.getHex() !== 0xffccaa) {
                child.material.color.set(color);
            }
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) {
        controls.update(); // Update controls (handles auto-rotate)
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResize(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !camera || !renderer) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Load a specific product model based on category
function loadProductModel(category) {
    // Remove existing model
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    // Load appropriate model based on category
    switch(category) {
        case 'Ring':
            createDefaultRing();
            break;
        case 'Necklace':
            createPendantModel();
            break;
        case 'Earrings':
            createEarringModel();
            break;
        case 'Bracelet':
            createBraceletModel();
            break;
        default:
            createDefaultRing();
    }
}

// Change metal type and update price
function changeMetalType(metalKey, basePrice, callback) {
    const metal = metalOptions[metalKey];
    if (!metal) return;
    
    currentMetalColor = metal.color;
    updateModelMetalColor(currentMetalColor);
    
    const newPrice = basePrice * metal.multiplier;
    if (callback) callback(newPrice, metal.name);
    
    return { price: newPrice, metalName: metal.name, pricePerGram: metal.pricePerGram };
}

// Start auto-rotation
function startAutoRotate() {
    if (controls) {
        controls.autoRotate = true;
    }
}

// Stop auto-rotation
function stopAutoRotate() {
    if (controls) {
        controls.autoRotate = false;
    }
}

// Reset camera view
function resetView() {
    if (camera && controls) {
        camera.position.set(2, 1.5, 3);
        controls.target.set(0, 0, 0);
        controls.update();
    }
}

// Export functions for use in HTML
window.init3DViewer = init3DViewer;
window.loadProductModel = loadProductModel;
window.changeMetalType = changeMetalType;
window.startAutoRotate = startAutoRotate;
window.stopAutoRotate = stopAutoRotate;
window.resetView = resetView;

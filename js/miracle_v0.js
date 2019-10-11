var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

const loader = new THREE.TextureLoader();

const matDefaults = {
    transparent: true,
    flatShading: true,
    precision: 'highp'
}

var masks = [
    loader.load('alphamask1.png'),
    loader.load('alphamask2.png')
]

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var container = new THREE.PlaneGeometry(1280, 800);

var materials = [
    new THREE.MeshLambertMaterial({
        color: 0x309288,
        map: masks[0],
        alphaMap: masks[0],
        transparent: true,
        side: THREE.DoubleSide
    }),
    new THREE.MeshLambertMaterial({
        color: 0x12423c,
        map: masks[1],
        alphaMap: masks[1],
        transparent: true,
        side: THREE.DoubleSide
    })
];

var meshes = [
    new THREE.Mesh(container, materials[0]),
    new THREE.Mesh(container, materials[1])
];

scene.add(meshes[0]);
scene.add(meshes[1]);
scene.add(light);

meshes[0].position.z = -1000;
meshes[1].position.z = -1100;
camera.position.z = 5;

var updatePlane = function (plane) {
    plane.position.z += 1;
    if (plane.position.z > 0.1) {
        plane.position.z = -1100;
    }
};

var animate = function () {
    requestAnimationFrame(animate);

    scene.traverse( function (child) {
        if (child instanceof THREE.Mesh) {
            updatePlane(child);
        }
    });
    renderer.render(scene, camera);
};

animate();


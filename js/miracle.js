/*
    ---------------------
    MIRACLE - Main Module
    ---------------------
 */

// Import dependencies
import * as THREE from '../lib/three/build/three.module.js';
import {EffectComposer} from '../lib/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../lib/three/examples/jsm/postprocessing/RenderPass.js';
import {FilmPass} from '../lib/three/examples/jsm/postprocessing/FilmPass.js';
import {SMAAPass} from '../lib/three/examples/jsm/postprocessing/SMAAPass.js';
import anime from '../lib/animejs/lib/anime.es.js';

// Variables
window.THREE = THREE; // for debugger

// Interaction triggers
// Either boolean or influence percentage
var triggers = {
    rotateSea: 0
};

document.getElementById('start-button').onclick = requestPermissions;

// For devices that need permission requesting
function requestPermissions() {
    if (isMobile && typeof(DeviceMotionEvent) !== 'undefined' && typeof(DeviceMotionEvent.requestPermission) === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', onDeviceMove, {passive: false});
                }
            })
            .catch(console.error)
    } else {
        window.addEventListener('deviceorientation', onDeviceMove, {passive: false});
    }

    createScene();
}

function onDeviceMove(e) {
    e.preventDefault();

    let alpha = e.alpha;
    //let gamma = e.gamma;
    let beta = e.beta;

    // Normalizing the alpha range from -90 to 90.
    if (alpha >= 0 && alpha <= 180) {
        alpha *= -1;
    } else if (alpha > 180 && alpha <= 360) {
        alpha = 360 - alpha;
    } else if (alpha > 90) {
        alpha = 90;
    } else {
        alpha = -90;
    }

    // Avoiding jumps with axis changes
    if (beta > 90) alpha = -alpha;

    // Limiting beta range
    if (beta > 180) beta = 180;
    if (beta < 0) beta = 0;

    input.a = alpha;
    //input.g = gamma;
    input.b = beta;

}

// SCENE CREATION

function createScene() {

    var container = document.querySelector(".landscape");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var scene, renderer, camera, composer, filmPass;
    var terrain, sky, largeSphere, mediumSphere, smallSphere;
    var bubbles = [];
    var then = 0;

    init();

    function init() {

        sceneSetup();
        sceneElements();
        sceneTextures();
        render();

        if (!isMobile()) {
            window.addEventListener("mousemove", onInputMove);
        }

        resize();

        animationSetup();
        sound.play();

        document.querySelector('.overlay').setAttribute("class", "overlay hidden");
        document.querySelector('.experience-info').remove();
        document.querySelector('.experience-info').remove();
        document.querySelector('#start-button').remove();
    }

    function animationSetup() {
        let start;

        tl = anime.timeline({
            easing: 'easeInOutSine',
            begin: function(anim) {
                start = new Date().getTime();
            },
            update: function (anim) {
                //output.innerHTML = new Date().getTime() - start;
            }
        });

        tl.add({
            targets: terrain.material.uniforms.speed,
            duration: sound.duration() * 1000,
            value: 2
        });

        tl.add({
            targets: terrain.material.uniforms.greyness,
            value: 0.0,
            duration: 500
        }, 13000);

        tl.add({
            targets: sky.material,
            opacity: 1.0,
            duration: 500
        }, 13000);

        tl.add({
            targets: largeSphere.position,
            y: 5,
            duration: 4500
        }, 10000);

        tl.add({
            targets: mediumSphere.position,
            y: 2,
            duration: 4500
        }, 10100);

        tl.add({
            targets: smallSphere.position,
            y: 0,
            duration: 4500
        }, 10200);

        tl.add({
            targets: triggers,
            duration: 2000,
            rotateSea: 1
        }, 13000);

        tl.add({
            targets: largeSphere.position,
            easing: 'easeInQuint',
            y: -200,
            duration: 5000
        }, 55000);

        tl.add({
            targets: mediumSphere.position,
            easing: 'easeInQuint',
            y: -200,
            duration: 5000
        }, 56000);

        tl.add({
            targets: smallSphere.position,
            easing: 'easeInQuint',
            y: -200,
            duration: 5000
        }, 57000);

        for (let i = 0; i < bubbles.length; i++) {
            tl.add({
                targets: bubbles[i].position,
                easing: 'easeOutSine',
                y: "-= 200",
                delay: i * 100,
                duration: 8000
            }, 55000);
        }

        tl.add({
            targets: largeSphere.position,
            y: 5,
            duration: 4500
        }, 68000);

        tl.add({
            targets: mediumSphere.position,
            y: 2,
            duration: 4500
        }, 68100);

        tl.add({
            targets: smallSphere.position,
            y: 0,
            duration: 4500
        }, 68200);

        tl.add({
            target: document,
            easing: 'easeInOutSine',
            duration: 1000,
            begin: function () {
                document.querySelector('#orientation-info').remove();
                document.querySelector('.overlay').cloneNode('template');
                document.querySelector('.overlay').setAttribute("class", "overlay end");
            },
            complete: function () {
                container.remove();
            }
        }, sound.duration() * 1000);

    }

    function sceneSetup() {
        scene = new THREE.Scene();
        window.scene = scene; // for debugger

        createSky();

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 10000);
        camera.position.y = 50;
        camera.rotation.x = -Math.PI / 8;

        var ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        renderer = new THREE.WebGLRenderer({
            canvas: container,
            antialias: true,
        });

        renderer.setPixelRatio = devicePixelRatio;
        renderer.setSize(width, height);

        composer = new EffectComposer(renderer);
        composer.setSize(width, height);

        var renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        filmPass = new FilmPass(
            0.2,   // noise intensity
            0.025,  // scanline intensity
            648,    // scanline count
            false,  // grayscale
        );
        filmPass.renderToScreen = true;
        composer.addPass(filmPass);

        var SMAApass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
        composer.addPass(SMAApass);

    }

    function sceneElements() {

        // Main sea mesh
        var geometry = new THREE.PlaneBufferGeometry(800, 600, 400, 400);

        var uniforms = {
            time: {type: "f", value: 0.0},
            distortCenter: {type: "f", value: 0.1},
            palette: {type: "t", value: null},
            speed: {type: "f", value: 1},
            maxHeight: {type: "f", value: 50},
            waveHeight: {type: "f", value: 0.5},
            waveSize: {type: "f", value: 20.0},
            greyness: {type: "f", value: 1.0},
            color: new THREE.Color(1, 1, 1)
        }

        var material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([THREE.ShaderLib.basic.uniforms, uniforms]),
            vertexShader: document.getElementById('custom-vertex').textContent,
            fragmentShader: document.getElementById('custom-fragment').textContent,
            wireframe: false,
            transparent: true,
            opacity: 0.8
        });

        terrain = new THREE.Mesh(geometry, material);
        terrain.position.z = -200;
        terrain.rotation.x = -Math.PI / 2;
        scene.add(terrain);

        // Main sphere meshes

        geometry = new THREE.SphereGeometry(10, 32, 32);
        material = new THREE.MeshBasicMaterial({color: 0xb2b2b2});
        largeSphere = new THREE.Mesh(geometry, material);

        geometry = new THREE.SphereGeometry(4, 32, 32);
        mediumSphere = new THREE.Mesh(geometry, material);

        geometry = new THREE.SphereGeometry(2, 32, 32);
        smallSphere = new THREE.Mesh(geometry, material);

        scene.add(largeSphere);

        largeSphere.position.x = 0;
        largeSphere.position.y = -500;
        largeSphere.position.z = -200;

        scene.add(mediumSphere);

        mediumSphere.position.x = 0;
        mediumSphere.position.y = -500;
        mediumSphere.position.z = -135;

        scene.add(smallSphere);

        smallSphere.position.x = 0;
        smallSphere.position.y = -500;
        smallSphere.position.z = -100;

        // Secondary meshes
        for (let i = 0; i < 29; i++) {
            let colorSeed = Math.random();
            geometry = new THREE.SphereGeometry(Math.random() * 5, 32, 32);
            material = new THREE.MeshBasicMaterial({
                color: 0x69B3CB,
                transparent: true,
                opacity: Math.random() + 0.5,
                blendingMode: THREE.AdditiveBlending,
                depthFunc: THREE.AlwaysDepth
            });

            bubbles.push(new THREE.Mesh(geometry,material));
            scene.add(bubbles[i]);
            bubbles[i].position.x = Math.floor(Math.random() * 401) - 200;
            bubbles[i].position.y = Math.floor(Math.random() * 101) + 200;
            bubbles[i].position.z = -Math.floor(Math.random() * 401) + 100;
        }

    }

    function sceneTextures() {
        // pallete
        new THREE.TextureLoader().load('img/waves_edges.png', function (texture) {
            terrain.material.uniforms.palette.value = texture;
            terrain.material.needsUpdate = true;
        });
    }

    function createSky() {
        var skyGeo = new THREE.SphereGeometry(500, 25, 25);

        var loader = new THREE.TextureLoader();
        var texture = loader.load("img/sky.png");

        var material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0
        });

        sky = new THREE.Mesh(skyGeo, material);
        sky.material.side = THREE.BackSide;

        scene.add(sky);
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    function onInputMove(e) {
        e.preventDefault();

        var x, y;
        x = e.clientX;
        y = e.clientY;

        input.x = x;
        input.y = y;

    }


    function render() {

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

        if (isMobile()) {

            let softener = Math.max(map(input.b, 0, 90, 0.1, 0.01),0.01);
            input.aPrev = lerp(input.aPrev, input.a, softener);
            input.bPrev = lerp(input.bPrev, input.b, 0.1);
            terrain.material.uniforms.distortCenter.value = map(input.aPrev, -90, 90, -0.02, 0.02);
            terrain.material.uniforms.waveHeight.value = map(input.bPrev, 0, 135, 0.01, 0.5);
            terrain.material.uniforms.waveSize.value = map(input.bPrev, 0, 135, 15.0, 20.0);

            camera.rotation.z = Math.sin(map(input.aPrev, -90, 90, 90 * Math.PI / 180, -90 * Math.PI / 180)) * triggers.rotateSea;

            largeSphere.position.y += Math.cos(time * 1.35 + 100) * 0.1;
            mediumSphere.position.y += Math.cos(time * 1.35 + 50) * 0.05;
            smallSphere.position.y += Math.cos(time * 1.35) * 0.03;

            camera.position.y = Math.sin(time * 1.05) * 10 + map(input.bPrev, 35, 135, 50, 100);


        } else {
            input.xDamped = lerp(input.xDamped, input.x, 0.1);
            input.yDamped = lerp(input.yDamped, input.y, 0.01);
            terrain.material.uniforms.distortCenter.value = map(input.xDamped, 0, width, -0.02, 0.02);
            terrain.material.uniforms.waveHeight.value = map(input.yDamped, 0, height, 0.01, 0.5);
            terrain.material.uniforms.waveSize.value = map(input.yDamped, 0, height, 15.0, 20.0);

            camera.rotation.z = 0.25 * Math.sin(map(input.xDamped, 0, width, 90 * Math.PI / 180, -90 * Math.PI / 180)) * triggers.rotateSea;

            largeSphere.position.y += Math.cos(time * 1.35 + 100) * 0.1;
            mediumSphere.position.y += Math.cos(time * 1.35 + 50) * 0.05;
            smallSphere.position.y += Math.cos(time * 1.35) * 0.02;

            camera.position.y += Math.sin(time * 1.05) * 0.25;

        }

        terrain.material.uniforms.time.value = time;

        composer.render(deltaTime);
        requestAnimationFrame(render);
    }

    function map(value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
    }

    function lerp(start, end, amt) {
        return (1 - amt) * start + amt * end
    }
}
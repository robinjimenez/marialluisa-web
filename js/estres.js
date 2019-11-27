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
var onDeviceMove;
window.THREE = THREE; // for debugger

// Interaction triggers
// Either boolean or influence percentage
var triggers;

document.getElementById('start-button').onclick = requestPermissions;

// For devices that need permission requesting
function requestPermissions() {
    if (isMobile && typeof(DeviceMotionEvent) !== 'undefined' && typeof(DeviceMotionEvent.requestPermission) === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response == 'granted') {
                    window.addEventListener('deviceorientation', onDeviceMove, {passive: false});
                }
            })
            .catch(console.error)
    } else {
        window.addEventListener('deviceorientation', onDeviceMove, {passive: false});
    }

    createScene();
}

// SCENE CREATION

function createScene() {

    var container = document.querySelector("#display");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var scene, renderer, camera, composer, filmPass;
    var tunnels = [];
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
                output.innerHTML = new Date().getTime() - start;
            }
        });

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

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 10000);

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

        var geometry = new THREE.CylinderGeometry(200, 50, 1000, 32, 32,  true);
        geometry.rotateX(Math.PI/2);
        var sphere = new THREE.SphereBufferGeometry(2, 8,8);

        var material = new THREE.MeshBasicMaterial({
            color: 0xf4f4f4,
            transparent: true,
            side: THREE.BackSide,
            opacity: 0.5
        });

        for (let i = 0; i < geometry.vertices.length; i++) {
            let dot = new THREE.Mesh(sphere, material);
            dot.position.copy(geometry.vertices[i]);
            scene.add(dot);
        }

        for (let i = 0; i < 1; i++) {
            tunnels.push(new THREE.Mesh(geometry, material));
            tunnels[i].position.z = -600;
            tunnels[i].scale.copy(new THREE.Vector3(1.5,1.5,1));
            scene.add(tunnels[i]);
        }

    }

    function sceneTextures() {
        // pallete
        new THREE.TextureLoader().load('img/waves.png', function (texture) {
            //terrain.material.uniforms.palette.value = texture;
            //terrain.material.needsUpdate = true;
        });
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

    onDeviceMove = function(e) {
        e.preventDefault();

        let alpha = e.alpha;
        let gamma = e.gamma;
        let beta = e.beta;

        // Normalizing the alpha range from -90 to 90.
        if (alpha >= 0 && alpha <= 90) {
            alpha *= -1;
        } else if (alpha => 270 && alpha <= 360) {
            alpha = 360 - alpha;
        }

        // Avoiding jumps with axis changes
        if (beta > 90) alpha *= -1;

        // Limiting beta range
        if (beta > 135) beta = 135;
        if (beta < 0) beta = 0;

        input.a = alpha;
        input.g = gamma;
        input.b = beta;

    };


    function render() {

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

        if (isMobile()) {
            input.aPrev = lerp(input.aPrev, input.a, 0.1 * map(input.bPrev, 0, 90, 1, 0.5));
            input.bPrev = lerp(input.bPrev, input.b, 0.1);
            /*terrain.material.uniforms.distortCenter.value = map(input.aPrev, -90, 90, -0.02, 0.02);
            terrain.material.uniforms.waveHeight.value = map(input.bPrev, 0, 135, 0.01, 0.5);
            terrain.material.uniforms.waveSize.value = map(input.bPrev, 0, 135, 15.0, 20.0);*/

            camera.rotation.z = Math.sin(map(input.aPrev, -90, 90, 90 * Math.PI / 180, -90 * Math.PI / 180));


        } else {
            input.xDamped = lerp(input.xDamped, input.x, 0.1);
            input.yDamped = lerp(input.yDamped, input.y, 0.01);
            /*terrain.material.uniforms.distortCenter.value = map(input.xDamped, 0, width, -0.02, 0.02);
            terrain.material.uniforms.waveHeight.value = map(input.yDamped, 0, height, 0.01, 0.5);
            terrain.material.uniforms.waveSize.value = map(input.yDamped, 0, height, 15.0, 20.0);*/

            camera.rotation.z = 0.25 * Math.sin(map(input.xDamped, 0, width, 90 * Math.PI / 180, -90 * Math.PI / 180));

        }

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
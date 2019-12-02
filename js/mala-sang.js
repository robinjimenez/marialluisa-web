/*
    ---------------------
    MALA SANG - Main Module
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

        for (let i = 0; i < 1; i++) {
            tunnels.push(new THREE.Mesh(geometry, material));
            tunnels[i].position.z = -600;
            tunnels[i].scale.copy(new THREE.Vector3(1.5,1.5,1));
            scene.add(tunnels[i]);
        }

    }

    function sceneTextures() {
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

    function render() {

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

        if (isMobile()) {
            input.xDamped = lerp(input.xDamped, input.x, 0.1);
            input.yDamped = lerp(input.yDamped, input.y, 0.01);


        } else {
            input.xDamped = lerp(input.xDamped, input.x, 0.1);
            input.yDamped = lerp(input.yDamped, input.y, 0.01);

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
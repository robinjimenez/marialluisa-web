/*
    ---------------------
    NORD - Main Module
    ---------------------
 */

// Import dependencies
import * as THREE from '../lib/three/build/three.module.js';
import {EffectComposer} from '../lib/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../lib/three/examples/jsm/postprocessing/RenderPass.js';
import {FilmPass} from '../lib/three/examples/jsm/postprocessing/FilmPass.js';
import {SMAAPass} from '../lib/three/examples/jsm/postprocessing/SMAAPass.js';
import anime from '../lib/animejs/lib/anime.es.js';

var onDeviceMove;

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

function createScene() {

    document.querySelector('.overlay').setAttribute("class", "overlay hidden");

    var container = document.querySelector("#display");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var scene, bgColor, renderer, camera, composer, filmPass;
    var sky;
    var then = 0;

    var input = {x: 0, y: 0, z: 0, xDamped: 0, yDamped: 0, zDamped: 0};

    init();

    function init() {

        sceneSetup();
        sceneElements();
        sceneTextures();
        render();

        if (!isMobile()) {
            window.addEventListener("mousemove", onInputMove);
        }

        window.addEventListener("resize", resize);
        resize();

        playMusic();
    }

    function playMusic() {
        tl = anime.timeline({
            easing: 'easeInOutSine',
            duration: music.duration
        });

        /*tl.add({
            targets: sky.material,
            opacity: 1.0,
            duration: 500
        }, 13000);*/

        music.play();
    }

    function sceneSetup() {
        scene = new THREE.Scene();
        bgColor = new THREE.Color(0.5,0.5,0.5);
        scene.background = bgColor;

        createSky();

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

        // Film noise
        filmPass = new FilmPass(
            0.2,   // noise intensity
            0.025,  // scanline intensity
            648,    // scanline count
            false,  // grayscale
        );
        filmPass.renderToScreen = true;
        //composer.addPass(filmPass);

        // Further antialiasing
        var SMAApass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
        composer.addPass(SMAApass);

    }

    function sceneElements() {

    }

    function sceneTextures() {

    }

    function createSky() {

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

    onDeviceMove = function (e) {
        e.preventDefault();

        input.x = e.alpha;
        if (input.x > 180) input.x = 360 - input.x;
        input.y = e.beta;
        if (input.y < 0) input.y = -input.y;
        input.z = e.gamma;
        if (input.z < 0) input.z = -input.z;
    };

    function render() {

        if (isMobile()) {

            if (input.yDamped + 0.25 >= input.y && scene.background.r <= 0.95) {
                scene.background.r += 0.01;
                if (scene.background.b <= 0.56) scene.background.b += 0.01;
            } else if (input.yDamped - 0.25 <= input.y && scene.background.r >= 0.50) {
                scene.background.r -= 0.01;
                if (scene.background.b >= 0.16) scene.background.b -= 0.01;
            }

            if (input.zDamped + 0.25 >= input.z && scene.background.b <= 0.56) {
                scene.background.b += 0.02;
            } else if (input.zDamped - 0.25 <= input.z && scene.background.b >= 0.26){
                scene.background.b -= 0.02;
            }

            if (input.xDamped + 0.25 >= input.x && scene.background.g <= 0.1) {
                scene.background.g += 0.01;
            } else if (input.xDamped - 0.25 <= input.x && scene.background.g >= 0.05) {
                scene.background.g -= 0.01;
            }

            // damping mouse for smoother interaction
            input.xDamped = input.x;//lerp(input.xDamped, input.x, 0.05);
            input.yDamped = input.y;//lerp(input.yDamped, input.y, 0.05);
            input.zDamped = input.z;//lerp(input.zDamped, input.z, 0.05);

            output.innerHTML = Math.round(scene.background.r * 100 ) / 100  + "<br>";
            output.innerHTML += Math.round(scene.background.g * 100 ) / 100 + "<br>";
            output.innerHTML += Math.round(scene.background.b * 100 ) / 100  + "<br>";

        } else {
            // damping mouse for smoother interaction
            input.xDamped = lerp(input.xDamped, input.x, 0.1);
            input.yDamped = lerp(input.yDamped, input.y, 0.1);
            scene.background.r = map(input.xDamped, 0, width, 0.5, 0.7);
            scene.background.r += map(input.yDamped, 0, height, -0.2, 0.4);

            scene.background.b = map(input.yDamped, 0, height, 0.5, -0.2);
            scene.background.b += map(input.xDamped, 0, width, 0.45, 0.1);

            scene.background.g = map(input.xDamped, 0, width, 0.2, 0.06);
            scene.background.g += map(input.yDamped, 0, height, 0.15, -0.3);

        }

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

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
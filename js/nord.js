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

// Variables
var onDeviceMove;
var target = {lat: 0, long: 0, prevLat: 0, prevLong: 0};
var colorCoord = {x: 0, y: 0, prevX: 0, prevY: 0};


document.getElementById('start-button').onclick = requestPermissions;

// For devices that need permission requesting
function requestPermissions() {
    if (isMobile && typeof (DeviceMotionEvent) !== 'undefined' && typeof (DeviceMotionEvent.requestPermission) === 'function') {
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
    document.querySelector('.overlay').remove();

    var container = document.querySelector("#display");

    var width = window.innerWidth;
    var height = window.innerHeight;

    var scene, bgColor, renderer, camera, composer, filmPass;
    var then = 0;
    var updateTarget = false;

    var lSphere, rSphere, fSphere, baSphere, tSphere, boSphere;

    init();

    function init() {

        sceneSetup();
        sceneElements();
        render();

        if (!isMobile()) {
            window.addEventListener("mousedown", handleStart);
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleEnd);
        } else {
            target.prevLat = target.lat;
            target.prevLong = target.long;
        }

        window.addEventListener("resize", resize);
        resize();

        //playMusic();
    }

    function playMusic() {
        tl = anime.timeline({
            easing: 'easeInOutSine',
            duration: music.duration
        });

        music.play();
    }

    function sceneSetup() {

        scene = new THREE.Scene();
        bgColor = new THREE.Color(0.8, 0, 0.3);
        scene.background = bgColor;

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 1000);
        camera.position.set(0,0,0);
        camera.rotation.set(0,0,0);
        camera.target = new THREE.Vector3(0, 0, 200);

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
        composer.addPass(filmPass);

        // Further antialiasing
        var SMAApass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
        composer.addPass(SMAApass);

    }

    function sceneElements() {

        const geometry = new THREE.SphereGeometry(10, 32, 32);
        const material = new THREE.MeshBasicMaterial();
        lSphere = new THREE.Mesh(geometry, material);
        lSphere.position.set(-200,0,0);

        rSphere = new THREE.Mesh(geometry, material);
        rSphere.position.set(200,0,0);

        fSphere = new THREE.Mesh(geometry, material);
        fSphere.position.set(0,0,200);

        baSphere = new THREE.Mesh(geometry, material);
        baSphere.position.set(0,0,-200);

        tSphere = new THREE.Mesh(geometry, material);
        tSphere.position.set(0,200,0);

        boSphere = new THREE.Mesh(geometry, material);
        boSphere.position.set(0,-200,0);

        scene.add(lSphere);
        scene.add(rSphere);
        scene.add(fSphere);
        scene.add(baSphere);
        scene.add(tSphere);
        scene.add(boSphere);
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    function handleStart(e) {
        e.preventDefault();

        updateTarget = true;

        input.x = e.clientX;
        input.y = e.clientY;

        target.prevLat = target.lat;
        target.prevLong = target.long;

    }

    function handleMove(e) {
        if (updateTarget) {
            target.lat = (input.y - e.clientY) * 0.1 + target.prevLat;
            target.long = (e.clientX - input.x) * 0.1 + target.prevLong;
        }

        colorCoord.x  = e.clientX;
        colorCoord.y  = e.clientY;

    }

    function handleEnd(e) {
        updateTarget = false;
    }

    onDeviceMove = function (e) {
        e.preventDefault();

        // Input for color changes
        input.a = e.alpha;
        if (input.a > 180) input.a = 360 - input.a;
        input.b = e.beta;
        if (input.b < 0) input.b = -input.b;
        input.g = e.gamma;
        if (input.g < 0) input.g = -input.g;

        // Input for camera movement
        target.lat = (input.b - e.beta) * 0.1 + target.prevLat;
        target.long = (e.gamma - input.g) * 0.1 + target.prevLong;

    };

    function render() {

        target.lat = Math.max(-85, Math.min(85, target.lat));

        camera.target.x = 500 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.cos(THREE.Math.degToRad(target.long));
        camera.target.y = 500 * Math.cos(THREE.Math.degToRad(90 - target.lat));
        camera.target.z = 500 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.sin(THREE.Math.degToRad(target.long));
        camera.lookAt(camera.target);

        if (isMobile()) {

            if (input.bPrev + 0.25 >= input.b && scene.background.r <= 0.95) {
                scene.background.r += 0.01;
                if (scene.background.b <= 0.56) scene.background.b += 0.01;
            } else if (input.bPrev - 0.25 <= input.b && scene.background.r >= 0.50) {
                scene.background.r -= 0.01;
                if (scene.background.b >= 0.16) scene.background.b -= 0.01;
            }

            if (input.gPrev + 0.25 >= input.g && scene.background.b <= 0.56) {
                scene.background.b += 0.02;
            } else if (input.gPrev - 0.25 <= input.g && scene.background.b >= 0.26) {
                scene.background.b -= 0.02;
            }

            if (input.aPrev + 0.25 >= input.a && scene.background.g <= 0.1) {
                scene.background.g += 0.01;
            } else if (input.aPrev - 0.25 <= input.a && scene.background.g >= 0.05) {
                scene.background.g -= 0.01;
            }

            input.aPrev = input.a;
            input.bPrev = input.b;
            input.gPrev = input.g;

        } else {

            colorCoord.prevX = lerp(colorCoord.prevX, colorCoord.x, 0.1);
            colorCoord.prevY = lerp(colorCoord.prevY, colorCoord.y, 0.1);

            scene.background.r = map(colorCoord.prevX, 0, width, 0.4, 0.2);
            scene.background.r += map(colorCoord.prevY, 0, height, 0.2, 0.4);

            scene.background.b = map(colorCoord.prevY, 0, height, 0.4, 0.2);
            scene.background.b += map(colorCoord.prevX, 0, width, 0.3, 0.2);

            scene.background.g = map(colorCoord.prevX, 0, width, 0.1, 0.06);
            scene.background.g += map(colorCoord.prevY, 0, height, 0.15, -0.3);

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
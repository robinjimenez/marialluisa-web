/*
    ---------------------
    GIRASOL - Main Module
    ---------------------
 */

// Import dependencies
import * as THREE from '../lib/three/build/three.module.js';
import {EffectComposer} from '../lib/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../lib/three/examples/jsm/postprocessing/RenderPass.js';
import {FilmPass} from '../lib/three/examples/jsm/postprocessing/FilmPass.js';
import {SMAAPass} from '../lib/three/examples/jsm/postprocessing/SMAAPass.js';
import anime from '../lib/animejs/lib/anime.es.js';

var mode = "day";

document.getElementById('start-button').onclick = function () {

    // Request user location, if available set background
    // according to time of day at said position,
    // if not default to morning scene
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setBackground);
    } else {
        $('body').addClass('morning');
        createScene();
    }

}

// Obtain sun position at location, set body class and mode
function setBackground(position) {
    var now = new Date();

    var times = SunCalc.getTimes(new Date(), position.coords.latitude, position.coords.longitude);

    if (now < times.dawn || now > times.dusk) {
        $('body').addClass('night');
        mode = "night";
    } else if (now >= times.dawn && now < times.sunriseEnd) {
        $('body').addClass('sunrise');
        mode = "sunrise";
    } else if (now >= times.sunriseEnd && now < times.solarNoon) {
        $('body').addClass('morning');
    } else if (now >= times.solarNoon && now < times.sunsetStart) {
        $('body').addClass('afternoon');
    } else if (now >= times.sunsetStart && now < times.dusk) {
        $('body').addClass('sunset');
        mode = "sunset";
    }

    createScene();
}

/**
 * Creates, sets up and renders scene
 */
function createScene() {

    var container = document.querySelector("#display");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var scene, renderer, composer, filmPass;
    var camera;
    var terrain, sunMoon, pointLight;
    var spheres = [];
    var then = 0;

    init();

    /**
     * Set up scene, add event listeners and load assets.
     */
    function init() {

        sceneSetup();
        sceneElements();

        if (isMobile()) {
            window.addEventListener("touchmove", handleMove);
        } else {
            window.addEventListener("mousemove", handleMove);
        }

        resize();

        animationSetup();
        render();

        document.querySelector('#overlay').classList.toggle("hidden");

    }

    /**
     * Set up subtle organic sphere movement, play sound and
     * display end overlay
     */
    function animationSetup() {

        tl = anime.timeline({
            easing: 'easeInOutSine',
            begin: function () {
                sound.play();
                input.x = width/2;
                input.y = height/2;
                input.xDamped = width/2;
                input.yDamped = height/2;
                document.querySelectorAll('.experience-info').forEach(function (el) {
                    el.remove()
                });
                document.querySelector('.loading-message').remove();
                document.querySelector('#start-button').remove();
            }
        });

        spheres.forEach(function (el, i) {
            anime({
                targets: el.position,
                x: "+= 1",
                z: "-= 1",
                loop: true,
                duration: function () {
                    return Math.sin(i * 10) * Math.random() * 100 + 1000;
                },
                easing: 'easeInOutSine',
                direction: "alternate"
            });
        });

        // End overlay animation

        tl.add({
            target: document,
            easing: 'easeInOutSine',
            duration: 1000,
            begin: function () {
                if(isMobile()) document.querySelector('#orientation-info').remove();
                document.querySelector('.overlay-message').appendChild(document.querySelector("template").content);
                document.querySelector("#back-button").addEventListener('click', function () {
                    location.href = './?tema=nord';
                });
                document.querySelector('#overlay').classList.remove("hidden");
                document.querySelector('#overlay').classList.toggle("end");
            },
            complete: function () {
                container.remove();
            }
        }, sound.duration() * 1000);

    }

    /**
     * Create and set up scene, camera, lighting,
     * renderer and postprocessing effects
     */
    function sceneSetup() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 10000);
        camera.position.y = 50;
        camera.rotation.x = -Math.PI / 8;

        renderer = new THREE.WebGLRenderer({
            canvas: container,
            antialias: true,
            alpha: true
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


    /**
     * Create scene meshes, add textures and add to scene
     * according to daytime mode
     */
    function sceneElements() {
        let sunGeometry = new THREE.SphereGeometry(30, 32, 32);
        let sunMaterial;

        let ambientLight;

        switch (mode) {
            case "night":
                ambientLight = new THREE.AmbientLight(0x555555, 1);
                sunGeometry = new THREE.SphereGeometry(20, 32, 32);
                sunMaterial = new THREE.MeshBasicMaterial({color: 0xf4f4f4});
                sunMoon = new THREE.Mesh(sunGeometry, sunMaterial);
                sunMoon.position.set(0,100,-400);

                pointLight = new THREE.PointLight(0xE6D36E, 1, 300);
                break;
            case "sunset":
                ambientLight = new THREE.AmbientLight(0xed6b00, 1);
                sunMaterial = new THREE.MeshBasicMaterial({color: 0xed6b00});
                sunMoon = new THREE.Mesh(sunGeometry, sunMaterial);
                sunMoon.position.set(0,-50,-500);
                sunMoon.scale.set(4, 4, 4);

                pointLight = new THREE.PointLight(0xFFC412, 2, 300);
                break;
            case "sunrise":
                ambientLight = new THREE.AmbientLight(0xffe500, 1);
                sunMaterial = new THREE.MeshBasicMaterial({color: 0xffe500});
                sunMoon = new THREE.Mesh(sunGeometry, sunMaterial);
                sunMoon.position.set(0,-50,-500);
                sunMoon.scale.set(4, 4, 4);

                pointLight = new THREE.PointLight(0xFF9D35, 2, 300);
                break;
            default:
                ambientLight = new THREE.AmbientLight(0xffe500, 0.5);
                sunMaterial = new THREE.MeshBasicMaterial({color: 0xffe500});
                sunMoon = new THREE.Mesh(sunGeometry, sunMaterial);
                sunMoon.position.set(0,100,-300);
                sunMoon.position.y = 100;
                sunMoon.position.z = -300;

                pointLight = new THREE.PointLight(0xffe500, 2, 300);
                break;
        }

        scene.add(sunMoon);
        scene.add(ambientLight);
        pointLight.position.copy(sunMoon.position);
        scene.add(pointLight);

        // Main terrain mesh
        var geometry = new THREE.PlaneGeometry(width, 300, width/20, 20);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, -50, -200);

        var material = new THREE.MeshPhongMaterial({color: 0x0d3d1a, shininess: 0});

        terrain = new THREE.Mesh(geometry, material);
        terrain.position.y = -10;

        scene.add(terrain);

        terrain.geometry.vertices.forEach(function (vert, index) {
            let sGeometry = new THREE.SphereBufferGeometry(10, 32, 32);
            let sMaterial = new THREE.MeshToonMaterial({color: 0x555555, shininess: 0});

            spheres.push(new THREE.Mesh(sGeometry, sMaterial));
            scene.add(spheres[index]);
            let scale = Math.random() * (1.0 - 0.8) + 0.8;
            spheres[index].geometry.scale(scale, scale, scale);
            spheres[index].position.x = vert.x + Math.random() * 5;
            spheres[index].position.z = vert.z + Math.random() * 5;
            spheres[index].position.y = vert.y + Math.random();

        });


    }

    /**
     * Adapt scene to window size and resolution
     */
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    /**
     * Obtain coordinates from mouse or touch movement
     * @param e The event that triggers it
     */
    function handleMove(e) {
        e.preventDefault();

        if (e.type === "touchmove") {
            input.x = e.changedTouches[0].pageX;
            input.y = e.changedTouches[0].pageY;
        } else if (e.type === "mousemove") {
            input.x = e.clientX;
            input.y = e.clientY;
        }
    }

    /**
     * Update time, scene transformations,
     * interpret input and render
     */
    function render() {

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

        if (mode === "day") {
            input.xDamped = lerp(input.xDamped, input.x, 0.1);
            input.yDamped = lerp(input.yDamped, input.y, 0.1);

            if (isMobile()) {
                sunMoon.position.x = map(input.xDamped, 0, width, -width / 2, width / 2);
            } else {
                sunMoon.position.x = map(input.xDamped, 0, width, -500, 500);
            }
            sunMoon.position.z = map(input.yDamped, 0, height, -300, -50);
            sunMoon.position.y = map(input.yDamped, 0, height, 100, 80);

            pointLight.position.copy(sunMoon.position);
        }

        composer.render(deltaTime);
        requestAnimationFrame(render);
    }
}


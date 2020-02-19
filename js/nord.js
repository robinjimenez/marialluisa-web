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
var target = {lat: 0, long: 0, prevLat: 0, prevLong: 0};
var colourCoord = {x: 0, y: 0, prevX: 0, prevY: 0};

const colors = [
    new THREE.Color("rgb(255,255,255)"),
    new THREE.Color("rgb(244,184,250)"),
    new THREE.Color("rgb(164,150,220)"),
    new THREE.Color("rgb(220,133,166)")
];

document.getElementById('start-button').onclick = requestPermissions;

/**
 * Request access to motion sensors on mobile devices that
 * require it. Create scene whether it's accessible or not.
 */
function requestPermissions() {
    if (isMobile()) {
        if (typeof (DeviceMotionEvent) !== 'undefined' && typeof (DeviceMotionEvent.requestPermission) === 'function') {
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
    }

    createScene();

}

/**
 * Obtain mobile device orientation sensor
 * alpha, beta and gamma angles
 * @param e The event that triggers it
 */
function onDeviceMove(e) {
    e.preventDefault();

    // Input for color changes
    input.a = e.alpha;
    if (input.a > 180) input.a = 360 - input.a;
    input.b = e.beta;
    if (input.b < 0) input.b = -input.b;
    input.g = e.gamma;
    if (input.g < 0) input.g = -input.g;

}

/**
 * Creates, sets up and renders scene
 */
function createScene() {

    const container = document.querySelector("#display");

    var width = window.innerWidth;
    var height = window.innerHeight;

    var world, spring;
    const timeStep = 1/60;

    var scene, bgColor, renderer, camera, composer, filmPass;
    var then = 0;
    var triggers = {
        bgRotation: 0,
    };
    var updateTarget = false;
    let activeSpring = false;

    var mainSphere, mainSphereBody, innerSphere, outerSphere, backgroundSphere, targetBody;

    init();

    /**
     * Set up scene, add event listeners and load assets.
     */
    function init() {

        setupCannon();

        sceneSetup();
        sceneElements();

        if (!isMobile()) {
            window.addEventListener("mousedown", handleStart);
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleEnd);
        } else {
            window.addEventListener("touchstart", handleStart);
            window.addEventListener("touchmove", handleMove);
            window.addEventListener("touchend", handleEnd);

            target.prevLat = target.lat;
            target.prevLong = target.long;
        }

        resize();

        animationSetup();
        render();

        document.querySelector('#overlay').classList.toggle("hidden");
    }

    /**
     * Set up Cannon physics engine
     */
    function setupCannon() {
        world = new CANNON.World();
        world.gravity.set(0,0,0);
        world.broadphase = new CANNON.NaiveBroadphase();
    }

    /**
     * Set up keyframes for element addition,
     * transformation and removal
     */
    function animationSetup() {
        let colorIndex = 0;

        tl = anime.timeline({
            easing: 'easeInOutSine',
            begin: function (anim) {
                sound.play();
                anim.seek(sound.seek() * 1000);
                document.querySelectorAll('.experience-info').forEach(function (el) {
                    el.remove()
                });
                document.querySelector('.loading-message').remove();
                document.querySelector('#start-button').remove();
            }
        });

        const pulseLoop = anime({
            targets: [outerSphere.scale, innerSphere.scale, mainSphere.scale],
            delay: anime.stagger(980),
            autoplay: false,
            loop: true,
            direction: 'alternate',
            x: [
                {value: '*=1', easing: 'easeOutSine', duration: 100, endDelay: 880},
                {value: '*=2', easing: 'easeInOutQuad', duration: 100, endDelay: 880}
            ],
            y: [
                {value: '*=1', easing: 'easeOutSine', duration: 100, endDelay: 880},
                {value: '*=2', easing: 'easeInOutQuad', duration: 100, endDelay: 880}
            ],
            z: [
                {value: '*=1', easing: 'easeOutSine', duration: 100, endDelay: 880},
                {value: '*=2', easing: 'easeInOutQuad', duration: 100, endDelay: 880}
            ],
            loopComplete: function () {
                mainSphere.material.color.copy(colors[colorIndex]);
                innerSphere.material.color.copy(colors[colorIndex]);
                outerSphere.material.color.copy(colors[colorIndex]);
                colorIndex++;
                if (colorIndex >= colors.length) colorIndex = 0;
            }
        });

        tl.add({
            begin: function () {
                pulseLoop.play();
            }
        }, 3000);

        tl.add({
            targets: camera,
            fov: [
                {value: '170', easing: 'easeOutSine', duration: 950},
                {value: '90', easing: 'easeInOutQuad', duration: 50}
            ],
            update: function () {
                camera.updateProjectionMatrix();
            }
        }, 73500);

        tl.add({
            targets: triggers,
            bgRotation: 0.8,
            duration: 100000,
            begin: function () {
                pulseLoop.pause();
            }
        }, 90000);

        tl.add({
            begin: function() {
                activeSpring = true;
                pulseLoop.play();

                spring = new CANNON.Spring(mainSphereBody,targetBody,{
                    localAnchorA: new CANNON.Vec3(5,5,5),
                    localAnchorB: new CANNON.Vec3(10,10,10),
                    restLength : 0,
                    stiffness : 50,
                    damping : 4,
                });

                world.addEventListener("postStep",function(){
                    spring.applyForce();
                });
            }
        }, 140000);

        tl.add({
            target: document,
            easing: 'easeInOutSine',
            duration: 1000,
            begin: function () {
                if(isMobile()) document.querySelector('#orientation-info').remove();
                document.querySelector('.overlay-message').appendChild(document.querySelector("template").content);
                document.querySelector("#back-button").addEventListener('click', function () {
                    location.href = './';
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
        bgColor = new THREE.Color(0.8, 0, 0.3);
        scene.background = bgColor;

        createBackground();

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 1000);
        camera.position.set(0, 0, 0);
        camera.rotation.set(0, 0, 0);
        camera.target = new THREE.Vector3(0, 0, 500);

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

    /**
     * Create background geometry and add texture
     */
    function createBackground() {
        var sphere = new THREE.SphereGeometry(500, 50, 50);

        var loader = new THREE.TextureLoader();
        var texture = loader.load("media/img/nord/nord-gradient.png");

        var material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
        });

        backgroundSphere = new THREE.Mesh(sphere, material);
        backgroundSphere.material.side = THREE.BackSide;

        scene.add(backgroundSphere);
    }

    /**
     * Create scene meshes, add textures and add to scene
     */
    function sceneElements() {

        let geometry = new THREE.SphereGeometry(10, 32, 32);
        let material = new THREE.MeshBasicMaterial({
            needsUpdate: true,
            depthFunc: THREE.AlwaysDepth,
            transparent: true,
            opacity: 0.3,
        });
        outerSphere = new THREE.Mesh(geometry, material);
        outerSphere.position.set(100, 0, 0);
        outerSphere.scale.set(2, 2, 2);

        material = new THREE.MeshBasicMaterial({
            needsUpdate: true,
            depthFunc: THREE.AlwaysDepth,
            transparent: true,
            opacity: 0.7
        });
        innerSphere = new THREE.Mesh(geometry, material);
        innerSphere.position.set(100, 0, 0);
        innerSphere.scale.set(1.6, 1.6, 1.6);

        material = new THREE.MeshBasicMaterial({
            needsUpdate: true,
            depthFunc: THREE.AlwaysDepth
        });
        mainSphere = new THREE.Mesh(geometry, material);
        mainSphere.position.set(100, 0, 0);

        scene.add(mainSphere);
        scene.add(innerSphere);
        scene.add(outerSphere);

        mainSphereBody = new CANNON.Body({ mass: 1 });
        mainSphereBody.addShape( new CANNON.Sphere(10));
        mainSphereBody.position.set(0,0,100);
        mainSphereBody.velocity.set(0,0,0);
        mainSphereBody.angularVelocity.set(0,0,0);
        world.addBody(mainSphereBody);

        targetBody = new CANNON.Body({ mass: 1 });
        targetBody.addShape( new CANNON.Sphere(10));
        targetBody.position.set(0,0,100);
        targetBody.velocity.set(0,0,0);
        targetBody.angularVelocity.set(0,0,0);
        world.addBody(targetBody);

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
     * Obtain input when touch or mouse click starts
     * and update target accordingly
     * @param e The event that triggers it
     */
    function handleStart(e) {
        updateTarget = true;

        if (e.type === "touchstart") {
            input.x = e.changedTouches[0].pageX;
            input.y = e.changedTouches[0].pageY;
        } else {
            input.x = e.clientX;
            input.y = e.clientY;
        }

        target.prevLat = target.lat;
        target.prevLong = target.long;

    }


    /**
     * Obtain input when touch or clicked mouse changes
     * and update target and colour accordingly
     * @param e
     */
    function handleMove(e) {
        if (updateTarget) {
            if (e.type === "touchmove") {
                target.lat = target.prevLat - (input.y - e.changedTouches[0].pageY) * 0.1;
                target.long = target.prevLong - (e.changedTouches[0].pageX - input.x) * 0.1;
            } else {
                target.lat = target.prevLat - (input.y - e.clientY) * 0.1;
                target.long = target.prevLong - (e.clientX - input.x) * 0.1;
            }
        }

        colourCoord.x = e.clientX;
        colourCoord.y = e.clientY;

    }

    /**
     * End target update when touch finishes
     * or mouse press is released
     */
    function handleEnd() {
        updateTarget = false;
    }

    /**
     * Update Cannon.js world physics and pass
     * onto Three.js objects
     */
    function updatePhysics() {
        // Step the physics world
        world.step(timeStep);
        // Copy coordinates from Cannon.js to Three.js
        mainSphere.position.copy(mainSphereBody.position);
        mainSphere.quaternion.copy(mainSphereBody.quaternion);
        targetBody.position.set(camera.target.x,camera.target.y,camera.target.z);
    }

    /**
     * Update time, scene transformations, update physics,
     * interpret input and render
     */
    function render() {

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

        // Limiting lattitude values to avoid turning "upside down"
        target.lat = Math.max(-85, Math.min(85, target.lat));

        mainSphere.position.x = lerp(mainSphere.position.x, camera.target.x, 0.01);
        mainSphere.position.y = lerp(mainSphere.position.y, camera.target.y, 0.01);
        mainSphere.position.z = lerp(mainSphere.position.z, camera.target.z, 0.01);

        mainSphereBody.position.copy(mainSphere.position);
        innerSphere.position.copy(mainSphere.position);
        outerSphere.position.copy(mainSphere.position);

        if (isMobile()) {
            
            camera.target.x = 250 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.cos(THREE.Math.degToRad(target.long));
            camera.target.y = 250 * Math.cos(THREE.Math.degToRad(90 - target.lat));
            camera.target.z = 250 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.sin(THREE.Math.degToRad(target.long));

            camera.lookAt(camera.target);

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

            camera.target.x = 250 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.cos(THREE.Math.degToRad(target.long));
            camera.target.y = 250 * Math.cos(THREE.Math.degToRad(90 - target.lat));
            camera.target.z = 250 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.sin(THREE.Math.degToRad(target.long));
            camera.lookAt(camera.target);

            colourCoord.prevX = lerp(colourCoord.prevX, colourCoord.x, 0.1);
            colourCoord.prevY = lerp(colourCoord.prevY, colourCoord.y, 0.1);

            scene.background.r = map(colourCoord.prevX, 0, width, 0.4, 0.2);
            scene.background.r += map(colourCoord.prevY, 0, height, 0.2, 0.4);

            scene.background.b = map(colourCoord.prevY, 0, height, 0.4, 0.2);
            scene.background.b += map(colourCoord.prevX, 0, width, 0.3, 0.2);

            scene.background.g = map(colourCoord.prevX, 0, width, 0.1, 0.06);
            scene.background.g += map(colourCoord.prevY, 0, height, 0.15, -0.3);

        }


        backgroundSphere.rotation.x += deltaTime * triggers.bgRotation * Math.PI;
        backgroundSphere.rotation.z -= deltaTime * triggers.bgRotation * Math.PI;

        if (activeSpring) updatePhysics();
        composer.render(deltaTime);
        requestAnimationFrame(render);
    }
}
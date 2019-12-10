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
var colorCoord = {x: 0, y: 0, prevX: 0, prevY: 0};

var i = 0;
var colors = [
    new THREE.Color("rgb(242, 168, 247)"),
    new THREE.Color("rgb(196,205,255)"),
    new THREE.Color("rgb(247,158,184)"),
    new THREE.Color("rgb(162,225,250)"),
    new THREE.Color("rgb(224, 228, 255)")
];

var triggers = {
    bgRotation: 0
};

document.getElementById('start-button').onclick = requestPermissions;

// For devices that need permission requesting
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

function onDeviceMove(e) {
    e.preventDefault();

    // Input for camera movement
    /*target.lat = (input.b - e.beta) * 0.1 + target.prevLat;
    target.long = (e.gamma - input.g) * 0.1 + target.prevLong;
    target.lat = target.prevLat - (input.b - e.beta);
    target.long = target.prevLong - (e.gamma - input.g);*/

    // Input for color changes
    input.a = e.alpha;
    if (input.a > 180) input.a = 360 - input.a;
    input.b = e.beta;
    if (input.b < 0) input.b = -input.b;
    input.g = e.gamma;
    if (input.g < 0) input.g = -input.g;

}

function createScene() {

    var container = document.querySelector("#display");

    var width = window.innerWidth;
    var height = window.innerHeight;

    var world, timeStep=1/60, spring;

    var scene, bgColor, renderer, camera, composer, filmPass;
    var then = 0;
    var updateTarget = false;

    var mainSphere, mainSphereBody, innerSphere, outerSphere, backgroundSphere, targetBody;

    var pulseLoop;

    init();

    function init() {

        setupCannon();

        sceneSetup();
        sceneElements();
        render();

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
        sound.play();

        document.querySelector('.overlay').setAttribute("class", "overlay hidden");
        document.querySelector('.experience-info').remove();
        document.querySelector('.experience-info').remove();
        document.querySelector('#start-button').remove();
    }


    function setupCannon() {
        world = new CANNON.World();
        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;
        world.gravity.set(0,0,0);
        world.broadphase = new CANNON.NaiveBroadphase();
    }


    function animationSetup() {
        tl = anime.timeline({
            easing: 'easeInOutSine',
            autoplay: true,
            update: function () {
                //output.innerHTML = triggers.lerpValue;
            }
        });

        anime({
            targets: [outerSphere.scale, innerSphere.scale, mainSphere.scale],
            delay: anime.stagger(980),
            autoplay: true,
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
            loopComplete: function (anim) {
                mainSphere.material.color.copy(colors[i]);
                innerSphere.material.color.copy(colors[i]);
                outerSphere.material.color.copy(colors[i]);
                i++;
                if (i >= colors.length) i = 0;
            }
        });

        tl.add({
            targets: triggers,
            begin: function() {
                spring = new CANNON.Spring(mainSphereBody,targetBody,{
                    localAnchorA: new CANNON.Vec3(5,5,5),
                    localAnchorB: new CANNON.Vec3(10,10,10),
                    restLength : 0,
                    stiffness : 10,
                    damping : 4,
                });

                world.addEventListener("postStep",function(){
                    spring.applyForce();
                });
            },
            duration: 5000,
        }, 5000);

        tl.add({
            targets: camera.pov,
            value: 90,
            duration: 5000
        }, 5000);

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
        bgColor = new THREE.Color(0.8, 0, 0.3);
        scene.background = bgColor;

        createBackground();

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 1000);
        camera.position.set(0, 0, 0);
        camera.rotation.set(0, 0, 0);
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

    function createBackground() {
        var sphere = new THREE.SphereGeometry(500, 50, 50);

        var loader = new THREE.TextureLoader();
        var texture = loader.load("media/img/nord-gradient.png");

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

        material = new THREE.MeshBasicMaterial({needsUpdate: true, depthFunc: THREE.AlwaysDepth});
        mainSphere = new THREE.Mesh(geometry, material);
        mainSphere.position.set(100, 0, 0);

        scene.add(mainSphere);
        scene.add(innerSphere);
        scene.add(outerSphere);

        mainSphereBody = new CANNON.Body({ mass: 1 });
        mainSphereBody.addShape( new CANNON.Sphere(10));
        mainSphereBody.position.set(100,0,0);
        mainSphereBody.velocity.set(0,0,0);
        mainSphereBody.angularVelocity.set(0,0,0);
        world.addBody(mainSphereBody);

        targetBody = new CANNON.Body({ mass: 1 });
        targetBody.addShape( new CANNON.Sphere(10));
        targetBody.position.set(100,0,0);
        targetBody.velocity.set(0,0,0);
        targetBody.angularVelocity.set(0,0,0);
        world.addBody(targetBody);

    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

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

    function handleMove(e) {
        if (updateTarget) {
            if (e.type === "touchmove") {
                target.lat = -(input.y - e.changedTouches[0].pageY) * 0.1 + target.prevLat;
                target.long = -(e.changedTouches[0].pageX - input.x) * 0.1 + target.prevLong;
            } else {
                target.lat = -(input.y - e.clientY) * 0.1 + target.prevLat;
                target.long = -(e.clientX - input.x) * 0.1 + target.prevLong;
            }
        }

        colorCoord.x = e.clientX;
        colorCoord.y = e.clientY;

    }

    function handleEnd(e) {
        updateTarget = false;
    }

    function updatePhysics() {
        // Step the physics world
        world.step(timeStep);
        // Copy coordinates from Cannon.js to Three.js
        mainSphere.position.copy(mainSphereBody.position);
        mainSphere.quaternion.copy(mainSphereBody.quaternion);
        targetBody.position.set(camera.target.x/2,camera.target.y/2,camera.target.z/2);
    }

    function render() {

        target.lat = Math.max(-85, Math.min(85, target.lat));

        mainSphere.position.x = lerp(mainSphere.position.x, camera.target.x / 2, 0.01);
        mainSphere.position.y = lerp(mainSphere.position.y, camera.target.y / 2, 0.01);
        mainSphere.position.z = lerp(mainSphere.position.z, camera.target.z / 2, 0.01);

        mainSphereBody.position.copy(mainSphere.position);
        innerSphere.position.copy(mainSphere.position);
        outerSphere.position.copy(mainSphere.position);

        if (isMobile()) {


            camera.target.x = 500 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.cos(THREE.Math.degToRad(target.long));
            camera.target.y = 500 * Math.cos(THREE.Math.degToRad(90 - target.lat));
            camera.target.z = 500 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.sin(THREE.Math.degToRad(target.long));
            /*camera.rotation.x += target.lat * 0.05;
            camera.rotation.y += target.long * 0.05;
            target.prevLat = target.lat;
            target.prevLong = target.long;*/
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

            camera.target.x = 500 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.cos(THREE.Math.degToRad(target.long));
            camera.target.y = 500 * Math.cos(THREE.Math.degToRad(90 - target.lat));
            camera.target.z = 500 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.sin(THREE.Math.degToRad(target.long));
            camera.lookAt(camera.target);

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

        //backgroundSphere.rotation.x += Math.sin(time) * 0.5 * (1.5 - triggers.bgRotation);
        //backgroundSphere.rotation.y += Math.cos(time) * 0.5 * (1.5 - triggers.bgRotation);
        //backgroundSphere.rotation.z += Math.sin(time) * 0.5 * (1.5 - triggers.bgRotation);

        updatePhysics();
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
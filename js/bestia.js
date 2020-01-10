/*
    ---------------------
    BESTIA - Main Module
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
var target = { x: 0, y: 0 };

const colors = [
    "#63A7C4",
    "#9C88B6",
    "#D09BB6",
    "#DA9A68",
    "#E3C455",
    "#9BD7C0"
];

const video = document.getElementById('video');
var videoHeight, videoWidth;

document.getElementById('start-button').onclick = requestPermissions;

/**
 * Request access to frontal camera video stream.
 * If allowed, add to video DOM element.
 * Then create scene whether permission is granted or not.
 */
function requestPermissions() {
    var constraints;

    if (isMobile()) {
        constraints = {audio: false, video: {width: {ideal: 720}, height: {ideal: 1080}, facingMode: 'user'}};
    } else {
        constraints = {audio: false, video: {width: {ideal: 1080}, height: {ideal: 720}, facingMode: 'user'}};
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            videoHeight = stream.getVideoTracks()[0].getSettings().height;
            videoWidth = stream.getVideoTracks()[0].getSettings().width;

            // apply the stream to the video element used in the texture
            video.srcObject = stream;
            video.muted = true;
            video.play();
            createScene();
        }).catch(function (error) {
            output.innerHTML = 'Unable to access the camera/webcam.';
            createScene();
        });
    } else {
        console.error('MediaDevices interface not available.');
        createScene();
    }
}

/**
 * Creates, sets up and renders scene
 */
function createScene() {

    var container = document.querySelector("#display");

    var width = window.innerWidth;
    var height = window.innerHeight;

    var world, timeStep = 1 / 60, groundMaterial;

    var scene, renderer, camera, spotlight, composer, filmPass;
    var then = 0;

    var raycaster = new THREE.Raycaster();

    var mainSphere, childSphere, mainSphereBody, childSphereBody, background, backgroundBody;
    let numStrips;

    init();

    /**
     * Set up scene, physics, add event listeners and load assets
     */
    function init() {

        setupCannon();

        sceneSetup();
        sceneElements();

        if (!isMobile()) {
            window.addEventListener("mousemove", handleMove);
        } else {
            window.addEventListener("touchmove", handleMove);
        }

        resize();

        animationSetup();
        render();

        document.querySelector('#overlay').classList.toggle("hidden");
        document.querySelectorAll('.experience-info').forEach(function (el) {
            el.remove()
        });
        document.querySelector('.loading-message').remove();
        document.querySelector('#start-button').remove();
    }

    /**
     * Set up Cannon physics engine
     */
    function setupCannon() {
        world = new CANNON.World();
        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;
        world.gravity.set(0, -500, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
    }

    /**
     * Set up keyframes for element addition,
     * transformation and removal
     */
    function animationSetup() {

        tl = anime.timeline({
            easing: 'easeInOutSine',
            begin: function (anim) {
                sound.play();
                anim.seek(sound.seek() * 1000);
            },
            update: function (anim) {
                output.innerHTML = "animation time: " + anim.currentTime + "<br>";
                output.innerHTML += "sound time: " + sound.seek() * 1000;
                output.innerHTML += "<br>" + sound.duration() * 1000;
            }
        });

        // Recursive animation for bar spawning
        // If toggle is false, stop recursive loop
        function barSpawning(toggle) {
            anime({
                targets: '.strip',
                easing: 'easeInOutSine',
                duration: 100,
                opacity: function () {
                    if (anime.random(0,1) === 1) {
                        return anime.random(0, 1);
                    }
                    return 0;
                },
                backgroundColor: function () {
                    return colors[anime.random(0, colors.length - 1)]
                },
                delay: anime.stagger((1000 - then/100) / numStrips, {from: 'center'}),
                complete: function() {
                    if (toggle) barSpawning();
                }
            });
        }

        // Start spawning bars @ 1:55 min
        tl.add({
            begin: function () {
                barSpawning(true);
            },
        }, 115000); //100000

        // End overlay animation and spawning stop
        tl.add({
            easing: 'easeInOutSine',
            duration: 1000,
            begin: function () {
                barSpawning(false);
                document.querySelector('#orientation-info').remove();
                document.querySelector('.overlay-message').appendChild(document.querySelector("#back-button").content);
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

        var ambientLight = new THREE.AmbientLight(0xbbbbbb, 1);
        scene.add(ambientLight);

        camera = new THREE.PerspectiveCamera(30, width / height, .1, 1000);
        camera.position.set(0, 600, 0);
        camera.rotation.set(-Math.PI / 2, 0, 0);
        camera.lookAt = new THREE.Vector3(0, 0, 0);

        scene.add(camera);

        spotlight = new THREE.SpotLight("rgb(255,255,255)", 0.35, 1400);
        if (width < height) {
            spotlight.position.set(300, 400, -300);
        } else {
            spotlight.position.set(600, 400, -600);
        }
        spotlight.lookAt(new THREE.Vector3(0, 0, 0));

        spotlight.castShadow = true;
        spotlight.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 100, 10000));
        spotlight.shadow.bias = 0.0001;
        spotlight.shadow.mapSize.width = 512;
        spotlight.shadow.mapSize.height = 512;

        scene.add(spotlight);

        var directional = new THREE.DirectionalLight("rgb(200,200,200)", 0.1);
        directional.position.set(0, 500, 0);
        directional.lookAt(new THREE.Vector3(0, 0, 0));

        scene.add(directional);

        renderer = new THREE.WebGLRenderer({
            canvas: container,
            antialias: true
        });

        renderer.setPixelRatio = devicePixelRatio;
        renderer.setSize(width, height);

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        composer = new EffectComposer(renderer);
        composer.setSize(width, height);

        var renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // Film noise
        filmPass = new FilmPass(
            0.1,   // noise intensity
            0.005,  // scanline intensity
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
     * Create background geometry, add colour and friction to physics model
     */
    function createBackground() {
        var planeGeom = new THREE.PlaneGeometry(Math.max(1500, width), Math.max(1500, height), 100, 100);

        var material = new THREE.MeshPhongMaterial({color: 0xeeeeee, emissive: 0x111111});
        background = new THREE.Mesh(planeGeom, material);
        background.receiveShadow = true;
        background.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(background);

        groundMaterial = new CANNON.Material("groundMaterial");

        var groundContact = new CANNON.ContactMaterial(groundMaterial, groundMaterial, {
            friction: 0.3,
            restitution: 0.3,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 1,
            frictionEquationStiffness: 1e8,
            frictionEquationRegularizationTime: 1
        });

        // Add contact material to the world
        world.addContactMaterial(groundContact);

        var groundShape = new CANNON.Plane();
        backgroundBody = new CANNON.Body({mass: 0, material: groundMaterial});
        backgroundBody.addShape(groundShape);
        backgroundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        world.addBody(backgroundBody);

    }

    /**
     * Create scene meshes, add textures and add to scene
     */
    function sceneElements() {

        createBackground();

        var geometry = new THREE.SphereGeometry(10, 32, 32);
        var material = new THREE.MeshPhongMaterial({color: 0xeeeeee, shininess: 0.0});
        mainSphere = new THREE.Mesh(geometry, material);
        mainSphere.castShadow = true;
        mainSphere.receiveShadow = true;

        mainSphere.position.set(0, 20, 0);
        scene.add(mainSphere);

        mainSphereBody = new CANNON.Body({mass: 100, material: groundMaterial});
        mainSphereBody.addShape(new CANNON.Sphere(10));
        mainSphereBody.position.set(0, 20, 0);
        mainSphereBody.velocity.set(0, 0, 0);
        mainSphereBody.angularVelocity.set(0, 0, 0);
        world.addBody(mainSphereBody);

        childSphere = new THREE.Mesh(geometry, material);
        childSphere.castShadow = true;
        childSphere.receiveShadow = true;
        childSphere.scale.set(0.5, 0.5, 0.5);
        childSphere.position.set(-15, 5, 15);

        scene.add(childSphere);

        childSphereBody = new CANNON.Body({mass: 50, material: groundMaterial});
        childSphereBody.addShape(new CANNON.Sphere(5));
        childSphereBody.position.set(-15, 10, 15);
        childSphereBody.velocity.set(0, 0, 0);
        childSphereBody.angularVelocity.set(0, 0, 0);
        world.addBody(childSphereBody);

        var constraint = new CANNON.ConeTwistConstraint(mainSphereBody, childSphereBody, {
            pivotA: new CANNON.Vec3(-15, 0, 15),
            axisA: new CANNON.Vec3(0, 1, 0),
            angleA: 0,
            angleB: 0,
            twistAngle: 0
        });
        world.addConstraint(constraint);

        if (video.srcObject) {
            var texture = new THREE.VideoTexture(video);
            geometry = new THREE.PlaneBufferGeometry(videoWidth, videoHeight);
            material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.9
            });
            var videoMesh = new THREE.Mesh(geometry, material);
            videoMesh.position.set(0, 1, 0);
            videoMesh.scale.set(-0.5, 0.5, 0.5);
            videoMesh.lookAt(camera.position);
            scene.add(videoMesh);
        }

        createStrips();

    }

    /**
     * Create DOM elements for strips from screen
     * width and height, place and rotate at an angle
     */
    function createStrips() {
        let distance = Math.sqrt(width * width + height * height);
        numStrips = 20 + Math.floor(width / height) * 2;
        for (let i = 0; i < numStrips; i++) {
            let div = document.createElement('div');
            div.style.width = distance / numStrips + 'px';
            div.style.height = height + 'px';
            div.style.left = distance / numStrips * i + 'px';
            div.classList.add('strip');
            div.setAttribute('data-index', i);
            document.querySelector('.strips-container').appendChild(div);
        }
        let rotation = "rotate(-" + Math.atan2(height, width) * 180 / Math.PI + "deg)";
        document.querySelector('.strips-container').style.transform = rotation + "scale(1.5,2) translate(-25%)";
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
     * Obtain coordinates from mouse or touch movement,
     * transform into screen coordinates and find
     * intersection with plane object
     * @param e The event that triggers it
     */
    function handleMove(e) {

            if (e.type === "touchmove") {
                input.x = e.changedTouches[0].pageX;
                input.y = e.changedTouches[0].pageY;
            } else if (e.type === "mousemove") {
                input.x = e.clientX;
                input.y = e.clientY;
            }

            let screenCoord = {
                x: (input.x / width) * 2 - 1,
                y: -(input.y / height) * 2 + 1
            };

            raycaster.setFromCamera(screenCoord, camera);
            let intersected = raycaster.intersectObject(background);
            if (intersected.length) {
                target.x = intersected[0].point.x;
                target.y = intersected[0].point.z;
            }
    }

    /**
     * Update Cannon.js world physics and pass
     * onto Three.js objects
     */
    function updatePhysics() {
        // Step the physics world
        world.step(timeStep);
        // Copy coordinates from Cannon.js to Three.js and limit Angular
        mainSphere.position.copy(mainSphereBody.position);
        mainSphere.quaternion.copy(mainSphereBody.quaternion);
        mainSphereBody.angularVelocity.set(0, 0, 0);

        childSphere.position.copy(childSphereBody.position);
        childSphere.quaternion.copy(childSphereBody.quaternion);
        childSphereBody.angularVelocity.set(0, 0, 0);

        background.position.copy(backgroundBody.position);
        background.quaternion.copy(backgroundBody.quaternion);
    }

    /**
     *  Update time, scene transformations, update physics,
     *  interpret input and render
     */
    function render() {

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

        if (tl.currentTime !== sound.seek()) tl.seek(sound.seek()*1000);

        input.xDamped = lerp(input.xDamped, target.x, 0.08);
        input.yDamped = lerp(input.yDamped, target.y, 0.08);

        mainSphere.position.x = input.xDamped;
        mainSphere.position.z = input.yDamped;

        mainSphereBody.position.copy(mainSphere.position);

        updatePhysics(deltaTime);
        composer.render(deltaTime);
        requestAnimationFrame(render);
    }

}
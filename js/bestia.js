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
var target = {
    x: 0,
    y: 0
};

var colors = [
    0x63A7C4,
    0x9C88B6,
    0xD09BB6,
    0xDA9A68,
    0xE3C455,
    0x9BD7C0
];

var video = document.getElementById('video');
var videoHeight, videoWidth;
var triggers = {
    lerpValue: 0.005,
};

window.THREE = THREE; // for debugger

document.getElementById('start-button').onclick = requestPermissions;

// For devices that need permission requesting
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

function createScene() {

    var container = document.querySelector("#display");

    var width = window.innerWidth;
    var height = window.innerHeight;

    var world, timeStep = 1 / 60, groundMaterial;

    var scene, renderer, camera, spotlight, composer, filmPass;
    var then = 0;
    var updateTarget = false;

    var raycaster = new THREE.Raycaster();

    var mainSphere, childSphere, mainSphereBody, childSphereBody, background, backgroundBody;
    var strips = [];

    init();

    function init() {

        setupCannon();

        sceneSetup();
        sceneElements();
        render();

        if (!isMobile()) {
            updateTarget = true;
            window.addEventListener("mousemove", handleMove);
        } else {
            window.addEventListener("touchstart", handleStart);
            window.addEventListener("touchmove", handleMove);
            window.addEventListener("touchend", handleEnd);
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
        world.gravity.set(0, -500, 0);
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

        var barSpawning = anime({
            target: document,
            easing: 'easeInOutSine',
            duration: 5000,
            loop: true,
            autoplay: false,
            loopBegin: function () {
                console.log(this.duration);
                let geometry = new THREE.BoxBufferGeometry(1000, 10, 50);
                let material = new THREE.MeshPhongMaterial({color: colors[anime.random(0, colors.length-1)], shininess: 0.0, transparent: true});
                let mesh = new THREE.Mesh(geometry, material);
                strips.push(mesh);
                mesh.castShadow = false;
                mesh.position.set(400,100 + Math.random() * 100,-400);
                mesh.rotation.set(0,-Math.PI/4,0);
                scene.add(mesh);
                if (this.duration > 1000)this.duration -= 200;
            }
        });

        tl.add({
            target: barSpawning,
            duration: 5000,
            begin: function () {
               barSpawning.play();
            },
        }, 100000); //100000

        tl.add({
            target: document,
            easing: 'easeInOutSine',
            duration: 1000,
            begin: function () {
                barSpawning.stop();
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

    function createBackground() {
        var planeGeom = new THREE.PlaneGeometry(Math.max(1500, width), Math.max(1500, height), 100, 100);

        var material = new THREE.MeshPhongMaterial({color: 0xeeeeee, emissive: 0x111111});
        background = new THREE.Mesh(planeGeom, material);
        background.receiveShadow = true;
        background.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(background);

        groundMaterial = new CANNON.Material("groundMaterial");

        // Adjust constraint equation parameters for ground/ground contact
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
                opacity: 0.07
            });
            var videoMesh = new THREE.Mesh(geometry, material);
            videoMesh.position.set(0, 1, 0);
            videoMesh.scale.set(-0.5, 0.5, 0.5);
            videoMesh.lookAt(camera.position);
            scene.add(videoMesh);
        }

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
        }
    }

    function handleMove(e) {

        if (updateTarget) {
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
    }

    function handleEnd() {
        updateTarget = false;
    }

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

    function render() {

        input.xDamped = lerp(input.xDamped, target.x, 0.08);
        input.yDamped = lerp(input.yDamped, target.y, 0.08);

        mainSphere.position.x = input.xDamped;
        mainSphere.position.z = input.yDamped;

        mainSphereBody.position.copy(mainSphere.position);

        /*childSphere.position.x = lerp(childSphere.position.x, mainSphere.position.x - 20, 0.05);
        childSphere.position.z = lerp(childSphere.position.z, mainSphere.position.z + 20, 0.05);
        childSphereBody.position.x = lerp(childSphereBody.position.x, mainSphereBody.position.x - 20, 0.05);
        childSphereBody.position.z = lerp(childSphereBody.position.z, mainSphereBody.position.z + 20, 0.05);*/

        //output.innerHTML = target.x + "<br>" + target.y + "<br>" + input.xDamped + "<br>" + input.yDamped;

        if (isMobile()) {

            /*camera.target.x = 500 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.cos(THREE.Math.degToRad(target.long));
            camera.target.y = 500 * Math.cos(THREE.Math.degToRad(90 - target.lat));
            camera.target.z = 500 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.sin(THREE.Math.degToRad(target.long));
            camera.rotation.x += target.lat * 0.05;
            camera.rotation.y += target.long * 0.05;
            target.prevLat = target.lat;
            target.prevLong = target.long;
            camera.lookAt(camera.target);*/

        } else {

            /*camera.target.x = 500 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.cos(THREE.Math.degToRad(target.long));
            camera.target.y = 500 * Math.cos(THREE.Math.degToRad(90 - target.lat));
            camera.target.z = 500 * Math.sin(THREE.Math.degToRad(90 - target.lat)) * Math.sin(THREE.Math.degToRad(target.long));
            camera.lookAt(camera.target);*/

        }

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

        strips.forEach(function (el,i) {
            el.position.x -= deltaTime * 50;
            el.position.z += deltaTime * 50;

            if (el.position.x < -500 || el.position.z > 300 ) {
                scene.remove(el);
                strips.splice(i,1);
                console.log("removed");
            }
        });

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
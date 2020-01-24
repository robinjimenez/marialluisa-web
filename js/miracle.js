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

// Interaction triggers
// Either boolean or influence percentage
var triggers = {
    rotateSea: 0,
    cameraLift: 0
};

document.getElementById('start-button').onclick = requestPermissions;

/**
 * Request access to motion sensors on mobile devices that
 * require it. Create scene whether it's accessible or not.
 */
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


/**
 * Obtain mobile device orientation sensor
 * alpha and beta angles and normalise them
 * to avoid sudden jumps
 * @param e The event that triggers it
 */
function onDeviceMove(e) {
    e.preventDefault();

    let alpha = e.alpha;
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
    input.b = beta;

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
    var terrain, sky, blackSky, largeSphere, mediumSphere, smallSphere;
    var wavesTextureEnd, skyTextureEnd;
    var bubbles = [];
    var then = 0;

    init();

    /**
     * Set up scene, add event listeners and load assets.
     */
    function init() {

        sceneSetup();
        sceneElements();
        sceneTextures();

        if (!isMobile()) {
            window.addEventListener("mousemove", onInputMove);
        }

        resize();

        animationSetup();
        render();

        document.querySelector('#overlay').classList.toggle("hidden");


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
                document.querySelectorAll('.experience-info').forEach(function (el) {
                    el.remove()
                });
                document.querySelector('.loading-message').remove();
                document.querySelector('#start-button').remove();
            }
        });

        // Gray transition @ 13s

        tl.add({
            targets: terrain.material.uniforms.greyness,
            value: 0.0,
            duration: 500
        }, 13000);

        tl.add({
            targets: blackSky.material,
            opacity: 0.0,
            duration: 500,
            complete: function () {
                scene.remove(blackSky);
            }
        }, 13000);

        // Spheres appear @ 10s - 14s

        tl.add({
            targets: largeSphere.position,
            y: 4,
            duration: 4500
        }, 10000);

        tl.add({
            targets: mediumSphere.position,
            y: 3,
            duration: 4500
        }, 10100);

        tl.add({
            targets: smallSphere.position,
            y: 1,
            duration: 4500
        }, 10200);

        // Camera rotation enabling @ 13s

        tl.add({
            targets: triggers,
            duration: 2000,
            rotateSea: 1
        }, 13000);

        // Spheres go down @ 55s

        tl.add({
            targets: largeSphere.position,
            //easing: 'easeInQuad',
            y: "-= 200",
            duration: 5000
        }, 55000);

        tl.add({
            targets: mediumSphere.position,
            //easing: 'easeInQuad',
            y: "-= 200",
            duration: 5000
        }, 56000);

        tl.add({
            targets: smallSphere.position,
            //easing: 'easeInQuad',
            y: "-= 200",
            duration: 5000
        }, 57000);

        // Particles float in @ 55s

        for (let i = 0; i < bubbles.length; i++) {
            tl.add({
                targets: bubbles[i].position,
                easing: 'easeOutSine',
                y: "-= 300",
                delay: i * 100,
                duration: 8000
            }, 55000);
        }

        // Spheres reappear @ 68s

        tl.add({
            targets: largeSphere.position,
            y: "+=200",
            duration: 4500
        }, 68000);

        tl.add({
            targets: mediumSphere.position,
            y: "+=200",
            duration: 4500
        }, 68100);

        tl.add({
            targets: smallSphere.position,
            y: "+=200",
            duration: 4500
        }, 68200);

        // Camera and particles up and gray transition @ 125s

        tl.add({
            targets: triggers ,
            cameraLift: 500,
            duration: 6000,
            easing: 'cubicBezier(.26,-0.21,0,1)',
            update: function () {
                sky.position.y = triggers.cameraLift * 0.7;
            },
            complete: function () {
                terrain.material.uniforms.speed.value = 2;
                terrain.material.uniforms.palette.value = wavesTextureEnd;
                terrain.material.needsUpdate = true;

                largeSphere.material.color.set(0xffffff);
                largeSphere.material.needsUpdate = true;

                mediumSphere.material.color.set(0xffffff);
                mediumSphere.material.needsUpdate = true;

                smallSphere.material.color.set(0xffffff);
                smallSphere.material.needsUpdate = true;
            }
        }, 125000);

        tl.add({
            targets: camera.rotation,
            x: 0,
            duration: 6000,
            easing: 'cubicBezier(.43,-0.35,.68,1.41)'
        }, 125000);

        tl.add({
            targets: terrain.material.uniforms.greyness,
            value: 1.0,
            duration: 5000,
            easing: 'easeInOutSine'
        }, 130000);

        tl.add({
            targets: sky.material,
            opacity: [1.0, 0.0],
            duration: 5000,
            easing: 'easeInOutSine',
            complete: function () {
                sky.material.map = skyTextureEnd;
                sky.material.map.needsUpdate = true;
                sky.material.needsUpdated = true;
            }
        }, 130000);

        for (let i = 0; i < bubbles.length; i++) {
            tl.add({
                targets: bubbles[i].position,
                easing: 'easeOutSine',
                y: "+= 400",
                delay: i * 100,
                duration: 5000
            }, 125000);
            tl.add({
                targets: bubbles[i].material,
                easing: 'easeOutSine',
                color: {
                    r: 1,
                    g: 1,
                    b: 1
                },
                opacity: 1,
                delay: i * 100,
                duration: 5000,
                update: function () {
                    bubbles[i].material.needsUpdate = true;
                }
            }, 125000);
        }

        // Camera and particles down and gray transition @ 165s

        tl.add({
            targets: triggers,
            cameraLift: 50,
            duration: 3000,
            easing: 'easeInOutSine',
        }, 168000);

        tl.add({
            targets: camera.rotation,
            x: -Math.PI / 8,
            duration: 3000,
            easing: 'cubicBezier(.43,-0.35,.68,1.41)'
        }, 168000);

        tl.add({
            targets: terrain.material.uniforms.greyness,
            value: 0.0,
            duration: 3000,
            easing: 'easeInOutSine'
        }, 168000);

        tl.add({
            targets: sky.material,
            opacity: 1.0,
            duration: 3000,
            easing: 'easeInOutSine'
        }, 168000);

        for (let i = 0; i < bubbles.length; i++) {
            tl.add({
                targets: bubbles[i].position,
                easing: 'easeOutSine',
                y: "-= 400",
                delay: i * 100,
                duration: 3000
            }, 168000);
        }

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

        createSky();

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 10000);
        camera.name = "camera";
        triggers.cameraLift = 50;
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

    /**
     * Create scene meshes, add textures and add to scene
     */
    function sceneElements() {

        // Main sea mesh
        var geometry = new THREE.PlaneBufferGeometry(800, 600, 400, 400);

        var uniforms = {
            time: {type: "f", value: 0.0},
            palette: {type: "t", value: null},
            speed: {type: "f", value: 1},
            maxHeight: {type: "f", value: 50},
            waveHeight: {type: "f", value: 0.5},
            waveSize: {type: "f", value: 20.0},
            greyness: {type: "f", value: 1.0}
        };

        var material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([THREE.ShaderLib.basic.uniforms, uniforms]),
            vertexShader: document.getElementById('custom-vertex').textContent,
            fragmentShader: document.getElementById('custom-fragment').textContent
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

        // Sky particles
        for (let i = 0; i <= 30; i++) {
            geometry = new THREE.SphereGeometry(Math.random() * 5, 32, 32);
            material = new THREE.MeshBasicMaterial({
                color: 0x69B3CB,
                transparent: true,
                opacity: Math.random() + 0.5,
                depthFunc: THREE.AlwaysDepth
            });

            bubbles.push(new THREE.Mesh(geometry,material));
            scene.add(bubbles[i]);
            bubbles[i].position.x = Math.floor(Math.random() * 201) - 100;
            bubbles[i].position.y = Math.floor(Math.random() * 201) + 300;
            bubbles[i].position.z = -Math.floor(Math.random() * 401) + 100;
        }

    }

    /**
     * Load textures for use on meshes
     */
    function sceneTextures() {
        let texLoader = new THREE.TextureLoader();
        texLoader.load('media/img/miracle/waves.png', function (texture) {
            terrain.material.uniforms.palette.value = texture;
            terrain.material.needsUpdate = true;
        });
        wavesTextureEnd = texLoader.load('media/img/miracle/waves-end.png');
    }

    /**
     * Create sphere for sky, add texture and add to screen
     */
    function createSky() {
        let skyGeo = new THREE.SphereGeometry(500, 25, 25);

        let loader = new THREE.TextureLoader();
        let texture = loader.load("media/img/miracle/sky.png");

        let material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            side: THREE.BackSide
        });

        sky = new THREE.Mesh(skyGeo, material);

        skyTextureEnd = loader.load("media/img/miracle/end-sky.png");
        scene.add(sky);

        material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 1,
            side: THREE.BackSide
        });
        blackSky = new THREE.Mesh(skyGeo, material);
        blackSky.scale.set(0.9,0.9,0.9);
        scene.add(blackSky);

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
     * Obtain coordinates from mouse movement
     * @param e The event that triggers it
     */
    function onInputMove(e) {
        e.preventDefault();

        let x, y;
        x = e.clientX;
        y = e.clientY;

        input.x = x;
        input.y = y;

    }

    /**
     * Update time, scene transformations,
     * interpret input and render
     */
    function render() {

        let time = performance.now() * 0.001;
        let deltaTime = time - then;
        then = time;


        if (isMobile()) {

            let softener = Math.max(map(input.b, 0, 90, 0.1, 0.01),0.01);
            input.aPrev = lerp(input.aPrev, input.a, softener);
            input.bPrev = lerp(input.bPrev, input.b, 0.1);
            terrain.material.uniforms.waveHeight.value = map(input.bPrev, 0, 135, 0.01, 0.5);
            terrain.material.uniforms.waveSize.value = map(input.bPrev, 0, 135, 15.0, 20.0);

            camera.rotation.z = Math.sin(map(input.aPrev, -90, 90, 90 * Math.PI / 180, -90 * Math.PI / 180)) * triggers.rotateSea;

            largeSphere.position.y += Math.cos(time * 1.35 + 100) * 0.1;
            mediumSphere.position.y += Math.cos(time * 1.35 + 50) * 0.05;
            smallSphere.position.y += Math.cos(time * 1.35) * 0.03;

            camera.position.y = triggers.cameraLift + Math.sin(time * 1.05) * 10 + map(input.bPrev, 35, 135, 0, 50);

        } else {

            input.xDamped = lerp(input.xDamped, input.x, 0.1);
            input.yDamped = lerp(input.yDamped, input.y, 0.01);
            terrain.material.uniforms.waveHeight.value = map(input.yDamped, 0, height, 0.01, 0.5);
            terrain.material.uniforms.waveSize.value = map(input.yDamped, 0, height, 15.0, 20.0);

            camera.rotation.z = 0.25 * Math.sin(map(input.xDamped, 0, width, 90 * Math.PI / 180, -90 * Math.PI / 180)) * triggers.rotateSea;

            largeSphere.position.y += Math.cos(time * 1.35 + 100) * 0.1;
            mediumSphere.position.y += Math.cos(time * 1.35 + 50) * 0.05;
            smallSphere.position.y += Math.cos(time * 1.35) * 0.02;

            camera.position.y = triggers.cameraLift + Math.sin(time * 1.05) * 10 + map(input.yDamped, 0, height, 50, 0);

        }

        terrain.material.uniforms.time.value = time;

        composer.render(deltaTime);
        requestAnimationFrame(render);
    }
}
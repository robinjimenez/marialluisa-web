/*
    ---------------------
    NICA - Main Module
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


/**
 * Creates, sets up and renders scene
 */
function createScene() {

    var container = document.querySelector("#display");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var raycaster = new THREE.Raycaster();

    var scene, renderer, camera, composer, filmPass;
    var terrain = [];
    var sky, sun;
    var then = 0;

    init();

    /**
     * Set up scene, add event listeners and load assets.
     */
    function init() {

        sceneSetup();
        sceneElements();
        createSky();
        render();

        if (!isMobile()) {
            window.addEventListener("mousemove", onInputMove);
            window.addEventListener("click", handleClick);
        } else {
            window.addEventListener("touchstart", handleClick);
        }

        resize();

        animationSetup();

        document.querySelector('.overlay').setAttribute("class", "overlay hidden");
        document.querySelectorAll('.experience-info').forEach(function (el) {
            el.remove()
        });

    }

    /**
     * Set up animation for end overlay and play music
     */
    function animationSetup() {
        sound.play();

        anime({
            easing: 'easeInOutSine',
            duration: 1000,
            delay: sound.duration() * 1000,
            begin: function () {
                document.querySelector('.overlay').cloneNode('template');
                document.querySelector('.overlay').classList.add("end");
            },
            complete: function () {
                container.remove();
            }
        });

    }

    /**
     * Create and set up scene, camera, lighting,
     * renderer and postprocessing effects
     */
    function sceneSetup() {
        scene = new THREE.Scene();

        camera = new THREE.OrthographicCamera(-width / 4, width / 4, height / 4, -height / 4, 0.1, 1000);
        camera.position.set(0, 0, 0);

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
        var geometry = new THREE.CubeGeometry(width, 400, 2, width / 4, 50, 2);
        var uniforms = {
            u_time: {type: 'f', value: 0.0},
            u_resolution: new THREE.Uniform(new THREE.Vector2(width / 100, height / 100)),
            u_color: new THREE.Uniform(new THREE.Vector3(0.9, 0.9, 0.9)),
            u_opacity: {type: 'f', value: 1.0},
            u_amp: {type: 'f', value: 50.0},
            u_disp: {type: 'f', value: 10.0},
            u_height: {type: 'f', value: 0.005},
            u_squareness: {type: 'f', value: 0.0},
            u_seed: {type: 'f', value: 0.0}
        };

        for (let i = 0; i < 4; i++) {
            let material = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.merge([THREE.ShaderLib.basic.uniforms, uniforms]),
                vertexShader: document.getElementById('custom-vertex').textContent,
                fragmentShader: document.getElementById('custom-fragment').textContent,
                side: THREE.DoubleSide,
            });

            terrain.push(new THREE.Mesh(geometry, material));
            if (i === 0) {
                terrain[i].material.uniforms.u_seed.value = 0.98;
                terrain[i].material.uniforms.u_squareness.value = 1.0;
                terrain[i].position.set(0, -200, -5.0);
            } else {
                terrain[i].material.uniforms.u_seed.value = Math.random() * 0.2 + i * 0.3;
                terrain[i].material.uniforms.u_height.value = 0.0001 + 0.005 * i;
                terrain[i].material.uniforms.u_amp.value = 50.0 + 10.0 * i;

                terrain[i].position.set(0, -220 - 30 * i, -5.0 + i);
            }
            console.log(terrain[i].material.uniforms.u_seed.value);
            terrain[i].material.uniforms.u_color = new THREE.Uniform(new THREE.Vector3(i * 0.2, (i * 0.6) * 0.2, (i * 0.01) * 0.2));
            terrain[i].material.needsUpdate = true;
            scene.add(terrain[i]);
        }


    }

    /**
     * Create spheres for sky background and sun
     */
    function createSky() {
        let skyGeo = new THREE.SphereGeometry(1000, 25, 25);

        let material = new THREE.MeshBasicMaterial({
            color: 0xfca103,
        });

        sky = new THREE.Mesh(skyGeo, material);
        sky.material.side = THREE.BackSide;

        let sunGeo = new THREE.SphereGeometry(100, 25, 25);
        if (isMobile()) sunGeo.scale(0.7, 0.7, 0.7);
        material = new THREE.MeshBasicMaterial({
            color: 0xdb6612,
            side: THREE.DoubleSide
        });
        sun = new THREE.Mesh(sunGeo, material);
        sun.position.set(0, 0, -200);

        scene.add(sky);
        scene.add(sun);

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
     * Obtain coordinates from mouse click or tap,
     * transform into screen coordinates and find
     * intersection with scene objects. Change random
     * seed of intersected mesh.
     * @param e The event that triggers it
     */
    function handleClick(e) {
        e.preventDefault();

        if (e.type === "click") {
            input.x = e.clientX;
            input.y = e.clientY;
        } else {
            input.x = e.changedTouches[0].pageX;
            input.y = e.changedTouches[0].pageY;
        }

        let screenCoord = {
            x: (input.x / width) * 2 - 1,
            y: -(input.y / height) * 2 + 1
        };

        raycaster.setFromCamera(screenCoord, camera);
        let intersected = raycaster.intersectObjects(scene.children);
        if (intersected.length) {
            let target = intersected[0].object;

            target.material.uniforms.u_seed.value = Math.random();
            //target.material.uniforms.u_disp.value = 50.0;
            //target.material.uniforms.u_color = new THREE.Uniform(new THREE.Vector3(0.9, 0.9, 0.9));

            target.material.needsUpdate = true;

        }

    }

    /**
     * Obtain coordinates from mouse movement
     * @param e The event that triggers it
     */
    function onInputMove(e) {
        e.preventDefault();

        var x, y;
        x = e.clientX;
        y = e.clientY;

        input.x = x;
        input.y = y;

    }

    /**
     * Obtain mobile device orientation sensor
     * alpha and beta angles and normalise them
     * to avoid sudden jumps
     * @param e The event that triggers it
     */
    onDeviceMove = function (e) {
        e.preventDefault();

        let alpha = e.alpha;
        let beta = e.beta;

        // Normalizing the alpha range from -180 to 180.
        if (alpha >= 0 && alpha <= 180) {
            alpha *= -1;
        } else if (alpha => 180 && alpha <= 360) {
            alpha = 360 - alpha;
        }

        // Avoiding jumps with axis changes
        if (beta > 90) alpha *= -1;

        // Limiting beta range
        //if (beta > 135) beta = 135;
        //if (beta < 0) beta = 0;

        input.a = alpha;
        input.b = beta;

    };

    /**
     * Update time, scene transformations,
     * interpret input and render
     */
    function render() {

        var time = performance.now() / 1000;
        const deltaTime = time - then;
        then = time;

        if (isMobile()) {

            // Fixes discontinuity at -180/180
            if (Math.abs(input.a - input.aPrev) > 270) {
                input.aPrev = 2 * input.a + input.aPrev;
            } else {
                input.aPrev = lerp(input.aPrev, input.a, 0.1);
            }

            input.bPrev = lerp(input.bPrev, input.b, 0.1);

            camera.rotation.z = map(input.aPrev, -180, 180, Math.PI, -Math.PI);


        } else {
            input.xDamped = lerp(input.xDamped, input.x, 0.1);
            input.yDamped = lerp(input.yDamped, input.y, 0.01);

            camera.rotation.z = 0.25 * Math.sin(map(input.xDamped, 0, width, 90 * Math.PI / 180, -90 * Math.PI / 180));

        }

        terrain.forEach(function (el, i) {
            el.material.uniforms.u_time.value = time * (i * 2.0 + 1.0) * 0.2;
        });

        composer.render(deltaTime);
        requestAnimationFrame(render);
    }
}
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

// SCENE CREATION

function createScene() {

    var container = document.querySelector(".landscape");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var scene, renderer, camera, composer, filmPass;
    var terrain, sky, largeSphere, mediumSphere, smallSphere;
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

        window.addEventListener("resize", resize);
        resize();

        document.querySelector('.overlay').setAttribute("class", "overlay hidden");

        timelineSetup();
        music.play();
    }

    function timelineSetup() {
        tl = anime.timeline({
            easing: 'easeInOutSine',
            duration: music.duration
        });

        tl.add({
            targets: terrain.material.uniforms.greyness,
            value: 0.0,
            duration: 500
        }, 13000);

        tl.add({
            targets: sky.material,
            opacity: 1.0,
            duration: 500
        }, 13000);

        tl.add({
            targets: largeSphere.position,
            y: 0,
            duration: 4500
        }, 9000);

        tl.add({
            targets: mediumSphere.position,
            y: 2.5,
            duration: 4500
        }, 9100);

        tl.add({
            targets: smallSphere.position,
            y: 5,
            duration: 4500
        }, 9200);
    }

    function sceneSetup() {
        scene = new THREE.Scene();
        var fogColor = new THREE.Color(0x000000);
        //scene.background = fogColor;
        scene.fog = new THREE.Fog(fogColor, 10, 4000);

        createSky();

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 10000);
        camera.position.y = 50;
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

    function sceneElements() {

        var geometry = new THREE.PlaneBufferGeometry(800, 600, 400, 400);

        var uniforms = {
            time: {type: "f", value: 0.0},
            distortCenter: {type: "f", value: 0.1},
            roadWidth: {type: "f", value: 0},
            palette: {type: "t", value: null},
            speed: {type: "f", value: 0.5},
            maxHeight: {type: "f", value: 50},
            waveHeight: {type: "f", value: 0.5},
            waveSize: {type: "f", value: 20.0},
            greyness: {type: "f", value: 1.0},
            color: new THREE.Color(1, 1, 1)
        }

        var material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([THREE.ShaderLib.basic.uniforms, uniforms]),
            vertexShader: document.getElementById('custom-vertex').textContent,
            fragmentShader: document.getElementById('custom-fragment').textContent,
            wireframe: false,
            blendingMode: THREE.AdditiveBlending,
            transparent: true
        });

        terrain = new THREE.Mesh(geometry, material);
        terrain.position.z = -200;
        terrain.rotation.x = -Math.PI / 2;
        scene.add(terrain);

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

    }

    function sceneTextures() {
        // pallete
        new THREE.TextureLoader().load('img/waves_edges.png', function (texture) {
            terrain.material.uniforms.palette.value = texture;
            terrain.material.needsUpdate = true;
        });
    }

    function createSky() {
        var skyGeo = new THREE.SphereGeometry(500, 25, 25);

        var loader = new THREE.TextureLoader();
        var texture = loader.load("img/sky.png");

        var material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0
        });

        sky = new THREE.Mesh(skyGeo, material);
        sky.material.side = THREE.BackSide;

        scene.add(sky);
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

    onDeviceMove = function(e) {
        e.preventDefault();

        var x, y;
        x = e.gamma;
        y = e.beta;

        if (x > 45) x = 45;

        if (x < -45) x = -45;

        if (y > 135) y = 135;

        if (y < 0) y = 0;

        input.x = x;
        input.y = y;

    };


    function render() {

        if (isMobile()) {
            // damping mouse for smoother interaction
            input.xDamped = lerp(input.xDamped, input.x, 0.05);
            input.yDamped = lerp(input.yDamped, input.y, 0.1);
            terrain.material.uniforms.distortCenter.value = map(input.xDamped, -45, 45, -0.15, 0.15);
            //terrain.material.uniforms.roadWidth.value = map(input.yDamped, 45, 135, -0.5, 1);
            terrain.material.uniforms.waveHeight.value = map(input.yDamped, 0, 135, 0.01, 0.8);
            terrain.material.uniforms.waveSize.value = map(input.yDamped, 0, 135, 15.0, 20.0);

            largeSphere.position.x = (Math.sin(map(input.xDamped, -45, 45, -6.29, 6.29)) + Math.sin(map(input.xDamped, -45, 45, -6.29, 6.29)*0.5)) * -10.0;
            mediumSphere.position.x = (Math.sin(map(input.xDamped, -45, 45, -6.29, 6.29)) + Math.sin(map(input.xDamped, -45, 45, -6.29, 6.29)*0.5)) * -10.0;
            smallSphere.position.x = (Math.sin(map(input.xDamped, -45, 45, -6.29, 6.29)) + Math.sin(map(input.xDamped, -45, 45, -6.29, 6.29)*0.5)) * -10.0;

        } else {
            // damping mouse for smoother interaction
            input.xDamped = lerp(input.xDamped, input.x, 0.1);
            input.yDamped = lerp(input.yDamped, input.y, 0.01);
            terrain.material.uniforms.distortCenter.value = map(input.xDamped, 0, width, -0.25, 0.25);
            //terrain.material.uniforms.roadWidth.value = map(input.yDamped, 0, height, -0.5, 1);
            terrain.material.uniforms.waveHeight.value = map(input.yDamped, 0, height, 0.01, 0.8);
            terrain.material.uniforms.waveSize.value = map(input.yDamped, 0, height, 15.0, 20.0);
        }

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

        terrain.material.uniforms.time.value = time;
        largeSphere.position.y += Math.sin(time * 1.35) * 0.1;
        mediumSphere.position.y += Math.sin(time * 1.35 + 0.5) * 0.07;
        smallSphere.position.y += Math.sin(time * 1.35 + 1) * 0.05;

        camera.position.y += Math.sin(time * 1.05) * 0.25;

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
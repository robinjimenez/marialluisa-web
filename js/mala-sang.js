/*
    ---------------------
    MALA SANG - Main Module
    ---------------------
 */

// Import dependencies
import * as THREE from '../lib/three/build/three.module.js';
import {EffectComposer} from '../lib/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../lib/three/examples/jsm/postprocessing/RenderPass.js';
import {FilmPass} from '../lib/three/examples/jsm/postprocessing/FilmPass.js';
import {SMAAPass} from '../lib/three/examples/jsm/postprocessing/SMAAPass.js';
import anime from '../lib/animejs/lib/anime.es.js';

document.getElementById('start-button').onclick = createScene;

/**
 * Creates, sets up and renders scene
 */
function createScene() {

    var container = document.querySelector("#display");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var raycaster = new THREE.Raycaster();

    var world, timeStep = 1 / 60;
    var removalYCoord = -100;

    var scene, renderer, camera, composer, filmPass;
    var wall, drops = [];
    var then = 0;

    init();

    /**
     * Set up scene, add event listeners and load assets.
     */
    function init() {
        setupCannon();

        sceneSetup();
        sceneElements();

        if (!isMobile()) {
            window.addEventListener("click", handleClick);
        } else {
            window.addEventListener("touchstart", handleClick);
        }

        resize();

        animationSetup();
        render();

        document.querySelector('.overlay').setAttribute("class", "overlay hidden");
        document.querySelectorAll('.experience-info').forEach(function (el) {
            el.remove()
        });

    }

    /**
     * Set up CANNON physics engine
     */
    function setupCannon() {
        world = new CANNON.World();
        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;
        world.gravity.set(0, -10, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
    }

    /**
     * Set up sphere spawning and end overlay animation
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

        anime({
            loop: true,
            duration: 2000,
            loopBegin: function () {
                for (let i = 0; i <= Math.floor(Math.random() * 5); i++) {
                    createBall(Math.random() * 400 - 200, 100 + Math.random() * 50 , 1, new CANNON.Vec3(0,0,0));
                }
            }
        });

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

    /**
     * Create and set up scene, camera, lighting,
     * renderer and postprocessing effects
     */
    function sceneSetup() {
        scene = new THREE.Scene();
        window.scene = scene; // for debugger

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 10000);
        camera.position.set(0,0,100);

        var ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

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
     * Create a sphere and add mesh to Three.js and its
     * corresponding rigid body in Cannon.js physics world
     * @param x The initial position in the x axis
     * @param y The initial position in the y axis
     * @param scale The sphere's scale
     * @param linearVel The initial linear velocity of the sphere
     */
    function createBall(x,y,scale,linearVel) {
        var geometry = new THREE.SphereGeometry(10, 32, 32);
        var material = new THREE.MeshPhongMaterial({color: 0xaa00000, shininess: 0.0});
        let sphere = new THREE.Mesh(geometry, material);

        sphere.position.set(x, y, -20);
        sphere.scale.set(scale, scale, scale);

        scene.add(sphere);

        let body = new CANNON.Body({mass: scale});
        body.addShape(new CANNON.Sphere(scale));
        body.position.set(x, y, -20);
        body.velocity.set(linearVel.x,linearVel.y,linearVel.z);
        world.addBody(body);

        var drop = {mesh: sphere, body: body};
        drops.push(drop);
    }

    /**
     * Remove sphere from Three.js scene and Cannon.js physics world
     * @param mesh The mesh object to remove
     */
    function removeBall(mesh) {
        scene.remove(mesh);
        let index = drops.findIndex(el => el.mesh === mesh);
        world.remove(drops[index].body);
        drops.splice(index,1);
    }

    /**
     * Create scene meshes, add textures and add to scene
     */
    function sceneElements() {
        // Main terrain mesh
        var geometry = new THREE.PlaneGeometry(500, 300, 20, 20);
        geometry.translate(0, 0, -50);

        var material = new THREE.MeshBasicMaterial({color: 0xf4f4f4});

        wall = new THREE.Mesh(geometry, material);
        scene.add(wall);

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
     * intersection with scene objects.
     * If it intersects with a sphere, create two smaller new ones
     * and inherit its linear velocity
     * @param e The event that triggers it
     */
    function handleClick(e) {
        e.preventDefault();

        var screenPos = new THREE.Vector2();
        if (e.type === "click") {
            screenPos.x = (e.clientX / width) * 2 - 1;
            screenPos.y = -(e.clientY / height) * 2 + 1;
        } else {
            screenPos.x = (e.changedTouches[0].pageX / width) * 2 - 1;
            screenPos.y = -(e.changedTouches[0].pageY / height) * 2 + 1;
        }

        raycaster.setFromCamera(screenPos, camera);
        let intersectedObjects = raycaster.intersectObjects(scene.children);
        if (intersectedObjects.length) {
            // pick the first object. It's the closest one
            let hitObject = intersectedObjects[0].object;

            if (hitObject.geometry.type === 'SphereGeometry') {
                let linearVel = drops.find(el => el.mesh === hitObject).body.velocity;
                let scale = hitObject.scale.x * Math.random() * 0.5 + 0.2;
                createBall(intersectedObjects[0].point.x - hitObject.scale.x, intersectedObjects[0].point.y, scale, new CANNON.Vec3(linearVel.x-5,linearVel.y + Math.random()*4 - 2,0));
                createBall(intersectedObjects[0].point.x + hitObject.scale.x, intersectedObjects[0].point.y, hitObject.scale.x - scale, new CANNON.Vec3(linearVel.x+5,linearVel.y + Math.random()*4 - 2,0));

                removeBall(hitObject);
            }
        }

    }

    /**
     * Update Cannon.js world physics and pass
     * onto Three.js objects
     */
    function updatePhysics() {

        // Step the physics world
        world.step(timeStep);
        // Copy coordinates from Cannon.js to Three.js
        drops.forEach(function (el) {
            el.mesh.position.copy(el.body.position);
            el.mesh.quaternion.copy(el.body.quaternion);

            if (el.mesh.position.y < removalYCoord) {
                removeBall(el.mesh);
            }
        });
    }

    /**
     * Update time, update physics and render
     */
    function render() {

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

        if (tl.currentTime !== sound.seek()) tl.seek(sound.seek()*1000);

        updatePhysics();
        composer.render(deltaTime);
        requestAnimationFrame(render);
    }
}
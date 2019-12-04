/*
    ---------------------
    ESTRES - Main Module
    ---------------------
 */

// Import dependencies
import * as THREE from '../lib/three/build/three.module.js';
import {EffectComposer} from '../lib/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../lib/three/examples/jsm/postprocessing/RenderPass.js';
import {FilmPass} from '../lib/three/examples/jsm/postprocessing/FilmPass.js';
import {SMAAPass} from '../lib/three/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from '../lib/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import anime from '../lib/animejs/lib/anime.es.js';

// Variables
var onDeviceMove;
window.THREE = THREE; // for debugger

// Interaction triggers
// Either boolean or influence percentage
var triggers;

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


// SCENE CREATION

function createScene() {

    var container = document.querySelector("#display");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var raycaster = new THREE.Raycaster();

    var physicsWorld;
    var rigidBodies = [], tmpTrans;
    var scene, renderer, camera, composer, filmPass, generatorPlane, glowingOrb;
    var tunnels = [];
    var then = 0;

    Ammo().then(init);

    function init() {
        tmpTrans = new Ammo.btTransform();

        setupPhysicsWorld();

        sceneSetup();
        sceneElements();
        sceneTextures();
        render();

        if (!isMobile()) {
            window.addEventListener("mousemove", onInputMove);
            window.addEventListener("click", handleClick);
        } else {
            window.addEventListener("touchstart", handleClick);
        }

        resize();

        animationSetup();
        sound.play();

        document.querySelector('.overlay').setAttribute("class", "overlay hidden");
        document.querySelector('.experience-info').remove();
        document.querySelector('.experience-info').remove();
        document.querySelector('#start-button').remove();

    }

    // PHYSICS SETUP

    function setupPhysicsWorld() {

        let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
            dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
            overlappingPairCache = new Ammo.btDbvtBroadphase(),
            solver = new Ammo.btSequentialImpulseConstraintSolver();

        physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        physicsWorld.setGravity(new Ammo.btVector3(0, 0, -10));

    }

    function createBall(x, y, z, scale, color) {

        let pos = {x: x, y: y, z: z};
        let radius = Math.floor(Math.random() * scale) + 1;
        let quat = {x: 0, y: 0, z: 0, w: 1};
        let mass = Math.random() * radius * 100;

        //threeJS Section
        let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, radius * 8, radius * 8), new THREE.MeshPhongMaterial({color: color}));

        ball.position.set(pos.x, pos.y, pos.z);

        ball.castShadow = true;
        ball.receiveShadow = true;

        scene.add(ball);

        //Ammojs Section
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        let colShape = new Ammo.btSphereShape(radius);
        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);

        physicsWorld.addRigidBody(body);

        ball.userData.physicsBody = body;
        ball.userData.turbulence = Math.random();

        rigidBodies.push(ball);
    }


    function updatePhysics(deltaTime) {

        // Step world
        physicsWorld.stepSimulation(deltaTime, 10);

        // Update rigid bodies
        for (let i = 0; i < rigidBodies.length; i++) {
            let objThree = rigidBodies[i];
            let objAmmo = objThree.userData.physicsBody;
            let ms = objAmmo.getMotionState();
            if (ms) {


                ms.getWorldTransform(tmpTrans);
                let p = tmpTrans.getOrigin();
                let q = tmpTrans.getRotation();

                let turbulenceX = Math.sin(performance.now() * 0.005 * objThree.userData.turbulence);
                let turbulenceY = Math.cos(performance.now() * 0.005 * objThree.userData.turbulence);

                objThree.position.set(p.x() + turbulenceX, p.y() + turbulenceY, p.z());
                objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

                if (objThree.position.z < -500) {
                    physicsWorld.removeCollisionObject(objAmmo);
                    scene.remove(objThree);
                    rigidBodies.splice(i,1);
                }

            }
        }

    }

    function animationSetup() {
        let start;

        anime({
            loop: true,
            duration: 5000,
            loopBegin: function () {
                for (let i = 0; i <= Math.floor(Math.random() * 3); i++) {
                    createBall(Math.floor(Math.random()*21) - 10,Math.floor(Math.random()*21) - 10, 20 + Math.random()*50, 0.5, 0xf4f4f4);
                }
            }
        });

        tl = anime.timeline({
            easing: 'easeInOutSine',
            begin: function (anim) {
                start = new Date().getTime();
            },
            update: function (anim) {
                //output.innerHTML = new Date().getTime() - start;
            }
        });

        tl.add({
            targets: tunnels[0].material.uniforms.u_opacity,
            value: 1.0,
            easing: 'easeInOutSine',
            duration: 2000
        }, 29000);

        tl.add({
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
        window.scene = scene; // for debugger

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 10000);

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
        //composer.addPass(filmPass);

        var bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        composer.addPass( bloomPass );

        var SMAApass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
        composer.addPass(SMAApass);

    }

    function sceneElements() {
        var geometry = new THREE.PlaneBufferGeometry(100, 100, 100, 100);
        var material = new THREE.MeshBasicMaterial({visible: false});
        generatorPlane = new THREE.Mesh(geometry, material);
        generatorPlane.position.z = -20;
        scene.add(generatorPlane);

        geometry = new THREE.CylinderGeometry(200, 50, 1000, 32, 32, true);
        geometry.rotateX(Math.PI / 2);

        // Glowing sphere

        var sphereGeom = new THREE.SphereBufferGeometry(100, 32, 32);
        material = new THREE.MeshBasicMaterial({color: 0xf4f4f4});
        glowingOrb = new THREE.Mesh(sphereGeom,material);
        scene.add(glowingOrb);
        glowingOrb.position.z = -1400;

        /*material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.BackSide
        });

        var sphere = new THREE.SphereBufferGeometry(1, 8, 8);

        for (let i = 0; i < geometry.vertices.length; i++) {
            let dot = new THREE.Mesh(sphere, material);
            dot.position.copy(geometry.vertices[i]);
            scene.add(dot);
        }*/

        //geometry = new THREE.PlaneBufferGeometry(width*2.5, height*2.5);

        var uniforms = {
            u_time: { type: 'f', value: 0.0 },
            u_resolution: new THREE.Uniform(new THREE.Vector2(400,400)),
            u_colorA: new THREE.Uniform(new THREE.Vector3(0.207,0.432,0.840)),
            u_colorB: new THREE.Uniform(new THREE.Vector3(0.120,0.337,0.416)),
            u_colorC: new THREE.Uniform(new THREE.Vector3(0.711,0.226,0.635)),
            u_colorD: new THREE.Uniform(new THREE.Vector3(0.715,0.375,0.700)),
            u_opacity: { type: 'f', value: 0.0 },
        };

        material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([THREE.ShaderLib.basic.uniforms, uniforms]),
            vertexShader: document.getElementById('custom-vertex').textContent,
            fragmentShader: document.getElementById('custom-fragment').textContent,
            side: THREE.BackSide,
            transparent: true
        });

        for (let i = 0; i < 1; i++) {

            tunnels.push(new THREE.Mesh(geometry, material));
            tunnels[i].position.z = -600;
            tunnels[i].rotation.z = Math.PI/4;
            tunnels[i].scale.copy(new THREE.Vector3(1.5, 1.5, 1));
            scene.add(tunnels[i]);
        }

        /*background = new THREE.Mesh(geometry, material);
        background.position.z = -1500;
        scene.add(background);*/
    }

    function sceneTextures() {
        // pallete
        /*new THREE.TextureLoader().load('img/waves.png', function (texture) {
            //terrain.material.uniforms.palette.value = texture;
            //terrain.material.needsUpdate = true;
        });*/
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    }

    function handleClick(e) {
        e.preventDefault();

        var screenPos = new THREE.Vector2();
        if (e.type === "click") {
            screenPos.x = ( e.clientX / width ) * 2 - 1;
            screenPos.y = - ( e.clientY / height ) * 2 + 1;
        } else {
            screenPos.x = (e.changedTouches[0].pageX / width ) * 2 - 1;
            screenPos.y = - (e.changedTouches[0].pageY  / height ) * 2 + 1;
        }

        raycaster.setFromCamera( screenPos, camera );
        let intersection = raycaster.intersectObject( generatorPlane )[0];

        createBall(intersection.point.x, intersection.point.y, - 20, 1, 0x000000);

    }

    function onInputMove(e) {
        e.preventDefault();

        var x, y;
        x = e.clientX;
        y = e.clientY;

        input.x = x;
        input.y = y;

    }

    onDeviceMove = function (e) {
        e.preventDefault();

        let alpha = e.alpha;
        //let gamma = e.gamma;
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
        //input.g = gamma;
        input.b = beta;

    };


    function render() {

        var time = performance.now() / 1000;
        const deltaTime = time - then;
        then = time;

        if (isMobile()) {

            // Fixes discontinuity at -180/180
            if (Math.abs(input.a - input.aPrev) > 270) {
                input.aPrev = 2*input.a + input.aPrev;
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

        updatePhysics(deltaTime);

        tunnels[0].material.uniforms.u_time.value = time * 0.04;
        tunnels[0].material.needsUpdate = true;

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
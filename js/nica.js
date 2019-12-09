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

    //var physicsWorld;
    //var rigidBodies = [], tmpTrans;
    var scene, renderer, camera, composer, filmPass, generatorPlane;
    var terrain = [];
    var sky, sun;
    var then = 0;

    //Ammo().then(init);
    init();

    function init() {
        //tmpTrans = new Ammo.btTransform();

        //setupPhysicsWorld();

        sceneSetup();
        sceneElements();
        createSky();
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

        document.querySelector('.overlay').setAttribute("class", "overlay hidden");
        document.querySelectorAll('.experience-info').forEach(function (el) {
            el.remove()
        });

    }

    // PHYSICS SETUP

    /*unction setupPhysicsWorld() {

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

                if (objThree.position.z < removalZCoord) {
                    physicsWorld.removeCollisionObject(objAmmo);
                    scene.remove(objThree);
                    rigidBodies.splice(i, 1);
                }

            }
        }

    }*/

    function animationSetup() {
        let start;

        tl = anime.timeline({
            easing: 'easeInOutSine',
            autoplay: true,
            begin: function (anim) {
                //start = new Date().getTime();
                sound.play();
            },
            update: function (anim) {
                /*let time = new Date().getTime() - start;
                output.innerHTML = time + "<br>";
                output.innerHTML += performance.now() + "<br>";
                output.innerHTML += performance.now() - time;*/
            }
        });

        tl.add({
            easing: 'easeInOutSine',
            duration: 1000,
            begin: function () {
                document.querySelector('.overlay').cloneNode('template');
                document.querySelector('.overlay').classList.add("end");
            },
            complete: function () {
                container.remove();
            }
        }, sound.duration() * 1000);

    }

    function sceneSetup() {
        scene = new THREE.Scene();
        window.scene = scene; // for debugger

        camera = new THREE.OrthographicCamera(-width/4, width/4, height/4, -height/4,0.1, 1000);
        camera.position.set(0,0,0);

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
        var geometry = new THREE.CubeGeometry(width, 400, 2, width/4, 50, 2);
        var uniforms = {
            u_time: {type: 'f', value: 0.0},
            u_resolution: new THREE.Uniform(new THREE.Vector2(width/100, height/100)),
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
                terrain[i].position.set(0,-200, -5.0);
            } else {
                terrain[i].material.uniforms.u_seed.value = Math.random() * 0.2 + i * 0.3;
                terrain[i].material.uniforms.u_height.value = 0.0001 + 0.005 * i;
                terrain[i].material.uniforms.u_amp.value = 50.0 + 10.0 * i;

                terrain[i].position.set(0,-220-30*i, -5.0+i);
            }
            console.log(terrain[i].material.uniforms.u_seed.value);
            terrain[i].material.uniforms.u_color = new THREE.Uniform(new THREE.Vector3(i*0.2, (i * 0.6)*0.2, (i*0.01)*0.2));
            terrain[i].material.needsUpdate = true;
            scene.add(terrain[i]);
        }



    }

    function createSky() {
        var skyGeo = new THREE.SphereGeometry(1000, 25, 25);

        var loader = new THREE.TextureLoader();
        //var texture = loader.load("media/img/sky.png");

        var material = new THREE.MeshBasicMaterial({
            color: 0xfca103,
            //map: texture
        });

        sky = new THREE.Mesh(skyGeo, material);
        sky.material.side = THREE.BackSide;

        var sunGeo = new THREE.SphereGeometry(100, 25, 25);
        if (isMobile()) sunGeo.scale(0.7,0.7,0.7);
        material = new THREE.MeshBasicMaterial({
            color: 0xdb6612,
            side: THREE.DoubleSide
        });
        sun = new THREE.Mesh(sunGeo, material);
        sun.position.set(0,0,-200);

        scene.add(sky);
        scene.add(sun);

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

        if (e.type === "click") {
            input.x = e.clientX;
            input.y = e.clientY;
        } else {
            input.x = e.changedTouches[0].pageX;
            input.y = e.changedTouches[0].pageY;
        }

        raycaster.setFromCamera({x: input.x, y: input.y}, camera);
        let intersected = raycaster.intersectObjects(scene.children);
        if (intersected.length) {
            let target = intersected[0].object;

            target.material.uniforms.u_disp.value = 1.0;
            target.material.needsUpdate = 1.0;

            console.log(target);

        }

        //createBall(intersection.point.x, intersection.point.y, -20, 1, 0x000000);

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

        terrain.forEach(function (el,i) {
            el.material.uniforms.u_time.value = time * (i * 2.0 + 1.0) * 0.2;
        });


        //updatePhysics(deltaTime);
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
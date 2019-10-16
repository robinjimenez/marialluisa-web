import * as THREE from './three/build/three.module.js';
import {EffectComposer} from './three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './three/examples/jsm/postprocessing/RenderPass.js';
import {FilmPass} from './three/examples/jsm/postprocessing/FilmPass.js';
import {SMAAPass} from './three/examples/jsm/postprocessing/SMAAPass.js';
import anime from './animejs/lib/anime.es.js';

var output = document.querySelector('.output');
var music = document.querySelector('audio');

var tl;

createLandscape({
    paletteImage: 'img/waves_dark.png'
});

function createLandscape(params) {

    var container = document.querySelector(".landscape");
    var width = window.innerWidth;
    var height = window.innerHeight;

    var scene, renderer, camera, composer, filmPass;
    var terrain, sky, sphere;
    var then = 0;

    var input = {x: 0, y: 0, xDamped: 0, yDamped: 0};

    var isMobile = function () {
        var check = false;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    };

    init();

    function init() {

        sceneSetup();
        sceneElements();
        sceneTextures();
        render();

        if (isMobile()) {
            window.addEventListener("deviceorientation", onDeviceMove, {passive: false});
        } else {
            window.addEventListener("mousemove", onInputMove);
        }

        window.addEventListener("resize", resize);
        resize();

        playMusic();
    }

    function playMusic() {
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
            targets: sphere.position,
            y: 10,
            duration: 4500
        }, 9000);

        music.play();
    }

    function sceneSetup() {
        scene = new THREE.Scene();
        var fogColor = new THREE.Color(0x000000);
        //scene.background = fogColor;
        scene.fog = new THREE.Fog(fogColor, 10, 4000);

        createSky();

        camera = new THREE.PerspectiveCamera(70, width / height, .1, 10000);
        camera.position.y = 8;
        camera.position.z = 0;

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
        terrain.rotation.x = -Math.PI / 4;
        scene.add(terrain);

        geometry = new THREE.SphereGeometry(10, 32, 32);
        material = new THREE.MeshBasicMaterial({color: 0xb2b2b2});
        sphere = new THREE.Mesh(geometry, material);

        scene.add(sphere);

        sphere.position.x = 0;
        sphere.position.y = -500;
        sphere.position.z = -200;

    }

    function sceneTextures() {
        // pallete
        new THREE.TextureLoader().load(params.paletteImage, function (texture) {
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

    function onDeviceMove(e) {
        e.preventDefault();

        var x, y;
        x = e.gamma; // de 45 a -45
        y = e.beta; // de 0 a 135

        if (x > 45) {
            x = 45
        }
        if (x < -45) {
            x = -45
        }

        if (y > 135) {
            y = 135
        }
        if (y < 0) {
            y = 0
        }
        input.x = x;
        input.y = y;

    }

    function render() {

        if (isMobile()) {
            // damping mouse for smoother interaction
            input.xDamped = lerp(input.xDamped, input.x, 0.05);
            input.yDamped = lerp(input.yDamped, input.y, 0.1);
            terrain.material.uniforms.distortCenter.value = map(input.xDamped, -45, 45, -0.25, 0.25);
            //terrain.material.uniforms.roadWidth.value = map(input.yDamped, 45, 135, -0.5, 1);
            terrain.material.uniforms.waveHeight.value = map(input.yDamped, 0, 135, 0.01, 0.8);
            terrain.material.uniforms.waveSize.value = map(input.yDamped, 0, 135, 15.0, 20.0);
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
        sphere.position.y += Math.sin(time * 1.35) * 0.1;
        camera.position.y += Math.sin(time * 1.05) * 0.5;


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
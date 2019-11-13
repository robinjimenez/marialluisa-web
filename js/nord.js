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
var onDeviceMove;
var points = [];

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

function createScene() {

    document.querySelector('.overlay').setAttribute("class", "overlay hidden");
    document.querySelector('.overlay').remove();

    var container = document.querySelector("#display");
    var draw_canvas = document.querySelector("#draw");
    var draw_ctx = draw_canvas.getContext('2d');
    var tmp_canvas = document.querySelector("#current_draw");
    var tmp_ctx = tmp_canvas.getContext('2d');

    var fader = anime({
        targets: '#draw',
        autoplay: false,
        loop: false,
        opacity: 0,
        delay: 1000,
        easing: 'easeInSine',
        duration: 2000,
        complete: function(anim) {
            if (anim.direction === "normal") {
                console.log("clear");
                draw_ctx.clearRect(0, 0, draw_canvas.width, draw_canvas.height);
            }
        },
        update: function (anim) {
            console.log(anim.progress);
        }
    });

    var width = window.innerWidth;
    var height = window.innerHeight;

    tmp_canvas.width = width;
    tmp_canvas.height = height;

    var scene, bgColor, renderer, camera, composer, filmPass;
    var then = 0;

    var onPaint = function(e) {
        /*var rect = e.target.getBoundingClientRect();
        input.x = e.changedTouches[0].pageX - rect.left;
        input.y = e.changedTouches[0].pageY - rect.top;*/

        input.x = e.changedTouches[0].pageX;
        input.y = e.changedTouches[0].pageY;

        // Saving all the points in an array
        points.push({x: input.x, y: input.y});

        if (points.length < 3) {
            var b = points[0];
            tmp_ctx.beginPath();
            tmp_ctx.arc(b.x, b.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
            tmp_ctx.fill();
            tmp_ctx.closePath();

            return;
        }

        // Tmp canvas is always cleared up before drawing.
        tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

        tmp_ctx.beginPath();
        tmp_ctx.moveTo(points[0].x, points[0].y);

        for (var i = 1; i < points.length - 2; i++) {
            var c = (points[i].x + points[i + 1].x) / 2;
            var d = (points[i].y + points[i + 1].y) / 2;

            tmp_ctx.quadraticCurveTo(points[i].x, points[i].y, c, d);

        }

        // For the last 2 points
        tmp_ctx.quadraticCurveTo(
            points[i].x,
            points[i].y,
            points[i + 1].x,
            points[i + 1].y
        );
        tmp_ctx.stroke();

    };

    init();

    function init() {

        sceneSetup();
        render();

        if (isMobile()) {
            window.addEventListener("touchstart", handleStart, {passive: false});
            window.addEventListener("touchend", handleEnd, {passive: false});
            window.addEventListener("touchmove", onPaint, {passive: false});
        } else {
            window.addEventListener("mousemove", onInputMove);
        }

        window.addEventListener("resize", resize);
        resize();

        //playMusic();
    }

    function handleStart(e) {
        var rect = e.target.getBoundingClientRect();
        input.x = e.changedTouches[0].pageX - rect.left;
        input.y = e.changedTouches[0].pageY - rect.top;

        points.push({x: input.x, y: input.y});

        if (fader.progress > 0) {
            fader.reverse();
        } else {
            fader.direction = "normal";
            fader.seek(0);
            fader.pause();
            fader.began = false;
        }

    }

    function handleEnd(e) {

        // Writing down to real canvas now
        draw_ctx.drawImage(tmp_canvas, 0, 0);
        // Clearing tmp canvas
        tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

        // Emptying up Pencil Points
        points = [];

        if ((fader.direction === "reverse" && fader.completed) || (fader.direction === "normal" && fader.progress === 0)) {
            fader.direction = "normal";
            fader.play();
        } else if (fader.direction === "reverse") {
            fader.reverse();
        } else {
            fader.seek(0);
            fader.pause();
            fader.began = false;
        }

    }

    function playMusic() {
        tl = anime.timeline({
            easing: 'easeInOutSine',
            duration: music.duration
        });

        music.play();
    }

    function sceneSetup() {
        tmp_ctx.lineWidth = 50;
        tmp_ctx.lineJoin = 'round';
        tmp_ctx.lineCap = 'round';
        tmp_ctx.strokeStyle = '#f4f4f4';
        tmp_ctx.fillStyle = '#f4f4f4';

        scene = new THREE.Scene();
        bgColor = new THREE.Color(0.5, 0.5, 0.5);
        scene.background = bgColor;

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

        // Film noise
        filmPass = new FilmPass(
            0.2,   // noise intensity
            0.025,  // scanline intensity
            648,    // scanline count
            false,  // grayscale
        );
        filmPass.renderToScreen = true;
        //composer.addPass(filmPass);

        // Further antialiasing
        var SMAApass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
        composer.addPass(SMAApass);

    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        //camera.aspect = width / height;
        //camera.updateProjectionMatrix();

        document.querySelector("#draw").setAttribute("width", width);
        document.querySelector("#draw").setAttribute("height", height);

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

    onDeviceMove = function (e) {
        e.preventDefault();

        input.a = e.alpha;
        if (input.a > 180) input.a = 360 - input.a;
        input.b = e.beta;
        if (input.b < 0) input.b = -input.b;
        input.g = e.gamma;
        if (input.g < 0) input.g = -input.g;
    };

    function render() {

        if (isMobile()) {

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

            // damping mouse for smoother interaction
            input.xDamped = lerp(input.xDamped, input.x, 0.1);
            input.yDamped = lerp(input.yDamped, input.y, 0.1);

            scene.background.r = map(input.xDamped, 0, width, 0.5, 0.7);
            scene.background.r += map(input.yDamped, 0, height, -0.2, 0.4);

            scene.background.b = map(input.yDamped, 0, height, 0.5, -0.2);
            scene.background.b += map(input.xDamped, 0, width, 0.45, 0.1);

            scene.background.g = map(input.xDamped, 0, width, 0.2, 0.06);
            scene.background.g += map(input.yDamped, 0, height, 0.15, -0.3);

        }

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

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
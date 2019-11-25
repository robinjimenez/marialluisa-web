/*
    ---------------------
    SUPOSICIONS - Main Module
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
var points = [];
var mode = "draw";

$("#tool-change").click(function () {
    mode = (mode === "draw") ? "erase" : "draw";
    $(this).find("svg").toggleClass("draw");
});

createScene();

function createScene() {

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

        let context;

        if (mode === "draw") {
            context = tmp_ctx;
            context.strokeStyle = '#211e1e';
            context.fillStyle = '#211e1e';
        } else {
            context = draw_ctx;
        }

        context.lineWidth = 10;
        context.lineJoin = 'round';
        context.lineCap = 'round';

        if (e.type === "touchmove") {
            input.x = e.changedTouches[0].pageX;
            input.y = e.changedTouches[0].pageY;
        } else {
            input.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
            input.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
        }

        // Saving all the points in an array
        points.push({x: input.x, y: input.y});

        if (points.length < 3) {
            var b = points[0];
            context.beginPath();
            context.arc(b.x, b.y, context.lineWidth / 2, 0, Math.PI * 2, !0);
            context.fill();
            context.closePath();

            return;
        }

        // Tmp canvas is always cleared up before drawing.
        tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

        context.beginPath();
        draw_ctx.globalCompositeOperation = (mode === "draw") ? 'source-over' : 'destination-out';
        context.moveTo(points[0].x, points[0].y);

        for (var i = 1; i < points.length - 2; i++) {
            var c = (points[i].x + points[i + 1].x) / 2;
            var d = (points[i].y + points[i + 1].y) / 2;

            context.quadraticCurveTo(points[i].x, points[i].y, c, d);

        }

        // For the last 2 points
        context.quadraticCurveTo(
            points[i].x,
            points[i].y,
            points[i + 1].x,
            points[i + 1].y
        );
        context.stroke();

    };

    init();

    function init() {

        sceneSetup();
        render();

        if (isMobile()) {
            tmp_canvas.addEventListener("touchstart", handleStart, {passive: false});
            tmp_canvas.addEventListener("touchend", handleEnd, {passive: false});
            tmp_canvas.addEventListener("touchmove", onPaint, {passive: false});
        } else {
            tmp_canvas.addEventListener('mousedown', handleStart, {passive: false});
            tmp_canvas.addEventListener('mouseup', handleEnd, {passive: false});
        }

        window.addEventListener("resize", resize);
        resize();

        sound.play();

        document.querySelector('.overlay').setAttribute("class", "overlay hidden");
        document.querySelector('#start-button').remove();
    }

    function handleStart(e) {

        if (e.type === "touchmove") {
            let rect = e.target.getBoundingClientRect();
            input.x = e.changedTouches[0].pageX - rect.left;
            input.y = e.changedTouches[0].pageY - rect.top;
        } else {
            tmp_canvas.addEventListener("mousemove", onPaint, {passive: false});

            input.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
            input.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
        }

        points.push({x: input.x, y: input.y});

        //if (e.type === "mousedown")  onPaint();

        /*if (fader.progress > 0) {
            fader.reverse();
        } else {
            fader.direction = "normal";
            fader.seek(0);
            fader.pause();
            fader.began = false;
        }*/

    }

    function handleEnd(e) {

        tmp_canvas.removeEventListener("mousemove", onPaint, {passive: false});

        if (mode === "draw") {

            // Writing down to real canvas now
            draw_ctx.drawImage(tmp_canvas, 0, 0);
            // Clearing tmp canvas
            tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

        }

        // Emptying up Pencil Points
        points = [];

        /*if ((fader.direction === "reverse" && fader.completed) || (fader.direction === "normal" && fader.progress === 0)) {
            fader.direction = "normal";
            fader.play();
        } else if (fader.direction === "reverse") {
            fader.reverse();
        } else {
            fader.seek(0);
            fader.pause();
            fader.began = false;
        }*/

    }

    function playMusic() {
        tl = anime.timeline({
            easing: 'easeInOutSine'
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

    function sceneSetup() {


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
        //camera.aspect = width / height;
        //camera.updateProjectionMatrix();

        document.querySelector("#draw").setAttribute("width", width);
        document.querySelector("#draw").setAttribute("height", height);

        renderer.setSize(width, height);
    }

    function render() {

        var time = performance.now() * 0.001;
        const deltaTime = time - then;
        then = time;

        composer.render(deltaTime);
        requestAnimationFrame(render);
    }

}
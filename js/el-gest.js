/*
    ---------------------
    EL GEST - Main Module
    ---------------------
 */

// Import dependencies
import anime from '../lib/animejs/lib/anime.es.js';

// Variables
var points = [];
var mode = "draw";

var addingElement = false;

// Toggle tool when button is pressed
$("#tool-change").click(function () {
    mode = (mode === "draw") ? "erase" : "draw";
    $(this).find("svg").toggleClass("draw");
});

// Custom graphic element object to store images and positions
function graphEl(img, offsetX, offsetY) {
    this.img = img;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
}

videoSetup();

/**
 * Attempt to create video element and add sources,
 * WebM format with mp4 fallback, set attributes and
 * add to DOM. If unable to play, show message.
 */
function videoSetup() {
    if (!!document.createElement('video').canPlayType) {
        let video = document.createElement('video');
        var webm = document.createElement("source");
        webm.type = "video/webm";
        webm.src = "media/video/el-gest.webm";
        video.appendChild(webm);
        var mp4 = document.createElement("source");
        mp4.type = "video/mp4";
        mp4.src = "media/video/el-gest.mp4";
        video.appendChild(mp4);
        video.setAttribute("playsinline", "");
        video.preload = "auto";
        video.style.maxHeight = window.innerHeight + "px";

        document.querySelector('.video-container').appendChild(video);

    } else {

        let info = document.createElement('p');
        info.setAttribute("class", "experience-info");
        info.innerText = "el teu navegador no pot reproduïr l'experiència. intenta-ho amb un més modern."
    }

    document.getElementById('start-button').onclick = createScene;

}

/**
 * Creates, sets up and renders scene
 */
function createScene() {

    var graphics = {};
    var elementCanvas = {};

    var draw_canvas = document.querySelector("#draw");
    var draw_ctx = draw_canvas.getContext('2d');
    var tmp_canvas = document.querySelector("#current_draw");
    var tmp_ctx = tmp_canvas.getContext('2d');
    var video;

    draw_ctx.imageSmoothingEnabled = true;
    tmp_ctx.imageSmoothingEnabled = true;

    var width = document.querySelector('body').getBoundingClientRect().width;
    var height = document.querySelector('body').getBoundingClientRect().height;

    draw_canvas.width = width;
    draw_canvas.height = height;

    tmp_canvas.width = width;
    tmp_canvas.height = height;

    /**
     * Paint (or erase) stroke onto canvas, according to mode,
     * reading input, saving points to array and softening by
     * using quadratic curves between points
     */
    var onPaint = function (e) {

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

        // Read input accordingly
        if (e.type === "touchmove") {
            input.x = e.changedTouches[0].pageX;
            input.y = e.changedTouches[0].pageY;
        } else {
            input.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
            input.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
        }

        // Save all the points in array
        points.push({x: input.x, y: input.y});

        // If stroke not long enough draw circle and end
        if (points.length < 3) {
            var b = points[0];
            context.beginPath();
            context.arc(b.x, b.y, context.lineWidth / 2, 0, Math.PI * 2, !0);
            context.fill();
            context.closePath();

            return;
        }

        // Clear temp canvas before drawing
        tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

        context.beginPath();
        draw_ctx.globalCompositeOperation = (mode === "draw") ? 'source-over' : 'destination-out';
        context.moveTo(points[0].x, points[0].y);

        // Draw all points in array and join them with quadratic curves
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

    /**
     * Set up scene, add event listeners and load assets.
     */
    function init() {

        loadImages();
        animationSetup();

        if (isMobile()) {
            tmp_canvas.addEventListener("touchstart", handleStart, {passive: false});
            tmp_canvas.addEventListener("touchend", handleEnd, {passive: false});
            tmp_canvas.addEventListener("touchmove", onPaint, {passive: false});
        } else {
            tmp_canvas.addEventListener('mousedown', handleStart, {passive: false});
            tmp_canvas.addEventListener('mouseup', handleEnd, {passive: false});
        }

        video = document.querySelector('video');

        video.addEventListener("timeupdate", function () {
            if (this.currentTime > 0.001) {
                tl.seek(video.currentTime * 1000);
                tl.play();
            }
        });

        video.play();

        document.querySelector('.overlay').setAttribute("class", "overlay hidden");
        document.querySelectorAll('.experience-info').forEach(function (el) {
            el.remove()
        });
    }

    /**
     * Load images from assets folder, create DOM elements
     * and add to array
     */
    function loadImages() {

        var img = new Image();
        img.src = 'media/img/el-gest/andreu-glasses.png';
        var el = new graphEl(img, 0, 0);
        graphics["andreu-glasses"] = el;
        elementCanvas["andreu-glasses"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/andreu-pop.png';
        el = new graphEl(img, 0, 0);
        graphics["andreu-pop"] = el;
        elementCanvas["andreu-pop"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/andreu-tear-1.png';
        el = new graphEl(img, 0, 0);
        graphics["andreu-tear-1"] = el;
        elementCanvas["andreu-tear-1"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/andreu-tear-2.png';
        el = new graphEl(img, 0, 0);
        graphics["andreu-tear-2"] = el;
        elementCanvas["andreu-tear-2"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/andreu-tear-3.png';
        el = new graphEl(img, 0, -20);
        graphics["andreu-tear-3"] = el;
        elementCanvas["andreu-tear-3"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/litus-halo.png';
        el = new graphEl(img, 0, 0);
        graphics["litus-halo"] = el;
        elementCanvas["litus-halo"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/litus-pop.png';
        el = new graphEl(img, 0, 0);
        graphics["litus-pop"] = el;
        elementCanvas["litus-pop"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/pau-mouth.png';
        el = new graphEl(img, 0, 0);
        graphics["pau-mouth"] = el;
        elementCanvas["pau-mouth"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/pau-pop.png';
        el = new graphEl(img, 0, 0);
        graphics["pau-pop"] = el;
        elementCanvas["pau-pop"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/pau-symbols.png';
        el = new graphEl(img, 0, 0);
        graphics["pau-symbols"] = el;
        elementCanvas["pau-symbols"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/pol-patch.png';
        el = new graphEl(img, 0, 0);
        graphics["pol-patch"] = el;
        elementCanvas["pol-patch"] = document.createElement("canvas");

        img = new Image();
        img.src = 'media/img/el-gest/spheres.png';
        el = new graphEl(img, 0, 0);
        graphics["spheres"] = el;
        elementCanvas["spheres"] = document.createElement("canvas");

    }

    /**
     * Set up keyframes for element addition
     * and canvas fading/cleanup
     */
    function animationSetup() {

        tl = anime.timeline({
            autoplay: false,
            begin: function (anim) {
                anim.seek(document.querySelector('video').currentTime * 1000);
            },
        });

        // PAU - Mouth cover
        tl.add({
            targets: elementCanvas["pau-mouth"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 4000,
            begin: function () {
                addElement("pau-mouth");
            },
            complete: function () {
                fixElement("pau-mouth")
            }
        }, 10000);

        // Fade out and clear canvas
        tl.add({
            targets: draw_canvas, tmp_canvas,
            opacity: [1.0, 0.0],
            easing: 'easeInOutSine',
            duration: 1000,
            complete: function () {
                draw_ctx.clearRect(0, 0, draw_canvas.width, draw_canvas.height);
                draw_canvas.setAttribute("style", "opacity: 1");
            }
        }, 16000);

        // ANDREU - Tears
        tl.add({
            targets: elementCanvas["andreu-tear-1"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 5000,
            begin: function () {
                addElement("andreu-tear-1");
            },
            complete: function () {
                fixElement("andreu-tear-1");
            }
        }, 18000);

        tl.add({
            targets: elementCanvas["andreu-tear-2"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 5000,
            begin: function () {
                addElement("andreu-tear-2");
            },
            complete: function () {
                fixElement("andreu-tear-2");
            }
        }, 19000);

        tl.add({
            targets: elementCanvas["andreu-tear-3"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 5000,
            begin: function () {
                addElement("andreu-tear-3");
            },
            complete: function () {
                fixElement("andreu-tear-3");
            }
        }, 20000);

        // Fade out and clear canvas
        tl.add({
            targets: draw_canvas, tmp_canvas,
            opacity: [1.0, 0.0],
            easing: 'easeInOutSine',
            duration: 1000,
            complete: function () {
                draw_ctx.clearRect(0, 0, draw_canvas.width, draw_canvas.height);
                draw_canvas.setAttribute("style", "opacity: 1");
            }
        }, 27000);

        // POL - Patch
        tl.add({
            targets: elementCanvas["pol-patch"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 4000,
            begin: function () {
                addElement("pol-patch");
            },
            complete: function () {
                fixElement("pol-patch")
            }
        }, 30000);

        // Fade out and clear canvas
        tl.add({
            targets: draw_canvas, tmp_canvas,
            opacity: [1.0, 0.0],
            easing: 'easeInOutSine',
            duration: 200,
            complete: function () {
                draw_ctx.clearRect(0, 0, draw_canvas.width, draw_canvas.height);
                draw_canvas.setAttribute("style", "opacity: 1");
            }
        }, 39000);

        // LITUS - Pop
        tl.add({
            targets: elementCanvas["litus-pop"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 200,
            begin: function () {
                addElement("litus-pop");
            },
            complete: function () {
                elementCanvas["litus-pop"].getContext('2d').clearRect(0, 0, elementCanvas["litus-pop"].width, elementCanvas["litus-pop"].height);
                elementCanvas["litus-pop"].remove();
                addingElement = false;
            }
        }, 39500);

        // ANDREU - Pop
        tl.add({
            targets: elementCanvas["andreu-pop"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 200,
            begin: function () {
                addElement("andreu-pop");
            },
            complete: function () {
                elementCanvas["andreu-pop"].getContext('2d').clearRect(0, 0, elementCanvas["andreu-pop"].width, elementCanvas["andreu-pop"].height);
                elementCanvas["andreu-pop"].remove();
                addingElement = false
            }
        }, 51000);

        // PAU - Symbols
        tl.add({
            targets: elementCanvas["pau-symbols"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 4000,
            begin: function () {
                addElement("pau-symbols");
            },
            complete: function () {
                fixElement("pau-symbols")
            }
        }, 69000);

        // Fade out and clear canvas
        tl.add({
            targets: draw_canvas, tmp_canvas,
            opacity: [1.0, 0.0],
            easing: 'easeInOutSine',
            duration: 200,
            complete: function () {
                draw_ctx.clearRect(0, 0, draw_canvas.width, draw_canvas.height);
                draw_canvas.setAttribute("style", "opacity: 1");
            }
        }, 78000);

        // LITUS - Halo
        tl.add({
            targets: elementCanvas["litus-halo"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 4000,
            begin: function () {
                addElement("litus-halo");
            },
            complete: function () {
                fixElement("litus-halo")
            }
        }, 83000);

        // Fade out and clear canvas
        tl.add({
            targets: draw_canvas, tmp_canvas,
            opacity: [1.0, 0.0],
            easing: 'easeInOutSine',
            duration: 200,
            complete: function () {
                draw_ctx.clearRect(0, 0, draw_canvas.width, draw_canvas.height);
                draw_canvas.setAttribute("style", "opacity: 1");
            }
        }, 85000);

        // ANDREU - Glasses
        tl.add({
            targets: elementCanvas["andreu-glasses"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 4000,
            begin: function () {
                addElement("andreu-glasses");
            },
            complete: function () {
                fixElement("andreu-glasses")
            }
        }, 93000);

        // Fade out and clear canvas
        tl.add({
            targets: draw_canvas, tmp_canvas,
            opacity: [1.0, 0.0],
            easing: 'easeInOutSine',
            duration: 200,
            complete: function () {
                draw_ctx.clearRect(0, 0, draw_canvas.width, draw_canvas.height);
                draw_canvas.setAttribute("style", "opacity: 1");
            }
        }, 100000);

        // PAU - Pop
        tl.add({
            targets: elementCanvas["pau-pop"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 200,
            begin: function () {
                addElement("pau-pop");
            },
            complete: function () {
                elementCanvas["pau-pop"].getContext('2d').clearRect(0, 0, elementCanvas["pau-pop"].width, elementCanvas["pau-pop"].height);
                elementCanvas["pau-pop"].remove();
                addingElement = false;
            }
        }, 111500);

        // ANDREU - Pop
        tl.add({
            targets: elementCanvas["andreu-pop"],
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 200,
            begin: function () {
                addElement("andreu-pop");
            },
            complete: function () {
                elementCanvas["andreu-pop"].getContext('2d').clearRect(0, 0, elementCanvas["andreu-pop"].width, elementCanvas["andreu-pop"].height);
                elementCanvas["andreu-pop"].remove();
                addingElement = false;
            }
        }, 123000);

        // End overlay animation
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
                draw_canvas.remove();
                tmp_canvas.remove();
                document.querySelector('video').remove();
            }
        }, sound.duration() * 1000);
    }

    /**
     *  Add new element and corresponding
     *  temporary canvas
     * @param {number} id The element identifier
     */
    function addElement(id) {
        if (graphics[id].img.complete) {
            elementCanvas[id].classList.add("element-canvas");
            elementCanvas[id].width = width;
            elementCanvas[id].height = height;
            draw_canvas.insertAdjacentElement('afterend', elementCanvas[id]);

            let scale = height / graphics[id].img.height;
            addingElement = true;
            let posX = width / 2 - graphics[id].img.width * scale / 2 + graphics[id].offsetX * scale;
            let posY = height / 2 - graphics[id].img.height * scale / 2 + graphics[id].offsetY * scale;

            elementCanvas[id].getContext('2d').drawImage(graphics[id].img, posX, posY, graphics[id].img.width * scale, graphics[id].img.height * scale);
        }
    }

    /**
     * Pass graphic element from temp canvas
     * onto fixed canvas
     * @param {number} id The element identifier
     */
    function fixElement(id) {
        let scale = height / graphics[id].img.height;
        let posX = width / 2 - graphics[id].img.width * scale / 2 + graphics[id].offsetX * scale;
        let posY = height / 2 - graphics[id].img.height * scale / 2 + graphics[id].offsetY * scale;

        draw_ctx.globalCompositeOperation = 'source-over';
        draw_ctx.drawImage(graphics[id].img, posX, posY, graphics[id].img.width * scale, graphics[id].img.height * scale);
        elementCanvas[id].getContext('2d').clearRect(0, 0, elementCanvas[id].width, elementCanvas[id].height);

        elementCanvas[id].remove();
        addingElement = false;
    }

    /**
     * Get mouse or touch coordinates on start
     * consider offset and pass onto points array
     * @param e The event that triggers it
     */
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

    }

    /**
     * Remove event listener for mouse movement when
     * user stops pressing, if on draw mode, add to fixed canvas
     * and reset points array
     */
    function handleEnd() {

        tmp_canvas.removeEventListener("mousemove", onPaint, {passive: false});

        if (mode === "draw") {

            draw_ctx.drawImage(tmp_canvas, 0, 0);
            tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

        }

        // Emptying up Pencil Points
        points = [];

    }

}
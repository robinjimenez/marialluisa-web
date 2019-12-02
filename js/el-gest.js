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
var graphics = [];

$("#tool-change").click(function () {
    mode = (mode === "draw") ? "erase" : "draw";
    $(this).find("svg").toggleClass("draw");
});

videoSetup();

function videoSetup() {
    if (!!document.createElement('video').canPlayType) {
        let video = document.createElement('video');
        var mp4 = document.createElement("source");
        mp4.type = "video/mp4";
        mp4.src = "media/video/el-gest-pau.mp4";
        video.appendChild(mp4);
        video.setAttribute("playsinline", "");
        video.setAttribute("preload", "");
        video.style.maxHeight = window.innerHeight + "px";

        document.querySelector('.video-container').appendChild(video);
        
    } else {

        let info = document.createElement('p');
        info.setAttribute("class", "experience-info");
        info.innerText = "el teu navegador no pot reproduïr l'experiència. intenta-ho amb un més modern."
    }

    document.getElementById('start-button').onclick = createScene;

}

function graphEl(img, offsetX, offsetY) {
    this.img = img;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
}

function createScene() {

    var draw_canvas = document.querySelector("#draw");
    var draw_ctx = draw_canvas.getContext('2d');
    var tmp_canvas = document.querySelector("#current_draw");
    var tmp_ctx = tmp_canvas.getContext('2d');
    var el_canvas = document.querySelector("#elements");
    var el_ctx = el_canvas.getContext('2d');

    draw_ctx.imageSmoothingEnabled = true;
    tmp_ctx.imageSmoothingEnabled = true;


    /*var fader = anime({
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
    });*/

    var width = document.querySelector('body').getBoundingClientRect().width;
    var height = document.querySelector('body').getBoundingClientRect().height;

    draw_canvas.width = width;
    draw_canvas.height = height;

    tmp_canvas.width = width;
    tmp_canvas.height = height;

    el_canvas.width = width;
    el_canvas.height = height;

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

        document.querySelector('video').play();

        document.querySelector('.overlay').setAttribute("class", "overlay hidden");
        document.querySelector('#start-button').remove();
    }

    function loadImages() {

        var img = new Image();
        img.src = 'media/img/mouth-cover.png';
        var el = new graphEl(img, -50,120);
        graphics.push(el);

        img = new Image();
        img.src = 'media/img/nord-gradient.png';
        el = new graphEl(img, 0,0);
        graphics.push(el);
    }

    function animationSetup() {
        tl = anime.timeline();

        let scale = (height / 1000) / 2;

        // Mouth cover

        tl.add({
            targets: el_canvas,
            opacity: [0.0, 1.0],
            easing: 'easeInOutSine',
            duration: 5000,
            begin: function () {
                if (graphics[0].img.complete) {
                    addingElement = true;
                    let posX = width/2 - graphics[0].img.width * scale / 2 + graphics[0].offsetX * scale;
                    let posY = height/2 - graphics[0].img.height * scale / 2 + graphics[0].offsetY * scale;

                    el_ctx.drawImage(graphics[0].img,posX,posY,graphics[0].img.width * scale, graphics[0].img.height * scale);
                }
            },
            complete: function () {

                let posX = width/2 - graphics[0].img.width * scale / 2 + graphics[0].offsetX * scale;
                let posY = height/2 - graphics[0].img.height * scale / 2 + graphics[0].offsetY * scale;

                draw_ctx.globalCompositeOperation = 'source-over';
                draw_ctx.drawImage(graphics[0].img,posX,posY,graphics[0].img.width * scale, graphics[0].img.height * scale);
                el_ctx.clearRect(0, 0, el_canvas.width, el_canvas.height);

                el_canvas.setAttribute("style", "opacity: 0");
                addingElement = false;
            }
        }, 10000);

        tl.add({
            targets: draw_canvas, tmp_canvas,
            opacity: [1.0, 0.0],
            easing: 'easeInOutSine',
            duration: 1000,
            complete: function () {
                draw_ctx.clearRect(0, 0, draw_canvas.width, draw_canvas.height);
                draw_canvas.setAttribute("style", "opacity: 1");

            }
        }, 20000);

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


}
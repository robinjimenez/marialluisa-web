/*
    ---------------------
    La posta - Main Module
    ---------------------
 */
import anime from '../lib/animejs/lib/anime.es.js';

const colors = [
    '#3c261c',
    '#211e1e',
    '#360d21',
    '#36281f'
];


document.getElementById('start-button').onclick = function () {

    tl = anime.timeline({
        begin: function () {
            sound.play();
            document.querySelectorAll('.experience-info').forEach(function (el) {
                el.remove()
            });
            document.querySelector('.loading-message').remove();
            document.querySelector('#start-button').remove();
        }
    });

    function randomColors() {
        anime({
            targets: 'body',
            background: function() {
                return colors[anime.random(0, colors.length-1)];
            },
            easing: 'linear',
            duration: anime.random(5000, 10000),
            complete: randomColors
        });
    }

    randomColors();

    function randomFlicker() {
        anime({
            targets: '.flicker',
            opacity: function() {
                return anime.random(0, 10)/100;
            },
            easing: 'easeInOutBounce',
            duration: anime.random(100, 500),
            complete: randomFlicker
        });
    }

    randomFlicker();

    tl.add({
        target: document,
        easing: 'easeInOutSine',
        duration: 1000,
        begin: function () {
            if (isMobile()) document.querySelector('#orientation-info').remove();
            document.querySelector('.overlay-message').appendChild(document.querySelector("template").content);
            document.querySelector("#back-button").addEventListener('click', function () {
                location.href = './';
            });
            document.querySelector('#overlay').classList.remove("hidden");
            document.querySelector('#overlay').classList.toggle("end");
        }
    }, sound.duration() * 1000);

    document.querySelector('#overlay').classList.toggle("hidden");
};


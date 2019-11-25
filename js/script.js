/*
    ---------------------
    HOMEPAGE - Main script
    ---------------------
*/

import anime from '../lib/animejs/lib/anime.es.js';

var colors = [
    "green",
    "yellow",
    "pink"
];

var backgrounds = new Map([
    ["miracle",""],
    ["mala-sang",""],
    ["nord",""],
    ["bestia",""],
    ["girasol",""],
    ["nica",""],
    ["estres",""],
    ["8",""],
    ["diga-m",""]
]);

var touchStart = 0;

$(document).ready(function () {

    var playSVG = document.getElementsByTagName("template")[0];
    var clone = playSVG.content.cloneNode(true);
    $(".play-container").append(clone);

    var xDown = null;

    function getTouches(e) {
        return e.touches || e.originalEvent.touches;
    }

    // direction 1 for right, -1 for left
    function shiftLeft() {
        $('.slide-container').each(function () {
            $(this).attr("data-index", parseInt($(this).attr("data-index")) - 1);
            if ($(this).attr("data-index") < -4) {
                $(this).attr("data-index", 3);
            }
        });
        updatePageStatus();
    }

    function shiftRight() {
        $('.slide-container').each(function () {
            $(this).attr("data-index", parseInt($(this).attr("data-index")) + 1);
            if ($(this).attr("data-index") > 3) {
                $(this).attr("data-index", -4);
            }
        });
        updatePageStatus();
    }

    function updatePageStatus() {
        var $active_slide = $(".slide-container[data-index='0']");
        $('body').removeClass();
        if ($active_slide.hasClass('slide-yellow')) {
            $('body').addClass('yellow-page');
        } else if ($active_slide.hasClass('slide-pink')) {
            $('body').addClass('pink-page');
        } else {
            $('body').addClass('turquoise-page');
        };
    }

    $('.slide-container').on('click', function (e) {
        e.preventDefault();
        if ($(this).attr("data-index") > 0) {

            shiftLeft();
        } else if ($(this).attr("data-index") == 0) {

            let container = $('.slide-container[data-index="0"]');
            let url = $(this).attr('href');

            animateStart(url,container);

        } else {
            shiftRight();
        }
    });

    $('.slide-container').on('mousedown', function (e) {
        if ($(this).attr("data-index") == 0) {
            e.preventDefault();
            let container = $('.slide-container[data-index="0"]');
            let tl = anime.timeline();

            tl.add({
                targets: container.find('.play-container')[0],
                scale: [0.5, 0.4],
                duration: 100,
                easing: 'easeInOutSine'
            });

            tl.add({
                targets: container.find('svg')[0],
                opacity: 0.5,
                duration: 100,
                easing: 'easeInOutSine'
            }, 0);
        }
    });

    $('.slide-container').on('touchstart', function (e) {
        e.preventDefault();
        if ($(this).attr("data-index") == 0) {
            touchStart = new Date().getTime();
        }
    });

    $('.slide-container').on('touchend', function (e) {
        e.preventDefault();
        if (($(this).attr("data-index") == 0) && ((new Date().getTime() - touchStart) < 200)) {

            let container = $('.slide-container[data-index="0"]');
            let url = $(this).attr('href');

            animateStart(url,container);

        }
    });

    $('#slider').on('touchstart', function (e) {
        e.preventDefault();
        const firstTouch = getTouches(e)[0];
        xDown = firstTouch.clientX;
    });

    $('#slider').on('touchmove', function (e) {
        if (!xDown) {
            return;
        }

        var xUp = e.touches[0].clientX;

        var xDiff = xDown - xUp;

        if (xDiff > 5) {
            shiftLeft();
        } else if (xDiff < -5) {
            shiftRight();
        }

        xDown = null;
    });

    $('body').on('keydown', function (e) {
        switch (e.which) {
            case 39:
                shiftLeft();
                break;
            case 37:
                shiftRight();
                break;
        }
    });
    updatePageStatus();

    function animateStart(url, container) {
        let tl = anime.timeline();

        tl.add({
            targets: container.find('.slide-dropdown h2')[0],
            translateY: "-20px",
            duration: 400,
            easing: 'easeInOutSine'
        });

        tl.add({
            targets: container.find('.slide-dropdown h2')[0],
            opacity: 0,
            duration: 200,
            easing: 'easeInOutSine'
        }, 0);

        tl.add({
            targets: container.find('.slide-shadow')[0],
            height: ['75%', '60%'],
            duration: 50,
            easing: 'easeInOutSine'
        }, 100);

        tl.add({
            targets: container.find('.slide-shadow')[0],
            opacity: 0,
            duration: 100,
            easing: 'easeInOutSine'
        }, 200);

        tl.add({
            targets: container.find('.slide-dropdown')[0],
            height: ['100%', '70%'],
            duration: 100,
            easing: 'easeInOutSine'
        }, 100);

        tl.add({
            targets: container.find('.slide-dropdown')[0],
            opacity: 0,
            duration: 100,
            easing: 'easeInOutSine'
        }, 200);

        tl.add({
            targets: container.find('.slide-content')[0],
            borderRadius: "20px",
            duration: 100,
            easing: 'easeInOutSine'
        }, 500);

        tl.add({
            targets: container.find('.slide-content')[0],
            backgroundColor: "#F4F4F4",
            duration: 300,
            easing: 'easeInOutSine'
        });

        tl.add({
            targets: container.find('svg')[0],
            opacity: 0,
            duration: 100,
            easing: 'easeInOutSine'
        }, "-=300");

        tl.add({
            targets: container[0],
            scale: 5,
            duration: 500,
            easing: 'easeInOutSine',
            complete: function () {
                window.location.href = url;
            }
        });
    }

});
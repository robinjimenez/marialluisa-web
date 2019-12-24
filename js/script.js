/*
    ---------------------
    HOMEPAGE - Main script
    ---------------------
*/

import anime from '../lib/animejs/lib/anime.es.js';

var touchStart = 0;

$(document).ready(function () {

    var playSVG = document.getElementsByTagName("template")[0];
    var clone = playSVG.content.cloneNode(true);
    $(".play-container").append(clone);

    $('#menu-hamburger').on('click', function () {
        var menu = $('.menu-container');
        if (menu.attr('data-expanded') === 'false') {
            menu.attr('data-expanded', "true");
            anime({
                targets: 'li.menu-item',
                delay: anime.stagger(100),
                opacity: 1,
                translateY: 0,
                easing: 'easeInOutSine',
                duration: 1000
            });
        } else {
            anime({
                targets: 'li.menu-item',
                opacity: 0,
                translateY: -10,
                easing: 'easeInOutSine',
                duration: 500,
                complete: function () {
                    menu.attr('data-expanded', "false");
                }
            });
        }
    });

    var xDown = null;

    function getTouches(e) {
        return e.touches || e.originalEvent.touches;
    }

    // direction 1 for right, -1 for left
    function shiftLeft() {
        $('.slide-container').each(function () {
            $(this).attr("data-index", parseInt($(this).attr("data-index")) - 1);
            if ($(this).attr("data-index") < -4) {
                $(this).attr("data-index", 4);
            }
        });
        updatePageStatus();
    }

    function shiftRight() {
        $('.slide-container').each(function () {
            $(this).attr("data-index", parseInt($(this).attr("data-index")) + 1);
            if ($(this).attr("data-index") > 4) {
                $(this).attr("data-index", -4);
            }
        });
        updatePageStatus();
    }

    function updatePageStatus() {
        var $active_slide = $(".slide-container[data-index='0']");
        var $body = $('body');
        $body.removeClass();
        switch (true) {
            case ($active_slide.hasClass('slide-yellow')):
                $body.addClass('yellow-page');
                break;
            case ($active_slide.hasClass('slide-blue')):
                $body.addClass('blue-page');
                break;
            case ($active_slide.hasClass('slide-pink')):
                $body.addClass('pink-page');
                break;
            case ($active_slide.hasClass('slide-orange')):
                $body.addClass('orange-page');
                break;
            case ($active_slide.hasClass('slide-turquoise')):
                $body.addClass('turquoise-page');
                break;
            case ($active_slide.hasClass('slide-purple')):
                $body.addClass('purple-page');
                break;
        }
    }

    $('.next-slide').on('click touchstart', shiftLeft);
    $('.last-slide').on('click touchstart', shiftRight);

    $('.slide-container').on('click', function (e) {
        e.preventDefault();
        if ($(this).attr("data-index") > 0) {
            shiftLeft();
        } else if ($(this).attr("data-index") == 0) {

            let url = $(this).attr('href');

            animateStart(url, $(this));

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
        if (($(this).attr("data-index") == 0) && ((new Date().getTime() - touchStart) < 100)) {

            let url = $(this).attr('href');

            animateStart(url);

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

    function animateStart(url) {
        let overlay = document.createElement("div");
        overlay.classList.add("trans-overlay");
        document.body.insertAdjacentElement('afterbegin',overlay);

        anime({
            targets: overlay,
            opacity: [0, 1],
            easing: 'easeInOutSine',
            duration: 1000,
            complete: function () {
                window.location.href = url;
            }
        });
    }

});
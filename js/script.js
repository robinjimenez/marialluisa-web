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

        // If History API available, change url query
        /*if (history.pushState) {
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?tema=' + $active_slide.attr('id');
            window.history.pushState({path: newurl}, '', newurl);
        }*/

        var $body = $('body');
        switch (true) {
            case ($active_slide.hasClass('slide-yellow')):
                $body.attr("data-colour", "yellow");
                break;
            case ($active_slide.hasClass('slide-blue')):
                $body.attr("data-colour", "blue");
                break;
            case ($active_slide.hasClass('slide-pink')):
                $body.attr("data-colour", "pink");
                break;
            case ($active_slide.hasClass('slide-orange')):
                $body.attr("data-colour", "orange");
                break;
            case ($active_slide.hasClass('slide-turquoise')):
                $body.attr("data-colour", "turquoise");
                break;
            case ($active_slide.hasClass('slide-purple')):
                $body.attr("data-colour", "purple");
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

            window.location.href = url;

        } else {
            shiftRight();
        }
    });

    $('.slide-container').on('mousedown', function (e) {
        if ($(this).attr("data-index") == 0) {
            e.preventDefault();
            let container = $('.slide-container[data-index="0"]');
            /*let tl = anime.timeline();

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
            }, 0);*/
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

            window.location.href = url;

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

    $('body').on('keyup', function (e) {
        switch (e.which) {
            case 39:
                shiftLeft();
                break;
            case 37:
                shiftRight();
                break;
        }
    });


    anime({
        targets: '#reveal',
        opacity: 0,
        easing: 'easeInOutSine',
        autoplay: true,
        duration: 2000,
        begin: function () {
            updatePageStatus();
        },
        complete: function () {
            $("#reveal").remove();
        }
    });

});
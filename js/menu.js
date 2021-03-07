/*
    ---------------------
    HOMEPAGE - Menu script
    ---------------------
*/

import anime from '../lib/animejs/lib/anime.es.js';

$(document).ready(function () {

    $('.hamburger').on('click', function () {
        $('.hamburger').toggleClass('is-active');

        var menu = $('.menu-container');
        if (menu.attr('data-expanded') === 'false') {
            menu.attr('data-expanded', "true");
            $('html, body').attr('style', 'overflow: hidden');

            /*anime({
                targets: 'svg.icon path',
                delay: anime.stagger(100),
                opacity: 1,
                translateY: 0,
                easing: 'easeInOutSine',
                duration: 1000
            });*/

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
                    $('html, body').attr('style', 'overflow-x: hidden');
                    $('html, body').attr('style', 'overflow-y: scroll');
                    menu.attr('data-expanded', "false");
                }
            });
        }
    });

});
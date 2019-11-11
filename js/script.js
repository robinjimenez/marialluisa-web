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
        if ($(this).attr("data-index") > 0) {
            shiftLeft();
        } else {
            shiftRight();
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
    })
    updatePageStatus();
});
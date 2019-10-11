$(document).ready(function () {

    var xDown = null;

    function getTouches(e) {
        return e.touches || e.originalEvent.touches;
    }

    $('#slider').on('touchstart', function (e) {
        const firstTouch = getTouches(e)[0];
        xDown = firstTouch.clientX;
    });

    $('#slider').on('touchmove', function (e) {
        if (!xDown) {
            return;
        }

        var xUp = e.touches[0].clientX;

        var xDiff = xDown - xUp;

        if (xDiff > 0) {
            $('.slide-container').each(function () {
                $(this).attr("data-index", parseInt($(this).attr("data-index")) - 1);
                if ($(this).attr("data-index") < -4) {
                    $(this).attr("data-index", 4);
                }
            });
        } else if (xDiff < 0) {
            $('.slide-container').each(function () {
                $(this).attr("data-index", parseInt($(this).attr("data-index")) + 1);
                if ($(this).attr("data-index") > 4) {
                    $(this).attr("data-index", -4);
                }
            });
        }

        xDown = null;
    });

});

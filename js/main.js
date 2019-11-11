/* requestAnimationFrame shim */
if (window.requestAnimationFrame == null) {
    window.requestAnimationFrame =
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
}

function comma(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,');
}

var particles = null,controller = null;

$(document).ready(function() {
    var canvas = $('#display')[0];
    particles = new Particles(canvas, 1024 * 16, 3).draw().start();
    controller = new Controller(particles);
});

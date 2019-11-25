import anime from '../lib/animejs/lib/anime.es.js';

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setBackground);
}

function setBackground(position) {
    var now = new Date();

    console.log(now);
    var times = SunCalc.getTimes(new Date(), position.coords.latitude, position.coords.longitude);
    console.log(times);


    if (now < times.dawn || now > times.dusk) {
        $('body').addClass('night');
    } else if (now >= times.dawn && now < times.sunriseEnd) {
        $('body').addClass('sunrise');
    } else if (now >= times.sunriseEnd && now < times.solarNoon) {
        $('body').addClass('morning');
    } else if (now >= times.solarNoon && now < times.sunsetStart) {
        $('body').addClass('afternoon');
    } else if (now >= times.sunsetStart && now < times.dusk) {
        $('body').addClass('sunset');
    }

}

document.getElementById('start-button').onclick = function () {
    document.querySelector('.overlay').setAttribute("class", "overlay hidden");
    document.querySelector('.experience-info').remove();
    document.querySelector('.experience-info').remove();
    document.querySelector('#start-button').remove();

    sound.play();

    tl = anime.timeline({
        easing: 'easeInOutSine',
        duration: sound.duration() * 1000
    });

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
            //container.remove();
        }
    }, sound.duration() * 1000);


};


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

$(document).ready(function () {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setBackground);
    }

});
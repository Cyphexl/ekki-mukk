$(document).ready(function () {
    if (is_touch_device()) {
        for (var i = 0; i < $('.post-title').length; i++) {
            var current = $('.post-title')[i].children;
            $(current).css('transition', 'initial');
        }
    }
})
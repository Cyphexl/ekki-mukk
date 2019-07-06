if (!is_touch_device()) {
    // Alternative lib: SimpleBar
    // Array.prototype.forEach.call(document.querySelectorAll('.highlight table'), el => new SimpleBar);

    // OverlayScrollBars
    document.addEventListener("DOMContentLoaded", function () {
        //The first argument are the elements to which the plugin shall be initialized
        //The second argument has to be at least a empty object or a object with your desired options
        OverlayScrollbars(document.querySelectorAll('.highlight table, .katex-display'), {
            className: "os-theme-minimal-dark",
            scrollbars: {
                autoHide: "leave",
                autoHideDelay: 10
            }
        });
    });
}

function is_touch_device() {
    var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    var mq = function (query) {
        return window.matchMedia(query).matches;
    }

    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
        return true;
    }

    // include the 'heartz' as a way to have a non matching MQ to help terminate the join
    // https://git.io/vznFH
    var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    return mq(query);
}
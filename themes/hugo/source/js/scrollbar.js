if (!is_touch_device()) {
    // Alternative lib: SimpleBar
    // Array.prototype.forEach.call(document.querySelectorAll('.highlight table'), el => new SimpleBar);

    // OverlayScrollBars
    document.addEventListener("DOMContentLoaded", function () {
        //The first argument are the elements to which the plugin shall be initialized
        //The second argument has to be at least a empty object or a object with your desired options
        OverlayScrollbars(document.querySelectorAll('.highlight table'), {
            className: "os-theme-minimal-dark",
            scrollbars: {
                autoHide: "leave",
                autoHideDelay: 10
            }
        });
    });
}

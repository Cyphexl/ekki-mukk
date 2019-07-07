/**
* Deferred CSS Helper
* @description Defer non-critical CSS resources to improve FCP (First Contentful Paint) render time
*/

hexo.extend.helper.register('css_deferred', function (path) {
    return `<link rel="preload" href="/` + path + `" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="/` + path + `"></noscript>`
});

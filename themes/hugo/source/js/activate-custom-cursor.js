const $cursor = document.querySelector('.cursor');
const $bigBall = document.querySelector('.cursor__ball--big');
const $smallBall = document.querySelector('.cursor__ball--small');
const $hoverables = document.querySelectorAll('a');

// Listeners
document.body.addEventListener('mousemove', onMouseMove);
for (let i = 0; i < $hoverables.length; i++) {
    $hoverables[i].addEventListener('mouseenter', onMouseHover);
    $hoverables[i].addEventListener('mouseleave', onMouseHoverOut);
}

function onMouseMove(e) {
    gsap.to($bigBall, .4, {
        x: e.clientX - 34,
        y: e.clientY - 32
    });

    gsap.to($smallBall, 0, {
        x: e.clientX - 4,
        y: e.clientY - 9
    });

    $cursor.style.opacity = 1
}


// Hover an element
function onMouseHover() {
    gsap.to($bigBall, .3, {
        scale: 1,
        opacity: 1
    });

}
function onMouseHoverOut() {
    gsap.to($bigBall, .3, {
        scale: 0,
        opacity: 0
    });

}
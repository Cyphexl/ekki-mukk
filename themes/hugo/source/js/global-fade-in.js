// If window.onload still has not been fired after 1.5 seconds, force the page to fade in

setTimeout(() => {
    document.body.style.opacity = '1'
}, 1500)
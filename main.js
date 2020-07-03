(function() {
    var canvas = document.getElementById('board');
    var ctx = canvas.getContext('2d');

    window.addEventListener('resize', resizeCanvas, false);
    function resizeCanvas() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        draw(); 
    }
    resizeCanvas();

    function draw() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}());

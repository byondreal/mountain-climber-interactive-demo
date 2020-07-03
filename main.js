document.body.style.display = 'block';

document.ontouchmove = function(e){
    e.preventDefault();
};

var state = {
    points: [],
    isDrawing: false,
    isDragging: { leftFigure: false, rightFigure: false },
};

(function() {
    var canvas = document.getElementById('board');

    window.addEventListener('resize', resizeCanvas, false);
    function resizeCanvas() {
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
    }
    resizeCanvas();

    canvas.ontouchstart = canvas.onmousedown = function(e) {
        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;
        state.points.push({ x, y, isDrag: false });
        state.isDrawing = true;
    };

    canvas.ontouchmove = canvas.onmousemove = function(e) {
        if (!state.isDrawing) return;
        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;
        state.points.push({ x, y, isDrag: true });
    };

    canvas.ontouchend = canvas.ontouchcancel =
    canvas.onmouseup = canvas.onmouseleave = function(e) {
        state.isDrawing = false;
    };

}());

(function() {
    var leftFigure = document.getElementById('leftFigure');
    var rightFigure = document.getElementById('rightFigure');
    var debugEl = document.getElementById('debug');

    // debugEl.style.display = 'none';

    window.addEventListener('resize', reposition, false);
    function reposition() {
        leftFigure.style.left = (window.innerWidth / 3 - 50) + 'px';
        rightFigure.style.left = (window.innerWidth * 2 / 3 - 50) + 'px';
        leftFigure.style.top = (window.innerHeight - 120) + 'px';
        rightFigure.style.top = (window.innerHeight - 120) + 'px';
    }
    reposition();

    leftFigure.onmousedown = leftFigure.ontouchstart =
    rightFigure.onmousedown = rightFigure.ontouchstart =
        function(e) {
            this.origStyleLeft = +this.style.left.slice(0, -2);
            this.origStyleTop = +this.style.top.slice(0, -2);
            state.isDragging[this.id] = true;
            if (!e.touches) {
                this.touchIndex = -1;
                this.origX = e.pageX;
                this.origY = e.pageY;
                return;
            }
            var touchTargets = [].slice.call(e.touches).map(function(touch) {
                return touch.target;
            });
            this.touchIndex = touchTargets.indexOf(this);
            updateDebugText(e);
            if (this.touchIndex == -1) {
                alert('wut');
                return;
            }
            var touch = e.touches[this.touchIndex];
            this.origX = touch.pageX;
            this.origY = touch.pageY;
        };

    leftFigure.onmousemove = leftFigure.ontouchmove =
    rightFigure.onmousemove = rightFigure.ontouchmove =
        function(e) {
            if (!state.isDragging[this.id]) return;
            if (!e.touches) {
                var x = e.pageX - this.origX;
                var y = e.pageY - this.origY;
                this.style.left = (this.origStyleLeft + x).toFixed(2) + 'px';
                this.style.top = (this.origStyleTop + y).toFixed(2) + 'px';
                return;
            }
            updateDebugText(e);
            if (this.touchIndex == -1) return;
            var touch = e.touches[this.touchIndex];
            if (!touch) return;
            var x = touch.pageX - this.origX;
            var y = touch.pageY - this.origY;
            this.style.left = (this.origStyleLeft + x).toFixed(2) + 'px';
            this.style.top = (this.origStyleTop + y).toFixed(2) + 'px';
        };

    leftFigure.onmouseup = leftFigure.onmouseleave = leftFigure.ontouchend = leftFigure.ontouchcancel =
    rightFigure.onmouseup = rightFigure.ontouchend = rightFigure.ontouchend = rightFigure.ontouchcancel =
        function(e) {
            if (e.touches && e.touches.length) return;
            debugEl.innerText = '';
            state.isDragging[this.id] = false;
        };

    function updateDebugText(e) {
        debugEl.innerText = [
            [].slice.call(e.touches).map(function(touch) {
                return `(${touch.pageX.toFixed(2)}, ${touch.pageY.toFixed(2)})`;
            }).join(' | '),
            `(${leftFigure.style.left}, ${leftFigure.style.top}) | (${rightFigure.style.left}, ${rightFigure.style.top})`,
            `(${leftFigure.origStyleLeft}, ${leftFigure.origStyleTop}) | (${rightFigure.origStyleLeft}, ${rightFigure.origStyleTop})`,
        ].join('\n');
    }
}());

(function() {
    var canvas = document.getElementById('board');
    var ctx = canvas.getContext('2d');

    function draw() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.strokeStyle = "#ef6b3a";
        ctx.lineJoin = "round";
        ctx.lineWidth = 5;

        for (var i = 0; i < state.points.length; i++) {
            var p = state.points[i];
            ctx.beginPath();
            if (p.isDrag && i) {
                ctx.moveTo(state.points[i - 1].x, state.points[i - 1].y);
            } else {
                ctx.moveTo(p.x - 1, p.y);
            }
            ctx.lineTo(p.x, p.y);
            ctx.closePath();
            ctx.stroke();
        }

        window.requestAnimationFrame(draw);
    }
    draw();
}());

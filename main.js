document.body.style.display = 'block';

var state = {
    points: [],
    isDrawing: false,
    isDragging: { leftFigure: false, rightFigure: false },
    touchIndices: { leftFigure: -1, rightFigure: -1 },
    positions: { leftFigure: { x: 0, y: 0 }, rightFigure: { x: 0, y: 0 } },
    dragStartPositions: { leftFigure: { x: 0, y: 0 }, rightFigure: { x: 0, y: 0 } },
    dragStartStyles: { leftFigure: { left: 0, top: 0 }, rightFigure: { left: 0, top: 0 } },
    didClearAtleastOnce: false,
};

// canvas drawing
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
        if (navigator.userAgent.match(/Android/i)) {
            e.preventDefault();
        }
    };

    canvas.ontouchmove = canvas.onmousemove = function(e) {
        if (!state.isDrawing) return;
        var x = e.pageX - this.offsetLeft;
        var y = e.pageY - this.offsetTop;
        state.points.push({ x, y, isDrag: true });
    };

    canvas.ontouchend = canvas.onmouseup = function(e) {
        state.isDrawing = false;
    };

    canvas.ontouchcancel = canvas.onmouseleave = function(e) {
        // state.isDrawing = false;
    };

}());

// stick figure dragging
(function() {
    var leftFigure = document.getElementById('leftFigure');
    var rightFigure = document.getElementById('rightFigure');
    var debugEl = document.getElementById('debug');

    // debugEl.style.display = 'none';

    window.addEventListener('resize', reposition, false);
    function reposition() {
        state.positions.leftFigure.x = window.innerWidth / 3 - 50;
        state.positions.leftFigure.y = window.innerHeight - 120;
        state.positions.rightFigure.x = window.innerWidth * 2 / 3 - 50;
        state.positions.rightFigure.y = window.innerHeight - 120;
    }
    reposition();

    leftFigure.onmousedown = leftFigure.ontouchstart =
    rightFigure.onmousedown = rightFigure.ontouchstart =
        function(e) {
            state.dragStartStyles[this.id].left = +this.style.left.slice(0, -2);
            state.dragStartStyles[this.id].top = +this.style.top.slice(0, -2);
            state.isDragging[this.id] = true;

            if (!e.touches) {
                state.touchIndices[this.id] = -1;
                state.dragStartPositions[this.id].x = e.pageX;
                state.dragStartPositions[this.id].y = e.pageY;
                return;
            }
            var touchTargets = [].slice.call(e.touches)
                .map(function(touch) { return touch && touch.target; });
            state.touchIndices[this.id] = touchTargets.indexOf(this);
            if (state.touchIndices[this.id] == -1) {
                console.error('Unexpected error: Don\'t know what element you touched.');
                return;
            }
            var touch = e.touches[state.touchIndices[this.id]];
            state.dragStartPositions[this.id].x = touch.pageX;
            state.dragStartPositions[this.id].y = touch.pageY;
        };

    leftFigure.onmousemove = leftFigure.ontouchmove =
    rightFigure.onmousemove = rightFigure.ontouchmove =
        function(e) {
            if (!state.isDragging[this.id]) return;
            if (!e.touches) {
                var x = e.pageX - state.dragStartPositions[this.id].x;
                var y = e.pageY - state.dragStartPositions[this.id].y;
                state.positions[this.id].x = state.dragStartStyles[this.id].left + x;
                state.positions[this.id].y = state.dragStartStyles[this.id].top + y;
                return;
            }
            if (state.touchIndices[this.id] == -1) return;
            var touch = e.touches[state.touchIndices[this.id]];
            if (!touch) return;
            var x = touch.pageX - state.dragStartPositions[this.id].x;
            var y = touch.pageY - state.dragStartPositions[this.id].y;
            state.positions[this.id].x = state.dragStartStyles[this.id].left + x;
            state.positions[this.id].y = state.dragStartStyles[this.id].top + y;
        };

    leftFigure.onmouseup = leftFigure.onmouseleave = leftFigure.ontouchend = leftFigure.ontouchcancel =
    rightFigure.onmouseup = rightFigure.ontouchend = rightFigure.ontouchend = rightFigure.ontouchcancel =
        function(e) {
            state.isDragging[this.id] = false;
            if (!e.touches || !e.touches.length) {
                debugEl.innerText = '';
            }
        };

}());

// update ui
(function() {
    var canvas = document.getElementById('board');
    var ctx = canvas.getContext('2d');

    var leftFigure = document.getElementById('leftFigure');
    var rightFigure = document.getElementById('rightFigure');
    var debugEl = document.getElementById('debug');

    function drawDrawing() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.setLineDash([]);
        ctx.strokeStyle = '#ef6b3a';
        ctx.lineJoin = 'round';
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
    }

    function drawConnectingLine() {
        ctx.beginPath();
        ctx.setLineDash([5, 10]);
        var from = state.positions.leftFigure;
        var to = state.positions.rightFigure;
        ctx.moveTo(from.x + 50, from.y + 55);
        ctx.lineTo(to.x + 50, to.y + 55);
        ctx.stroke();
    }

    function positionFigures() {
        if (typeof state.positions.leftFigure.x != 'number') alert(state.positions.leftFigure.x);
        leftFigure.style.left = state.positions.leftFigure.x.toFixed(2) + 'px';
        leftFigure.style.top = state.positions.leftFigure.y.toFixed(2) + 'px';
        rightFigure.style.left = state.positions.rightFigure.x.toFixed(2) + 'px';
        rightFigure.style.top = state.positions.rightFigure.y.toFixed(2) + 'px';
    }

    function updateDebugText() {
        debugEl.innerText = JSON.stringify(state, function(key, value) {
            if (key == 'points') return 'count: ' + value.length;
            return value;
        }, 2);
    }

    function draw() {
        drawDrawing();
        drawConnectingLine();
        positionFigures();
        // updateDebugText();
        window.requestAnimationFrame(draw);
    }
    draw();

}());

// load with mountain shape
(function() {
    var mountainPoints = [[205,530],[260,378],[335,333],[410,416],[497,316],[538,167],[613,228],[675,420],[795,327],[845,227],[915,264],[961,530],[1048,530],[115,530]]
    var refWidth = 1152;
    var refHeight = 641;
    var aspectRatio = refHeight / refWidth;
    var winWidth = window.innerWidth;
    var winHeight = window.innerHeight;
    var normalized = mountainPoints.map(function(xy, i) {
        return [xy[0] / refWidth - 0.5, xy[1] / refHeight - 0.5];
    });
    var converted = normalized.map(function(normalizedPoint, i) {
        var x = normalizedPoint[0] * winWidth + winWidth / 2;
        var y = normalizedPoint[1] * winWidth * aspectRatio + winHeight / 2;
        return [x, y];
    });
    state.points = converted.map(function(xy, i) {
        return { x: xy[0], y: xy[1], isDrag: i == 0 ? false : true };
    });
}());

// undo feature, remove the last thing, except mountain
(function() {
    var undoButton = document.getElementById('undoButton');
    undoButton.ontouchstart = undoButton.onmousedown = function(e) {
        var lastLineStartIndex = state.points.length;
        var minLastLineStartIndex = state.didClearAtleastOnce ? 0 : 1;
        for (var i = state.points.length - 1; i >= minLastLineStartIndex; i--) {
            if (!state.points[i].isDrag) {
                lastLineStartIndex = i;
                break;
            }
        }
        state.points = state.points.slice(0, lastLineStartIndex);
    };
}());

// trash button to clear the entire drawing, including mountain
(function() {
    var trashButton = document.getElementById('trashButton');
    trashButton.ontouchstart = trashButton.onmousedown = function(e) {
        state.points = [];
        state.didClearAtleastOnce = true;
    };
}());

document.body.style.display = 'block';

var state = {
    points: [],
    isDrawingEnabled: false,
    isDrawing: false,
    isDragging: { leftFigure: false, rightFigure: false },
    touchIndices: { leftFigure: -1, rightFigure: -1 },
    positions: { leftFigure: { x: 0, y: 0 }, rightFigure: { x: 0, y: 0 } },
    dragStartPositions: { leftFigure: { x: 0, y: 0 }, rightFigure: { x: 0, y: 0 } },
    dragStartStyles: { leftFigure: { left: 0, top: 0 }, rightFigure: { left: 0, top: 0 } },
    didClearAtleastOnce: false,
};
var winToRefRatio = window.innerWidth / 1152;
var mountainBaseNormalizedYOffset = -0.03;
var mountainSizeScaleRatio = 1.15;
var figureSizeScaleRatio = 0.8;

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
        if (!state.isDrawingEnabled) return;
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
        state.isDrawing = false;
    };

}());

// stick figure dragging
(function() {
    var leftFigure = document.getElementById('leftFigure');
    var rightFigure = document.getElementById('rightFigure');
    var debugEl = document.getElementById('debug');

    leftFigure.style.width = '' + 100 * figureSizeScaleRatio * winToRefRatio + 'px';
    rightFigure.style.width = '' + 100 * figureSizeScaleRatio * winToRefRatio + 'px';

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
    var drawButton = document.getElementById('drawButton');
    var debugEl = document.getElementById('debug');

    // debugEl.style.display = 'none';

    function drawDrawing() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.setLineDash([]);
        ctx.strokeStyle = '#6c3f18';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5 * winToRefRatio;
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
        ctx.strokeStyle = '#76d2e9';
        ctx.lineWidth = 4 * winToRefRatio;
        ctx.setLineDash([5, 10]);
        var from = state.positions.leftFigure;
        var to = state.positions.rightFigure;
        ctx.moveTo(from.x + (50 + 10) * figureSizeScaleRatio * winToRefRatio, from.y + 50 * figureSizeScaleRatio * winToRefRatio);
        ctx.lineTo(to.x + (50 - 5) * figureSizeScaleRatio * winToRefRatio, to.y + 50 * figureSizeScaleRatio * winToRefRatio);
        ctx.stroke();
    }

    function positionFigures() {
        if (typeof state.positions.leftFigure.x != 'number') alert(state.positions.leftFigure.x);
        leftFigure.style.left = state.positions.leftFigure.x.toFixed(2) + 'px';
        leftFigure.style.top = state.positions.leftFigure.y.toFixed(2) + 'px';
        rightFigure.style.left = state.positions.rightFigure.x.toFixed(2) + 'px';
        rightFigure.style.top = state.positions.rightFigure.y.toFixed(2) + 'px';
    }

    function updateDrawIcon() {
        if (state.isDrawingEnabled) {
            drawButton.classList.remove('off');
        } else {
            drawButton.classList.add('off');
        }
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
        updateDrawIcon();
        // updateDebugText();
        window.requestAnimationFrame(draw);
    }
    draw();

}());

// load with mountain shape
(function() {
    var winWidth = window.innerWidth;
    var winHeight = window.innerHeight;

    var mountainPoints = [[205,530],[260,378],[335,333],[410,416],[497,316],[538,167],[613,228],[675,420],[795,327],[845,227],[915,264],[961,530],[1048,530],[115,530]]
    var refWidth = 1152;
    var refHeight = 641;
    var aspectRatio = refHeight / refWidth;

    function convertPoint(xy) {
        var normalizedX = xy[0] / refWidth - 0.5;
        var normalizedY = xy[1] / refHeight - 0.5 + mountainBaseNormalizedYOffset;
        var x = normalizedX * mountainSizeScaleRatio * winWidth + winWidth / 2;
        var y = normalizedY * mountainSizeScaleRatio * winWidth * aspectRatio + winHeight / 2;
        return {x, y};
    }

    state.points = mountainPoints.map(convertPoint).map(function(p, i) {
        return { x: p.x, y: p.y, isDrag: i == 0 ? false : true };
    });

    var figurePositions = {left:[135,458],right:[947,458]};
    var leftFigurePos = convertPoint(figurePositions.left);
    state.positions.leftFigure = leftFigurePos;
    var rightFigurePos = convertPoint(figurePositions.right);
    state.positions.rightFigure = rightFigurePos;
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
    if (!trashButton) return;
    trashButton.ontouchstart = trashButton.onmousedown = function(e) {
        state.points = [];
        state.didClearAtleastOnce = true;
    };
}());

// draw button to change drawing mode
(function() {
    var drawButton = document.getElementById('drawButton');
    drawButton.ontouchstart = drawButton.onmousedown = function(e) {
        state.isDrawingEnabled = !state.isDrawingEnabled;
    };
}());

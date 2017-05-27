var options = {
    "strokeStyle": "#000",
    "lineCap": "round",
    "lineJoin": "round",
    "imageType": "image/png"
};

$.signature = function(callback) {
    // 校验浏览器是否支持 canvas
    try {
        document.createElement("canvas").getContext("2d");
    } catch (e) {
        alert("浏览器不支持HTML5 Canvas,请更换浏览器.");
        return;
    }

    // 画笔样式
    function setContextStyle() {
        context.strokeStyle = options.strokeStyle;
        context.lineJoin = options.lineJoin;
        context.lineWidth = options.lineWidth;
    }

    var canvasWidth = 0,
        canvasHeight = 0;
    // 画板大小
    function setCanvasSize() {
        var w = canvasBody.width() - 10;
        var h = canvasDiv.height() - 50;

        if (w > h * 2) {
            w = h * 2;
        } else {
            h = w / 2;
        }
        // 大小变化超过15时才改变
        if (Math.abs(canvasWidth - w) > 15 || Math.abs(canvasHeight - h) > 15) {
            canvas.width = canvasWidth = w;
            canvas.height = canvasHeight = h;

            options.lineWidth = canvasWidth > 800 ? 8 : 4;
        }
    }

    //显示签名板
    function showSignature() {
        $("#scrollTop").val($(window).scrollTop());
        $("body").css("overflow", "hidden");
        canvasDiv.show();
        setCanvasSize();
    }

    //异常签名板
    function hideSignature() {
        canvasDiv.hide(100);
        $("body").css("overflow", "");
        if ($(window).scrollTop() != $("#signatureScrollTop").val())
            $(window).scrollTop($("#signatureScrollTop").val());
        canvasDiv.remove();
    }

    //转换图片
    function resizeImage(source) {
        var img = new Image();
        img.src = source;

        var resizeCanvas = $('<canvas id="resizeCanvas"></canvas>');
        resizeCanvas = resizeCanvas[0];
        // 使IE中的Canvas对象支持getContext等方法
        if (typeof G_vmlCanvasManager != 'undefined') {
            canvas = G_vmlCanvasManager.initElement(canvas);
        }
        var ctx = resizeCanvas.getContext('2d');
        resizeCanvas.width = 80;
        resizeCanvas.height = 45;
        ctx.drawImage(img, 0, 0, 80, 45);

        var data = resizeCanvas.toDataURL(options.imageType);
        return data;
    }

    // 构建画板
    var canvasDiv, canvasBody, canvas;

    canvasBody = $('<div class="signature-body"></div>');
    var footer = $('<div class="signature-footer"></div>');
    footer.append('<input type="button" class="signature-btn-cancel"  value="Cancel" />');
    footer.append('<input type="button" class="signature-btn-ok"  value="OK" />');
    footer.append('<input type="button" class="signature-btn-clear"  value="Clear" />');
    footer.append('<input type="hidden" id="signatureScrollTop" />');

    canvasDiv = $('<div class="signature-div signature-fullscreen"></div>');
    canvasDiv.append(canvasBody);
    canvasDiv.append(footer);
    $("body").append(canvasDiv);

    canvas = $('<canvas class="signature-canvas"></canvas>');
    canvasBody.append(canvas);
    canvas = canvas[0];

    // 使IE中的Canvas对象支持getContext等方法
    if (typeof G_vmlCanvasManager != 'undefined') {
        canvas = G_vmlCanvasManager.initElement(canvas);
    }
    var context = canvas.getContext("2d");
    $(window).resize(function() {
        setCanvasSize();
    });

    //按钮事件
    $(".signature-btn-clear").click(function() {
        canvas.width = canvas.width;
    });
    $(".signature-btn-ok").one("click", function() {
        var url = canvas.toDataURL("image/png");

        var data = resizeImage(url);

        hideSignature();
        callback && callback(url);
    });
    $(".signature-btn-cancel").one("click", function() {
        hideSignature();
        callback && callback(null);
    });

    showSignature();
    var draw = canvasDraw(canvasBody[0], options, canvas, context);

}

// 绘制事件监听
function pointerDraw(target, startDraw, extendDraw, endDraw, canvas) {

    // x,y 值
    function getPageX(e) {
        if (e.pageX) return e.pageX - $(canvas).offset().left;
        else if (e.clientX)
            return e.clientX + (document.documentElement.scrollLeft ?
                document.documentElement.scrollLeft : document.body.scrollLeft) - $(canvas).offset().left;
        else return null;
    }

    function getPageY(e) {
        if (e.pageY) return e.pageY - $(canvas).offset().top;
        else if (e.clientY)
            return e.clientY + (document.documentElement.scrollTop ?
                document.documentElement.scrollTop : document.body.scrollTop) - $(canvas).offset().top;
        else return null;
    }
    //  an object to keep track of the last x/y positions of the mouse/pointer/touch point
    //  used to reject redundant moves and as a flag to determine if we're in the "down" state
    var lastXYById = {};


    //  Opera doesn't have Object.keys so we use this wrapper
    function NumberOfKeys(theObject) {
        if (Object.keys)
            return Object.keys(theObject).length;

        var n = 0;
        for (var key in theObject)
            ++n;

        return n;
    }

    //  IE10's implementation in the Windows Developer Preview requires doing all of this
    //  Not all of these methods remain in the Windows Consumer Preview, hence the tests for method existence.
    function PreventDefaultManipulationAndMouseEvent(evtObj) {
        if (evtObj.preventDefault)
            evtObj.preventDefault();

        if (evtObj.preventManipulation)
            evtObj.preventManipulation();

        if (evtObj.preventMouseEvent)
            evtObj.preventMouseEvent();
    }

    //  common event handler for the mouse/pointer/touch models and their down/start, move, up/end, and cancel events
    function DoEvent(theEvtObj) {

        //  optimize rejecting mouse moves when mouse is up
        if (theEvtObj.type == "mousemove" && NumberOfKeys(lastXYById) == 0)
            return;

        PreventDefaultManipulationAndMouseEvent(theEvtObj);

        var pointerList = theEvtObj.changedTouches ? theEvtObj.changedTouches : [theEvtObj];
        for (var i = 0; i < pointerList.length; ++i) {
            var pointerObj = pointerList[i];
            var pointerId = (typeof pointerObj.identifier != 'undefined') ? pointerObj.identifier : (typeof pointerObj.pointerId != 'undefined') ? pointerObj.pointerId : 1;

            var pageX = getPageX(pointerObj);
            var pageY = getPageY(pointerObj);

            if (theEvtObj.type.match(/(start|down)$/i)) {
                //  clause for processing MSPointerDown, touchstart, and mousedown

                //  protect against failing to get an up or end on this pointerId
                if (lastXYById[pointerId]) {
                    if (endDraw)
                        endDraw(target, pointerId);
                    delete lastXYById[pointerId];
                }

                if (startDraw)
                    startDraw(target, pointerId, pageX, pageY); // targetRelativeX(pageX), targetRelativeY(pageY));

                //  init last page positions for this pointer
                lastXYById[pointerId] = { x: pageX, y: pageY };

                //  in the Microsoft pointer model, set the capture for this pointer
                //  in the mouse model, set the capture or add a document-level event handlers if this is our first down point
                //  nothing is required for the iOS touch model because capture is implied on touchstart
                if (target.msSetPointerCapture)
                    target.msSetPointerCapture(pointerId);
                else if (theEvtObj.type == "mousedown" && NumberOfKeys(lastXYById) == 1) {
                    if (useSetReleaseCapture)
                        target.setCapture(true);
                    else {
                        document.addEventListener("mousemove", DoEvent, false);
                        document.addEventListener("mouseup", DoEvent, false);
                    }
                }
            } else if (theEvtObj.type.match(/move$/i)) {
                //  clause handles mousemove, MSPointerMove, and touchmove

                if (lastXYById[pointerId] && !(lastXYById[pointerId].x == pageX && lastXYById[pointerId].y == pageY)) {
                    //  only extend if the pointer is down and it's not the same as the last point

                    if (extendDraw)
                        extendDraw(target, pointerId, pageX, pageY); //, targetRelativeX(pageX), targetRelativeY(pageY));

                    //  update last page positions for this pointer
                    lastXYById[pointerId].x = pageX;
                    lastXYById[pointerId].y = pageY;
                }
            } else if (lastXYById[pointerId] && theEvtObj.type.match(/(up|end|cancel)$/i)) {
                //  clause handles up/end/cancel

                if (endDraw)
                    endDraw(target, pointerId);

                //  delete last page positions for this pointer
                delete lastXYById[pointerId];

                //  in the Microsoft pointer model, release the capture for this pointer
                //  in the mouse model, release the capture or remove document-level event handlers if there are no down points
                //  nothing is required for the iOS touch model because capture is implied on touchstart
                if (target.msReleasePointerCapture)
                    target.msReleasePointerCapture(pointerId);
                else if (theEvtObj.type == "mouseup" && NumberOfKeys(lastXYById) == 0) {
                    if (useSetReleaseCapture)
                        target.releaseCapture();
                    else {
                        document.removeEventListener("mousemove", DoEvent, false);
                        document.removeEventListener("mouseup", DoEvent, false);
                    }
                }
            }
        }
    }

    var useSetReleaseCapture = false;

    if (window.navigator.msPointerEnabled) {
        //  Microsoft pointer model
        target.addEventListener("MSPointerDown", DoEvent, false);
        target.addEventListener("MSPointerMove", DoEvent, false);
        target.addEventListener("MSPointerUp", DoEvent, false);
        target.addEventListener("MSPointerCancel", DoEvent, false);

        //  css way to prevent panning in our target area
        if (typeof target.style.msContentZooming != 'undefined')
            target.style.msContentZooming = "none";

        //  new in Windows Consumer Preview: css way to prevent all built-in touch actions on our target
        //  without this, you cannot touch draw on the element because IE will intercept the touch events
        if (typeof target.style.msTouchAction != 'undefined')
            target.style.msTouchAction = "none";
    } else if (target.addEventListener) {
        //  iOS touch model
        target.addEventListener("touchstart", DoEvent, false);
        target.addEventListener("touchmove", DoEvent, false);
        target.addEventListener("touchend", DoEvent, false);
        target.addEventListener("touchcancel", DoEvent, false);

        //  mouse model
        target.addEventListener("mousedown", DoEvent, false);

        //  mouse model with capture
        //  rejecting gecko because, unlike ie, firefox does not send events to target when the mouse is outside target
        if (target.setCapture && !window.navigator.userAgent.match(/\bGecko\b/)) {
            useSetReleaseCapture = true;

            target.addEventListener("mousemove", DoEvent, false);
            target.addEventListener("mouseup", DoEvent, false);
        }
    } else if (target.attachEvent && target.setCapture) {
        //  legacy IE mode - mouse with capture
        useSetReleaseCapture = true;
        target.attachEvent("onmousedown", function() {
            DoEvent(window.event);
            window.event.returnValue = false;
            return false;
        });
        target.attachEvent("onmousemove", function() {
            DoEvent(window.event);
            window.event.returnValue = false;
            return false;
        });
        target.attachEvent("onmouseup", function() {
            DoEvent(window.event);
            window.event.returnValue = false;
            return false;
        });

    } else {
        // Unexpected combination of supported features
    }

}

// 画板绘制
function canvasDraw(target, options, fgcanvas, fgctx) {

    var foregroundPolylines = {};
    pointerDraw(target, BeginPolyline, ExtendPolylineTo, EndPolyline, fgcanvas);

    function BeginPolyline(wrapper, id, x, y) {
        if (foregroundPolylines[id.toString()])
            EndPolyline(wrapper, id);

        foregroundPolylines[id.toString()] = { points: [{ x: x, y: y }] };
        RequestRedraw();
    }

    function ExtendPolylineTo(wrapper, id, x, y) {
        if (foregroundPolylines[id.toString()])
            foregroundPolylines[id.toString()].points.push({ x: x, y: y });
        RequestRedraw();
    }

    function EndPolyline(wrapper, id) {
        var polyline = foregroundPolylines[id.toString()];
        if (polyline) {
            var p0 = polyline.points[0];
            var pLast = polyline.points[polyline.points.length - 1];
            polyline.ended = true;
            RequestRedraw();
        }
    }


    var redrawPending = false;

    function RequestRedraw() {

        function RedrawForeground() {
            redrawPending = false;

            for (var id in foregroundPolylines) {
                DrawPolyline(fgctx, foregroundPolylines[id]);

                if (foregroundPolylines[id].ended) {
                    delete foregroundPolylines[id.toString()];
                }
            }
        }

        if (!redrawPending) {
            redrawPending = true;

            if (window.msRequestAnimationFrame)
                window.msRequestAnimationFrame(RedrawForeground);
            else if (window.webkitRequestAnimationFrame)
                window.webkitRequestAnimationFrame(RedrawForeground);
            else
                window.setTimeout(RedrawForeground, Math.floor(1000 / 60));
        }
    }

    function DrawPolyline(ctx, polyline) {
        if (polyline.points.length == 1) {
            ctx.beginPath();
            ctx.arc(polyline.points[0].x, polyline.points[0].y, options.lineWidth / 2, 0, Math.PI, true);
            ctx.arc(polyline.points[0].x, polyline.points[0].y, options.lineWidth / 2, Math.PI, Math.PI * 2, true);
            ctx.fillStyle = options.strokeStyle;
            ctx.globalAlpha = 1;
            ctx.fill();
        } else if (polyline.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(polyline.points[0].x, polyline.points[0].y);

            for (var i = 1; i < polyline.points.length; ++i)
                ctx.lineTo(polyline.points[i].x, polyline.points[i].y);

            ctx.lineCap = options.lineCap;
            ctx.lineJoin = options.lineJoin;
            ctx.lineWidth = options.lineWidth;
            ctx.strokeStyle = options.strokeStyle;
            ctx.globalAlpha = 1;
            ctx.stroke();

        }
    }
}
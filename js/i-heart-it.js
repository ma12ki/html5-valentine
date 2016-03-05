var iHeartIt = (function(Heart){
    'use strict';

    var Canvas;
    
    var canvasWidth,
        canvasHeight;

    var ctx; // canvas context

    var explosionRadius,
        explosionForce;

    var drawInterval;

    var objects = [];

    var debug = false;
    var setupCalled = false;

    var iHeartIt = {
        setup: setup,
        start: start,
        stop: stop
    };

    return iHeartIt;

    ///////////////

    // gets the canvas context, saves its dimensions, creates objects on the canvas and attaches event handler for the click event
    function setup(config) {
        Canvas = document.getElementById(config.canvasId);

        ctx = Canvas.getContext('2d');

        canvasWidth = Canvas.width;
        canvasHeight = Canvas.height;

        explosionRadius = config.explosionRadius;
        explosionForce = config.explosionForce;

        debug = config.debug || false;

        // create objects
        createObjects(config.numberOfObjects);

        // attach vent handler to the Canvas object
        Canvas.onclick = explosionHandler;

        setupCalled = true;
    }

    // creates and stores the objects that will be drawn on the canvas
    function createObjects(numberOfObjects) {
        objects = [];

        var heartConfig = {
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            ctx: ctx,
            debug: debug
        };

        Heart.setup(heartConfig);

        for (var i = 0; i < numberOfObjects; i++) {
            objects.push(new Heart());
        }
    }

    // starts the animation
    function start() {
        if (!setupCalled) {
            throw new Error('iHeartIt.setup function must be called first!');
        }

        if (!drawInterval) {
            drawInterval = setInterval(animate, 40); // 25fps
        }
    }

    // stops the animation
    function stop() {
        if (drawInterval) {
            clearInterval(drawInterval);
            drawInterval = false;
        }
    }

    // calls the move() and draw() functions on all created objects
    function animate() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        for (var i = 0; i < objects.length; i++) {
            objects[i].move();
            objects[i].draw();
        }

        if (debug) {
            drawDebugInfo();
        }
    }

    function drawDebugInfo() {
        ctx.font = "20px sans-serif";
        ctx.fillStyle = "cyan";
        ctx.fillText("DEBUG", 10, 30);
        ctx.fillText("Canvas width: " + canvasWidth + "px, canvas height: " + canvasHeight + "px.", 10, 60);
        ctx.fillText("Number of objects: " + objects.length + ".", 10, 90);
    }

    // handles click event (explosion)
    function explosionHandler(e) {
        if (drawInterval) {
            var x, y, canvasRect = Canvas.getBoundingClientRect();

            x = e.clientX - canvasRect.left;
            y = e.clientY - canvasRect.top;

            var explosion = {
                x: x,
                y: y,
                force: explosionForce,
                radius: explosionRadius
            };

            for (var i = 0; i < objects.length; i++) {
                objects[i].handleExplosion(explosion);
            }
        }
    }

})(window.Heart);
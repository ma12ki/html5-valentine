var Heart = (function(){
    'use strict';
    
    var canvasWidth,
        canvasHeight;

    var ctx; // canvas context

    var setupCalled = false;

    //////////////////

    // constructor
    function Heart() {
        if (!setupCalled) {
            throw new Error('Heart.setup function must be called before any Heart object is created!');
        }

        if (!(this instanceof Heart)) {
            return new Heart();
        }

        this.side = randomSideLength();
        this.drag = 1 + (this.side/300); // make bigger (heavier) hearts slow down faster
        this.coordinates = randomCoordinates(this.side);
        this.movementVector = randomMovementVector();
        this.rgba = randomRgbaString();
        // additional variables for handling explosions
        this.explosionVector = {dx:0, dy:0};
        this.isAffectedByExplosion = false;
    }

    function randomSideLength() {
        return Math.floor((Math.random()*25 + 10));
    }

    // returns 'R,G,B,A' (e.g. '255,120,80,0.5')
    function randomRgbaString() {
        var alpha = (Math.floor(Math.random()*60+25)) / 100;
        var green = Math.floor(Math.random()*225) + 30;
        // this formula gives us nice, pleasing shades of red(-ish)
        var rgba = '255,' + green + ',' + (Math.floor(Math.random()*(225-green)+green) + 30) + ',' + alpha;

        return rgba;
    }

    function randomCoordinates(sideLength) {
        var coordinates = {
            x: Math.floor((Math.random()*(canvasWidth - 3*sideLength) + sideLength)),
            y: Math.floor((Math.random()*(canvasHeight - 3*sideLength) + sideLength))
        };

        return coordinates;
    }

    function randomMovementVector() {
        var vector = {
            dx: Math.ceil((Math.random()*3+1))/10,
            dy: Math.ceil((Math.random()*3+1))/10
        };
        
        // randomize directions
        if (Math.random() < 0.5) vector.dx = -vector.dx;
        if (Math.random() < 0.3) vector.dy = -vector.dy;

        return vector;
    }

    // should be called before any object is created
    // stores the canvas dimensions and the canvas context object in private variables
    Heart.setup = function(config) {
        canvasWidth = config.canvasWidth;
        canvasHeight = config.canvasHeight;

        ctx = config.ctx;

        setupCalled = true;
    };

    // draws the heart on the canvas
    Heart.prototype.draw = function() {
        ctx.save(); 
        // translate context to center of heart
        ctx.translate(this.coordinates.x + this.side * 0.9, this.coordinates.y + this.side * 1.5);

        ctx.rotate(-Math.PI/4);
        ctx.fillStyle = 'rgba('+this.rgba+')';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -this.side); // line from the base of the heart to the start of the left bump
        ctx.arc(this.side/2, -this.side, this.side/2, Math.PI, 2*Math.PI); // left bump
        ctx.arc(this.side, -this.side/2, this.side/2, 1.5*Math.PI, Math.PI/2); // right bump
        ctx.closePath(); // closePath completes the heart nicely
        ctx.fill(); // fill the shape with color

        ctx.restore();
    };

    // moves the heart within the canvas
    Heart.prototype.move = function() {
        // add movement and explosion vectors to heart coordinates
        this.coordinates.x += (this.movementVector.dx + this.explosionVector.dx);
        this.coordinates.y += (this.movementVector.dy + this.explosionVector.dy);

        keepHeartWithinCanvasBounds(this);

        if(this.isAffectedByExplosion) {
            diminishExplosionEffects(this);
        }
    };

    function keepHeartWithinCanvasBounds(HeartObj) {
        var outOfBoundsSmallerX = HeartObj.coordinates.x < 0,
            outOfBoundsBiggerX = HeartObj.coordinates.x+HeartObj.side*1.7 > canvasWidth,
            outOfBoundsSmallerY = HeartObj.coordinates.y < 0,
            outOfBoundsBiggerY = HeartObj.coordinates.y+HeartObj.side*1.5 > canvasHeight;

        // check if heart is still completely within the canvas (x axis)
        // change movement direction and adjust position if necessary
        if(outOfBoundsSmallerX || outOfBoundsBiggerX) {
            HeartObj.movementVector.dx = -HeartObj.movementVector.dx;
            HeartObj.explosionVector.dx = -HeartObj.explosionVector.dx;

            if (outOfBoundsSmallerX) {
                HeartObj.coordinates.x = 0;
            } else {
                HeartObj.coordinates.x = canvasWidth - HeartObj.side * 1.7;
            }
        }
        
        // check if heart is still completely within the canvas (y axis)
        // change movement direction and adjust position if necessary
        if(outOfBoundsSmallerY || outOfBoundsBiggerY) {
            HeartObj.movementVector.dy = -HeartObj.movementVector.dy;
            HeartObj.explosionVector.dy = -HeartObj.explosionVector.dy;

            if (outOfBoundsSmallerY) {
                HeartObj.coordinates.y = 0;
            } else {
                HeartObj.coordinates.y = canvasHeight - HeartObj.side * 1.5;
            }
        }
    }

    function diminishExplosionEffects(HeartObj) {
        // reduce the force of the explosion by drag coefficient
        HeartObj.explosionVector.dx /= HeartObj.drag;
        HeartObj.explosionVector.dy /= HeartObj.drag;
        
        if (isVectorNearZero(HeartObj.explosionVector)) {
            HeartObj.explosionVector.dx = HeartObj.explosionVector.dy = 0;
            HeartObj.isAffectedByExplosion = false;
        }
    }

    function isVectorNearZero(vector) {
        return Math.abs(vector.dx) < 0.1 && Math.abs(vector.dy) < 0.1;
    }

    Heart.prototype.handleExplosion = function(explosionData) {
        var explosionDataRelativeToHeart = getExplosionDataRelativeToHeart(this, explosionData);

        if (isHeartWithinExplosionRadius(explosionData, explosionDataRelativeToHeart)) {
            setHeartExplosionVector(this, explosionData, explosionDataRelativeToHeart);
        }
    };

    function getExplosionDataRelativeToHeart(HeartObj, explosionData) {
        var distanceX = explosionData.x - HeartObj.coordinates.x,
            distanceY = explosionData.y - HeartObj.coordinates.y,
            distance = Math.ceil(Math.sqrt(distanceX*distanceX + distanceY*distanceY));

        return {
            distanceX: distanceX,
            distanceY: distanceY,
            distance: distance
        };
    }

    function isHeartWithinExplosionRadius(explosionData, explosionDataRelativeToHeart) {
        return explosionDataRelativeToHeart.distance < explosionData.radius;
    }

    function setHeartExplosionVector(HeartObj, explosionData, explosionDataRelativeToHeart) {
        var distanceX = explosionDataRelativeToHeart.distanceX,
            distanceY = explosionDataRelativeToHeart.distanceY,
            distance = explosionDataRelativeToHeart.distance,
            force = explosionData.force,
            radius = explosionData.radius;
        // -force (so it points away from explosion) 
        // * diff_ over distance (so the force vector points exactly from the center of the explosion through the center of the heart coordinates)
        // * 1 - distance over explosion radius (so the force diminishes with distance)
        HeartObj.explosionVector.dx += -force * (distanceX/distance) * (1-distance/radius);
        HeartObj.explosionVector.dy += -force * (distanceY/distance) * (1-distance/radius);
        HeartObj.isAffectedByExplosion = true;
    }

    return Heart;

})();
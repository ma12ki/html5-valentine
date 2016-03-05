var Heart = (function(){
    'use strict';
    
    var canvasWidth,
        canvasHeight;
    var ctx; // canvas context
    var debug = false;
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
        this.diagonal = this.side * Math.sqrt(2);
        this.drag = 1 + (this.side/300); // make bigger (heavier) hearts slow down faster
        this.coordinates = randomCoordinates(this.side);
        this.movementVector = randomMovementVector();
        this.hitbox = {};
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

        debug = config.debug || false;

        setupCalled = true;
    };

    // draws the heart on the canvas
    Heart.prototype.draw = function() {
        ctx.save();
        // translate context to the base of the heart
        ctx.translate(this.coordinates.x, this.coordinates.y + this.diagonal/2);

        ctx.rotate(-Math.PI/4);

        ctx.fillStyle = 'rgba('+this.rgba+')';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -this.side); // line from the base of the heart to the start of the left bump
        // arc(x, y, radius, startAngle, endAngle, anticlockwise)
        ctx.arc(this.side/2, -this.side, this.side/2, Math.PI, 2*Math.PI); // left bump
        ctx.arc(this.side, -this.side/2, this.side/2, 1.5*Math.PI, Math.PI/2); // right bump
        ctx.closePath(); // closePath completes the heart nicely
        ctx.fill(); // fill the shape with color

        ctx.restore();

        if (debug) {
            this.drawDebugInfo();
        }
    };

    Heart.prototype.drawDebugInfo = function() {
        this.drawOrigin();
        this.drawHitbox();
    };

    Heart.prototype.drawOrigin = function() {
        ctx.save();

        ctx.translate(this.coordinates.x, this.coordinates.y);

        ctx.fillStyle = "blue";
        ctx.moveTo(0, 0);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    };

    Heart.prototype.drawHitbox = function() {
        ctx.save();

        ctx.translate(0, 0);

        ctx.fillStyle = "black";
        ctx.strokeRect(this.hitbox.left, this.hitbox.top, this.diagonal, this.diagonal);

        ctx.restore();
    };

    // moves the heart within the canvas
    Heart.prototype.move = function() {
        // add movement and explosion vectors to heart coordinates
        this.coordinates.x += (this.movementVector.dx + this.explosionVector.dx);
        this.coordinates.y += (this.movementVector.dy + this.explosionVector.dy);

        this.updateHitbox();
        this.keepWithinCanvasBounds();

        if(this.isAffectedByExplosion) {
            this.diminishExplosionEffects();
        }
    };

    Heart.prototype.updateHitbox = function() {
        this.hitbox.left   = this.coordinates.x - this.diagonal/2;
        this.hitbox.top    = this.coordinates.y - this.diagonal/2;
        this.hitbox.right  = this.coordinates.x + this.diagonal/2;
        this.hitbox.bottom = this.coordinates.y + this.diagonal/2;
    };

    Heart.prototype.keepWithinCanvasBounds = function() {
        var outOfBoundsLeft = this.hitbox.left < 0,
            outOfBoundsTop = this.hitbox.top < 0,
            outOfBoundsRight = this.hitbox.right > canvasWidth,
            outOfBoundsBottom = this.hitbox.bottom > canvasHeight;

        // check if heart is still completely within the canvas (x axis)
        // change movement direction and adjust position if necessary
        if(outOfBoundsLeft || outOfBoundsRight) {
            this.movementVector.dx = -this.movementVector.dx;
            this.explosionVector.dx = -this.explosionVector.dx;

            if (outOfBoundsLeft) {
                this.coordinates.x = this.diagonal/2;
            } else {
                this.coordinates.x = canvasWidth - this.diagonal/2;
            }
        }
        
        // check if heart is still completely within the canvas (y axis)
        // change movement direction and adjust position if necessary
        if(outOfBoundsTop || outOfBoundsBottom) {
            this.movementVector.dy = -this.movementVector.dy;
            this.explosionVector.dy = -this.explosionVector.dy;

            if (outOfBoundsTop) {
                this.coordinates.y = this.diagonal/2;
            } else {
                this.coordinates.y = canvasHeight - this.diagonal/2;
            }
        }
    };

    Heart.prototype.diminishExplosionEffects = function() {
        // reduce the force of the explosion by drag coefficient
        this.explosionVector.dx /= this.drag;
        this.explosionVector.dy /= this.drag;
        
        if (isVectorNearZero(this.explosionVector)) {
            this.explosionVector.dx = this.explosionVector.dy = 0;
            this.isAffectedByExplosion = false;
        }
    };

    function isVectorNearZero(vector) {
        return Math.abs(vector.dx) < 0.1 && Math.abs(vector.dy) < 0.1;
    }

    Heart.prototype.handleExplosion = function(explosionData) {
        var explosionDataRelativeToHeart = getExplosionDataRelativeToHeart(this, explosionData);

        if (isHeartWithinExplosionRadius(explosionData, explosionDataRelativeToHeart)) {
            this.setExplosionVector(explosionData, explosionDataRelativeToHeart);
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

    Heart.prototype.setExplosionVector = function(explosionData, explosionDataRelativeToHeart) {
        var distanceX = explosionDataRelativeToHeart.distanceX,
            distanceY = explosionDataRelativeToHeart.distanceY,
            distance = explosionDataRelativeToHeart.distance,
            force = explosionData.force,
            radius = explosionData.radius;
        // -force (so it points away from explosion) 
        // * diff_ over distance (so the force vector points exactly from the center of the explosion through the center of the heart coordinates)
        // * 1 - distance over explosion radius (so the force diminishes with distance)
        this.explosionVector.dx += -force * (distanceX/distance) * (1-distance/radius);
        this.explosionVector.dy += -force * (distanceY/distance) * (1-distance/radius);
        this.isAffectedByExplosion = true;
    };

    return Heart;

})();
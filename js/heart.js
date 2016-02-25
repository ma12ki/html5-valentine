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

        // generate random side length 
        this.side = Math.floor((Math.random()*25 + 10));
        
        // generate random starting coordinates
        this.x = Math.floor((Math.random()*(canvasWidth - 3*this.side) + this.side));
        this.y = Math.floor((Math.random()*(canvasHeight - 3*this.side) + this.side));
        
        // generate random speed
        this.dx = Math.ceil((Math.random()*3+1))/10;
        this.dy = Math.ceil((Math.random()*3+1))/10;
        
        // randomize movement direction
        var dir = Math.random();
        if (dir <= 0.5) this.dx = -this.dx;
        dir = Math.random();
        if (dir <= 0.3) this.dy = -this.dy;
        
        // generate random transparency
        this.alpha = (Math.floor(Math.random()*60+25)) / 100;
        
        var green = Math.floor(Math.random()*225) + 30;
        
        // this formula gives us nice, pleasing shades of red
        this.color = '255,' + green + ',' + (Math.floor(Math.random()*(225-green)+green) + 30);

        // make bigger (heavier) circles slow down faster
        this.drag = 1 + (this.side/300);
        
        // additional variables for handling explosions
        this.bdx = 0;
        this.bdy = 0;
        this.boom = false;
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
        ctx.translate(this.x + this.side * 0.9, this.y + this.side * 1.5);

        ctx.rotate(-Math.PI/4);

        ctx.fillStyle = 'rgba('+this.color+','+this.alpha+')';

        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        // line from the base of the heart to the start of the left bump
        ctx.lineTo(0, -this.side);
        // left bump
        ctx.arc(this.side/2, -this.side, this.side/2, Math.PI, 2*Math.PI);
        // right bump
        ctx.arc(this.side, -this.side/2, this.side/2, 1.5*Math.PI, Math.PI/2);
        // closePath completes the heart nicely
        ctx.closePath();
        // fill the shape with color
        ctx.fill();

        ctx.restore();
    };

    // moves the heart within the canvas
    Heart.prototype.move = function() {   
        this.x += (this.dx + this.bdx);
        this.y += (this.dy + this.bdy);
    
        if(this.x+this.side*1.7 > canvasWidth || this.x < 0) {
            this.dx = -this.dx;
            this.bdx = -this.bdx;
            // safeguard in case explosion sends object too far
            (this.x < 0) ? this.x = 0 : this.x = canvasWidth - this.side * 1.7;
        }
        
        if(this.y+this.side*1.5 > canvasHeight || this.y < 0) {
            this.dy = -this.dy;
            this.bdy = -this.bdy;
            // safeguard in case explosion sends object too far
            (this.y < 0) ? this.y = 0 : this.y = canvasHeight - this.side * 1.5;
        }
        
        // explosion handling
        if(this.boom) {
            // reduce the force of the explosion by drag coefficient
            this.bdx /= this.drag;
            this.bdy /= this.drag;
            // if the force is small enough, set it to 0
            if (Math.abs(this.bdx) < 0.1 && Math.abs(this.bdy) < 0.1) {
                this.bdx = this.bdy = 0;
                this.boom = false;
            }
        }
    };

    // handles explosion
    Heart.prototype.handleExplosion = function(explosion) {
        var diffX = explosion.x - this.x,
            diffY = explosion.y - this.y;

        // calculate the distance
        var distance = Math.ceil(Math.sqrt(diffX*diffX + diffY*diffY));

        if (distance < explosion.radius) {
            // set object's additional speed caused by explosion
            // -force (so it points away from explosion) 
            // * diff_ over distance (so the force vector points exactly from the center of the explosion through the center of the heart)
            // * 1 - distance over explosion radius (so the force diminishes with distance)
            this.bdx += -explosion.force * (diffX/distance) * (1-distance/explosion.radius);
            this.bdy += -explosion.force * (diffY/distance) * (1-distance/explosion.radius);
            this.boom = true;
        }
    };

    return Heart;

})();
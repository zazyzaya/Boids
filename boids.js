function normalize(vec) {
    let magnitude = Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1])
    return [vec[0] / magnitude, vec[1] / magnitude]
}

function orthonormal(vec) {
    let o2 = -vec[0]/vec[1]; 
    return normalize(1., o2); 
}

function generateColor() {
    let hexSet = "0123456789ABCDEF";
    let finalHexString = "#";
    for (let i = 0; i < 6; i++) {
      finalHexString += hexSet[Math.ceil(Math.random() * 15)];
    }
    return finalHexString;
  }


const BOID_HEIGHT = 10; 
const BOID_WIDTH = 3; 

class BoidFactory{
    constructor(n, h, w, ctx) {
        this.w = w; 
        this.h = h; 
        
        this.boids = []
        for (let i=0; i<n; i++) {
            this.boids.push(new Boid(h,w)); 
        }
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.w, this.h); 
        this.boids.map( (boid) => boid.draw(ctx) );
    }

    update() {
        this.boids.map( (boid) => boid.update() );
    }
}

class Boid {
    constructor(h, w) {
        this.world_h = h; this.world_w = w; 
        
        this.s = [Math.random() * w, Math.random() * h]; 
        this.v = normalize([Math.random(), Math.random()]); 
        this.a = [0,0];  

        // Display settings
        this.len = 5; 
        this.width = 2; 
        this.color = generateColor(); 
    }

    draw(ctx, shape) {
        let norm_v = normalize(this.v)
        let theta = Math.atan(norm_v[1]/norm_v[0]); 

        // Move canvas to position
        ctx.save(); 
        ctx.translate(this.s[0], this.s[1])
        ctx.rotate(theta); 

        // Draw
        ctx.beginPath();
        ctx.moveTo(BOID_WIDTH, 0); 
        ctx.lineTo(0, BOID_HEIGHT); 
        ctx.lineTo(BOID_WIDTH*2, BOID_HEIGHT); 
        ctx.closePath();
        ctx.fillStyle = this.color; 
        ctx.fill(); 

        // Resore to original projection
        ctx.restore();
    }

    update() {
        this.s = [this.s[0] + this.v[0], this.s[1]+this.v[1]]
    }
}
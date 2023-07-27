function magnitude(vec) {
    return Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1]); 
}

function normalize(vec) {
    let mag = magnitude(vec); 
    return [vec[0] / mag, vec[1] / mag]
}

function orthonormal(vec) {
    let o2 = -vec[0]/vec[1]; 
    return normalize(1., o2); 
}

let MOUSE_X = 0;
let MOUSE_Y = 0; 
let handleMousemove = (event) => {
  MOUSE_X = event.x; 
  MOUSE_Y = event.y; 
}
document.addEventListener('mousemove', handleMousemove);

let chase = true 
let handleMouseClick = (event) => {
    chase = !chase; 
}
document.addEventListener('mousedown', handleMouseClick); 

// Stolen from stackoverflow
const getTopN = (arr, n = 10) => {
    const _arr = arr.map((value, index) => [value, index]);
    // by using b[0] - a[0] instead of a[0] - b[0] we can get the array in non-increasing order
    _arr.sort((a, b) => b[0] - a[0]) 
    return _arr.slice(0, n).map(([_, index]) => index);
  }
  

function scalar_wrapped_distance(x1, x2, w) {
    if (Math.abs(x1-x2) > w/2) {
        if (x1 < x2) 
            return (x2-w) - x1; 
        else
            return (x2+w) -x1;
    }
    return x2-x1; 
}

function wrapped_distance(vec1, vec2, w, h) {
    let dx = Math.min(
        Math.abs(vec1[0]-vec2[0]), 
        Math.abs((vec1[0]+w) - vec2[0]),
        Math.abs(vec1[0] - (vec2[0]+w)),
    )

    let dy = Math.min(
        Math.abs(vec1[1]-vec2[1]), 
        Math.abs((vec1[1]+h) - vec2[1]),
        Math.abs(vec1[1] - (vec2[1]+h)),
    )

    return Math.sqrt(
        Math.pow(dx, 2) + 
        Math.pow(dy, 2)
    ) 
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

class BoidManager{
    constructor(
            n, w,h, 
            max_speed=3,
            r1_force=0.002, 
            r2_dist=5, r2_force=1, 
            r3_force=0.1,
            mouse_force=1,
            fov=100
        ) {

        this.w = w; 
        this.h = h; 
        this.max_speed = max_speed;
        this.fov = fov; 

        this.boids = []
        for (let i=0; i<n; i++) {
            this.boids.push(new Boid(h,w,max_speed)); 
        }
        this.n = n 

        this.r1_force = r1_force; 
        this.r2_dist = r2_dist; 
        this.r2_force = r2_force; 
        this.r3_force = r3_force; 
        this.mouse_force = mouse_force;

        this.obj_size = 25;
        this.ob_params = [Math.random(), Math.random()]; 
        
        let ts = Date.now() / 2000; 
        this.obstacle = [
            this.w / 2, this.h / 2
        ]
        this.obstacle_v = [0,0]
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.w, this.h); 

        this.boids.map( (boid) => boid.draw(ctx) );
        
        // Draw mouse 
        if (chase) {
            ctx.beginPath();
            ctx.arc(MOUSE_X, MOUSE_Y, this.obj_size, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }


    update() {
        this.boids.map( (boid) => boid.update() );

        this.rules(); 
        if (chase) {this.avoid();} 
    }

    rules() {
        // First need to see which birds are within range of which other birds
        // and update their neighbor info 
        // Can do in Omega(n(n+1) / 2)
        let adj = []
        for (let i=0; i<this.boids.length; i++) {
            // Reset neighbor info
            this.boids[i].cs = [0,0]
            this.boids[i].cv = [0,0]
            this.boids[i].n = 0; 
        }

        for (let i=0; i<this.boids.length; i++) {
            let b1 = this.boids[i]; 

            for (let j=i+1; j<this.boids.length; j++) {
                let b2 = this.boids[j]; 
                let dist = wrapped_distance(b2.s, b1.s, this.w, this.h)
                if (Math.abs(dist) <= this.fov ) {
                    // Accumulate info for r1/r3
                    b1.cs[0] += b2.s[0]; b1.cs[1] += b2.s[1]; 
                    b1.vs[0] += b2.v[0]; b1.vs[1] += b2.v[1]; 
                    b1.n += 1;

                    b2.cs[0] += b1.s[0]; b2.cs[1] += b1.s[1]; 
                    b2.vs[0] += b1.v[0]; b2.vs[1] += b1.v[1]; 
                    b2.n += 1;

                    // Repell if too close (Rule 2)
                    if (Math.abs(dist) < this.r2_dist) {
                        let dx = scalar_wrapped_distance(b2.s[0], b1.s[0], this.w);
                        let dy = scalar_wrapped_distance(b2.s[1], b1.s[1], this.h);

                        dx *= (this.r2_dist / dist) * this.r2_force; 
                        dy *= (this.r2_dist / dist) * this.r2_force;; 

                        b1.a[0] += dx; b2.a[0] += -dx; 
                        b1.a[1] += dy; b2.a[1] += -dy; 
                    } // */ 
                }
            }
             // Apply rules 1 and 3 now that we have global data
            // R1: 
            b1.a[0] += scalar_wrapped_distance(b1.s[0], b1.cs[0] / b1.n, this.w) * this.r1_force; 
            b1.a[1] += scalar_wrapped_distance(b1.s[1], b1.cs[1] / b1.n, this.h) * this.r1_force; 

            // R3: 
            b1.a[0] += -(b1.v[0] - b1.cv[0] / b1.n) * this.r3_force; 
            b1.a[1] += -(b1.v[1] - b1.cv[0] / b1.n) * this.r3_force;
        }
        //this.r2(); 
    }

    r2() {
        // Repell birds that are too close 
        for (let i=0; i<this.boids.length; i++) {
            let main_b = this.boids[i]; 

            for (let j=0; j<this.boids.length; j++) {
                let other_b = this.boids[j];

                if (main_b != other_b) {
                    let dist = wrapped_distance(main_b.s, other_b.s, this.w, this.h); 

                    if (Math.abs(dist) < this.r2_dist) {
                        main_b.a[0] += scalar_wrapped_distance(other_b.s[0], main_b.s[0], this.w) * (this.r2_dist/dist) * this.r2_force;
                        main_b.a[1] += scalar_wrapped_distance(other_b.s[1], main_b.s[1], this.h) * (this.r2_dist/dist) * this.r2_force;  
                    }
                }
            }
        }
    }

    avoid() {
        // Repell birds from mouse
        for (let i=0; i<this.boids.length; i++) {
            let main_b = this.boids[i];     
            let dist = wrapped_distance(main_b.s, [MOUSE_X, MOUSE_Y], this.w, this.h); 

            main_b.a[0] += scalar_wrapped_distance(MOUSE_X, main_b.s[0], this.w) * (1/dist) * this.mouse_force;
            main_b.a[1] += scalar_wrapped_distance(MOUSE_Y, main_b.s[1], this.h) * (1/dist) * this.mouse_force; 
        }
    }
}

class Boid {
    constructor(h, w, max_speed) {
        this.h = h; this.w = w; 
        this.max_speed = max_speed; 
        
        // Physics
        this.s = [Math.random() * w, Math.random() * h]; 
        this.v = [
            2*(max_speed*Math.random())-max_speed, 
            2*(max_speed*Math.random())-max_speed
        ]; 

        // Neighbor info
        this.cs = [0,0];
        this.vs = [0,0]; 
        this.n = 0; 

        this.a = [0,0];  

        // Display settings
        this.len = 5; 
        this.width = 2; 
        this.color = generateColor(); 
    }

    draw(ctx) {
        //let norm_v = normalize(this.v)
        let theta = Math.atan(-this.v[0]/this.v[1]); 

        if (this.v[1] > 0) {
            theta = Math.PI + theta; 
        }

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
        // Cap speed at max
        this.v[0] += this.a[0];
        this.v[1] += this.a[1]; 

        let mag = magnitude(this.v); 
        if (mag > this.max_speed) {
            this.v = normalize(this.v); 
            this.v[0] *= this.max_speed; 
            this.v[1] *= this.max_speed;
        }

        let x = this.s[0] + this.v[0];
        let y = this.s[1] + this.v[1]; 
        
        // Loop around if need be 
        if (x > this.w) { x = x - this.w; }
        if (y > this.h) { y = y - this.h; }

        if (x < 0) { x=this.w + x; }
        if (y < 0) { y=this.h + y; }
        
        this.s = [x,y]
    }
}
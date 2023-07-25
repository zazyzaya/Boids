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
            max_speed=5,
            r1_force=0.0005, 
            r2_dist=10, r2_force=1, 
            r3_force=0.1,
            mouse_force=0.1
        ) {

        this.w = w; 
        this.h = h; 
        this.max_speed = max_speed;

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
        ctx.beginPath();
        ctx.arc(MOUSE_X, MOUSE_Y, this.obj_size, 0, 2 * Math.PI);
        ctx.stroke();
    }


    update() {
        this.boids.map( (boid) => boid.update() );

        this.r1(); 
        this.r2();
        this.r3(); 
        this.avoid_mouse(); 
    }

    r1() { 
        // Boids fly to center of mass of all (neighboring) boids
        // For now, let all boids be neighbors of all other boids
        let cx = 0; let cy = 0;
        this.boids.map( (other) => { 
            cx += other.s[0]; 
            cy += other.s[1];  
        }); 

        for (let i=0; i<this.boids.length; i++) {
            let boid = this.boids[i]

            // Want to exclude boid's own position from center
            let b_cx = scalar_wrapped_distance(boid.s[0], cx, this.w); 
            let b_cy = scalar_wrapped_distance(boid.s[1], cy, this.h);
            
            // Add direction to velocity
            boid.a[0] = scalar_wrapped_distance(boid.s[0], b_cx / (this.n-1), this.w) * this.r1_force; 
            boid.a[1] = scalar_wrapped_distance(boid.s[1], b_cy/ (this.n-1), this.h) * this.r1_force; 
        }
        
    }

    r2() {
        // Repell birds that are too close 
        for (let i=0; i<this.boids.length; i++) {
            let main_b = this.boids[i]; 

            for (let j=0; j<this.boids.length; j++) {
                let other_b = this.boids[j];

                if (main_b != other_b) {
                    let dist = wrapped_distance(main_b.s, other_b.s, this.w, this.h); 

                    if (dist < this.r2_dist) {
                        main_b.a[0] += scalar_wrapped_distance(other_b.s[0], main_b.s[0], this.w) * (1/dist) * this.r2_force;
                        main_b.a[1] += scalar_wrapped_distance(other_b.s[1], main_b.s[1], this.h) * (1/dist) * this.r2_force;  
                    }
                }
            }
        }
    }

    r3() {
        let cvx = 0; let cvy = 0; 
        this.boids.map( (other) => { 
            cvx += other.v[0]; 
            cvy += other.v[1] 
        }); 

        for (let i=0; i<this.boids.length; i++) {
            let boid = this.boids[i]    

            // Want to exclude boid's own position from center
            let b_cx = (cvx - boid.v[0]) / (this.n - 1); 
            let b_cy = (cvy - boid.v[1]) / (this.n - 1);
            
            // Add direction to velocity
            boid.a[0] += -(boid.v[0] - b_cx) * this.r1_force; 
            boid.a[1] += -(boid.v[1] - b_cy) * this.r1_force; 
        }
    }

    avoid_mouse() {
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
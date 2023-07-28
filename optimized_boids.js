const BOID_HEIGHT = 10; 
const BOID_WIDTH = 2; 

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

let predator = false;
let handleMouseClick = (event) => {
    predator = !predator; 
}
document.addEventListener('mousedown', handleMouseClick); 

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

function tuple_to_color(c) {
    s = '#'; 
    for (let i=0; i<3; i++) {
        s += c[i].toString(16); 
    }
    return s; 
}

class BoidManager{
    constructor(
            n, w,h, 
            max_speed=2,
            r1_force=0.02, 
            r2_dist=2, r2_force=1, 
            r3_force=0.1,
            mouse_force=100,
            food_force=10,
            fov=500
        ) {

        this.w = w; 
        this.h = h; 
        this.max_speed = max_speed;
        this.fov = fov; 
        this.first = true; 

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
        this.food_force = food_force; 

        this.obj_size = 25;
        this.obstacle = [this.w / 2, this.h / 2];
        this.obstacle_v = [0,0];

        this.foods = []; 
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.w, this.h); 

        this.boids.map( (boid) => boid.draw(ctx) );
        
        // Draw mouse 
        if (predator) {
            ctx.save(); 

            ctx.beginPath();
            ctx.arc(MOUSE_X, MOUSE_Y, this.obj_size, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.restore(); 
        }

        this.foods.map( (food) => {
            ctx.save()

            ctx.beginPath();
            ctx.arc(food.s[0], food.s[1], food.size, 0, 2 * Math.PI);
            ctx.fillStyle = tuple_to_color(food.color); 
            ctx.fill();

            ctx.restore()
        }); 
    }

    

    update() {
        this.boids.map( (boid) => boid.update() );

        this.rules(); 

        if (predator) {this.avoid(); } 
        this.foods.map( (f) => { f.update(); } )
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
            if (b1.n) {
                // R1: 
                b1.a[0] += scalar_wrapped_distance(b1.s[0], b1.cs[0] / b1.n, this.w) * this.r1_force; 
                b1.a[1] += scalar_wrapped_distance(b1.s[1], b1.cs[1] / b1.n, this.h) * this.r1_force; 

                // R3: 
                b1.a[0] += -(b1.v[0] - b1.cv[0] / b1.n) * this.r3_force; 
                b1.a[1] += -(b1.v[1] - b1.cv[0] / b1.n) * this.r3_force;
            }

            // Find closest food (if it exists) and run to it
            let min_dist = Math.max(this.w, this.h); 
            let min_idx = -1; 
            for (let j=0; j<this.foods.length; j++) {
                let dist = Math.abs(wrapped_distance(b1.s, this.foods[j].s, this.w, this.h)); 
                if (dist < min_dist) {
                    min_dist = dist; 
                    min_idx = j; 
                }
            }

            if (min_dist < this.fov*2) {
                let f = this.boids[min_idx]; 
                b1.a[0] -= scalar_wrapped_distance(f.s[0], b1.s[0], this.w) * ((this.fov * this.food_force)/min_dist); 
                b1.a[1] -= scalar_wrapped_distance(f.s[1], b1.s[1], this.h) * ((this.fov * this.food_force)/min_dist);
            }


        }
    }

    avoid() {
        // Repell birds from mouse
        for (let i=0; i<this.boids.length; i++) {
            let main_b = this.boids[i];     
            let dist = Math.abs(wrapped_distance(main_b.s, [MOUSE_X, MOUSE_Y], this.w, this.h)); 

            if (dist < this.fov*2) {
                main_b.a[0] += scalar_wrapped_distance(MOUSE_X, main_b.s[0], this.w) * ((this.fov * this.mouse_force)/dist); 
                main_b.a[1] += scalar_wrapped_distance(MOUSE_Y, main_b.s[1], this.h) * ((this.fov * this.mouse_force)/dist);
            }
        }
    }
}

function rand_neg() {
    if (Math.random() > 0.5) {
        return 1; 
    } return -1; 
}
class Food {
    constructor(size, h_speed, v_speed, w, h) {
        this.size = size; 
        this.t0 = Math.random() * 2 * Math.PI;
        this.t = 0;  
        this.h_speed = h_speed * rand_neg(); 
        this.v_speed = v_speed * rand_neg(); 

        this.w = w; this.h = h; 

        this.s = [this.w, this.h / 2];
        this.color = [
            parseInt(256 * Math.random()), 
            parseInt(256 * Math.random()),
            parseInt(256 * Math.random())
        ]
        this.color_direction = [rand_neg(), rand_neg(), rand_neg()]
    }

    update() {
        // Food color warps around 
        for (let i=0; i<3; i++){
            this.color[i] += this.color_direction[i];
            if (this.color[i] <=50 || this.color[i] >= 255) {
                this.color_direction[i] *= -1
            }
        } // */

        // Food moves in sin wave 
        this.s[0] += this.h_speed; 

        let h = Math.sin(this.t + this.t0);
        this.s[1] = this.t*this.v_speed + ((1+h) * this.h) / 2
        this.t += 0.01

        while (this.s[0] > this.w) { this.s[0] -= this.w}
        while (this.s[1] > this.h) { this.s[1] -= this.h}
        while (this.s[0] < 0) { this.s[0] += this.w }
        while (this.s[1] < 0) { this.s[1] += this.h }
    }
}

class Boid {
    constructor(h, w, max_speed) {
        this.h = h; this.w = w; 
        this.max_speed = max_speed; 
        
        // Physics
        this.s = [Math.random() * w, Math.random() * h]; 
        this.v = [
            2*(max_speed*2*Math.random()), 
            2*(max_speed*2*Math.random())-max_speed
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
        while (x > this.w) { x = x - this.w; }
        while (y > this.h) { y = y - this.h; }

        while (x < 0) { x=this.w + x; }
        while (y < 0) { y=this.h + y; }
        
        this.s = [x,y]
    }
}
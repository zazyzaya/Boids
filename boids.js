function normalize(vec) {
    let magnitude = Math.sqrt(vec[0]*vec[0] - vec[1]*vec[1])
    return [vec[0] / magnitude, vec[1] / magnitude]
}

function generateColor() {
    let hexSet = "0123456789"; // No hex to keep things pastel
    let finalHexString = "#";
    for (let i = 0; i < 6; i++) {
      finalHexString += hexSet[Math.ceil(Math.random() * 15)];
    }
    return finalHexString;
  }

class BoidFactory{
    constructor(n, h, w) {
        this.boids = []
        for (let i=0; i<n; i++) {
            this.boids.push(new Boid(h,w)); 
        }
    }

    draw(ctx) {

    }
}

class Boid {
    constructor(h, w) {
        this.world_h = h; this.world_w = w; 
        
        this.s = [Math.random() * w, Math.random() * h]; 
        this.v = normalize(Math.random(), Math.random()); 
        this.a = [0,0];  

        this.color = generateColor(); 
    }
}
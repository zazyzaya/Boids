const W = document.getElementById('canvas-container').offsetWidth;
const H = document.getElementById('canvas-container').offsetHeight; 
const n = 100; 

function set_size(canvas_id) {
    document.getElementById(canvas_id).setAttribute('width', W);
    document.getElementById(canvas_id).setAttribute('height', H);
}

function init() {
    set_size("bird-canvas"); 

    const boids = new BoidFactory(100, W, H); 
    const ctx = document.getElementById("bird-canvas").getContext("2d");
    boids.draw(ctx); 
}

init(); 
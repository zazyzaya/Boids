const W = document.getElementById('canvas-container').offsetWidth;
const H = document.getElementById('canvas-container').offsetHeight; 
const n = 100; 

function set_size(canvas_id) {
    document.getElementById(canvas_id).setAttribute('width', W);
    document.getElementById(canvas_id).setAttribute('height', H);
}

function animate(ctx, boids) {
    boids.update();
    boids.draw(ctx); 
    window.requestAnimationFrame( () => animate(ctx, boids) ); 
}

function init() {
    set_size("bird-canvas"); 

    const ctx = document.getElementById("bird-canvas").getContext("2d");
    const boids = new BoidFactory(100, W, H, ctx); 
    boids.draw(ctx); 
    animate(ctx, boids);  
}

init(); 
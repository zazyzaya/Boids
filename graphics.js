const W = window.innerWidth;
const H = window.innerHeight;
const n = 1000; 

function animate(ctx, boids) {
    boids.update();
    boids.draw(ctx); 
    window.requestAnimationFrame( () => animate(ctx, boids) ); 
}

function init() {
    const ctx = document.getElementById("bird-canvas").getContext("2d");
    ctx.canvas.width = W; 
    ctx.canvas.height = H; 

    const boids = new BoidManager(n, W, H); 
    boids.draw(ctx); 
    animate(ctx, boids);  
}

init(); 
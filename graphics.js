const W = window.innerWidth - 100;
const H = window.innerHeight - 100 ;
const n = 100; 

function animate(ctx, boids) {
    boids.update();
    boids.draw(ctx); 
    window.requestAnimationFrame( () => animate(ctx, boids) ); 
}

function init() {
    const ctx = document.getElementById("bird-canvas").getContext("2d");
    ctx.canvas.width = W; 
    ctx.canvas.height = H; 

    const boids = new BoidManager(400, W, H); 
    boids.draw(ctx); 
    animate(ctx, boids);  
}

init(); 
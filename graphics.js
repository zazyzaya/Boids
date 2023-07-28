const W = window.innerWidth;
const H = window.innerHeight;
const n = 1000; 

function animate(ctx, boids) {
    boids.update();
    boids.draw(ctx); 
    window.requestAnimationFrame( () => animate(ctx, boids) ); 
}

function init(boids) {
    const ctx = document.getElementById("bird-canvas").getContext("2d");
    ctx.canvas.width = W; 
    ctx.canvas.height = H; 

    boids.draw(ctx); 
    animate(ctx, boids);  
}

const boids = new BoidManager(n, W, H); 
init(boids); 

// Oh the spaghetti!!
let handleKeyboard = (event) => {
    if (event.keyCode == 27) { // Escape
        boids.foods = []; 
    }
    else if (event.keyCode == 8) { // Backspace
        boids.foods.pop(); 
    }
    else if (event.keyCode == 32) { // Space
        boids.foods.push(new Food(10, 3, 5, boids.w, boids.h));
    }
}
document.addEventListener('keydown', handleKeyboard); 
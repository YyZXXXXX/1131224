let player1, player2;
let p1Sprites = {};
let p2Sprites = {};
let bgImage;


const GROUND_Y = window.innerHeight / 1.25;
const SCALE_FACTOR = 2.5;
const GRAVITY = 0.8;
const JUMP_FORCE = -20;
const MOVE_SPEED = 8;
const MAX_HP = 100;
const SCREEN_PADDING = 50;
const PROJECTILE_SPEED = 15;
const PROJECTILE_DAMAGE = 10;

class Fighter {
  constructor(x, y, sprites, config, isPlayer1) {
    this.x = x;
    this.y = y;
    this.sprites = sprites;
    this.config = config;
    this.currentAnimation = 'run';  // 改為 run
    this.frame = 0;
    this.frameCounter = 0;
    this.direction = 1;
    this.scale = SCALE_FACTOR;
    this.velocityY = 0;
    this.isJumping = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.hp = MAX_HP;
    this.isPlayer1 = isPlayer1;
    this.isAttacking = false;
    this.attackBox = {
      width: 60,
      height: 50
    };
    this.projectiles = [];
  }

  update() {
    if (this.isJumping) {
      this.velocityY += GRAVITY;
      this.y += this.velocityY;

      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.velocityY = 0;
        this.isJumping = false;
        if (!this.moveLeft && !this.moveRight) {
          this.currentAnimation = 'run';  // 改為 run
        }
      }
    }

    if (this.moveLeft) {
      const nextX = this.x - MOVE_SPEED;
      if (nextX > SCREEN_PADDING) {
        this.x = nextX;
      }
      this.direction = 1;
      if (!this.isJumping) this.currentAnimation = 'run';  // 改為 run
    }
    if (this.moveRight) {
      const nextX = this.x + MOVE_SPEED;
      if (nextX < windowWidth - SCREEN_PADDING) {
        this.x = nextX;
      }
      this.direction = -1;
      if (!this.isJumping) this.currentAnimation = 'run';  // 改為 run
    }
    if (this.isAttacking) {
      this.checkAttackHit();
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update();
      
      const opponent = this.isPlayer1 ? player2 : player1;
      if (projectile.checkHit(opponent)) {
        opponent.takeDamage(PROJECTILE_DAMAGE);
        projectile.active = false;
        
        const knockbackForce = 10;
        opponent.x += knockbackForce * projectile.direction;
        opponent.x = Math.max(SCREEN_PADDING, Math.min(windowWidth - SCREEN_PADDING, opponent.x));
      }
      
      if (!projectile.active) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  checkAttackHit() {
    const opponent = this.isPlayer1 ? player2 : player1;
    
    const myBox = {
      x: this.x - (this.config[this.currentAnimation].width * this.scale) / 2,
      y: this.y - this.config[this.currentAnimation].height * this.scale,
      width: this.config[this.currentAnimation].width * this.scale,
      height: this.config[this.currentAnimation].height * this.scale
    };

    const opponentBox = {
      x: opponent.x - (opponent.config[opponent.currentAnimation].width * opponent.scale) / 2,
      y: opponent.y - opponent.config[opponent.currentAnimation].height * opponent.scale,
      width: opponent.config[opponent.currentAnimation].width * opponent.scale,
      height: opponent.config[opponent.currentAnimation].height * opponent.scale
    };

    if (this.checkCollision(myBox, opponentBox)) {
      if (!opponent.isHit && this.isAttacking) {
        opponent.takeDamage(10);
        opponent.isHit = true;
        
        const knockbackForce = 20;
        const direction = this.direction;
        opponent.x += knockbackForce * direction;
        opponent.x = Math.max(SCREEN_PADDING, Math.min(windowWidth - SCREEN_PADDING, opponent.x));
      }
    }
  }

  checkCollision(box1, box2) {
    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
  }
  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    
    this.isHit = true;
    setTimeout(() => {
      this.isHit = false;
    }, 200);

    if (this.hp <= 0) {
      this.handleDeath();
    }
  }

  punch() {  // 改為 punch
    if (!this.isAttacking) {
      this.currentAnimation = 'punch';  // 改為 punch
      this.isAttacking = true;
      this.frame = 0;
      
      const projectileX = this.x + (this.direction === 1 ? -50 : 50);
      const projectileY = this.y - 50;
      this.projectiles.push(new Projectile(projectileX, projectileY, -this.direction, this.isPlayer1));
      
      setTimeout(() => {
        this.isAttacking = false;
        if (!this.isJumping) {
          this.currentAnimation = 'run';  // 改為 run
        }
      }, 500);
    }
  }

  drawHP() {
    push();
    const hpBarWidth = 200;
    const hpBarHeight = 25;
    const x = this.isPlayer1 ? 50 : windowWidth - 250;
    const y = 30;
    
    fill(0, 100);
    rect(x + 3, y + 3, hpBarWidth, hpBarHeight, 5);
    
    stroke(200);
    strokeWeight(2);
    fill(40);
    rect(x, y, hpBarWidth, hpBarHeight, 5);
    
    noStroke();
    const hpWidth = (this.hp / MAX_HP) * (hpBarWidth - 4);
    const hpColor = this.hp > 70 ? color(50, 255, 50) :
                    this.hp > 30 ? color(255, 165, 0) :
                    color(255, 50, 50);
    
    const gradient = drawingContext.createLinearGradient(x, y, x, y + hpBarHeight);
    gradient.addColorStop(0, color(255, 255, 255, 100));
    gradient.addColorStop(1, color(0, 0, 0, 50));
    
    fill(hpColor);
    rect(x + 2, y + 2, hpWidth, hpBarHeight - 4, 3);
    drawingContext.fillStyle = gradient;
    rect(x + 2, y + 2, hpWidth, hpBarHeight - 4, 3);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(16);
    text(this.hp + '%', x + hpBarWidth/2, y + hpBarHeight/2);
    
    textAlign(this.isPlayer1 ? LEFT : RIGHT);
    textSize(20);
    fill(this.isPlayer1 ? color(255, 100, 100) : color(100, 100, 255));
    text(this.isPlayer1 ? 'PLAYER 1' : 'PLAYER 2', 
         this.isPlayer1 ? x : x + hpBarWidth, y - 25);
    pop();
  }
  ice() {  // 改為 ice
    if (!this.isJumping) {
      this.velocityY = JUMP_FORCE;
      this.isJumping = true;
      this.currentAnimation = 'ice';  // 改為 ice
    }
  }

  animate() {
    const currentConfig = this.config[this.currentAnimation];
    this.frameCounter++;
    
    if (this.frameCounter >= currentConfig.frameDelay) {
      this.frame = (this.frame + 1) % currentConfig.frames;
      this.frameCounter = 0;
    }

    push();
    translate(this.x, this.y);
    
    if (this.isHit) {
      tint(139, 0, 0, 200);
    }
    
    scale(this.direction * this.scale, this.scale);
    
    const frameWidth = this.sprites[this.currentAnimation].width / currentConfig.frames;
    const offsetY = currentConfig.offsetY || 0;
    
    image(
      this.sprites[this.currentAnimation],
      -currentConfig.width/2,
      -currentConfig.height + offsetY,
      currentConfig.width,
      currentConfig.height,
      frameWidth * this.frame,
      0,
      frameWidth,
      this.sprites[this.currentAnimation].height
    );
    pop();

    this.projectiles.forEach(projectile => {
      projectile.draw();
    });
  }

  handleDeath() {
    const winner = this.isPlayer1 ? "Player 2" : "Player 1";
    this.showGameOver(winner);
  }

  showGameOver(winner) {
    push();
    textAlign(CENTER, CENTER);
    textSize(64);
    fill(255);
    text(winner + " Wins!", windowWidth/2, windowHeight/2);
    
    textSize(32);
    text("Press R to restart", windowWidth/2, windowHeight/2 + 50);
    pop();
    
    noLoop();
  }
}
class Projectile {
  constructor(x, y, direction, isPlayer1) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.width = 30;
    this.height = 20;
    this.isPlayer1 = isPlayer1;
    this.active = true;
    this.isExploding = false;
    this.explosionFrame = 0;
    this.explosionFrameCounter = 0;
  }

  update() {
    this.x += PROJECTILE_SPEED * this.direction;
    if (this.x < 0 || this.x > windowWidth) {
      this.active = false;
    }
  }

  draw() {
    push();
    fill(this.isPlayer1 ? color(255, 0, 0, 200) : color(0, 0, 255, 200));
    noStroke();
    ellipse(this.x, this.y, this.width, this.height);
    pop();
  }

  checkHit(opponent) {
    if (!this.active) return false;
    
    const opponentBox = {
      x: opponent.x - (opponent.config[opponent.currentAnimation].width * opponent.scale) / 2,
      y: opponent.y - opponent.config[opponent.currentAnimation].height * opponent.scale,
      width: opponent.config[opponent.currentAnimation].width * opponent.scale,
      height: opponent.config[opponent.currentAnimation].height * opponent.scale
    };

    return this.x + this.width/2 > opponentBox.x &&
           this.x - this.width/2 < opponentBox.x + opponentBox.width &&
           this.y + this.height/2 > opponentBox.y &&
           this.y - this.height/2 < opponentBox.y + opponentBox.height;
  }

}

const player1Config = {
  run: {  // 改為 run
    frames: 6,
    frameDelay: 8,
    width: 42,
    height: 38,
    offsetY: 0
  },
  punch: {  // 改為 punch
    frames: 5,
    frameDelay: 4,
    width: 41,
    height: 47,
    offsetY: 0
  },
  ice: {  // 改為 ice
    frames: 5,
    frameDelay: 6,
    width: 51,
    height: 47,
    offsetY: 0
  }
  
};

const player2Config = {
  run: {  // 改為 run
    frames: 5,
    frameDelay: 5,
    width: 35,
    height: 39
  },
  punch: {  // 改為 punch
    frames: 5,
    frameDelay: 4,
    width: 41,
    height: 47
  },
  ice: {  // 改為 ice
    frames: 5,
    frameDelay: 6,
    width: 51,
    height: 49
  }
};
function preload() {  
  bgImage = loadImage('HaloZeroBGs.png');
  
  p1Sprites = {
    run: loadImage('alrun.png'),     // 改為 run
    punch: loadImage('alpunch.png'), // 改為 punch
    ice: loadImage('alice.png')      // 改為 ice
  };
  
  p2Sprites = {
    run: loadImage('allrun.png'),     // 改為 run
    punch: loadImage('allpunch.png'), // 改為 punch
    ice: loadImage('allice.png')      // 改為 ice
  };

}

function setup() {
  createCanvas(windowWidth, windowHeight);
  player1 = new Fighter(windowWidth * 0.3, GROUND_Y, p1Sprites, player1Config, true);
  player2 = new Fighter(windowWidth * 0.7, GROUND_Y, p2Sprites, player2Config, false);
}

function draw() {
  image(bgImage, 0, 0, windowWidth, windowHeight);
  drawControls();
  
  player1.update();
  player2.update();
  player1.animate();
  player2.animate();
  
  player1.drawHP();
  player2.drawHP();
  
  drawTitle();
}

function drawTitle() {
  push();
  const title = '淡江教育科技';
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(32);
  
  for(let i = 10; i > 0; i--) {
    fill(255, 255, 255, i * 2);
    text(title, windowWidth/2, 10 + i/2);
  }
  
  fill(255);
  stroke(100, 150, 255);
  strokeWeight(2);
  text(title, windowWidth/2, 15);
  
  textSize(16);
  noStroke();
  fill(200);
  text('- FIGHTING GAME -', windowWidth/2, 50);
  pop();
}

function drawControls() {
  push();
  drawControlBox(50, 70, 180, 120, 
                'Player 1 Controls', 
                [
                  'A / D - Move',
                  'W - Ice',    // 改為 Ice
                  'F - Punch'   // 改為 Punch
                ],
                color(255, 100, 100, 50));
  
  drawControlBox(windowWidth - 230, 70, 180, 120,
                'Player 2 Controls',
                [
                  '←/→ - Move',
                  '↑ - Ice',    // 改為 Ice
                  '/ - Punch'   // 改為 Punch
                ],
                color(100, 100, 255, 50));
  pop();
}

function drawControlBox(x, y, width, height, title, controls, boxColor) {
  fill(boxColor);
  stroke(255, 100);
  strokeWeight(2);
  rect(x, y, width, height, 10);
  
  fill(255);
  noStroke();
  textSize(18);
  textStyle(BOLD);
  textAlign(LEFT);
  text(title, x + 15, y + 25);
  
  stroke(255, 100);
  line(x + 15, y + 35, x + width - 15, y + 35);
  
  noStroke();
  textSize(16);
  textStyle(NORMAL);
  controls.forEach((control, index) => {
    text(control, x + 15, y + 60 + index * 25);
  });
}

function keyPressed() {
  switch (keyCode) {
    case 65: // A
      player1.moveLeft = true;
      break;
    case 68: // D
      player1.moveRight = true;
      break;
    case 87: // W
      player1.ice();  // 改為 ice
      break;
    case 70: // F
      player1.punch();  // 改為 punch
      break;
    case LEFT_ARROW:
      player2.moveLeft = true;
      break;
    case RIGHT_ARROW:
      player2.moveRight = true;
      break;
    case UP_ARROW:
      player2.ice();  // 改為 ice
      break;
    case 191: // /
      player2.punch();  // 改為 punch
      break;
    case 82: // R
      resetGame();
      break;
  }
}

function keyReleased() {
  switch (keyCode) {
    case 65:
      player1.moveLeft = false;
      if (!player1.moveRight && !player1.isJumping) player1.currentAnimation = 'run';
      break;
    case 68:
      player1.moveRight = false;
      if (!player1.moveLeft && !player1.isJumping) player1.currentAnimation = 'run';
      break;
    case LEFT_ARROW:
      player2.moveLeft = false;
      if (!player2.moveRight && !player2.isJumping) player2.currentAnimation = 'run';
      break;
    case RIGHT_ARROW:
      player2.moveRight = false;
      if (!player2.moveLeft && !player2.isJumping) player2.currentAnimation = 'run';
      break;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  GROUND_Y = window.innerHeight / 1.25;
  player1.y = GROUND_Y;
  player2.y = GROUND_Y;
}

function resetGame() {
  player1 = new Fighter(windowWidth * 0.3, GROUND_Y, p1Sprites, player1Config, true);
  player2 = new Fighter(windowWidth * 0.7, GROUND_Y, p2Sprites, player2Config, false);
  loop();
}
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
    this.currentAnimation = 'run';
    this.frame = 0;
    this.frameCounter = 0;
    this.direction = isPlayer1 ? 1 : -1;
    this.scale = SCALE_FACTOR;
    this.velocityY = 0;
    this.isJumping = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.hp = MAX_HP;
    this.isPlayer1 = isPlayer1;
    this.isAttacking = false;
    this.projectiles = [];
    this.isHit = false;
    this.hitEffectTimer = 0;
  }

  drawHP() {
    push();
    const hpBarWidth = 300;
    const hpBarHeight = 30;
    const x = this.isPlayer1 ? 50 : windowWidth - 350;
    const y = 30;
    
    // 血條外框陰影
    fill(0, 0, 0, 50);
    rect(x + 4, y + 4, hpBarWidth, hpBarHeight, 15);
    
    // 血條外框
    stroke(255);
    strokeWeight(3);
    fill(40, 40, 40, 200);
    rect(x, y, hpBarWidth, hpBarHeight, 15);
    
    // 血條顏色和漸層
    noStroke();
    const hpWidth = (this.hp / MAX_HP) * (hpBarWidth - 6);
    const hpColor = this.hp > 70 ? color(100, 255, 100) :
                    this.hp > 30 ? color(255, 200, 0) :
                    color(255, 50, 50);
    
    const gradient = drawingContext.createLinearGradient(x, y, x, y + hpBarHeight);
    gradient.addColorStop(0, color(255, 255, 255, 150));
    gradient.addColorStop(0.5, hpColor);
    gradient.addColorStop(1, color(0, 0, 0, 100));
    
    drawingContext.fillStyle = gradient;
    rect(x + 3, y + 3, hpWidth, hpBarHeight - 6, 12);
    
    // HP數值
    fill(255);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(18);
    text(this.hp + '%', x + hpBarWidth/2, y + hpBarHeight/2);
    
    // 玩家標籤
    textAlign(this.isPlayer1 ? LEFT : RIGHT);
    textSize(24);
    const playerColor = this.isPlayer1 ? color(255, 100, 100) : color(100, 100, 255);
    fill(playerColor);
    stroke(255);
    strokeWeight(2);
    text(this.isPlayer1 ? 'PLAYER 1' : 'PLAYER 2', 
         this.isPlayer1 ? x : x + hpBarWidth, y - 30);
    pop();
  }
    update() {
    // 重力和跳躍更新
    if (this.isJumping) {
      this.velocityY += GRAVITY;
      this.y += this.velocityY;

      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.velocityY = 0;
        this.isJumping = false;
        if (!this.moveLeft && !this.moveRight) {
          this.currentAnimation = 'run';
        }
      }
    }

    // 移動更新
    if (this.moveLeft) {
      const nextX = this.x - MOVE_SPEED;
      if (nextX > SCREEN_PADDING) {
        this.x = nextX;
      }
      this.direction = this.isPlayer1 ? -1 : 1;
      if (!this.isJumping) this.currentAnimation = 'run';
    }
    if (this.moveRight) {
      const nextX = this.x + MOVE_SPEED;
      if (nextX < windowWidth - SCREEN_PADDING) {
        this.x = nextX;
      }
      this.direction = this.isPlayer1 ? 1 : -1;
      if (!this.isJumping) this.currentAnimation = 'run';
    }

    // 投射物更新
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update();
      
      const opponent = this.isPlayer1 ? player2 : player1;
      if (projectile.checkHit(opponent)) {
        opponent.takeDamage(PROJECTILE_DAMAGE);
        projectile.active = false;
        
        // 擊中後的擊退效果
        const knockbackForce = 10;
        opponent.x += knockbackForce * projectile.direction;
        opponent.x = Math.max(SCREEN_PADDING, 
                            Math.min(windowWidth - SCREEN_PADDING, opponent.x));
      }
      
      if (!projectile.active) {
        this.projectiles.splice(i, 1);
      }
    }

    // 受傷閃爍效果更新
    if (this.isHit) {
      this.hitEffectTimer++;
      if (this.hitEffectTimer > 10) {
        this.isHit = false;
        this.hitEffectTimer = 0;
      }
    }
  }
    takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    this.isHit = true;
    
    if (this.hp <= 0) {
      this.handleDeath();
    }
  }

  punch() {
    if (!this.isAttacking) {
      this.currentAnimation = 'punch';
      this.isAttacking = true;
      this.frame = 0;
      
      // 發射投射物
      const projectileX = this.x + (this.direction === 1 ? 50 : -50);
      const projectileY = this.y - 50;
      this.projectiles.push(new Projectile(projectileX, projectileY, this.direction, this.isPlayer1));
      
      setTimeout(() => {
        this.isAttacking = false;
        if (!this.isJumping) {
          this.currentAnimation = 'run';
        }
      }, 500);
    }
  }

  ice() {
    if (!this.isJumping) {
      this.velocityY = JUMP_FORCE;
      this.isJumping = true;
      this.currentAnimation = 'ice';
    }
  }

  handleDeath() {
    const winner = this.isPlayer1 ? "Player 2" : "Player 1";
    this.showGameOver(winner);
  }

  showGameOver(winner) {
    push();
    // 半透明黑色背景
    fill(0, 0, 0, 150);
    rect(0, 0, windowWidth, windowHeight);
    
    // 獲勝文字
    textAlign(CENTER, CENTER);
    textSize(64);
    fill(255);
    stroke(0);
    strokeWeight(4);
    text(winner + " Wins!", windowWidth/2, windowHeight/2);
    
    // 重新開始提示
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
    this.width = 40;
    this.height = 30;
    this.isPlayer1 = isPlayer1;
    this.active = true;
    this.particles = [];
  }

  update() {
    this.x += PROJECTILE_SPEED * this.direction;
    if (this.x < 0 || this.x > windowWidth) {
      this.active = false;
    }
  }

  draw() {
    push();
    // 光暈效果
    for(let i = 4; i > 0; i--) {
      const alpha = 100 - i * 20;
      fill(this.isPlayer1 ? color(255, 0, 0, alpha) : color(0, 0, 255, alpha));
      noStroke();
      ellipse(this.x, this.y, this.width + i*5, this.height + i*5);
    }
    
    // 主要投射物
    fill(this.isPlayer1 ? color(255, 50, 50) : color(50, 50, 255));
    ellipse(this.x, this.y, this.width, this.height);
    
    // 內部光暈
    fill(255, 200);
    ellipse(this.x - this.width/4, this.y - this.height/4, this.width/3, this.height/3);
    pop();
    
    this.updateParticles();
  }
    updateParticles() {
    // 添加新粒子
    if (this.active) {
      for(let i = 0; i < 2; i++) {
        this.particles.push({
          x: this.x,
          y: this.y,
          vx: random(-2, 2),
          vy: random(-2, 2),
          life: 1
        });
      }
    }
    
    // 更新和繪製粒子
    for(let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      
      if(p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      push();
      noStroke();
      fill(this.isPlayer1 ? 
           color(255, 0, 0, p.life * 255) : 
           color(0, 0, 255, p.life * 255));
      ellipse(p.x, p.y, 5 * p.life);
      pop();
    }
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
  run: {
    frames: 6,
    frameDelay: 8,
    width: 42,
    height: 38,
    offsetY: 0
  },
  punch: {
    frames: 5,
    frameDelay: 4,
    width: 41,
    height: 47,
    offsetY: 0
  },
  ice: {
    frames: 5,
    frameDelay: 6,
    width: 51,
    height: 47,
    offsetY: 0
  }
};

const player2Config = {
  run: {
    frames: 5,
    frameDelay: 5,
    width: 35,
    height: 39
  },
  punch: {
    frames: 5,
    frameDelay: 4,
    width: 41,
    height: 47
  },
  ice: {
    frames: 5,
    frameDelay: 6,
    width: 51,
    height: 49
  }
};
function preload() {
  bgImage = loadImage('HaloZeroBGs.png');
  
  p1Sprites = {
    run: loadImage('alrun.png'),
    punch: loadImage('alpunch.png'),
    ice: loadImage('alice.png')
  };
  
  p2Sprites = {
    run: loadImage('allrun.png'),
    punch: loadImage('allpunch.png'),
    ice: loadImage('allice.png')
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
  
  // 標題陰影效果
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
                  'W - Ice',
                  'F - Punch'
                ],
                color(255, 100, 100, 50));
  
  drawControlBox(windowWidth - 230, 70, 180, 120,
                'Player 2 Controls',
                [
                  '←/→ - Move',
                  '↑ - Ice',
                  '/ - Punch'
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
      player1.ice();
      break;
    case 70: // F
      player1.punch();
      break;
    case LEFT_ARROW:
      player2.moveLeft = true;
      break;
    case RIGHT_ARROW:
      player2.moveRight = true;
      break;
    case UP_ARROW:
      player2.ice();
      break;
    case 191: // /
      player2.punch();
      break;
    case 82: // R
      if (!isLooping()) resetGame();
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
  const newGroundY = window.innerHeight / 1.25;
  player1.y = player1.y - GROUND_Y + newGroundY;
  player2.y = player2.y - GROUND_Y + newGroundY;
  GROUND_Y = newGroundY;
}

function resetGame() {
  player1 = new Fighter(windowWidth * 0.3, GROUND_Y, p1Sprites, player1Config, true);
  player2 = new Fighter(windowWidth * 0.7, GROUND_Y, p2Sprites, player2Config, false);
  loop();
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
    
    // 受傷閃爍效果
    if (this.isHit) {
      tint(255, 0, 0, 200);
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

    // 繪製所有投射物
    this.projectiles.forEach(projectile => {
      projectile.draw();
    });
  }

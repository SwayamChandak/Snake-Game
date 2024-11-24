let score = 0;

document.getElementById("startGame").addEventListener("click", function () {
  window.game.scene.keys["SnakeScene"].snake.resetGame();
});


class GameOverScene extends Phaser.Scene {
  constructor() {
      super({ key: "GameOverScene" });
  }

  preload() {
      this.load.image("gameOver", "assets/startscene.jpg");
  }

  create() {
      let gameOverImage = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "gameOver");
      gameOverImage.setOrigin(0.5, 0.5).setDisplaySize(this.cameras.main.width, this.cameras.main.height);

      this.add.text(this.cameras.main.centerX, 100, "Game Over", {
          font: "40px Arial",
          fill: "#ff0000",
      }).setOrigin(0.5, 0.5);

      this.add.text(this.cameras.main.centerX, 200, `Score: ${score}`, {
          font: "30px Arial",
          fill: "#ffffff",
      }).setOrigin(0.5, 0.5);

      let restartButton = this.add.text(this.cameras.main.centerX, 300, "Restart", {
          font: "25px Arial",
          fill: "#00ff00",
      }).setOrigin(0.5, 0.5).setInteractive();

      restartButton.on("pointerdown", () => {
          this.scene.stop("GameOverScene"); // Stop the GameOver scene
          this.scene.start("SnakeScene"); // Restart the SnakeScene
          this.scene.get("SnakeScene").resetGame(); // Call resetGame to reset score and game state
      });
  }
}

   
  
class Snake {
  constructor(scene) {
    this.scene = scene;
    this.body = [];
    this.positions = [];
    this.directions = [];
    this.gameStarted = false;
    this.keyLock = false;
    this.moveEvents = [];
    this.bodyParts = [];
    this.body.push(this.scene.physics.add.sprite(100, 300, "snakeRight"));
    this.bodyPartLength = this.body[0].displayWidth;
    this.body.push(this.scene.physics.add.sprite(100 - this.bodyPartLength, 300, "tailLeft"));
    this.direction = Phaser.Math.Vector2.RIGHT;
    this.directions.unshift(this.direction.clone());
    this.eat = this.scene.sound.add("eat");
    this.hit = this.scene.sound.add("hit");
    this.moveTime = 0;
    this.speed = 150;  // Initial speed
    this.alive = true;
  }

  faceDirection(vector) {
    this.gameStarted = true;
    let oppositeVector = new Phaser.Math.Vector2(-vector.x, -vector.y);
    if (!this.keyLock && !this.direction.equals(oppositeVector)) {
      this.moveEvents.push(vector);
      this.keyLock = true;
    }
  }

  update(time) {
    if (time >= this.moveTime && this.gameStarted) {
      this.keyLock = false;
      if (this.moveEvents.length > 0) {
        this.direction = this.moveEvents.shift();
      }
      this.move();
      return true;
    }
    return false;
  }

  move() {
    let oldHeadPosition = { x: this.body[0].x, y: this.body[0].y };
    this.directions.unshift(this.direction.clone());
    this.body[0].x += this.direction.x * this.bodyPartLength;
    this.body[0].y += this.direction.y * this.bodyPartLength;

    // Check for boundary collision
    if (this.body[0].x >= game.config.width || this.body[0].x < 0 || this.body[0].y >= game.config.height || this.body[0].y < 0) {
        this.endGame();
        return;
    }

    // Check for self-collision (snake colliding with its own body)
    for (let i = 1; i < this.body.length; i++) {
        if (this.body[0].x === this.body[i].x && this.body[0].y === this.body[i].y) {
            this.endGame();
            return;
        }
    }

    // Move the rest of the snake body
    for (let i = 1; i < this.body.length; i++) {
      let oldBodyPosition = { x: this.body[i].x, y: this.body[i].y };
      this.body[i].x = oldHeadPosition.x;
      this.body[i].y = oldHeadPosition.y;
      oldHeadPosition = oldBodyPosition;
    }

    this.moveTime = this.scene.time.now + this.speed;
}


  grow() {
    let newPart = this.scene.physics.add.sprite(-1 * this.bodyPartLength, -1 * this.bodyPartLength, "tailRight");
    this.body.push(newPart);
    this.eat.play();
    
    // Assign points based on food type
    let pointsAwarded = 0;
    switch (this.scene.food.type) {
        case "apple":
            pointsAwarded = 1;
            break;
        case "watermelon":
            pointsAwarded = 2;
            break;
        case "orange":
            pointsAwarded = 3;
            break;
        case "mango":
            pointsAwarded = 4;
            break;
        case "rat":
            pointsAwarded = 5;
            break;
    }
    
    score += pointsAwarded;  // Add points based on food type
    document.getElementById("scoreNumber").innerHTML = score;

    // Increase speed every 3 points
    if (score % 1 === 0) {
      this.speed = Math.max(50, this.speed - 20);  // Decrease speed (increasing the game speed)
    }
}


endGame() {
    this.alive = false;
    this.scene.scene.pause();  // Pause the game
    this.scene.scene.launch('GameOverScene');  // Launch GameOverScene
    this.hit.play();  // Play game over sound
}




resetGame=()=> {
    score = 0; // Reset score to 0
    document.getElementById("scoreNumber").innerHTML = 0; // Update score display
  
    // Reset other game states
    this.snake.alive = true;
    this.snake.speed = 150; // Reset snake speed
    this.snake.body = [this.physics.add.sprite(100, 300, "snakeRight")]; // Reset snake
    this.food.reposition(); // Reposition food
  }
}  

class Food extends Phaser.GameObjects.Image {
    constructor(scene, x, y) {
      super(scene, x, y, "watermelon");
      this.scene.add.existing(this);
      this.types = ["watermelon", "orange", "mango", "rat"];
      this.type = "watermelon";
      this.foodTimer = null;
      this.startFoodTimer();
    }
  
    reposition() {
      if (this.foodTimer) {
        clearTimeout(this.foodTimer); // Clear any existing timer
      }
  
      let bodyPartLength = this.scene.snake.bodyPartLength;
      let x = Phaser.Math.Between(0, (this.scene.game.config.width / bodyPartLength) - 1);
      let y = Phaser.Math.Between(0, (this.scene.game.config.height / bodyPartLength) - 1);
      x = bodyPartLength * x + 0.5 * bodyPartLength;
      y = bodyPartLength * y + 0.5 * bodyPartLength;
  
      let bodyParts = this.scene.snake.body;
      this.setPosition(x, y);
  
      let randomIndex = Phaser.Math.Between(0, this.types.length - 1);
      this.type = this.types[randomIndex];
      this.setTexture(this.type);
  
      for (let i = 1; i < bodyParts.length; i++) {
        let spriteBounds = bodyParts[i].getBounds();
        if (spriteBounds.contains(x, y)) {
          this.reposition();
          return;
        }
      }
  
      // Restart the food timer whenever repositioned
      this.startFoodTimer();
    }
  
    startFoodTimer() {
      let baseTime = 5000; // Base timeout in milliseconds (5 seconds)
      let timeReduction = Math.min(score * 200, 4000); // Reduce time by 200ms per point, capped at 4 seconds
      let timeout = baseTime - timeReduction;
  
      this.foodTimer = setTimeout(() => {
        this.reposition(); // Reposition the food if not eaten
      }, timeout);
    }
  }
  
  class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: "StartScene" });
    }

    preload() {
        this.load.image("startScene", "./assets/startscene.jpg");
    }

    create() {
        // Add the start scene image with custom size
        let startSceneImage = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "startScene");
        
        // Set custom size (e.g., 80% of the screen width and height)
        const customWidth = this.cameras.main.width * 0.2;
        const customHeight = this.cameras.main.height * 0.2;
        startSceneImage.setDisplaySize(customWidth, customHeight);

        // Add a "Play" button
        let playButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + customHeight / 2 + 20, // Position it below the image
            "Play",
            {
                font: "40px Arial",
                fill: "#00ff00",
            }
        ).setOrigin(0.5, 0.5).setInteractive();

        playButton.on("pointerdown", () => {
            this.scene.stop("StartScene"); // Stop StartScene
            this.scene.start("SnakeScene"); // Start SnakeScene
        });
    }
}


class SnakeScene extends Phaser.Scene {
  constructor() {
    super({
      key: "SnakeScene",
    });
  }

  preload() {
    // this.load.image("apple", "assets/apple.png");
    this.load.image("watermelon", "assets/watermelon.png");
    this.load.image("orange", "assets/orange.jpg");
    this.load.image("mango", "assets/mango.png");
    this.load.image("rat", "assets/rat.png");
    this.load.image("background", "assets/bg.png");
    this.load.audio("eat", "assets/eat.mp3");
    this.load.audio("hit", "assets/hit.wav");
    this.load.image("startScene", "assets/startscene.jpg");

    this.load.image("snakeRight", "assets/plain.png");
    this.load.image("snakeLeft", "assets/plain.png");
    this.load.image("snakeUp", "assets/plain.png");
    this.load.image("snakeDown", "assets/plain.png");
    this.load.image("bodyHorizontal", "assets/plain.png");
    this.load.image("bodyVertical", "assets/plain.png");
    this.load.image("bodyRightUp", "assets/plain.png");
    this.load.image("bodyRightDown", "assets/plain.png");
    this.load.image("bodyDownRight", "assets/plain.png");
    this.load.image("bodyUpRight", "assets/plain.png");
    this.load.image("tailRight", "assets/plain.png");
    this.load.image("tailLeft", "assets/plain.png");
    this.load.image("tailUp", "assets/plain.png");
    this.load.image("tailDown", "assets/plain.png");
  }

  create() {
    let bg = this.add.image(0, 0, "background");
    bg.displayWidth = this.sys.canvas.width;
    bg.displayHeight = this.sys.canvas.height;
    bg.setOrigin(0, 0);

    this.snake = new Snake(this);
    this.food = new Food(this, 400, 300);

    this.physics.world.enable(this.food);
    this.physics.world.enable(this.snake.body[0]);
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  resetGame=()=> {
    score = 0; // Reset score to 0
    document.getElementById("scoreNumber").innerHTML = 0; // Update score display
  
    // Reset other game states
    this.snake.alive = true;
    this.snake.speed = 150; // Reset snake speed
    this.snake.body = [this.physics.add.sprite(100, 300, "snakeRight")]; // Reset snake
    this.food.reposition(); // Reposition food
  }
  update(time) {
    if (!this.snake.alive) return;

    let directions = {
      left: Phaser.Math.Vector2.LEFT,
      right: Phaser.Math.Vector2.RIGHT,
      up: Phaser.Math.Vector2.UP,
      down: Phaser.Math.Vector2.DOWN,
    };

    for (let [direction, vector] of Object.entries(directions)) {
      if (this.cursors[direction].isDown) {
        this.snake.faceDirection(vector);
      }
    }

    if (this.snake.update(time)) {
      if (this.physics.overlap(this.snake.body[0], this.food)) {
        
          this.food.reposition();
          this.snake.grow();
        
      }
    }
  }
}

const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 600,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
      },
    },
    scene: [SnakeScene, GameOverScene, StartScene],  // Add GameOverScene here
  };
  

window.game = new Phaser.Game(config);
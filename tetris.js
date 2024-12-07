// Constants and initialization
const BLOCK_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const COLORS = {
    I: "#00f0f0",
    O: "#f0f000",
    T: "#a000f0",
    L: "#f0a000",
    J: "#0000f0",
    S: "#00f000",
    Z: "#f00000"
};
const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    L: [[1, 0], [1, 0], [1, 1]],
    J: [[0, 1], [0, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]]
};

// Tetris class and logic
class Tetris {
    constructor() {
        this.canvas = document.getElementById("game-board");
        this.ctx = this.canvas.getContext("2d");
        this.nextCanvas = document.getElementById("next-piece");
        this.nextCtx = this.nextCanvas.getContext("2d");
        this.scoreElement = document.getElementById("score");
        this.topScoreElement = document.getElementById("top-score"); // Element for Top Score
        this.board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
        this.score = 0;
        this.topScore = this.getTopScore(); // Load top score from localStorage
        this.currentPiece = this.randomPiece();
        this.nextPiece = this.randomPiece();
        this.isGameOver = false;
        this.gamePaused = true;
        this.gameLoopInterval = null;

        this.initControls();
        this.updateTopScoreDisplay(); // Display Top Score
    }

    randomPiece() {
        const pieces = Object.keys(SHAPES);
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            type,
            shape: SHAPES[type],
            color: COLORS[type],
            x: Math.floor(BOARD_WIDTH / 2) - 1,
            y: 0
        };
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        this.ctx.strokeStyle = "#000";
        this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }

    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the board
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, COLORS[this.board[y][x]]);
                }
            }
        }

        // Draw the current piece
        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.drawBlock(
                        this.currentPiece.x + dx,
                        this.currentPiece.y + dy,
                        this.currentPiece.color
                    );
                }
            });
        });
    }

    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        this.nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        x * BLOCK_SIZE,
                        y * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE
                    );
                    this.nextCtx.strokeStyle = "#000";
                    this.nextCtx.strokeRect(
                        x * BLOCK_SIZE,
                        y * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE
                    );
                }
            });
        });
    }

    dropPiece() {
        this.currentPiece.y++;

        if (this.collides()) {
            this.currentPiece.y--;
            this.mergePiece();
            this.clearLines();
            this.spawnNextPiece();
        }
    }

    collides() {
        const { shape, x, y } = this.currentPiece;

        return shape.some((row, dy) =>
            row.some((value, dx) => {
                const boardX = x + dx;
                const boardY = y + dy;

                return (
                    value &&
                    (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT || this.board[boardY]?.[boardX])
                );
            })
        );
    }

    mergePiece() {
        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.board[this.currentPiece.y + dy][this.currentPiece.x + dx] = this.currentPiece.type;
                }
            });
        });
    }

    clearLines() {
        this.board = this.board.filter(row => row.some(value => !value));
        const clearedLines = BOARD_HEIGHT - this.board.length;
        this.score += clearedLines * 10;

        while (this.board.length < BOARD_HEIGHT) {
            this.board.unshift(Array(BOARD_WIDTH).fill(0));
        }

        this.updateScore();
    }

    spawnNextPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.randomPiece();

        if (this.collides()) {
            this.isGameOver = true;
            this.handleGameOver();
        }
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    startGame() {
        if (!this.gameLoopInterval) {
            this.gamePaused = false;
            this.gameLoopInterval = setInterval(() => {
                if (!this.gamePaused && !this.isGameOver) {
                    this.dropPiece();
                    this.drawBoard();
                    this.drawNextPiece();
                }
            }, 500);
        }
    }

    pauseGame() {
        this.gamePaused = true;
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
    }

    handleGameOver() {
        alert("Game Over! Memulai permainan baru.");
        this.updateTopScore(); // Check and update Top Score
        this.resetGame();
    }

    resetGame() {
        this.board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
        this.score = 0;
        this.updateScore();
        this.currentPiece = this.randomPiece();
        this.nextPiece = this.randomPiece();
        this.isGameOver = false;
        this.startGame();
    }

    getTopScore() {
        return parseInt(localStorage.getItem("topScore") || "0");
    }

    updateTopScore() {
        if (this.score > this.topScore) {
            this.topScore = this.score;
            localStorage.setItem("topScore", this.topScore);
            this.updateTopScoreDisplay();
        }
    }

    updateTopScoreDisplay() {
        this.topScoreElement.textContent = this.topScore;
    }

    initControls() {
        document.addEventListener("keydown", (e) => {
            if (this.isGameOver || this.gamePaused) return;

            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
            }

            if (e.key === "ArrowLeft") {
                this.currentPiece.x--;
                if (this.collides()) this.currentPiece.x++;
            } else if (e.key === "ArrowRight") {
                this.currentPiece.x++;
                if (this.collides()) this.currentPiece.x--;
            } else if (e.key === "ArrowDown") {
                this.dropPiece();
            } else if (e.key === "ArrowUp") {
                this.rotatePiece();
            }

            this.drawBoard();
        });
    }

    rotatePiece() {
        const shape = this.currentPiece.shape;
        const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse());

        const previousShape = this.currentPiece.shape;
        this.currentPiece.shape = newShape;

        if (this.collides()) {
            this.currentPiece.shape = previousShape;
        }
    }
}

// Initialize game and buttons
const game = new Tetris();

// Event listener untuk tombol Start/Pause
document.getElementById("start-btn").addEventListener("click", () => {
    const startBtn = document.getElementById("start-btn");

    if (game.gamePaused || game.isGameOver) {
        // Jika game dalam keadaan pause atau selesai, maka mulai game
        game.startGame();
        startBtn.textContent = "Pause"; // Ubah teks tombol menjadi Pause
    } else {
        // Jika game sedang berjalan, maka pause game
        game.pauseGame();
        startBtn.textContent = "Start"; // Ubah teks tombol menjadi Start
    }
});


document.getElementById("reset-btn").addEventListener("click", () => game.resetGame());

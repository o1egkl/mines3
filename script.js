let gridSize = 10; // Default grid size
const defaultNumberOfMines = 10; // Default number of mines
let numberOfMines = defaultNumberOfMines;

let board = [];
let gameStarted = false;
let gameOver = false;
let timerInterval;
let timeElapsed = 0;
let flagsRemaining;

const gameBoard = document.getElementById('game-board');
const timerDisplay = document.getElementById('timer');
const mineCounterDisplay = document.getElementById('mine-counter');

// Difficulty Levels (You can customize these)
const difficultyLevels = {
  easy: { gridSize: 9, mines: 10, cellSize: 40 },
  medium: { gridSize: 16, mines: 40, cellSize: 35 },
  hard: { gridSize: 20, mines: 59, cellSize: 28 }
};
let cellSize; 
// Function to set up the game based on difficulty
function setDifficulty(difficulty) {
  console.log(difficulty);
  let selectedDifficulty = difficultyLevels[difficulty];
  gridSize = selectedDifficulty.gridSize;
  numberOfMines = selectedDifficulty.mines;
  cellSize = selectedDifficulty.cellSize;
  resetGame();
  handleResize(); // Add this line
}



// Create the grid
function createGrid() {
  const gameBoard = document.getElementById('game-board');
  gameBoard.innerHTML = ''; // Clear any existing grid
  board = []; // Reset the board array

  // Set the game board size
  const gameBoardSize = gridSize * cellSize;
 // gameBoard.style.width = `${gameBoardSize}px`;
  //gameBoard.style.height = `${gameBoardSize}px`;

  for (let i = 0; i < gridSize; i++) {
    let row = [];
    for (let j = 0; j < gridSize; j++) {
      row.push({
        x: i,
        y: j,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0
      });

      let cell = document.createElement('div');
      cell.classList.add('cell');
    //  cell.style.width = `${cellSize}px`;
    //  cell.style.height = `${cellSize}px`;
      cell.style.fontSize = `${Math.max(cellSize * 0.6, 14)}px`; // Increased minimum font size
      cell.dataset.x = i;
      cell.dataset.y = j;
      cell.addEventListener('click', handleCellClick);
      cell.addEventListener('contextmenu', handleRightClick);
      gameBoard.appendChild(cell);
    }
    board.push(row);
  }

  // Set up the grid layout
  gameBoard.style.display = 'grid';
  gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`;
  gameBoard.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize}px)`;

  updateMineCounter();
}
  
  
  // Add this function to handle window resizing
  function handleResize() {
    const gameContainer = document.getElementById('game-container');
    const gameBoard = document.getElementById('game-board');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
  
    // Calculate the maximum size the game board can be
    const maxWidth = windowWidth * 0.9;
    const maxHeight = windowHeight * 0.8;
  
    // Calculate the current game board size based on cell size and grid size
    const currentSize = cellSize * gridSize;
    
    // Determine the scaling factor
    const scaleX = maxWidth / currentSize;
    const scaleY = maxHeight / currentSize;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down if necessary
    
    // Apply the scaling to the game board
    gameBoard.style.transform = `scale(${scale})`;
    gameBoard.style.transformOrigin = 'center top';
    
    // Adjust the container size to account for the scaling
    gameContainer.style.width = `${currentSize * scale}px`;
    gameContainer.style.height = `${currentSize * scale}px`;
  }
  
  function revealCell(x, y) {
    let cell = board[x][y];
  
    if (cell.isRevealed || cell.isFlagged) return;
  
    cell.isRevealed = true;
    let cellElement = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    cellElement.classList.remove('bg-gray-300');
    cellElement.classList.add('bg-white');
  
    if (cell.isMine) {
      // Game Over
      cellElement.classList.add('bg-red-500', 'text-white');
      gameOver = true;
      stopTimer();
      alert('Game Over! You clicked a mine.');
      return;
    }
  
    if (cell.adjacentMines > 0) {
      cellElement.textContent = cell.adjacentMines;
      const colors = ['blue', 'green', 'red', 'purple', 'maroon', 'teal', 'black', 'gray'];
      cellElement.classList.add(`text-${colors[cell.adjacentMines - 1]}-500`);
      return;
    }
  }


// Place mines randomly
function placeMines(startX, startY) {
  let minesPlaced = 0;
  while (minesPlaced < numberOfMines) {
    let x = Math.floor(Math.random() * gridSize);
    let y = Math.floor(Math.random() * gridSize);

    if (x !== startX || y !== startY) {
      if (!board[x][y].isMine) {
        board[x][y].isMine = true;
        minesPlaced++;
      }
    }
  }
}

// Calculate the number of adjacent mines for each cell
function calculateAdjacentMines() {
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (board[i][j].isMine) continue;

      let count = 0;
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          if (x === 0 && y === 0) continue;
          let newX = i + x;
          let newY = j + y;
          if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize && board[newX][newY].isMine) {
            count++;
          }
        }
      }
      board[i][j].adjacentMines = count;
    }
  }
}

// Handle cell click
function handleCellClick(e) {
  if (gameOver) return;

  let x = parseInt(e.target.dataset.x);
  let y = parseInt(e.target.dataset.y);

  if (!gameStarted) {
    // Place mines on first click
    placeMines(x, y);
    calculateAdjacentMines();
    gameStarted = true;
    startTimer(); // Start the timer on the first click
  }

  revealCell(x, y);
  checkWinCondition(); // Check for a win after each cell reveal
}

// Handle right-click for flagging mines
function handleRightClick(e) {
  e.preventDefault();

  if (gameOver || !gameStarted) return;

  let x = parseInt(e.target.dataset.x);
  let y = parseInt(e.target.dataset.y);
  let cell = board[x][y];
  let cellElement = e.target;

  if (!cell.isRevealed) {
    if (!cell.isFlagged && flagsRemaining > 0) {
      // Flag the cell
      cell.isFlagged = true;
      cellElement.classList.add('bg-yellow-500');
      flagsRemaining--;
    } else if (cell.isFlagged) {
      // Unflag the cell
      cell.isFlagged = false;
      cellElement.classList.remove('bg-yellow-500');
      flagsRemaining++;
    }
    updateMineCounter();
  }
}

// Recursive function to reveal cells
function revealCell(x, y) {
  let cell = board[x][y];

  if (cell.isRevealed || cell.isFlagged) return;

  cell.isRevealed = true;
  let cellElement = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  cellElement.classList.remove('bg-gray-300');
  cellElement.classList.add('revealed', 'bg-white');

  if (cell.isMine) {
    // Game Over
    cellElement.classList.add('bg-red-500', 'text-white');
    gameOver = true;
    stopTimer();
    alert('Game Over! You clicked a mine.');
    return;
  }

  if (cell.adjacentMines > 0) {
    cellElement.textContent = cell.adjacentMines;
    cellElement.classList.add(`text-${['blue', 'green', 'red', 'purple', 'maroon', 'turquoise', 'black', 'gray'][cell.adjacentMines - 1]}-500`);
    return;
  }

  // Recursively reveal adjacent cells if the cell has 0 adjacent mines
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      let newX = x + i;
      let newY = y + j;
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        revealCell(newX, newY);
      }
    }
  }
}

// Game Timer Functions
function startTimer() {
  timeElapsed = 0;
  timerDisplay.textContent = '0';
  timerInterval = setInterval(() => {
    timeElapsed++;
    timerDisplay.textContent = timeElapsed;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// Mine Counter Functions
function updateMineCounter() {
  mineCounterDisplay.textContent = flagsRemaining;
}

// Check for Win Condition
function checkWinCondition() {
  let cellsRevealed = 0;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (board[i][j].isRevealed && !board[i][j].isMine) {
        cellsRevealed++;
      }
    }
  }

  if (cellsRevealed === (gridSize * gridSize) - numberOfMines) {
    gameOver = true;
    stopTimer();
    alert('You Win!');
  }
}

// Reset Game Function
function resetGame() {
  stopTimer();
  gameOver = false;
  gameStarted = false;
  timeElapsed = 0;
  flagsRemaining = numberOfMines;
  createGrid();
  handleResize(); // Add this line
  updateMineCounter();
  timerDisplay.textContent = '0';
}
window.addEventListener('resize', handleResize); 
// Initialize the game
setDifficulty('easy');
//resetGame();
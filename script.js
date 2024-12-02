// Crypto-related words for the game
const words = ['BITCOIN', 'ETHEREUM', 'BLOCKCHAIN', 'MINING', 'WALLET', 'DEFI', 'TOKEN', 'CRYPTO', 'LEDGER', 'NFT'];
const hiddenWord = 'LEE';
let foundWords = new Set();
let foundHiddenWord = false;
let isGameActive = false;
let startTime;
let gameTimer;
let gameStartTime;

// Game variables
const gridSize = 15;
const grid = [];
let selectedCells = [];
let isSelecting = false;

// Point system
const POINTS_PER_WORD = 100;
const HIDDEN_WORD_BONUS = 500;
const TIME_BONUSES = {
    60: 1000,  // Complete under 60 seconds: 1000 points
    120: 750,  // Complete under 120 seconds: 750 points
    180: 500,  // Complete under 180 seconds: 500 points
    240: 250   // Complete under 240 seconds: 250 points
};

// Cooldown period
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize the game
function initGame() {
    const userId = document.getElementById('userId').value.trim();
    if (!userId) {
        alert('Please enter a user ID');
        return;
    }

    if (!canUserPlay(userId)) {
        alert('You can only play once every 24 hours!');
        return;
    }

    // Reset game state
    foundWords.clear();
    foundHiddenWord = false;
    isGameActive = true;
    
    // Show game content and hide user form
    document.getElementById('userIdForm').classList.add('hidden');
    document.getElementById('gameContent').classList.remove('hidden');
    
    // Clear word list
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';
    
    // Display words to find
    words.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        li.id = `word-${word}`;
        wordList.appendChild(li);
    });

    // Create and fill the grid
    createGrid();
    placeWords();
    
    // Start the timer
    startTimer();
    gameStartTime = new Date();
}

// Create the grid
function createGrid() {
    const wordGrid = document.getElementById('wordGrid');
    wordGrid.innerHTML = '';

    // Initialize empty grid
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = '';
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            wordGrid.appendChild(cell);
        }
    }

    // Add event listeners
    wordGrid.addEventListener('mousedown', startSelection);
    wordGrid.addEventListener('mouseover', continueSelection);
    document.addEventListener('mouseup', endSelection);
    
    // Add touch events
    wordGrid.addEventListener('touchstart', handleTouchStart, { passive: false });
    wordGrid.addEventListener('touchmove', handleTouchMove, { passive: false });
    wordGrid.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Prevent scrolling on touch
    wordGrid.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

// Place words in the grid
function placeWords() {
    // Place each word
    for (const word of words) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;

        while (!placed && attempts < maxAttempts) {
            const direction = Math.floor(Math.random() * 8); // 0-7 for 8 directions
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);

            if (canPlaceWord(word, row, col, direction)) {
                placeWord(word, row, col, direction);
                placed = true;
            }
            attempts++;
        }
    }

    // Fill remaining cells with random letters
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j] === '') {
                grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
            const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
            if (cell) {
                cell.textContent = grid[i][j];
            }
        }
    }
}

// Check if a word can be placed at the given position and direction
function canPlaceWord(word, row, col, direction) {
    const directions = [
        [0, 1],   // right
        [1, 0],   // down
        [1, 1],   // diagonal down-right
        [-1, 1],  // diagonal up-right
        [0, -1],  // left
        [-1, 0],  // up
        [-1, -1], // diagonal up-left
        [1, -1]   // diagonal down-left
    ];

    const [dRow, dCol] = directions[direction];

    // Check if word fits on grid
    for (let i = 0; i < word.length; i++) {
        const newRow = row + (dRow * i);
        const newCol = col + (dCol * i);
        
        if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
            return false;
        }
        
        if (grid[newRow][newCol] !== '' && grid[newRow][newCol] !== word[i]) {
            return false;
        }
    }
    
    return true;
}

// Place a word in the grid
function placeWord(word, row, col, direction) {
    const directions = [
        [0, 1],   // right
        [1, 0],   // down
        [1, 1],   // diagonal down-right
        [-1, 1],  // diagonal up-right
        [0, -1],  // left
        [-1, 0],  // up
        [-1, -1], // diagonal up-left
        [1, -1]   // diagonal down-left
    ];

    const [dRow, dCol] = directions[direction];
    
    for (let i = 0; i < word.length; i++) {
        const newRow = row + (dRow * i);
        const newCol = col + (dCol * i);
        grid[newRow][newCol] = word[i];
    }
}

// Word selection functions
function startSelection(e) {
    if (!isGameActive) return;
    const cell = e.target.closest('.grid-cell');
    if (!cell) return;
    
    e.preventDefault();
    isSelecting = true;
    selectedCells = [cell];
    cell.classList.add('selected');
}

function continueSelection(e) {
    if (!isGameActive || !isSelecting) return;
    
    const cell = e.target.closest('.grid-cell');
    if (!cell) return;

    const lastCell = selectedCells[selectedCells.length - 1];
    if (!lastCell || cell === lastCell) return;

    // Get coordinates
    const lastRow = parseInt(lastCell.dataset.row);
    const lastCol = parseInt(lastCell.dataset.col);
    const currentRow = parseInt(cell.dataset.row);
    const currentCol = parseInt(cell.dataset.col);

    // Calculate direction
    const rowDiff = Math.abs(currentRow - lastRow);
    const colDiff = Math.abs(currentCol - lastCol);

    // Check if movement is valid (horizontal, vertical, or diagonal)
    const isValidMove = (
        (rowDiff === 0 && colDiff === 1) || // horizontal
        (rowDiff === 1 && colDiff === 0) || // vertical
        (rowDiff === 1 && colDiff === 1)    // diagonal
    );

    if (!isValidMove) return;

    // Add cells in between for diagonal movement
    if (rowDiff === 1 && colDiff === 1) {
        const rowStep = (currentRow - lastRow) / Math.abs(currentRow - lastRow);
        const colStep = (currentCol - lastCol) / Math.abs(currentCol - lastCol);
        const intermediateCell = document.querySelector(
            `.grid-cell[data-row="${lastRow + rowStep}"][data-col="${lastCol + colStep}"]`
        );
        if (intermediateCell && !selectedCells.includes(intermediateCell)) {
            selectedCells.push(intermediateCell);
            intermediateCell.classList.add('selected');
        }
    }

    // Add the current cell
    if (!selectedCells.includes(cell)) {
        selectedCells.push(cell);
        cell.classList.add('selected');
    }
}

function endSelection() {
    if (!isGameActive || !isSelecting) return;
    isSelecting = false;
    
    const word = selectedCells.map(cell => cell.textContent).join('');
    const reverseWord = word.split('').reverse().join('');
    
    if (words.includes(word) && !foundWords.has(word)) {
        foundWords.add(word);
        markWordAsFound(word);
        // Keep the cells highlighted for found words
        selectedCells.forEach(cell => cell.classList.add('found'));
        checkGameCompletion();
    } else if (word === hiddenWord || reverseWord === hiddenWord) {
        foundHiddenWord = true;
        // Keep the cells highlighted for hidden word
        selectedCells.forEach(cell => cell.classList.add('found'));
        alert('Congratulations! You found the hidden word LEE!');
    } else {
        // Only remove highlighting if the word is not valid
        selectedCells.forEach(cell => cell.classList.remove('selected'));
    }
    
    selectedCells = [];
}

// Touch event handlers
function handleTouchStart(e) {
    e.preventDefault();
    if (!isGameActive) return;
    
    const touch = e.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (cell && cell.classList.contains('grid-cell')) {
        isSelecting = true;
        selectedCells = [cell];
        cell.classList.add('selected');
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isGameActive || !isSelecting) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('grid-cell')) {
        const lastCell = selectedCells[selectedCells.length - 1];
        if (!lastCell || element === lastCell) return;

        // Get coordinates
        const lastRow = parseInt(lastCell.dataset.row);
        const lastCol = parseInt(lastCell.dataset.col);
        const currentRow = parseInt(element.dataset.row);
        const currentCol = parseInt(element.dataset.col);

        // Calculate direction
        const rowDiff = Math.abs(currentRow - lastRow);
        const colDiff = Math.abs(currentCol - lastCol);

        // Check if movement is valid (horizontal, vertical, or diagonal)
        const isValidMove = (
            (rowDiff === 0 && colDiff === 1) || // horizontal
            (rowDiff === 1 && colDiff === 0) || // vertical
            (rowDiff === 1 && colDiff === 1)    // diagonal
        );

        if (!isValidMove) return;

        // Add cells in between for diagonal movement
        if (rowDiff === 1 && colDiff === 1) {
            const rowStep = (currentRow - lastRow) / Math.abs(currentRow - lastRow);
            const colStep = (currentCol - lastCol) / Math.abs(currentCol - lastCol);
            const intermediateCell = document.querySelector(
                `.grid-cell[data-row="${lastRow + rowStep}"][data-col="${lastCol + colStep}"]`
            );
            if (intermediateCell && !selectedCells.includes(intermediateCell)) {
                selectedCells.push(intermediateCell);
                intermediateCell.classList.add('selected');
            }
        }

        // Add the current cell
        if (!selectedCells.includes(element)) {
            selectedCells.push(element);
            element.classList.add('selected');
        }
    }
}

function handleTouchEnd() {
    if (!isGameActive) return;
    endSelection();
}

// Mark a found word in the list
function markWordAsFound(word) {
    const wordElement = document.getElementById(`word-${word}`);
    if (wordElement) {
        wordElement.classList.add('found');
    }
}

// Timer functions
function startTimer() {
    startTime = Date.now();
    gameTimer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (elapsedTime % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
}

// Game completion check
function checkGameCompletion() {
    if (foundWords.size === words.length) {
        endGame();
    }
}

// End game function
function endGame() {
    if (!isGameActive) return;
    isGameActive = false;
    saveGameStats();
    
    // Disable grid interaction
    const grid = document.getElementById('grid');
    grid.style.pointerEvents = 'none';
    
    // Update UI
    document.getElementById('endGameBtn').disabled = true;
    document.getElementById('timer').style.color = 'red';
    clearInterval(gameTimer);
}

// Function to save game stats
function saveGameStats() {
    const currentTime = new Date();
    const gameStats = {
        userId: localStorage.getItem('userId') || 'anonymous',
        score: foundWords.size,
        timeTaken: Math.floor((currentTime - gameStartTime) / 1000), // Time in seconds
        hiddenWordFound: foundHiddenWord,
        timestamp: currentTime.toISOString(),
        foundWords: Array.from(foundWords)
    };

    // Get existing stats or initialize empty array
    let gameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    gameHistory.push(gameStats);
    localStorage.setItem('gameHistory', JSON.stringify(gameHistory));

    // Display game summary
    alert(`Game Summary:\nScore: ${gameStats.score} words found\nTime: ${gameStats.timeTaken} seconds\nHidden Word Found: ${gameStats.hiddenWordFound}`);
}

// Get game history
function getGameHistory() {
    return JSON.parse(localStorage.getItem('gameHistory') || '[]');
}

// Clear game history
function clearGameHistory() {
    localStorage.removeItem('gameHistory');
}

// Check if user can play
function canUserPlay(userId) {
    const lastPlayed = localStorage.getItem(`lastPlayed_${userId}`);
    if (!lastPlayed) return true;
    
    const timeSinceLastPlay = Date.now() - parseInt(lastPlayed);
    return timeSinceLastPlay >= COOLDOWN_PERIOD;
}

// Initialize event listeners
document.getElementById('startGame').addEventListener('click', initGame);
document.getElementById('endGameBtn').addEventListener('click', () => endGame());

// Initialize leaderboard on page load
window.addEventListener('load', () => {
});

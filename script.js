// Crypto-related words for the game
const words = ['BITCOIN', 'ETHEREUM', 'BLOCKCHAIN', 'MINING', 'WALLET', 'DEFI', 'TOKEN', 'CRYPTO', 'LEDGER', 'NFT'];
const hiddenWord = 'LEE';
let foundWords = new Set();
let foundHiddenWord = false;
let isGameActive = false;
let startTime;
let gameTimer;
let gameStartTime;

// Constants
const COOLDOWN_HOURS = 24;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

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

// Initialize the game
function initGame() {
    if (!canUserPlay()) {
        showCooldownMessage();
        return;
    }

    // Reset game state
    isGameActive = true;
    foundWords = new Set();
    foundHiddenWord = false;
    selectedCells = [];
    isSelecting = false;
    gameStartTime = new Date();
    
    // Clear and create grid
    createGrid();
    placeWords();
    placeHiddenWord();
    
    // Update UI
    const endGameBtn = document.getElementById('endGameBtn');
    const timer = document.getElementById('timer');
    const gameContent = document.getElementById('gameContent');
    const userIdForm = document.getElementById('userIdForm');
    const wordList = document.getElementById('wordList');
    
    // Update word list display
    if (wordList) {
        wordList.innerHTML = '';
        words.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            li.id = `word-${word}`;
            wordList.appendChild(li);
        });
    }
    
    if (endGameBtn) endGameBtn.disabled = false;
    if (timer) timer.style.color = 'black';
    if (gameContent) gameContent.classList.remove('hidden');
    if (userIdForm) userIdForm.classList.add('hidden');
    
    startTimer();
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

// Place hidden word in the grid
function placeHiddenWord() {
    let placed = false;
    const maxAttempts = 100; // Increased attempts
    let attempts = 0;
    
    while (!placed && attempts < maxAttempts) {
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);
        const directions = [
            [0, 1],   // right
            [1, 0],   // down
            [1, 1],   // diagonal right-down
            [-1, 1],  // diagonal right-up
            [0, -1],  // left
            [-1, 0],  // up
            [-1, -1], // diagonal left-up
            [1, -1]   // diagonal left-down
        ];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        if (canPlaceWordAt(hiddenWord, row, col, direction[0], direction[1])) {
            placeWordAt(hiddenWord, row, col, direction[0], direction[1]);
            console.log(`Hidden word LEE placed at row: ${row}, col: ${col}, direction: [${direction}]`);
            placed = true;
        }
        attempts++;
    }
    
    if (!placed) {
        console.warn('Could not place hidden word after maximum attempts');
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

function canPlaceWordAt(word, row, col, dRow, dCol) {
    const len = word.length;
    
    // Check if word fits within grid bounds
    for (let i = 0; i < len; i++) {
        const newRow = row + (dRow * i);
        const newCol = col + (dCol * i);
        
        if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
            return false;
        }
        
        // Check if cell is empty or matches the letter we want to place
        const currentCell = grid[newRow][newCol];
        if (currentCell !== '' && currentCell !== word[i]) {
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

function placeWordAt(word, row, col, dRow, dCol) {
    const len = word.length;
    for (let i = 0; i < len; i++) {
        const newRow = row + (dRow * i);
        const newCol = col + (dCol * i);
        grid[newRow][newCol] = word[i];
        
        // Update the cell in the DOM
        const cell = document.querySelector(`.grid-cell[data-row="${newRow}"][data-col="${newCol}"]`);
        if (cell) {
            cell.textContent = word[i];
        }
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
    const endTime = new Date();
    const timeTaken = Math.floor((endTime - gameStartTime) / 1000); // Time in seconds
    const score = calculateScore(foundWords.size, foundHiddenWord, timeTaken);
    
    // Save game stats
    const gameStats = {
        userId: getUserId(),
        score: score,
        wordsFound: Array.from(foundWords),
        totalWords: words.length,
        timeTaken: timeTaken,
        hiddenWordFound: foundHiddenWord,
        timestamp: endTime.toISOString()
    };
    
    saveGameStats(gameStats);
    
    // Set cooldown
    localStorage.setItem('lastPlayTime', Date.now().toString());
    
    // Show game summary
    showGameSummary(gameStats);
}

// Calculate score
function calculateScore(wordsFound, hiddenWordFound, timeTaken) {
    let score = wordsFound * 100; // Base score per word
    if (hiddenWordFound) score += 500; // Bonus for hidden word
    if (wordsFound === words.length) {
        // Time bonus for finding all words
        if (timeTaken < 60) score += 1000;
        else if (timeTaken < 120) score += 500;
        else if (timeTaken < 180) score += 250;
    }
    return score;
}

// Get user ID
function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = prompt('Please enter your username:', '');
        if (userId) localStorage.setItem('userId', userId);
        else userId = 'anonymous';
    }
    return userId;
}

// Show game summary
function showGameSummary(stats) {
    const nextPlayTime = new Date(Date.now() + COOLDOWN_MS);
    let message = `Game Over!\n\n`;
    message += `Score: ${stats.score}\n`;
    message += `Words Found: ${stats.wordsFound.length}/${stats.totalWords}\n`;
    message += `Time: ${Math.floor(stats.timeTaken / 60)}m ${stats.timeTaken % 60}s\n`;
    message += `Hidden Word (LEE): ${stats.hiddenWordFound ? 'Found! (+500 points)' : 'Not Found'}\n\n`;
    message += `Come back at ${nextPlayTime.toLocaleString()} for your next game!\n`;
    message += `(${COOLDOWN_HOURS} hour cooldown)`;
    
    alert(message);
}

// Save game stats
function saveGameStats(stats) {
    let gameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    gameHistory.push(stats);
    localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
}

// Check if user can play
function canUserPlay() {
    const lastPlayTime = localStorage.getItem('lastPlayTime');
    if (!lastPlayTime) return true;
    
    const timeSinceLastPlay = Date.now() - parseInt(lastPlayTime);
    return timeSinceLastPlay >= COOLDOWN_MS;
}

// Show cooldown message
function showCooldownMessage() {
    const lastPlayTime = parseInt(localStorage.getItem('lastPlayTime'));
    const nextPlayTime = new Date(lastPlayTime + COOLDOWN_MS);
    const timeUntilNext = nextPlayTime - Date.now();
    
    const hours = Math.floor(timeUntilNext / (60 * 60 * 1000));
    const minutes = Math.floor((timeUntilNext % (60 * 60 * 1000)) / (60 * 1000));
    
    alert(`Please come back in ${hours} hours and ${minutes} minutes for the next game!`);
}

// Initialize event listeners
document.getElementById('startGame').addEventListener('click', initGame);
document.getElementById('endGameBtn').addEventListener('click', () => endGame());

// Initialize leaderboard on page load
window.addEventListener('load', () => {
});

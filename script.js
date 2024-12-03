// Game configuration
const GRID_SIZE = 15;
const words = [
    'BITCOIN', 'ETHEREUM', 'BLOCKCHAIN', 'MINING', 'WALLET', 
    'DEFI', 'TOKEN', 'CRYPTO', 'LEDGER', 'NFT',
    'SOLANA', 'CARDANO', 'POLYGON', 'AVALANCHE', 'BINANCE',
    'STAKING', 'YIELD', 'DOGE', 'SHIBA', 'METAMASK',
    'AIRDROP', 'ALTCOIN', 'HODL', 'BULLISH', 'BEARISH'
];
const HIDDEN_WORDS = ['KEITH', 'MOON', 'LAMBO', 'WAGMI'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Game state
let grid = [];
let foundWords = new Set();
let hiddenWordsFound = new Set();
let score = 0;
let isGameActive = false;
let selectedCells = [];
let isSelecting = false;
let timer;
let seconds = 0;
let tgUsername = '';

// Initialize grid
function initGrid() {
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
    // Place hidden words first
    HIDDEN_WORDS.forEach(word => placeWord(word));
    // Then place regular words
    words.forEach(word => placeWord(word));
    fillEmptyCells();
}

function placeWord(word) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
        const direction = Math.random() < 0.5;
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        if (canPlaceWord(word, row, col, direction)) {
            for (let i = 0; i < word.length; i++) {
                if (direction) grid[row][col + i] = word[i];
                else grid[row + i][col] = word[i];
            }
            placed = true;
        }
        attempts++;
    }
}

function canPlaceWord(word, row, col, direction) {
    if (direction) {
        if (col + word.length > GRID_SIZE) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row][col + i] !== '' && grid[row][col + i] !== word[i]) return false;
        }
    } else {
        if (row + word.length > GRID_SIZE) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row + i][col] !== '' && grid[row + i][col] !== word[i]) return false;
        }
    }
    return true;
}

function fillEmptyCells() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === '') {
                grid[row][col] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
            }
        }
    }
}

// Game UI
function createGrid() {
    const gameBoard = document.getElementById('gameBoard');
    if (!gameBoard) return;
    
    // Clear existing content
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.textContent = grid[row][col];
            cell.addEventListener('mousedown', startSelection);
            cell.addEventListener('mouseover', updateSelection);
            cell.addEventListener('mouseup', endSelection);
            cell.addEventListener('touchstart', handleTouchStart, { passive: false });
            cell.addEventListener('touchmove', handleTouchMove, { passive: false });
            cell.addEventListener('touchend', handleTouchEnd);
            gameBoard.appendChild(cell);
        }
    }
}

function updateWordList() {
    const wordList = document.getElementById('wordList');
    if (!wordList) return;
    wordList.innerHTML = words.map(word => 
        `<li class="${foundWords.has(word) ? 'found' : ''}">${word}</li>`
    ).join('');
}

// Game interaction
function startSelection(event) {
    if (!isGameActive) return;
    const cell = event.target.closest('.grid-cell');
    if (!cell) return;
    
    isSelecting = true;
    selectedCells = [cell];
    cell.classList.add('selected');
}

function updateSelection(event) {
    if (!isGameActive || !isSelecting) return;
    const cell = event.target.closest('.grid-cell');
    if (!cell || selectedCells.includes(cell)) return;
    
    // Check if the cell is adjacent to the last selected cell
    const lastCell = selectedCells[selectedCells.length - 1];
    const lastRect = lastCell.getBoundingClientRect();
    const currentRect = cell.getBoundingClientRect();
    
    const isAdjacent = 
        Math.abs(lastRect.left - currentRect.left) <= lastRect.width * 1.5 &&
        Math.abs(lastRect.top - currentRect.top) <= lastRect.height * 1.5;
    
    if (isAdjacent) {
        selectedCells.push(cell);
        cell.classList.add('selected');
    }
}

function endSelection() {
    if (!isGameActive || !isSelecting) return;
    isSelecting = false;
    
    const word = selectedCells.map(cell => cell.textContent).join('');
    const reverseWord = word.split('').reverse().join('');
    
    // Check for regular words
    if ((words.includes(word) || words.includes(reverseWord)) && !foundWords.has(word) && !foundWords.has(reverseWord)) {
        const foundWord = words.includes(word) ? word : reverseWord;
        foundWords.add(foundWord);
        score += 100;
        document.getElementById('score').textContent = score;
        
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.add('found');
        });
        
        updateWordList();
        
        if (foundWords.size === words.length && hiddenWordsFound.size === HIDDEN_WORDS.length) {
            endGame();
        }
    }
    // Check for hidden words
    else if ((HIDDEN_WORDS.includes(word) || HIDDEN_WORDS.includes(reverseWord)) && 
             !hiddenWordsFound.has(word) && !hiddenWordsFound.has(reverseWord)) {
        const foundWord = HIDDEN_WORDS.includes(word) ? word : reverseWord;
        hiddenWordsFound.add(foundWord);
        score += 500; // Bonus points for finding hidden word
        document.getElementById('score').textContent = score;
        
        // Special animation for hidden word
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.add('found-hidden');
            // Add temporary celebration animation
            cell.classList.add('celebrate');
            setTimeout(() => cell.classList.remove('celebrate'), 1000);
        });
        
        // Show celebration message
        const message = `Congratulations! You found the hidden word "${foundWord}"! +500 points!`;
        alert(message);
        
        if (foundWords.size === words.length && hiddenWordsFound.size === HIDDEN_WORDS.length) {
            endGame();
        }
    } else {
        // Remove selection if word is not valid
        selectedCells.forEach(cell => cell.classList.remove('selected'));
    }
    
    selectedCells = [];
}

// Touch support
function handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    if (cell && cell.classList.contains('grid-cell')) {
        startSelection({ target: cell });
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    if (cell && cell.classList.contains('grid-cell')) {
        updateSelection({ target: cell });
    }
}

function handleTouchEnd() {
    endSelection();
}

// Timer functions
function startTimer() {
    timer = setInterval(() => {
        seconds++;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = display;
}

function stopTimer() {
    clearInterval(timer);
}

// Game lifecycle
function initGame() {
    document.getElementById('startGameBtn').addEventListener('click', handleStartGame);
    
    // Touch event listeners
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.addEventListener('touchstart', handleTouchStart);
    gameBoard.addEventListener('touchmove', handleTouchMove);
    gameBoard.addEventListener('touchend', handleTouchEnd);
    
    // Mouse event listeners
    gameBoard.addEventListener('mousedown', startSelection);
    gameBoard.addEventListener('mousemove', updateSelection);
    gameBoard.addEventListener('mouseup', endSelection);
}

function handleStartGame() {
    const usernameInput = document.getElementById('tgUsername');
    tgUsername = usernameInput.value.trim();
    
    if (!tgUsername) {
        alert('Please enter your Telegram username');
        return;
    }
    
    // Remove @ if user included it
    tgUsername = tgUsername.replace('@', '');
    
    // Hide the overlay
    document.getElementById('signInOverlay').classList.add('hidden');
    
    // Start the game
    startGame();
}

function startGame() {
    isGameActive = true;
    score = 0;
    seconds = 0;
    foundWords.clear();
    hiddenWordsFound.clear();
    
    initGrid();
    createGrid();
    updateWordList();
    startTimer();
    
    document.getElementById('score').textContent = '0';
    document.getElementById('timer').textContent = '00:00';
}

function endGame() {
    if (!isGameActive) return;
    
    isGameActive = false;
    stopTimer();
    
    const timeSpent = document.getElementById('timer').textContent;
    const finalScore = score;
    const hiddenWordsFoundCount = hiddenWordsFound.size;
    
    let message = `Game Over!\nTelegram Username: @${tgUsername}\nFinal Score: ${finalScore}\nTime: ${timeSpent}`;
    if (hiddenWordsFoundCount > 0) {
        message += `\nHidden Words Found: ${hiddenWordsFoundCount}/${HIDDEN_WORDS.length}`;
    }
    
    alert(message);
}

// Initialize game
document.addEventListener('DOMContentLoaded', initGame);
document.getElementById('endGameBtn')?.addEventListener('click', endGame);

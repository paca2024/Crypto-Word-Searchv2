// Crypto-related words for the game
const words = [
    'BITCOIN',
    'ETHEREUM',
    'BLOCKCHAIN',
    'MINING',
    'WALLET',
    'DEFI',
    'TOKEN',
    'CRYPTO',
    'LEDGER',
    'NFT'
];
const hiddenWord = 'FINANCE';

// Constants
const COOLDOWN_HOURS = 24;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

// Game configuration
const GRID_SIZE = 15;
const directions = [
    'horizontal', 
    'vertical', 
    'diagonal-right', 
    'diagonal-left'
];

// Point system
const POINTS_PER_WORD = 100;
const HIDDEN_WORD_BONUS = 500;
const TIME_BONUSES = {
    60: 1000,  // Complete under 60 seconds: 1000 points
    120: 750,  // Complete under 120 seconds: 750 points
    180: 500,  // Complete under 180 seconds: 500 points
    240: 250   // Complete under 240 seconds: 250 points
};

// Game state
let gameState = {
    grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('')),
    score: 0,
    isGameActive: false,
    timerInterval: null,
    foundWords: new Set(),
    foundHiddenWord: false,
    hiddenWordPositions: []
};

// Selection state
let selectionState = {
    isSelecting: false,
    selectedCells: [],
    currentDirection: null,
    touchStartCell: null
};

// Timer state
let timerState = {
    startTime: 0,
    elapsedTime: 0
};

// Anti-cheat measures
const antiCheat = {
    lastAction: Date.now(),
    actionCount: 0,
    suspiciousActions: 0,
    maxActionsPerSecond: 5,
    maxSuspiciousActions: 3,
    penaltyScore: 0,
    
    resetCounts() {
        this.actionCount = 0;
        this.lastAction = Date.now();
    },
    
    checkAction() {
        const now = Date.now();
        const timeDiff = now - this.lastAction;
        
        // Reset counts if more than a second has passed
        if (timeDiff > 1000) {
            this.resetCounts();
        }
        
        this.actionCount++;
        
        // Check for rapid actions
        if (this.actionCount > this.maxActionsPerSecond) {
            this.handleSuspiciousActivity('Rapid actions detected');
            return false;
        }
        
        this.lastAction = now;
        return true;
    },
    
    checkWordSelection(selectedCells) {
        // Check for impossible movements
        for (let i = 1; i < selectedCells.length; i++) {
            const prev = selectedCells[i - 1];
            const curr = selectedCells[i];
            const rowDiff = Math.abs(curr.dataset.row - prev.dataset.row);
            const colDiff = Math.abs(curr.dataset.col - prev.dataset.col);
            
            // Check for non-adjacent cells or diagonal jumps
            if (rowDiff > 1 || colDiff > 1) {
                this.handleSuspiciousActivity('Invalid cell selection pattern');
                return false;
            }
        }
        return true;
    },
    
    handleSuspiciousActivity(reason) {
        console.warn('Suspicious activity detected:', reason);
        this.suspiciousActions++;
        this.penaltyScore += 50;
        
        if (this.suspiciousActions >= this.maxSuspiciousActions) {
            this.penalizePlayer();
        }
    },
    
    penalizePlayer() {
        gameState.score = Math.max(0, gameState.score - this.penaltyScore);
        alert('Suspicious activity detected. Score penalty applied.');
        endGame();
    }
};

function updateTimer() {
    const timerElement = document.getElementById('timer');
    if (!timerElement || !timerState.startTime) return;

    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    timerState.startTime = Date.now();
    gameState.timerInterval = setInterval(updateTimer, 1000);
    updateTimer(); // Update immediately
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    timerState.startTime = null;
}

function createGrid() {
    // Initialize grid with empty cells
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            gameState.grid[i][j] = '';
        }
    }
}

function updateGridDisplay() {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = ''; // Clear existing grid
    
    // Create grid cells
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.textContent = gameState.grid[row][col];
            
            // Add event listeners
            cell.addEventListener('mousedown', handleMouseDown);
            cell.addEventListener('mouseover', handleMouseOver);
            cell.addEventListener('mouseup', handleMouseUp);
            cell.addEventListener('touchstart', handleTouchStart, { passive: false });
            cell.addEventListener('touchmove', handleTouchMove, { passive: false });
            cell.addEventListener('touchend', handleTouchEnd);
            
            gridElement.appendChild(cell);
        }
    }
}

function updateWordList() {
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';

    // Create word list container
    const listContainer = document.createElement('div');
    listContainer.className = 'word-list-container';

    // Add regular words
    const regularWords = document.createElement('div');
    regularWords.className = 'regular-words';
    
    words.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item';
        wordElement.textContent = word;
        if (gameState.foundWords.has(word)) {
            wordElement.classList.add('found');
        }
        regularWords.appendChild(wordElement);
    });
    listContainer.appendChild(regularWords);

    // Add separator
    const separator = document.createElement('div');
    separator.className = 'word-list-separator';
    listContainer.appendChild(separator);

    // Add hidden word section
    const hiddenWordSection = document.createElement('div');
    hiddenWordSection.className = 'hidden-word-section';
    
    const hiddenWordTitle = document.createElement('div');
    hiddenWordTitle.className = 'hidden-word-title';
    hiddenWordTitle.textContent = 'Hidden Word';
    
    const hiddenWordDisplay = document.createElement('div');
    hiddenWordDisplay.className = 'hidden-word-display';
    if (gameState.foundHiddenWord) {
        hiddenWordDisplay.textContent = hiddenWord;
        hiddenWordDisplay.classList.add('found');
    } else {
        hiddenWordDisplay.textContent = '?????';
    }
    
    hiddenWordSection.appendChild(hiddenWordTitle);
    hiddenWordSection.appendChild(hiddenWordDisplay);
    listContainer.appendChild(hiddenWordSection);

    // Add everything to the word list
    wordList.appendChild(listContainer);
}

// Add styles for the new word list structure
const wordListStyles = document.createElement('style');
wordListStyles.textContent = `
    .word-list-container {
        padding: 15px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .regular-words {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
        margin-bottom: 15px;
    }

    .word-item {
        padding: 8px 12px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        text-align: center;
        transition: all 0.3s ease;
    }

    .word-item.found {
        background: #E8F5E9;
        color: #2E7D32;
        text-decoration: line-through;
        border-color: #A5D6A7;
    }

    .word-list-separator {
        height: 2px;
        background: linear-gradient(to right, transparent, #e0e0e0, transparent);
        margin: 15px 0;
    }

    .hidden-word-section {
        text-align: center;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 6px;
        border: 2px solid #e9ecef;
    }

    .hidden-word-title {
        font-size: 0.9em;
        color: #6c757d;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .hidden-word-display {
        font-size: 1.2em;
        font-weight: bold;
        color: #495057;
        padding: 8px;
    }

    .hidden-word-display.found {
        color: #0277BD;
        background: linear-gradient(135deg, #E1F5FE, #B3E5FC);
        border-radius: 4px;
        animation: hiddenWordGlow 2s infinite;
    }

    @keyframes hiddenWordGlow {
        0% { box-shadow: 0 0 5px rgba(3, 169, 244, 0.3); }
        50% { box-shadow: 0 0 15px rgba(3, 169, 244, 0.5); }
        100% { box-shadow: 0 0 5px rgba(3, 169, 244, 0.3); }
    }
`;
document.head.appendChild(wordListStyles);

function handleMouseDown(event) {
    event.preventDefault();
    if (!gameState.isGameActive) return;
    
    if (!antiCheat.checkAction()) {
        resetSelection();
        return;
    }
    
    isSelecting = true;
    const cell = event.target;
    selectCell(cell);
}

function handleMouseOver(event) {
    if (!isSelecting || !gameState.isGameActive) return;
    
    const cell = event.target;
    if (selectedCells.length === 0) {
        selectCell(cell);
        return;
    }
    
    // Check if cell follows current direction
    const lastCell = selectedCells[selectedCells.length - 1];
    if (isValidNextCell(lastCell, cell)) {
        selectCell(cell);
    }
}

function handleMouseUp() {
    if (!gameState.isGameActive) return;
    
    checkSelectedWord();
    resetSelection();
}

function handleTouchStart(event) {
    event.preventDefault();
    if (!gameState.isGameActive) return;
    
    if (!antiCheat.checkAction()) {
        resetSelection();
        return;
    }
    
    const touch = event.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    if (cell && cell.classList.contains('grid-cell')) {
        isSelecting = true;
        touchStartCell = cell;
        selectCell(cell);
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    if (!isSelecting || !gameState.isGameActive) return;
    
    const touch = event.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    if (cell && cell.classList.contains('grid-cell')) {
        if (selectedCells.length === 0) {
            selectCell(cell);
            return;
        }
        
        const lastCell = selectedCells[selectedCells.length - 1];
        if (isValidNextCell(lastCell, cell)) {
            selectCell(cell);
        }
    }
}

function handleTouchEnd() {
    if (!gameState.isGameActive) return;
    
    checkSelectedWord();
    resetSelection();
}

function selectCell(cell) {
    if (!cell || !cell.classList.contains('grid-cell')) return;
    
    // If this is the first cell or it follows the current direction
    if (selectedCells.length === 0 || isValidNextCell(selectedCells[selectedCells.length - 1], cell)) {
        if (!selectedCells.includes(cell)) {
            cell.classList.add('selected');
            selectedCells.push(cell);
            
            // Establish direction after second cell
            if (selectedCells.length === 2) {
                const first = selectedCells[0];
                const second = selectedCells[1];
                currentDirection = {
                    row: Math.sign(second.dataset.row - first.dataset.row),
                    col: Math.sign(second.dataset.col - first.dataset.col)
                };
            }
        }
    }
}

function isValidNextCell(lastCell, newCell) {
    if (!lastCell || !newCell) return false;
    
    const lastRow = parseInt(lastCell.dataset.row);
    const lastCol = parseInt(lastCell.dataset.col);
    const newRow = parseInt(newCell.dataset.row);
    const newCol = parseInt(newCell.dataset.col);
    
    // If this is the second cell, any adjacent cell is valid
    if (selectedCells.length === 1) {
        const rowDiff = Math.abs(newRow - lastRow);
        const colDiff = Math.abs(newCol - lastCol);
        return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0);
    }
    
    // Otherwise, cell must follow the established direction
    return (newRow - lastRow === currentDirection.row && 
            newCol - lastCol === currentDirection.col);
}

function resetSelection() {
    isSelecting = false;
    currentDirection = null;
    touchStartCell = null;
    
    selectedCells.forEach(cell => {
        cell.classList.remove('selected');
    });
    selectedCells = [];
}

function checkSelectedWord() {
    if (selectedCells.length < 2) return;
    
    // Anti-cheat checks
    if (!antiCheat.checkAction() || !antiCheat.checkWordSelection(selectedCells)) {
        resetSelection();
        return;
    }
    
    // Get word from selected cells
    const word = selectedCells.map(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        return gameState.grid[row][col];
    }).join('');
    
    // Check if word matches any target word
    if (words.includes(word) && !gameState.foundWords.has(word)) {
        gameState.foundWords.add(word);
        gameState.score += 100;
        selectedCells.forEach(cell => {
            cell.classList.add('found');
        });
        updateWordList();
    }
    // Check if word matches hidden word
    else if (word === hiddenWord && !gameState.foundHiddenWord) {
        gameState.foundHiddenWord = true;
        gameState.score += 500;
        selectedCells.forEach(cell => {
            cell.classList.add('hidden-word-found');
        });
        updateWordList();
    }
    
    // Check if game is complete
    if (gameState.foundWords.size === words.length && gameState.foundHiddenWord) {
        stopTimer();
        gameState.isGameActive = false;
        alert(`Congratulations! You've found all words!\nFinal Score: ${gameState.score}\nTime: ${document.getElementById('timer').textContent}`);
    }
}

function initializeEventListeners() {
    const gridElement = document.getElementById('grid');
    if (!gridElement) {
        console.error('Grid element not found');
        return;
    }

    // Mouse events
    gridElement.addEventListener('mousedown', (event) => {
        const cell = event.target;
        if (cell.classList.contains('grid-cell')) {
            isSelecting = true;
            startSelection(cell);
        }
    });

    document.addEventListener('mousemove', (event) => {
        if (!isSelecting) return;
        const cell = event.target;
        if (cell.classList.contains('grid-cell')) {
            updateSelection(cell);
        }
    });

    document.addEventListener('mouseup', () => {
        if (!isSelecting) return;
        endSelection();
        gameState.isGameActive = false;
    });

    // Touch events
    gridElement.addEventListener('touchstart', (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        const cell = document.elementFromPoint(touch.clientX, touch.clientY);
        if (cell && cell.classList.contains('grid-cell')) {
            isSelecting = true;
            startSelection(cell);
        }
    }, { passive: false });

    document.addEventListener('touchmove', (event) => {
        event.preventDefault();
        if (!isSelecting) return;
        const touch = event.touches[0];
        const cell = document.elementFromPoint(touch.clientX, touch.clientY);
        if (cell && cell.classList.contains('grid-cell')) {
            updateSelection(cell);
        }
    }, { passive: false });

    document.addEventListener('touchend', (event) => {
        event.preventDefault();
        if (!isSelecting) return;
        endSelection();
        isSelecting = false;
    }, { passive: false });

    // Prevent text selection during drag
    gridElement.addEventListener('selectstart', (e) => e.preventDefault());
}

function startSelection(cell) {
    if (!gameState.isGameActive) return;
    
    if (!antiCheat.checkAction()) {
        resetSelection();
        return;
    }
    
    selectedCells = [cell];
    cell.classList.add('selected');
    currentDirection = null;
}

function updateSelection(cell) {
    if (!gameState.isGameActive || !isSelecting || !cell || !cell.classList.contains('grid-cell')) return;
    
    const lastCell = selectedCells[selectedCells.length - 1];
    if (!lastCell) return;

    // If going back to previous cell
    if (selectedCells.length > 1 && cell === selectedCells[selectedCells.length - 2]) {
        const removedCell = selectedCells.pop();
        removedCell.classList.remove('selected');
        return;
    }

    // If cell is already selected, ignore
    if (selectedCells.includes(cell)) return;

    // Check if the new cell is adjacent to the last selected cell
    const row1 = parseInt(lastCell.dataset.row);
    const col1 = parseInt(lastCell.dataset.col);
    const row2 = parseInt(cell.dataset.row);
    const col2 = parseInt(cell.dataset.col);
    
    // Calculate direction
    const rowDiff = row2 - row1;
    const colDiff = col2 - col1;
    
    // Store direction for visual guides
    if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) {
        currentDirection = { row: rowDiff, col: colDiff };
        cell.classList.add('selected');
        selectedCells.push(cell);
    }
}

function endSelection() {
    if (!gameState.isGameActive || selectedCells.length < 2) {
        selectedCells.forEach(cell => cell.classList.remove('selected'));
        selectedCells = [];
        return;
    }

    const word = selectedCells.map(cell => cell.textContent).join('');
    
    if (words.includes(word) && !gameState.foundWords.has(word)) {
        gameState.foundWords.add(word);
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.add('found');
        });
        updateWordList();
    } else if (word === hiddenWord && !gameState.foundHiddenWord) {
        gameState.foundHiddenWord = true;
        localStorage.setItem('foundHiddenWord', 'true');
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.add('hidden-word-found');
        });
        gameState.score += 500;
        updateWordList();
    } else {
        selectedCells.forEach(cell => cell.classList.remove('selected'));
    }

    selectedCells = [];
    currentDirection = null;
}

function applyHiddenWordHighlight() {
    if (!gameState.foundHiddenWord || !gameState.hiddenWordPositions.length) return;
    
    gameState.hiddenWordPositions.forEach(pos => {
        const cell = document.querySelector(`.grid-cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            cell.classList.remove('selected');
            cell.classList.add('found');
            cell.classList.add('hidden-word');
        }
    });
}

function checkGameCompletion() {
    if (gameState.foundWords.size === words.length) {
        gameState.isGameActive = false;
        stopTimer();
        
        const timerElement = document.getElementById('timer');
        const finalTime = timerElement ? timerElement.textContent : '00:00';
        
        const message = gameState.foundHiddenWord ? 
            `Congratulations! You found all words and the hidden word in ${finalTime}!` :
            `Congratulations! You found all regular words in ${finalTime}! Can you find the hidden word?`;
        
        setTimeout(() => alert(message), 100);
    }
}

function isAdjacent(cell1, cell2) {
    if (!cell1 || !cell2) return false;
    
    const row1 = parseInt(cell1.dataset.row);
    const col1 = parseInt(cell1.dataset.col);
    const row2 = parseInt(cell2.dataset.row);
    const col2 = parseInt(cell2.dataset.col);
    
    // Calculate direction
    const rowDiff = row2 - row1;
    const colDiff = col2 - col1;
    
    // Store direction for visual guides
    if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) {
        currentDirection = { row: rowDiff, col: colDiff };
        return true;
    }
    return false;
}

function getSelectedWord() {
    return selectedCells.map(cell => cell.textContent).join('');
}

function checkWord(word) {
    if (gameState.foundWords.has(word)) return;
    
    if (words.includes(word)) {
        handleWordFound(word);
        return true;
    }
    
    if (word === hiddenWord) {
        handleHiddenWordFound();
        return true;
    }
    
    return false;
}

function restoreHiddenWordHighlight() {
    if (!gameState.foundHiddenWord || !gameState.hiddenWordPositions.length) return;
    
    gameState.hiddenWordPositions.forEach(pos => {
        const cell = document.querySelector(`.grid-cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            cell.classList.remove('selected');
            cell.classList.add('found');
            cell.classList.add('hidden-word');
        }
    });
}

function restoreHiddenWordState() {
    // Restore hidden word positions
    const savedPositions = localStorage.getItem('hiddenWordPositions');
    if (savedPositions) {
        gameState.hiddenWordPositions = JSON.parse(savedPositions);
        
        // If the hidden word was previously found, restore its styling
        if (localStorage.getItem('foundHiddenWord') === 'true') {
            gameState.foundHiddenWord = true;
            gameState.hiddenWordPositions.forEach(pos => {
                const cell = document.querySelector(`.grid-cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
                if (cell) {
                    cell.classList.add('hidden-word-found');
                }
            });
        }
    }
}

function canPlaceWord(word, row, col, direction) {
    const length = word.length;
    
    // Check if word fits within grid bounds
    switch (direction) {
        case 'horizontal':
            if (col + length > GRID_SIZE) return false;
            break;
        case 'vertical':
            if (row + length > GRID_SIZE) return false;
            break;
        case 'diagonal-right':
            if (col + length > GRID_SIZE || row + length > GRID_SIZE) return false;
            break;
        case 'diagonal-left':
            if (col - length < -1 || row + length > GRID_SIZE) return false;
            break;
    }
    
    // Check if cells are empty or match word letters
    for (let i = 0; i < length; i++) {
        let currentRow = row;
        let currentCol = col;
        
        switch (direction) {
            case 'horizontal':
                currentCol = col + i;
                break;
            case 'vertical':
                currentRow = row + i;
                break;
            case 'diagonal-right':
                currentRow = row + i;
                currentCol = col + i;
                break;
            case 'diagonal-left':
                currentRow = row + i;
                currentCol = col - i;
                break;
        }
        
        if (gameState.grid[currentRow][currentCol] !== '' && 
            gameState.grid[currentRow][currentCol] !== word[i]) {
            return false;
        }
    }
    
    return true;
}

function placeWord(word, row, col, direction) {
    console.log(`Placing word: ${word} at (${row},${col}) in direction: ${direction}`);
    const length = word.length;
    
    for (let i = 0; i < length; i++) {
        let currentRow = row;
        let currentCol = col;
        
        switch (direction) {
            case 'horizontal':
                currentCol = col + i;
                break;
            case 'vertical':
                currentRow = row + i;
                break;
            case 'diagonal-right':
                currentRow = row + i;
                currentCol = col + i;
                break;
            case 'diagonal-left':
                currentRow = row + i;
                currentCol = col - i;
                break;
        }
        
        gameState.grid[currentRow][currentCol] = word[i];
    }
}

function placeHiddenWord() {
    console.log('Attempting to place hidden word:', hiddenWord);
    const length = hiddenWord.length;
    const maxAttempts = 100;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`Attempt ${attempts} to create valid grid...`);

        // Reset game state
        gameState.foundWords.clear();
        gameState.foundHiddenWord = false;
        gameState.score = 0;
        selectedCells = [];
        isSelecting = false;
        gameState.hiddenWordPositions = [];
        
        // Stop existing timer
        stopTimer();
        
        // Create grid and place words
        gameState.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
        createGrid();
        
        // Place hidden word first
        let hiddenWordPlaced = placeHiddenWord();
        if (!hiddenWordPlaced) {
            console.log('Failed to place hidden word');
            continue;
        }
        
        // Place regular words
        let allWordsPlaced = true;
        for (const word of words) {
            let placed = false;
            let wordAttempts = 0;
            const maxWordAttempts = 100;
            
            while (!placed && wordAttempts < maxWordAttempts) {
                const row = Math.floor(Math.random() * GRID_SIZE);
                const col = Math.floor(Math.random() * GRID_SIZE);
                const dir = directions[Math.floor(Math.random() * directions.length)];
                
                if (canPlaceWord(word, row, col, dir)) {
                    placeWord(word, row, col, dir);
                    placed = true;
                }
                wordAttempts++;
            }
            
            if (!placed) {
                console.log(`Failed to place word: ${word}`);
                allWordsPlaced = false;
                break;
            }
        }
        
        if (!allWordsPlaced) continue;
        
        // Fill empty cells and verify placement
        fillEmptyCells();
        
        // Verify all words are properly placed
        if (verifyWordPlacement()) {
            return true;
        }
    }

    console.error('Failed to place hidden word after', maxAttempts, 'attempts');
    return false;
}

function fillEmptyCells() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (gameState.grid[i][j] === '') {
                gameState.grid[i][j] = letters.charAt(Math.floor(Math.random() * letters.length));
            }
        }
    }
}

function verifyWordPlacement() {
    const placedWords = new Set();
    
    // Helper function to check a sequence of cells for words
    function checkSequence(startRow, startCol, rowDelta, colDelta, maxLength) {
        let word = '';
        let row = startRow;
        let col = startCol;
        
        for (let i = 0; i < maxLength && row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE; i++) {
            word += gameState.grid[row][col];
            
            // Check if current sequence matches any word
            if (words.includes(word)) {
                console.log(`Found word: ${word} at (${startRow},${startCol})`);
                placedWords.add(word);
            }
            if (word === hiddenWord) {
                console.log(`Found hidden word: ${word} at (${startRow},${startCol})`);
                placedWords.add(word);
            }
            
            row += rowDelta;
            col += colDelta;
        }
    }
    
    // Check all possible starting positions and directions
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            // Horizontal (right)
            checkSequence(row, col, 0, 1, GRID_SIZE - col);
            
            // Vertical (down)
            checkSequence(row, col, 1, 0, GRID_SIZE - row);
            
            // Diagonal right-down
            checkSequence(row, col, 1, 1, Math.min(GRID_SIZE - row, GRID_SIZE - col));
            
            // Diagonal left-down
            checkSequence(row, col, 1, -1, Math.min(GRID_SIZE - row, col + 1));
        }
    }
    
    // Check which words are missing
    const missingWords = words.filter(word => !placedWords.has(word));
    if (missingWords.length > 0) {
        console.error('Missing words in grid:', missingWords);
        return false;
    }
    
    // Check if hidden word is placed
    if (!placedWords.has(hiddenWord)) {
        console.error('Hidden word not found in grid:', hiddenWord);
        return false;
    }
    
    console.log('All words successfully verified in grid:', Array.from(placedWords));
    return true;
}

// Generate a random user ID if not exists
if (!localStorage.getItem('userId')) {
    const userId = Math.random().toString(36).substr(2, 9).toUpperCase();
    localStorage.setItem('userId', userId);
}

function showGameSummary() {
    const userId = localStorage.getItem('userId');
    const gameSummary = document.getElementById('gameSummary');
    const userIdElement = document.getElementById('userId');
    const finalScoreElement = document.getElementById('finalScore');
    const hiddenWordStatusElement = document.getElementById('hiddenWordStatus');
    
    userIdElement.textContent = userId;
    finalScoreElement.textContent = gameState.score;
    hiddenWordStatusElement.textContent = gameState.foundHiddenWord ? 'Yes' : 'No';
    
    gameSummary.classList.remove('hidden');
}

function hideGameSummary() {
    const gameSummary = document.getElementById('gameSummary');
    gameSummary.classList.add('hidden');
}

function endGame() {
    // Stop the timer
    stopTimer();
    
    // Disable further interactions
    gameState.isGameActive = false;
    
    // Show game summary
    showGameSummary();
}

// Add event listener for new game button
document.addEventListener('DOMContentLoaded', () => {
    const newGameBtn = document.getElementById('newGameBtn');
    const endGameBtn = document.getElementById('endGameBtn');
    const closeSummaryBtn = document.getElementById('closeSummaryBtn');
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', initGame);
    }
    
    if (endGameBtn) {
        endGameBtn.addEventListener('click', endGame);
    }
    
    if (closeSummaryBtn) {
        closeSummaryBtn.addEventListener('click', hideGameSummary);
    }
    
    // Reset anti-cheat
    antiCheat.resetCounts();
    antiCheat.suspiciousActions = 0;
    antiCheat.penaltyScore = 0;
    
    initGame();
});

// Initialize the game
function initGame() {
    let attempts = 0;
    const maxAttempts = 5;
    let success = false;

    // Reset anti-cheat
    antiCheat.resetCounts();
    antiCheat.suspiciousActions = 0;
    antiCheat.penaltyScore = 0;

    while (attempts < maxAttempts && !success) {
        attempts++;
        console.log(`Attempt ${attempts} to create valid grid...`);

        // Reset game state
        gameState.foundWords.clear();
        gameState.foundHiddenWord = false;
        gameState.score = 0;
        selectedCells = [];
        isSelecting = false;
        gameState.hiddenWordPositions = [];
        
        // Stop existing timer
        stopTimer();
        
        // Create grid and place words
        gameState.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
        createGrid();
        
        // Place hidden word first
        let hiddenWordPlaced = placeHiddenWord();
        if (!hiddenWordPlaced) {
            console.log('Failed to place hidden word');
            continue;
        }
        
        // Place regular words
        let allWordsPlaced = true;
        for (const word of words) {
            let placed = false;
            let wordAttempts = 0;
            const maxWordAttempts = 100;
            
            while (!placed && wordAttempts < maxWordAttempts) {
                const row = Math.floor(Math.random() * GRID_SIZE);
                const col = Math.floor(Math.random() * GRID_SIZE);
                const dir = directions[Math.floor(Math.random() * directions.length)];
                
                if (canPlaceWord(word, row, col, dir)) {
                    placeWord(word, row, col, dir);
                    placed = true;
                }
                wordAttempts++;
            }
            
            if (!placed) {
                console.log(`Failed to place word: ${word}`);
                allWordsPlaced = false;
                break;
            }
        }
        
        if (!allWordsPlaced) continue;
        
        // Fill empty cells and verify placement
        fillEmptyCells();
        
        // Verify all words are properly placed
        if (verifyWordPlacement()) {
            success = true;
            console.log('Successfully created valid grid!');
        }
    }

    if (!success) {
        alert('Unable to create a valid word search grid. Please try again.');
        return;
    }

    // Update display
    updateGridDisplay();
    updateWordList();
    
    // Start the game
    gameState.isGameActive = true;
    startTimer();
}

// Event handling variables
let isSelecting = false;
let selectedCells = [];
let currentDirection = null;
let touchStartCell = null;

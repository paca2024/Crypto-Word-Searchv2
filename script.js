// Crypto-related words for the game
const words = ['BITCOIN', 'ETHEREUM', 'BLOCKCHAIN', 'MINING', 'WALLET', 'DEFI', 'TOKEN', 'CRYPTO', 'LEDGER', 'NFT'];
const hiddenWord = 'LEE';
let foundWords = new Set();
let foundHiddenWord = false;
let gameTimer;
let startTime;
let isGameActive = false;

// Point system
const POINTS_PER_WORD = 100;
const HIDDEN_WORD_BONUS = 500;
const TIME_BONUSES = {
    60: 1000,  // Complete under 60 seconds: 1000 points
    120: 750,  // Complete under 120 seconds: 750 points
    180: 500,  // Complete under 180 seconds: 500 points
    240: 250   // Complete under 240 seconds: 250 points
};

// Grid configuration
const gridSize = 15;
const grid = [];
let selectedCells = [];
let isSelecting = false;
let lastTouchedCell = null;

// Cooldown period
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize the game
function initGame() {
    const userId = document.getElementById('userId').value.trim();
    if (!userId) {
        alert('Please enter a user ID to start the game');
        return;
    }
    
    // Check if user can play
    if (!canUserPlay(userId)) {
        const lastPlayed = parseInt(localStorage.getItem(`lastPlayed_${userId}`));
        const nextPlayTime = new Date(lastPlayed + COOLDOWN_PERIOD);
        alert(`You can play your next game on:\n${nextPlayTime.toLocaleString()}`);
        return;
    }
    
    document.getElementById('userIdForm').classList.add('hidden');
    document.getElementById('gameContent').classList.remove('hidden');
    
    // Show admin controls only for @Markuk2021
    if (userId === '@Markuk2021') {
        document.getElementById('adminControls').classList.remove('hidden');
    }
    
    createGrid();
    placeWords();
    displayWords();
    startTimer();
    isGameActive = true;
}

// Create the grid
function createGrid() {
    const wordGrid = document.getElementById('wordGrid');
    wordGrid.innerHTML = '';
    
    // Create grid cells
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            wordGrid.appendChild(cell);
            grid[i][j] = cell;
        }
    }

    // Add event listeners to the grid
    wordGrid.addEventListener('mousedown', function(e) {
        e.preventDefault();
        const cell = e.target.closest('.grid-cell');
        if (cell) {
            isSelecting = true;
            selectedCells = [cell];
            cell.classList.add('selected');
        }
    });

    wordGrid.addEventListener('mouseover', function(e) {
        if (!isSelecting) return;
        
        const cell = e.target.closest('.grid-cell');
        if (!cell || selectedCells.includes(cell)) return;

        const lastCell = selectedCells[selectedCells.length - 1];
        const lastRow = parseInt(lastCell.dataset.row);
        const lastCol = parseInt(lastCell.dataset.col);
        const currentRow = parseInt(cell.dataset.row);
        const currentCol = parseInt(cell.dataset.col);

        const rowDiff = Math.abs(currentRow - lastRow);
        const colDiff = Math.abs(currentCol - lastCol);

        if (rowDiff <= 1 && colDiff <= 1) {
            selectedCells.push(cell);
            cell.classList.add('selected');
        }
    });

    document.addEventListener('mouseup', function() {
        if (isSelecting) {
            isSelecting = false;
            const word = selectedCells.map(cell => cell.textContent).join('');
            const reverseWord = word.split('').reverse().join('');
            
            if (words.includes(word) && !foundWords.has(word)) {
                foundWords.add(word);
                markWordAsFound(word);
                checkGameCompletion();
            } else if (word === hiddenWord || reverseWord === hiddenWord) {
                foundHiddenWord = true;
                alert('Congratulations! You found the hidden word LEE!');
            }
            
            selectedCells.forEach(cell => cell.classList.remove('selected'));
            selectedCells = [];
        }
    });

    // Fill grid with random letters
    fillGridWithRandomLetters();
}

// Fill grid with random letters
function fillGridWithRandomLetters() {
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j].textContent === '') {
                grid[i][j].textContent = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
    }
}

// Place words in the grid
function placeWords() {
    const allWords = [...words, hiddenWord];
    
    for (const word of allWords) {
        let placed = false;
        while (!placed) {
            const direction = Math.floor(Math.random() * 8);
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);
            
            if (canPlaceWord(word, row, col, direction)) {
                placeWord(word, row, col, direction);
                placed = true;
            }
        }
    }
}

// Check if a word can be placed at the given position and direction
function canPlaceWord(word, row, col, direction) {
    const dirs = [
        [0, 1],   // right
        [1, 0],   // down
        [1, 1],   // diagonal down-right
        [-1, 1],  // diagonal up-right
        [0, -1],  // left
        [-1, 0],  // up
        [-1, -1], // diagonal up-left
        [1, -1]   // diagonal down-left
    ];

    const [dRow, dCol] = dirs[direction];
    
    for (let i = 0; i < word.length; i++) {
        const newRow = row + (dRow * i);
        const newCol = col + (dCol * i);
        
        if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
            return false;
        }
        
        if (grid[newRow][newCol].textContent !== '' && grid[newRow][newCol].textContent !== word[i]) {
            return false;
        }
    }
    
    return true;
}

// Place a word in the grid
function placeWord(word, row, col, direction) {
    const dirs = [
        [0, 1], [1, 0], [1, 1], [-1, 1],
        [0, -1], [-1, 0], [-1, -1], [1, -1]
    ];
    
    const [dRow, dCol] = dirs[direction];
    
    for (let i = 0; i < word.length; i++) {
        const newRow = row + (dRow * i);
        const newCol = col + (dCol * i);
        grid[newRow][newCol].textContent = word[i];
    }
}

// Display the word list
function displayWords() {
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';
    words.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        li.id = `word-${word}`;
        wordList.appendChild(li);
    });
}

// Check if the game is complete
function checkGameCompletion() {
    if (foundWords.size === words.length) {
        endGame(true);
    }
}

// Calculate score based on words found, hidden word, and time
function calculateScore(wordsFound, foundHidden, timeInSeconds) {
    let score = wordsFound * POINTS_PER_WORD;
    
    // Add bonus for hidden word
    if (foundHidden) {
        score += HIDDEN_WORD_BONUS;
    }
    
    // Add time bonus if all words found
    if (wordsFound === words.length) {
        for (const [threshold, bonus] of Object.entries(TIME_BONUSES)) {
            if (timeInSeconds <= threshold) {
                score += bonus;
                break;
            }
        }
    }
    
    return score;
}

// End game function
function endGame(completed = false) {
    if (!isGameActive) return;
    
    isGameActive = false;
    clearInterval(gameTimer);
    const endTime = Date.now();
    const timeInSeconds = Math.floor((endTime - startTime) / 1000);
    
    // Calculate score
    const score = calculateScore(foundWords.size, foundHiddenWord, timeInSeconds);
    
    // Get current user
    const userId = document.getElementById('userId').value.trim();
    
    // Generate verification hash
    const verificationHash = generateVerificationHash(userId, score, foundWords.size, timeInSeconds, foundHiddenWord);
    
    // Update leaderboard with verification hash
    updateLeaderboard(userId, timeInSeconds, foundWords.size, foundHiddenWord, score, verificationHash);
    
    // Set last played time for this user
    const lastPlayedTime = Date.now();
    localStorage.setItem(`lastPlayed_${userId}`, lastPlayedTime);
    
    // Calculate next available play time
    const nextPlayTime = new Date(lastPlayedTime + COOLDOWN_PERIOD);
    const nextPlayTimeString = nextPlayTime.toLocaleString();
    
    // Create game over message
    let message = 'Game Over!\n\n';
    message += `Score: ${score} points\n`;
    message += `Words Found: ${foundWords.size}/${words.length}\n`;
    message += `Time: ${Math.floor(timeInSeconds / 60)}m ${timeInSeconds % 60}s\n`;
    if (foundHiddenWord) {
        message += 'Hidden Word Found: Yes! (+500 points)\n';
    }
    message += '\n------------------------\n';
    message += `Verification Hash: ${verificationHash}\n`;
    message += '------------------------\n\n';
    message += 'Thank you for playing!\n';
    message += 'Come back tomorrow for a new game.\n\n';
    message += `Next game available:\n${nextPlayTimeString}`;
    
    // Show message
    alert(message);
    
    // Disable the game interface
    const wordGrid = document.getElementById('wordGrid');
    wordGrid.style.opacity = '0.6';
    wordGrid.style.pointerEvents = 'none';
    
    // Update UI elements
    document.getElementById('endGame').disabled = true;
    document.getElementById('endGame').textContent = 'Game Ended';
    
    // Add "Come back tomorrow" message to the game container
    const gameContainer = document.querySelector('.game-container');
    const nextGameMessage = document.createElement('div');
    nextGameMessage.className = 'next-game-message';
    nextGameMessage.innerHTML = `
        <h3>Come back tomorrow for a new game!</h3>
        <p>Next game available:</p>
        <p>${nextPlayTimeString}</p>
        <div class="verification">
            <p>Verification Hash:</p>
            <code>${verificationHash}</code>
        </div>
    `;
    gameContainer.appendChild(nextGameMessage);
    
    // Update leaderboard display
    displayLeaderboard();
}

// Add this function to generate a verification hash
function generateVerificationHash(userId, score, wordsFound, timeInSeconds, foundHidden) {
    const gameData = `${userId}-${score}-${wordsFound}-${timeInSeconds}-${foundHidden}-${hiddenWord}`;
    let hash = 0;
    for (let i = 0; i < gameData.length; i++) {
        const char = gameData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to a more readable format (base36) and ensure it's always positive
    return Math.abs(hash).toString(36).toUpperCase();
}

// Check if user can play
function canUserPlay(userId) {
    const lastPlayed = localStorage.getItem(`lastPlayed_${userId}`);
    if (!lastPlayed) return true;
    
    const timeSinceLastPlay = Date.now() - parseInt(lastPlayed);
    return timeSinceLastPlay >= COOLDOWN_PERIOD;
}

// Update leaderboard functions
function updateLeaderboard(userId, time, wordsFound, foundHidden, score, verificationHash) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    
    // Add new entry
    leaderboard.push({
        userId,
        time,
        wordsFound,
        foundHidden,
        score,
        verificationHash,
        date: new Date().toISOString()
    });
    
    // Sort by score (highest first) and then by time (lowest first)
    leaderboard.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.time - b.time;
    });
    
    // Store leaderboard
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    displayLeaderboard();
}

function displayLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    const tbody = document.querySelector('#leaderboardTable tbody');
    tbody.innerHTML = '';
    
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.userId}</td>
            <td>${entry.score}</td>
            <td>${Math.floor(entry.time / 60)}m ${entry.time % 60}s</td>
            <td>${entry.wordsFound}/${words.length}</td>
            <td class="${entry.foundHidden ? 'found-hidden-word' : ''}">${entry.foundHidden ? 'Found! (+500)' : 'Not Found'}</td>
            <td><code class="verification-hash">${entry.verificationHash || 'N/A'}</code></td>
        `;
        tbody.appendChild(row);
    });
}

// Admin functions
function clearLeaderboard() {
    const userId = document.getElementById('userId').value.trim();
    if (userId !== '@Markuk2021') {
        alert('Only @Markuk2021 has permission to clear the leaderboard');
        return;
    }
    if (confirm('Are you sure you want to clear the leaderboard?')) {
        localStorage.removeItem('leaderboard');
        displayLeaderboard();
    }
}

function resetHiddenWord() {
    const userId = document.getElementById('userId').value.trim();
    if (userId !== '@Markuk2021') {
        alert('Only @Markuk2021 has permission to reset the hidden word');
        return;
    }
    foundHiddenWord = false;
    alert('Hidden word status has been reset!');
}

// Event listeners
document.getElementById('endGame').addEventListener('click', () => endGame(false));
document.getElementById('clearLeaderboard').addEventListener('click', clearLeaderboard);
document.getElementById('resetHiddenWord').addEventListener('click', resetHiddenWord);
document.getElementById('startGame').addEventListener('click', initGame);

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

// Mark a found word in the list
function markWordAsFound(word) {
    const wordElement = document.getElementById(`word-${word}`);
    if (wordElement) {
        wordElement.classList.add('found');
    }
}

// Initialize only the leaderboard when the page loads
window.addEventListener('load', () => {
    displayLeaderboard();
});

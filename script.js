// Crypto-related words for the game
const words = ['BITCOIN', 'ETHEREUM', 'BLOCKCHAIN', 'MINING', 'WALLET', 'DEFI', 'TOKEN', 'CRYPTO', 'LEDGER', 'NFT'];
const hiddenWord = 'PACA';
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

// Initialize the game
function initGame() {
    const userId = document.getElementById('userId').value.trim();
    if (!userId) {
        alert('Please enter a user ID to start the game');
        return;
    }
    
    document.getElementById('userIdForm').classList.add('hidden');
    document.getElementById('gameContent').classList.remove('hidden');
    
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

    // Initialize empty grid
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = '';
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('mousedown', startSelection);
            cell.addEventListener('mouseover', continueSelection);
            cell.addEventListener('mouseup', endSelection);
            wordGrid.appendChild(cell);
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

    // Fill remaining cells with random letters
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j] === '') {
                grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
            document.querySelector(`[data-row="${i}"][data-col="${j}"]`).textContent = grid[i][j];
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
        
        if (grid[newRow][newCol] !== '' && grid[newRow][newCol] !== word[i]) {
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
        grid[newRow][newCol] = word[i];
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

// Word selection logic
function startSelection(e) {
    if (!isGameActive) return;
    selectedCells = [e.target];
    e.target.classList.add('selected');
}

function continueSelection(e) {
    if (!isGameActive || !selectedCells.length) return;
    if (!selectedCells.includes(e.target)) {
        selectedCells.push(e.target);
        e.target.classList.add('selected');
    }
}

function endSelection() {
    if (!isGameActive) return;
    const word = getSelectedWord();
    checkWord(word);
    selectedCells.forEach(cell => cell.classList.remove('selected'));
    selectedCells = [];
}

function getSelectedWord() {
    return selectedCells.map(cell => cell.textContent).join('');
}

// Check if the selected word is valid
function checkWord(word) {
    const reverseWord = word.split('').reverse().join('');
    
    if (words.includes(word) && !foundWords.has(word)) {
        foundWords.add(word);
        markWordAsFound(word);
        checkGameCompletion();
    } else if (word === hiddenWord || reverseWord === hiddenWord) {
        foundHiddenWord = true;
        alert('Congratulations! You found the hidden word PACA!');
    }
}

// Mark a found word in the list
function markWordAsFound(word) {
    const wordElement = document.getElementById(`word-${word}`);
    if (wordElement) {
        wordElement.classList.add('found');
        selectedCells.forEach(cell => cell.classList.add('found'));
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
    isGameActive = false;
    clearInterval(gameTimer);
    const finalTime = document.getElementById('timer').textContent;
    const userId = document.getElementById('userId').value;
    const wordsFoundCount = foundWords.size;
    
    // Calculate time in seconds
    const [minutes, seconds] = finalTime.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;
    
    // Calculate final score
    const score = calculateScore(wordsFoundCount, foundHiddenWord, totalSeconds);
    
    // Prepare completion message
    let message = `Game ended!\n\nScore: ${score} points\nWords Found: ${wordsFoundCount}/${words.length}\nTime: ${finalTime}`;
    
    if (foundHiddenWord) {
        message += `\nHidden Word Bonus: +${HIDDEN_WORD_BONUS} points`;
    }
    
    if (completed) {
        const timeBonus = Object.entries(TIME_BONUSES).find(([threshold]) => totalSeconds <= threshold);
        if (timeBonus) {
            message += `\nTime Bonus: +${timeBonus[1]} points`;
        }
    }
    
    updateLeaderboard(userId, finalTime, wordsFoundCount, foundHiddenWord, score);
    alert(message);
}

// Update leaderboard functions
function updateLeaderboard(userId, time, wordsFound, foundHidden, score) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    leaderboard.push({ 
        userId, 
        time, 
        wordsFound,
        foundHidden,
        score,
        timestamp: Date.now()
    });
    
    // Sort by score (highest first), then by time if scores are equal
    leaderboard.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        const timeA = a.time.split(':').reduce((acc, time) => acc * 60 + parseInt(time), 0);
        const timeB = b.time.split(':').reduce((acc, time) => acc * 60 + parseInt(time), 0);
        return timeA - timeB;
    });
    
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    displayLeaderboard();
}

function displayLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    const leaderboardBody = document.querySelector('#leaderboardList tbody');
    leaderboardBody.innerHTML = '';
    
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.userId}</td>
            <td>${entry.score}</td>
            <td>${entry.time}</td>
            <td>${entry.wordsFound}/${words.length}</td>
            <td class="${entry.foundHidden ? 'found-hidden-word' : ''}">${entry.foundHidden ? 'Found! (+500)' : 'Not Found'}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

// Admin functions
function clearLeaderboard() {
    localStorage.removeItem('leaderboard');
    displayLeaderboard();
}

function resetHiddenWord() {
    // This function would typically connect to a backend to reset the hidden word
    alert('Hidden word reset functionality requires backend implementation');
}

// Event listeners
document.getElementById('endGame').addEventListener('click', () => endGame(false));
document.getElementById('clearLeaderboard').addEventListener('click', clearLeaderboard);
document.getElementById('resetHiddenWord').addEventListener('click', resetHiddenWord);
document.getElementById('startGame').addEventListener('click', initGame);

// Initialize only the leaderboard when the page loads
window.addEventListener('load', () => {
    displayLeaderboard();
});

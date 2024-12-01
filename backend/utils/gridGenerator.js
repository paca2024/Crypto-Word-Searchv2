const crypto = require('crypto');

class GridGenerator {
    constructor(size = 12, seed = null) {
        this.size = size;
        this.grid = Array(size).fill().map(() => Array(size).fill(''));
        this.directions = [
            [0, 1],   // right
            [1, 0],   // down
            [1, 1],   // diagonal right down
            [-1, 1],  // diagonal right up
            [0, -1],  // left
            [-1, 0],  // up
            [-1, -1], // diagonal left up
            [1, -1]   // diagonal left down
        ];
        
        // Create a more complex seeded random number generator
        this.seed = seed || this.generateHighEntropyRandomSeed();
        this.rng = this.createEnhancedSeededRNG(this.seed);
    }

    // Generate a high-entropy random seed
    generateHighEntropyRandomSeed() {
        const entropy = [
            Date.now().toString(),
            process.pid.toString(),
            crypto.randomBytes(16).toString('hex'),
            Math.random().toString()
        ];
        
        return crypto.createHash('sha512')
            .update(entropy.join('-'))
            .digest('hex');
    }

    // Enhanced seeded random number generator
    createEnhancedSeededRNG(seed) {
        let state = BigInt(`0x${seed}`);
        const a = BigInt('6364136223846793005');
        const c = BigInt('1442695040888963407');

        return () => {
            state = (a * state + c) & ((1n << 64n) - 1n);
            return Number(state) / Number((1n << 64n) - 1n);
        };
    }

    // Custom random method using enhanced RNG
    random(max) {
        return Math.floor(this.rng() * max);
    }

    // Shuffle array with enhanced randomness
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = this.random(i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Comprehensive word placement method
    placeWord(word) {
        const maxAttempts = 200;
        const shuffledDirections = this.shuffleArray([...this.directions]);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const row = this.random(this.size);
            const col = this.random(this.size);
            const direction = shuffledDirections[this.random(shuffledDirections.length)];

            if (this.canPlaceWord(word, row, col, direction)) {
                const [dy, dx] = direction;
                for (let i = 0; i < word.length; i++) {
                    this.grid[row + dy * i][col + dx * i] = word[i];
                }
                return true;
            }
        }
        return false;
    }

    // Word placement validation
    canPlaceWord(word, row, col, direction) {
        const [dy, dx] = direction;
        const length = word.length;

        // Check grid boundaries
        if (
            row + dy * (length - 1) < 0 || row + dy * (length - 1) >= this.size ||
            col + dx * (length - 1) < 0 || col + dx * (length - 1) >= this.size
        ) {
            return false;
        }

        // Check for word conflicts
        for (let i = 0; i < length; i++) {
            const currentRow = row + dy * i;
            const currentCol = col + dx * i;
            
            if (this.grid[currentRow][currentCol] !== '' && 
                this.grid[currentRow][currentCol] !== word[i]) {
                return false;
            }
        }

        return true;
    }

    // Advanced letter shuffling method
    shuffleGridLetters() {
        // Create a map of word letter positions to preserve
        const wordPositions = new Set();
        
        // Mark word letter positions
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] !== '') {
                    wordPositions.add(`${i},${j}`);
                }
            }
        }

        // Collect non-word letters
        const nonWordLetters = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!wordPositions.has(`${i},${j}`)) {
                    nonWordLetters.push(this.grid[i][j]);
                }
            }
        }

        // Shuffle non-word letters
        const shuffledLetters = this.shuffleArray(nonWordLetters);
        let letterIndex = 0;

        // Redistribute shuffled letters
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!wordPositions.has(`${i},${j}`)) {
                    this.grid[i][j] = shuffledLetters[letterIndex] || 
                        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[this.random(26)];
                    letterIndex++;
                }
            }
        }
    }

    // Fill empty spaces with random letters
    fillEmptySpaces() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === '') {
                    this.grid[i][j] = letters[this.random(letters.length)];
                }
            }
        }
    }

    // Grid generation with enhanced randomness
    generateGrid(words) {
        // Reset grid
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(''));

        // Sort words by length (longest first)
        const sortedWords = [...words].sort((a, b) => b.length - a.length);

        // Shuffle words
        const shuffledWords = this.shuffleArray(sortedWords);

        // Try to place words
        const placedWords = [];
        for (const word of shuffledWords) {
            const upperWord = word.toUpperCase();
            if (this.placeWord(upperWord)) {
                placedWords.push(word);
            }
        }

        // Fill remaining spaces
        this.fillEmptySpaces();

        // Shuffle non-word letters to add more randomness
        this.shuffleGridLetters();

        // Debug logging
        console.log(`Grid Generation Debug:
        - Seed: ${this.seed}
        - Total Words: ${words.length}
        - Placed Words: ${placedWords.length}
        - Placed Words List: ${placedWords.join(', ')}
        `);

        return {
            grid: this.grid,
            placedWords: placedWords
        };
    }
}

module.exports = GridGenerator;

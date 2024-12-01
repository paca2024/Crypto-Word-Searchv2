const GridGenerator = require('../utils/gridGenerator');

describe('GridGenerator', () => {
    let gridGen;

    beforeEach(() => {
        gridGen = new GridGenerator(12);
    });

    test('should create a grid of correct size', () => {
        expect(gridGen.grid.length).toBe(12);
        expect(gridGen.grid[0].length).toBe(12);
    });

    test('should place a word in the grid', () => {
        const word = 'BITCOIN';
        const success = gridGen.placeWord(word);
        expect(success).toBe(true);

        // Verify word exists in grid
        let found = false;
        const directions = gridGen.directions;
        
        for (let row = 0; row < 12; row++) {
            for (let col = 0; col < 12; col++) {
                for (const [dy, dx] of directions) {
                    let wordFound = true;
                    for (let i = 0; i < word.length; i++) {
                        const newRow = row + dy * i;
                        const newCol = col + dx * i;
                        if (newRow < 0 || newRow >= 12 || newCol < 0 || newCol >= 12) {
                            wordFound = false;
                            break;
                        }
                        if (gridGen.grid[newRow][newCol] !== word[i]) {
                            wordFound = false;
                            break;
                        }
                    }
                    if (wordFound) {
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            if (found) break;
        }
        expect(found).toBe(true);
    });

    test('should generate grid with multiple words', () => {
        const words = ['BITCOIN', 'ETHEREUM', 'BLOCKCHAIN'];
        const { grid, placedWords } = gridGen.generateGrid(words);

        expect(grid.length).toBe(12);
        expect(placedWords.length).toBeGreaterThan(0);
        expect(placedWords.length).toBeLessThanOrEqual(words.length);
    });

    test('should fill empty spaces with random letters', () => {
        gridGen.fillEmptySpaces();
        
        // Check that all spaces are filled with letters
        for (let row = 0; row < 12; row++) {
            for (let col = 0; col < 12; col++) {
                expect(gridGen.grid[row][col]).toMatch(/[A-Z]/);
            }
        }
    });
});

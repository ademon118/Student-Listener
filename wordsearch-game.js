// Word Search Game
(function() {
    'use strict';
    
    // Wait for both DOM and script.js to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWordSearchGame);
    } else {
        // DOM already loaded, wait a bit for script.js
        setTimeout(initWordSearchGame, 100);
    }
    
    function initWordSearchGame() {
        // Background music + toggle for Word Search game
        const bgMusic = document.getElementById('bg-music');
        const musicToggleBtn = document.getElementById('music-toggle');

        function updateMusicToggleUI() {
            if (!musicToggleBtn) return;
            const label = musicToggleBtn.querySelector('.music-label');
            const icon = musicToggleBtn.querySelector('.music-icon');
            const isPlaying = bgMusic && !bgMusic.paused;
            if (label) label.textContent = isPlaying ? 'Music: On' : 'Music: Off';
            if (icon) icon.textContent = isPlaying ? '🔊' : '🔈';
        }

        function startBackgroundMusic() {
            if (!bgMusic) return;
            bgMusic.loop = true;
            bgMusic.volume = 0.35;
            bgMusic.play().then(updateMusicToggleUI).catch(() => {
                const resumeOnInteraction = () => {
                    bgMusic.play().finally(updateMusicToggleUI);
                    document.removeEventListener('click', resumeOnInteraction);
                    document.removeEventListener('touchstart', resumeOnInteraction);
                };
                document.addEventListener('click', resumeOnInteraction, { once: true });
                document.addEventListener('touchstart', resumeOnInteraction, { once: true });
            });
        }

        if (bgMusic) {
            startBackgroundMusic();
        }

        if (musicToggleBtn && bgMusic) {
            musicToggleBtn.addEventListener('click', () => {
                if (bgMusic.paused) {
                    bgMusic.play().finally(updateMusicToggleUI);
                } else {
                    bgMusic.pause();
                    updateMusicToggleUI();
                }
            });
        }
        
        const words = ['WAITER', 'CUSTOMER', 'ORDER', 'DRINK', 'BILL', 'PRICE'];
        const gridSize = 15;
        let grid = [];
        let selectedCells = [];
        let foundWords = new Set();
        let startCell = null;
        let isSelecting = false;
        let timerInterval = null;
        let startTime = null;

        function initWordSearch() {
            const gridContainer = document.getElementById('wordsearch-grid');
            const wordList = document.getElementById('wordsearch-word-list');
            
            if (!gridContainer || !wordList) return;

            // Reset game state
            foundWords.clear();
            selectedCells = [];
            startCell = null;
            isSelecting = false;
            
            // Clear previous content
            gridContainer.innerHTML = '';
            wordList.innerHTML = '';

            // Generate grid
            grid = generateGrid(words, gridSize);
            
            // Create grid cells
            grid.forEach((row, i) => {
                row.forEach((cell, j) => {
                    const cellEl = document.createElement('div');
                    cellEl.className = 'wordsearch-cell';
                    cellEl.textContent = cell;
                    cellEl.dataset.row = i;
                    cellEl.dataset.col = j;
                    
                    cellEl.addEventListener('mousedown', (e) => startSelection(i, j, e));
                    cellEl.addEventListener('mouseenter', (e) => continueSelection(i, j, e));
                    cellEl.addEventListener('mouseup', () => endSelection());
                    
                    // Touch events for mobile
                    cellEl.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        startSelection(i, j, e);
                    });
                    cellEl.addEventListener('touchmove', (e) => {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (element && element.classList.contains('wordsearch-cell')) {
                            const row = parseInt(element.dataset.row);
                            const col = parseInt(element.dataset.col);
                            continueSelection(row, col, e);
                        }
                    });
                    cellEl.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        endSelection();
                    });
                    
                    gridContainer.appendChild(cellEl);
                });
            });

            // Create word list
            words.forEach(word => {
                const wordEl = document.createElement('div');
                wordEl.className = 'wordsearch-word-item';
                wordEl.textContent = word.toLowerCase();
                wordEl.dataset.word = word;
                wordList.appendChild(wordEl);
            });

            // Start timer
            startTimer();
        }

        function generateGrid(words, size) {
            // Initialize empty grid
            const grid = Array(size).fill(null).map(() => Array(size).fill(''));
            
            // Place words in grid
            const wordPositions = [];
            
            words.forEach(word => {
                let placed = false;
                let attempts = 0;
                
                while (!placed && attempts < 100) {
                    const direction = Math.floor(Math.random() * 8); // 8 directions
                    const row = Math.floor(Math.random() * size);
                    const col = Math.floor(Math.random() * size);
                    
                    if (canPlaceWord(grid, word, row, col, direction, size)) {
                        const positions = placeWord(grid, word, row, col, direction);
                        wordPositions.push({ word, positions, direction });
                        placed = true;
                    }
                    attempts++;
                }
            });
            
            // Fill remaining cells with random letters
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    if (grid[i][j] === '') {
                        grid[i][j] = alphabet[Math.floor(Math.random() * alphabet.length)];
                    }
                }
            }
            
            return grid;
        }

        function canPlaceWord(grid, word, row, col, direction, size) {
            const directions = [
                [0, 1],   // Right
                [1, 0],   // Down
                [1, 1],   // Down-Right
                [1, -1],  // Down-Left
                [0, -1],  // Left
                [-1, 0],  // Up
                [-1, -1], // Up-Left
                [-1, 1]   // Up-Right
            ];
            
            const [dr, dc] = directions[direction];
            
            for (let i = 0; i < word.length; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                
                if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
                    return false;
                }
                
                if (grid[newRow][newCol] !== '' && grid[newRow][newCol] !== word[i]) {
                    return false;
                }
            }
            
            return true;
        }

        function placeWord(grid, word, row, col, direction) {
            const directions = [
                [0, 1], [1, 0], [1, 1], [1, -1],
                [0, -1], [-1, 0], [-1, -1], [-1, 1]
            ];
            
            const [dr, dc] = directions[direction];
            const positions = [];
            
            for (let i = 0; i < word.length; i++) {
                const newRow = row + dr * i;
                const newCol = col + dc * i;
                grid[newRow][newCol] = word[i];
                positions.push({ row: newRow, col: newCol });
            }
            
            return positions;
        }

        function startSelection(row, col, e) {
            e.preventDefault();
            isSelecting = true;
            startCell = { row, col };
            selectedCells = [{ row, col }];
            highlightCell(row, col);
        }

        function continueSelection(row, col, e) {
            if (!isSelecting || !startCell) return;
            e.preventDefault();
            
            const cells = getCellsBetween(startCell.row, startCell.col, row, col);
            clearHighlights();
            cells.forEach(cell => highlightCell(cell.row, cell.col));
            selectedCells = cells;
        }

        function endSelection() {
            if (!isSelecting) return;
            isSelecting = false;
            
            if (selectedCells.length > 0) {
                checkWord();
            }
            
            startCell = null;
        }

        function getCellsBetween(row1, col1, row2, col2) {
            const cells = [];
            const dr = row2 - row1;
            const dc = col2 - col1;
            const steps = Math.max(Math.abs(dr), Math.abs(dc));
            
            if (steps === 0) {
                return [{ row: row1, col: col1 }];
            }
            
            for (let i = 0; i <= steps; i++) {
                const row = row1 + Math.round((dr / steps) * i);
                const col = col1 + Math.round((dc / steps) * i);
                cells.push({ row, col });
            }
            
            return cells;
        }

        function highlightCell(row, col) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('selected');
            }
        }

        function clearHighlights() {
            document.querySelectorAll('.wordsearch-cell.selected').forEach(cell => {
                if (!cell.classList.contains('found')) {
                    cell.classList.remove('selected');
                }
            });
        }

        function checkWord() {
            if (selectedCells.length < 3) {
                clearHighlights();
                return;
            }
            
            // Get the word from selected cells
            const selectedWord = selectedCells.map(cell => grid[cell.row][cell.col]).join('');
            const reversedWord = selectedWord.split('').reverse().join('');
            
            // Check if it matches any word
            for (const word of words) {
                if (selectedWord === word || reversedWord === word) {
                    if (!foundWords.has(word)) {
                        foundWords.add(word);
                        markWordAsFound(word);
                        highlightFoundCells(selectedCells);
                        
                        // Check if all words are found
                        if (foundWords.size === words.length) {
                            stopTimer();
                            setTimeout(() => {
                                showGameMessage("Congratulations!", "You found all the words!");
                            }, 500);
                        }
                    }
                    return;
                }
            }
            
            // Word not found, clear selection
            clearHighlights();
        }

        function markWordAsFound(word) {
            const wordEl = document.querySelector(`[data-word="${word}"]`);
            if (wordEl) {
                wordEl.classList.add('found');
            }
        }

        function highlightFoundCells(cells) {
            cells.forEach(cell => {
                const cellEl = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
                if (cellEl) {
                    cellEl.classList.remove('selected');
                    cellEl.classList.add('found');
                }
            });
        }

        function startTimer() {
            startTime = Date.now();
            timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                const timerEl = document.getElementById('wordsearch-timer');
                if (timerEl) {
                    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                }
            }, 1000);
        }

        function stopTimer() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }

        // Restart button
        const restartBtn = document.getElementById('wordsearch-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                stopTimer();
                initWordSearch();
            });
        }

        // Initialize game
        initWordSearch();
    }
})();


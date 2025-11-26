// Hangman Game
(function() {
    'use strict';
    
    // Wait for DOM and script.js to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHangmanGame);
    } else {
        setTimeout(initHangmanGame, 100);
    }
    
    function initHangmanGame() {
        // Background music + toggle for Hangman
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
                // If autoplay is blocked, wait for first user interaction
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
        
        const hangmanWords = [
            { word: "VERMICELLI", hint: "Thin, long noodles often used in soups and stir-fries" },
            { word: "CAULIFLOWER", hint: "A white, tree-like cruciferous vegetable." },
            { word: "CANTEEN", hint: "A place (or box) where people eat at school/work; also a water flask." },
            { word: "BROCCOLI", hint: "Green vegetable that looks like tiny trees." },
            { word: "BONE", hint: "Hard part inside your body that supports the skeleton." }
        ];
        
        const wordBlanksEl = document.getElementById('word-blanks');
        const alphabetButtonsEl = document.getElementById('alphabet-buttons');
        const hintTextEl = document.getElementById('hint-text');
        const hangmanParts = document.querySelectorAll('.hangman-part');
        const playSound = (type) => {
            if (typeof window.playGameSound === 'function') {
                window.playGameSound(type);
            }
        };
        
        if (!wordBlanksEl || !alphabetButtonsEl || !hintTextEl || hangmanParts.length === 0) {
            return; // Game elements not found on this page
        }
        
        let currentHangmanWord = 0;
        let wrongGuesses = 0;
        let guessedLetters = [];
        const maxWrongGuesses = 6;
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        
        function initHangman() {
            if (currentHangmanWord >= hangmanWords.length) {
                if (typeof showGameMessage === 'function') {
                    showGameMessage("Congratulations!", "You've completed all Hangman words!");
                }
                return;
            }
            
            wrongGuesses = 0;
            guessedLetters = [];
            hintTextEl.textContent = '';
            
            // Reset hangman parts
            hangmanParts.forEach(part => part.style.display = 'none');
            
            // Generate alphabet buttons
            alphabetButtonsEl.innerHTML = '';
            alphabet.forEach(letter => {
                const btn = document.createElement('button');
                btn.textContent = letter;
                btn.addEventListener('click', () => {
                    playSound('click');
                    handleHangmanGuess(letter, btn);
                });
                alphabetButtonsEl.appendChild(btn);
            });
            
            // Generate word blanks
            updateWordBlanks();
        }

        function updateWordBlanks() {
            const word = hangmanWords[currentHangmanWord].word;
            wordBlanksEl.textContent = word.split('').map(letter => (guessedLetters.includes(letter) ? letter : '_')).join(' ');
        }
        
        function handleHangmanGuess(letter, btn) {
            btn.disabled = true;
            guessedLetters.push(letter);
            const word = hangmanWords[currentHangmanWord].word;

            if (word.includes(letter)) {
                playSound('correct');
                updateWordBlanks();
                checkHangmanWin();
            } else {
                playSound('wrong');
                wrongGuesses++;
                if (hangmanParts[wrongGuesses - 1]) {
                    hangmanParts[wrongGuesses - 1].style.display = 'block';
                }
                checkHangmanLose();
            }
        }
        
        function checkHangmanWin() {
            const word = hangmanWords[currentHangmanWord].word;
            if (word.split('').every(letter => guessedLetters.includes(letter))) {
                playSound('success');
                if (typeof showGameMessage === 'function') {
                    showGameMessage("You Win!", `The word was: ${word}`);
                }
                currentHangmanWord++;
                setTimeout(initHangman, 2000);
            }
        }
        
        function checkHangmanLose() {
            if (wrongGuesses >= maxWrongGuesses) {
                playSound('fail');
                if (typeof showGameMessage === 'function') {
                    showGameMessage("Game Over", `The word was: ${hangmanWords[currentHangmanWord].word}`);
                }
                currentHangmanWord++;
                setTimeout(initHangman, 2000);
            }
        }

        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                playSound('hint');
                hintTextEl.textContent = hangmanWords[currentHangmanWord].hint;
            });
        }
        
        const hangmanRestartBtn = document.getElementById('hangman-restart');
        if (hangmanRestartBtn) {
            hangmanRestartBtn.addEventListener('click', () => {
                playSound('click');
                currentHangmanWord = 0;
                initHangman();
            });
        }

        // Initial load
        initHangman();
    }
})();


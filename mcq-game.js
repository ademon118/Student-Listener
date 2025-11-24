// MCQ Game
(function() {
    'use strict';
    
    // Wait for DOM and script.js to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMCQGame);
    } else {
        setTimeout(initMCQGame, 100);
    }
    
    function initMCQGame() {
        const mcqQuestions = [
            { q: "Which food item contains vitamin B6 and is good for the brain?", options: ["Bananas", "Dark chocolate", "Broccoli"], answer: "Bananas" },
            { q: "What polite phrase can a customer use to order food?", options: ["Can I have noodles, please?", "Give me noodles", "I want noodles"], answer: "Can I have noodles, please?" },
            { q: "What nutrient in chicken helps with growth?", options: ["Fat", "Carbohydrates", "Protein"], answer: "Protein" },
            { q: "What is the benefit of vitamin C found in broccoli?", options: ["Good for the skin", "Good for the immune system", "Good for the brain"], answer: "Good for the immune system" },
            { q: "Which food item is rich in calcium and strengthens bones and teeth?", options: ["Bananas", "Fried rice", "Milk"], answer: "Milk" }
        ];
        
        const mcqQuestionEl = document.getElementById('mcq-question');
        const mcqOptionsEl = document.getElementById('mcq-options');
        const playSound = (type) => {
            if (typeof window.playGameSound === 'function') {
                window.playGameSound(type);
            }
        };
        
        if (!mcqQuestionEl || !mcqOptionsEl) {
            return; // Game elements not found on this page
        }
        
        let currentMCQIndex = 0;
        let selectedMCQOption = null;
        
        function loadMCQ(index) {
            selectedMCQOption = null;
            const q = mcqQuestions[index];
            mcqQuestionEl.textContent = q.q;
            mcqOptionsEl.innerHTML = '';
            
            // Create fresh option elements
            q.options.forEach(optionText => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'mcq-option';
                optionDiv.textContent = optionText;
                optionDiv.style.pointerEvents = 'auto'; // Ensure clickable
                optionDiv.addEventListener('click', () => selectMCQOption(optionDiv, optionText));
                mcqOptionsEl.appendChild(optionDiv);
            });
            
            const mcqCheckBtn = document.getElementById('mcq-check');
            if (mcqCheckBtn) {
                mcqCheckBtn.style.display = 'block';
            }
        }
        
        function selectMCQOption(optionDiv, optionText) {
            // Remove selected from others
            mcqOptionsEl.querySelectorAll('.mcq-option').forEach(el => {
                el.classList.remove('selected', 'correct', 'incorrect');
            });
            optionDiv.classList.add('selected');
            selectedMCQOption = optionText;
            playSound('click');
        }

        // Celebration animation function
        function triggerCelebration(container, callback) {
            if (!container) {
                if (callback) callback();
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.className = 'confetti-canvas';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '1000';
            container.style.position = 'relative';
            container.appendChild(canvas);
            const ctx = canvas.getContext('2d');

            function resizeCanvas() {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }
            resizeCanvas();

            const confettiPieces = [];
            const colors = ['#ff6b6b', '#ffd93d', '#4ecdc4', '#5f27cd', '#ff9f1c'];
            for (let i = 0; i < 100; i++) {
                confettiPieces.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * -canvas.height,
                    size: Math.random() * 6 + 4,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    speed: Math.random() * 3 + 2,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.2
                });
            }

            let animationFrame;
            function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                confettiPieces.forEach(piece => {
                    piece.y += piece.speed;
                    piece.rotation += piece.rotationSpeed;
                    if (piece.y > canvas.height) {
                        piece.y = -20;
                        piece.x = Math.random() * canvas.width;
                    }
                    ctx.save();
                    ctx.translate(piece.x, piece.y);
                    ctx.rotate(piece.rotation);
                    ctx.fillStyle = piece.color;
                    ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
                    ctx.restore();
                });
                animationFrame = requestAnimationFrame(draw);
            }
            draw();

            setTimeout(() => {
                cancelAnimationFrame(animationFrame);
                canvas.remove();
                if (callback) callback();
            }, 1500);
        }

        // Transition UI with countdown timer
        function showTransitionTimer(container, duration, callback) {
            if (!container) {
                if (callback) callback();
                return;
            }

            // Ensure container has relative positioning
            container.style.position = 'relative';

            const transitionOverlay = document.createElement('div');
            transitionOverlay.className = 'mcq-transition-overlay';
            transitionOverlay.innerHTML = `
                <div class="mcq-transition-content glass-box">
                    <div class="mcq-transition-icon">✓</div>
                    <h3>Correct!</h3>
                    <div class="mcq-transition-timer">
                        <div class="mcq-timer-circle">
                            <svg class="mcq-timer-svg" viewBox="0 0 100 100">
                                <circle class="mcq-timer-bg" cx="50" cy="50" r="45"></circle>
                                <circle class="mcq-timer-progress" cx="50" cy="50" r="45"></circle>
                            </svg>
                            <div class="mcq-timer-text">3</div>
                        </div>
                    </div>
                    <p class="mcq-transition-message">Loading next question...</p>
                </div>
            `;
            container.appendChild(transitionOverlay);

            let countdown = duration;
            const timerText = transitionOverlay.querySelector('.mcq-timer-text');
            const progressCircle = transitionOverlay.querySelector('.mcq-timer-progress');
            const circumference = 2 * Math.PI * 45;
            progressCircle.style.strokeDasharray = circumference;
            progressCircle.style.strokeDashoffset = circumference;

            const interval = setInterval(() => {
                countdown--;
                if (timerText) {
                    timerText.textContent = countdown;
                }
                if (progressCircle) {
                    const progress = (duration - countdown) / duration;
                    progressCircle.style.strokeDashoffset = circumference * (1 - progress);
                }
                
                if (countdown <= 0) {
                    clearInterval(interval);
                    transitionOverlay.style.opacity = '0';
                    transitionOverlay.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        transitionOverlay.remove();
                        if (callback) callback();
                    }, 300);
                }
            }, 1000);
        }

        const mcqCheckBtn = document.getElementById('mcq-check');
        if (mcqCheckBtn) {
            mcqCheckBtn.addEventListener('click', () => {
                if (!selectedMCQOption) {
                    if (typeof window.showGameMessage === 'function') {
                        window.showGameMessage("Wait!", "Please select an answer.");
                    }
                    return;
                }
                
                const q = mcqQuestions[currentMCQIndex];
                const optionsDivs = mcqOptionsEl.querySelectorAll('.mcq-option');
                const isCorrect = selectedMCQOption === q.answer;
                
                optionsDivs.forEach(div => {
                    div.style.pointerEvents = 'none'; // Disable clicking
                    if (div.textContent === q.answer) {
                        div.classList.add('correct');
                    } else if (div.textContent === selectedMCQOption) {
                        div.classList.add('incorrect');
                    }
                });
                
                mcqCheckBtn.style.display = 'none';
                
                // Trigger celebration if correct
                if (isCorrect) {
                    const container = document.querySelector('#page-game-mcq .game-page-container');
                    triggerCelebration(container, () => {
                        // Show transition timer before next question
                        showTransitionTimer(container, 3, () => {
                            // Continue to next question after timer
                            currentMCQIndex++;
                            if (currentMCQIndex < mcqQuestions.length) {
                                loadMCQ(currentMCQIndex);
                            } else {
                                if (typeof window.showGameMessage === 'function') {
                                    window.showGameMessage("Great Job!", "You've completed all multiple choice questions!");
                                }
                                currentMCQIndex = 0;
                                setTimeout(() => loadMCQ(0), 2000);
                            }
                            optionsDivs.forEach(div => {
                                div.style.pointerEvents = 'auto'; // Re-enable
                            });
                        });
                    });
                } else {
                    // Wrong answer - just wait and continue
                    setTimeout(() => {
                        currentMCQIndex++;
                        if (currentMCQIndex < mcqQuestions.length) {
                            loadMCQ(currentMCQIndex);
                        } else {
                            if (typeof window.showGameMessage === 'function') {
                                window.showGameMessage("Great Job!", "You've completed all multiple choice questions!");
                            }
                            currentMCQIndex = 0;
                            setTimeout(() => loadMCQ(0), 2000);
                        }
                        optionsDivs.forEach(div => {
                            div.style.pointerEvents = 'auto'; // Re-enable
                        });
                    }, 2000);
                }
            });
        }
        
        const mcqRestartBtn = document.getElementById('mcq-restart');
        if (mcqRestartBtn) {
            mcqRestartBtn.addEventListener('click', () => {
                currentMCQIndex = 0;
                loadMCQ(currentMCQIndex);
            });
        }

        // Initial load
        loadMCQ(0);
    }
})();


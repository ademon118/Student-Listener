// Listening Game
(function() {
    'use strict';
    
    // Wait for DOM and script.js to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initListeningGame);
    } else {
        setTimeout(initListeningGame, 100);
    }
    
    function initListeningGame() {
        const listeningInputs = document.querySelectorAll('#dialogue-container input');
        const listeningCheckBtn = document.getElementById('listening-check');
        
        if (!listeningCheckBtn || listeningInputs.length === 0) {
            return; // Game elements not found on this page
        }
        
        listeningCheckBtn.addEventListener('click', () => {
            let correctCount = 0;
            const totalQuestions = listeningInputs.length;
            
            listeningInputs.forEach(input => {
                const answer = input.dataset.answer;
                if (input.value.trim().toLowerCase() === answer.toLowerCase()) {
                    input.style.borderBottomColor = 'var(--color-green)';
                    correctCount++;
                } else {
                    input.style.borderBottomColor = 'var(--color-red)';
                }
            });
            
            // Helper function to show message
            function showMessage(title, message) {
                const modal = document.getElementById('game-message-modal');
                const titleEl = document.getElementById('game-message-title');
                const textEl = document.getElementById('game-message-text');
                
                if (modal && titleEl && textEl) {
                    titleEl.textContent = title;
                    textEl.textContent = message;
                    modal.classList.add('active');
                    
                    // Ensure close button works - add direct listener
                    const closeBtn = document.getElementById('game-message-close');
                    if (closeBtn) {
                        // Use once to avoid multiple listeners
                        closeBtn.onclick = () => {
                            modal.classList.remove('active');
                        };
                    }
                    
                    // Also close on overlay click (only once per show)
                    const closeOnOverlay = (e) => {
                        if (e.target === modal) {
                            modal.classList.remove('active');
                            modal.removeEventListener('click', closeOnOverlay);
                        }
                    };
                    modal.removeEventListener('click', closeOnOverlay); // Remove if exists
                    modal.addEventListener('click', closeOnOverlay);
                } else if (typeof window.showGameMessage === 'function') {
                    window.showGameMessage(title, message);
                }
            }
            
            // Show score message with celebration if all correct
            if (correctCount === totalQuestions) {
                // All correct - show celebration animation then message
                const onFinish = () => {
                    showMessage("Perfect! 🎉", `You got ${correctCount}/${totalQuestions} correct! Excellent work!`);
                };
                triggerCelebration(onFinish);
            } else if (correctCount > 0) {
                // Partial correct - show score message immediately
                showMessage("Good Try! 👍", `You got ${correctCount}/${totalQuestions} correct. Keep practicing!`);
            } else {
                // No correct answers
                showMessage("Try Again! 💪", `You got ${correctCount}/${totalQuestions} correct. Don't give up!`);
            }
        });
        
        const listeningRestartBtn = document.getElementById('listening-restart');
        if (listeningRestartBtn) {
            listeningRestartBtn.addEventListener('click', () => {
                listeningInputs.forEach(input => {
                    input.value = '';
                    input.style.borderBottomColor = 'var(--color-pumpkin)';
                });
            });
        }
    }

    function triggerCelebration(callback) {
        const container = document.getElementById('dialogue-container');
        if (!container) {
            if (callback) callback();
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.className = 'confetti-canvas';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }
        resizeCanvas();

        const confettiPieces = [];
        const colors = ['#ff6b6b', '#ffd93d', '#4ecdc4', '#5f27cd', '#ff9f1c'];
        for (let i = 0; i < 120; i++) {
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
        }, 1800);
    }
})();


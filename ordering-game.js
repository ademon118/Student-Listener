// Ordering Game
(function() {
    'use strict';
    
    // Wait for DOM and script.js to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOrderingGame);
    } else {
        setTimeout(initOrderingGame, 100);
    }
    
    function initOrderingGame() {
        const dialogueSentences = [
            { id: 1, text: "Good morning. What would you like to have?" },
            { id: 2, text: "May we look at the menu first?" },
            { id: 3, text: "Here you are." },
            { id: 4, text: "Yes, I'll have chicken soup And what about you, su?" },
            { id: 5, text: "I'll have rice." },
            { id: 6, text: "Would you like anything to drink?" },
            { id: 7, text: "I'll have coke please." },
            { id: 8, text: "Waiter, how much does our bill come to?" },
            { id: 9, text: "It's 10000 kyats." }
        ];
        
        const sentencePool = document.getElementById('sentence-pool');
        const sentenceDropzone = document.getElementById('sentence-dropzone');
        
        if (!sentencePool || !sentenceDropzone) {
            return; // Game elements not found on this page
        }
        
        let draggingElement = null;
        
        function resetOrderingGame() {
            sentencePool.innerHTML = '<h4>Drag From Here:</h4>';
            sentenceDropzone.innerHTML = '<h4>Drop Here:</h4>';
            
            // Shuffle and add to pool
            const shuffledSentences = [...dialogueSentences].sort(() => Math.random() - 0.5);
            
            shuffledSentences.forEach(sentence => {
                const el = document.createElement('div');
                el.className = 'draggable-sentence';
                el.textContent = sentence.text;
                el.draggable = true;
                el.dataset.id = sentence.id;
                el.addEventListener('dragstart', dragStart);
                sentencePool.appendChild(el);
            });
        }
        
        function dragStart(e) {
            draggingElement = e.target;
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
        
        sentenceDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        sentenceDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggingElement) {
                draggingElement.classList.remove('dragging');
                sentenceDropzone.appendChild(draggingElement);
                draggingElement = null;
            }
        });
        
        sentencePool.addEventListener('dragover', (e) => e.preventDefault());
        sentencePool.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggingElement) {
                draggingElement.classList.remove('dragging');
                sentencePool.appendChild(draggingElement);
                draggingElement = null;
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
        
        // Celebration animation function
        function triggerCelebration(callback) {
            const container = document.querySelector('.game-page-container') || sentenceDropzone;
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
            window.addEventListener('resize', resizeCanvas);

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
                window.removeEventListener('resize', resizeCanvas);
                canvas.remove();
                if (callback) callback();
            }, 1800);
        }
        
        const orderingCheckBtn = document.getElementById('ordering-check');
        if (orderingCheckBtn) {
            orderingCheckBtn.addEventListener('click', () => {
                const droppedSentences = sentenceDropzone.querySelectorAll('.draggable-sentence');
                if (droppedSentences.length !== dialogueSentences.length) {
                    showMessage("Not Yet!", "You haven't ordered all the sentences.");
                    return;
                }
                
                let isCorrect = true;
                for (let i = 0; i < droppedSentences.length; i++) {
                    if (parseInt(droppedSentences[i].dataset.id) !== i + 1) {
                        isCorrect = false;
                        break;
                    }
                }
                
                if (isCorrect) {
                    // All correct - show celebration animation then message
                    const onFinish = () => {
                        showMessage("Perfect! 🎉", "You put them in the correct order! Excellent work!");
                    };
                    triggerCelebration(onFinish);
                } else {
                    // Incorrect order - show fail message immediately
                    showMessage("Try Again! 💪", "The order is incorrect. Please try again!");
                }
            });
        }
        
        const orderingRestartBtn = document.getElementById('ordering-restart');
        if (orderingRestartBtn) {
            orderingRestartBtn.addEventListener('click', resetOrderingGame);
        }

        // Initial load
        resetOrderingGame();
    }
})();


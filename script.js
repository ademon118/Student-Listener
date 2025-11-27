document.addEventListener('DOMContentLoaded', () => {

    // --- Global Elements ---
    const pages = document.querySelectorAll('.page');
    let navLinks = [];
    let moreMenuBtn = null;
    let moreDropdown = null;
    const clickSound = document.getElementById('click-sound');
    
    // --- Lightweight Sound Effects (Web Audio) ---
    const soundPresets = {
        click: {
            wave: 'triangle',
            duration: 0.12,
            gain: 0.18,
            seq: [
                { time: 0, freq: 420 },
                { time: 0.08, freq: 520 }
            ]
        },
        correct: {
            wave: 'sine',
            duration: 0.35,
            gain: 0.22,
            seq: [
                { time: 0, freq: 520 },
                { time: 0.12, freq: 640 },
                { time: 0.22, freq: 760 }
            ]
        },
        wrong: {
            wave: 'sawtooth',
            duration: 0.35,
            gain: 0.2,
            seq: [
                { time: 0, freq: 360 },
                { time: 0.18, freq: 200 },
                { time: 0.3, freq: 140 }
            ]
        },
        success: {
            wave: 'sine',
            duration: 0.6,
            gain: 0.28,
            seq: [
                { time: 0, freq: 480 },
                { time: 0.15, freq: 620 },
                { time: 0.3, freq: 780 },
                { time: 0.45, freq: 920 }
            ]
        },
        fail: {
            wave: 'triangle',
            duration: 0.45,
            gain: 0.25,
            seq: [
                { time: 0, freq: 280 },
                { time: 0.2, freq: 200 },
                { time: 0.4, freq: 140 }
            ]
        },
        hint: {
            wave: 'square',
            duration: 0.25,
            gain: 0.18,
            seq: [
                { time: 0, freq: 660 },
                { time: 0.15, freq: 720 }
            ]
        }
    };
    
    const gameCardSoundProfiles = {
        default: {
            hover: { wave: 'sine', freqStart: 520, freqEnd: 640, duration: 0.28, gain: 0.11 },
            click: { wave: 'triangle', freqStart: 660, freqEnd: 360, duration: 0.35, gain: 0.18 }
        },
        hangman: {
            hover: { wave: 'sine', freqStart: 300, freqEnd: 360, duration: 0.32, gain: 0.12 },
            click: { wave: 'triangle', freqStart: 420, freqEnd: 240, duration: 0.4, gain: 0.2 }
        },
        mcq: {
            hover: { wave: 'triangle', freqStart: 480, freqEnd: 620, duration: 0.25, gain: 0.13 },
            click: { wave: 'square', freqStart: 720, freqEnd: 540, duration: 0.3, gain: 0.2 }
        },
        listening: {
            hover: { wave: 'sine', freqStart: 420, freqEnd: 540, duration: 0.35, gain: 0.14 },
            click: { wave: 'sine', freqStart: 540, freqEnd: 720, duration: 0.38, gain: 0.18 }
        },
        ordering: {
            hover: { wave: 'triangle', freqStart: 340, freqEnd: 420, duration: 0.3, gain: 0.13 },
            click: { wave: 'square', freqStart: 460, freqEnd: 280, duration: 0.36, gain: 0.18 }
        },
        wordsearch: {
            hover: { wave: 'sine', freqStart: 460, freqEnd: 520, duration: 0.3, gain: 0.12 },
            click: { wave: 'triangle', freqStart: 520, freqEnd: 600, duration: 0.32, gain: 0.17 }
        }
    };
    
    let webAudioCtx = null;
    
    function ensureAudioContext() {
        if (!webAudioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                webAudioCtx = new AudioCtx();
            }
        }
        return webAudioCtx;
    }
    
    function playGameSound(type = 'click') {
        const preset = soundPresets[type] || soundPresets.click;
        const ctx = ensureAudioContext();
        
        if (!ctx) {
            // Fallback to HTML audio element if available
            if (clickSound) {
                clickSound.currentTime = 0;
                clickSound.play().catch(() => {});
            }
            return;
        }
        
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = preset.wave || 'sine';
        
        const now = ctx.currentTime;
        const sequence = preset.seq && preset.seq.length ? preset.seq : [{ time: 0, freq: 440 }];
        osc.frequency.setValueAtTime(sequence[0].freq, now);
        sequence.forEach(point => {
            osc.frequency.linearRampToValueAtTime(point.freq, now + point.time);
        });
        
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(preset.gain || 0.25, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (preset.duration || 0.3));
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + (preset.duration || 0.3) + 0.05);
    }
    
    window.playGameSound = playGameSound;
    
    const unlockAudioContext = () => {
        const ctx = ensureAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
    };
    document.addEventListener('pointerdown', unlockAudioContext, { passive: true });
    document.addEventListener('touchstart', unlockAudioContext, { passive: true });
    
    function playUISound(type = 'click') {
        if (typeof window.playGameSound === 'function') {
            window.playGameSound(type);
        } else if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(() => {});
        }
    }
    
    function playCardAtmosphereSound(key = 'default', mode = 'hover') {
        const profile = gameCardSoundProfiles[key] || gameCardSoundProfiles.default;
        const settings = (profile && (profile[mode] || profile.hover)) || gameCardSoundProfiles.default.hover;
        const ctx = ensureAudioContext();
        
        if (!ctx || !settings) {
            if (clickSound) {
                clickSound.currentTime = 0;
                clickSound.play().catch(() => {});
            }
            return;
        }
        
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const now = ctx.currentTime;
        const freqStart = settings.freqStart || 440;
        const freqEnd = settings.freqEnd !== undefined ? settings.freqEnd : freqStart;
        const duration = settings.duration || 0.3;
        const gainValue = settings.gain || 0.15;
        
        osc.type = settings.wave || 'sine';
        osc.frequency.setValueAtTime(freqStart, now);
        osc.frequency.linearRampToValueAtTime(freqEnd, now + duration);
        
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(gainValue, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + duration + 0.02);
    }
    
    function setupGameCardAtmosphere() {
        const gamePage = document.getElementById('page-games');
        if (!gamePage) return;
        const cards = gamePage.querySelectorAll('.game-card');
        if (!cards.length) return;
        
        cards.forEach(card => {
            if (card.dataset.ambientReady === 'true') return;
            card.dataset.ambientReady = 'true';
            const soundKey = card.dataset.sound || 'default';
            const cover = card.querySelector('.game-cover');
            
            const triggerAtmosphere = (mode = 'hover') => {
                if (cover) {
                    cover.classList.remove('game-cover-animate');
                    void cover.offsetWidth;
                    cover.classList.add('game-cover-animate');
                }
                playCardAtmosphereSound(soundKey, mode);
            };
            
            card.addEventListener('mouseenter', () => triggerAtmosphere('hover'));
            card.addEventListener('focus', () => triggerAtmosphere('hover'));
            card.addEventListener('touchstart', () => triggerAtmosphere('hover'));
            card.addEventListener('click', () => triggerAtmosphere('click'));
        });
    }

    function setupNavigation() {
        navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.dataset.navReady === 'true') return;
            link.dataset.navReady = 'true';

            link.addEventListener('click', (e) => {
                const hasHref = link.href && link.href !== '#' && !link.href.endsWith('#');
                const clickedButton = e.target.tagName === 'BUTTON' || e.target.closest('button');

                // Close mobile menu when link is clicked
                if (window.innerWidth <= 768) {
                    const mainNavLinks = document.querySelector('.navbar-links ul');
                    if (mainNavLinks) {
                        mainNavLinks.classList.remove('active');
                        document.body.classList.remove('menu-open');
                    }
                }

                if (hasHref && !clickedButton) {
                    return;
                }

                e.preventDefault();

                if (hasHref && clickedButton) {
                    window.location.href = link.href;
                    return;
                }

                const pageId = link.dataset.page ? `page-${link.dataset.page}` : null;
                if (pageId) {
                    showPage(pageId);
                }
            });
        });

        moreMenuBtn = document.getElementById('more-menu-btn');
        moreDropdown = document.getElementById('more-dropdown');
        const mainNavLinks = document.querySelector('.navbar-links ul');

        // On mobile, combine both menus into one
        function setupMobileMenu() {
            if (window.innerWidth <= 768 && mainNavLinks && moreDropdown) {
                // Remove any existing separator and more menu items
                const existingSeparator = mainNavLinks.querySelector('.mobile-menu-separator');
                const existingMoreItems = mainNavLinks.querySelectorAll('.mobile-more-item');
                
                if (existingSeparator) existingSeparator.remove();
                existingMoreItems.forEach(item => item.remove());
                
                // Add separator
                const separator = document.createElement('li');
                separator.className = 'mobile-menu-separator';
                separator.innerHTML = '<div style="height: 1px; background: rgba(0,0,0,0.1); margin: 0.5rem 0;"></div>';
                mainNavLinks.appendChild(separator);
                
                // Clone and add more menu items
                const moreLinks = moreDropdown.querySelectorAll('a');
                moreLinks.forEach(link => {
                    const li = document.createElement('li');
                    li.className = 'mobile-more-item';
                    const clonedLink = link.cloneNode(true);
                    li.appendChild(clonedLink);
                    mainNavLinks.appendChild(li);
                });
            } else if (mainNavLinks) {
                // Remove mobile items on desktop
                const existingSeparator = mainNavLinks.querySelector('.mobile-menu-separator');
                const existingMoreItems = mainNavLinks.querySelectorAll('.mobile-more-item');
                if (existingSeparator) existingSeparator.remove();
                existingMoreItems.forEach(item => item.remove());
            }
        }

        // Setup mobile menu on load and resize
        setupMobileMenu();
        window.addEventListener('resize', setupMobileMenu);

        if (moreMenuBtn && !moreMenuBtn.dataset.listenerAttached) {
            moreMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (window.innerWidth <= 768) {
                    // On mobile: toggle main nav (which now includes more items)
                    if (mainNavLinks) {
                        const isActive = mainNavLinks.classList.toggle('active');
                        // Prevent body scroll when menu is open
                        if (isActive) {
                            document.body.classList.add('menu-open');
                        } else {
                            document.body.classList.remove('menu-open');
                        }
                    }
                    // Keep dropdown hidden on mobile
                    if (moreDropdown) {
                        moreDropdown.classList.remove('active');
                    }
                } else {
                    // On desktop: toggle dropdown only
                    if (moreDropdown) {
                        moreDropdown.classList.toggle('active');
                    }
                    document.body.classList.remove('menu-open');
                }
            });
            moreMenuBtn.dataset.listenerAttached = 'true';
        }
    }
    
    // Reset scroll position on page load
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // --- Page Navigation ---
    function showPage(pageId) {
        // Hide all pages
        pages.forEach(page => {
            page.classList.remove('active');
        });
        
        // Show the target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            // Fallback to home if page not found
            document.getElementById('page-home').classList.add('active');
        }
        
        // Hide dropdown menu
        if (moreDropdown) {
            moreDropdown.classList.remove('active');
        }
        
        // Reset scroll position to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.scrollTop = 0;
        }
        // Also reset body and html scroll
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        // Reset the active page scroll position
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            activePage.scrollTop = 0;
        }
        
        // Trigger counter animations if stats section is visible on the new page
        setTimeout(() => {
            const statsSection = document.querySelector('.stats-section');
            if (statsSection) {
                const rect = statsSection.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                if (isVisible) {
                    // Reset and re-animate counters
                    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
                    statNumbers.forEach(statNumber => {
                        statNumber.classList.remove('counted');
                        statNumber.dataset.animating = 'false';
                        statNumber.textContent = '0';
                    });
                    // Trigger animation after a short delay
                    setTimeout(() => {
                        initCounterAnimations();
                    }, 300);
                }
            }
            
            // Re-setup vocab audio if knowledge page is shown
            if (pageId === 'page-knowledge' || document.getElementById('page-knowledge')?.classList.contains('active')) {
                setTimeout(() => {
                    if (typeof setupVocabAudio === 'function') {
                        setupVocabAudio();
                    }
                }, 100);
            }
            
            // Refresh interactive backgrounds if the games page is active
            if (pageId === 'page-games' || document.getElementById('page-games')?.classList.contains('active')) {
                setTimeout(() => {
                    setupGameCardAtmosphere();
                }, 80);
            }
        }, 100);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const mainNavLinks = document.querySelector('.navbar-links ul');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // On mobile: close main nav if clicking outside
            if (
                mainNavLinks &&
                moreMenuBtn &&
                !mainNavLinks.contains(e.target) &&
                !moreMenuBtn.contains(e.target)
            ) {
                mainNavLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        } else {
            // On desktop: close dropdown if clicking outside
            if (
                moreDropdown &&
                moreMenuBtn &&
                !moreDropdown.contains(e.target) &&
                !moreMenuBtn.contains(e.target)
            ) {
                moreDropdown.classList.remove('active');
            }
        }
    });

    // --- Modal Handling ---
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    const modalCloseBtns = document.querySelectorAll('.modal-close-btn');

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if(modal) modal.classList.add('active');
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if(modal) modal.classList.remove('active');
    }

    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.dataset.modal);
        });
    });

    // Close modal by clicking overlay
    modalOverlays.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // --- Translation Toggle ---
    const translationToggleBtns = document.querySelectorAll('.translation-toggle-btn');
    translationToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Special handling for objectives page
            if (btn.id === 'toggle-translation-obj') {
                const contentDiv = document.getElementById('objectives-content');
                if (!contentDiv) return;
                
                // Check current state by button text or dataset
                const isEnglish = btn.textContent.trim() === 'See Translation' || contentDiv.dataset.isMyanmar !== 'true';
                
                if (isEnglish) {
                    // Replace with Burmese
                    contentDiv.innerHTML = `
                        <div class="objective-card">
                            <div class="objective-card-icon">🗣️</div>
                            <h2 class="objective-card-title">1. Language Skills</h2>
                            <p class="objective-card-subtitle">စကားပြောနဲ့ စာဖတ် ကျွမ်းကျင်မှု</p>
                            <ul class="objective-card-list">
                                <li>စာလုံးအသံ (phonics) နှင့် အသံထွက်မှန်မှန်ကို သိရှိနိုင်စွမ်း ဖွံ့ဖြိုးစေခြင်း။ စကားလုံးအသစ်များကို လေ့လာနိုင်ခြင်း။</li>
                                <li>စာကြောင်းများကို ဖတ်ပြီး နားထောင် နားလည်နိုင်စွမ်း ရရှိစေခြင်း</li>
                            </ul>
                        </div>
                        <div class="objective-card">
                            <div class="objective-card-icon">👂</div>
                            <h2 class="objective-card-title">2. Listening & Speaking</h2>
                            <p class="objective-card-subtitle">နားထောင်ခြင်းနှင့် ပြောဆိုခြင်း</p>
                            <ul class="objective-card-list">
                                <li>ဆရာ/မိမိမိတ်ဆွေများ၏ စကားကို နားထောင် နားလည်နိုင်စွမ်း တိုးတက်စေခြင်း။</li>
                            </ul>
                        </div>
                        <div class="objective-card">
                            <div class="objective-card-icon">✍️</div>
                            <h2 class="objective-card-title">3. Reading & Writing</h2>
                            <p class="objective-card-subtitle">စာဖတ်ခြင်းနှင့် စာရေးခြင်း</p>
                            <ul class="objective-card-list">
                                <li>စာလုံးများနှင့် စကားလုံးများကို မှန်မှန်ရေးနိုင်ခြင်း။</li>
                            </ul>
                        </div>
                        <div class="objective-card">
                            <div class="objective-card-icon">📚</div>
                            <h2 class="objective-card-title">4. Vocabulary & Grammar</h2>
                            <p class="objective-card-subtitle">အသုံးအနှုန်းနှင့် စကားပုံသဘော</p>
                            <ul class="objective-card-list">
                                <li>နေ့စဉ်အသုံးဝင်သော စကားလုံးအသစ်များကို သိရှိနိုင်ခြင်း။</li>
                                <li>ရိုးရှင်းသော ဝေါဟာရနှင့် အခြေခံဝါကျစနစ်များကို အသုံးပြုနိုင်ခြင်း။</li>
                            </ul>
                        </div>
                        <div class="objective-card">
                            <div class="objective-card-icon">💡</div>
                            <h2 class="objective-card-title">5. Creative & Critical Thinking</h2>
                            <p class="objective-card-subtitle">ဖန်တီးမှုနှင့် သဘောထားစူးစမ်းနိုင်မှု</p>
                            <ul class="objective-card-list">
                                <li>ပုံစံအသစ်များကို ဖန်တီး၍ စကားလုံးအသုံးပြုနိုင်ခြင်း။</li>
                                <li>အကြောင်းအရာများကို နားထောင်ပြီး မေးခွန်းများ ဖြေဆိုနိုင်ခြင်း။</li>
                            </ul>
                        </div>
                    `;
                    contentDiv.dataset.isMyanmar = 'true';
                    btn.textContent = 'See English';
                } else {
                    // Replace with English
                    contentDiv.innerHTML = `
                        <div class="objective-card">
                            <div class="objective-card-icon">🗣️</div>
                            <h2 class="objective-card-title">1. Language Skills</h2>
                            <p class="objective-card-subtitle">Speaking and Reading Proficiency</p>
                            <ul class="objective-card-list">
                                <li>Develop the ability to recognize phonics and produce accurate pronunciation.</li>
                                <li>Acquire new vocabulary effectively.</li>
                                <li>Strengthen comprehension skills by reading sentences and listening attentively.</li>
                            </ul>
                        </div>
                        <div class="objective-card">
                            <div class="objective-card-icon">👂</div>
                            <h2 class="objective-card-title">2. Listening and Speaking</h2>
                            <p class="objective-card-subtitle">Communication Skills</p>
                            <ul class="objective-card-list">
                                <li>Enhance the ability to listen to and understand teachers and peers.</li>
                                <li>Communicate using simple, clear sentences.</li>
                                <li>Respond appropriately to questions.</li>
                            </ul>
                        </div>
                        <div class="objective-card">
                            <div class="objective-card-icon">✍️</div>
                            <h2 class="objective-card-title">3. Reading and Writing</h2>
                            <p class="objective-card-subtitle">Literacy Development</p>
                            <ul class="objective-card-list">
                                <li>Write letters and words correctly with proper spelling.</li>
                                <li>Construct sentences accurately and coherently.</li>
                            </ul>
                        </div>
                        <div class="objective-card">
                            <div class="objective-card-icon">📚</div>
                            <h2 class="objective-card-title">4. Vocabulary and Grammar</h2>
                            <p class="objective-card-subtitle">Language Foundation</p>
                            <ul class="objective-card-list">
                                <li>Expand knowledge of practical, everyday vocabulary.</li>
                                <li>Apply basic vocabulary and fundamental sentence structures in communication.</li>
                            </ul>
                        </div>
                        <div class="objective-card">
                            <div class="objective-card-icon">💡</div>
                            <h2 class="objective-card-title">5. Creative and Critical Thinking</h2>
                            <p class="objective-card-subtitle">Advanced Skills</p>
                            <ul class="objective-card-list">
                                <li>Generate new ideas and apply vocabulary creatively.</li>
                                <li>Engage with topics by listening carefully and answering questions thoughtfully.</li>
                            </ul>
                        </div>
                    `;
                    contentDiv.dataset.isMyanmar = 'false';
                    btn.textContent = 'See Translation';
                }
                return;
            }
            
            // Default behavior for other translation toggles
            const targetId = btn.dataset.target;
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const isVisible = targetElement.style.display === 'block';
                targetElement.style.display = isVisible ? 'none' : 'block';
                btn.textContent = isVisible ? 'See Translation' : 'Hide Translation';
            }
        });
    });

    // --- Lesson 1 & 2 Modals ---
    const lesson1QuestionsBtn = document.getElementById('open-lesson1-questions');
    if (lesson1QuestionsBtn) {
        lesson1QuestionsBtn.addEventListener('click', () => openModal('lesson1-questions-modal'));
    }

    const lesson2QuestionsBtn = document.getElementById('open-lesson2-questions');
    if (lesson2QuestionsBtn) {
        lesson2QuestionsBtn.addEventListener('click', () => openModal('lesson2-questions-modal'));
    }

    // --- Speaking Practice Recorder ---
    const speakingPracticePrompts = {
        lesson1: [
            'Where do you usually eat out?',
            'What do you usually have there?',
            'Do you like the places? Why?'
        ],
        lesson2: [
            'Where do you usually have breakfast?',
            'What do you have for breakfast at home?'
        ]
    };
    
    function setupSpeakingPractice() {
        Object.keys(speakingPracticePrompts).forEach(practiceId => {
            initSpeakingRecorder(practiceId, speakingPracticePrompts[practiceId]);
        });
    }
    
    function initSpeakingRecorder(practiceId, prompts = []) {
        const recordBtn = document.getElementById(`${practiceId}-record-btn`);
        const stopBtn = document.getElementById(`${practiceId}-stop-btn`);
        const playBtn = document.getElementById(`${practiceId}-play-btn`);
        const statusEl = document.getElementById(`${practiceId}-recording-status`);
        const audioEl = document.getElementById(`${practiceId}-recording-audio`);
        const ratingEl = document.getElementById(`${practiceId}-speaking-rating`);
        
        if (!recordBtn || !stopBtn || !playBtn || !statusEl || !audioEl || !ratingEl) {
            return;
        }
        if (recordBtn.dataset.recorderReady === 'true') {
            return;
        }
        recordBtn.dataset.recorderReady = 'true';
        
        let mediaRecorder = null;
        let audioChunks = [];
        let recordingStart = null;
        let audioUrl = null;
        let currentStream = null;
        
        async function startRecording() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                statusEl.textContent = 'Recording is not supported on this device.';
                return;
            }
            
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(currentStream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = () => {
                    currentStream?.getTracks().forEach(track => track.stop());
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const durationMs = Date.now() - recordingStart;
                    if (audioUrl) {
                        URL.revokeObjectURL(audioUrl);
                    }
                    audioUrl = URL.createObjectURL(audioBlob);
                    audioEl.src = audioUrl;
                    audioEl.style.display = 'block';
                    playBtn.disabled = false;
                    evaluateRecording(durationMs);
                };
                
                mediaRecorder.start();
                recordingStart = Date.now();
                statusEl.textContent = 'Recording... speak clearly near your microphone.';
                recordBtn.disabled = true;
                stopBtn.disabled = false;
                playBtn.disabled = true;
                ratingEl.textContent = 'Listening... keep going!';
            } catch (error) {
                console.error('Recording error:', error);
                statusEl.textContent = 'Unable to access microphone. Please check permissions.';
                recordBtn.disabled = false;
                stopBtn.disabled = true;
                playBtn.disabled = true;
            }
        }
        
        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                statusEl.textContent = 'Recording stopped. Review your answer below.';
                recordBtn.disabled = false;
                stopBtn.disabled = true;
            }
        }
        
        function evaluateRecording(durationMs) {
            const seconds = Math.max(0.5, durationMs / 1000);
            let feedback = '';
            let score = '';
            
            if (seconds < 4) {
                score = '⭐';
                feedback = 'Try speaking a little longer to cover all questions.';
            } else if (seconds < 8) {
                score = '⭐⭐';
                feedback = 'Nice effort! Add more details for a stronger answer.';
            } else {
                score = '⭐⭐⭐';
                feedback = 'Awesome! You gave a complete response.';
            }
            
            const promptHint = prompts.length ? `Focus on: ${prompts.join(' · ')}` : '';
            ratingEl.textContent = `${score} (${seconds.toFixed(1)}s) ${feedback} ${promptHint}`;
        }
        
        recordBtn.addEventListener('click', startRecording);
        stopBtn.addEventListener('click', stopRecording);
        playBtn.addEventListener('click', () => {
            if (audioEl.src) {
                audioEl.play().catch(() => {});
            }
        });
    }
    
    // --- Lesson 2 Vocabulary ---
    const normalizeVocabKey = (value) => value ? value.toString().trim().toLowerCase().replace(/\s+/g, '') : '';
    
    const vocabData = {
        milk: { text: 'Milk', phonetic: '/mɪlk/', type: 'n.', meaning: 'နို့', audio: 'audio/vocab/milk.mp3', synonyms: ['dairy milk', 'cow milk', 'fresh milk'], antonyms: ['juice', 'soda'] },
        sardine: { text: 'Sardine', phonetic: '/sɑːrˈdiːn/', type: 'n.', meaning: 'ဆာဒင်းငါး', audio: 'audio/vocab/sardine.mp3', synonyms: ['small fish', 'pilchard', 'tinned fish'], antonyms: ['beef', 'pork'] },
        sandwiches: { text: 'Sandwiches', phonetic: '/ˈsænwɪdʒɪz/', type: 'n.', meaning: 'အသားညှပ်ပေါင်မုန့်', audio: 'audio/vocab/sandwiches.mp3', synonyms: ['subs', 'filled bread', 'stacked bread'], antonyms: ['soup', 'stew'] },
        breakfast: { text: 'Breakfast', phonetic: '/ˈbrekfəst/', type: 'n.', meaning: 'မနက်စာ', audio: 'audio/vocab/breakfast.mp3', synonyms: ['morning meal', 'first meal', 'daybreak meal'], antonyms: ['dinner', 'late-night meal'] },
        canteen: { text: 'Canteen', phonetic: '/kænˈtiːn/', type: 'n.', meaning: 'မုန့်ဆိုင်', audio: 'audio/vocab/canteen.mp3', synonyms: ['cafeteria', 'dining hall', 'lunchroom'], antonyms: ['home kitchen', 'street stall'] },
        calcium: { text: 'Calcium', phonetic: '/ˈkælsiəm/', type: 'n.', meaning: 'ကယ်လ်ဆီယမ်ဓာတ်', audio: 'audio/vocab/calcium.mp3', synonyms: ['bone mineral', 'Ca', 'nutrient'], antonyms: ['calcium deficit', 'calcium lack'] },
        bones: { text: 'Bones', phonetic: '/boʊnz/', type: 'n.', meaning: 'အရိုးများ', audio: 'audio/vocab/bones.mp3', synonyms: ['skeleton', 'framework', 'bone structure'], antonyms: ['flesh', 'muscle'] },
        omega3: { text: 'Omega-3', phonetic: '/oʊˈmiːɡə θriː/', type: 'n.', meaning: 'အိုမီဂါသုံး', audio: 'audio/vocab/omega3.mp3', synonyms: ['omega-three', 'healthy fat', 'essential fat'], antonyms: ['trans fat', 'bad fat'] },
        fattyacids: { text: 'Fatty Acids', phonetic: '/ˌfæti ˈæsɪdz/', type: 'n.', meaning: 'အဆီအက်ဆစ်', audio: 'audio/vocab/fattyacids.mp3', synonyms: ['lipids', 'healthy fats', 'fat molecules'], antonyms: ['simple sugars', 'starches'] },
        skin: { text: 'Skin', phonetic: '/skɪn/', type: 'n.', meaning: 'အသားအရေ', audio: 'audio/vocab/skin.mp3', synonyms: ['dermis', 'epidermis', 'outer layer'], antonyms: ['core', 'center'] },
        brain: { text: 'Brain', phonetic: '/breɪn/', type: 'n.', meaning: 'ဦးနှောက်', audio: 'audio/vocab/brain.mp3', synonyms: ['mind', 'cerebrum', 'thinking organ'], antonyms: ['body', 'muscle'] },
        peas: { text: 'Peas', phonetic: '/piːz/', type: 'n.', meaning: 'စတော်ပဲ', audio: 'audio/vocab/peas.mp3', synonyms: ['green peas', 'legumes', 'pea seeds'], antonyms: ['steak', 'pork'] },
        contain: { text: 'Contain', phonetic: '/kənˈteɪn/', type: 'v.', meaning: 'ပါဝင်သည်', audio: 'audio/vocab/contain.mp3', synonyms: ['include', 'hold', 'carry'], antonyms: ['exclude', 'release', 'omit'] },
        proteins: { text: 'Proteins', phonetic: '/ˈproʊtiːnz/', type: 'n.', meaning: 'ပရိုတင်းများ', audio: 'audio/vocab/proteins.mp3', synonyms: ['amino nutrients', 'protein chains', 'body builders'], antonyms: ['carbohydrates', 'fats'] },
        protein: { text: 'Protein', phonetic: '/ˈproʊtiːn/', type: 'n.', meaning: 'ပရိုတင်းဓာတ်', audio: 'audio/vocab/protein.mp3', synonyms: ['lean protein', 'amino nutrient', 'muscle food'], antonyms: ['fat', 'sugar'] },
        carbohydrates: { text: 'Carbohydrates', phonetic: '/ˌkɑːrboʊˈhaɪdreɪts/', type: 'n.', meaning: 'ကာဗိုဟိုက်ဒရိတ်', audio: 'audio/vocab/carbohydrates.mp3', synonyms: ['carbs', 'starches', 'energy sugars'], antonyms: ['proteins', 'fats'] },
        muscles: { text: 'Muscles', phonetic: '/ˈmʌsəlz/', type: 'n.', meaning: 'ကြွက်သားများ', audio: 'audio/vocab/muscles.mp3', synonyms: ['muscle tissue', 'brawn', 'power fibers'], antonyms: ['fat', 'flab'] },
        noodles: { text: 'Noodles', phonetic: '/ˈnuːdəlz/', type: 'n.', meaning: 'ခေါက်ဆွဲ', audio: 'audio/vocab/noodles.mp3', synonyms: ['pasta', 'egg noodles', 'noodle strands'], antonyms: ['rice cakes', 'flatbread'] },
        chicken: { text: 'Chicken', phonetic: '/ˈtʃɪk.ən/', type: 'n.', meaning: 'ကြက်သား', audio: 'audio/vocab/chicken.mp3', synonyms: ['poultry', 'hen meat', 'roaster'], antonyms: ['beef', 'mutton'] },
        broccoli: { text: 'Broccoli', phonetic: '/ˈbrɑːkəli/', type: 'n.', meaning: 'ဘရိုကိုလီ', audio: 'audio/vocab/broccoli.mp3', synonyms: ['green florets', 'crucifer', 'broc'], antonyms: ['candy', 'fried dough'] },
        vitamink: { text: 'Vitamin K', phonetic: '/ˈvaɪtəmɪn ˈkeɪ/', type: 'n.', meaning: 'ဗီတာမင် K', audio: 'audio/vocab/vitamink.mp3', synonyms: ['nutrient K', 'phylloquinone', 'blood vitamin'], antonyms: ['vitamin deficiency'] },
        darkchocolate: { text: 'Dark Chocolate', phonetic: '/dɑːrk ˈtʃɒkələt/', type: 'n.', meaning: 'အနက်ရောင်ချောကလက်', audio: 'audio/vocab/darkchocolate.mp3', synonyms: ['cocoa bar', 'bitter chocolate', 'black chocolate'], antonyms: ['white chocolate', 'milk chocolate'] },
        rice: { text: 'Rice', phonetic: '/raɪs/', type: 'n.', meaning: 'ထမင်း', audio: 'audio/vocab/rice.mp3', synonyms: ['grain', 'white rice', 'steamed rice'], antonyms: ['bread', 'noodles'] },
        fishcurry: { text: 'Fish Curry', phonetic: '/fɪʃ ˈkʌri/', type: 'n.', meaning: 'ငါးဟင်း', audio: 'audio/vocab/fishcurry.mp3', synonyms: ['seafood curry', 'fish stew', 'fish masala'], antonyms: ['meat stew', 'vegetable curry'] },
        stringbeans: { text: 'String Beans', phonetic: '/strɪŋ biːnz/', type: 'n.', meaning: 'ပဲကြော်', audio: 'audio/vocab/stringbeans.mp3', synonyms: ['green beans', 'yard-long beans', 'snap beans'], antonyms: ['potato chips', 'fried snacks'] },
        bananas: { text: 'Bananas', phonetic: '/bəˈnænəz/', type: 'n.', meaning: 'ငှက်ပျောသီးများ', audio: 'audio/vocab/bananas.mp3', synonyms: ['plantains', 'yellow fruit', 'banana fingers'], antonyms: ['lemons', 'sour berries'] },
        fibre: { text: 'Fibre', phonetic: '/ˈfaɪbər/', type: 'n.', meaning: 'အမျှင်ဓာတ်', audio: 'audio/vocab/fibre.mp3', synonyms: ['roughage', 'dietary fiber', 'bran'], antonyms: ['refined sugar', 'white flour'] },
        vegetables: { text: 'Vegetables', phonetic: '/ˈvedʒtəblz/', type: 'n.', meaning: 'ဟင်းသီးဟင်းရွက်များ', audio: 'audio/vocab/vegetables.mp3', synonyms: ['veggies', 'greens', 'garden produce'], antonyms: ['desserts', 'junk food'] },
        eyes: { text: 'Eyes', phonetic: '/aɪz/', type: 'n.', meaning: 'မျက်လုံးများ', audio: 'audio/vocab/eyes.mp3', synonyms: ['vision organs', 'peepers', 'eyeballs'], antonyms: ['ears', 'mouth'] },
        basketball: { text: 'Basketball', phonetic: '/ˈbæskɪtˌbɔːl/', type: 'n.', meaning: 'ဘတ်စကတ်ဘော', audio: 'audio/vocab/basketball.mp3', synonyms: ['hoops', 'court game', 'ball game'], antonyms: ['swimming', 'cycling'] },
    };
    
    const vocabModalText = document.getElementById('vocab-word-text');
    const vocabModalPhonetic = document.getElementById('vocab-word-phonetic');
    const vocabModalType = document.getElementById('vocab-word-type');
    const vocabModalMeaning = document.getElementById('vocab-word-meaning')?.querySelector('span');
    const vocabModalExtra = document.getElementById('vocab-word-extra');
    const vocabAudio = document.getElementById('vocab-audio');
    const vocabAudioBtn = document.getElementById('vocab-word-audio-btn');
    let currentVocabWordKey = null;
    let currentVocabWordData = null;
    
    function showVocabModal(rawKey) {
        const key = normalizeVocabKey(rawKey);
        const data = vocabData[key];
        if (!data || !vocabModalText || !vocabModalMeaning || !vocabModalExtra) {
            console.warn('Missing vocab data for', rawKey);
            return;
        }
        
        currentVocabWordKey = key;
        currentVocabWordData = data;
        
        vocabModalText.textContent = data.text;
        vocabModalPhonetic.textContent = data.phonetic;
        vocabModalType.textContent = data.type;
        vocabModalMeaning.textContent = data.meaning;
        const formatList = (list, fallback) => Array.isArray(list) && list.length ? list.join(', ') : fallback;
        vocabModalExtra.innerHTML = `<strong>Synonyms:</strong> ${formatList(data.synonyms, '—')}<br><strong>Antonyms:</strong> ${formatList(data.antonyms, '—')}`;
                
        if (vocabAudio && data.audio) {
            vocabAudio.src = data.audio;
        }
                
                openModal('vocab-modal');
            }
    
    if (vocabAudioBtn) {
        vocabAudioBtn.addEventListener('click', () => {
            if (currentVocabWordData) {
                if (vocabAudio && currentVocabWordData.audio) {
                    vocabAudio.currentTime = 0;
                    vocabAudio.play().catch(() => speakWord(currentVocabWordData.text, vocabAudioBtn));
                } else {
                    speakWord(currentVocabWordData.text, vocabAudioBtn);
                }
            }
        });
    }
    
    // --- Game Message Modal ---
    const gameMessageModal = document.getElementById('game-message-modal');
    const gameMessageTitle = document.getElementById('game-message-title');
    const gameMessageText = document.getElementById('game-message-text');
    const gameMessageCloseBtn = document.getElementById('game-message-close');
    if (gameMessageCloseBtn) {
        gameMessageCloseBtn.addEventListener('click', () => closeModal('game-message-modal'));
    }

    // Make showGameMessage globally accessible for game files
    window.showGameMessage = function(title, text) {
        if (gameMessageTitle && gameMessageText && gameMessageModal) {
            gameMessageTitle.textContent = title;
            gameMessageText.textContent = text;
            openModal('game-message-modal');
        }
    };

    // --- ✨ HEALTHY MEAL PLAN GENERATOR ---
    
    const geminiModal = document.getElementById('gemini-modal');
    const geminiLoadingEl = document.getElementById('gemini-loading');
    const geminiResponseEl = document.getElementById('gemini-response');
    
    const geminiPlannerBtn = document.getElementById('open-gemini-planner');
    if (geminiPlannerBtn) {
        geminiPlannerBtn.addEventListener('click', generateMealPlan);
    }

    // Pre-defined healthy meal plans for 6th-grade students
    const mealPlans = [
        {
            breakfast: "Rice with fried egg and vegetables",
            lunch: "Chicken curry with rice, string beans, and a banana",
            dinner: "Fish curry with rice and mixed vegetables",
            snack: "Fresh fruit (apple or orange)",
            note: "This meal plan gives you energy for studying and playing!"
        },
        {
            breakfast: "Mohinga (rice noodles with fish soup) - a healthy Myanmar breakfast",
            lunch: "Rice with pork curry, broccoli, and a small bowl of soup",
            dinner: "Fried rice with vegetables and chicken pieces",
            snack: "Yogurt with fresh fruit",
            note: "Great for growing strong and staying healthy!"
        },
        {
            breakfast: "Boiled eggs with bread and a glass of milk",
            lunch: "Rice with fish curry, fried string beans, and a banana",
            dinner: "Chicken and vegetable stir-fry with rice",
            snack: "Mixed nuts (almonds or peanuts)",
            note: "Perfect for keeping your body and mind strong!"
        },
        {
            breakfast: "Rice porridge with chicken and vegetables",
            lunch: "Rice with beef curry, green vegetables, and a piece of fruit",
            dinner: "Fried noodles with vegetables and egg",
            snack: "Fresh mango or papaya",
            note: "These foods help you grow taller and do well in school!"
        },
        {
            breakfast: "Fried rice with vegetables and egg",
            lunch: "Rice with chicken curry, mixed vegetables, and a banana",
            dinner: "Fish soup with rice and vegetables",
            snack: "A glass of milk with a small cookie",
            note: "Eating healthy helps you stay active and learn better!"
        },
        {
            breakfast: "Bread with peanut butter and a banana",
            lunch: "Rice with pork curry, string beans, and a piece of fruit",
            dinner: "Chicken curry with rice and green vegetables",
            snack: "Fresh orange or apple slices",
            note: "This balanced meal plan gives you all the nutrients you need!"
        },
        {
            breakfast: "Rice with fried egg and a small bowl of soup",
            lunch: "Rice with fish curry, broccoli, and a banana",
            dinner: "Vegetable and chicken stir-fry with rice",
            snack: "Yogurt or fresh fruit",
            note: "Healthy eating makes you stronger and happier!"
        },
        {
            breakfast: "Mohinga or rice noodles with vegetables",
            lunch: "Rice with chicken curry, mixed vegetables, and fruit",
            dinner: "Fried rice with vegetables, chicken, and egg",
            snack: "A handful of mixed nuts",
            note: "These meals provide energy for your whole day!"
        }
    ];

    /**
     * Generates a healthy meal plan from pre-defined data.
     */
    function generateMealPlan() {
        // Show the modal
        openModal('gemini-modal');
        geminiLoadingEl.style.display = 'block';
        geminiResponseEl.innerHTML = '';

        // Simulate a brief loading delay for better UX
        setTimeout(() => {
            // Randomly select a meal plan
            const randomIndex = Math.floor(Math.random() * mealPlans.length);
            const selectedPlan = mealPlans[randomIndex];

            // Format and display the meal plan
            const html = `
                <div style="padding: 1rem;">
                    <h3 style="color: var(--color-primary); margin-bottom: 1rem; font-size: 1.2rem;">🍽️ Your Healthy Meal Plan</h3>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--color-text); margin-bottom: 0.5rem; font-size: 1rem; display: flex; align-items: center;">
                            <span style="margin-right: 0.5rem;">🌅</span> Breakfast
                        </h4>
                        <p style="color: var(--color-subtext); margin-left: 2rem; line-height: 1.6;">${selectedPlan.breakfast}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--color-text); margin-bottom: 0.5rem; font-size: 1rem; display: flex; align-items: center;">
                            <span style="margin-right: 0.5rem;">☀️</span> Lunch
                        </h4>
                        <p style="color: var(--color-subtext); margin-left: 2rem; line-height: 1.6;">${selectedPlan.lunch}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--color-text); margin-bottom: 0.5rem; font-size: 1rem; display: flex; align-items: center;">
                            <span style="margin-right: 0.5rem;">🌙</span> Dinner
                        </h4>
                        <p style="color: var(--color-subtext); margin-left: 2rem; line-height: 1.6;">${selectedPlan.dinner}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="color: var(--color-text); margin-bottom: 0.5rem; font-size: 1rem; display: flex; align-items: center;">
                            <span style="margin-right: 0.5rem;">🍎</span> Healthy Snack
                        </h4>
                        <p style="color: var(--color-subtext); margin-left: 2rem; line-height: 1.6;">${selectedPlan.snack}</p>
                    </div>

                    <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-left: 4px solid var(--color-accent); border-radius: 4px;">
                        <p style="color: var(--color-text); margin: 0; font-style: italic;">✨ ${selectedPlan.note}</p>
                    </div>
                </div>
            `;

            geminiResponseEl.innerHTML = html;
            geminiLoadingEl.style.display = 'none';
        }, 500); // Small delay for better user experience
    }
    
    // Game logic moved to separate files:
    // - hangman-game.js
    // - mcq-game.js
    // - listening-game.js
    // - ordering-game.js

    // --- Counter Animation for Stats ---
    function animateCounter(element) {
        if (!element) return;
        
        // Skip if already animating or completed
        if (element.dataset.animating === 'true' || element.classList.contains('counted')) return;
        
        const target = parseInt(element.getAttribute('data-target')) || 0;
        if (target === 0) {
            element.textContent = '0';
            element.classList.add('counted');
            return;
        }
        
        // Mark as animating
        element.dataset.animating = 'true';
        
        const duration = 2000; // 2 seconds
        const startTime = performance.now();
        let animationFrameId;
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOutQuart * target);
            
            element.textContent = current;
            
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
                element.dataset.animating = 'false';
                element.classList.add('counted');
            }
        };
        
        // Reset to 0 first
        element.textContent = '0';
        // Start animation
        animationFrameId = requestAnimationFrame(updateCounter);
    }

    // Function to initialize counter animations
    function initCounterAnimations() {
        const statNumbers = document.querySelectorAll('.stat-number[data-target]');
        
        statNumbers.forEach((statNumber, index) => {
            // Skip if already counted
            if (statNumber.classList.contains('counted')) {
                return;
            }
            
            // Add slight delay for staggered effect
            setTimeout(() => {
                animateCounter(statNumber);
            }, index * 150);
        });
    }

    // Intersection Observer for counter animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px'
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Find all stat numbers in the intersecting element
                const statNumbers = entry.target.querySelectorAll('.stat-number[data-target]');
                statNumbers.forEach((statNumber, index) => {
                    if (!statNumber.classList.contains('counted')) {
                        // Add staggered delay
                        setTimeout(() => {
                        animateCounter(statNumber);
                        }, index * 150);
                    }
                });
                
                // Also check if the entry itself is a stat-item
                if (entry.target.classList.contains('stat-item')) {
                    const statNumber = entry.target.querySelector('.stat-number[data-target]');
                    if (statNumber && !statNumber.classList.contains('counted')) {
                        animateCounter(statNumber);
                    }
                }
            }
        });
    }, observerOptions);

    // Initialize counter animations when DOM is ready
    function setupCounterAnimations() {
        const statItems = document.querySelectorAll('.stat-item');
        const statsSection = document.querySelector('.stats-section');
        
        if (statItems.length > 0) {
            // Reset all stat numbers to 0 and remove counted class for fresh start
            const statNumbers = document.querySelectorAll('.stat-number[data-target]');
            statNumbers.forEach(statNumber => {
                statNumber.textContent = '0';
                statNumber.classList.remove('counted');
                statNumber.dataset.animating = 'false';
            });
            
            // Observe each stat item individually
            statItems.forEach(item => {
                statsObserver.observe(item);
            });
            
            // Also observe the stats section container
            if (statsSection) {
                statsObserver.observe(statsSection);
            }
            
            // Check if stats section is already visible on page load
            if (statsSection) {
                const rect = statsSection.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (isVisible) {
                    // If visible, animate immediately after a short delay
                    setTimeout(() => {
                        initCounterAnimations();
                    }, 300);
                } else {
                    // If not visible, wait a bit and check again (in case of slow loading)
                    setTimeout(() => {
                        const rect2 = statsSection.getBoundingClientRect();
                        const isVisible2 = rect2.top < window.innerHeight && rect2.bottom > 0;
                        if (isVisible2) {
                            initCounterAnimations();
                        }
                    }, 1000);
                }
            } else {
                // If no stats section found, try to animate any stat numbers found
                setTimeout(() => {
                    initCounterAnimations();
                }, 500);
            }
        }
    }
    
    // --- Global Scroll-based Reveal Animations ---
    function setupScrollAnimations() {
        const animatedElements = document.querySelectorAll(
            '.animate-card, .animate-fade-in, .animate-fade-in-delay, .animate-slide-up, .animate-slide-up-delay'
        );

        if (animatedElements.length === 0) return;

        // Fallback for browsers without IntersectionObserver
        if (!('IntersectionObserver' in window)) {
            animatedElements.forEach(el => el.classList.add('in-view'));
            return;
        }

        const scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -10% 0px'
        });

        animatedElements.forEach(el => {
            // If element is already in viewport (e.g., top of page), reveal immediately
            const rect = el.getBoundingClientRect();
            const inViewNow = rect.top < window.innerHeight && rect.bottom > 0;
            if (inViewNow) {
                el.classList.add('in-view');
            } else {
                scrollObserver.observe(el);
            }
        });
    }
    
    // Setup on DOMContentLoaded
    setupCounterAnimations();
    setupScrollAnimations();
    
    // Also setup on window load as fallback
    window.addEventListener('load', () => {
        setTimeout(() => {
            setupCounterAnimations();
            setupScrollAnimations();
        }, 300);
    });
    
    // Additional trigger when page becomes visible (for single-page navigation)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(() => {
                const statNumbers = document.querySelectorAll('.stat-number[data-target]:not(.counted)');
                if (statNumbers.length > 0) {
                    statNumbers.forEach((statNumber, index) => {
                        setTimeout(() => {
                            animateCounter(statNumber);
                        }, index * 150);
                    });
                }
            }, 200);
        }
    });

    // --- Scroll to Top Button ---
    function initScrollToTopButton() {
        const scrollBtn = document.getElementById('scroll-to-top-btn');
        if (!scrollBtn) {
            setTimeout(initScrollToTopButton, 300);
            return;
        }

        if (scrollBtn.dataset.initialized === 'true') {
            return;
        }
        scrollBtn.dataset.initialized = 'true';

        const getScrollPosition = () => (
            window.pageYOffset ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            0
        );

        const toggleButton = () => {
            if (getScrollPosition() > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        };

        const scrollToTop = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            document.body.scrollTo({ top: 0, behavior: 'smooth' });
            const appContainer = document.getElementById('app-container');
            if (appContainer) {
                appContainer.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        scrollBtn.addEventListener('click', scrollToTop);
        window.addEventListener('scroll', toggleButton, { passive: true });

        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.addEventListener('scroll', toggleButton, { passive: true });
        }

        toggleButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollToTopButton);
    } else {
        initScrollToTopButton();
    }

    // --- Knowledge Page Vocabulary Audio ---
    function speakWord(word, targetElement) {
        const normalizedWord = word?.trim();
        if (!normalizedWord) {
            console.error('No word data found for pronunciation');
                    return;
                }
                
                if (!('speechSynthesis' in window)) {
                    alert('Your browser does not support text-to-speech. Please use a modern browser.');
                    return;
                }
                
                if (speechSynthesis.speaking) {
                    speechSynthesis.cancel();
                }
                
        const utterance = new SpeechSynthesisUtterance(normalizedWord);
                utterance.lang = 'en-US';
        utterance.rate = 0.85;
                utterance.pitch = 1;
                utterance.volume = 1;
                
        const toggleActiveState = (isActive) => {
            if (!targetElement) return;
            if (targetElement.classList.contains('vocab-word')) {
                targetElement.classList.toggle('speaking', isActive);
            } else {
                targetElement.style.background = isActive ? 'var(--color-blue)' : 'var(--color-pumpkin)';
            }
                };
                
        utterance.onstart = () => toggleActiveState(true);
        utterance.onend = () => toggleActiveState(false);
                utterance.onerror = (event) => {
                    console.error('Speech synthesis error:', event);
            toggleActiveState(false);
                };
                
                speechSynthesis.speak(utterance);
                
        if (targetElement) {
            targetElement.style.transform = 'scale(0.95)';
                setTimeout(() => {
                targetElement.style.transform = '';
            }, 160);
        }
    }
    
    function setupVocabAudio() {
        document.querySelectorAll('.vocab-audio-btn').forEach(btn => {
            if (btn.dataset.audioReady === 'true') return;
            btn.dataset.audioReady = 'true';
            
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                speakWord(this.dataset.word, this);
            });
        });
        
        document.querySelectorAll('.vocab-word').forEach(wordEl => {
            if (wordEl.dataset.audioReady === 'true') return;
            wordEl.dataset.audioReady = 'true';
            
            if (!wordEl.hasAttribute('tabindex')) {
                wordEl.setAttribute('tabindex', '0');
            }
            wordEl.setAttribute('role', 'button');
            
            const pronounce = (event) => {
                event.preventDefault();
                const rawKey = wordEl.dataset.word || wordEl.textContent;
                showVocabModal(rawKey);
            };
            
            wordEl.addEventListener('click', pronounce);
            wordEl.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    pronounce(event);
                }
            });
        });
    }
    
    // Setup on page load
    setupSpeakingPractice();
    setupVocabAudio();
    setupGameCardAtmosphere();
    setupNavigation();

    window.initAfterInclude = function() {
        setupNavigation();
        setupVocabAudio();
        setupGameCardAtmosphere();
        setupSpeakingPractice();
    };

    // --- Lesson Exercise Functionality ---
    function setupLessonExercises() {
        // Fill in the blank answers
        const fillBlankButtons = document.querySelectorAll('.check-answer-btn');
        fillBlankButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const questionNum = this.getAttribute('data-question');
                const input = this.parentElement.querySelector('.fill-blank-input');
                const feedback = document.querySelector(`[data-feedback="${questionNum}"]`);
                const correctAnswer = input.getAttribute('data-answer').toLowerCase().trim();
                const userAnswer = input.value.toLowerCase().trim();
                
                if (userAnswer === '') {
                    feedback.textContent = 'Please enter an answer.';
                    feedback.style.color = '#ff6b6b';
                    return;
                }
                
                if (userAnswer === correctAnswer) {
                    feedback.textContent = '✓ Correct!';
                    feedback.style.color = '#10ac84';
                    input.style.borderColor = '#10ac84';
                    input.style.backgroundColor = '#d4edda';
                    playSound('correct');
                } else {
                    feedback.textContent = `✗ Incorrect. The answer is "${correctAnswer}".`;
                    feedback.style.color = '#ff6b6b';
                    input.style.borderColor = '#ff6b6b';
                    input.style.backgroundColor = '#f8d7da';
                    playSound('wrong');
                }
            });
        });
        
        // Multiple choice answers
        const mcqButtons = document.querySelectorAll('.check-mcq-btn');
        mcqButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const mcqNum = this.getAttribute('data-mcq');
                const correctValue = this.getAttribute('data-correct');
                const feedback = document.querySelector(`[data-mcq-feedback="${mcqNum}"]`);
                const selectedRadio = document.querySelector(`input[name="mcq-${mcqNum}"]:checked`);
                
                if (!selectedRadio) {
                    feedback.textContent = 'Please select an answer.';
                    feedback.style.color = '#ff6b6b';
                    return;
                }
                
                const userAnswer = selectedRadio.value;
                const labels = this.parentElement.querySelectorAll('label');
                
                if (userAnswer === correctValue) {
                    feedback.textContent = '✓ Correct!';
                    feedback.style.color = '#10ac84';
                    labels.forEach(label => {
                        if (label.querySelector('input').value === correctValue) {
                            label.style.backgroundColor = '#d4edda';
                            label.style.border = '2px solid #10ac84';
                        }
                    });
                    playSound('correct');
                } else {
                    feedback.textContent = `✗ Incorrect. The correct answer is "${correctValue}".`;
                    feedback.style.color = '#ff6b6b';
                    labels.forEach(label => {
                        const input = label.querySelector('input');
                        if (input.value === userAnswer) {
                            label.style.backgroundColor = '#f8d7da';
                            label.style.border = '2px solid #ff6b6b';
                        }
                        if (input.value === correctValue) {
                            label.style.backgroundColor = '#d4edda';
                            label.style.border = '2px solid #10ac84';
                        }
                    });
                    playSound('wrong');
                }
            });
        });
    }
    
    // Initialize lesson exercises
    setupLessonExercises();

    // --- Objectives Chat Functionality ---
    const objectivesSendBtn = document.getElementById('objectives-send-btn');
    const objectivesInputField = document.getElementById('objectives-input-field');
    const objectivesChatMessages = document.getElementById('objectives-chat-messages');
    const objectivesSuggestionBtns = document.querySelectorAll('.objectives-suggestion-btn');

    // Responses based on keywords
    const objectivesResponses = {
        'goals': 'The main learning goals include developing language skills, enhancing communication abilities, building literacy, expanding vocabulary, and cultivating creative thinking.',
        'achieve': 'You can achieve these objectives by practicing regularly, engaging in interactive activities, completing exercises, playing educational games, and actively participating in lessons.',
        'skills': 'You will develop speaking and reading proficiency, listening and communication skills, reading and writing abilities, vocabulary and grammar knowledge, and creative critical thinking capabilities.',
        'language': 'Language skills focus on recognizing phonics, accurate pronunciation, acquiring vocabulary, and strengthening comprehension through reading and listening.',
        'listening': 'Listening and speaking skills help you understand teachers and peers, communicate with clear sentences, and respond appropriately to questions.',
        'reading': 'Reading and writing skills enable you to write letters and words correctly with proper spelling, and construct sentences accurately and coherently.',
        'vocabulary': 'Vocabulary and grammar knowledge helps you expand practical everyday vocabulary and apply basic sentence structures in communication.',
        'thinking': 'Creative and critical thinking allows you to generate new ideas, apply vocabulary creatively, and engage thoughtfully with topics.',
        'default': 'I can help you understand the learning objectives! Try asking about goals, skills, or how to achieve them. You can also click the suggestion buttons above for quick answers.'
    };

    function getResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check for keywords
        for (const [keyword, response] of Object.entries(objectivesResponses)) {
            if (keyword !== 'default' && lowerMessage.includes(keyword)) {
                return response;
            }
        }
        
        return objectivesResponses.default;
    }

    function addMessage(text, isUser = false) {
        if (!text.trim()) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `objectives-chat-message ${isUser ? 'user' : 'assistant'}`;
        messageDiv.textContent = text;
        
        if (objectivesChatMessages) {
            objectivesChatMessages.appendChild(messageDiv);
            objectivesChatMessages.scrollTop = objectivesChatMessages.scrollHeight;
        }
    }

    function sendMessage() {
        const message = objectivesInputField.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, true);
        objectivesInputField.value = '';

        // Simulate thinking delay
        setTimeout(() => {
            const response = getResponse(message);
            addMessage(response, false);
        }, 500);
    }

    // Send button click
    if (objectivesSendBtn && objectivesInputField) {
        objectivesSendBtn.addEventListener('click', sendMessage);
        
        // Enter key press
        objectivesInputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Suggestion buttons
    if (objectivesSuggestionBtns.length > 0) {
        objectivesSuggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.querySelector('span:last-child').textContent;
                if (objectivesInputField) {
                    objectivesInputField.value = text;
                    objectivesInputField.focus();
                }
            });
        });
    }

});


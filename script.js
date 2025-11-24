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

                if (hasHref && !clickedButton) {
                    playUISound('click');
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
                    playUISound('click');
                }
            });
        });

        moreMenuBtn = document.getElementById('more-menu-btn');
        moreDropdown = document.getElementById('more-dropdown');

        if (moreMenuBtn && !moreMenuBtn.dataset.listenerAttached) {
            moreMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (moreDropdown) {
                    moreDropdown.classList.toggle('active');
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
        if (
            moreDropdown &&
            moreMenuBtn &&
            !moreDropdown.contains(e.target) &&
            !moreMenuBtn.contains(e.target)
        ) {
            moreDropdown.classList.remove('active');
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

    // --- Lesson 2 Vocabulary ---
    const vocabData = {
        // <!-- REPLACE VOCAB DATA HERE -->
        'milk': { text: 'Milk', phonetic: '/mɪlk/', type: 'n.', meaning: 'နွားနို့', audio: 'audio/vocab/milk.mp3', opp: 'N/A', sim: 'Dairy' },
        'sardine': { text: 'Sardine', phonetic: '/sɑːrˈdiːn/', type: 'n.', meaning: 'ဆာဒင်းငါး', audio: 'audio/vocab/sardine.mp3', opp: 'N/A', sim: 'Fish' },
        'sandwiches': { text: 'Sandwiches', phonetic: '/ˈsænwɪdʒɪz/', type: 'n.', meaning: 'အသားညှပ်ပေါင်မုန့်', audio: 'audio/vocab/sandwiches.mp3', opp: 'N/A', sim: 'Bread' },
        'breakfast': { text: 'Breakfast', phonetic: '/ˈbrekfəst/', type: 'n.', meaning: 'မနက်စာ', audio: 'audio/vocab/breakfast.mp3', opp: 'Dinner', sim: 'Meal' },
        'canteen': { text: 'Canteen', phonetic: '/kænˈtiːn/', type: 'n.', meaning: 'ကျောင်းမုန့်ဆိုင်', audio: 'audio/vocab/canteen.mp3', opp: 'N/A', sim: 'Cafeteria' },
        'calcium': { text: 'Calcium', phonetic: '/ˈkælsiəm/', type: 'n.', meaning: 'ကယ်လ်ဆီယမ်ဓာတ်', audio: 'audio/vocab/calcium.mp3', opp: 'N/A', sim: 'Mineral' },
        'bones': { text: 'Bones', phonetic: '/boʊnz/', type: 'n.', meaning: 'အရိုးများ', audio: 'audio/vocab/bones.mp3', opp: 'N/A', sim: 'Skeleton' },
        'omega3': { text: 'Omega-3', phonetic: '/oʊˈmiːɡə θriː/', type: 'n.', meaning: 'အိုမီဂါ ၃', audio: 'audio/vocab/omega3.mp3', opp: 'N/A', sim: 'Fatty Acid' },
        'fattyacids': { text: 'Fatty Acids', phonetic: '/ˌfæti ˈæsɪdz/', type: 'n.', meaning: 'အဆီအက်ဆစ်', audio: 'audio/vocab/fattyacids.mp3', opp: 'N/A', sim: 'Lipids' },
        'skin': { text: 'Skin', phonetic: '/skɪn/', type: 'n.', meaning: 'အသားအရေ', audio: 'audio/vocab/skin.mp3', opp: 'N/A', sim: 'Dermis' },
        'brain': { text: 'Brain', phonetic: '/breɪn/', type: 'n.', meaning: 'ဦးနှောက်', audio: 'audio/vocab/brain.mp3', opp: 'N/A', sim: 'Mind' },
        'peas': { text: 'Peas', phonetic: '/piːz/', type: 'n.', meaning: 'စတော်ပဲ', audio: 'audio/vocab/peas.mp3', opp: 'N/A', sim: 'Legume' },
        'contain': { text: 'Contain', phonetic: '/kənˈteɪn/', type: 'v.', meaning: 'ပါဝင်သည်', audio: 'audio/vocab/contain.mp3', opp: 'Exclude', sim: 'Include' },
        'proteins': { text: 'Proteins', phonetic: '/ˈproʊtiːnz/', type: 'n.', meaning: 'ပရိုတင်းဓာတ်', audio: 'audio/vocab/proteins.mp3', opp: 'N/A', sim: 'Nutrient' },
        'carbohydrates': { text: 'Carbohydrates', phonetic: '/ˌkɑːrboʊˈhaɪdreɪts/', type: 'n.', meaning: 'ကာဗွန်ဟိုက်ဒရိတ်', audio: 'audio/vocab/carbohydrates.mp3', opp: 'N/A', sim: 'Carbs' },
        'muscles': { text: 'Muscles', phonetic: '/ˈmʌsəlz/', type: 'n.', meaning: 'ကြွက်သားများ', audio: 'audio/vocab/muscles.mp3', opp: 'N/A', sim: 'Tissue' },
    };
    
    const vocabAudio = document.getElementById('vocab-audio');
    
    document.querySelectorAll('.vocab-word').forEach(wordEl => {
        wordEl.addEventListener('click', () => {
            const wordKey = wordEl.dataset.word;
            const data = vocabData[wordKey];
            if (data) {
                document.getElementById('vocab-word-text').textContent = data.text;
                document.getElementById('vocab-word-phonetic').textContent = data.phonetic;
                document.getElementById('vocab-word-type').textContent = data.type;
                document.getElementById('vocab-word-meaning').querySelector('span').textContent = data.meaning;
                document.getElementById('vocab-word-extra').innerHTML = `<strong>Opposites:</strong> ${data.opp}<br><strong>Similars:</strong> ${data.sim}`;
                
                // Set audio source
                vocabAudio.src = data.audio; // <!-- REPLACE AUDIO HERE -->
                
                openModal('vocab-modal');
            }
        });
    });
    
    const vocabAudioBtn = document.getElementById('vocab-word-audio-btn');
    if (vocabAudioBtn) {
        vocabAudioBtn.addEventListener('click', () => {
            vocabAudio.play().catch(e => console.log("Audio play failed"));
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

    // --- ✨ GEMINI API FUNCTIONALITY ---
    
    // !! IMPORTANT: If you want to use models other than gemini-2.5-flash-preview-09-2025, provide an API key here.
    // Otherwise, leave this as-is and it will be handled by the environment.
    const API_KEY = ""; 
    
    const geminiModal = document.getElementById('gemini-modal');
    const geminiLoadingEl = document.getElementById('gemini-loading');
    const geminiResponseEl = document.getElementById('gemini-response');
    
    const geminiPlannerBtn = document.getElementById('open-gemini-planner');
    if (geminiPlannerBtn) {
        geminiPlannerBtn.addEventListener('click', generateMealPlan);
    }

    /**
     * Calls the Gemini API to generate a healthy meal plan.
     */
    async function generateMealPlan() {
        // Show the modal and loading message
        openModal('gemini-modal');
        geminiLoadingEl.style.display = 'block';
        geminiResponseEl.innerHTML = '';

        const systemPrompt = "You are a friendly nutritionist assisting a 6th-grade student in Myanmar. Your tone is encouraging and simple. You are an expert on healthy eating for children.";
        const userQuery = "Please generate a simple, healthy 1-day meal plan (breakfast, lunch, dinner, and one healthy snack) for me. I am a 6th grader. Please use simple English. You can include healthy Burmese or Southeast Asian food ideas if you know any. Format the response clearly with headings for each meal and a short, encouraging sentence at the end.";

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
        
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        try {
            // Exponential backoff retry logic
            let response;
            for (let i = 0; i < 5; i++) { // Max 5 retries
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    break; // Success
                }

                if (response.status === 429 || response.status >= 500) {
                    // Throttling or server error, wait and retry
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Other client-side error, don't retry
                    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
                }
            }

            if (!response.ok) {
                throw new Error(`API request failed after retries with status ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0].text) {
                const text = result.candidates[0].content.parts[0].text;
                // Format with line breaks and basic bolding
                let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
                html = html.replace(/\*/g, '<br>• '); // Bullets
                html = html.replace(/\n/g, '<br>');
                geminiResponseEl.innerHTML = html;
            } else {
                throw new Error("Invalid response structure from API.");
            }

        } catch (error) {
            console.error("Gemini API Error:", error);
            geminiResponseEl.innerHTML = `<p style="color:var(--color-red); font-weight:bold;">Sorry, I couldn't generate a meal plan right now. Please check your connection and try again later.</p><p style="font-size: 0.8rem; color: #ccc;">Error: ${error.message}</p>`;
        } finally {
            // Hide loading message
            geminiLoadingEl.style.display = 'none';
        }
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
    
    // Setup on DOMContentLoaded
    setupCounterAnimations();
    
    // Also setup on window load as fallback
    window.addEventListener('load', () => {
        setTimeout(setupCounterAnimations, 300);
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

    // --- Knowledge Page Vocabulary Audio ---
    // Use event delegation to handle dynamically loaded buttons
    function setupVocabAudio() {
        // Remove any existing listeners to avoid duplicates
        const vocabButtons = document.querySelectorAll('.vocab-audio-btn');
        vocabButtons.forEach(btn => {
            // Remove old listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        // Add event listeners to all vocab audio buttons
        document.querySelectorAll('.vocab-audio-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const word = this.dataset.word;
                
                if (!word) {
                    console.error('No word data found on button');
                    return;
                }
                
                if (!('speechSynthesis' in window)) {
                    alert('Your browser does not support text-to-speech. Please use a modern browser.');
                    return;
                }
                
                // Cancel any ongoing speech
                if (speechSynthesis.speaking) {
                    speechSynthesis.cancel();
                }
                
                // Create and configure utterance
                const utterance = new SpeechSynthesisUtterance(word);
                utterance.lang = 'en-US';
                utterance.rate = 0.8;
                utterance.pitch = 1;
                utterance.volume = 1;
                
                // Handle events
                utterance.onstart = () => {
                    this.style.background = 'var(--color-blue)';
                };
                
                utterance.onend = () => {
                    this.style.background = 'var(--color-pumpkin)';
                };
                
                utterance.onerror = (event) => {
                    console.error('Speech synthesis error:', event);
                    this.style.background = 'var(--color-pumpkin)';
                };
                
                // Speak the word
                speechSynthesis.speak(utterance);
                
                // Visual feedback
                this.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 200);
            });
        });
    }
    
    // Setup on page load
    setupVocabAudio();
    setupGameCardAtmosphere();
    setupNavigation();

    window.initAfterInclude = function() {
        setupNavigation();
        setupVocabAudio();
        setupGameCardAtmosphere();
    };

});


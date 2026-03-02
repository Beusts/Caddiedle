// ===== CONSTANTS =====
const APP_NAME = 'Caddiedle';
const STORAGE_PREFIX = 'Caddiedle';

const STORAGE_KEYS = {
    STATS: `${STORAGE_PREFIX}_stats`,
    LAST_GAME: `${STORAGE_PREFIX}_last_game`,
    LAST_DAILY_GAME: `${STORAGE_PREFIX}_last_daily_game`,
    LAST_PRACTICE_GAME: `${STORAGE_PREFIX}_last_practice_game`,
    THEME: `${STORAGE_PREFIX}_theme`,
    TUTORIAL_SHOWN: `${STORAGE_PREFIX}_tutorial_shown`
};

const START_DATE = new Date('2026-03-01');
const MAX_GUESSES = 6;
const CORRECT_MARGIN_PERCENT = 5;
const CLOSE_MARGIN_PERCENT = 25;

// ===== UTILITY FUNCTIONS =====
const Utils = {
    getGameNumber() {
        const today = new Date();
        const timeDiff = today.getTime() - START_DATE.getTime();
        const dayDiff = timeDiff / (1000 * 3600 * 24);
        return Math.floor(dayDiff);
    },
    
    formatPrice(price) {
        return parseFloat(price).toFixed(2);
    },
    
    getNextMidnight() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    },
    
    formatCountdown(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
};

// ===== STORAGE MANAGER =====
const StorageManager = {
    getStats() {
        const raw = localStorage.getItem(STORAGE_KEYS.STATS);
        const defaults = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0, 0] // indices 0-5 pour tentatives 1-6, index 6 pour échecs
        };
        if (!raw) return defaults;
        try {
            return JSON.parse(raw);
        } catch {
            return defaults;
        }
    },

    saveStats(stats) {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    },

    getLastGame() {
        const raw = localStorage.getItem(STORAGE_KEYS.LAST_GAME);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    },

    saveLastGame(gameData) {
        localStorage.setItem(STORAGE_KEYS.LAST_GAME, JSON.stringify(gameData));
    },

    getLastDailyGame() {
        const raw = localStorage.getItem(STORAGE_KEYS.LAST_DAILY_GAME);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    },

    saveLastDailyGame(gameData) {
        localStorage.setItem(STORAGE_KEYS.LAST_DAILY_GAME, JSON.stringify(gameData));
    },

    getLastPracticeGame() {
        const raw = localStorage.getItem(STORAGE_KEYS.LAST_PRACTICE_GAME);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    },

    saveLastPracticeGame(gameData) {
        localStorage.setItem(STORAGE_KEYS.LAST_PRACTICE_GAME, JSON.stringify(gameData));
    },
    
    getTheme() {
        return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    },
    
    saveTheme(theme) {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    },
    
    wasTutorialShown() {
        return localStorage.getItem(STORAGE_KEYS.TUTORIAL_SHOWN) === 'true';
    },
    
    markTutorialShown() {
        localStorage.setItem(STORAGE_KEYS.TUTORIAL_SHOWN, 'true');
    }
};

// ===== GAME STATE MANAGER =====
const GameState = {
    gameNumber: Utils.getGameNumber(),
    product: null,
    guesses: [],
    isWon: false,
    isLost: false,
    isGameOver: false,
    gameMode: 'daily',
    products: [],
    
    reset() {
        this.guesses = [];
        this.isWon = false;
        this.isLost = false;
        this.isGameOver = false;
    },
    
    addGuess(guess, isCorrect = false) {
        this.guesses.push(guess);
        if (isCorrect) {
            this.isWon = true;
            this.isGameOver = true;
        } else if (this.guesses.length >= MAX_GUESSES) {
            this.isLost = true;
            this.isGameOver = true;
        }
    },
    
    getCurrentAttempt() {
        return this.guesses.length;
    },
    
    canPlay() {
        return !this.isGameOver;
    }
};

// ===== UI MANAGER =====
const UI = {
    elements: {},
    
    init() {
        // Cache DOM elements
        this.elements = {
            loadingState: document.getElementById('loadingState'),
            gameContent: document.getElementById('gameContent'),
            productImage: document.getElementById('productImage'),
            productName: document.getElementById('productName'),
            productLocation: document.getElementById('productLocation'),
            date: document.getElementById('date'),
            currentAttempt: document.getElementById('currentAttempt'),
            guessContainers: document.querySelectorAll('.guess-container'),
            inputField: document.getElementById('inputField'),
            submitBtn: document.getElementById('submitBtn'),
            tutorialBtn: document.getElementById('tutorialBtn'),
            statsBtn: document.getElementById('statsBtn'),
            darkModeBtn: document.getElementById('darkModeBtn'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage')
        };
    },
    
    showLoading() {
        this.elements.loadingState.style.display = 'flex';
        this.elements.gameContent.style.display = 'none';
    },
    
    hideLoading() {
        this.elements.loadingState.style.display = 'none';
        this.elements.gameContent.style.display = 'block';
    },
    
    displayProduct(product) {
        this.elements.productImage.src = product.image_url;
        this.elements.productImage.alt = product.product_name;
        this.elements.productName.textContent = product.product_name;
        this.elements.productLocation.textContent = `${product.location_osm_display_name}, ${product.location_osm_address_city}, ${product.location_osm_address_country}`;
        
        // Format and display the date
        if (product.date) {
            const dateObj = new Date(product.date);
            const formattedDate = dateObj.toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            this.elements.date.textContent = `Prix enregistré le ${formattedDate}`;
        }
    },
    
    updateAttemptCounter(attempt) {
        this.elements.currentAttempt.textContent = attempt;
    },
    
    displayGuess(index, guess, price, isCorrect = false) {
        const container = this.elements.guessContainers[index];
        const percentAway = (guess / price) * 100 - 100;
        const isClose = !isCorrect && Math.abs(percentAway) <= CLOSE_MARGIN_PERCENT;
        
        if (isCorrect) {
            container.textContent = `${Utils.formatPrice(guess)} € - ✓ Correct!`;
            container.style.color = 'var(--color-correct)';
        } else if (isClose) {
            container.textContent = `${Utils.formatPrice(guess)} € - ${guess < price ? '↑' : '↓'}`;
            container.style.color = 'var(--color-hint)';
        } else if (guess < price) {
            container.textContent = `${Utils.formatPrice(guess)} € - ↑`;
            container.style.color = 'var(--color-incorrect)';
        } else {
            container.textContent = `${Utils.formatPrice(guess)} € - ↓`;
            container.style.color = 'var(--color-incorrect)';
        }
        
        // Add shake animation for incorrect guesses
        if (!isCorrect) {
            container.classList.add('shake');
            setTimeout(() => container.classList.remove('shake'), 350);
        }
    },
    
    
    disableInput() {
        this.elements.inputField.disabled = true;
        this.elements.submitBtn.disabled = true;
    },
    
    clearInput() {
        this.elements.inputField.value = '';
    },
    
    clearGuesses() {
        this.elements.guessContainers.forEach(container => {
            container.textContent = '';
            container.style.color = '';
        });
    },
    
    showToast(message, duration = 3000) {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.style.display = 'block';
        
        setTimeout(() => {
            this.elements.toast.classList.add('hiding');
            setTimeout(() => {
                this.elements.toast.style.display = 'none';
                this.elements.toast.classList.remove('hiding');
            }, 250);
        }, duration);
    },
    
    restoreGameState(guesses, price) {
        guesses.forEach((guess, index) => {
            const percentAway = (guess / price) * 100 - 100;
            const isCorrect = Math.abs(percentAway) <= CORRECT_MARGIN_PERCENT;
            this.displayGuess(index, guess, price, isCorrect);
        });
        this.updateAttemptCounter(guesses.length + 1);
    }
};

// ===== MODAL MANAGER =====
const ModalManager = {
    modals: {},
    
    init() {
        this.modals = {
            tutorial: document.getElementById('tutorialModal'),
            victory: document.getElementById('victoryModal'),
            defeat: document.getElementById('defeatModal'),
            stats: document.getElementById('statsModal')
        };
        
        // Setup close handlers
        Object.values(this.modals).forEach(modal => {
            const overlay = modal.querySelector('.modal-overlay');
            const closeBtn = modal.querySelector('.modal-close');
            
            overlay?.addEventListener('click', () => this.close(modal));
            closeBtn?.addEventListener('click', () => this.close(modal));
        });
        
        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAll();
            }
        });
        
        // Setup button handlers
        document.getElementById('tutorialBtn')?.addEventListener('click', () => this.open(this.modals.tutorial));
        document.getElementById('statsBtn')?.addEventListener('click', () => this.openStats());
        document.getElementById('closeTutorialBtn')?.addEventListener('click', () => this.close(this.modals.tutorial));
        document.getElementById('closeStatsBtn')?.addEventListener('click', () => this.close(this.modals.stats));
        document.getElementById('viewStatsFromVictory')?.addEventListener('click', () => {
            this.close(this.modals.victory);
            this.openStats();
        });
        document.getElementById('viewStatsFromDefeat')?.addEventListener('click', () => {
            this.close(this.modals.defeat);
            this.openStats();
        });

        document.getElementById('shareBtnVictory')?.addEventListener('click', () => ShareManager.share());
        document.getElementById('shareDefeatBtn')?.addEventListener('click', () => ShareManager.share());
    },
    
    open(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus trap
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        setTimeout(() => firstElement?.focus(), 100);
    },
    
    close(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    },
    
    closeAll() {
        Object.values(this.modals).forEach(modal => this.close(modal));
    },
    
    openTutorial() {
        this.open(this.modals.tutorial);
    },
    
    openVictory(attempts, price) {
        document.getElementById('victoryPriceInline').textContent = Utils.formatPrice(price);
        
        // Hide counter and input group, show victory inline and share group
        document.getElementById('attemptsCounter').style.display = 'none';
        document.getElementById('inputGroup').style.display = 'none';
        document.getElementById('victoryInline').style.display = 'flex';
        document.getElementById('shareGroup').style.display = 'flex';
        document.getElementById('newProductBtn').style.display = GameState.gameMode === 'practice' ? 'inline-flex' : 'none';
        document.getElementById('shareBtn').style.display = GameState.gameMode === 'practice' ? 'none' : 'inline-flex';
    },
    
    openDefeat(correctPrice) {
        document.getElementById('correctPriceInline').textContent = Utils.formatPrice(correctPrice);
        
        // Hide counter and input group, show defeat inline and share group
        document.getElementById('attemptsCounter').style.display = 'none';
        document.getElementById('inputGroup').style.display = 'none';
        document.getElementById('defeatInline').style.display = 'flex';
        document.getElementById('shareGroup').style.display = 'flex';
        document.getElementById('newProductBtn').style.display = GameState.gameMode === 'practice' ? 'inline-flex' : 'none';
        document.getElementById('shareBtn').style.display = GameState.gameMode === 'practice' ? 'none' : 'inline-flex';
    },
    
    openStats() {
        StatsManager.displayStats();
        this.open(this.modals.stats);
    },
    
    startConfetti() {
        const container = document.getElementById('confettiContainer');
        container.innerHTML = '';
        
        const colors = ['#6aaa64', '#ffc107', '#dc3545', '#17a2b8', '#6610f2'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = -10 + 'px';
            confetti.style.opacity = Math.random();
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            container.appendChild(confetti);
            
            // Animate
            const duration = 2000 + Math.random() * 1000;
            const delay = Math.random() * 500;
            
            setTimeout(() => {
                confetti.style.transition = `top ${duration}ms linear, transform ${duration}ms linear`;
                confetti.style.top = '110%';
                confetti.style.transform = `rotate(${Math.random() * 720}deg)`;
            }, delay);
        }
    },
    
    startCountdown(elementId) {
        const element = document.getElementById(elementId);
        
        const updateCountdown = () => {
            const now = new Date();
            const midnight = Utils.getNextMidnight();
            const diff = midnight - now;
            
            if (diff > 0) {
                element.textContent = Utils.formatCountdown(diff);
                setTimeout(updateCountdown, 1000);
            } else {
                element.textContent = '00:00:00';
            }
        };
        
        updateCountdown();
    }
};

// ===== STATS MANAGER =====
const StatsManager = {
    updateStats(won, attempts) {
        const stats = StorageManager.getStats();
        
        stats.gamesPlayed++;
        
        if (won) {
            stats.gamesWon++;
            stats.currentStreak++;
            stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
            stats.guessDistribution[attempts - 1]++;
        } else {
            stats.currentStreak = 0;
            stats.guessDistribution[6]++; // Index 6 for failures
        }
        
        StorageManager.saveStats(stats);
    },
    
    displayStats() {
        const stats = StorageManager.getStats();
        
        document.getElementById('gamesPlayed').textContent = stats.gamesPlayed;
        document.getElementById('winRate').textContent = stats.gamesPlayed > 0 
            ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
            : 0;
        document.getElementById('currentStreak').textContent = stats.currentStreak;
        document.getElementById('maxStreak').textContent = stats.maxStreak;
        
        // Display distribution
        const maxCount = Math.max(...stats.guessDistribution, 1);
        stats.guessDistribution.forEach((count, index) => {
            const attempt = index === 6 ? 'fail' : (index + 1);
            const bar = document.querySelector(`.distribution-bar[data-attempt="${attempt}"]`);
            const countSpan = bar?.querySelector('.distribution-count');
            
            if (bar && countSpan) {
                const percentage = (count / maxCount) * 100;
                bar.style.width = Math.max(percentage, 7) + '%';
                countSpan.textContent = count;
                
                // Highlight current game's attempt
                const lastGame = StorageManager.getLastGame();
                if (lastGame && lastGame.gameNumber === GameState.gameNumber) {
                    if ((lastGame.won && index === lastGame.attempts - 1) || 
                        (!lastGame.won && index === 6)) {
                        bar.classList.add('current-attempt');
                    }
                }
            }
        });
    }
};

// ===== SHARE MANAGER =====
const ShareManager = {
    generateEmojiGrid(guesses, price, won) {
        let grid = `${APP_NAME} #${GameState.gameNumber} - ${won ? guesses.length : 'X'}/${MAX_GUESSES}\n\n`;
        
        guesses.forEach(guess => {
            const percentAway = (guess / price) * 100 - 100;
            
            if (Math.abs(percentAway) <= CORRECT_MARGIN_PERCENT) {
                grid += '✅\n';
            } else if (Math.abs(percentAway) <= CLOSE_MARGIN_PERCENT) {
                grid += guess < price ? '🟨⬆️\n' : '🟨⬇️\n';
            } else {
                grid += guess < price ? '🟥⬆️\n' : '🟥⬇️\n';
            }
        });
        
        return grid.trim();
    },
    
    async share() {
        const lastGame = StorageManager.getLastGame();
        if (!lastGame || lastGame.gameNumber !== GameState.gameNumber) {
            UI.showToast('Aucune partie à partager');
            return;
        }
        
        const text = this.generateEmojiGrid(lastGame.guesses, lastGame.price, lastGame.won);
        
        try {
            if (navigator.share) {
                await navigator.share({
                    text: text,
                    title: APP_NAME
                });
            } else {
                await navigator.clipboard.writeText(text);
                UI.showToast('✓ Résultats copiés dans le presse-papiers !');
            }
        } catch (err) {
            console.error('Share failed:', err);
            UI.showToast('Erreur lors du partage');
        }
    }
};

// ===== DARK MODE MANAGER =====
const DarkModeManager = {
    init() {
        const savedTheme = StorageManager.getTheme();
        this.setTheme(savedTheme);
        
        document.getElementById('darkModeBtn')?.addEventListener('click', () => {
            this.toggle();
        });
    },
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        StorageManager.saveTheme(theme);
    },
    
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
};

// ===== GAME LOGIC =====
const Game = {
    async init() {
        UI.init();
        ModalManager.init();
        DarkModeManager.init();
        
        // Check if tutorial should be shown
        if (!StorageManager.wasTutorialShown()) {
            setTimeout(() => {
                ModalManager.openTutorial();
                StorageManager.markTutorialShown();
            }, 500);
        }
        
        // Check if already played today
        const lastGame = StorageManager.getLastGame();
        if (lastGame && lastGame.gameNumber === GameState.gameNumber) {
            await this.loadGame();
            this.setupEventListeners();
            this.showCompletedGame(lastGame);
            return;
        }
        
        // Load new game
        await this.loadGame();
        this.setupEventListeners();
    },
    
    async loadGame() {
        UI.showLoading();
        
        try {
            const response = await fetch('products.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            GameState.products = data;
            
            let product;
            if (GameState.gameMode === 'practice') {
                // Load random product for practice mode
                const randomIndex = Math.floor(Math.random() * data.length);
                product = data[randomIndex];
            } else {
                // Load daily product
                product = data[GameState.gameNumber % data.length];
            }
            
            if (!product) {
                throw new Error('Product not found');
            }
            
            GameState.product = product;
            UI.displayProduct(product);
            UI.hideLoading();
        } catch (error) {
            console.error('Error loading game:', error);
            UI.hideLoading();
            UI.showToast('Erreur lors du chargement du jeu. Veuillez recharger la page.');
        }
    },
    
    setupEventListeners() {
        UI.elements.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.submitGuess();
            }
        });
        
        UI.elements.submitBtn.addEventListener('click', () => {
            this.submitGuess();
        });
        
        // Share button
        document.getElementById('shareBtn')?.addEventListener('click', () => ShareManager.share());
        
        // New product button (practice mode)
        document.getElementById('newProductBtn')?.addEventListener('click', () => {
            StorageManager.saveLastPracticeGame(null);
            GameState.reset();
            UI.clearGuesses();
            UI.updateAttemptCounter(0);
            document.getElementById('victoryInline').style.display = 'none';
            document.getElementById('defeatInline').style.display = 'none';
            document.getElementById('shareGroup').style.display = 'none';
            document.getElementById('newProductBtn').style.display = 'none';
            document.getElementById('attemptsCounter').style.display = 'block';
            document.getElementById('inputGroup').style.display = 'flex';
            UI.elements.inputField.disabled = false;
            UI.elements.submitBtn.disabled = false;
            UI.elements.inputField.value = '';
            Game.loadGame();
        });
        
        // Mode selector buttons
        document.getElementById('dailyBtn')?.addEventListener('click', () => {
            this.switchMode('daily');
        });
        
        document.getElementById('practiceBtn')?.addEventListener('click', () => {
            this.switchMode('practice');
        });
    },
    
    switchMode(mode) {
        const dailyBtn = document.getElementById('dailyBtn');
        const practiceBtn = document.getElementById('practiceBtn');
        
        // Save current mode state before switching
        if (GameState.gameMode === 'daily') {
            StorageManager.saveLastDailyGame({
                gameNumber: GameState.gameNumber,
                guesses: GameState.guesses,
                product: GameState.product,
                isWon: GameState.isWon,
                isLost: GameState.isLost
            });
        } else if (GameState.gameMode === 'practice') {
            StorageManager.saveLastPracticeGame({
                guesses: GameState.guesses,
                product: GameState.product,
                isWon: GameState.isWon,
                isLost: GameState.isLost
            });
        }
        
        // Change mode
        GameState.gameMode = mode;
        GameState.reset();
        
        // Clear guesses from UI
        UI.clearGuesses();
        UI.updateAttemptCounter(0);
        
        // Update button styles
        if (mode === 'daily') {
            dailyBtn?.classList.add('mode-btn-active');
            practiceBtn?.classList.remove('mode-btn-active');
        } else {
            practiceBtn?.classList.add('mode-btn-active');
            dailyBtn?.classList.remove('mode-btn-active');
        }
        
        // Hide victory/defeat messages
        document.getElementById('victoryInline').style.display = 'none';
        document.getElementById('defeatInline').style.display = 'none';
        document.getElementById('shareGroup').style.display = 'none';
        
        // Show counter and input
        document.getElementById('attemptsCounter').style.display = 'block';
        document.getElementById('inputGroup').style.display = 'flex';
        
        // Re-enable input
        UI.elements.inputField.disabled = false;
        UI.elements.submitBtn.disabled = false;
        
        // Clear input
        UI.elements.inputField.value = '';
        
        // Try to restore previous session for this mode
        if (mode === 'daily') {
            const lastDailyGame = StorageManager.getLastDailyGame();
            // Only restore if it's the same day
            if (lastDailyGame && lastDailyGame.gameNumber === GameState.gameNumber) {
                GameState.guesses = lastDailyGame.guesses || [];
                GameState.product = lastDailyGame.product;
                GameState.isWon = lastDailyGame.isWon;
                GameState.isLost = lastDailyGame.isLost;
                GameState.isGameOver = lastDailyGame.isWon || lastDailyGame.isLost;
                UI.displayProduct(lastDailyGame.product);
                if (GameState.guesses.length > 0) {
                    GameState.guesses.forEach((guess, index) => {
                        const isCorrect = Math.abs((parseFloat(guess) / lastDailyGame.product.price) * 100 - 100) <= CORRECT_MARGIN_PERCENT;
                        UI.displayGuess(index, parseFloat(guess), lastDailyGame.product.price, isCorrect);
                    });
                    UI.updateAttemptCounter(GameState.getCurrentAttempt());
                    if (GameState.isGameOver) {
                        UI.disableInput();
                        document.getElementById('attemptsCounter').style.display = 'none';
                        document.getElementById('inputGroup').style.display = 'none';
                        if (GameState.isWon) {
                            document.getElementById('victoryInline').style.display = 'flex';
                        } else {
                            document.getElementById('defeatInline').style.display = 'flex';
                        }
                        document.getElementById('shareGroup').style.display = 'flex';
                    }
                }
            } else {
                this.loadGame();
            }
        } else {
            const lastPracticeGame = StorageManager.getLastPracticeGame();
            // Restore practice game if available
            if (lastPracticeGame && lastPracticeGame.product) {
                GameState.guesses = lastPracticeGame.guesses || [];
                GameState.product = lastPracticeGame.product;
                GameState.isWon = lastPracticeGame.isWon;
                GameState.isLost = lastPracticeGame.isLost;
                GameState.isGameOver = lastPracticeGame.isWon || lastPracticeGame.isLost;
                UI.displayProduct(lastPracticeGame.product);
                if (GameState.guesses.length > 0) {
                    GameState.guesses.forEach((guess, index) => {
                        const isCorrect = Math.abs((parseFloat(guess) / lastPracticeGame.product.price) * 100 - 100) <= CORRECT_MARGIN_PERCENT;
                        UI.displayGuess(index, parseFloat(guess), lastPracticeGame.product.price, isCorrect);
                    });
                    UI.updateAttemptCounter(GameState.getCurrentAttempt());
                    if (GameState.isGameOver) {
                        UI.disableInput();
                        document.getElementById('attemptsCounter').style.display = 'none';
                        document.getElementById('inputGroup').style.display = 'none';
                        if (GameState.isWon) {
                            document.getElementById('victoryInline').style.display = 'flex';
                        } else {
                            document.getElementById('defeatInline').style.display = 'flex';
                        }
                        document.getElementById('shareGroup').style.display = 'flex';
                    }
                }
            } else {
                this.loadGame();
            }
        }
    },
    
    submitGuess() {
        if (!GameState.canPlay()) return;
        
        const strippedString = UI.elements.inputField.value.trim().replaceAll(",", "");
        const guess = Number(strippedString).toFixed(2);
        
        // Validation
        if (isNaN(guess) || !strippedString) {
            UI.showToast('Veuillez entrer un prix valide');
            return;
        }
        
        if (parseFloat(guess) > 10000) {
            UI.showToast('Le prix ne peut pas dépasser 10 000 €');
            return;
        }
        
        // Calculate percentage away from correct price
        const percentAway = (parseFloat(guess) / GameState.product.price) * 100 - 100;
        
        // Check if within 5% margin
        const isCorrect = Math.abs(percentAway) <= CORRECT_MARGIN_PERCENT;
        
        // Add guess
        GameState.addGuess(parseFloat(guess), isCorrect);
        const index = GameState.guesses.length - 1;
        
        // Display guess
        UI.displayGuess(index, parseFloat(guess), GameState.product.price, isCorrect);
        UI.updateAttemptCounter(GameState.getCurrentAttempt());
        UI.clearInput();
        
        
        // Check game over
        if (GameState.isGameOver) {
            this.endGame();
        }
    },
    
    endGame() {
        UI.disableInput();
        
        // Update stats and save game state
        if (GameState.gameMode === 'daily') {
            StatsManager.updateStats(GameState.isWon, GameState.guesses.length);
            
            // Save game state for daily
            const gameData = {
                gameNumber: GameState.gameNumber,
                guesses: GameState.guesses,
                product: GameState.product,
                price: GameState.product.price,
                won: GameState.isWon,
                isWon: GameState.isWon,
                isLost: GameState.isLost,
                attempts: GameState.guesses.length
            };
            StorageManager.saveLastGame(gameData);
            StorageManager.saveLastDailyGame(gameData);
        } else if (GameState.gameMode === 'practice') {
            // Save game state for practice
            StorageManager.saveLastPracticeGame({
                guesses: GameState.guesses,
                product: GameState.product,
                isWon: GameState.isWon,
                isLost: GameState.isLost
            });
        }
        
        // Show appropriate result
        if (GameState.isWon) {
            ModalManager.openVictory(GameState.guesses.length, GameState.product.price);
        } else {
            ModalManager.openDefeat(GameState.product.price);
        }
    },
    
    showCompletedGame(lastGame) {
        // Restore guesses
        UI.restoreGameState(lastGame.guesses, lastGame.price);
        UI.disableInput();
        
        // Show completed message
        UI.showToast('Vous avez déjà joué aujourd\'hui ! Revenez demain.', 4000);
        
        // Show appropriate modal
        if (lastGame.won) {
            ModalManager.openVictory(lastGame.attempts, lastGame.price);
        } else {
            ModalManager.openDefeat(lastGame.price);
        }
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
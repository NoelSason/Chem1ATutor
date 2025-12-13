// Application State
let currentTopic = 'atomic-structure';
let currentQuestionIndex = 0;
// We now store a SUBSET of questions for the current session (Randomized 10)
let currentSessionQuestions = [];

// User State (Persisted)
let userStats = {
    totalAnswered: 0,
    correctAnswers: 0
};

let currentUser = null; // { name: "Name", avatar: "N" }
let quizHistory = []; // Array of completed quiz attempts

// Track state of each question in current session: key = "index", value = { answered: boolean, correct: boolean }
let questionState = {};

// Mapping for HTML class suffixes
const topicSuffixes = {
    'atomic-structure': '', // Uses default IDs
    'orbitals': 'orbital',
    'stoichiometry': 'stoich',
    'thermodynamics': 'thermo',
    'equilibrium': 'equil',
    'acids-bases': 'acid',
    'electrochemistry': 'electro'
};

const topicNames = {
    'atomic-structure': 'Atomic Structure',
    'orbitals': 'Orbitals',
    'stoichiometry': 'Stoichiometry',
    'thermodynamics': 'Thermodynamics',
    'equilibrium': 'Equilibrium',
    'acids-bases': 'Acids & Bases',
    'electrochemistry': 'Electrochemistry'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeLogin();
    initializeProfileModal();
    initializeTabNavigation();

    // Initial load
    setTimeout(() => {
        startTopicSession('atomic-structure');
    }, 100);
});

/* =========================================
   LOGIN & PERSISTENCE
   ========================================= */
// Google OAuth Configuration
const GOOGLE_CLIENT_ID = '476164664332-18di861tvctjuv2o4a7fu1db275mbdki.apps.googleusercontent.com';

function initializeLogin() {
    const loginBtn = document.getElementById('loginBtn');

    // Check LocalStorage for existing user
    const savedUser = localStorage.getItem('chemTutorUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadUserData();
        updateUserUI();
    }

    // Check for OAuth callback
    checkOAuthCallback();

    // Event Listener for Login Button
    loginBtn.addEventListener('click', () => {
        if (currentUser) {
            // Logout
            logout();
        } else {
            // Trigger Google Sign-In with redirect
            const redirectUri = window.location.origin + '/'; // Always redirect to root
            const scope = 'profile email';
            const state = Math.random().toString(36).substring(7);

            sessionStorage.setItem('oauth_state', state);
            sessionStorage.setItem('oauth_return_page', window.location.pathname); // Save current page

            const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
                `client_id=${GOOGLE_CLIENT_ID}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `response_type=token id_token&` +
                `scope=${encodeURIComponent(scope)}&` +
                `state=${state}&` +
                `nonce=${Math.random().toString(36).substring(7)}&` +
                `prompt=select_account`;

            window.location.href = authUrl;
        }
    });
}

function checkOAuthCallback() {
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const idToken = params.get('id_token');
        const state = params.get('state');

        const savedState = sessionStorage.getItem('oauth_state');
        if (state !== savedState) {
            console.error('OAuth state mismatch');
            return;
        }

        if (idToken) {
            try {
                const payload = parseJwt(idToken);

                currentUser = {
                    googleId: payload.sub,
                    name: payload.name,
                    email: payload.email,
                    avatar: payload.picture || payload.name.charAt(0).toUpperCase()
                };

                localStorage.setItem('chemTutorUser', JSON.stringify(currentUser));
                window.history.replaceState({}, document.title, window.location.pathname);

                loadUserData();
                updateUserUI();

                console.log('Google Sign-In successful:', currentUser.name);
            } catch (error) {
                console.error('Error parsing OAuth response:', error);
            }
        }
    }
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
}

function login(name) {
    // This function is no longer used - kept for compatibility
    currentUser = {
        name: name,
        avatar: name.charAt(0).toUpperCase()
    };

    localStorage.setItem('chemTutorUser', JSON.stringify(currentUser));
    loadUserData();
    updateUserUI();
    document.getElementById('loginBtn').innerHTML = `Sign Out`;
}

function logout() {
    currentUser = null;
    userStats = { totalAnswered: 0, correctAnswers: 0 };
    quizHistory = [];
    localStorage.removeItem('chemTutorUser');
    updateStatsDisplay();

    document.getElementById('userProfile').classList.add('hidden');
    document.getElementById('loginBtn').innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Login with Google
    `;

    // Hide streak display
    const streakDisplay = document.getElementById('streakDisplay');
    if (streakDisplay) streakDisplay.classList.add('hidden');
}

function updateUserUI() {
    const profile = document.getElementById('userProfile');
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');

    nameEl.textContent = currentUser.name;

    // Handle Google profile picture
    if (currentUser.avatar && currentUser.avatar.startsWith('http')) {
        avatarEl.style.backgroundImage = `url(${currentUser.avatar})`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.textContent = '';
    } else {
        avatarEl.textContent = currentUser.avatar || currentUser.name.charAt(0).toUpperCase();
        avatarEl.style.backgroundImage = 'none';
    }

    profile.classList.remove('hidden');

    document.getElementById('loginBtn').textContent = 'Sign Out';
    updateStatsDisplay();
}

function loadUserData() {
    const savedStats = localStorage.getItem(`chemTutorStats_${currentUser.name}`);
    if (savedStats) {
        userStats = JSON.parse(savedStats);
    } else {
        userStats = { totalAnswered: 0, correctAnswers: 0 };
    }

    const savedHistory = localStorage.getItem(`chemTutorHistory_${currentUser.name}`);
    if (savedHistory) {
        quizHistory = JSON.parse(savedHistory);
    } else {
        quizHistory = [];
    }
}

function saveUserData() {
    if (currentUser) {
        localStorage.setItem(`chemTutorStats_${currentUser.name}`, JSON.stringify(userStats));
        localStorage.setItem(`chemTutorHistory_${currentUser.name}`, JSON.stringify(quizHistory));
    }
}

/* =========================================
   PROFILE MODAL & QUIZ HISTORY
   ========================================= */
function initializeProfileModal() {
    const profileDiv = document.getElementById('userProfile');
    const modal = document.getElementById('profileModal');
    const closeBtn = document.getElementById('closeProfileBtn');

    profileDiv.addEventListener('click', () => {
        if (currentUser) {
            showProfileModal();
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

function showProfileModal() {
    const modal = document.getElementById('profileModal');
    updateProfileStats();
    renderQuizHistory();
    modal.classList.remove('hidden');
}

function updateProfileStats() {
    document.getElementById('totalQuizzes').textContent = quizHistory.length;

    if (quizHistory.length === 0) {
        document.getElementById('avgScore').textContent = '--%';
        document.getElementById('bestTopic').textContent = '--';
        return;
    }

    // Calculate average score
    const totalScore = quizHistory.reduce((sum, quiz) => sum + quiz.score, 0);
    const avgScore = Math.round((totalScore / (quizHistory.length * 10)) * 100);
    document.getElementById('avgScore').textContent = `${avgScore}%`;

    // Find best topic
    const topicScores = {};
    quizHistory.forEach(quiz => {
        if (!topicScores[quiz.topic]) {
            topicScores[quiz.topic] = { total: 0, count: 0 };
        }
        topicScores[quiz.topic].total += quiz.score;
        topicScores[quiz.topic].count++;
    });

    let bestTopic = '--';
    let bestAvg = 0;
    Object.keys(topicScores).forEach(topic => {
        const avg = topicScores[topic].total / topicScores[topic].count;
        if (avg > bestAvg) {
            bestAvg = avg;
            bestTopic = topicNames[topic] || topic;
        }
    });

    document.getElementById('bestTopic').textContent = bestTopic;
}

function renderQuizHistory() {
    const historyList = document.getElementById('historyList');

    if (quizHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No quiz attempts yet. Complete a quiz to see your history!</p>';
        return;
    }

    // Sort by date (newest first)
    const sortedHistory = [...quizHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    historyList.innerHTML = sortedHistory.map((quiz, index) => {
        const percentage = Math.round((quiz.score / 10) * 100);
        let scoreClass = 'needs-work';
        if (percentage >= 80) scoreClass = 'excellent';
        else if (percentage >= 60) scoreClass = 'good';

        const date = new Date(quiz.date);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Generate detailed results HTML
        let detailsHTML = '';
        if (quiz.questions && quiz.questions.length > 0) {
            detailsHTML = `
                <div class="history-details">
                    <h4 style="margin-bottom: var(--space-md); color: var(--text-secondary);">Question Breakdown</h4>
                    ${quiz.questions.map((q, qIndex) => `
                        <div class="question-result" style="margin-bottom: var(--space-md); padding: var(--space-md); background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid ${q.isCorrect ? 'var(--success)' : 'var(--error)'};">
                            <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-xs);">
                                <span style="font-weight: 700; color: ${q.isCorrect ? 'var(--success)' : 'var(--error)'};">${q.isCorrect ? '✓' : '✗'}</span>
                                <span style="font-weight: 600; color: var(--text-tertiary);">Q${qIndex + 1}</span>
                            </div>
                            <div style="margin-bottom: var(--space-xs); color: var(--text-primary);">${q.question}</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                <div><strong>Your answer:</strong> ${q.userAnswer || 'Not answered'}</div>
                                ${!q.isCorrect ? `<div><strong>Correct answer:</strong> ${q.correctAnswer}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="history-item" data-index="${index}">
                <div class="history-item-header">
                    <span class="history-topic">${topicNames[quiz.topic] || quiz.topic}</span>
                    <span class="history-score ${scoreClass}">${quiz.score}/10 (${percentage}%)</span>
                </div>
                <div class="history-date">${dateStr}</div>
                ${quiz.questions && quiz.questions.length > 0 ? '<button class="expand-btn">View Details ▼</button>' : ''}
                ${detailsHTML}
            </div>
        `;
    }).join('');

    // Add click handlers for expand buttons
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.history-item');
            item.classList.toggle('expanded');
            btn.textContent = item.classList.contains('expanded') ? 'Hide Details ▲' : 'View Details ▼';
        });
    });
}

function saveQuizAttempt() {
    if (!currentUser) return;

    // Calculate score and collect question details
    let score = 0;
    const questionDetails = [];
    const userAnswers = [];

    currentSessionQuestions.forEach((question, index) => {
        const state = questionState[index];
        if (!state) return;

        const isCorrect = state.correct || false;
        if (isCorrect) score++;

        // Determine correct answer display
        let correctAnswer;
        if (question.type === 'multiple-choice') {
            correctAnswer = question.options[question.correct];
        } else {
            correctAnswer = question.answer;
        }

        // Determine user answer display
        let userAnswer;
        if (question.type === 'multiple-choice' && state.selected !== undefined && state.selected >= 0) {
            userAnswer = state.selected; // Store the index for multiple choice
        } else {
            userAnswer = state.userAnswer || '';
        }

        questionDetails.push({
            question: question.question,
            type: question.type,
            options: question.options || null,
            correct: question.correct !== undefined ? question.correct : null,
            answer: question.answer || null,
            explanation: question.explanation || null
        });

        userAnswers.push(userAnswer);
    });

    const attempt = {
        topic: currentTopic,
        date: new Date().toISOString(),
        score: score,
        total: 10,
        questions: questionDetails,
        answers: userAnswers
    };

    quizHistory.push(attempt);
    saveUserData();

    // Also save to Supabase if user is logged in
    if (currentUser && currentUser.email && typeof saveQuizAttemptDB === 'function') {
        saveQuizAttemptDB({
            userEmail: currentUser.email,
            topic: topicNames[currentTopic],
            score: score,
            total: 10,
            date: attempt.date,
            questions: questionDetails,
            answers: userAnswers
        }).catch(err => {
            console.error('Failed to save quiz to database:', err);
            // Continue anyway - localStorage backup exists
        });

        // Track advanced learning features
        trackAdvancedFeatures(score, 10, questionDetails, userAnswers).catch(err => {
            console.error('Failed to track advanced features:', err);
        });
    }
}

// Advanced Learning Features Tracking
async function trackAdvancedFeatures(score, total, questions, answers) {
    if (!currentUser || !currentUser.email) return;

    const userEmail = currentUser.email;
    const userName = currentUser.name || 'Anonymous';
    const topic = topicNames[currentTopic];

    try {
        // 1. Update user progress & mastery level
        if (typeof updateUserProgressDB === 'function') {
            await updateUserProgressDB(userEmail, topic, score, total);
            console.log('✅ Progress updated');
        }

        // 2. Update streak
        if (typeof updateStreakDB === 'function') {
            const streak = await updateStreakDB(userEmail);
            console.log(`🔥 Streak: ${streak.current_streak} days`);

            // Check for streak achievements
            if (streak.current_streak === 7 && typeof awardAchievementDB === 'function') {
                await awardAchievementDB(userEmail, 'streak', '7-Day Streak', { streak: 7 });
            } else if (streak.current_streak === 30) {
                await awardAchievementDB(userEmail, 'streak', '30-Day Streak', { streak: 30 });
            } else if (streak.current_streak === 100) {
                await awardAchievementDB(userEmail, 'streak', '100-Day Streak', { streak: 100 });
            }
        }

        // 3. Save mistakes to journal
        if (typeof saveMistakeDB === 'function') {
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                const userAnswer = answers[i];

                // Check if answer is correct
                let isCorrect = false;
                if (question.type === 'multiple-choice') {
                    isCorrect = userAnswer === question.correct;
                } else {
                    const correctAnswer = (question.answer || '').toLowerCase().trim();
                    const userAnswerText = (userAnswer || '').toLowerCase().trim();
                    isCorrect = userAnswerText === correctAnswer;
                }

                // Save to mistake journal if incorrect
                if (!isCorrect) {
                    let correctAnswerText;
                    if (question.type === 'multiple-choice') {
                        correctAnswerText = question.options[question.correct];
                    } else {
                        correctAnswerText = question.answer;
                    }

                    let userAnswerText;
                    if (question.type === 'multiple-choice' && userAnswer !== undefined) {
                        userAnswerText = question.options[userAnswer] || 'No answer';
                    } else {
                        userAnswerText = userAnswer || 'No answer';
                    }

                    await saveMistakeDB(userEmail, question, userAnswerText, correctAnswerText, topic);
                }
            }
            console.log('📝 Mistakes saved to journal');
        }

        // 4. Schedule spaced repetition for incorrect answers
        if (typeof scheduleReviewDB === 'function') {
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                const userAnswer = answers[i];

                let isCorrect = false;
                if (question.type === 'multiple-choice') {
                    isCorrect = userAnswer === question.correct;
                } else {
                    const correctAnswer = (question.answer || '').toLowerCase().trim();
                    const userAnswerText = (userAnswer || '').toLowerCase().trim();
                    isCorrect = userAnswerText === correctAnswer;
                }

                // Schedule review (performance: 1-5, where 5 is perfect)
                const performance = isCorrect ? 5 : 1;
                const questionId = `${topic}_${i}_${Date.now()}`;
                await scheduleReviewDB(userEmail, questionId, question, performance);
            }
            console.log('🔄 Spaced repetition scheduled');
        }

        // 5. Update leaderboard
        if (typeof updateLeaderboardDB === 'function') {
            let points = 10; // Base points for completing quiz
            if (score === total) {
                points += 20; // Perfect score bonus

                // Award perfect score achievement
                if (typeof awardAchievementDB === 'function') {
                    await awardAchievementDB(userEmail, 'score', 'Perfect Score', { topic, score, total });
                }
            }

            await updateLeaderboardDB(userEmail, userName, points);
            console.log(`🏆 Leaderboard updated: +${points} points`);
        }

        // 6. Check for mastery achievements
        if (typeof getUserProgressDB === 'function' && typeof awardAchievementDB === 'function') {
            const progress = await getUserProgressDB(userEmail);
            const topicProgress = progress.find(p => p.topic === topic);

            if (topicProgress) {
                if (topicProgress.mastery_level >= 75) {
                    await awardAchievementDB(userEmail, 'mastery', `${topic} Master`, {
                        topic,
                        mastery: topicProgress.mastery_level
                    });
                } else if (topicProgress.mastery_level >= 50) {
                    await awardAchievementDB(userEmail, 'mastery', `${topic} Advanced`, {
                        topic,
                        mastery: topicProgress.mastery_level
                    });
                }
            }
        }

        console.log('✅ All advanced features tracked successfully');
    } catch (error) {
        console.error('Error tracking advanced features:', error);
        // Don't throw - we don't want to break the quiz flow
    }
}

/* =========================================
   NAVIGATION & SESSION LOGIC
   ========================================= */

function initializeTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const topic = button.dataset.topic;
            // Only switch if different to avoid resetting session accidentally
            if (topic !== currentTopic) {
                switchTopic(topic);
            }
        });
    });
}

function switchTopic(topic) {
    // UI Updates
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-topic="${topic}"]`).classList.add('active');

    document.querySelectorAll('.topic-section').forEach(section => section.classList.remove('active'));
    document.getElementById(topic).classList.add('active');

    startTopicSession(topic);
}

function startTopicSession(topic) {
    currentTopic = topic;
    currentQuestionIndex = 0;
    questionState = {}; // Reset session state

    // RANDOMIZATION LOGIC: Pick 10 random questions
    const allQuestions = questionBank[topic];
    if (!allQuestions || allQuestions.length === 0) return;

    // Shuffle and slice
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    currentSessionQuestions = shuffled.slice(0, 10);

    loadQuestion();
}

/* =========================================
   QUESTION LOGIC
   ========================================= */

function getTopicElements(section) {
    const suffix = topicSuffixes[currentTopic];
    let questionTextEl, answerAreaEl, feedbackEl;

    if (!suffix) {
        questionTextEl = section.querySelector('#questionText');
        answerAreaEl = section.querySelector('#answerArea');
        feedbackEl = section.querySelector('#feedbackArea');
    } else {
        questionTextEl = section.querySelector(`.question-text-${suffix}`);
        answerAreaEl = section.querySelector(`.answer-area-${suffix}`);
        feedbackEl = section.querySelector(`.feedback-area-${suffix}`);
    }
    return { questionTextEl, answerAreaEl, feedbackEl };
}

function loadQuestion() {
    const section = document.getElementById(currentTopic);
    // Safety check
    if (!section || currentSessionQuestions.length === 0) return;

    const question = currentSessionQuestions[currentQuestionIndex];

    // Update Headers
    const qNumEl = section.querySelector('.current-q');
    if (qNumEl) qNumEl.textContent = currentQuestionIndex + 1;

    const qTypeEl = section.querySelector('.question-type') || section.querySelector('#questionType');
    if (qTypeEl) {
        qTypeEl.textContent = question.type === 'multiple-choice' ? 'Conceptual' : 'Mathematical';
    }

    // Get Elements
    const { questionTextEl, answerAreaEl, feedbackEl } = getTopicElements(section);

    // Set Content
    if (questionTextEl) questionTextEl.textContent = question.question;

    // Check State
    const state = questionState[currentQuestionIndex] || { answered: false };

    if (answerAreaEl) {
        answerAreaEl.innerHTML = '';

        if (question.type === 'multiple-choice') {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'answer-options';

            question.options.forEach((optText, idx) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerHTML = `<span class="option-label">${optText}</span>`;

                // Restore State
                if (state.answered) {
                    btn.disabled = true;
                    if (idx === question.correct) btn.classList.add('correct');
                    else if (state.selected === idx) btn.classList.add('incorrect');
                } else {
                    btn.addEventListener('click', () => {
                        section.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                    });
                }
                optionsDiv.appendChild(btn);
            });
            answerAreaEl.appendChild(optionsDiv);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'text-input';
            input.placeholder = 'Type your answer...';
            input.id = 'currentTextInput'; // unique ID for selection

            if (state.answered) {
                input.value = state.userAnswer;
                input.disabled = true;
                input.style.borderColor = state.correct ? 'var(--success)' : 'var(--error)';
            }
            answerAreaEl.appendChild(input);
        }
    }

    // Clear/Restore Feedback
    if (feedbackEl) {
        // Preserve suffix class when resetting
        const existingClasses = feedbackEl.className.split(' ');
        const suffixClass = existingClasses.find(cls => cls.startsWith('feedback-area-'));
        feedbackEl.className = suffixClass ? `feedback-area ${suffixClass}` : 'feedback-area';
        feedbackEl.innerHTML = '';
        if (state.answered) {
            const feedbackType = state.correct ? 'correct' : 'incorrect';
            const feedbackTitle = state.correct ? '✓ Correct!' : '✗ Incorrect';
            const feedbackMessage = `
                <div class="feedback-title">${feedbackTitle}</div>
                <div class="feedback-text">${question.explanation}</div>
            `;
            showFeedback(feedbackEl, feedbackMessage, feedbackType);
        }
    }

    // Button Setup
    setupButtons(section, state.answered);
}

function setupButtons(section, isAnswered) {
    const checkBtn = section.querySelector('.check-answer-btn') || section.querySelector('#checkAnswerBtn');
    const nextBtn = section.querySelector('.next-question-btn') || section.querySelector('#nextQuestionBtn');
    const showBtn = section.querySelector('.show-answer-btn') || section.querySelector('#showAnswerBtn');

    // Clone to remove old listeners
    const replace = (oldBtn, handler) => {
        if (!oldBtn) return null;
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        newBtn.addEventListener('click', handler);
        return newBtn;
    };

    if (checkBtn) {
        const newCheck = replace(checkBtn, checkAnswer);
        newCheck.disabled = isAnswered;
        newCheck.textContent = isAnswered ? 'Answered' : 'Check Answer';
    }

    if (nextBtn) {
        replace(nextBtn, nextQuestion);
    }

    if (showBtn) {
        const newShow = replace(showBtn, showAnswer);
        newShow.disabled = isAnswered;
    }
}

function checkAnswer() {
    const question = currentSessionQuestions[currentQuestionIndex];
    if (questionState[currentQuestionIndex]?.answered) return;

    const section = document.getElementById(currentTopic);
    const { feedbackEl } = getTopicElements(section);

    let isCorrect = false;
    let selectedIdx = -1;
    let userVal = '';

    if (question.type === 'multiple-choice') {
        const selectedBtn = section.querySelector('.option-btn.selected');
        if (!selectedBtn) {
            alert('Please select an option.');
            return;
        }
        // Find index logic (loop to find which child)
        const allBtns = Array.from(section.querySelectorAll('.option-btn'));
        selectedIdx = allBtns.indexOf(selectedBtn);

        if (selectedIdx === question.correct) isCorrect = true;

        // Update UI immediately
        allBtns.forEach((btn, i) => {
            btn.disabled = true;
            if (i === question.correct) btn.classList.add('correct');
            else if (i === selectedIdx && !isCorrect) btn.classList.add('incorrect');
        });

    } else {
        const input = section.querySelector('#currentTextInput');
        if (!input || !input.value.trim()) {
            alert('Please enter an answer.');
            return;
        }
        userVal = input.value.trim();

        // Check numerical vs string
        if (question.tolerance !== undefined) {
            const numUser = parseFloat(userVal);
            const numAns = parseFloat(question.answer);
            if (!isNaN(numUser) && !isNaN(numAns)) {
                isCorrect = Math.abs(numUser - numAns) <= question.tolerance;
            }
        } else {
            isCorrect = userVal.toLowerCase() === question.answer.toLowerCase();
        }

        input.disabled = true;
        input.style.borderColor = isCorrect ? 'var(--success)' : 'var(--error)';
    }

    // Save State
    questionState[currentQuestionIndex] = {
        answered: true,
        correct: isCorrect,
        selected: selectedIdx,
        userAnswer: userVal
    };

    // Update Stats
    userStats.totalAnswered++;
    if (isCorrect) userStats.correctAnswers++;
    updateStatsDisplay();
    saveUserData(); // Persist

    // Disable Button
    const checkBtn = section.querySelector('.check-answer-btn') || section.querySelector('#checkAnswerBtn');
    if (checkBtn) {
        checkBtn.disabled = true;
        checkBtn.textContent = isCorrect ? 'Correct!' : 'Incorrect';
    }

    const showBtn = section.querySelector('.show-answer-btn') || section.querySelector('#showAnswerBtn');
    if (showBtn) showBtn.disabled = true;

    // Feedback
    const fType = isCorrect ? 'correct' : 'incorrect';
    const fTitle = isCorrect ? '✓ Correct!' : '✗ Incorrect';
    let html = `<div class="feedback-title">${fTitle}</div><div class="feedback-text">${question.explanation}</div>`;

    // Add AI Help button for incorrect answers
    if (!isCorrect) {
        html += `<button class="btn btn-ai" id="aiHelpBtn" onclick="requestAIHelp()">
            <span class="ai-icon">🤖</span> Get AI Help
        </button>
        <div class="ai-response-area" id="aiResponseArea"></div>`;
    }

    showFeedback(feedbackEl, html, fType);
}

function showAnswer() {
    if (questionState[currentQuestionIndex]?.answered) return;

    // Count as answered but wrong/revealed? No, typically 'Show Answer' implies giving up.
    // We will just show it and disable interaction.

    const section = document.getElementById(currentTopic);
    const question = currentSessionQuestions[currentQuestionIndex];
    const { feedbackEl } = getTopicElements(section);

    questionState[currentQuestionIndex] = { answered: true, correct: false, selected: -1, userAnswer: 'Revealed' };

    // Reveal UI
    if (question.type === 'multiple-choice') {
        const btns = section.querySelectorAll('.option-btn');
        btns.forEach((btn, i) => {
            btn.disabled = true;
            if (i === question.correct) btn.classList.add('correct');
        });
    } else {
        const input = section.querySelector('#currentTextInput');
        if (input) {
            input.value = question.answer;
            input.disabled = true;
            input.style.borderColor = 'var(--warning)';
        }
    }

    const html = `<div class="feedback-title">Answer Revealed</div><div class="feedback-text">${question.explanation}</div>`;
    showFeedback(feedbackEl, html, 'feedback-answer');

    setupButtons(section, true);
}

function nextQuestion() {
    if (currentQuestionIndex < currentSessionQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        // End of Quiz - Save to history
        saveQuizAttempt();

        // Calculate score
        let score = 0;
        Object.values(questionState).forEach(state => {
            if (state.correct) score++;
        });

        const percentage = Math.round((score / 10) * 100);

        if (confirm(`Quiz Complete! You scored ${score}/10 (${percentage}%).\n\nStart a new quiz with different questions?`)) {
            startTopicSession(currentTopic);
        }
    }
}

function showFeedback(el, html, type) {
    if (!el) return;
    el.innerHTML = html;

    // Preserve any existing suffix class (e.g., feedback-area-stoich)
    const existingClasses = el.className.split(' ');
    const suffixClass = existingClasses.find(cls => cls.startsWith('feedback-area-'));

    if (suffixClass) {
        el.className = `feedback-area ${suffixClass} show ${type}`;
    } else {
        el.className = `feedback-area show ${type}`;
    }
}

function updateStatsDisplay() {
    const totalEl = document.getElementById('totalAnswered');
    const accEl = document.getElementById('accuracy');

    if (totalEl) totalEl.textContent = userStats.totalAnswered;
    if (accEl) {
        if (userStats.totalAnswered === 0) {
            accEl.textContent = '--%';
        } else {
            const pct = Math.round((userStats.correctAnswers / userStats.totalAnswered) * 100);
            accEl.textContent = `${pct}%`;
        }
    }
}

/* =========================================
   AI HELP INTEGRATION
   ========================================= */

async function requestAIHelp() {
    const question = currentSessionQuestions[currentQuestionIndex];
    const state = questionState[currentQuestionIndex];

    if (!state || state.correct) return; // Only for incorrect answers

    const aiBtn = document.getElementById('aiHelpBtn');
    const aiResponseArea = document.getElementById('aiResponseArea');

    if (!aiBtn || !aiResponseArea) return;

    // Disable button and show loading
    aiBtn.disabled = true;
    aiBtn.innerHTML = '<span class="ai-loading">⏳</span> Loading...';

    try {
        // Determine user's answer
        let userAnswer;
        if (question.type === 'multiple-choice' && state.selected >= 0) {
            userAnswer = question.options[state.selected];
        } else {
            userAnswer = state.userAnswer || 'No answer provided';
        }

        // Determine correct answer
        let correctAnswer;
        if (question.type === 'multiple-choice') {
            correctAnswer = question.options[question.correct];
        } else {
            correctAnswer = question.answer;
        }

        // Get AI explanation
        const explanation = await getAIExplanation(
            question.question,
            correctAnswer,
            userAnswer,
            question.type,
            topicNames[currentTopic]
        );

        // Display AI response
        aiResponseArea.innerHTML = `
            <div class="ai-response">
                <div class="ai-response-header">
                    <span class="ai-badge">🤖 AI Tutor</span>
                </div>
                <div class="ai-response-text">${explanation}</div>
                <div class="ai-followup">
                    <input type="text" 
                           class="ai-followup-input" 
                           id="aiFollowupInput" 
                           placeholder="Still confused? Ask a follow-up question..."
                           maxlength="200">
                    <button class="btn-ai-followup" id="aiFollowupBtn">
                        Ask Question
                    </button>
                </div>
                <div class="ai-followup-response" id="aiFollowupResponse"></div>
            </div>
        `;

        // Add event listener for follow-up question
        const followupBtn = document.getElementById('aiFollowupBtn');
        const followupInput = document.getElementById('aiFollowupInput');

        if (followupBtn && followupInput) {
            followupBtn.addEventListener('click', () => handleFollowupQuestion(question, correctAnswer, userAnswer, explanation));
            followupInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleFollowupQuestion(question, correctAnswer, userAnswer, explanation);
                }
            });
        }

        // Update button
        aiBtn.innerHTML = '<span class="ai-icon">✓</span> AI Help Provided';

    } catch (error) {
        console.error('AI Help Error:', error);

        // Show error message
        aiResponseArea.innerHTML = `
            <div class="ai-error">
                <div class="ai-error-title">⚠️ Unable to get AI help</div>
                <div class="ai-error-text">${error.message}</div>
                ${error.message.includes('API key') ?
                '<div class="ai-error-hint">Please add your Gemini API key to gemini-config.js</div>' :
                '<div class="ai-error-hint">Please try again in a moment.</div>'}
            </div>
        `;

        // Re-enable button for retry
        aiBtn.disabled = false;
        aiBtn.innerHTML = '<span class="ai-icon">🤖</span> Try Again';
    }
}

async function handleFollowupQuestion(question, correctAnswer, userAnswer, originalExplanation) {
    const followupInput = document.getElementById('aiFollowupInput');
    const followupBtn = document.getElementById('aiFollowupBtn');
    const followupResponse = document.getElementById('aiFollowupResponse');

    if (!followupInput || !followupBtn || !followupResponse) return;

    const followupQuestion = followupInput.value.trim();
    if (!followupQuestion) {
        alert('Please enter a question.');
        return;
    }

    // Show loading
    followupBtn.disabled = true;
    followupBtn.textContent = 'Loading...';
    followupResponse.innerHTML = '<div class="ai-loading-text">⏳ Thinking...</div>';

    try {
        // Build context-aware prompt
        const prompt = `You are a chemistry tutor. A student asked a follow-up question about a problem they got wrong.

Original Question: ${question.question}
Correct Answer: ${correctAnswer}
Student's Wrong Answer: ${userAnswer}
Your Previous Explanation: ${originalExplanation}

Student's Follow-up Question: ${followupQuestion}

Provide a clear, direct answer to their follow-up question. Be concise (2-3 sentences max).`;

        const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

        const response = await fetch(`${API_URL}?key=${GEMINI_CONFIG.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                    topP: 0.8,
                    topK: 10
                }
            })
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();
        const answer = data.candidates[0].content.parts[0].text;

        // Display response
        followupResponse.innerHTML = `
            <div class="ai-followup-answer">
                <div class="ai-followup-label">💬 Answer:</div>
                <div class="ai-followup-text">${answer}</div>
            </div>
        `;

        // Clear input and reset button
        followupInput.value = '';
        followupBtn.disabled = false;
        followupBtn.textContent = 'Ask Another';

    } catch (error) {
        console.error('Follow-up Error:', error);
        followupResponse.innerHTML = `
            <div class="ai-error">
                <div class="ai-error-text">Unable to answer. Please try again.</div>
            </div>
        `;
        followupBtn.disabled = false;
        followupBtn.textContent = 'Try Again';
    }
}

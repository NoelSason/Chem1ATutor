// Profile Page JavaScript
let currentUser = null;
let quizHistory = [];
let chatHistory = [];
let currentQuizContext = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserProfile();
    loadQuizHistory();
    initChat();
});

function checkAuth() {
    const savedUser = localStorage.getItem('chemTutorUser');
    if (!savedUser) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(savedUser);
}

function loadUserProfile() {
    if (!currentUser) return;

    // Update profile display
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;

    // Update avatar
    const avatarEl = document.getElementById('profileAvatar');
    if (currentUser.avatar && currentUser.avatar.startsWith('http')) {
        avatarEl.innerHTML = `<img src="${currentUser.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" referrerpolicy="no-referrer">`;
    } else {
        avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
    }
}

async function loadQuizHistory() {
    if (!currentUser) return;

    try {
        // Try to load from Supabase first
        if (typeof getQuizAttemptsDB === 'function') {
            quizHistory = await getQuizAttemptsDB(currentUser.email);
            console.log(`✅ Loaded ${quizHistory.length} quizzes from Supabase`);
        }
    } catch (error) {
        console.error('Error loading from Supabase, falling back to localStorage:', error);
        // Fallback to localStorage
        const history = localStorage.getItem(`chemTutorHistory_${currentUser.name}`);
        quizHistory = history ? JSON.parse(history) : [];
    }

    // If Supabase returned empty, try localStorage as backup
    if (quizHistory.length === 0) {
        const history = localStorage.getItem(`chemTutorHistory_${currentUser.name}`);
        const localQuizzes = history ? JSON.parse(history) : [];
        if (localQuizzes.length > 0) {
            quizHistory = localQuizzes;
            console.log(`📦 Loaded ${quizHistory.length} quizzes from localStorage`);
        }
    }

    if (quizHistory.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('quizHistoryContainer').style.display = 'none';
        updateStats();
        return;
    }

    // Sort by date (newest first)
    quizHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    displayQuizHistory();
    updateStats();
}

function updateStats() {
    const totalQuizzes = quizHistory.length;
    let totalQuestions = 0;
    let totalCorrect = 0;
    const topicScores = {};

    quizHistory.forEach(quiz => {
        totalQuestions += quiz.total;
        totalCorrect += quiz.score;

        if (!topicScores[quiz.topic]) {
            topicScores[quiz.topic] = { correct: 0, total: 0 };
        }
        topicScores[quiz.topic].correct += quiz.score;
        topicScores[quiz.topic].total += quiz.total;
    });

    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Find best topic
    let bestTopic = '-';
    let bestAccuracy = 0;
    Object.keys(topicScores).forEach(topic => {
        const accuracy = (topicScores[topic].correct / topicScores[topic].total) * 100;
        if (accuracy > bestAccuracy) {
            bestAccuracy = accuracy;
            bestTopic = topic;
        }
    });

    // Update display
    document.getElementById('totalQuizzes').textContent = totalQuizzes;
    document.getElementById('totalQuestions').textContent = totalQuestions;
    document.getElementById('overallAccuracy').textContent = overallAccuracy + '%';
    document.getElementById('bestTopic').textContent = bestTopic;
}

function displayQuizHistory() {
    const container = document.getElementById('quizHistoryContainer');
    container.innerHTML = '';

    quizHistory.forEach((quiz, index) => {
        const card = createQuizCard(quiz, index);
        container.appendChild(card);
    });
}

function createQuizCard(quiz, index) {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quiz-${index}`;

    const date = new Date(quiz.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

    const accuracy = Math.round((quiz.score / quiz.total) * 100);
    const accuracyClass = accuracy >= 80 ? 'excellent' : accuracy >= 60 ? 'good' : 'needs-work';

    card.innerHTML = `
        <div class="quiz-card-header">
            <div class="quiz-topic">📚 ${quiz.topic}</div>
            <div class="quiz-date">${formattedDate}</div>
        </div>
        <div class="quiz-score ${accuracyClass}">
            <span class="score-value">${quiz.score}/${quiz.total}</span>
            <span class="score-percentage">(${accuracy}%)</span>
        </div>
        <div class="quiz-card-actions">
            <button class="btn-quiz-action" onclick="toggleQuizDetails(${index})">
                <span id="toggle-text-${index}">View Details</span>
            </button>
            <button class="btn-quiz-action btn-ai-quiz" onclick="askAboutQuiz(${index})">
                🤖 Ask AI
            </button>
        </div>
        <div class="quiz-details" id="quiz-details-${index}" style="display: none;">
            <!-- Details will be loaded here -->
        </div>
    `;

    return card;
}

function toggleQuizDetails(index) {
    const detailsEl = document.getElementById(`quiz-details-${index}`);
    const toggleText = document.getElementById(`toggle-text-${index}`);

    if (detailsEl.style.display === 'none') {
        // Load and show details
        loadQuizDetails(index);
        detailsEl.style.display = 'block';
        toggleText.textContent = 'Hide Details';
    } else {
        // Hide details
        detailsEl.style.display = 'none';
        toggleText.textContent = 'View Details';
    }
}

function loadQuizDetails(index) {
    const quiz = quizHistory[index];
    const detailsEl = document.getElementById(`quiz-details-${index}`);

    let html = '<div class="quiz-questions-list">';

    // Check if this is old format (questions with embedded userAnswer) or new format (separate answers array)
    const isOldFormat = quiz.questions && quiz.questions[0] && quiz.questions[0].userAnswer !== undefined;

    if (isOldFormat) {
        // Old format: questions have userAnswer, correctAnswer, isCorrect embedded
        quiz.questions.forEach((q, qIndex) => {
            const isCorrect = q.isCorrect || false;

            html += `
                <div class="question-detail ${isCorrect ? 'correct' : 'incorrect'}">
                    <div class="question-number">Question ${qIndex + 1}</div>
                    <div class="question-text">${q.question}</div>
                    <div class="answer-comparison">
                        <div class="answer-row">
                            <span class="answer-label">Your Answer:</span>
                            <span class="answer-value ${isCorrect ? 'correct-answer' : 'wrong-answer'}">
                                ${q.userAnswer || 'No answer'}
                            </span>
                        </div>
                        ${!isCorrect ? `
                            <div class="answer-row">
                                <span class="answer-label">Correct Answer:</span>
                                <span class="answer-value correct-answer">
                                    ${q.correctAnswer || 'N/A'}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    } else {
        // New format: separate questions and answers arrays
        quiz.questions.forEach((question, qIndex) => {
            const userAnswer = quiz.answers ? quiz.answers[qIndex] : null;
            const isCorrect = checkAnswer(question, userAnswer);

            html += `
                <div class="question-detail ${isCorrect ? 'correct' : 'incorrect'}">
                    <div class="question-number">Question ${qIndex + 1}</div>
                    <div class="question-text">${question.question}</div>
                    <div class="answer-comparison">
                        <div class="answer-row">
                            <span class="answer-label">Your Answer:</span>
                            <span class="answer-value ${isCorrect ? 'correct-answer' : 'wrong-answer'}">
                                ${formatAnswer(question, userAnswer)}
                            </span>
                        </div>
                        ${!isCorrect ? `
                            <div class="answer-row">
                                <span class="answer-label">Correct Answer:</span>
                                <span class="answer-value correct-answer">
                                    ${formatCorrectAnswer(question)}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                    ${question.explanation ? `
                        <div class="question-explanation">
                            <strong>Explanation:</strong> ${question.explanation}
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    html += '</div>';
    detailsEl.innerHTML = html;
}

function checkAnswer(question, userAnswer) {
    if (question.type === 'multiple-choice') {
        return userAnswer === question.correct;
    } else {
        const correctAnswer = question.answer.toString().toLowerCase().trim();
        const userAns = userAnswer.toString().toLowerCase().trim();
        return correctAnswer === userAns;
    }
}

function formatAnswer(question, answer) {
    if (question.type === 'multiple-choice') {
        return question.options[answer] || 'No answer';
    }
    return answer || 'No answer';
}

function formatCorrectAnswer(question) {
    if (question.type === 'multiple-choice') {
        return question.options[question.correct];
    }
    return question.answer;
}

// ==========================================
// AI CHAT FUNCTIONALITY
// ==========================================

function initChat() {
    const sendBtn = document.getElementById('chatSendBtn');
    const input = document.getElementById('chatInput');

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    addChatMessage('user', message);
    input.value = '';

    // Show typing indicator
    const typingId = addTypingIndicator();

    try {
        // Build context-aware prompt
        const prompt = buildChatPrompt(message);

        // Get AI response
        const response = await callGeminiForChat(prompt);

        // Remove typing indicator
        removeTypingIndicator(typingId);

        // Add AI response to chat
        addChatMessage('ai', response);

        // Store in chat history
        chatHistory.push({ role: 'user', message, timestamp: new Date() });
        chatHistory.push({ role: 'ai', message: response, timestamp: new Date() });

    } catch (error) {
        removeTypingIndicator(typingId);
        addChatMessage('ai', 'Sorry, I encountered an error. Please try again.');
        console.error('Chat error:', error);
    }
}

function buildChatPrompt(userMessage) {
    let prompt = `You are a helpful chemistry tutor. `;

    // Add quiz context if available
    if (currentQuizContext !== null && quizHistory[currentQuizContext]) {
        const quiz = quizHistory[currentQuizContext];
        prompt += `The student is asking about their quiz on "${quiz.topic}" where they scored ${quiz.score}/${quiz.total}. `;

        // Check if old format or new format
        const isOldFormat = quiz.questions && quiz.questions[0] && quiz.questions[0].userAnswer !== undefined;

        if (isOldFormat) {
            // Old format: questions have embedded userAnswer, correctAnswer, isCorrect
            prompt += `Here are the questions and their answers:\n\n`;

            quiz.questions.forEach((q, i) => {
                prompt += `Q${i + 1}: ${q.question}\n`;
                prompt += `Student's answer: ${q.userAnswer} ${q.isCorrect ? '(Correct)' : '(Incorrect)'}\n`;
                if (!q.isCorrect) {
                    prompt += `Correct answer: ${q.correctAnswer}\n`;
                }
                prompt += `\n`;
            });
        } else if (quiz.questions && quiz.answers && Array.isArray(quiz.questions) && Array.isArray(quiz.answers)) {
            // New format: separate questions and answers arrays
            prompt += `Here are the questions and their answers:\n\n`;

            quiz.questions.forEach((q, i) => {
                const userAns = quiz.answers[i];
                const correct = checkAnswer(q, userAns);
                prompt += `Q${i + 1}: ${q.question}\n`;
                prompt += `Student's answer: ${formatAnswer(q, userAns)} ${correct ? '(Correct)' : '(Incorrect)'}\n`;
                if (!correct) {
                    prompt += `Correct answer: ${formatCorrectAnswer(q)}\n`;
                }
                prompt += `\n`;
            });
        }
    } else {
        // Add general quiz history context
        if (quizHistory.length > 0) {
            const recentQuizzes = quizHistory.slice(0, 3);
            prompt += `The student has taken ${quizHistory.length} quizzes. Recent topics: ${recentQuizzes.map(q => q.topic).join(', ')}. `;
        }
    }

    prompt += `\n\nStudent's question: ${userMessage}\n\n`;
    prompt += `Provide a clear, concise, and encouraging response (2-4 sentences). Be direct and educational.`;

    return prompt;
}

async function callGeminiForChat(prompt) {
    // Get API key from various sources
    let apiKey = null;

    // Try GEMINI_CONFIG first (local development)
    if (typeof GEMINI_CONFIG !== 'undefined' && GEMINI_CONFIG && GEMINI_CONFIG.apiKey) {
        apiKey = GEMINI_CONFIG.apiKey;
    }
    // Try window.GEMINI_API_KEY (set by Vercel)
    else if (typeof window !== 'undefined' && window.GEMINI_API_KEY) {
        apiKey = window.GEMINI_API_KEY;
    }

    if (!apiKey) {
        throw new Error('Gemini API key not configured. Please contact the administrator.');
    }

    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const response = await fetch(`${API_URL}?key = ${apiKey} `, {
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

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to get AI response');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function addChatMessage(role, message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}-message`;

    messageEl.innerHTML = `
        <div class="message-avatar">${role === 'ai' ? '🤖' : '👤'}</div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingEl = document.createElement('div');
    const id = 'typing-' + Date.now();
    typingEl.id = id;
    typingEl.className = 'chat-message ai-message typing-indicator';

    typingEl.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function askAboutQuiz(index) {
    currentQuizContext = index;
    const quiz = quizHistory[index];

    // Add context message to chat
    addChatMessage('ai', `Great! I'm now focused on your "${quiz.topic}" quiz where you scored ${quiz.score}/${quiz.total}. What would you like to know about it?`);

    // Scroll to chat
    document.querySelector('.ai-chat-section').scrollIntoView({ behavior: 'smooth' });

    // Focus input
    document.getElementById('chatInput').focus();
}

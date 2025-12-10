// Attendance System - Session Management
// Using LocalStorage for demonstration (upgrade to WebSocket/Firebase for production)

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = '476164664332-18di861tvctjuv2o4a7fu1db275mbdki.apps.googleusercontent.com';

const ADMIN_PASSWORD = 'chem1a2025'; // Change this in production
let currentRole = null; // 'instructor' or 'student'
let currentSession = null;
let pollingInterval = null;
let currentGoogleUser = null; // Store Google user data

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Defer these calls to ensure functions are defined
    setTimeout(() => {
        // Check for OAuth callback first
        if (typeof checkOAuthCallback === 'function') {
            checkOAuthCallback();
        }

        // Check if there's an active session in progress
        if (typeof checkExistingSession === 'function') {
            checkExistingSession();
        }
    }, 0);
});

// Listen for localStorage changes from other tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'chemTutorUser') {
        if (e.newValue) {
            // User logged in on another tab
            const user = JSON.parse(e.newValue);
            currentGoogleUser = user;
            sessionStorage.setItem('googleUser', JSON.stringify(user));

            // Update UI if on student join screen
            if (!document.getElementById('studentJoin').classList.contains('hidden')) {
                document.getElementById('customGoogleSignInBtn').style.display = 'none';
                document.getElementById('sessionCodeSection').classList.remove('hidden');
            }
        } else {
            // User logged out on another tab
            currentGoogleUser = null;
            sessionStorage.removeItem('googleUser');

            // Update UI if on student join screen
            if (!document.getElementById('studentJoin').classList.contains('hidden')) {
                document.getElementById('customGoogleSignInBtn').style.display = 'block';
                document.getElementById('sessionCodeSection').classList.add('hidden');
            }
        }
    }
});

function checkExistingSession() {
    const savedRole = sessionStorage.getItem('attendanceRole');

    // Check for saved Google user from localStorage (primary source of truth)
    const savedGoogleUser = localStorage.getItem('chemTutorUser');
    const sessionGoogleUser = sessionStorage.getItem('googleUser');

    if (savedGoogleUser) {
        currentGoogleUser = JSON.parse(savedGoogleUser);
        // Ensure session storage is in sync
        sessionStorage.setItem('googleUser', savedGoogleUser);
    } else if (sessionGoogleUser) {
        currentGoogleUser = JSON.parse(sessionGoogleUser);
    }

    if (savedRole) {
        currentRole = savedRole;
        if (currentRole === 'instructor') {
            const session = getActiveSession();
            if (session && session.instructorId === 'admin') {
                document.getElementById('roleSelection').classList.add('hidden');
                document.getElementById('instructorPanel').classList.remove('hidden');
                document.getElementById('instructorLogin').classList.add('hidden');
                document.getElementById('instructorDashboard').classList.remove('hidden');
                loadInstructorDashboard();
            }
        } else if (currentRole === 'student') {
            const studentData = JSON.parse(sessionStorage.getItem('studentData') || '{}');
            if (studentData.sessionCode) {
                document.getElementById('roleSelection').classList.add('hidden');
                document.getElementById('studentPanel').classList.remove('hidden');
                document.getElementById('studentJoin').classList.add('hidden');
                document.getElementById('studentSession').classList.remove('hidden');
                loadStudentSession(studentData);
            } else if (currentGoogleUser) {
                // User is logged in but hasn't joined a session yet
                document.getElementById('roleSelection').classList.add('hidden');
                document.getElementById('studentPanel').classList.remove('hidden');
                document.getElementById('customGoogleSignInBtn').style.display = 'none';
                document.getElementById('sessionCodeSection').classList.remove('hidden');
            }
        }
    }
}

/* ==========================================
   ROLE SELECTION
   ========================================== */
function selectRole(role) {
    currentRole = role;
    sessionStorage.setItem('attendanceRole', role);

    document.getElementById('roleSelection').classList.add('hidden');

    if (role === 'instructor') {
        document.getElementById('instructorPanel').classList.remove('hidden');
    } else {
        document.getElementById('studentPanel').classList.remove('hidden');

        // Check if already logged in!
        if (currentGoogleUser) {
            document.getElementById('customGoogleSignInBtn').style.display = 'none';
            document.getElementById('sessionCodeSection').classList.remove('hidden');

            // Update Profile Display
            const profileDisplay = document.getElementById('studentProfileDisplay');
            const avatarEl = document.getElementById('joinAvatar');

            profileDisplay.classList.remove('hidden');
            profileDisplay.style.display = 'flex'; // Ensure flex display

            document.getElementById('joinName').textContent = currentGoogleUser.name;
            document.getElementById('joinEmail').textContent = currentGoogleUser.email;

            if (currentGoogleUser.avatar && currentGoogleUser.avatar.startsWith('http')) {
                avatarEl.style.backgroundImage = `url(${currentGoogleUser.avatar})`;
                avatarEl.style.backgroundSize = 'cover';
                avatarEl.textContent = '';
            } else {
                avatarEl.style.backgroundImage = '';
                avatarEl.textContent = currentGoogleUser.avatar || currentGoogleUser.name.charAt(0).toUpperCase();
            }

            // Hide the "Sign in with Google" text
            document.querySelector('#studentJoin .text-secondary').style.display = 'none';

        } else {
            document.getElementById('customGoogleSignInBtn').style.display = 'block';
            document.getElementById('sessionCodeSection').classList.add('hidden');
            document.getElementById('studentProfileDisplay').classList.add('hidden');
            document.querySelector('#studentJoin .text-secondary').style.display = 'block';
        }
    }
}

function backToRoleSelection() {
    currentRole = null;
    currentGoogleUser = null;
    sessionStorage.removeItem('attendanceRole');
    sessionStorage.removeItem('studentData');
    sessionStorage.removeItem('googleUser');

    document.getElementById('roleSelection').classList.remove('hidden');
    document.getElementById('instructorPanel').classList.add('hidden');
    document.getElementById('studentPanel').classList.add('hidden');

    // Reset panels
    document.getElementById('instructorLogin').classList.remove('hidden');
    document.getElementById('instructorDashboard').classList.add('hidden');
    document.getElementById('studentJoin').classList.remove('hidden');
    document.getElementById('studentSession').classList.add('hidden');
    document.getElementById('sessionCodeSection').classList.add('hidden');
}

/* ==========================================
   GOOGLE OAUTH (Pure OAuth2 - No FedCM)
   ========================================== */

// No need for library initialization anymore
function initializeGoogleSignIn() {
    // Pure OAuth2 doesn't need initialization
    console.log('Using pure OAuth2 flow - no library needed');
}

function triggerGoogleSignIn() {
    // Direct OAuth2 flow - no FedCM issues
    const redirectUri = window.location.origin + '/';  // Use base URL
    const scope = 'openid profile email';
    const state = Math.random().toString(36).substring(7);

    // Save state and current page for redirect back
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_return_page', window.location.pathname);

    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=token id_token&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}&` +
        `nonce=${Math.random().toString(36).substring(7)}&` +
        `prompt=select_account`;

    // Redirect to Google (not popup, to avoid blockers)
    window.location.href = authUrl;
}

// Check for OAuth callback on page load
function checkOAuthCallback() {
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const idToken = params.get('id_token');
        const state = params.get('state');

        // Verify state
        const savedState = sessionStorage.getItem('oauth_state');
        if (state !== savedState) {
            console.error('OAuth state mismatch');
            return;
        }

        if (idToken) {
            try {
                const payload = parseJwt(idToken);

                currentGoogleUser = {
                    googleId: payload.sub,
                    name: payload.name,
                    email: payload.email,
                    avatar: payload.picture || payload.name.charAt(0).toUpperCase()
                };

                // Save to storage
                sessionStorage.setItem('googleUser', JSON.stringify(currentGoogleUser));
                localStorage.setItem('chemTutorUser', JSON.stringify(currentGoogleUser));

                // Get return page
                const returnPage = sessionStorage.getItem('oauth_return_page') || '/attendance.html';

                // Clean up
                sessionStorage.removeItem('oauth_state');
                sessionStorage.removeItem('oauth_return_page');

                // Redirect to original page if not already there
                if (window.location.pathname !== returnPage) {
                    window.location.href = returnPage;
                } else {
                    // Clean up URL and update UI
                    window.history.replaceState({}, document.title, window.location.pathname);

                    // Force role to student if we just came back from login
                    // This handles the case where session storage might have been cleared or we want to default to student flow
                    sessionStorage.setItem('attendanceRole', 'student');
                    currentRole = 'student';

                    // Update UI
                    document.getElementById('roleSelection').classList.add('hidden');
                    document.getElementById('studentPanel').classList.remove('hidden');
                    document.getElementById('customGoogleSignInBtn').style.display = 'none';
                    document.getElementById('sessionCodeSection').classList.remove('hidden');

                    console.log('Google Sign-In successful:', currentGoogleUser.name);
                }
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

/* ==========================================
   INSTRUCTOR FUNCTIONS
   ========================================== */
function instructorLogin() {
    const password = document.getElementById('adminPassword').value;

    if (password === ADMIN_PASSWORD) {
        document.getElementById('instructorLogin').classList.add('hidden');
        document.getElementById('instructorDashboard').classList.remove('hidden');
        loadInstructorDashboard();
    } else {
        alert('Incorrect password');
        document.getElementById('adminPassword').value = '';
    }
}

function instructorLogout() {
    if (confirm('Are you sure you want to logout? This will not end the active session.')) {
        document.getElementById('instructorLogin').classList.remove('hidden');
        document.getElementById('instructorDashboard').classList.add('hidden');
        document.getElementById('adminPassword').value = '';
    }
}

function loadInstructorDashboard() {
    const session = getActiveSession();

    if (session) {
        document.getElementById('noSession').classList.add('hidden');
        document.getElementById('activeSession').classList.remove('hidden');
        displaySession(session);
        startPolling();
    } else {
        document.getElementById('noSession').classList.remove('hidden');
        document.getElementById('activeSession').classList.add('hidden');
    }
}

function createSession() {
    const sessionCode = generateSessionCode();

    const session = {
        code: sessionCode,
        instructorId: 'admin',
        createdAt: new Date().toISOString(),
        status: 'active',
        students: [],
        currentQuestion: null,
        questionHistory: []
    };

    localStorage.setItem('activeSession', JSON.stringify(session));
    currentSession = session;

    loadInstructorDashboard();
}

function displaySession(session) {
    currentSession = session;

    document.getElementById('sessionCode').textContent = session.code;
    document.getElementById('studentCount').textContent = session.students.length;
    document.getElementById('questionCount').textContent = session.questionHistory.length;

    // Display students
    renderStudentsList(session.students);

    // Display current question if any
    if (session.currentQuestion) {
        document.getElementById('currentQuestionDisplay').classList.remove('hidden');
        document.getElementById('currentQuestionText').textContent = session.currentQuestion.question;
        renderResponses(session.currentQuestion.responses || []);
    } else {
        document.getElementById('currentQuestionDisplay').classList.add('hidden');
    }
}

function renderStudentsList(students) {
    const list = document.getElementById('studentsList');

    if (students.length === 0) {
        list.innerHTML = '<p class="text-secondary" style="text-align: center; padding: var(--space-lg);">No students have joined yet</p>';
        return;
    }

    list.innerHTML = students.map(student => `
        <div class="student-item">
            <div class="student-avatar">${student.name.charAt(0).toUpperCase()}</div>
            <div class="student-info">
                <div class="student-name">${student.name}</div>
                <div class="student-status">Joined ${new Date(student.joinedAt).toLocaleTimeString()}</div>
            </div>
        </div>
    `).join('');
}

function loadTopicQuestions() {
    const topic = document.getElementById('topicSelect').value;
    const questionSelect = document.getElementById('questionSelect');
    const broadcastBtn = document.getElementById('broadcastBtn');

    if (!topic) {
        questionSelect.disabled = true;
        broadcastBtn.disabled = true;
        questionSelect.innerHTML = '<option value="">-- Select Question --</option>';
        return;
    }

    const questions = questionBank[topic];
    questionSelect.disabled = false;

    questionSelect.innerHTML = '<option value="">-- Select Question --</option>' +
        questions.map((q, index) => `
            <option value="${index}">${index + 1}. ${q.question.substring(0, 60)}...</option>
        `).join('');

    questionSelect.addEventListener('change', () => {
        broadcastBtn.disabled = !questionSelect.value;
    });
}

function broadcastQuestion() {
    const topic = document.getElementById('topicSelect').value;
    const questionIndex = parseInt(document.getElementById('questionSelect').value);

    if (!topic || isNaN(questionIndex)) {
        alert('Please select a topic and question');
        return;
    }

    const question = questionBank[topic][questionIndex];
    const session = getActiveSession();

    session.currentQuestion = {
        id: `${topic}-${questionIndex}-${Date.now()}`,
        topic: topic,
        question: question.question,
        type: question.type,
        options: question.options || null,
        correctAnswer: question.type === 'multiple-choice' ? question.correct : question.answer,
        tolerance: question.tolerance,
        explanation: question.explanation,
        broadcastedAt: new Date().toISOString(),
        responses: []
    };

    localStorage.setItem('activeSession', JSON.stringify(session));
    displaySession(session);

    alert('Question broadcasted to all students!');
}

function renderResponses(responses) {
    const list = document.getElementById('responsesList');
    document.getElementById('responseCount').textContent = responses.length;

    if (responses.length === 0) {
        list.innerHTML = '<p class="text-secondary" style="text-align: center;">Waiting for responses...</p>';
        return;
    }

    list.innerHTML = responses.map(r => `
        <div class="response-item ${r.isCorrect ? 'correct' : 'incorrect'}">
            <div>
                <strong>${r.studentName}</strong>
                <div style="font-size: 0.9rem; color: var(--text-tertiary);">
                    ${r.answer}
                </div>
            </div>
            <span style="font-size: 1.5rem;">${r.isCorrect ? '✓' : '✗'}</span>
        </div>
    `).join('');
}

function endQuestion() {
    const session = getActiveSession();

    if (session.currentQuestion) {
        // Move to history
        session.questionHistory.push({
            ...session.currentQuestion,
            endedAt: new Date().toISOString()
        });

        session.currentQuestion = null;
        localStorage.setItem('activeSession', JSON.stringify(session));
        displaySession(session);
    }
}

function downloadAttendance() {
    const session = getActiveSession();

    let csv = 'Student Name,Join Time,Questions Answered,Correct Answers\n';

    session.students.forEach(student => {
        const answered = session.questionHistory.reduce((count, q) => {
            return count + (q.responses.some(r => r.studentName === student.name) ? 1 : 0);
        }, 0);

        const correct = session.questionHistory.reduce((count, q) => {
            const response = q.responses.find(r => r.studentName === student.name);
            return count + (response && response.isCorrect ? 1 : 0);
        }, 0);

        csv += `${student.name},${student.joinedAt},${answered},${correct}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${session.code}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function endSession() {
    if (!confirm('Are you sure you want to end this session? This cannot be undone.')) {
        return;
    }

    localStorage.removeItem('activeSession');
    currentSession = null;
    stopPolling();
    loadInstructorDashboard();
}

/* ==========================================
   STUDENT FUNCTIONS
   ========================================== */
function joinSession() {
    // Get Google user data
    const googleUser = JSON.parse(sessionStorage.getItem('googleUser') || '{}');

    if (!googleUser.googleId) {
        alert('Please sign in with Google first');
        return;
    }

    const code = document.getElementById('sessionCodeInput').value.trim().toUpperCase();

    if (!code || code.length !== 6) {
        alert('Please enter a valid 6-character session code');
        return;
    }

    const session = getActiveSession();
    console.log('[JOIN] Looking for session with code:', code);
    console.log('[JOIN] Found session:', session);
    console.log('[JOIN] Session code:', session ? session.code : 'NULL');

    if (!session || session.code !== code) {
        console.error('[JOIN] Session not found or code mismatch!');
        alert('Session not found. Please check the code and try again.');
        return;
    }

    // Check if already joined (by Google ID)
    if (session.students.some(s => s.googleId === googleUser.googleId)) {
        alert('You have already joined this session.');
        return;
    }

    // Add student to session with Google data
    session.students.push({
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.avatar,
        joinedAt: new Date().toISOString()
    });

    localStorage.setItem('activeSession', JSON.stringify(session));

    // Save student data
    const studentData = {
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.avatar,
        sessionCode: code
    };
    sessionStorage.setItem('studentData', JSON.stringify(studentData));

    // Switch to session view
    document.getElementById('studentJoin').classList.add('hidden');
    document.getElementById('studentSession').classList.remove('hidden');

    loadStudentSession(studentData);
}

function loadStudentSession(studentData) {
    document.getElementById('studentSessionCode').textContent = studentData.sessionCode;
    document.getElementById('studentNameDisplay').textContent = studentData.name;

    startPolling();
    checkForQuestion();
}

function checkForQuestion() {
    const session = getActiveSession();
    const studentData = JSON.parse(sessionStorage.getItem('studentData') || '{}');

    if (!session || session.code !== studentData.sessionCode) {
        alert('Session has ended');
        leaveSession();
        return;
    }

    if (session.currentQuestion) {
        // Check if already answered
        const alreadyAnswered = session.currentQuestion.responses.some(r => r.studentName === studentData.name);

        if (alreadyAnswered) {
            document.getElementById('waitingForQuestion').classList.remove('hidden');
            document.getElementById('answerQuestion').classList.add('hidden');
        } else {
            displayQuestionForStudent(session.currentQuestion);
        }
    } else {
        document.getElementById('waitingForQuestion').classList.remove('hidden');
        document.getElementById('answerQuestion').classList.add('hidden');
    }
}

function displayQuestionForStudent(question) {
    document.getElementById('waitingForQuestion').classList.add('hidden');
    document.getElementById('answerQuestion').classList.remove('hidden');

    document.getElementById('studentQuestionType').textContent =
        question.type === 'multiple-choice' ? 'Multiple Choice' : 'Numerical Answer';
    document.getElementById('studentQuestionText').textContent = question.question;

    const answerArea = document.getElementById('studentAnswerArea');
    answerArea.innerHTML = '';

    if (question.type === 'multiple-choice') {
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'answer-options';

        question.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<span class="option-label">${opt}</span>`;
            btn.addEventListener('click', () => {
                answerArea.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
            optionsDiv.appendChild(btn);
        });

        answerArea.appendChild(optionsDiv);
    } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'text-input';
        input.placeholder = 'Enter your answer...';
        input.id = 'studentAnswerInput';
        answerArea.appendChild(input);
    }

    document.getElementById('studentFeedback').innerHTML = '';
    document.getElementById('studentFeedback').className = 'feedback-area';
}

function submitAnswer() {
    const session = getActiveSession();
    const studentData = JSON.parse(sessionStorage.getItem('studentData'));
    const question = session.currentQuestion;

    let answer, isCorrect;

    if (question.type === 'multiple-choice') {
        const selected = document.querySelector('.option-btn.selected');
        if (!selected) {
            alert('Please select an answer');
            return;
        }

        const allBtns = Array.from(document.querySelectorAll('.option-btn'));
        const selectedIndex = allBtns.indexOf(selected);
        answer = question.options[selectedIndex];
        isCorrect = selectedIndex === question.correctAnswer;
    } else {
        const input = document.getElementById('studentAnswerInput');
        if (!input || !input.value.trim()) {
            alert('Please enter an answer');
            return;
        }

        answer = input.value.trim();

        if (question.tolerance !== undefined) {
            const numUser = parseFloat(answer);
            const numAns = parseFloat(question.correctAnswer);
            isCorrect = !isNaN(numUser) && !isNaN(numAns) && Math.abs(numUser - numAns) <= question.tolerance;
        } else {
            isCorrect = answer.toLowerCase() === question.correctAnswer.toLowerCase();
        }
    }

    // Add response
    session.currentQuestion.responses.push({
        studentName: studentData.name,
        answer: answer,
        isCorrect: isCorrect,
        timestamp: new Date().toISOString()
    });

    localStorage.setItem('activeSession', JSON.stringify(session));

    // Show feedback
    const feedbackEl = document.getElementById('studentFeedback');
    const feedbackType = isCorrect ? 'correct' : 'incorrect';
    const feedbackTitle = isCorrect ? '✓ Correct!' : '✗ Incorrect';
    feedbackEl.innerHTML = `
        <div class="feedback-title">${feedbackTitle}</div>
        <div class="feedback-text">${question.explanation}</div>
    `;
    feedbackEl.className = `feedback-area show feedback-${feedbackType}`;

    document.getElementById('submitAnswerBtn').disabled = true;
    document.getElementById('submitAnswerBtn').textContent = 'Answer Submitted';

    // Disable inputs
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
    const input = document.getElementById('studentAnswerInput');
    if (input) input.disabled = true;
}

function leaveSession() {
    if (confirm('Are you sure you want to leave this session?')) {
        sessionStorage.removeItem('studentData');
        stopPolling();
        location.reload();
    }
}

/* ==========================================
   UTILITY FUNCTIONS
   ========================================== */
function generateSessionCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function getActiveSession() {
    const sessionData = localStorage.getItem('activeSession');
    return sessionData ? JSON.parse(sessionData) : null;
}

function startPolling() {
    if (pollingInterval) return;

    pollingInterval = setInterval(() => {
        if (currentRole === 'instructor') {
            const session = getActiveSession();
            if (session) {
                displaySession(session);
            }
        } else if (currentRole === 'student') {
            checkForQuestion();
        }
    }, 2000); // Poll every 2 seconds
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

/* ==========================================
   SLIDESHOW INTEGRATION
   ========================================== */
function toggleSlideshowMode() {
    const isInstructor = currentRole === 'instructor';

    if (isInstructor) {
        const dashboard = document.getElementById('instructorDashboard');
        const slideshow = document.getElementById('instructorSlideshow');

        if (slideshow.classList.contains('hidden')) {
            // Show Slideshow
            dashboard.querySelector('.dashboard-header').classList.add('hidden');
            document.getElementById('activeSession').classList.add('hidden'); // Hide Q&A part
            slideshow.classList.remove('hidden');

            // Re-init to be safe (idempotent usually, or check flag)
            initSlideshow('instructor', 'pdfCanvas', 'annotationCanvas');
        } else {
            // Hide Slideshow
            slideshow.classList.add('hidden');
            dashboard.querySelector('.dashboard-header').classList.remove('hidden');
            document.getElementById('activeSession').classList.remove('hidden');
        }
    } else {
        // Student Toggle (Controlled by instructor really, but we might want manual toggle?)
        // Actually, for students it should probably be automatic based on instructor state?
        // But for now let's allow manual toggle or just show it if active.
        // Let's implement a manual toggle for the student to "View Presentation"

        /* NOTE: In a real app, we'd force this view if instructor is presenting. 
           For this MVP, let's just show it. */
    }
}

// Listen for student slideshow sync
// Overwrite the student setup to handle slideshow
const originalLoadStudentSession = loadStudentSession;
loadStudentSession = function (studentData) {
    originalLoadStudentSession(studentData);

    // Check if we need to show slideshow
    // We can auto-init here
    initSlideshow('student', 'studentPdfCanvas', 'studentAnnotationCanvas');

    // Show slideshow container if PDF exists in shared storage
    const sharedPDF = localStorage.getItem('sharedPDF');
    if (sharedPDF) {
        document.getElementById('studentSlideshow').classList.remove('hidden');
    }

    // Poll for slideshow visibility? 
    // slideshow.js handles the polling for content.
    // We just need to make sure the container is visible if there is content.
    setInterval(() => {
        if (localStorage.getItem('sharedPDF') && document.getElementById('studentSlideshow').classList.contains('hidden')) {
            document.getElementById('studentSlideshow').classList.remove('hidden');
        }
    }, 2000);
};

// ==========================================
// SESSION HISTORY & LMS FUNCTIONS
// ==========================================

function calculateSessionAnalytics(session) {
    const totalStudents = session.students.length;
    const questionsAsked = session.questionHistory ? session.questionHistory.length : 0;

    let totalResponses = 0;
    let correctResponses = 0;

    if (session.questionHistory) {
        session.questionHistory.forEach(q => {
            if (q.responses) {
                totalResponses += q.responses.length;
                q.responses.forEach(r => {
                    if (r.isCorrect) correctResponses++;
                });
            }
        });
    }

    return {
        totalStudents,
        questionsAsked,
        totalResponses,
        correctResponses,
        averageAccuracy: totalResponses > 0 ? (correctResponses / totalResponses * 100).toFixed(1) : 0
    };
}

function endSession() {
    const session = getActiveSession();
    if (!session) {
        alert('No active session to end');
        return;
    }

    if (!confirm('Are you sure you want to end this session? This will save it to history.')) {
        return;
    }

    // Add end time
    session.endTime = new Date().toISOString();

    // Calculate analytics
    session.analytics = calculateSessionAnalytics(session);

    // Save to history
    const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    history.push(session);
    localStorage.setItem('sessionHistory', JSON.stringify(history));

    // Clear active session
    localStorage.removeItem('activeSession');
    sessionStorage.removeItem('studentData');

    // Stop polling
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }

    alert(`Session ${session.code} has been ended and saved to history.`);

    // Redirect to home or LMS
    window.location.href = 'index.html';
}

function getSessionHistory() {
    return JSON.parse(localStorage.getItem('sessionHistory') || '[]');
}

function getSessionById(sessionId) {
    const history = getSessionHistory();
    return history.find(s => s.code === sessionId);
}

function clearSessionHistory() {
    if (confirm('Are you sure you want to clear all session history? This cannot be undone.')) {
        localStorage.removeItem('sessionHistory');
        alert('Session history cleared');
    }
}

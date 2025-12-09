/* ==========================================
   STUDENT QUESTION SUBMISSION
   ========================================== */
window.submitQuestion = function () {
    const questionText = document.getElementById('studentQuestionInput').value.trim();
    const isAnonymous = document.getElementById('askAnonymouslyCheckbox').checked;

    if (!questionText) {
        alert('Please enter a question');
        return;
    }

    const studentData = JSON.parse(sessionStorage.getItem('studentData') || '{}');
    const session = getActiveSession();

    if (!session) {
        alert('No active session found');
        return;
    }

    const question = {
        id: Date.now() + '-' + Math.random(),
        text: questionText,
        studentName: isAnonymous ? 'Anonymous' : studentData.name,
        studentId: studentData.googleId,
        timestamp: new Date().toISOString(),
        isAnonymous: isAnonymous
    };

    // Add question to session
    if (!session.questions) {
        session.questions = [];
    }
    session.questions.push(question);
    localStorage.setItem('activeSession', JSON.stringify(session));

    // Clear input
    document.getElementById('studentQuestionInput').value = '';
    document.getElementById('askAnonymouslyCheckbox').checked = false;

    alert('Question submitted!');
}

/* ==========================================
   INSTRUCTOR QUESTION DISPLAY
   ========================================== */
function renderStudentQuestions() {
    const session = getActiveSession();
    const questionsList = document.getElementById('studentQuestionsList');

    if (!session || !session.questions || session.questions.length === 0) {
        questionsList.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 1rem;">No questions yet</p>';
        return;
    }

    // Sort by timestamp (newest first)
    const sortedQuestions = [...session.questions].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    questionsList.innerHTML = sortedQuestions.map(q => `
        <div class="question-item" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem; background: var(--bg-elevated);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <div>
                    <strong style="color: var(--accent-400);">${q.studentName}</strong>
                    <span style="color: var(--text-tertiary); font-size: 0.85rem; margin-left: 0.5rem;">
                        ${new Date(q.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="dismissQuestion('${q.id}')" 
                        style="padding: 0.25rem 0.5rem; font-size: 0.85rem;">
                    ✕ Dismiss
                </button>
            </div>
            <p style="margin: 0; color: var(--text-primary);">${q.text}</p>
        </div>
    `).join('');
}

window.dismissQuestion = function (questionId) {
    const session = getActiveSession();
    if (!session || !session.questions) return;

    session.questions = session.questions.filter(q => q.id !== questionId);
    localStorage.setItem('activeSession', JSON.stringify(session));
    renderStudentQuestions();
}

// Add to polling function to update questions
const originalStartPolling = startPolling;
startPolling = function () {
    originalStartPolling();

    // Add question rendering to instructor polling
    if (currentRole === 'instructor') {
        setInterval(() => {
            renderStudentQuestions();
        }, 2000);
    }
}

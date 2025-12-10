// LMS Dashboard JavaScript
// Teacher interface for viewing session history and analytics

// Helper function to generate invite codes
function generateInviteCode() {
    // Generate a random 8-character code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

let currentView = 'sessions';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadMyClasses();
    loadSessionHistory();
    loadStudentProfiles();
    calculateAnalytics();
});

// ==========================================
// MY CLASSES
// ==========================================

async function loadMyClasses() {
    const user = JSON.parse(localStorage.getItem('chemTutorUser'));
    console.log('🔍 LMS DEBUG: User:', user.email);

    // Use Supabase function
    const classes = await getTeacherClassesDB(user.email);
    console.log('🔍 LMS DEBUG: Teacher classes from Supabase:', classes);

    // Also check all classes to see if teacher is in any
    const allClasses = JSON.parse(localStorage.getItem('classes') || '{}');
    console.log('🔍 LMS DEBUG: All classes:', allClasses);

    const container = document.getElementById('myClassesGrid');

    if (!container) {
        console.error('❌ Container myClassesGrid not found!');
        return;
    }

    if (classes.length === 0) {
        console.log('📝 No classes, showing empty state');
        container.innerHTML = `
            <div class="empty-state">
                <p>No classes assigned yet</p>
                <p class="text-secondary">Contact your admin to be assigned to a class</p>
            </div>
        `;
        return;
    }

    console.log('✅ Rendering', classes.length, 'classes');

    container.innerHTML = classes.map(classObj => `
        <div class="class-card">
            <div class="class-header">
                <h3>${classObj.code}</h3>
                <span class="class-semester">${classObj.semester}</span>
            </div>
            <p class="class-title">${classObj.fullName}</p>
            <p class="class-description">${classObj.description || 'No description'}</p>
            
            <div class="class-stats">
                <div class="stat">
                    <span class="stat-icon">👥</span>
                    <span class="stat-value">${classObj.students.length}</span>
                    <span class="stat-label">Students</span>
                </div>
            </div>

            <div class="class-actions">
                <button class="btn btn-primary" onclick="generateStudentInvite('${classObj.id}')">
                    🔗 Generate Student Invite
                </button>
                <button class="btn btn-secondary" onclick="showClassRoster('${classObj.id}')">
                    View Roster
                </button>
            </div>

            <div id="invite-${classObj.id}" class="invite-link-display hidden" style="margin-top: var(--space-sm);">
                <label>Share this link with students:</label>
                <div style="display: flex; gap: var(--space-xs);">
                    <input type="text" id="inviteLink-${classObj.id}" class="form-input" readonly>
                    <button class="btn btn-sm btn-secondary" onclick="copyInviteLink('${classObj.id}')">Copy</button>
                </div>
                <p class="text-secondary" style="font-size: 0.875rem; margin-top: var(--space-xs);">
                    Link expires in 7 days
                </p>
            </div>
        </div>
    `).join('');

    console.log('✅ Classes rendered successfully');
}

async function generateStudentInvite(classId) {
    const user = JSON.parse(localStorage.getItem('chemTutorUser'));
    const classObj = await getClassDB(classId);

    if (!classObj) {
        alert('Class not found');
        return;
    }

    // Generate invite code
    const code = generateInviteCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite in database
    await createInviteDB({
        code: code,
        role: 'student',
        school: classObj.schoolId,
        classId: classId,
        createdBy: user.email,
        expiresAt: expiresAt.toISOString()
    });

    // Generate invite link
    const inviteLink = `${window.location.origin}/?invite=${code}`;

    // Show invite link
    document.getElementById(`inviteLink-${classId}`).value = inviteLink;
    document.getElementById(`invite-${classId}`).classList.remove('hidden');

    showNotification('Student invite link generated!', 'success');
}

function copyInviteLink(classId) {
    const input = document.getElementById(`inviteLink-${classId}`);
    input.select();
    input.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(input.value).then(() => {
        showNotification('Link copied to clipboard!', 'success');
    }).catch(err => {
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    });
}

async function showClassRoster(classId) {
    const classObj = await getClassDB(classId);
    if (!classObj) return;

    const studentList = classObj.students.length > 0
        ? classObj.students.join('\n')
        : 'No students enrolled yet';

    alert(`${classObj.code} - Student Roster\n\n${studentList}`);
}

function showNotification(message, type = 'info') {
    // Simple notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: var(--bg-elevated);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
    `;

    if (type === 'success') {
        notification.style.borderColor = 'var(--success)';
        notification.style.color = 'var(--success)';
    }

    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// ==========================================
// VIEW MANAGEMENT
// ==========================================

function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.lms-view').forEach(view => {
        view.classList.add('hidden');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.lms-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected view
    const viewMap = {
        'classes': 'classesView',
        'sessions': 'sessionsView',
        'students': 'studentsView',
        'analytics': 'analyticsView'
    };

    const viewId = viewMap[viewName];
    if (viewId) {
        document.getElementById(viewId).classList.remove('hidden');
    }

    // Add active class to clicked button
    event.target.classList.add('active');

    currentView = viewName;

    // Load data for view
    if (viewName === 'sessions') {
        loadSessionHistory();
    } else if (viewName === 'students') {
        loadStudentProfiles();
    } else if (viewName === 'analytics') {
        calculateAnalytics();
    }
}

// ==========================================
// SESSION HISTORY
// ==========================================

function loadSessionHistory() {
    const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    const container = document.getElementById('sessionsList');

    if (history.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No session history yet. Complete a session to see it here.</p></div>';
        return;
    }

    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = history.map(session => {
        const startDate = new Date(session.createdAt);
        const endDate = session.endTime ? new Date(session.endTime) : null;
        const duration = endDate ? Math.round((endDate - startDate) / 60000) : 0; // minutes

        return `
            <div class="session-card" onclick="showSessionDetail('${session.code}')">
                <div class="session-card-header">
                    <h3>${session.code}</h3>
                    <span class="session-date">${startDate.toLocaleDateString()}</span>
                </div>
                <div class="session-card-body">
                    <div class="session-stat">
                        <span class="label">Students:</span>
                        <span class="value">${session.analytics?.totalStudents || session.students.length}</span>
                    </div>
                    <div class="session-stat">
                        <span class="label">Duration:</span>
                        <span class="value">${duration} min</span>
                    </div>
                    <div class="session-stat">
                        <span class="label">Questions:</span>
                        <span class="value">${session.analytics?.questionsAsked || 0}</span>
                    </div>
                    <div class="session-stat">
                        <span class="label">Accuracy:</span>
                        <span class="value">${session.analytics?.averageAccuracy || 0}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showSessionDetail(sessionCode) {
    const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    const session = history.find(s => s.code === sessionCode);

    if (!session) return;

    const modal = document.getElementById('sessionDetailModal');
    const content = document.getElementById('sessionDetailContent');

    document.getElementById('modalSessionCode').textContent = `Session ${session.code}`;

    const startDate = new Date(session.createdAt);
    const endDate = session.endTime ? new Date(session.endTime) : null;

    content.innerHTML = `
        <div class="session-detail">
            <div class="detail-section">
                <h3>Session Information</h3>
                <p><strong>Started:</strong> ${startDate.toLocaleString()}</p>
                <p><strong>Ended:</strong> ${endDate ? endDate.toLocaleString() : 'N/A'}</p>
                <p><strong>Instructor:</strong> ${session.instructorId}</p>
            </div>
            
            <div class="detail-section">
                <h3>Students (${session.students.length})</h3>
                <div class="student-list">
                    ${session.students.map(student => `
                        <div class="student-item">
                            <span>${student.name}</span>
                            <span class="text-secondary">${student.email || ''}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Analytics</h3>
                <div class="analytics-summary">
                    <div class="stat-item">
                        <span class="stat-label">Questions Asked:</span>
                        <span class="stat-value">${session.analytics?.questionsAsked || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Responses:</span>
                        <span class="stat-value">${session.analytics?.totalResponses || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Correct Responses:</span>
                        <span class="stat-value">${session.analytics?.correctResponses || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Average Accuracy:</span>
                        <span class="stat-value">${session.analytics?.averageAccuracy || 0}%</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeSessionDetail() {
    document.getElementById('sessionDetailModal').classList.add('hidden');
}

// ==========================================
// STUDENT PROFILES
// ==========================================

function loadStudentProfiles() {
    const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    const container = document.getElementById('studentsList');

    // Aggregate student data
    const studentMap = new Map();

    history.forEach(session => {
        session.students.forEach(student => {
            if (!studentMap.has(student.email || student.name)) {
                studentMap.set(student.email || student.name, {
                    name: student.name,
                    email: student.email,
                    sessionsAttended: 0,
                    questionsAsked: 0
                });
            }

            const studentData = studentMap.get(student.email || student.name);
            studentData.sessionsAttended++;
        });
    });

    if (studentMap.size === 0) {
        container.innerHTML = '<div class="empty-state"><p>No student data yet.</p></div>';
        return;
    }

    const students = Array.from(studentMap.values());

    container.innerHTML = students.map(student => `
        <div class="student-card" onclick="showStudentDetail('${student.email || student.name}')">
            <div class="student-card-header">
                <h3>${student.name}</h3>
                <span class="text-secondary">${student.email || ''}</span>
            </div>
            <div class="student-card-body">
                <div class="student-stat">
                    <span class="label">Sessions:</span>
                    <span class="value">${student.sessionsAttended}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function showStudentDetail(studentId) {
    const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    const modal = document.getElementById('studentDetailModal');
    const content = document.getElementById('studentDetailContent');

    // Find all sessions this student attended
    const studentSessions = history.filter(session =>
        session.students.some(s => (s.email || s.name) === studentId)
    );

    if (studentSessions.length === 0) return;

    const student = studentSessions[0].students.find(s => (s.email || s.name) === studentId);

    document.getElementById('modalStudentName').textContent = student.name;

    content.innerHTML = `
        <div class="student-detail">
            <div class="detail-section">
                <h3>Student Information</h3>
                <p><strong>Name:</strong> ${student.name}</p>
                <p><strong>Email:</strong> ${student.email || 'N/A'}</p>
            </div>
            
            <div class="detail-section">
                <h3>Session History (${studentSessions.length})</h3>
                <div class="session-list">
                    ${studentSessions.map(session => `
                        <div class="session-item">
                            <span><strong>${session.code}</strong></span>
                            <span class="text-secondary">${new Date(session.createdAt).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeStudentDetail() {
    document.getElementById('studentDetailModal').classList.add('hidden');
}

// ==========================================
// ANALYTICS
// ==========================================

function calculateAnalytics() {
    const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');

    const totalSessions = history.length;
    const uniqueStudents = new Set();
    let totalQuestions = 0;
    let totalAttendance = 0;

    history.forEach(session => {
        session.students.forEach(student => {
            uniqueStudents.add(student.email || student.name);
        });
        totalQuestions += session.analytics?.questionsAsked || 0;
        totalAttendance += session.students.length;
    });

    const avgAttendance = totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0;

    // Update UI
    document.getElementById('totalSessions').textContent = totalSessions;
    document.getElementById('totalStudents').textContent = uniqueStudents.size;
    document.getElementById('avgAttendance').textContent = avgAttendance;
    document.getElementById('totalQuestions').textContent = totalQuestions;

    // Session performance
    const performanceContainer = document.getElementById('sessionPerformance');
    if (history.length === 0) {
        performanceContainer.innerHTML = '<p class="text-secondary">No data available</p>';
        return;
    }

    performanceContainer.innerHTML = `
        <table class="performance-table">
            <thead>
                <tr>
                    <th>Session</th>
                    <th>Date</th>
                    <th>Students</th>
                    <th>Questions</th>
                    <th>Accuracy</th>
                </tr>
            </thead>
            <tbody>
                ${history.slice(0, 10).map(session => `
                    <tr>
                        <td>${session.code}</td>
                        <td>${new Date(session.createdAt).toLocaleDateString()}</td>
                        <td>${session.students.length}</td>
                        <td>${session.analytics?.questionsAsked || 0}</td>
                        <td>${session.analytics?.averageAccuracy || 0}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ==========================================
// CSV EXPORT
// ==========================================

function exportSessionsCSV() {
    const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');

    if (history.length === 0) {
        alert('No sessions to export');
        return;
    }

    const headers = ['Session Code', 'Date', 'Start Time', 'End Time', 'Students', 'Questions', 'Responses', 'Accuracy'];
    const rows = history.map(session => [
        session.code,
        new Date(session.createdAt).toLocaleDateString(),
        new Date(session.createdAt).toLocaleTimeString(),
        session.endTime ? new Date(session.endTime).toLocaleTimeString() : 'N/A',
        session.students.length,
        session.analytics?.questionsAsked || 0,
        session.analytics?.totalResponses || 0,
        `${session.analytics?.averageAccuracy || 0}%`
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    downloadCSV(csv, 'session-history.csv');
}

function exportStudentsCSV() {
    const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    const studentMap = new Map();

    history.forEach(session => {
        session.students.forEach(student => {
            const key = student.email || student.name;
            if (!studentMap.has(key)) {
                studentMap.set(key, {
                    name: student.name,
                    email: student.email || '',
                    sessionsAttended: 0
                });
            }
            studentMap.get(key).sessionsAttended++;
        });
    });

    const headers = ['Name', 'Email', 'Sessions Attended'];
    const rows = Array.from(studentMap.values()).map(student => [
        student.name,
        student.email,
        student.sessionsAttended
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    downloadCSV(csv, 'student-roster.csv');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// UTILITIES
// ==========================================

function clearAllHistory() {
    if (confirm('Are you sure you want to clear all session history? This cannot be undone.')) {
        localStorage.removeItem('sessionHistory');
        loadSessionHistory();
        calculateAnalytics();
        alert('Session history cleared');
    }
}

// Close modals when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
    }
}

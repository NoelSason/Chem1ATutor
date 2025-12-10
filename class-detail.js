// Class Detail Page JavaScript
// Manages individual class details, teachers, and students

let currentClassId = null;
let currentClass = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Get class ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentClassId = urlParams.get('id');

    if (!currentClassId) {
        alert('No class specified');
        window.location.href = 'dev.html';
        return;
    }

    loadClassDetails();
});

// ==========================================
// CLASS DETAILS
// ==========================================

function loadClassDetails() {
    currentClass = getClass(currentClassId);

    if (!currentClass) {
        alert('Class not found');
        window.location.href = 'dev.html';
        return;
    }

    // Update page title and info
    document.title = `${currentClass.code} - Class Management`;
    document.getElementById('pageTitle').textContent = `${currentClass.code} Management`;
    document.getElementById('classCode').textContent = currentClass.code;
    document.getElementById('classSemester').textContent = currentClass.semester;
    document.getElementById('classFullName').textContent = currentClass.fullName;
    document.getElementById('classDescription').textContent = currentClass.description || 'No description';

    // Update stats
    document.getElementById('teacherCount').textContent = currentClass.teachers.length;
    document.getElementById('studentCount').textContent = currentClass.students.length;

    // Load lists
    loadTeachers();
    loadStudents();
}

// ==========================================
// TEACHER MANAGEMENT
// ==========================================

function loadTeachers() {
    const container = document.getElementById('teachersList');

    if (currentClass.teachers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No teachers assigned yet</p></div>';
        return;
    }

    container.innerHTML = currentClass.teachers.map(email => `
        <div class="list-item">
            <div class="list-item-content">
                <span class="list-item-email">${email}</span>
            </div>
            <button class="btn btn-sm btn-error" onclick="removeTeacherFromClassUI('${email}')">Remove</button>
        </div>
    `).join('');
}

function generateTeacherInviteForClass() {
    const user = JSON.parse(localStorage.getItem('chemTutorUser'));
    const invite = createInvite('teacher', currentClass.schoolId, user.email);

    // Show invite link
    document.getElementById('teacherInviteLink').value = invite.link;
    document.getElementById('teacherInviteLinkDisplay').classList.remove('hidden');

    showNotification('Teacher invite link generated!', 'success');
}

function copyTeacherInviteLink() {
    const input = document.getElementById('teacherInviteLink');
    input.select();
    input.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(input.value).then(() => {
        showNotification('Link copied to clipboard!', 'success');
    }).catch(err => {
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    });
}

function addTeacherToClassManually() {
    const input = document.getElementById('teacherEmail');
    const email = input.value.trim().toLowerCase();

    if (!email) {
        alert('Please enter an email address');
        return;
    }

    if (!email.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }

    try {
        addTeacherToClass(email, currentClassId);
        input.value = '';
        loadClassDetails();
        showNotification(`Added ${email} as teacher`, 'success');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function removeTeacherFromClassUI(email) {
    if (!confirm(`Remove ${email} from this class?`)) {
        return;
    }

    try {
        removeTeacherFromClass(email, currentClassId);
        loadClassDetails();
        showNotification(`Removed ${email} from class`, 'success');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

function loadStudents() {
    const container = document.getElementById('studentsList');

    if (currentClass.students.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No students enrolled yet</p></div>';
        return;
    }

    container.innerHTML = currentClass.students.map(email => `
        <div class="list-item">
            <div class="list-item-content">
                <span class="list-item-email">${email}</span>
            </div>
            <button class="btn btn-sm btn-error" onclick="removeStudentFromClassUI('${email}')">Remove</button>
        </div>
    `).join('');
}

function generateStudentInviteForClass() {
    const user = JSON.parse(localStorage.getItem('chemTutorUser'));
    const invite = createInvite('student', currentClass.schoolId, user.email, currentClassId);

    // Show invite link
    document.getElementById('studentInviteLink').value = invite.link;
    document.getElementById('studentInviteLinkDisplay').classList.remove('hidden');

    showNotification('Student invite link generated!', 'success');
}

function copyStudentInviteLink() {
    const input = document.getElementById('studentInviteLink');
    input.select();
    input.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(input.value).then(() => {
        showNotification('Link copied to clipboard!', 'success');
    }).catch(err => {
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    });
}

function removeStudentFromClassUI(email) {
    if (!confirm(`Remove ${email} from this class?`)) {
        return;
    }

    try {
        removeStudentFromClass(email, currentClassId);
        loadClassDetails();
        showNotification(`Removed ${email} from class`, 'success');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ==========================================
// CLASS DELETION
// ==========================================

function deleteClassConfirm() {
    if (!confirm(`⚠️ Are you sure you want to delete ${currentClass.code}? This cannot be undone!`)) {
        return;
    }

    if (!confirm(`This will remove all ${currentClass.teachers.length} teachers and ${currentClass.students.length} students from this class. Continue?`)) {
        return;
    }

    try {
        deleteClass(currentClassId);
        alert('Class deleted successfully');
        window.location.href = 'dev.html';
    } catch (error) {
        alert('Error deleting class: ' + error.message);
    }
}

// ==========================================
// UTILITIES
// ==========================================

function showNotification(message, type = 'info') {
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
        animation: slideIn 0.3s ease-out;
    `;

    if (type === 'success') {
        notification.style.borderColor = 'var(--success)';
        notification.style.color = 'var(--success)';
    } else if (type === 'error') {
        notification.style.borderColor = 'var(--error)';
        notification.style.color = 'var(--error)';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

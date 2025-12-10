// Class Detail Page JavaScript
// Manages individual class details, teachers, and students

let currentClassId = null;
let currentClass = null;

// Initialize on page load
// Class Detail Page JavaScript

// Get class ID from URL
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get('id');

// Load class details on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!classId) {
        alert('No class ID provided');
        window.location.href = 'dev.html';
        return;
    }

    await loadClassDetail();
});

// ==========================================
// CLASS DETAILS
// ==========================================

async function loadClassDetail() {
    const classObj = await getClassDB(classId);

    if (!classObj) {
        alert('Class not found');
        window.location.href = 'dev.html';
        return;
    }

    // Update page title and header
    document.title = `${classObj.code} - Class Detail`;
    document.getElementById('pageTitle').textContent = `${classObj.code} Management`;
    document.getElementById('classCode').textContent = classObj.code;
    document.getElementById('classFullName').textContent = classObj.fullName;
    document.getElementById('classDescription').textContent = classObj.description || 'No description';
    document.getElementById('classSemester').textContent = classObj.semester;
    document.getElementById('teacherCount').textContent = classObj.teachers.length;
    document.getElementById('studentCount').textContent = classObj.students.length;

    // Load teachers and students
    await loadTeachers(classObj);
    await loadStudents(classObj);
}

// ==========================================
// TEACHER MANAGEMENT
// ==========================================

async function loadTeachers(classObj) {
    const container = document.getElementById('teachersList');

    if (classObj.teachers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No teachers assigned yet</p></div>';
        return;
    }

    container.innerHTML = classObj.teachers.map(email => `
        <div class="list-item">
            <div class="list-item-content">
                <span class="list-item-email">${email}</span>
            </div>
            <button class="btn btn-sm btn-error" onclick="removeTeacherFromClassDetail('${email}')">Remove</button>
        </div>
    `).join('');
}

async function generateTeacherInviteForClass() {
    const classObj = await getClassDB(classId);
    const user = JSON.parse(localStorage.getItem('chemTutorUser'));

    // Generate invite code
    const code = generateInviteCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite in database
    await createInviteDB({
        code: code,
        role: 'teacher',
        school: classObj.schoolId,
        classId: classId,
        createdBy: user.email,
        expiresAt: expiresAt.toISOString()
    });

    // Generate invite link
    const inviteLink = `${window.location.origin}/?invite=${code}`;

    // Show invite link
    document.getElementById('teacherInviteLink').value = inviteLink;
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

async function addTeacherToClassFromInput() {
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
        await addTeacherToClassDB(email, classId);
        input.value = '';
        await loadClassDetail();
        showNotification(`Added ${email} as teacher`, 'success');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function removeTeacherFromClassDetail(email) {
    if (!confirm(`Remove ${email} from this class?`)) {
        return;
    }

    try {
        await removeTeacherFromClassDB(email, classId);
        await loadClassDetail();
        showNotification(`Removed ${email}`, 'success');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

async function loadStudents(classObj) {
    const container = document.getElementById('studentsList');

    if (classObj.students.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No students enrolled yet</p></div>';
        return;
    }

    container.innerHTML = classObj.students.map(email => `
        <div class="list-item">
            <div class="list-item-content">
                <span class="list-item-email">${email}</span>
            </div>
            <button class="btn btn-sm btn-error" onclick="removeStudentFromClassUI('${email}')">Remove</button>
        </div>
    `).join('');
}

async function generateStudentInviteForClass() {
    const classObj = await getClassDB(classId);
    const user = JSON.parse(localStorage.getItem('chemTutorUser'));

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
    document.getElementById('studentInviteLink').value = inviteLink;
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

async function removeStudentFromClassUI(email) {
    if (!confirm(`Remove ${email} from this class?`)) {
        return;
    }

    try {
        await removeStudentFromClassDB(email, classId);
        await loadClassDetail();
        showNotification(`Removed ${email} from class`, 'success');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ==========================================
// CLASS DELETION
// ==========================================

async function deleteClassConfirm() {
    const classObj = await getClassDB(classId);

    if (!confirm(`⚠️ Are you sure you want to delete ${classObj.code}? This cannot be undone!`)) {
        return;
    }

    if (!confirm(`This will remove all ${classObj.teachers.length} teachers and ${classObj.students.length} students from this class. Continue?`)) {
        return;
    }

    try {
        await deleteClassDB(classId);
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

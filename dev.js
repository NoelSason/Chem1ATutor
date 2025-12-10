// Dev Panel JavaScript
// Admin-only interface for managing roles

// Check admin access on page load
document.addEventListener('DOMContentLoaded', () => {
    const user = requireLogin();
    if (!user) return;

    const userRole = getUserRole(user.email);

    // Allow both admin and owner
    if (userRole !== 'admin' && userRole !== 'owner') {
        alert('Access denied. This page is for admins only.');
        window.location.href = 'index.html';
        return;
    }

    // Display school info
    updateSchoolInfo();

    loadTeachers();
    loadClasses();
    updateSystemInfo();
});

// ==========================================
// TEACHER MANAGEMENT
// ==========================================

function loadTeachers() {
    const teachers = getAllTeachers();
    const container = document.getElementById('teachersList');
    const countEl = document.getElementById('teacherCount');

    countEl.textContent = teachers.length;

    if (teachers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No teachers added yet</p></div>';
        return;
    }

    container.innerHTML = teachers.map(email => `
    < div class="list-item" >
            <div class="list-item-content">
                <span class="list-item-email">${email}</span>
                <span class="list-item-role">Teacher</span>
            </div>
            <button class="btn btn-sm btn-error" onclick="removeTeacherFromList('${email}')">Remove</button>
        </div >
    `).join('');
}

function addTeacherFromInput() {
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

    if (isAdmin(email)) {
        alert('Admin already has all permissions');
        input.value = '';
        return;
    }

    if (isTeacher(email)) {
        alert('This user is already a teacher');
        input.value = '';
        return;
    }

    try {
        addTeacher(email);
        input.value = '';
        loadTeachers();
        showNotification(`Added ${email} as teacher`, 'success');
    } catch (error) {
        alert('Error adding teacher: ' + error.message);
    }
}

function removeTeacherFromList(email) {
    if (!confirm(`Remove ${email} from teachers ? `)) {
        return;
    }

    try {
        removeTeacher(email);
        loadTeachers();
        showNotification(`Removed ${email} from teachers`, 'success');
    } catch (error) {
        alert('Error removing teacher: ' + error.message);
    }
}

// ==========================================
// SYSTEM INFO
// ==========================================

function updateSystemInfo() {
    // Calculate localStorage usage
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
        }
    }

    const sizeKB = (totalSize / 1024).toFixed(2);
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    document.getElementById('storageInfo').textContent =
        sizeMB > 1 ? `${sizeMB} MB` : `${sizeKB} KB`;
}

// ==========================================
// DANGER ZONE
// ==========================================

function clearAllTeachers() {
    if (!confirm('Are you sure you want to remove ALL teachers? This cannot be undone.')) {
        return;
    }

    if (!confirm('This will remove all teacher permissions. Are you absolutely sure?')) {
        return;
    }

    localStorage.removeItem('userRoles');
    loadTeachers();
    showNotification('All teachers removed', 'warning');
}

function clearAllData() {
    if (!confirm('⚠️ WARNING: This will delete ALL app data including sessions, teachers, and user data. This CANNOT be undone!')) {
        return;
    }

    const confirmText = prompt('Type "DELETE ALL DATA" to confirm:');
    if (confirmText !== 'DELETE ALL DATA') {
        alert('Cancelled');
        return;
    }

    localStorage.clear();
    sessionStorage.clear();

    alert('All data cleared. Redirecting to home page...');
    window.location.href = 'index.html';
}

// ==========================================
// UTILITIES
// ==========================================

function showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification - ${type} `;
    notification.textContent = message;
    notification.style.cssText = `
position: fixed;
top: 20px;
right: 20px;
padding: 16px 24px;
background: var(--bg - elevated);
border: 1px solid var(--border - color);
border - radius: var(--radius - md);
box - shadow: var(--shadow - lg);
z - index: 9999;
animation: slideIn 0.3s ease - out;
`;

    if (type === 'success') {
        notification.style.borderColor = 'var(--success)';
        notification.style.color = 'var(--success)';
    } else if (type === 'warning') {
        notification.style.borderColor = 'var(--warning)';
        notification.style.color = 'var(--warning)';
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

// ==========================================
// TEACHER INVITE GENERATION
// ==========================================

function generateTeacherInvite() {
    const user = JSON.parse(localStorage.getItem('chemTutorUser'));

    // For now, use a default school (uc-berkeley)
    // In production, this would be based on the admin's school
    const schoolId = 'uc-berkeley';

    const invite = createInvite('teacher', schoolId, user.email);

    // Show invite link
    document.getElementById('teacherInviteLink').value = invite.link;
    document.getElementById('teacherInviteLinkDisplay').classList.remove('hidden');

    showNotification('Teacher invite link generated!', 'success');
}

function copyTeacherInviteLink() {
    const input = document.getElementById('teacherInviteLink');
    input.select();
    input.setSelectionRange(0, 99999); // For mobile

    navigator.clipboard.writeText(input.value).then(() => {
        showNotification('Link copied to clipboard!', 'success');
    }).catch(err => {
        // Fallback for older browsers
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    });
}

// ==========================================
// SCHOOL INFO
// ==========================================

function updateSchoolInfo() {
    const user = JSON.parse(localStorage.getItem('chemTutorUser'));
    const userRole = getUserRole(user.email);

    // Get admin's school
    let schoolId = 'uc-berkeley'; // Default
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    const roleData = roles[user.email];

    if (roleData && typeof roleData === 'object' && roleData.schools && roleData.schools.length > 0) {
        schoolId = roleData.schools[0];
    }

    const school = getSchool(schoolId);
    const schoolName = school ? school.name : 'UC Berkeley';

    document.getElementById('schoolBadge').textContent = `🏫 ${schoolName}`;
}

// ==========================================
// CLASS MANAGEMENT
// ==========================================

function loadClasses() {
    const user = JSON.parse(localStorage.getItem('chemTutorUser'));

    // Get admin's school
    let schoolId = 'uc-berkeley'; // Default
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    const roleData = roles[user.email];

    if (roleData && typeof roleData === 'object' && roleData.schools && roleData.schools.length > 0) {
        schoolId = roleData.schools[0];
    }

    console.log('🔍 DEBUG: Loading classes for school:', schoolId);
    console.log('🔍 DEBUG: User role data:', roleData);

    const classes = Object.values(getClasses(schoolId));
    console.log('🔍 DEBUG: Found classes:', classes);

    const container = document.getElementById('classesList');

    if (classes.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No classes created yet</p></div>';
        return;
    }

    container.innerHTML = classes.map(classObj => `
        <div class="list-item" onclick="showClassDetail('${classObj.id}')">
            <div class="list-item-content">
                <div>
                    <strong>${classObj.code}</strong> - ${classObj.fullName}
                    <div class="text-secondary" style="font-size: 0.875rem;">
                        👨‍🏫 ${classObj.teachers.length} teachers · 👥 ${classObj.students.length} students
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function createClassFromInput() {
    const code = document.getElementById('classCode').value.trim();
    const fullName = document.getElementById('classFullName').value.trim();
    const description = document.getElementById('classDescription').value.trim();

    if (!code) {
        alert('Please enter a class code');
        return;
    }

    if (!fullName) {
        alert('Please enter the full class name');
        return;
    }

    const user = JSON.parse(localStorage.getItem('chemTutorUser'));

    try {
        createClass('uc-berkeley', code, fullName, description, user.email);

        // Clear inputs
        document.getElementById('classCode').value = '';
        document.getElementById('classFullName').value = '';
        document.getElementById('classDescription').value = '';

        loadClasses();
        showNotification(`Created ${code}`, 'success');
    } catch (error) {
        alert('Error creating class: ' + error.message);
    }
}

function showClassDetail(classId) {
    // Navigate to class detail page
    window.location.href = `class-detail.html?id=${classId}`;
}

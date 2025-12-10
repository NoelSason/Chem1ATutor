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

    loadClasses();
    updateSystemInfo();
});

// ==========================================
// NAVIGATION
// ==========================================

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}View`).classList.add('active');
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

async function loadClasses() {
    const user = JSON.parse(localStorage.getItem('chemTutorUser'));

    // Get admin's school
    let schoolId = 'uc-berkeley'; // Default
    const { data: roleData } = await supabase
        .from('user_roles')
        .select('schools')
        .eq('email', user.email)
        .single();

    if (roleData && roleData.schools && roleData.schools.length > 0) {
        schoolId = roleData.schools[0];
    }

    console.log('🔍 DEBUG: Loading classes for school:', schoolId);

    const classesObj = await getClassesDB(schoolId);
    const classes = Object.values(classesObj);
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

async function createClassFromInput() {
    const code = document.getElementById('classCode').value.trim();
    const fullName = document.getElementById('classFullName').value.trim();
    const description = document.getElementById('classDescription').value.trim();

    if (!code || !fullName) {
        alert('Please fill in class code and full name');
        return;
    }

    const user = JSON.parse(localStorage.getItem('chemTutorUser'));
    const schoolId = 'uc-berkeley'; // TODO: Get from user's school

    const classId = `${schoolId}-${code.toLowerCase().replace(/\s+/g, '-')}`;

    const classData = {
        id: classId,
        schoolId: schoolId,
        code: code,
        fullName: fullName,
        description: description,
        semester: getCurrentSemester(),
        createdBy: user.email
    };

    try {
        await createClassDB(classData);

        // Clear form
        document.getElementById('classCode').value = '';
        document.getElementById('classFullName').value = '';
        document.getElementById('classDescription').value = '';

        await loadClasses();
        showNotification(`Created class: ${code}`, 'success');
    } catch (error) {
        alert('Error creating class: ' + error.message);
    }
}

function showClassDetail(classId) {
    // Navigate to class detail page
    window.location.href = `class-detail.html?id=${classId}`;
}

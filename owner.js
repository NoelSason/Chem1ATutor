// Owner Panel JavaScript
// Owner-only interface for managing schools and admins

let currentSchoolId = null;
let inviteRefreshInterval = null;

// Check owner access on page load
document.addEventListener('DOMContentLoaded', () => {
    const user = requireLogin();
    if (!user) return;

    if (!isOwner(user.email)) {
        alert('Access denied. This page is for the owner only.');
        window.location.href = 'index.html';
        return;
    }

    loadSchools();
});

// ==========================================
// SCHOOL MANAGEMENT
// ==========================================

function loadSchools() {
    const schools = Object.values(getSchools());
    const container = document.getElementById('schoolsList');

    if (schools.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No schools created yet</p></div>';
        return;
    }

    container.innerHTML = schools.map(school => `
        <div class="school-card" onclick="showSchoolDetail('${school.id}')">
            <div class="school-card-header">
                <h3>${school.name}</h3>
                <span class="school-date">${new Date(school.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="school-card-body">
                <div class="school-stat">
                    <span class="label">Admins:</span>
                    <span class="value">${school.admins.length}</span>
                </div>
                <div class="school-stat">
                    <span class="label">Teachers:</span>
                    <span class="value">${school.teachers.length}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function createSchoolFromInput() {
    const input = document.getElementById('schoolName');
    const name = input.value.trim();

    if (!name) {
        alert('Please enter a school name');
        return;
    }

    try {
        createSchool(name);
        input.value = '';
        loadSchools();
        showNotification(`Created ${name}`, 'success');
    } catch (error) {
        alert('Error creating school: ' + error.message);
    }
}

function showSchoolDetail(schoolId) {
    currentSchoolId = schoolId;
    const school = getSchool(schoolId);

    if (!school) return;

    const modal = document.getElementById('schoolDetailModal');
    document.getElementById('modalSchoolName').textContent = school.name;

    loadAdmins(school);
    loadAcceptedInvites(schoolId);
    modal.classList.remove('hidden');

    // Start polling for new acceptances
    if (inviteRefreshInterval) clearInterval(inviteRefreshInterval);
    inviteRefreshInterval = setInterval(() => {
        if (currentSchoolId === schoolId) {
            loadAcceptedInvites(schoolId);
            loadAdmins(getSchool(schoolId));
        }
    }, 10000);
}

function closeSchoolDetail() {
    document.getElementById('schoolDetailModal').classList.add('hidden');
    currentSchoolId = null;

    if (inviteRefreshInterval) {
        clearInterval(inviteRefreshInterval);
        inviteRefreshInterval = null;
    }
}

// ==========================================
// ADMIN MANAGEMENT
// ==========================================

function loadAdmins(school) {
    const container = document.getElementById('adminsList');

    if (school.admins.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No admins assigned yet</p></div>';
        return;
    }

    container.innerHTML = school.admins.map(email => `
        <div class="list-item">
            <div class="list-item-content">
                <span class="list-item-email">${email}</span>
                <span class="list-item-role">Admin</span>
            </div>
            ${email !== OWNER_EMAIL ? `
                <button class="btn btn-sm btn-error" onclick="removeAdminFromModal('${email}')">Remove</button>
            ` : '<span class="text-tertiary">Owner</span>'}
        </div>
    `).join('');
}

function addAdminFromModal() {
    const input = document.getElementById('adminEmail');
    const email = input.value.trim().toLowerCase();

    if (!email) {
        alert('Please enter an email address');
        return;
    }

    if (!email.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }

    if (!currentSchoolId) return;

    const school = getSchool(currentSchoolId);

    if (school.admins.includes(email)) {
        alert('This user is already an admin for this school');
        input.value = '';
        return;
    }

    try {
        addAdminToSchool(email, currentSchoolId);
        input.value = '';
        const updatedSchool = getSchool(currentSchoolId);
        loadAdmins(updatedSchool);
        loadSchools();
        showNotification(`Added ${email} as admin`, 'success');
    } catch (error) {
        alert('Error adding admin: ' + error.message);
    }
}

async function removeAdminFromModal(email) {
    if (!currentSchoolId) return;

    if (!confirm(`Remove ${email} as admin? This will revoke their admin access to this school.`)) {
        return;
    }

    try {
        const school = getSchool(currentSchoolId);

        // Use Supabase to remove admin (this also updates user_roles)
        await removeAdminFromSchoolDB(email, currentSchoolId);

        // Refresh the admin list
        loadAdmins(school);

        showNotification('Admin removed successfully', 'success');
    } catch (error) {
        console.error('Error removing admin:', error);
        alert('Error removing admin: ' + error.message);
    }
}

// ==========================================
// ACCEPTED INVITES TRACKING
// ==========================================

async function loadAcceptedInvites(schoolId) {
    try {
        const invites = await getAcceptedInvitesDB(schoolId);

        const container = document.getElementById('acceptedInvitesList');

        if (invites.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No accepted invites yet</p></div>';
            return;
        }

        container.innerHTML = invites.map(invite => `
            <div class="list-item">
                <div class="list-item-content">
                    <div>
                        <span class="list-item-email">${invite.used_by}</span>
                        <span class="list-item-meta">Accepted ${formatTimeAgo(invite.used_at)}</span>
                    </div>
                    <span class="list-item-badge success">✓ Accepted</span>
                </div>
                <button class="btn btn-sm btn-error" onclick="removeAcceptedInvite('${invite.code}')">Remove</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading accepted invites:', error);
        document.getElementById('acceptedInvitesList').innerHTML =
            '<div class="empty-state"><p>Error loading invites</p></div>';
    }
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
}

async function removeAcceptedInvite(inviteCode) {
    if (!confirm('Remove this accepted invite record? This will not revoke admin access.')) {
        return;
    }

    try {
        await deleteInviteDB(inviteCode);

        // Refresh the list
        if (currentSchoolId) {
            await loadAcceptedInvites(currentSchoolId);
        }

        showNotification('Invite record removed', 'success');
    } catch (error) {
        console.error('Error removing invite:', error);
        alert('Error removing invite: ' + error.message);
    }
}

// ==========================================
// SCHOOL DELETION
// ==========================================

function deleteCurrentSchool() {
    if (!currentSchoolId) return;

    const school = getSchool(currentSchoolId);

    if (!confirm(`⚠️ WARNING: Delete ${school.name}? This will remove all admins and teachers associated with this school.This CANNOT be undone!`)) {
        return;
    }

    const confirmText = prompt(`Type "${school.name}" to confirm deletion: `);
    if (confirmText !== school.name) {
        alert('Cancelled');
        return;
    }

    try {
        deleteSchool(currentSchoolId);
        closeSchoolDetail();
        loadSchools();
        showNotification(`Deleted ${school.name} `, 'warning');
    } catch (error) {
        alert('Error deleting school: ' + error.message);
    }
}

// ==========================================
// UTILITIES
// ==========================================

function showNotification(message, type = 'info') {
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

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
        currentSchoolId = null;
    }
}

// ==========================================
// INVITE GENERATION
// ==========================================

async function generateAdminInvite() {
    if (!currentSchoolId) return;

    try {
        const user = JSON.parse(localStorage.getItem('chemTutorUser'));
        const code = generateInviteCode();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Create invite in Supabase
        await createInviteDB({
            code: code,
            role: 'admin',
            school: currentSchoolId,
            classId: null,
            createdBy: user.email,
            expiresAt: expiresAt.toISOString()
        });

        // Generate invite link (simple code-based)
        const inviteLink = `${window.location.origin}/?invite=${code}`;

        // Show invite link
        document.getElementById('inviteLink').value = inviteLink;
        document.getElementById('inviteLinkDisplay').classList.remove('hidden');

        showNotification('Admin invite link generated!', 'success');
    } catch (error) {
        console.error('Error generating invite:', error);
        alert('Error generating invite: ' + error.message);
    }
}

function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function copyInviteLink() {
    const input = document.getElementById('inviteLink');
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

// Note: Real-time subscriptions removed to fix compatibility issues
// The accepted invites list will refresh when you reopen the school detail modal

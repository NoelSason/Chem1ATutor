// Role-Based Access Control System
// Manages user roles and permissions

const OWNER_EMAIL = 'cubemasternoel@gmail.com';
const ADMIN_EMAIL = 'cubemasternoel@gmail.com'; // Legacy, owner is also admin

// ==========================================
// ROLE MANAGEMENT
// ==========================================

function getUserRole(email) {
    if (!email) return 'student';

    // Check if owner
    if (isOwner(email)) {
        return 'owner';
    }

    // Check if admin (legacy check)
    if (isAdmin(email)) {
        return 'admin';
    }

    // Check user roles
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    const userRole = roles[email];

    // Handle both old string format and new object format
    if (typeof userRole === 'string') {
        return userRole; // Old format: 'teacher'
    } else if (typeof userRole === 'object' && userRole.role) {
        return userRole.role; // New format: { role: 'admin', schools: [...] }
    }

    // Default to student
    return 'student';
}

function isAdmin(email) {
    return email === ADMIN_EMAIL;
}

function isTeacher(email) {
    if (!email) return false;

    // Admin has all permissions
    if (isAdmin(email)) return true;

    // Check teacher role
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    const userRole = roles[email];

    // Handle both old string format and new object format
    if (typeof userRole === 'string') {
        return userRole === 'teacher';
    } else if (typeof userRole === 'object' && userRole.role) {
        return userRole.role === 'teacher';
    }

    return false;
}

function isStudent(email) {
    return getUserRole(email) === 'student';
}

// ==========================================
// TEACHER MANAGEMENT (Admin Only)
// ==========================================

function addTeacher(email) {
    if (!email) throw new Error('Email is required');

    // Check if user is owner or admin - don't overwrite their role
    if (isOwner(email)) {
        throw new Error('Owner already has all permissions');
    }

    const userRole = getUserRole(email);
    if (userRole === 'admin') {
        throw new Error('Admin already has all permissions');
    }

    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    roles[email] = 'teacher';
    localStorage.setItem('userRoles', JSON.stringify(roles));
    return true;
}

function removeTeacher(email) {
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    delete roles[email];
    localStorage.setItem('userRoles', JSON.stringify(roles));

    return true;
}

function getAllTeachers() {
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    return Object.keys(roles).filter(email => roles[email] === 'teacher');
}

// ==========================================
// ACCESS CONTROL
// ==========================================

function checkAccess(requiredRole, currentUserEmail) {
    if (!currentUserEmail) {
        return false;
    }

    const userRole = getUserRole(currentUserEmail);

    // Admin has access to everything
    if (userRole === 'admin') {
        return true;
    }

    // Check specific role requirements
    if (requiredRole === 'teacher') {
        return userRole === 'teacher';
    }

    if (requiredRole === 'admin') {
        return userRole === 'admin';
    }

    // Default: everyone has access
    return true;
}

function requireLogin() {
    const user = JSON.parse(localStorage.getItem('chemTutorUser') || 'null');
    if (!user) {
        alert('Please login to access this page');
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

// ==========================================
// SCHOOL MANAGEMENT (Owner Only)
// ==========================================

function initializeSchools() {
    const schools = getSchools();

    // Create UC Berkeley if it doesn't exist
    if (!schools['uc-berkeley']) {
        createSchool('UC Berkeley', 'uc-berkeley');
        addAdminToSchool(OWNER_EMAIL, 'uc-berkeley');
    }
}

function getSchools() {
    return JSON.parse(localStorage.getItem('schools') || '{}');
}

function createSchool(name, id) {
    if (!id) {
        id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    const schools = getSchools();

    if (schools[id]) {
        throw new Error('School already exists');
    }

    schools[id] = {
        id: id,
        name: name,
        admins: [],
        createdAt: new Date().toISOString(),
        teachers: []
    };

    localStorage.setItem('schools', JSON.stringify(schools));
    return schools[id];
}

function deleteSchool(schoolId) {
    const schools = getSchools();
    delete schools[schoolId];
    localStorage.setItem('schools', JSON.stringify(schools));

    // Clean up user roles for this school
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    Object.keys(roles).forEach(email => {
        if (roles[email].schools) {
            roles[email].schools = roles[email].schools.filter(s => s !== schoolId);
        }
        if (roles[email].school === schoolId) {
            delete roles[email].school;
        }
    });
    localStorage.setItem('userRoles', JSON.stringify(roles));
}

function getSchool(schoolId) {
    const schools = getSchools();
    return schools[schoolId];
}

function addAdminToSchool(email, schoolId) {
    const schools = getSchools();
    const school = schools[schoolId];

    if (!school) {
        throw new Error('School not found');
    }

    // Initialize admins array if it doesn't exist
    if (!school.admins) {
        school.admins = [];
    }

    // Check if already admin
    if (school.admins.includes(email)) {
        throw new Error('User is already an admin for this school');
    }

    // Add to school's admin list
    school.admins.push(email);

    // Update user's role
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    const userRole = roles[email];

    if (typeof userRole === 'object' && userRole.role) {
        // User already has a role object, add school
        if (!userRole.schools) userRole.schools = [];
        if (!userRole.schools.includes(schoolId)) {
            userRole.schools.push(schoolId);
        }
        userRole.role = 'admin';
    } else {
        // Create new role object
        roles[email] = {
            role: 'admin',
            schools: [schoolId]
        };
    }

    localStorage.setItem('userRoles', JSON.stringify(roles));
    localStorage.setItem('schools', JSON.stringify(schools));
}

function removeAdminFromSchool(email, schoolId) {
    const schools = getSchools();
    const school = schools[schoolId];

    if (school) {
        school.admins = school.admins.filter(a => a !== email);
        localStorage.setItem('schools', JSON.stringify(schools));
    }

    // Update user role
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    if (roles[email] && roles[email].schools) {
        roles[email].schools = roles[email].schools.filter(s => s !== schoolId);

        // If no schools left, demote from admin
        if (roles[email].schools.length === 0) {
            delete roles[email];
        }
    }
    localStorage.setItem('userRoles', JSON.stringify(roles));
}

function getUserSchools(email) {
    if (isOwner(email)) {
        // Owner has access to all schools
        return Object.values(getSchools());
    }

    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    const userRole = roles[email];

    if (!userRole || !userRole.schools) {
        return [];
    }

    const schools = getSchools();
    return userRole.schools.map(schoolId => schools[schoolId]).filter(Boolean);
}

function isOwner(email) {
    return email === OWNER_EMAIL;
}

// Update existing isAdmin to check owner first
const originalIsAdmin = isAdmin;
isAdmin = function (email) {
    return isOwner(email) || originalIsAdmin(email);
}

// Initialize schools on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeSchools();
    });
}

// ==========================================
// INVITATION SYSTEM
// ==========================================

function generateInviteCode() {
    // Generate a random 8-character code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function createInvite(role, school, createdBy, classId = null) {
    const code = generateInviteCode();

    // Store invite in localStorage for tracking (optional)
    const invites = JSON.parse(localStorage.getItem('pendingInvites') || '{}');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    invites[code] = {
        code: code,
        role: role,
        school: school,
        classId: classId,
        createdBy: createdBy,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        used: false
    };

    localStorage.setItem('pendingInvites', JSON.stringify(invites));

    // Encode invite data in URL parameters
    const inviteData = btoa(JSON.stringify({
        role: role,
        school: school,
        classId: classId,
        code: code,
        expires: expiresAt.getTime()
    }));

    return {
        code: code,
        link: `${window.location.origin}/?invite=${inviteData}`
    };
}

function getInvite(code) {
    const invites = JSON.parse(localStorage.getItem('pendingInvites') || '{}');
    return invites[code];
}

function validateInvite(code) {
    try {
        // Decode invite data from base64
        const inviteData = JSON.parse(atob(code));

        // Check expiration
        const now = new Date().getTime();
        if (now > inviteData.expires) {
            return { valid: false, reason: 'Invite expired' };
        }

        // Check if already used (from localStorage)
        const invites = JSON.parse(localStorage.getItem('pendingInvites') || '{}');
        const storedInvite = invites[inviteData.code];

        if (storedInvite && storedInvite.used) {
            return { valid: false, reason: 'Invite already used' };
        }

        return {
            valid: true,
            invite: {
                code: inviteData.code,
                role: inviteData.role,
                school: inviteData.school,
                expiresAt: new Date(inviteData.expires).toISOString()
            }
        };
    } catch (error) {
        return { valid: false, reason: 'Invalid invite code' };
    }
}

function acceptInvite(code, userEmail) {
    const validation = validateInvite(code);

    if (!validation.valid) {
        throw new Error(validation.reason);
    }

    const invite = validation.invite;

    // Assign role based on invite
    if (invite.role === 'admin') {
        addAdminToSchool(userEmail, invite.school);
    } else if (invite.role === 'teacher') {
        addTeacher(userEmail);
        // TODO: Associate teacher with school
    } else if (invite.role === 'student') {
        // Enroll student in class
        if (!invite.classId) {
            throw new Error('Invalid student invite: missing class');
        }
        addStudentToClass(userEmail, invite.classId);
    }

    // Mark invite as used (create entry if it doesn't exist)
    const invites = JSON.parse(localStorage.getItem('pendingInvites') || '{}');

    // If invite doesn't exist in localStorage, create it
    if (!invites[invite.code]) {
        invites[invite.code] = {
            code: invite.code,
            role: invite.role,
            school: invite.school,
            classId: invite.classId,
            createdAt: new Date().toISOString(),
            expiresAt: invite.expiresAt,
            used: false
        };
    }

    // Mark as used
    invites[invite.code].used = true;
    invites[invite.code].usedBy = userEmail;
    invites[invite.code].usedAt = new Date().toISOString();
    localStorage.setItem('pendingInvites', JSON.stringify(invites));

    return invite;
}

function deleteInvite(code) {
    const invites = JSON.parse(localStorage.getItem('pendingInvites') || '{}');
    delete invites[code];
    localStorage.setItem('pendingInvites', JSON.stringify(invites));
}

function getPendingInvites() {
    const invites = JSON.parse(localStorage.getItem('pendingInvites') || '{}');
    return Object.values(invites).filter(invite => !invite.used);
}

// ==========================================
// CLASS MANAGEMENT
// ==========================================

function createClass(schoolId, code, fullName, description, createdBy) {
    const classId = `${schoolId}-${code.toLowerCase().replace(/\s+/g, '-')}`;
    const classes = JSON.parse(localStorage.getItem('classes') || '{}');

    if (classes[classId]) {
        throw new Error('Class already exists');
    }

    classes[classId] = {
        id: classId,
        schoolId: schoolId,
        code: code,
        fullName: fullName,
        description: description,
        teachers: [],
        students: [],
        createdBy: createdBy,
        createdAt: new Date().toISOString(),
        semester: getCurrentSemester()
    };

    localStorage.setItem('classes', JSON.stringify(classes));
    return classes[classId];
}

function getClass(classId) {
    const classes = JSON.parse(localStorage.getItem('classes') || '{}');
    return classes[classId];
}

function getClasses(schoolId = null) {
    const classes = JSON.parse(localStorage.getItem('classes') || '{}');

    if (schoolId) {
        const filtered = {};
        Object.keys(classes).forEach(key => {
            if (classes[key].schoolId === schoolId) {
                filtered[key] = classes[key];
            }
        });
        return filtered;
    }

    return classes;
}

function deleteClass(classId) {
    const classes = JSON.parse(localStorage.getItem('classes') || '{}');
    delete classes[classId];
    localStorage.setItem('classes', JSON.stringify(classes));

    // Remove class from all user roles
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    Object.keys(roles).forEach(email => {
        const userRole = roles[email];
        if (typeof userRole === 'object' && userRole.classes) {
            userRole.classes = userRole.classes.filter(c => c !== classId);
        }
    });
    localStorage.setItem('userRoles', JSON.stringify(roles));
}

function getCurrentSemester() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (month >= 8 && month <= 12) {
        return `Fall ${year}`;
    } else if (month >= 1 && month <= 5) {
        return `Spring ${year}`;
    } else {
        return `Summer ${year}`;
    }
}

// ==========================================
// TEACHER-CLASS ASSIGNMENT
// ==========================================

function addTeacherToClass(email, classId) {
    const classes = JSON.parse(localStorage.getItem('classes') || '{}');
    const classObj = classes[classId];

    if (!classObj) {
        throw new Error('Class not found');
    }

    if (!classObj.teachers) {
        classObj.teachers = [];
    }

    if (classObj.teachers.includes(email)) {
        throw new Error('Teacher already assigned to this class');
    }

    classObj.teachers.push(email);
    localStorage.setItem('classes', JSON.stringify(classes));

    // Update teacher's role to include this class
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    const userRole = roles[email];

    // Ensure user has teacher role
    if (!userRole) {
        // User doesn't exist, create teacher role
        roles[email] = {
            role: 'teacher',
            classes: [classId]
        };
    } else if (typeof userRole === 'string') {
        // Old format, convert to object
        roles[email] = {
            role: userRole === 'admin' || userRole === 'owner' ? userRole : 'teacher',
            classes: [classId]
        };
    } else if (typeof userRole === 'object') {
        // New format, just add class
        if (!userRole.classes) userRole.classes = [];
        if (!userRole.classes.includes(classId)) {
            userRole.classes.push(classId);
        }
        // Ensure they have at least teacher role if they're not admin/owner
        if (userRole.role !== 'admin' && userRole.role !== 'owner') {
            userRole.role = 'teacher';
        }
    }

    localStorage.setItem('userRoles', JSON.stringify(roles));
}

function removeTeacherFromClass(email, classId) {
    const classes = JSON.parse(localStorage.getItem('classes') || '{}');
    const classObj = classes[classId];

    if (classObj) {
        classObj.teachers = classObj.teachers.filter(t => t !== email);
        localStorage.setItem('classes', JSON.stringify(classes));
    }

    // Update teacher's role
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    if (roles[email] && roles[email].classes) {
        roles[email].classes = roles[email].classes.filter(c => c !== classId);
        localStorage.setItem('userRoles', JSON.stringify(roles));
    }
}

function getTeacherClasses(email) {
    const classes = JSON.parse(localStorage.getItem('classes') || '{}');
    const teacherClasses = [];

    console.log('🔍 getTeacherClasses: Looking for', email);
    console.log('🔍 getTeacherClasses: All classes:', classes);

    Object.values(classes).forEach(classObj => {
        console.log('🔍 Checking class:', classObj.code, 'teachers:', classObj.teachers);
        if (classObj.teachers && classObj.teachers.includes(email)) {
            console.log('✅ Found match!', classObj.code);
            teacherClasses.push(classObj);
        }
    });

    console.log('🔍 getTeacherClasses: Returning', teacherClasses.length, 'classes:', teacherClasses);
    return teacherClasses;
}

// ==========================================
// STUDENT ENROLLMENT
// ==========================================

function addStudentToClass(email, classId) {
    const classes = JSON.parse(localStorage.getItem('classes') || '{}');
    const classObj = classes[classId];

    if (!classObj) {
        throw new Error('Class not found');
    }

    if (!classObj.students) {
        classObj.students = [];
    }

    if (classObj.students.includes(email)) {
        throw new Error('Student already enrolled in this class');
    }

    classObj.students.push(email);
    localStorage.setItem('classes', JSON.stringify(classes));

    // Update student's role to include this class
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    const userRole = roles[email];

    if (typeof userRole === 'object') {
        if (!userRole.classes) userRole.classes = [];
        if (!userRole.classes.includes(classId)) {
            userRole.classes.push(classId);
        }
    } else {
        roles[email] = {
            role: 'student',
            classes: [classId]
        };
    }

    localStorage.setItem('userRoles', JSON.stringify(roles));
}

function removeStudentFromClass(email, classId) {
    const classes = JSON.parse(localStorage.getItem('classes') || '{}');
    const classObj = classes[classId];

    if (classObj) {
        classObj.students = classObj.students.filter(s => s !== email);
        localStorage.setItem('classes', JSON.stringify(classes));
    }

    // Update student's role
    const roles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    if (roles[email] && roles[email].classes) {
        roles[email].classes = roles[email].classes.filter(c => c !== classId);
        localStorage.setItem('userRoles', JSON.stringify(roles));
    }
}

function getStudentClasses(email) {
    const classes = JSON.parse(localStorage.getItem('classes') || '{}');
    const studentClasses = [];

    Object.values(classes).forEach(classObj => {
        if (classObj.students && classObj.students.includes(email)) {
            studentClasses.push(classObj);
        }
    });

    return studentClasses;
}



function requireRole(role) {
    const user = requireLogin();
    if (!user) return null;

    if (!checkAccess(role, user.email)) {
        alert(`Access denied. This page is for ${role}s only.`);
        window.location.href = 'index.html';
        return null;
    }

    return user;
}

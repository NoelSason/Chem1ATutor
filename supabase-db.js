// Supabase Database Wrapper
// Provides async functions that mirror the localStorage-based roles.js API

// ==========================================
// SCHOOLS
// ==========================================

async function createSchoolDB(schoolId, name, createdBy) {
    const { data, error } = await supabase
        .from('schools')
        .insert([{
            id: schoolId,
            name: name,
            created_by: createdBy
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

async function getSchoolDB(schoolId) {
    const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

    if (error) return null;
    return data;
}

async function getSchoolsDB() {
    const { data, error } = await supabase
        .from('schools')
        .select('*');

    if (error) throw new Error(error.message);

    // Convert array to object keyed by id
    const schoolsObj = {};
    data.forEach(school => {
        schoolsObj[school.id] = school;
    });
    return schoolsObj;
}

// ==========================================
// CLASSES
// ==========================================

async function createClassDB(classData) {
    const { data, error } = await supabase
        .from('classes')
        .insert([{
            id: classData.id,
            school_id: classData.schoolId,
            code: classData.code,
            full_name: classData.fullName,
            description: classData.description,
            semester: classData.semester,
            created_by: classData.createdBy
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

async function getClassDB(classId) {
    const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

    if (classError) return null;

    // Get teachers
    const { data: teachers } = await supabase
        .from('class_teachers')
        .select('teacher_email')
        .eq('class_id', classId);

    // Get students
    const { data: students } = await supabase
        .from('class_students')
        .select('student_email')
        .eq('class_id', classId);

    return {
        id: classData.id,
        schoolId: classData.school_id,
        code: classData.code,
        fullName: classData.full_name,
        description: classData.description,
        semester: classData.semester,
        createdBy: classData.created_by,
        createdAt: classData.created_at,
        teachers: teachers ? teachers.map(t => t.teacher_email) : [],
        students: students ? students.map(s => s.student_email) : []
    };
}

async function getClassesDB(schoolId = null) {
    let query = supabase.from('classes').select('*');

    if (schoolId) {
        query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    // Get teachers and students for each class
    const classesWithDetails = await Promise.all(data.map(async (classData) => {
        const classObj = await getClassDB(classData.id);
        return classObj;
    }));

    // Convert to object keyed by id
    const classesObj = {};
    classesWithDetails.forEach(classObj => {
        classesObj[classObj.id] = classObj;
    });

    return classesObj;
}

async function deleteClassDB(classId) {
    console.log('🗑️ Attempting to delete class:', classId);

    // Delete class (cascade will handle teachers and students)
    const { data, error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)
        .select();

    if (error) {
        console.error('❌ Error deleting class:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to delete class: ${error.message}`);
    }

    console.log('✅ Class deleted successfully:', classId);
    console.log('Deleted data:', data);
    return data;
}

// ==========================================
// TEACHERS
// ==========================================

async function addTeacherToClassDB(email, classId) {
    // Add to class_teachers junction table
    const { error: junctionError } = await supabase
        .from('class_teachers')
        .insert([{
            class_id: classId,
            teacher_email: email
        }]);

    if (junctionError && !junctionError.message.includes('duplicate')) {
        throw new Error(junctionError.message);
    }

    // Update or create user role
    const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('email', email)
        .single();

    if (existingRole) {
        // Update existing role
        const classes = existingRole.classes || [];
        if (!classes.includes(classId)) {
            classes.push(classId);
        }

        await supabase
            .from('user_roles')
            .update({
                role: existingRole.role === 'admin' || existingRole.role === 'owner' ? existingRole.role : 'teacher',
                classes: classes
            })
            .eq('email', email);
    } else {
        // Create new role
        await supabase
            .from('user_roles')
            .insert([{
                email: email,
                role: 'teacher',
                classes: [classId]
            }]);
    }
}

async function removeTeacherFromClassDB(email, classId) {
    const { error } = await supabase
        .from('class_teachers')
        .delete()
        .eq('class_id', classId)
        .eq('teacher_email', email);

    if (error) throw new Error(error.message);

    // Update user role
    const { data: role } = await supabase
        .from('user_roles')
        .select('*')
        .eq('email', email)
        .single();

    if (role && role.classes) {
        const classes = role.classes.filter(c => c !== classId);
        await supabase
            .from('user_roles')
            .update({ classes: classes })
            .eq('email', email);
    }
}

async function getTeacherClassesDB(email) {
    const { data, error } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_email', email);

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) return [];

    // Get full class details
    const classes = await Promise.all(
        data.map(async (item) => await getClassDB(item.class_id))
    );

    return classes.filter(c => c !== null);
}

// ==========================================
// STUDENTS
// ==========================================

async function addStudentToClassDB(email, classId) {
    // Add to class_students junction table
    const { error: junctionError } = await supabase
        .from('class_students')
        .insert([{
            class_id: classId,
            student_email: email
        }]);

    if (junctionError && !junctionError.message.includes('duplicate')) {
        throw new Error(junctionError.message);
    }

    // Update or create user role
    const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('email', email)
        .single();

    if (existingRole) {
        const classes = existingRole.classes || [];
        if (!classes.includes(classId)) {
            classes.push(classId);
        }

        await supabase
            .from('user_roles')
            .update({
                role: 'student',
                classes: classes
            })
            .eq('email', email);
    } else {
        await supabase
            .from('user_roles')
            .insert([{
                email: email,
                role: 'student',
                classes: [classId]
            }]);
    }
}

async function removeStudentFromClassDB(email, classId) {
    const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', classId)
        .eq('student_email', email);

    if (error) throw new Error(error.message);

    // Update user role
    const { data: role } = await supabase
        .from('user_roles')
        .select('*')
        .eq('email', email)
        .single();

    if (role && role.classes) {
        const classes = role.classes.filter(c => c !== classId);
        await supabase
            .from('user_roles')
            .update({ classes: classes })
            .eq('email', email);
    }
}

async function getStudentClassesDB(email) {
    const { data, error } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_email', email);

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) return [];

    const classes = await Promise.all(
        data.map(async (item) => await getClassDB(item.class_id))
    );

    return classes.filter(c => c !== null);
}

// ==========================================
// USER ROLES
// ==========================================

async function getUserRoleDB(email) {
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !data) return null;
    return data.role;
}

async function addAdminToSchoolDB(email, schoolId) {
    // Update or create user role
    const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('email', email)
        .single();

    if (existingRole) {
        const schools = existingRole.schools || [];
        if (!schools.includes(schoolId)) {
            schools.push(schoolId);
        }

        await supabase
            .from('user_roles')
            .update({
                role: 'admin',
                schools: schools
            })
            .eq('email', email);
    } else {
        await supabase
            .from('user_roles')
            .insert([{
                email: email,
                role: 'admin',
                schools: [schoolId]
            }]);
    }
}

// ==========================================
// APP SETTINGS (Super Admin Only)
// ==========================================

async function getAppSettingsDB() {
    const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'enabled_tabs')
        .single();

    if (error) {
        console.error('Error loading app settings:', error);
        // Return default if not found
        return {
            attendance: true,
            practice: true,
            lms: true,
            dev: true,
            owner: true,
            profile: true
        };
    }

    return data.setting_value;
}

async function updateAppSettingsDB(settings, userEmail) {
    const { data, error } = await supabase
        .from('app_settings')
        .update({
            setting_value: settings,
            updated_at: new Date().toISOString(),
            updated_by: userEmail
        })
        .eq('setting_key', 'enabled_tabs')
        .select();

    if (error) throw new Error(error.message);
    return data;
}

// ==========================================
// QUIZ ATTEMPTS
// ==========================================

async function saveQuizAttemptDB(quizData) {
    const { data, error } = await supabase
        .from('quiz_attempts')
        .insert([{
            user_email: quizData.userEmail,
            topic: quizData.topic,
            score: quizData.score,
            total: quizData.total,
            date: quizData.date,
            questions: quizData.questions,
            answers: quizData.answers
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

async function getQuizAttemptsDB(userEmail) {
    const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_email', userEmail)
        .order('date', { ascending: false });

    if (error) throw new Error(error.message);

    // Transform to match localStorage format
    return data.map(attempt => ({
        id: attempt.id,
        topic: attempt.topic,
        score: attempt.score,
        total: attempt.total,
        date: attempt.date,
        questions: attempt.questions,
        answers: attempt.answers
    }));
}

console.log('✅ Supabase database wrapper loaded');

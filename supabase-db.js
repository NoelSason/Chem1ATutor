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

// ==========================================
// USER PROGRESS & MASTERY LEVELS
// ==========================================

async function getUserProgressDB(userEmail) {
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_email', userEmail);

    if (error) throw new Error(error.message);
    return data || [];
}

async function updateUserProgressDB(userEmail, topic, correct, total) {
    // Get existing progress
    const { data: existing } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_email', userEmail)
        .eq('topic', topic)
        .single();

    const totalAttempts = (existing?.total_attempts || 0) + total;
    const correctAnswers = (existing?.correct_answers || 0) + correct;
    const accuracy = (correctAnswers / totalAttempts) * 100;

    // Calculate mastery level (0-100)
    const masteryLevel = Math.min(100, Math.round(accuracy));

    const { data, error } = await supabase
        .from('user_progress')
        .upsert({
            user_email: userEmail,
            topic: topic,
            mastery_level: masteryLevel,
            total_attempts: totalAttempts,
            correct_answers: correctAnswers,
            last_practiced: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_email,topic' })
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

// ==========================================
// SPACED REPETITION
// ==========================================

async function scheduleReviewDB(userEmail, questionId, questionData, performance) {
    // SM-2 Algorithm
    const { data: existing } = await supabase
        .from('spaced_repetition')
        .select('*')
        .eq('user_email', userEmail)
        .eq('question_id', questionId)
        .single();

    let interval = 1;
    let easeFactor = 2.5;
    let repetitions = 0;

    if (existing) {
        repetitions = existing.repetitions;
        easeFactor = existing.ease_factor;

        if (performance >= 3) { // Correct
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(existing.interval_days * easeFactor);
            }
            repetitions++;
            easeFactor = easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));
        } else { // Incorrect
            repetitions = 0;
            interval = 1;
        }
    }

    easeFactor = Math.max(1.3, easeFactor);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    const { data, error } = await supabase
        .from('spaced_repetition')
        .upsert({
            user_email: userEmail,
            question_id: questionId,
            question_data: questionData,
            next_review_date: nextReviewDate.toISOString(),
            interval_days: interval,
            ease_factor: easeFactor,
            repetitions: repetitions,
            last_reviewed: new Date().toISOString()
        }, { onConflict: 'user_email,question_id' })
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

async function getDueReviewsDB(userEmail) {
    const { data, error } = await supabase
        .from('spaced_repetition')
        .select('*')
        .eq('user_email', userEmail)
        .lte('next_review_date', new Date().toISOString())
        .order('next_review_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

// ==========================================
// MISTAKE JOURNAL
// ==========================================

async function saveMistakeDB(userEmail, question, userAnswer, correctAnswer, topic) {
    const { data, error } = await supabase
        .from('mistake_journal')
        .insert([{
            user_email: userEmail,
            question: question,
            user_answer: userAnswer,
            correct_answer: correctAnswer,
            topic: topic
        }])
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

async function getMistakesDB(userEmail, filters = {}) {
    let query = supabase
        .from('mistake_journal')
        .select('*')
        .eq('user_email', userEmail);

    if (filters.topic) {
        query = query.eq('topic', filters.topic);
    }
    if (filters.reviewed !== undefined) {
        query = query.eq('reviewed', filters.reviewed);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
}

async function updateMistakeNotesDB(mistakeId, notes) {
    const { data, error } = await supabase
        .from('mistake_journal')
        .update({ notes: notes })
        .eq('id', mistakeId)
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

async function markMistakeReviewedDB(mistakeId) {
    const { data, error } = await supabase
        .from('mistake_journal')
        .update({ reviewed: true })
        .eq('id', mistakeId)
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

// ==========================================
// DAILY CHALLENGES
// ==========================================

async function getTodaysChallengeDB() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', today)
        .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
}

async function completeChallengeDB(userEmail, challengeId, score, total, timeTaken, pointsEarned) {
    const { data, error } = await supabase
        .from('user_challenge_completions')
        .insert([{
            user_email: userEmail,
            challenge_id: challengeId,
            score: score,
            total: total,
            time_taken_seconds: timeTaken,
            points_earned: pointsEarned
        }])
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

async function getUserChallengeCompletionsDB(userEmail) {
    const { data, error } = await supabase
        .from('user_challenge_completions')
        .select('*')
        .eq('user_email', userEmail)
        .order('completed_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

// ==========================================
// STREAKS
// ==========================================

async function getUserStreakDB(userEmail) {
    const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_email', userEmail)
        .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
}

async function updateStreakDB(userEmail) {
    const today = new Date().toISOString().split('T')[0];
    const streak = await getUserStreakDB(userEmail);

    if (!streak) {
        // Create new streak
        const { data, error } = await supabase
            .from('user_streaks')
            .insert([{
                user_email: userEmail,
                current_streak: 1,
                longest_streak: 1,
                last_practice_date: today,
                total_practice_days: 1
            }])
            .select();

        if (error) throw new Error(error.message);
        return data[0];
    }

    const lastDate = new Date(streak.last_practice_date);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    let newStreak = streak.current_streak;
    if (daysDiff === 0) {
        // Already practiced today
        return streak;
    } else if (daysDiff === 1) {
        // Consecutive day
        newStreak++;
    } else {
        // Streak broken
        newStreak = 1;
    }

    const { data, error } = await supabase
        .from('user_streaks')
        .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak.longest_streak),
            last_practice_date: today,
            total_practice_days: streak.total_practice_days + 1,
            updated_at: new Date().toISOString()
        })
        .eq('user_email', userEmail)
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

async function awardAchievementDB(userEmail, achievementType, achievementName, achievementData = {}) {
    const { data, error } = await supabase
        .from('user_achievements')
        .insert([{
            user_email: userEmail,
            achievement_type: achievementType,
            achievement_name: achievementName,
            achievement_data: achievementData
        }])
        .select();

    if (error && error.code !== '23505') throw new Error(error.message); // Ignore duplicate
    return data ? data[0] : null;
}

async function getUserAchievementsDB(userEmail) {
    const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_email', userEmail)
        .order('earned_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

// ==========================================
// LEADERBOARD
// ==========================================

async function updateLeaderboardDB(userEmail, userName, pointsToAdd, school = null) {
    const { data: existing } = await supabase
        .from('leaderboard_scores')
        .select('*')
        .eq('user_email', userEmail)
        .single();

    const { data, error } = await supabase
        .from('leaderboard_scores')
        .upsert({
            user_email: userEmail,
            user_name: userName,
            school: school,
            total_points: (existing?.total_points || 0) + pointsToAdd,
            weekly_points: (existing?.weekly_points || 0) + pointsToAdd,
            monthly_points: (existing?.monthly_points || 0) + pointsToAdd,
            quiz_count: (existing?.quiz_count || 0) + 1,
            last_updated: new Date().toISOString()
        }, { onConflict: 'user_email' })
        .select();

    if (error) throw new Error(error.message);
    return data[0];
}

async function getLeaderboardDB(type = 'total', limit = 100) {
    let orderColumn = 'total_points';
    if (type === 'weekly') orderColumn = 'weekly_points';
    if (type === 'monthly') orderColumn = 'monthly_points';

    const { data, error } = await supabase
        .from('leaderboard_scores')
        .select('*')
        .order(orderColumn, { ascending: false })
        .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
}

async function getUserRankDB(userEmail, type = 'total') {
    let orderColumn = 'total_points';
    if (type === 'weekly') orderColumn = 'weekly_points';
    if (type === 'monthly') orderColumn = 'monthly_points';

    const { data: user } = await supabase
        .from('leaderboard_scores')
        .select('*')
        .eq('user_email', userEmail)
        .single();

    if (!user) return null;

    const userPoints = user[orderColumn];

    const { count, error } = await supabase
        .from('leaderboard_scores')
        .select('*', { count: 'exact', head: true })
        .gt(orderColumn, userPoints);

    if (error) throw new Error(error.message);
    return (count || 0) + 1;
}

console.log('✅ Supabase database wrapper loaded');

// Migration Utility - Move localStorage data to Supabase
// Run this once to migrate your existing data

async function migrateToSupabase() {
    console.log('🚀 Starting migration to Supabase...');

    try {
        // 1. Migrate Schools
        console.log('📚 Migrating schools...');
        const schools = JSON.parse(localStorage.getItem('schools') || '{}');

        for (const [schoolId, school] of Object.entries(schools)) {
            try {
                await createSchoolDB(schoolId, school.name, school.createdBy || 'migration');
                console.log(`✅ Migrated school: ${school.name}`);
            } catch (error) {
                console.log(`⚠️ School ${schoolId} might already exist:`, error.message);
            }
        }

        // 2. Migrate User Roles
        console.log('👥 Migrating user roles...');
        const userRoles = JSON.parse(localStorage.getItem('userRoles') || '{}');

        for (const [email, roleData] of Object.entries(userRoles)) {
            try {
                const role = typeof roleData === 'string' ? roleData : roleData.role;
                const schools = typeof roleData === 'object' ? roleData.schools || [] : [];
                const classes = typeof roleData === 'object' ? roleData.classes || [] : [];

                const { error } = await supabase
                    .from('user_roles')
                    .insert([{
                        email: email,
                        role: role,
                        schools: schools,
                        classes: classes
                    }]);

                if (error && !error.message.includes('duplicate')) {
                    throw error;
                }

                console.log(`✅ Migrated role for: ${email} (${role})`);
            } catch (error) {
                console.log(`⚠️ Role for ${email} might already exist:`, error.message);
            }
        }

        // 3. Migrate Classes
        console.log('🎓 Migrating classes...');
        const classes = JSON.parse(localStorage.getItem('classes') || '{}');

        for (const [classId, classData] of Object.entries(classes)) {
            try {
                // Create class
                await createClassDB({
                    id: classId,
                    schoolId: classData.schoolId,
                    code: classData.code,
                    fullName: classData.fullName,
                    description: classData.description,
                    semester: classData.semester,
                    createdBy: classData.createdBy
                });
                console.log(`✅ Migrated class: ${classData.code}`);

                // Migrate teachers
                if (classData.teachers && classData.teachers.length > 0) {
                    for (const teacherEmail of classData.teachers) {
                        try {
                            await addTeacherToClassDB(teacherEmail, classId);
                            console.log(`  ✅ Added teacher: ${teacherEmail}`);
                        } catch (error) {
                            console.log(`  ⚠️ Teacher ${teacherEmail} might already be added`);
                        }
                    }
                }

                // Migrate students
                if (classData.students && classData.students.length > 0) {
                    for (const studentEmail of classData.students) {
                        try {
                            await addStudentToClassDB(studentEmail, classId);
                            console.log(`  ✅ Added student: ${studentEmail}`);
                        } catch (error) {
                            console.log(`  ⚠️ Student ${studentEmail} might already be added`);
                        }
                    }
                }

            } catch (error) {
                console.log(`⚠️ Class ${classId} might already exist:`, error.message);
            }
        }

        console.log('');
        console.log('🎉 Migration complete!');
        console.log('');
        console.log('✅ Next steps:');
        console.log('1. Refresh the page');
        console.log('2. Check that your data appears correctly');
        console.log('3. Test creating new classes/users');
        console.log('4. Once confirmed, you can clear localStorage');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Run migration automatically when this script loads
console.log('');
console.log('='.repeat(60));
console.log('📦 SUPABASE MIGRATION UTILITY');
console.log('='.repeat(60));
console.log('');
console.log('To migrate your localStorage data to Supabase, run:');
console.log('  migrateToSupabase()');
console.log('');
console.log('Or wait 3 seconds for automatic migration...');
console.log('');

// Auto-run migration after 3 seconds
setTimeout(() => {
    const shouldMigrate = confirm('Ready to migrate your localStorage data to Supabase?\n\nThis will copy:\n- Schools\n- Classes\n- User roles\n- Teachers\n- Students\n\nClick OK to proceed.');

    if (shouldMigrate) {
        migrateToSupabase();
    } else {
        console.log('⏸️ Migration cancelled. Run migrateToSupabase() when ready.');
    }
}, 3000);

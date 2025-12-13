-- Advanced Learning Features Database Migration
-- Run this in Supabase SQL Editor

-- 1. User Progress Table (for mastery levels)
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    topic TEXT NOT NULL,
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
    total_attempts INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    last_practiced TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, topic)
);

-- 2. Spaced Repetition Table
CREATE TABLE IF NOT EXISTS spaced_repetition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_data JSONB NOT NULL,
    next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
    interval_days INTEGER DEFAULT 1,
    ease_factor DECIMAL DEFAULT 2.5,
    repetitions INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, question_id)
);

-- 3. Mistake Journal Table
CREATE TABLE IF NOT EXISTS mistake_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    question JSONB NOT NULL,
    user_answer TEXT,
    correct_answer TEXT,
    topic TEXT,
    notes TEXT,
    reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Daily Challenges Table
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_date DATE NOT NULL UNIQUE,
    challenge_type TEXT NOT NULL, -- 'qotd', 'speed', 'perfect', 'topic'
    question_ids TEXT[] NOT NULL,
    topic TEXT,
    time_limit_seconds INTEGER,
    bonus_points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Challenge Completions
CREATE TABLE IF NOT EXISTS user_challenge_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    challenge_id UUID REFERENCES daily_challenges(id),
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    time_taken_seconds INTEGER,
    points_earned INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, challenge_id)
);

-- 6. User Streaks Table
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date DATE,
    streak_freeze_count INTEGER DEFAULT 0,
    total_practice_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    achievement_type TEXT NOT NULL, -- 'streak', 'mastery', 'challenge', 'score'
    achievement_name TEXT NOT NULL,
    achievement_data JSONB,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, achievement_name)
);

-- 8. Leaderboard Scores Table
CREATE TABLE IF NOT EXISTS leaderboard_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL UNIQUE,
    user_name TEXT NOT NULL,
    school TEXT,
    total_points INTEGER DEFAULT 0,
    weekly_points INTEGER DEFAULT 0,
    monthly_points INTEGER DEFAULT 0,
    quiz_count INTEGER DEFAULT 0,
    perfect_scores INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_email ON user_progress(user_email);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_email_date ON spaced_repetition(user_email, next_review_date);
CREATE INDEX IF NOT EXISTS idx_mistake_journal_email ON mistake_journal(user_email);
CREATE INDEX IF NOT EXISTS idx_mistake_journal_topic ON mistake_journal(topic);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_user_streaks_email ON user_streaks(user_email);
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_points ON leaderboard_scores(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_points ON leaderboard_scores(weekly_points DESC);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistake_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_progress
CREATE POLICY "Users can read own progress"
ON user_progress FOR SELECT
TO authenticated
USING (auth.email() = user_email);

CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
TO authenticated
WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
TO authenticated
USING (auth.email() = user_email)
WITH CHECK (auth.email() = user_email);

-- RLS Policies for spaced_repetition
CREATE POLICY "Users can read own spaced repetition"
ON spaced_repetition FOR SELECT
TO authenticated
USING (auth.email() = user_email);

CREATE POLICY "Users can insert own spaced repetition"
ON spaced_repetition FOR INSERT
TO authenticated
WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own spaced repetition"
ON spaced_repetition FOR UPDATE
TO authenticated
USING (auth.email() = user_email)
WITH CHECK (auth.email() = user_email);

-- RLS Policies for mistake_journal
CREATE POLICY "Users can read own mistakes"
ON mistake_journal FOR SELECT
TO authenticated
USING (auth.email() = user_email);

CREATE POLICY "Users can insert own mistakes"
ON mistake_journal FOR INSERT
TO authenticated
WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own mistakes"
ON mistake_journal FOR UPDATE
TO authenticated
USING (auth.email() = user_email)
WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can delete own mistakes"
ON mistake_journal FOR DELETE
TO authenticated
USING (auth.email() = user_email);

-- RLS Policies for daily_challenges (public read)
CREATE POLICY "Anyone can read daily challenges"
ON daily_challenges FOR SELECT
USING (true);

-- RLS Policies for user_challenge_completions
CREATE POLICY "Users can read own completions"
ON user_challenge_completions FOR SELECT
TO authenticated
USING (auth.email() = user_email);

CREATE POLICY "Users can insert own completions"
ON user_challenge_completions FOR INSERT
TO authenticated
WITH CHECK (auth.email() = user_email);

-- RLS Policies for user_streaks
CREATE POLICY "Users can read own streaks"
ON user_streaks FOR SELECT
TO authenticated
USING (auth.email() = user_email);

CREATE POLICY "Users can insert own streaks"
ON user_streaks FOR INSERT
TO authenticated
WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own streaks"
ON user_streaks FOR UPDATE
TO authenticated
USING (auth.email() = user_email)
WITH CHECK (auth.email() = user_email);

-- RLS Policies for user_achievements
CREATE POLICY "Users can read own achievements"
ON user_achievements FOR SELECT
TO authenticated
USING (auth.email() = user_email);

CREATE POLICY "Users can insert own achievements"
ON user_achievements FOR INSERT
TO authenticated
WITH CHECK (auth.email() = user_email);

-- RLS Policies for leaderboard_scores (public read)
CREATE POLICY "Anyone can read leaderboard"
ON leaderboard_scores FOR SELECT
USING (true);

CREATE POLICY "Users can update own leaderboard score"
ON leaderboard_scores FOR UPDATE
TO authenticated
USING (auth.email() = user_email)
WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can insert own leaderboard score"
ON leaderboard_scores FOR INSERT
TO authenticated
WITH CHECK (auth.email() = user_email);

-- Function to update leaderboard weekly/monthly points reset
CREATE OR REPLACE FUNCTION reset_weekly_points()
RETURNS void AS $$
BEGIN
    UPDATE leaderboard_scores SET weekly_points = 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_monthly_points()
RETURNS void AS $$
BEGIN
    UPDATE leaderboard_scores SET monthly_points = 0;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Advanced Learning Features database schema created successfully!';
END $$;

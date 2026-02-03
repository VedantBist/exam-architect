-- Create role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create exam status enum for lifecycle management
CREATE TYPE public.exam_status AS ENUM ('created', 'scheduled', 'active', 'closed');

-- Create question type enum
CREATE TYPE public.question_type AS ENUM ('mcq', 'true_false', 'integer');

-- Create attempt status enum for state machine
CREATE TYPE public.attempt_status AS ENUM ('in_progress', 'submitted', 'auto_submitted');

-- Create profiles table for additional user info
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create exams table
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status exam_status NOT NULL DEFAULT 'created',
    passing_percentage INTEGER NOT NULL DEFAULT 40 CHECK (passing_percentage >= 0 AND passing_percentage <= 100),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'mcq',
    marks INTEGER NOT NULL DEFAULT 1 CHECK (marks > 0),
    order_index INTEGER NOT NULL DEFAULT 0,
    correct_answer TEXT, -- For integer type questions
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create options table (for MCQ and true/false questions)
CREATE TABLE public.options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0
);

-- Create exam_attempts table
CREATE TABLE public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id),
    student_id UUID NOT NULL REFERENCES auth.users(id),
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ,
    server_deadline TIMESTAMPTZ NOT NULL, -- Server-tracked deadline for security
    status attempt_status NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(exam_id, student_id) -- One attempt per student per exam
);

-- Create answers table for incremental saving
CREATE TABLE public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id),
    selected_option_id UUID REFERENCES public.options(id),
    numeric_answer TEXT, -- For integer type questions
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(attempt_id, question_id) -- One answer per question per attempt
);

-- Create results table (immutable)
CREATE TABLE public.results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL UNIQUE REFERENCES public.exam_attempts(id),
    total_marks INTEGER NOT NULL,
    obtained_marks INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_exams_status ON public.exams(status);
CREATE INDEX idx_exams_created_by ON public.exams(created_by);
CREATE INDEX idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX idx_options_question_id ON public.options(question_id);
CREATE INDEX idx_exam_attempts_student_id ON public.exam_attempts(student_id);
CREATE INDEX idx_exam_attempts_exam_id ON public.exam_attempts(exam_id);
CREATE INDEX idx_answers_attempt_id ON public.answers(attempt_id);
CREATE INDEX idx_results_attempt_id ON public.results(attempt_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles on signup"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Exams policies
CREATE POLICY "Admins can do everything with exams"
    ON public.exams FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view active/scheduled exams"
    ON public.exams FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'student') 
        AND status IN ('scheduled', 'active', 'closed')
    );

-- Questions policies
CREATE POLICY "Admins can manage questions"
    ON public.questions FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view questions of active exams"
    ON public.questions FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'student')
        AND EXISTS (
            SELECT 1 FROM public.exams e 
            WHERE e.id = exam_id 
            AND e.status = 'active'
        )
    );

-- Options policies
CREATE POLICY "Admins can manage options"
    ON public.options FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view options of active exam questions"
    ON public.options FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'student')
        AND EXISTS (
            SELECT 1 FROM public.questions q 
            JOIN public.exams e ON e.id = q.exam_id
            WHERE q.id = question_id 
            AND e.status = 'active'
        )
    );

-- Exam attempts policies
CREATE POLICY "Students can view own attempts"
    ON public.exam_attempts FOR SELECT
    TO authenticated
    USING (auth.uid() = student_id);

CREATE POLICY "Students can create own attempts"
    ON public.exam_attempts FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = student_id
        AND public.has_role(auth.uid(), 'student')
    );

CREATE POLICY "Students can update own in_progress attempts"
    ON public.exam_attempts FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = student_id 
        AND status = 'in_progress'
    );

CREATE POLICY "Admins can view all attempts"
    ON public.exam_attempts FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Answers policies
CREATE POLICY "Students can manage own answers"
    ON public.answers FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            WHERE ea.id = attempt_id
            AND ea.student_id = auth.uid()
            AND ea.status = 'in_progress'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            WHERE ea.id = attempt_id
            AND ea.student_id = auth.uid()
            AND ea.status = 'in_progress'
        )
    );

CREATE POLICY "Students can view own submitted answers"
    ON public.answers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            WHERE ea.id = attempt_id
            AND ea.student_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all answers"
    ON public.answers FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Results policies
CREATE POLICY "Students can view own results"
    ON public.results FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            WHERE ea.id = attempt_id
            AND ea.student_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all results"
    ON public.results FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert results"
    ON public.results FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            WHERE ea.id = attempt_id
            AND ea.student_id = auth.uid()
        )
    );
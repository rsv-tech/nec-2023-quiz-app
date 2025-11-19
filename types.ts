export type Language = 'en' | 'ru';

export interface User {
  userId: string;
  email: string;
  trialStartDate: string | null;
  dailyQuestionsAnswered: number;
  lastQuestionDate: string | null;
}

export interface Exam {
  id: string;
  title: string;
  description_en: string;
  num_questions: number;
}

export interface Choice {
  id: string;
  text_en: string;
  text_ru: string;
  is_correct: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'difficult';

export interface Question {
  id: string;
  exam_id: string;
  topic: string;
  question_en: string;
  question_ru: string;
  image_url?: string;
  choices: Choice[];
  difficulty: Difficulty;
  explanation_en: string;
  explanation_ru: string;
}

export interface TestResult {
  correct: number;
  total: number;
  examTitle: string;
  questions: Question[];
  userAnswers: (Choice | null)[];
  language?: Language; // Added for bilingual support
}

export interface ProgressData {
  correct: number;
  total: number;
}

export interface Progress {
  [examId: string]: ProgressData;
}

export interface TestState {
  questions?: Question[];
  currentIndex: number;
  userAnswers: (Choice | null)[];
  timeLeft: number;
  language?: Language; // Added for language persistence
}

export interface Attempt {
    attempt_id: string;
    submitted_at: string;
    score_pct: number;
    passed: boolean;
}

export interface GlossaryItem {
  id?: string;
  term: string;
  definition_en: string;
  definition_ru: string;
  isUserDefined?: boolean;
}
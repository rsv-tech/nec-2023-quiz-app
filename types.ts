export type Language = 'en' | 'ru';

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
}

export interface ProgressData {
  correct: number;
  total: number;
}

export interface Progress {
  [examId: string]: ProgressData;
}

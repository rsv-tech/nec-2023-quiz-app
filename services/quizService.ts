// services/quizService.ts
import { type Exam, type Question } from '../types';
import { fetchExams, fetchQuestions } from './sheetsService';
import { getGlossaryTerms } from './glossaryService';

// Кэш для хранения загруженных данных
let cachedExams: Exam[] | null = null;
const cachedQuestions = new Map<string, Question[]>();

/**
 * Перемешивает массив
 */
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Получает список всех экзаменов из Google Sheets
 */
export const getExams = async (): Promise<Exam[]> => {
  try {
    // Используем кэш если данные уже загружены
    if (cachedExams) {
      console.log('📦 Using cached exams');
      return cachedExams;
    }

    console.log('🔄 Loading exams from Google Sheets...');
    const exams = await fetchExams();
    
    // Сохраняем в кэш
    cachedExams = exams;
    
    return exams;
  } catch (error) {
    console.error('❌ Failed to load exams:', error);
    
    // Возвращаем пустой массив в случае ошибки
    // В реальном приложении можно показать уведомление пользователю
    return [];
  }
};

/**
 * Получает вопросы для конкретного экзамена
 * @param examId - ID экзамена (формат: "nec2023_0", "nec2023_1", etc.)
 * @param limit - максимальное количество вопросов
 */
export const getQuestions = async (examId: string, limit: number): Promise<Question[]> => {
  try {
    // Получаем название темы из экзамена
    const exams = await getExams();
    const exam = exams.find(e => e.id === examId);
    
    if (!exam) {
      console.error(`❌ Exam with id "${examId}" not found`);
      return [];
    }

    const examTitle = exam.title;

    // Проверяем кэш
    const cacheKey = examTitle;
    if (cachedQuestions.has(cacheKey)) {
      console.log(`📦 Using cached questions for "${examTitle}"`);
      const cached = cachedQuestions.get(cacheKey)!;
      const shuffled = shuffleArray(cached);
      return shuffled.slice(0, limit);
    }

    // Загружаем вопросы из Google Sheets
    console.log(`🔄 Loading questions for "${examTitle}" from Google Sheets...`);
    const questions = await fetchQuestions(examTitle);

    if (questions.length === 0) {
      console.warn(`⚠️ No questions found for topic "${examTitle}"`);
      return [];
    }

    // Сохраняем в кэш
    cachedQuestions.set(cacheKey, questions);

    // Перемешиваем и возвращаем нужное количество
    const shuffled = shuffleArray(questions);
    const result = shuffled.slice(0, Math.min(limit, questions.length));

    console.log(`✅ Returning ${result.length} questions for "${examTitle}"`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to load questions for exam "${examId}":`, error);
    return [];
  }
};

/**
 * Очищает кэш (полезно для разработки)
 */
export const clearCache = (): void => {
  cachedExams = null;
  cachedQuestions.clear();
  console.log('🗑️ Cache cleared');
};

/**
 * Generates a full exam by pulling questions from all available topics.
 * @param limit - Total number of questions for the exam (default 100)
 */
export const generateFullExam = async (limit: number = 100): Promise<{ exam: Exam, questions: Question[] }> => {
  try {
    // 1. Get all exams (topics)
    const exams = await getExams();
    if (exams.length === 0) throw new Error('No exams available');

    // 2. Fetch questions from ALL topics
    // To avoid hitting rate limits or slow loading, we might want to be careful here.
    // For now, we'll fetch them in parallel but with a concurrency limit if needed.
    // Since we have ~10 topics, parallel fetch should be okay.
    
    console.log('🔄 Generating full exam: Fetching questions from all topics...');
    
    const allQuestionsPromises = exams.map(exam => getQuestions(exam.id, 50)); // Fetch up to 50 from each to get a good pool
    const results = await Promise.all(allQuestionsPromises);
    
    const allQuestions = results.flat();
    
    if (allQuestions.length === 0) throw new Error('No questions available across all topics');

    // 3. Shuffle and pick 'limit' questions
    const shuffled = shuffleArray(allQuestions);
    const selectedQuestions = shuffled.slice(0, limit);

    // 4. Create a synthetic Exam object
    const fullExam: Exam = {
      id: 'full_exam_simulation',
      title: 'NEC 2023 Full Exam Simulation',
      description_en: '4-hour comprehensive exam simulation covering all topics.',
      num_questions: selectedQuestions.length,
    };

    return { exam: fullExam, questions: selectedQuestions };

  } catch (error) {
    console.error('❌ Failed to generate full exam:', error);
    throw error;
  }
};

/**
 * Generates a quiz based on glossary terms.
 * Creates multiple-choice questions where the question is "What is the definition of [Term]?"
 * and choices are definitions of other terms.
 */
export const generateGlossaryQuiz = async (limit: number = 10): Promise<{ exam: Exam, questions: Question[] }> => {
  const glossaryTerms = await getGlossaryTerms();

  const questions: Question[] = [];
  const shuffledTerms = shuffleArray(glossaryTerms);
  const selectedTerms = shuffledTerms.slice(0, limit);

  selectedTerms.forEach((item, index) => {
    // Create distractors (wrong answers)
    const otherTerms = glossaryTerms.filter(t => t.term !== item.term);
    const distractors = shuffleArray(otherTerms).slice(0, 3);

    const choices = [
      { id: 'a', text_en: item.definition_en, text_ru: item.definition_ru, is_correct: true },
      { id: 'b', text_en: distractors[0].definition_en, text_ru: distractors[0].definition_ru, is_correct: false },
      { id: 'c', text_en: distractors[1].definition_en, text_ru: distractors[1].definition_ru, is_correct: false },
      { id: 'd', text_en: distractors[2].definition_en, text_ru: distractors[2].definition_ru, is_correct: false },
    ];

    questions.push({
      id: `glossary_q_${index}`,
      exam_id: 'glossary_quiz',
      topic: 'Glossary',
      question_en: `What is the definition of "${item.term}"?`,
      question_ru: `Каково определение термина "${item.term}"?`,
      choices: shuffleArray(choices),
      difficulty: 'medium',
      explanation_en: `Correct definition for ${item.term}: ${item.definition_en}`,
      explanation_ru: `Правильное определение для ${item.term}: ${item.definition_ru}`,
    });
  });

  const glossaryExam: Exam = {
    id: 'glossary_quiz',
    title: 'Glossary Practice Quiz',
    description_en: 'Test your knowledge of NEC terminology.',
    num_questions: questions.length,
  };

  return { exam: glossaryExam, questions };
};
// services/quizService.ts
import { type Exam, type Question } from '../types';
import { fetchExams, fetchQuestions } from './sheetsService';

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
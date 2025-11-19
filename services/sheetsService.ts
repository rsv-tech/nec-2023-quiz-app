// src/services/sheetsService.ts — ОБНОВЛЕНО под новый Code.gs
import { type Exam, type Question, type User, type TestResult, type Attempt, type GlossaryItem } from '../types';
import { APPS_SCRIPT_URL, VITE_EXAM_ID } from '../constants';

const fetchData = async (params: URLSearchParams) => {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const json = await response.json();
        
        // Новая структура: { success: true, data: ... } или { success: false, error: ... }
        if (!json.success) {
            throw new Error(json.error || 'Unknown error from server');
        }
        
        return json.data;
    } catch (error) {
        console.error("Failed to fetch from Google Sheets:", error);
        throw error;
    }
};

export const fetchExams = async (): Promise<Exam[]> => {
    const params = new URLSearchParams({
        action: 'getExams',
        exam_id: VITE_EXAM_ID
    });
    return fetchData(params);
};

export const fetchQuestions = async (topic: string | undefined, limit: number = 10): Promise<Question[]> => {
    // Защита от undefined
    if (!topic) {
        console.error('Topic is undefined');
        return [];
    }

    const params = new URLSearchParams({
        action: 'getQuestions',
        exam_id: VITE_EXAM_ID,
        topic: topic,
        limit: limit.toString()
    });
    
    const questions = await fetchData(params);
    return questions || [];
};

export const loginUser = async (email: string): Promise<{ user: User, isNewUser: boolean }> => {
    const params = new URLSearchParams({ action: 'loginUser', email });
    return fetchData(params);
};

export const recordTestCompletion = async (userId: string, questionsAnswered: number): Promise<{ dailyQuestionsAnswered: number }> => {
    const params = new URLSearchParams({
        action: 'recordTestCompletion',
        userId,
        count: questionsAnswered.toString()
    });
    return fetchData(params);
};

export const saveTestResult = async (userId: string, examId: string, result: TestResult): Promise<void> => {
    const percentage = result.total > 0 ? (result.correct / result.total) * 100 : 0;
    const payload = {
        userId, 
        examId,
        scorePct: Math.round(percentage),
        passed: percentage >= 70,
        responses: result.questions.map((q, i) => ({
            q_id: q.id,
            selected_choice_id: result.userAnswers[i]?.id || null,
            is_correct: result.userAnswers[i]?.is_correct || false,
        })),
    };
    const params = new URLSearchParams({
        action: 'saveTestResult',
        payload: JSON.stringify(payload)
    });
    await fetchData(params);
};

export const getAttemptHistory = async (userId: string, examTitle: string): Promise<Attempt[]> => {
    const params = new URLSearchParams({
        action: 'getAttemptHistory',
        userId,
        examTitle,
    });
    return fetchData(params);
};



export const fetchGlossary = async (): Promise<GlossaryItem[]> => {
    const params = new URLSearchParams({
        action: 'getGlossary'
    });
    return fetchData(params);
};

export const addGlossaryTermApi = async (term: string): Promise<any> => {
    const params = new URLSearchParams({
        action: 'addGlossaryTerm',
        term: term
    });
    return fetchData(params);
};
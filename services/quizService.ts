import { type Exam, type Question, type Choice, type Difficulty } from '../types';
import { VITE_EXAM_ID } from '../constants';

const newTopics = [
  "Code Structure and Scope",
  "Definitions",
  "General Requirements and Working Space",
  "Conductor Ampacity and Corrections",
  "Wiring Methods – General",
  "Raceways",
  "Cable Types",
  "Boxes, Conduit Bodies and Fittings",
  "Flexible Cords and Cables",
  "Branch Circuits",
  "Feeders",
  "Services and Service Equipment",
  "Overcurrent Protection",
  "Grounding and Bonding",
  "Load Calculations – Dwelling",
  "Load Calculations – Non-Dwelling",
  "Receptacles, Cord-Connectors and GFCI/AFCI",
  "Luminaires and Lighting",
  "Appliances and Fastened-in-Place Equipment",
  "Motors, Motor Circuits and Controllers",
  "HVAC and Refrigeration Equipment",
  "Transformers",
  "Generators and Emergency Power",
  "Fire Pumps",
  "Elevators, Escalators and Lifts",
  "Signs and Outline Lighting",
  "Electric Vehicle Charging",
  "Energy Storage Systems",
  "Photovoltaic Systems",
  "Fuel Cell Systems",
  "Hazardous Locations",
  "Health Care Facilities",
  "Swimming Pools, Spas and Fountains",
  "Marinas and Boatyards",
  "Temporary Installations",
  "Class 1, 2, 3 Remote-Control, Signaling, Power-Limited",
  "Fire Alarm Systems",
  "Optical Fiber Cables",
  "Communications Circuits",
  "Surge Protection",
  "Short-Circuit and Interrupting Ratings",
  "Selective Coordination",
  "Emergency Disconnects",
  "Box Fill, Conduit Fill, Bending, Chapter 9 Tables",
  "Marking, Labeling and Identification",
  "Voltage Drop"
];

const topicQuestionCounts: { [key: string]: number } = {
  "Code Structure and Scope": 14,
  "Definitions": 16,
  "General Requirements and Working Space": 18,
  "Conductor Ampacity and Corrections": 20,
  "Wiring Methods – General": 22,
  "Raceways": 12,
  "Cable Types": 14,
  "Boxes, Conduit Bodies and Fittings": 16,
  "Flexible Cords and Cables": 18,
  "Branch Circuits": 20,
  "Feeders": 22,
  "Services and Service Equipment": 12,
  "Overcurrent Protection": 14,
  "Grounding and Bonding": 16,
  "Load Calculations – Dwelling": 18,
  "Load Calculations – Non-Dwelling": 20,
  "Receptacles, Cord-Connectors and GFCI/AFCI": 22,
  "Luminaires and Lighting": 12,
  "Appliances and Fastened-in-Place Equipment": 14,
  "Motors, Motor Circuits and Controllers": 16,
  "HVAC and Refrigeration Equipment": 18,
  "Transformers": 20,
  "Generators and Emergency Power": 22,
  "Fire Pumps": 12,
  "Elevators, Escalators and Lifts": 14,
  "Signs and Outline Lighting": 16,
  "Electric Vehicle Charging": 18,
  "Energy Storage Systems": 20,
  "Photovoltaic Systems": 22,
  "Fuel Cell Systems": 12,
  "Hazardous Locations": 14,
  "Health Care Facilities": 16,
  "Swimming Pools, Spas and Fountains": 18,
  "Marinas and Boatyards": 20,
  "Temporary Installations": 22,
  "Class 1, 2, 3 Remote-Control, Signaling, Power-Limited": 12,
  "Fire Alarm Systems": 14,
  "Optical Fiber Cables": 16,
  "Communications Circuits": 18,
  "Surge Protection": 20,
  "Short-Circuit and Interrupting Ratings": 22,
  "Selective Coordination": 12,
  "Emergency Disconnects": 14,
  "Box Fill, Conduit Fill, Bending, Chapter 9 Tables": 16,
  "Marking, Labeling and Identification": 18,
  "Voltage Drop": 20
};

const examsData: Exam[] = newTopics.map((title, index) => {
    const num_questions = topicQuestionCounts[title] || 20; // Default to 20 if not found
    return {
        id: `topic${index + 1}`,
        title: title,
        description_en: `Test your knowledge on ${title.toLowerCase()}.`,
        num_questions: num_questions
    };
});

interface QuestionWithStringChoices {
    id: string;
    exam_id: string;
    topic: string;
    question_en: string;
    question_ru: string;
    choices: string;
    difficulty: Difficulty;
    explanation_en: string;
    explanation_ru: string;
}

const createMockChoices = (questionId: string): string => {
    const choices = [
        { id: `${questionId}-a`, text_en: "Correct Answer", text_ru: "Правильный ответ", is_correct: true },
        { id: `${questionId}-b`, text_en: "Wrong Answer A", text_ru: "Неправильный ответ A", is_correct: false },
        { id: `${questionId}-c`, text_en: "Wrong Answer B", text_ru: "Неправильный ответ B", is_correct: false },
        { id: `${questionId}-d`, text_en: "Wrong Answer C", text_ru: "Неправильный ответ C", is_correct: false },
    ];

    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    return JSON.stringify(choices);
};

const getRandomDifficulty = (): Difficulty => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'difficult'];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
};

const questionsData: QuestionWithStringChoices[] = examsData.flatMap(exam =>
    Array.from({ length: exam.num_questions }, (_, i) => {
        const questionId = `${exam.id}_q${i + 1}`;
        return {
            id: questionId,
            exam_id: VITE_EXAM_ID,
            topic: exam.id,
            question_en: `${exam.title} - Question ${i + 1}`,
            question_ru: `${exam.title} - Вопрос ${i + 1}`,
            choices: createMockChoices(questionId),
            difficulty: getRandomDifficulty(),
            explanation_en: `This is the correct answer based on NEC 2023, Article XXX.YY, which states the requirements for ${exam.title.toLowerCase()}. Understanding this principle is crucial for safe and compliant installations.`,
            explanation_ru: `Это правильный ответ в соответствии с NEC 2023, Статья XXX.YY, в которой изложены требования к ${exam.title.toLowerCase()}. Понимание этого принципа имеет решающее значение для безопасных и соответствующих требованиям установок.`,
        };
    })
);

const parsedQuestionsData: Question[] = questionsData.map(q => ({
  ...q,
  choices: JSON.parse(q.choices) as Choice[],
}));

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getExams = async (): Promise<Exam[]> => {
  await new Promise(res => setTimeout(res, 300));
  return examsData;
};

export const getQuestions = async (topic: string, limit: number): Promise<Question[]> => {
  await new Promise(res => setTimeout(res, 500));
  
  const filteredQuestions = parsedQuestionsData.filter(
    q => q.topic === topic && q.exam_id === VITE_EXAM_ID
  );
  
  const shuffledQuestions = shuffleArray(filteredQuestions);
  
  return shuffledQuestions.slice(0, limit);
};
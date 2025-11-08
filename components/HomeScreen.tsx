import React, { useState, useEffect, useMemo } from 'react';
import { getExams } from '../services/quizService';
import { getProgress } from '../services/progressService';
import { type Exam, type Progress } from '../types';
import Card from './Card';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { motion, AnimatePresence } from 'framer-motion';

interface HomeScreenProps {
  onStartTest: (exam: Exam) => void;
}

const categories: { [key: string]: string[] } = {
  "Fundamentals & General Requirements": ["Code Structure and Scope", "Definitions", "General Requirements and Working Space"],
  "Conductors, Raceways & Wiring": ["Conductor Ampacity and Corrections", "Wiring Methods – General", "Raceways", "Cable Types", "Flexible Cords and Cables"],
  "Protection, Grounding & Boxes": ["Boxes, Conduit Bodies and Fittings", "Overcurrent Protection", "Grounding and Bonding", "Surge Protection"],
  "Circuits & Load Calculations": ["Branch Circuits", "Feeders", "Load Calculations – Dwelling", "Load Calculations – Non-Dwelling", "Voltage Drop"],
  "Services & Equipment": ["Services and Service Equipment", "Receptacles, Cord-Connectors and GFCI/AFCI", "Luminaires and Lighting", "Appliances and Fastened-in-Place Equipment"],
  "Specialized Equipment": ["Motors, Motor Circuits and Controllers", "HVAC and Refrigeration Equipment", "Transformers", "Generators and Emergency Power", "Fire Pumps", "Elevators, Escalators and Lifts", "Signs and Outline Lighting"],
  "Renewable Energy & High Tech": ["Electric Vehicle Charging", "Energy Storage Systems", "Photovoltaic Systems", "Fuel Cell Systems"],
  "Special Occupancies & Conditions": ["Hazardous Locations", "Health Care Facilities", "Swimming Pools, Spas and Fountains", "Marinas and Boatyards", "Temporary Installations"],
  "Communications & Low Voltage": ["Class 1, 2, 3 Remote-Control, Signaling, Power-Limited", "Fire Alarm Systems", "Optical Fiber Cables", "Communications Circuits"],
  "Reference, Tables & Markings": ["Short-Circuit and Interrupting Ratings", "Selective Coordination", "Emergency Disconnects", "Box Fill, Conduit Fill, Bending, Chapter 9 Tables", "Marking, Labeling and Identification"]
};

const AccordionItem: React.FC<{
  title: string;
  exams: Exam[];
  progress: Progress;
  onStartTest: (exam: Exam) => void;
  isOpen: boolean;
  onClick: () => void;
}> = ({ title, exams, progress, onStartTest, isOpen, onClick }) => {
    return (
        <div className="border-b border-white/10">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center p-5 text-left text-xl font-semibold bg-white/10 dark:bg-gray-800/20 hover:bg-white/20 dark:hover:bg-gray-800/40 transition-colors"
            >
                <span>{title}</span>
                <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
                    <ChevronLeftIcon className="w-5 h-5 transform -rotate-90" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-black/5">
                            {exams.map(exam => <TopicCard key={exam.id} exam={exam} progress={progress} onStartTest={onStartTest} />)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const TopicCard: React.FC<{ exam: Exam; progress: Progress; onStartTest: (exam: Exam) => void; }> = ({ exam, progress, onStartTest }) => {
    const examProgress = progress[exam.id];
    const percentage = examProgress ? Math.round((examProgress.correct / exam.num_questions) * 100) : 0;

    return (
        <Card className="p-6 flex flex-col justify-between h-full">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{exam.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{exam.description_en}</p>
            </div>
            <div className="flex justify-between items-center mt-4">
                {examProgress ? (
                    <div className="flex items-center space-x-2 text-sm font-medium">
                        <div className="relative w-9 h-9">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle className="text-gray-200 dark:text-gray-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                                <motion.circle className="text-blue-500" strokeWidth="10" strokeDasharray={2 * Math.PI * 45} strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" initial={{ strokeDashoffset: 2 * Math.PI * 45 }} animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - percentage / 100) }} transition={{ duration: 1.5, ease: 'easeOut' }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }} className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {examProgress.correct}
                                </motion.span>
                            </div>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400"> / {exam.num_questions} correct</span>
                    </div>
                ) : (
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-300">{exam.num_questions} questions</span>
                )}
                <button onClick={() => onStartTest(exam)} className="px-5 py-2.5 font-semibold text-white bg-blue-600/80 dark:bg-blue-500/80 backdrop-blur-xl border border-blue-500/20 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-300 transform hover:scale-105 ios-shadow">
                    Start Test
                </button>
            </div>
        </Card>
    );
}


const HomeScreen: React.FC<HomeScreenProps> = ({ onStartTest }) => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [progress, setProgress] = useState<Progress>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    useEffect(() => {
        const fetchExamsAndProgress = async () => {
            setLoading(true);
            try {
                const examsData = await getExams();
                const progressData = getProgress();
                setExams(examsData);
                setProgress(progressData);
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExamsAndProgress();
    }, []);

    const filteredExams = useMemo(() => {
        if (!searchTerm) return exams;
        return exams.filter(exam =>
            exam.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [exams, searchTerm]);

    const categorizedExams = useMemo(() => {
        const examMap = new Map(filteredExams.map(exam => [exam.title, exam]));
        return Object.entries(categories).map(([categoryTitle, topicTitles]) => {
            const categoryExams = topicTitles.map(title => examMap.get(title)).filter((e): e is Exam => e !== undefined);
            return { categoryTitle, exams: categoryExams };
        }).filter(c => c.exams.length > 0);
    }, [filteredExams]);

    useEffect(() => {
      if (searchTerm && categorizedExams.length > 0) {
        setOpenAccordion(categorizedExams[0].categoryTitle);
      } else if (!searchTerm) {
        setOpenAccordion(null);
      }
    }, [searchTerm, categorizedExams]);

    return (
        <div className="space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">NEC 2023 Practice</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">Choose a topic to begin your test.</p>
            </header>

            <div className="relative max-w-lg mx-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                    type="text"
                    placeholder="Search topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none backdrop-blur-lg transition"
                />
            </div>

            {loading ? (
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4">Loading topics...</p>
                </div>
            ) : (
                <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-lg overflow-hidden">
                    {categorizedExams.map(({ categoryTitle, exams }) => (
                        <AccordionItem
                            key={categoryTitle}
                            title={categoryTitle}
                            exams={exams}
                            progress={progress}
                            onStartTest={onStartTest}
                            isOpen={openAccordion === categoryTitle}
                            onClick={() => setOpenAccordion(openAccordion === categoryTitle ? null : categoryTitle)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomeScreen;
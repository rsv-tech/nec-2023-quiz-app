import { type Progress, type ProgressData } from '../types';

const PROGRESS_STORAGE_KEY = 'nec2023_progress';

/**
 * Retrieves the user's progress from localStorage.
 */
export const getProgress = (): Progress => {
  try {
    const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return savedProgress ? JSON.parse(savedProgress) : {};
  } catch (error) {
    console.error("Failed to parse progress from localStorage", error);
    return {};
  }
};

/**
 * Saves the result of a test for a specific exam to localStorage.
 */
export const saveProgress = (examId: string, result: ProgressData): void => {
  try {
    const currentProgress = getProgress();
    currentProgress[examId] = result;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(currentProgress));
  } catch (error) {
    console.error("Failed to save progress to localStorage", error);
  }
};

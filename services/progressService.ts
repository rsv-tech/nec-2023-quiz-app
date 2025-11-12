import { type Progress, type ProgressData, type TestState } from '../types';

const PROGRESS_STORAGE_KEY = 'nec2023_progress';
const TEST_STATE_STORAGE_KEY_PREFIX = 'nec2023_test_state_';

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

/**
 * Saves the current state of a test to localStorage.
 */
export const saveTestState = (examId: string, state: TestState): void => {
  try {
    localStorage.setItem(`${TEST_STATE_STORAGE_KEY_PREFIX}${examId}`, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save test state", error);
  }
};

/**
 * Retrieves the saved state of a test from localStorage.
 */
export const getTestState = (examId: string): TestState | null => {
  try {
    const savedState = localStorage.getItem(`${TEST_STATE_STORAGE_KEY_PREFIX}${examId}`);
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.error("Failed to retrieve test state", error);
    return null;
  }
};

/**
 * Clears the saved state of a test from localStorage.
 */
export const clearTestState = (examId: string): void => {
  try {
    localStorage.removeItem(`${TEST_STATE_STORAGE_KEY_PREFIX}${examId}`);
  } catch (error) {
    console.error("Failed to clear test state", error);
  }
};

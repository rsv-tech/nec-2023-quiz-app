import { v4 as uuidv4 } from 'uuid';



import { fetchGlossary, addGlossaryTermApi } from './sheetsService';
import { type GlossaryItem } from '../types';

const STORAGE_KEY = 'nec2023_user_glossary';

// Cache for API terms to avoid repeated calls
let cachedApiTerms: GlossaryItem[] | null = null;

export const getGlossaryTerms = async (): Promise<GlossaryItem[]> => {
  try {
    // 1. Fetch from API (or cache)
    if (!cachedApiTerms) {
      try {
        cachedApiTerms = await fetchGlossary();
      } catch (e) {
        console.error('Failed to fetch glossary from API, using empty list', e);
        cachedApiTerms = [];
      }
    }

    // 2. Fetch from Local Storage (User defined)
    const saved = localStorage.getItem(STORAGE_KEY);
    const userTerms: GlossaryItem[] = saved ? JSON.parse(saved) : [];

    // 3. Merge
    return [...(cachedApiTerms || []), ...userTerms];
  } catch (error) {
    console.error('Failed to load glossary terms:', error);
    return [];
  }
};



export const addGlossaryTerm = async (term: string): Promise<GlossaryItem | null> => {
  try {
    // Call API to generate term with definitions
    const response = await addGlossaryTermApi(term);
    
    // Map response to GlossaryItem
    const newTerm: GlossaryItem = {
      id: response.id_glossary || uuidv4(),
      term: response.term_en || term,
      definition_en: response.definition_en || '',
      definition_ru: response.definition_ru || '',
      isUserDefined: true // Mark as user defined initially, though it's now in the sheet
    };

    // Update cache if exists
    if (cachedApiTerms) {
      cachedApiTerms.push(newTerm);
    }

    // Also save to local storage as backup/immediate access
    const saved = localStorage.getItem(STORAGE_KEY);
    const userTerms: GlossaryItem[] = saved ? JSON.parse(saved) : [];
    // Avoid duplicates in local storage if possible, but for now just append
    const updatedTerms = [...userTerms, newTerm];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTerms));

    return newTerm;
  } catch (error) {
    console.error('Failed to add glossary term via API:', error);
    // Fallback: add locally without definitions
    const fallbackTerm: GlossaryItem = {
        id: uuidv4(),
        term: term,
        definition_en: '',
        definition_ru: '',
        isUserDefined: true
    };
    
    const saved = localStorage.getItem(STORAGE_KEY);
    const userTerms: GlossaryItem[] = saved ? JSON.parse(saved) : [];
    const updatedTerms = [...userTerms, fallbackTerm];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTerms));
    
    return fallbackTerm;
  }
};

export const resetGlossary = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

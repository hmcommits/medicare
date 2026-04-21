import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../constants/translations';

const STORAGE_KEY = '@medicare_language';
const DEFAULT_LANG = 'en';

export const LanguageContext = createContext({
  language: DEFAULT_LANG,
  setLanguage: () => {},
  t: (key) => key,
});

/**
 * Wrap the entire app with this provider in App.js.
 * Every component then calls `useLanguage()` to get `t()` and `language`.
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANG);

  // Load persisted language on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && translations[saved]) {
        setLanguageState(saved);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang) => {
    if (!translations[lang]) return;
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  /**
   * Translation helper.
   * - If the value is a function (e.g., `daysLeft: (n) => ...`), it's called with ...args.
   * - Falls back to English if the key doesn't exist in the selected language.
   * - Returns the key itself as last-resort fallback.
   */
  const t = useCallback(
    (key, ...args) => {
      const val =
        (translations[language] && translations[language][key]) ??
        (translations[DEFAULT_LANG] && translations[DEFAULT_LANG][key]) ??
        key;
      return typeof val === 'function' ? val(...args) : val;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Convenience hook — use this in every component instead of useContext directly. */
export function useLanguage() {
  return useContext(LanguageContext);
}

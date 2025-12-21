import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/index.js';
import type { RootState } from '../store/index.js';
import { toggleTheme, setThemeMode, setPrimaryColor, setSecondaryColor } from '../store/slices/themeSlice.js';

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state: RootState) => state.theme);

  useEffect(() => {
    // Apply theme on mount
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply custom colors
    document.documentElement.style.setProperty('--color-primary', theme.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', theme.secondaryColor);
  }, [theme.mode, theme.primaryColor, theme.secondaryColor]);

  const toggle = () => dispatch(toggleTheme());
  const setMode = (mode: 'light' | 'dark') => dispatch(setThemeMode(mode));
  const changePrimaryColor = (color: string) => dispatch(setPrimaryColor(color));
  const changeSecondaryColor = (color: string) => dispatch(setSecondaryColor(color));

  return {
    mode: theme.mode,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    isDark: theme.mode === 'dark',
    toggle,
    setMode,
    changePrimaryColor,
    changeSecondaryColor,
  };
};

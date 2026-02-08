import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ThemeState } from '../../types/index.js';

const getInitialTheme = (): 'light' | 'dark' => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  if (savedTheme) return savedTheme;
  
  return 'light';
};

const initialState: ThemeState = {
  mode: getInitialTheme(),
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
      
      if (state.mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload;
      localStorage.setItem('theme', state.mode);
      
      if (state.mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
      document.documentElement.style.setProperty('--color-primary', action.payload);
    },
    setSecondaryColor: (state, action: PayloadAction<string>) => {
      state.secondaryColor = action.payload;
      document.documentElement.style.setProperty('--color-secondary', action.payload);
    },
  },
});

export const { toggleTheme, setThemeMode, setPrimaryColor, setSecondaryColor } = themeSlice.actions;
export default themeSlice.reducer;

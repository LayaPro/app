import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UIState } from '../../types/index.js';

const initialState: UIState = {
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  notificationPanelOpen: false,
  profilePanelOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(state.sidebarCollapsed));
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('sidebarCollapsed', String(state.sidebarCollapsed));
    },
    toggleNotificationPanel: (state) => {
      state.notificationPanelOpen = !state.notificationPanelOpen;
      if (state.notificationPanelOpen) {
        state.profilePanelOpen = false;
      }
    },
    toggleProfilePanel: (state) => {
      state.profilePanelOpen = !state.profilePanelOpen;
      if (state.profilePanelOpen) {
        state.notificationPanelOpen = false;
      }
    },
    closeAllPanels: (state) => {
      state.notificationPanelOpen = false;
      state.profilePanelOpen = false;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleNotificationPanel,
  toggleProfilePanel,
  closeAllPanels,
} = uiSlice.actions;
export default uiSlice.reducer;

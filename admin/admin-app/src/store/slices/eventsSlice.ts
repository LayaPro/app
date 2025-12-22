import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface EventStatus {
  statusId: string;
  step: number;
  statusCode: string;
  lastUpdatedDate?: string;
}

interface EventsState {
  eventStatuses: EventStatus[];
  hasUnsavedWorkflowChanges: boolean;
}

const initialState: EventsState = {
  eventStatuses: [],
  hasUnsavedWorkflowChanges: false,
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEventStatuses: (state, action: PayloadAction<EventStatus[]>) => {
      state.eventStatuses = action.payload;
      state.hasUnsavedWorkflowChanges = false;
    },
    reorderWorkflowStatuses: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      const { fromIndex, toIndex } = action.payload;
      const statuses = [...state.eventStatuses];
      
      // Get the starting step number from the first item to preserve offset (could be 0 or 1)
      const startingStep = statuses.length > 0 ? Math.min(...statuses.map(s => s.step)) : 0;
      
      const [movedItem] = statuses.splice(fromIndex, 1);
      statuses.splice(toIndex, 0, movedItem);
      
      // Update step numbers preserving the original offset
      state.eventStatuses = statuses.map((status, idx) => ({
        ...status,
        step: startingStep + idx,
      }));
      state.hasUnsavedWorkflowChanges = true;
    },
    resetWorkflowChanges: (state) => {
      // This would typically reload from the original data source
      state.hasUnsavedWorkflowChanges = false;
    },
    clearUnsavedWorkflowChanges: (state) => {
      state.hasUnsavedWorkflowChanges = false;
    },
    addWorkflowStatus: (state, action: PayloadAction<{ statusCode: string; statusDescription?: string }>) => {
      const { statusCode } = action.payload;
      
      // Calculate the next step number
      const maxStep = state.eventStatuses.length > 0 
        ? Math.max(...state.eventStatuses.map(s => s.step))
        : -1;
      const nextStep = maxStep + 1;
      
      // Create new status
      const newStatus: EventStatus = {
        statusId: `temp-${Date.now()}`, // Temporary ID until saved to backend
        statusCode,
        step: nextStep,
      };
      
      state.eventStatuses.push(newStatus);
      state.hasUnsavedWorkflowChanges = true;
    },
  },
});

export const {
  setEventStatuses,
  reorderWorkflowStatuses,
  resetWorkflowChanges,
  clearUnsavedWorkflowChanges,
  addWorkflowStatus,
} = eventsSlice.actions;

export default eventsSlice.reducer;

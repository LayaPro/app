import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ProjectState {
  editingProject: any | null;
  isEditing: boolean;
}

const initialState: ProjectState = {
  editingProject: null,
  isEditing: false,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setEditingProject: (state, action: PayloadAction<any>) => {
      console.log('Redux action setEditingProject called with:', action.payload);
      state.editingProject = action.payload;
      state.isEditing = true;
      console.log('State after update:', { editingProject: state.editingProject, isEditing: state.isEditing });
    },
    clearEditingProject: (state) => {
      state.editingProject = null;
      state.isEditing = false;
    },
  },
});

export const { setEditingProject, clearEditingProject } = projectSlice.actions;
export default projectSlice.reducer;

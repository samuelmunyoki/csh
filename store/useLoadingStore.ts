import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;

  setLoading: (loading: boolean, message?: string) => void;
  clearLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  loadingMessage: 'Loading...',

  setLoading: (loading: boolean, message: string = 'Loading...') => {
    set({ isLoading: loading, loadingMessage: message });
  },

  clearLoading: () => {
    set({ isLoading: false, loadingMessage: 'Loading...' });
  },
}));

// Zustand store for UI states and app-level data
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useAppStore = create(
  devtools(
    (set, get) => ({
      // UI State Management
      showBottomNav: true,
      showSuggestFollow: true,
      selectedChapter: 0,
      
      // Data States
      vietQrData: "",
      poweredByData: null,
      
      // Actions for UI states
      setShowBottomNav: (show) => set({ showBottomNav: show }),
      setShowSuggestFollow: (show) => set({ showSuggestFollow: show }),
      setSelectedChapter: (chapterId) => set({ selectedChapter: chapterId }),
      
      // Actions for data states
      setVietQrData: (data) => set({ vietQrData: data }),
      setPoweredByData: (data) => set({ poweredByData: data }),
      
      // Reset functions
      resetVietQr: () => set({ vietQrData: "" }),
      resetPoweredBy: () => set({ poweredByData: null }),
      
      // Combined reset
      resetAppState: () => set({
        showBottomNav: true,
        showSuggestFollow: true,
        selectedChapter: 0,
        vietQrData: "",
        poweredByData: null,
      }),
    }),
    {
      name: 'app-store', // DevTools name
    }
  )
);

export default useAppStore;

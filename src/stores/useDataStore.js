// Zustand store for cached data and lists
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useDataStore = create(
  devtools(
    (set, get) => ({
      // Cached Lists
      sponsorsCache: [],
      
      // Loading states for cached data
      isLoadingSponsors: false,
      
      // Error states
      sponsorsError: null,
      
      // Actions for sponsors cache
      setSponsorsCache: (sponsors) => set({ 
        sponsorsCache: sponsors,
        isLoadingSponsors: false,
        sponsorsError: null 
      }),
      
      addToSponsorsCache: (sponsor) => set((state) => ({
        sponsorsCache: [...state.sponsorsCache, sponsor]
      })),
      
      updateSponsorInCache: (sponsorId, updatedSponsor) => set((state) => ({
        sponsorsCache: state.sponsorsCache.map(sponsor => 
          sponsor.id === sponsorId ? { ...sponsor, ...updatedSponsor } : sponsor
        )
      })),
      
      removeSponsorFromCache: (sponsorId) => set((state) => ({
        sponsorsCache: state.sponsorsCache.filter(sponsor => sponsor.id !== sponsorId)
      })),
      
      // Loading actions
      setLoadingSponsors: (loading) => set({ isLoadingSponsors: loading }),
      
      // Error actions
      setSponsorsError: (error) => set({ 
        sponsorsError: error,
        isLoadingSponsors: false 
      }),
      
      // Fetch functions
      fetchSponsors: async () => {
        set({ isLoadingSponsors: true, sponsorsError: null });
        try {
          // This will be implemented when we update components
          // For now, just set loading to false
          set({ isLoadingSponsors: false });
        } catch (error) {
          set({ 
            sponsorsError: error.message,
            isLoadingSponsors: false 
          });
        }
      },
      
      // Clear functions
      clearSponsorsCache: () => set({ sponsorsCache: [] }),
      
      // Reset all data state
      resetDataState: () => set({
        sponsorsCache: [],
        isLoadingSponsors: false,
        sponsorsError: null,
      }),
      
      // Utility functions
      getSponsorById: (sponsorId) => {
        const { sponsorsCache } = get();
        return sponsorsCache.find(sponsor => sponsor.id === sponsorId);
      },
      
      isSponsorCached: (sponsorId) => {
        const { sponsorsCache } = get();
        return sponsorsCache.some(sponsor => sponsor.id === sponsorId);
      },
    }),
    {
      name: 'data-store', // DevTools name
    }
  )
);

export default useDataStore;

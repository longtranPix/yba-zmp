// Zustand store for authentication and user data
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useAuthStore = create(
  devtools(
    (set, get) => ({
      // User Profile States
      currentProfile: null,
      userZaloProfile: null,
      userByPhoneNumber: null,
      userProfile: null,
      
      // Loading states
      isLoadingZaloProfile: false,
      isLoadingUserProfile: false,
      isLoadingPhoneUser: false,
      
      // Error states
      zaloProfileError: null,
      userProfileError: null,
      phoneUserError: null,
      
      // Actions for user profiles
      setCurrentProfile: (profile) => set({ currentProfile: profile }),
      setUserZaloProfile: (profile) => set({ 
        userZaloProfile: profile,
        isLoadingZaloProfile: false,
        zaloProfileError: null 
      }),
      setUserByPhoneNumber: (user) => set({ 
        userByPhoneNumber: user,
        isLoadingPhoneUser: false,
        phoneUserError: null 
      }),
      setUserProfile: (profile) => set({ 
        userProfile: profile,
        isLoadingUserProfile: false,
        userProfileError: null 
      }),
      
      // Loading actions
      setLoadingZaloProfile: (loading) => set({ isLoadingZaloProfile: loading }),
      setLoadingUserProfile: (loading) => set({ isLoadingUserProfile: loading }),
      setLoadingPhoneUser: (loading) => set({ isLoadingPhoneUser: loading }),
      
      // Error actions
      setZaloProfileError: (error) => set({ 
        zaloProfileError: error,
        isLoadingZaloProfile: false 
      }),
      setUserProfileError: (error) => set({ 
        userProfileError: error,
        isLoadingUserProfile: false 
      }),
      setPhoneUserError: (error) => set({ 
        phoneUserError: error,
        isLoadingPhoneUser: false 
      }),
      
      // Refresh actions (replaces refresh triggers)
      refreshZaloProfile: async () => {
        const { fetchZaloProfile } = get();
        await fetchZaloProfile();
      },
      
      refreshUserProfile: async () => {
        const { fetchUserProfile } = get();
        await fetchUserProfile();
      },
      
      refreshPhoneUser: async () => {
        const { fetchUserByPhoneNumber } = get();
        await fetchUserByPhoneNumber();
      },
      
      // Fetch functions (to be called by components)
      fetchZaloProfile: async () => {
        set({ isLoadingZaloProfile: true, zaloProfileError: null });
        try {
          // This will be implemented when we update components
          // For now, just set loading to false
          set({ isLoadingZaloProfile: false });
        } catch (error) {
          set({ 
            zaloProfileError: error.message,
            isLoadingZaloProfile: false 
          });
        }
      },
      
      fetchUserProfile: async () => {
        set({ isLoadingUserProfile: true, userProfileError: null });
        try {
          // This will be implemented when we update components
          set({ isLoadingUserProfile: false });
        } catch (error) {
          set({ 
            userProfileError: error.message,
            isLoadingUserProfile: false 
          });
        }
      },
      
      fetchUserByPhoneNumber: async () => {
        set({ isLoadingPhoneUser: true, phoneUserError: null });
        try {
          // This will be implemented when we update components
          set({ isLoadingPhoneUser: false });
        } catch (error) {
          set({ 
            phoneUserError: error.message,
            isLoadingPhoneUser: false 
          });
        }
      },
      
      // Clear functions
      clearCurrentProfile: () => set({ currentProfile: null }),
      clearUserZaloProfile: () => set({ userZaloProfile: null }),
      clearUserByPhoneNumber: () => set({ userByPhoneNumber: null }),
      clearUserProfile: () => set({ userProfile: null }),
      
      // Reset all auth state
      resetAuthState: () => set({
        currentProfile: null,
        userZaloProfile: null,
        userByPhoneNumber: null,
        userProfile: null,
        isLoadingZaloProfile: false,
        isLoadingUserProfile: false,
        isLoadingPhoneUser: false,
        zaloProfileError: null,
        userProfileError: null,
        phoneUserError: null,
      }),
    }),
    {
      name: 'auth-store', // DevTools name
    }
  )
);

export default useAuthStore;

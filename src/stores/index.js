// Central export for all Zustand stores
export { default as useAppStore } from './useAppStore';
export { default as useAuthStore } from './useAuthStore';
export { default as useDataStore } from './useDataStore';

// Combined store hook for components that need multiple stores
export const useStores = () => ({
  app: useAppStore(),
  auth: useAuthStore(),
  data: useDataStore(),
});

// Reset all stores (useful for logout or app reset)
export const resetAllStores = () => {
  useAppStore.getState().resetAppState();
  useAuthStore.getState().resetAuthState();
  useDataStore.getState().resetDataState();
};

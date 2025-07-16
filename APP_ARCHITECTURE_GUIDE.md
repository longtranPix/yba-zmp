# YBA HCM Mobile App - Architecture & Modernization Guide

## Overview

This document provides a comprehensive guide for recreating the YBA HCM mobile application using modern libraries and best practices. The app is a Zalo Mini App built for the Young Business Association of Ho Chi Minh City.

## Current Tech Stack vs Modern Replacement

### Current Stack
- **React**: 18.3.1
- **State Management**: Recoil
- **HTTP Client**: Custom fetch-based service
- **UI Framework**: ZMP UI (Zalo Mini App UI)
- **Styling**: Tailwind CSS + SCSS
- **Routing**: React Router DOM
- **Build Tool**: Zalo Mini App CLI

### Modern Replacement Stack
- **React**: 18+ (latest)
- **State Management**: TanStack React Query + Zustand (for client state)
- **HTTP Client**: Axios with interceptors
- **UI Framework**: ZMP UI (keep for Zalo compatibility)
- **Styling**: Tailwind CSS (latest)
- **Routing**: React Router DOM v6+
- **Build Tool**: Vite + Zalo Mini App integration

## Application Architecture

### Core Features
1. **Authentication & User Management**
2. **Event Management & Registration**
3. **Content Management (Posts/News)**
4. **Membership Management**
5. **Payment Integration (VietQR)**
6. **Admin Functions**
7. **Dynamic Layout Configuration**

### Data Flow Pattern

```
User Action → Component → React Query Hook → Axios Request → API → Response → Cache Update → UI Update
```

## API Architecture

### Base Configuration
```javascript
// Current: Multiple API domains
const API_DOMAINS = {
  main: "https://yba.tsx.vn", // REST APIs
  strapi: "http://192.168.1.18:1337" // GraphQL + REST
}

// Modern: Centralized Axios configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Authentication Flow
1. **Zalo Mini App Authentication**
   - Get access token from Zalo SDK
   - Exchange for JWT token via `/accounts/login`
   - Store JWT in secure storage
   - Use JWT for subsequent requests

2. **Request Interceptor Pattern**
```javascript
// Current: Manual auth handling in each request
// Modern: Axios interceptor
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## State Management Migration

### Current Recoil Pattern
```javascript
// Recoil Selector
export const configState = selector({
  key: "Configs",
  get: async ({ get }) => {
    const response = await APIServices.getConfigs();
    return response.data || {};
  },
});

// Component Usage
const configs = useRecoilValue(configState);
```

### Modern React Query Pattern
```javascript
// React Query Hook
export const useConfigs = () => {
  return useQuery({
    queryKey: ['configs'],
    queryFn: () => apiClient.get('/api/configs').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Component Usage
const { data: configs, isLoading, error } = useConfigs();
```

## Key API Endpoints & Patterns

### 1. Configuration APIs (Strapi GraphQL)

**Posts API**
```javascript
// Current: Custom GraphQL fetch
// Modern: Axios + React Query
export const usePosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await apiClient.post('/graphql', {
        query: `
          query Posts {
            posts {
              hinh_anh_minh_hoa { url name documentId }
              documentId ngay_dang ma_code noi_dung
              publishedAt tac_gia tieu_de trang_thai
              updatedAt createdAt
            }
          }
        `
      });
      return transformPostsData(data.data.posts);
    }
  });
};
```

**Layout Configuration**
```javascript
export const useLayoutConfig = () => {
  return useQuery({
    queryKey: ['layoutConfig'],
    queryFn: async () => {
      const { data } = await apiClient.post('/graphql', {
        query: `
          query LayoutConfig {
            layoutConfig {
              header_background_color header_show_logo
              navigation_items { route label item_id icon }
              theme_primary_color theme_secondary_color
            }
          }
        `
      });
      return data.data.layoutConfig;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
```

### 2. REST APIs (Main Backend)

**Events Management**
```javascript
export const useEvents = (offset = 0, limit = 20) => {
  return useQuery({
    queryKey: ['events', offset, limit],
    queryFn: () => apiClient.get(`/events/?offset=${offset}&limit=${limit}`),
    keepPreviousData: true,
  });
};

export const useEventRegistration = () => {
  return useMutation({
    mutationFn: ({ eventId, ticketId, data, zaloIdByOA }) =>
      apiClient.post(`/events/${eventId}/${ticketId}/register`, {
        data,
        zaloIdByOA
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['userTickets']);
    }
  });
};
```

## Component Patterns

### Current Pattern (Recoil)
```javascript
const EventPage = () => {
  const events = useRecoilValue(listEventState);
  const loading = useRecoilValue(loadingState);
  
  if (loading) return <Loading />;
  
  return (
    <div>
      {events.map(event => <EventCard key={event.id} event={event} />)}
    </div>
  );
};
```

### Modern Pattern (React Query)
```javascript
const EventPage = () => {
  const { 
    data: events, 
    isLoading, 
    error,
    fetchNextPage,
    hasNextPage 
  } = useInfiniteEvents();
  
  if (isLoading) return <Loading />;
  if (error) return <ErrorBoundary error={error} />;
  
  return (
    <div>
      {events?.pages.flatMap(page => page.data).map(event => 
        <EventCard key={event.id} event={event} />
      )}
      {hasNextPage && (
        <button onClick={fetchNextPage}>Load More</button>
      )}
    </div>
  );
};
```

## Data Transformation Patterns

### GraphQL Response Transformation
```javascript
// Transform Strapi GraphQL to expected format
const transformPostsData = (posts) => {
  return posts.map(post => ({
    id: post.documentId,
    documentId: post.documentId,
    customFields: {
      "Tiêu đề": post.tieu_de,
      "Nội dung": {
        text: post.noi_dung,
        html: post.noi_dung
      },
      "Ảnh minh hoạ": post.hinh_anh_minh_hoa || [],
      "Tạo lúc": post.createdAt,
      "Tác giả": post.tac_gia,
      "Trạng thái": post.trang_thai,
    },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt
  }));
};
```

## Error Handling Strategy

### Current: Manual error handling
### Modern: Centralized error handling

```javascript
// Axios Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle auth errors
      clearAuthToken();
      redirectToLogin();
    }
    
    if (error.response?.status >= 500) {
      // Handle server errors
      showErrorToast('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

// React Query Error Boundary
const QueryErrorBoundary = ({ children }) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ErrorFallback error={error} onRetry={resetErrorBoundary} />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
```

## Caching Strategy

### React Query Configuration
```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Cache Invalidation Patterns
```javascript
// After successful mutation
const updateEventMutation = useMutation({
  mutationFn: updateEvent,
  onSuccess: (data, variables) => {
    // Invalidate and refetch
    queryClient.invalidateQueries(['events']);
    queryClient.invalidateQueries(['event', variables.id]);

    // Optimistic update
    queryClient.setQueryData(['event', variables.id], data);
  }
});
```

## Authentication & Security

### JWT Token Management
```javascript
// Modern token management with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => set({
        token,
        user,
        isAuthenticated: true
      }),

      clearAuth: () => set({
        token: null,
        user: null,
        isAuthenticated: false
      }),

      refreshToken: async () => {
        try {
          const response = await apiClient.post('/auth/refresh');
          const { token, user } = response.data;
          get().setAuth(token, user);
          return token;
        } catch (error) {
          get().clearAuth();
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
```

### Zalo Mini App Integration
```javascript
// Zalo authentication hook with development bypass
export const useZaloAuth = () => {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      // Development mode: Skip login
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_SKIP_LOGIN === 'true') {
        return {
          jwt: 'dev-token',
          user: {
            id: 'dev-user',
            name: 'Development User',
            phone: '+84123456789',
            isAdmin: true,
            isMember: true
          }
        };
      }

      // Production: Real Zalo authentication
      const accessToken = await ZaloService.getAccessToken();
      const phoneToken = await ZaloService.getPhoneNumber();

      // Exchange for app JWT
      const response = await apiClient.post('/accounts/login', {
        accessToken,
        phoneNumber: phoneToken
      });

      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.jwt, data.user);
    }
  });
};
```

### Development Authentication Bypass

For development and testing purposes, you can skip the Zalo authentication flow:

#### Environment Configuration
```bash
# .env.development
REACT_APP_SKIP_LOGIN=true
REACT_APP_DEV_USER_ROLE=admin # or 'member' or 'guest'
REACT_APP_API_URL=http://localhost:3000
```

#### Mock Authentication Service
```javascript
// lib/auth-dev.js
export const createMockAuthData = (role = 'member') => {
  const baseUser = {
    id: 'dev-user-123',
    name: 'Development User',
    phone: '+84123456789',
    email: 'dev@ybahcm.vn',
    avatar: 'https://api.ybahcm.vn/public/yba/default-avatar.png'
  };

  switch (role) {
    case 'admin':
      return {
        jwt: 'dev-admin-token',
        user: {
          ...baseUser,
          isAdmin: true,
          isMember: true,
          permissions: ['read', 'write', 'admin']
        }
      };
    case 'member':
      return {
        jwt: 'dev-member-token',
        user: {
          ...baseUser,
          isAdmin: false,
          isMember: true,
          permissions: ['read', 'write']
        }
      };
    case 'guest':
      return {
        jwt: 'dev-guest-token',
        user: {
          ...baseUser,
          isAdmin: false,
          isMember: false,
          permissions: ['read']
        }
      };
    default:
      return null;
  }
};

// Enhanced auth store with dev mode
const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      // Development login bypass
      devLogin: (role = 'member') => {
        if (process.env.NODE_ENV === 'development') {
          const authData = createMockAuthData(role);
          if (authData) {
            set({
              token: authData.jwt,
              user: authData.user,
              isAuthenticated: true
            });
            return true;
          }
        }
        return false;
      },

      setAuth: (token, user) => set({
        token,
        user,
        isAuthenticated: true
      }),

      clearAuth: () => set({
        token: null,
        user: null,
        isAuthenticated: false
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

#### Development Login Component
```javascript
// components/DevLogin.jsx
const DevLogin = () => {
  const { devLogin } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState('member');

  if (process.env.NODE_ENV !== 'development' || process.env.REACT_APP_SKIP_LOGIN !== 'true') {
    return null;
  }

  const handleDevLogin = () => {
    devLogin(selectedRole);
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 rounded-lg p-4">
      <h3 className="text-sm font-bold text-yellow-800 mb-2">Development Mode</h3>
      <div className="space-y-2">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full p-1 border rounded text-sm"
        >
          <option value="guest">Guest User</option>
          <option value="member">Member User</option>
          <option value="admin">Admin User</option>
        </select>
        <button
          onClick={handleDevLogin}
          className="w-full bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
        >
          Skip Login as {selectedRole}
        </button>
      </div>
    </div>
  );
};
```

#### App Component with Dev Mode
```javascript
// App.jsx
const App = () => {
  const { isAuthenticated, devLogin } = useAuthStore();
  const [showDevLogin, setShowDevLogin] = useState(false);

  useEffect(() => {
    // Auto-login in development mode
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.REACT_APP_SKIP_LOGIN === 'true' &&
      !isAuthenticated
    ) {
      const defaultRole = process.env.REACT_APP_DEV_USER_ROLE || 'member';
      devLogin(defaultRole);
    }
  }, [isAuthenticated, devLogin]);

  // Show dev login panel in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          setShowDevLogin(prev => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        {/* Development tools */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <DevLogin />
            {showDevLogin && <DevTools />}
          </>
        )}

        {/* Main app content */}
        {isAuthenticated ? (
          <AuthenticatedApp />
        ) : (
          <LoginScreen />
        )}
      </div>
    </QueryClientProvider>
  );
};
```

## File Structure & Organization

### Recommended Modern Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── hooks/               # Custom hooks
│   ├── api/             # React Query hooks
│   ├── auth/            # Authentication hooks
│   └── utils/           # Utility hooks
├── lib/                 # Third-party configurations
│   ├── axios.js         # Axios configuration
│   ├── react-query.js   # React Query setup
│   └── zalo.js          # Zalo SDK setup
├── pages/               # Page components
├── stores/              # Zustand stores
├── types/               # TypeScript types
├── utils/               # Utility functions
└── constants/           # App constants
```

### API Hooks Organization
```javascript
// hooks/api/events.js
export const useEvents = (params) => { /* ... */ };
export const useEvent = (id) => { /* ... */ };
export const useEventRegistration = () => { /* ... */ };
export const useEventTickets = (eventId) => { /* ... */ };

// hooks/api/posts.js
export const usePosts = () => { /* ... */ };
export const usePost = (id) => { /* ... */ };

// hooks/api/config.js
export const useAppConfig = () => { /* ... */ };
export const useLayoutConfig = () => { /* ... */ };
export const useMiniappConfig = () => { /* ... */ };
```

## Performance Optimizations

### React Query Optimizations
```javascript
// Prefetching critical data
const prefetchCriticalData = async () => {
  await queryClient.prefetchQuery({
    queryKey: ['appConfig'],
    queryFn: fetchAppConfig,
  });

  await queryClient.prefetchQuery({
    queryKey: ['layoutConfig'],
    queryFn: fetchLayoutConfig,
  });
};

// Background refetching
const useBackgroundSync = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['posts']);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);
};
```

### Code Splitting & Lazy Loading
```javascript
// Modern lazy loading with Suspense
const EventPage = lazy(() => import('../pages/EventPage'));
const PostPage = lazy(() => import('../pages/PostPage'));

const App = () => (
  <Suspense fallback={<PageSkeleton />}>
    <Routes>
      <Route path="/events" element={<EventPage />} />
      <Route path="/posts" element={<PostPage />} />
    </Routes>
  </Suspense>
);
```

## Development API Mocking

### Mock Service Worker (MSW) Setup
```javascript
// mocks/handlers.js
import { rest, graphql } from 'msw';
import { mockData } from './mockData';

export const handlers = [
  // Authentication bypass for development
  rest.post('/accounts/login', (req, res, ctx) => {
    if (process.env.NODE_ENV === 'development') {
      return res(
        ctx.json({
          data: {
            jwt: 'mock-jwt-token',
            user: mockData.users.admin,
            isAdmin: true,
            isMember: true
          }
        })
      );
    }
  }),

  // Events API
  rest.get('/events', (req, res, ctx) => {
    const offset = req.url.searchParams.get('offset') || 0;
    const limit = req.url.searchParams.get('limit') || 20;

    return res(
      ctx.json({
        data: {
          events: mockData.events.slice(offset, offset + limit)
        }
      })
    );
  }),

  // Posts GraphQL
  graphql.query('Posts', (req, res, ctx) => {
    return res(
      ctx.data({
        posts: mockData.posts
      })
    );
  }),

  // Layout Config GraphQL
  graphql.query('LayoutConfig', (req, res, ctx) => {
    return res(
      ctx.data({
        layoutConfig: mockData.layoutConfig
      })
    );
  }),

  // App Config
  rest.get('/api/configs', (req, res, ctx) => {
    return res(
      ctx.json({
        error: 0,
        data: mockData.appConfig
      })
    );
  }),

  // Miniapp Config
  rest.get('/miniapp', (req, res, ctx) => {
    return res(
      ctx.json({
        data: mockData.miniappConfig
      })
    );
  }),
];
```

### Mock Data Structure
```javascript
// mocks/mockData.js
export const mockData = {
  users: {
    admin: {
      id: 'admin-123',
      name: 'Admin User',
      phone: '+84123456789',
      email: 'admin@ybahcm.vn',
      isAdmin: true,
      isMember: true
    },
    member: {
      id: 'member-123',
      name: 'Member User',
      phone: '+84987654321',
      email: 'member@ybahcm.vn',
      isAdmin: false,
      isMember: true
    }
  },

  events: [
    {
      id: 'event-1',
      customFields: {
        'Sự kiện': 'YBA HCM Networking Event',
        'Thời gian tổ chức': '2024-01-15T18:00:00Z',
        'Địa điểm': 'Saigon Centre, District 1',
        'Mô tả': 'Monthly networking event for young entrepreneurs',
        'Hình ảnh': [
          {
            url: 'https://api.ybahcm.vn/uploads/event1.jpg',
            id: 'img-1'
          }
        ]
      }
    }
  ],

  posts: [
    {
      documentId: 'post-1',
      tieu_de: 'YBA HCM Monthly Update',
      noi_dung: '<p>This is the monthly update content...</p>',
      tac_gia: 'YBA Admin',
      hinh_anh_minh_hoa: [
        {
          url: 'https://api.ybahcm.vn/uploads/post1.jpg',
          name: 'post1.jpg',
          documentId: 'img-post-1'
        }
      ],
      createdAt: '2024-01-01T00:00:00Z',
      publishedAt: '2024-01-01T00:00:00Z'
    }
  ],

  layoutConfig: {
    header_background_color: '#ffffff',
    header_show_logo: true,
    header_show_title: true,
    header_text_color: '#333333',
    navigation_items: [
      {
        route: '/',
        label: 'Trang chủ',
        item_id: 'home',
        icon: 'zi-home'
      },
      {
        route: '/events',
        label: 'Sự kiện',
        item_id: 'events',
        icon: 'zi-calendar'
      }
    ],
    theme_primary_color: '#1843EF',
    theme_secondary_color: '#0E3D8A'
  },

  appConfig: {
    oaInfo: {
      id: '3947755072906987770',
      name: 'YBA HCM Official Account'
    },
    bankInfo: {
      accountNumber: '123456789',
      accountName: 'YBA HCM',
      bankName: 'BIDV'
    },
    banners: [
      {
        image: 'https://api.ybahcm.vn/uploads/banner1.jpg',
        url: '#',
        id: 'banner-1'
      }
    ]
  },

  miniappConfig: [
    {
      id: 'miniapp-1',
      customFields: {
        'Hạng mục': 'Logo',
        'Tập tin': [
          {
            id: 'logo-1',
            url: 'https://api.ybahcm.vn/uploads/logo.png',
            name: 'logo.png'
          }
        ]
      }
    }
  ]
};
```

### Development Server Setup
```javascript
// src/mocks/browser.js
import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// src/index.js
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK === 'true') {
  const { worker } = await import('./mocks/browser');
  worker.start({
    onUnhandledRequest: 'bypass',
  });
}
```

## Testing Strategy

### Component Testing with Mock Data
```javascript
// test-utils.js
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

const server = setupServer(...handlers);

export const renderWithProviders = (ui, options = {}) => {
  const testQueryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>,
    options
  );
};

// Setup MSW for tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Testing with React Query
```javascript
// test-utils.js
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export const renderWithProviders = (ui, options = {}) => {
  const testQueryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>,
    options
  );
};
```

## Development Environment Configuration

### Environment Variables
```bash
# .env.development
REACT_APP_SKIP_LOGIN=true
REACT_APP_USE_MOCK=true
REACT_APP_DEV_USER_ROLE=admin
REACT_APP_API_URL=http://localhost:3000
REACT_APP_STRAPI_URL=http://192.168.1.18:1337
REACT_APP_ENABLE_DEV_TOOLS=true

# .env.production
REACT_APP_SKIP_LOGIN=false
REACT_APP_USE_MOCK=false
REACT_APP_API_URL=https://yba.tsx.vn
REACT_APP_STRAPI_URL=http://192.168.1.18:1337
REACT_APP_ENABLE_DEV_TOOLS=false
```

### Development Shortcuts & Tools
```javascript
// components/DevTools.jsx
const DevTools = () => {
  const { clearAuth, devLogin } = useAuthStore();
  const queryClient = useQueryClient();

  const shortcuts = [
    {
      key: 'Ctrl+Shift+L',
      action: () => clearAuth(),
      description: 'Logout'
    },
    {
      key: 'Ctrl+Shift+A',
      action: () => devLogin('admin'),
      description: 'Login as Admin'
    },
    {
      key: 'Ctrl+Shift+M',
      action: () => devLogin('member'),
      description: 'Login as Member'
    },
    {
      key: 'Ctrl+Shift+C',
      action: () => queryClient.clear(),
      description: 'Clear Cache'
    },
    {
      key: 'Ctrl+Shift+R',
      action: () => queryClient.invalidateQueries(),
      description: 'Refresh All Data'
    }
  ];

  useEffect(() => {
    const handleKeyPress = (e) => {
      shortcuts.forEach(shortcut => {
        const keys = shortcut.key.split('+');
        const ctrlKey = keys.includes('Ctrl') && e.ctrlKey;
        const shiftKey = keys.includes('Shift') && e.shiftKey;
        const mainKey = keys[keys.length - 1];

        if (ctrlKey && shiftKey && e.key === mainKey) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-xs">
      <h4 className="font-bold mb-2">Dev Shortcuts</h4>
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="flex justify-between mb-1">
          <span>{shortcut.description}</span>
          <code className="bg-gray-700 px-1 rounded">{shortcut.key}</code>
        </div>
      ))}
    </div>
  );
};
```

### Quick Start Development Setup
```bash
# 1. Clone and install dependencies
git clone <repository>
cd yba-hcm-app
npm install

# 2. Setup development environment
cp .env.example .env.development
# Edit .env.development with your settings

# 3. Start with mock data (no backend required)
REACT_APP_SKIP_LOGIN=true REACT_APP_USE_MOCK=true npm start

# 4. Start with real backend (requires backend running)
REACT_APP_SKIP_LOGIN=true npm start

# 5. Start with full authentication (production-like)
npm start
```

### Development Features Summary

#### Authentication Bypass Options:
1. **Auto-login**: Automatically login with specified role on app start
2. **Dev login panel**: Manual role selection with UI panel
3. **Keyboard shortcuts**: Quick login/logout with hotkeys
4. **Mock authentication**: Bypass Zalo authentication entirely

#### API Mocking Options:
1. **Full mock mode**: All APIs mocked with MSW
2. **Partial mock**: Only authentication mocked, real APIs for data
3. **No mock**: Full production-like behavior

#### Development Tools:
1. **React Query DevTools**: Built-in query inspection
2. **Custom dev panel**: App-specific debugging tools
3. **Keyboard shortcuts**: Quick actions for common tasks
4. **Environment indicators**: Visual indicators for current mode

## Migration Steps

### Phase 1: Setup Modern Dependencies
1. Install TanStack React Query, Axios, Zustand
2. Setup Vite build configuration
3. Configure TypeScript (optional but recommended)
4. Setup MSW for development mocking

### Phase 2: Create API Layer
1. Setup Axios configuration with interceptors
2. Create base API hooks structure
3. Implement authentication hooks with dev bypass
4. Setup mock data and handlers

### Phase 3: Migrate State Management
1. Replace Recoil selectors with React Query hooks
2. Move client state to Zustand stores
3. Update components to use new hooks
4. Implement development shortcuts and tools

### Phase 4: Optimize & Test
1. Implement error boundaries
2. Add loading states and skeletons
3. Setup testing infrastructure with MSW
4. Performance optimization and caching strategies

## Key Benefits of Modern Stack

1. **Better Developer Experience**: TypeScript support, better debugging
2. **Improved Performance**: Automatic caching, background updates
3. **Reduced Boilerplate**: Less manual state management code
4. **Better Error Handling**: Centralized error management
5. **Enhanced Testing**: Better testing utilities and patterns
6. **Future-Proof**: Modern libraries with active maintenance

## Conclusion

This guide provides a comprehensive roadmap for recreating the YBA HCM mobile app with modern React patterns. The key is to maintain the same user experience while leveraging modern tools for better maintainability, performance, and developer experience.

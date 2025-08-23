import React from 'react';
import { supabase } from '../supabaseClient';
import bcrypt from 'bcryptjs';

const AUTH_STORAGE_KEY = 'mattress_admin_auth';

export class AdminAuthService {
  constructor() {
    this.currentUser = this.loadAuthState();
  }

  // Load authentication state from localStorage
  loadAuthState() {
    try {
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      console.log('loadAuthState - raw data from localStorage:', authData);
      
      if (authData) {
        const parsed = JSON.parse(authData);
        console.log('loadAuthState - parsed data:', parsed);
        
        // Check if token is expired (simple check - 24 hours)
        const now = new Date().getTime();
        const tokenAge = now - parsed.loginTime;
        console.log('loadAuthState - token age check:', { now, loginTime: parsed.loginTime, tokenAge, maxAge: 24 * 60 * 60 * 1000 });
        
        if (tokenAge < 24 * 60 * 60 * 1000) { // 24 hours
          console.log('loadAuthState - token is valid, returning user:', parsed);
          return parsed;
        } else {
          console.log('loadAuthState - token expired, clearing');
          this.clearAuthState();
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      this.clearAuthState();
    }
    console.log('loadAuthState - returning null');
    return null;
  }

  // Save authentication state to localStorage
  saveAuthState(user) {
    const authData = {
      ...user,
      loginTime: new Date().getTime()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    this.currentUser = authData;
  }

  // Clear authentication state
  clearAuthState() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.currentUser = null;
  }

  // Login with username and password
  async login(username, password) {
    try {
      console.log('Attempting login with:', { username, password });
      
      // For testing purposes, we'll use simple hardcoded auth
      // In production, this would authenticate against the admin_users table
      if (username === '123' && password === '123') {
        const user = {
          id: '1',
          username: '123',
          fullName: 'Test Admin',
          email: 'admin@mattress-configurator.com'
        };
        
        console.log('Login successful, saving user:', user);
        this.saveAuthState(user);
        console.log('Auth state saved, current user:', this.getCurrentUser());
        
        // Update last login in database (optional for testing)
        try {
          await supabase
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('username', username);
        } catch (dbError) {
          // Don't fail login if database update fails
          console.warn('Failed to update last login:', dbError);
        }
        
        return { success: true, user };
      } else {
        console.log('Login failed: incorrect credentials');
        return { success: false, error: 'Nesprávné přihlašovací údaje' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Chyba při přihlašování' };
    }
  }

  // Logout
  logout() {
    this.clearAuthState();
    return { success: true };
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Verify admin permissions (for future use)
  hasPermission(permission) {
    if (!this.isAuthenticated()) return false;
    // For now, all authenticated admins have all permissions
    return true;
  }
}

// Create singleton instance
export const adminAuth = new AdminAuthService();

// React hook for admin authentication
export const useAdminAuth = () => {
  const [user, setUser] = React.useState(adminAuth.getCurrentUser());
  const [loading, setLoading] = React.useState(false);
  const [authState, setAuthState] = React.useState(adminAuth.isAuthenticated());

  // Check for authentication changes
  React.useEffect(() => {
    const checkAuth = () => {
      const currentUser = adminAuth.getCurrentUser();
      const isAuth = adminAuth.isAuthenticated();
      
      setUser(currentUser);
      setAuthState(isAuth);
    };

    // Check auth state on mount and set up interval
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      console.log('Hook login called with:', { username, password });
      const result = await adminAuth.login(username, password);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Setting user and auth state:', result.user);
        setUser(result.user);
        setAuthState(true);
      }
      setLoading(false);
      return result;
    } catch (error) {
      console.error('Hook login error:', error);
      setLoading(false);
      return { success: false, error: 'Chyba při přihlašování' };
    }
  };

  const logout = () => {
    adminAuth.logout();
    setUser(null);
    setAuthState(false);
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: authState
  };
};

// Protected route component
export const AdminRoute = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  
  if (!isAuthenticated) {
    window.location.href = '/admin/login';
    return null;
  }
  
  return children;
};
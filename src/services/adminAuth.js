import React from 'react';
import { supabase } from '../supabaseClient';

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
        
        // Check if we have required fields
        if (!parsed.loginTime || !parsed.username) {
          console.log('loadAuthState - invalid auth data structure, clearing');
          this.clearAuthState();
          return null;
        }
        
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
      
      // Authenticate against the admin_users table
      const { data: adminUsers, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .limit(1);

      if (error) {
        console.error('Database error during login:', error);
        return { success: false, error: 'Chyba databáze při přihlašování' };
      }

      if (!adminUsers || adminUsers.length === 0) {
        return { success: false, error: 'Nesprávné přihlašovací údaje' };
      }

      const adminUser = adminUsers[0];
      
      // For now, do simple password comparison (you can upgrade to bcrypt later)
      // If the password in DB starts with $2a$ or $2b$, it's a bcrypt hash
      let passwordMatch = false;
      
      if (adminUser.password_hash.startsWith('$2a$') || adminUser.password_hash.startsWith('$2b$')) {
        // It's a bcrypt hash - call the Edge Function
        try {
          const { data: authResult, error: authError } = await supabase.functions.invoke('verify-admin-password', {
            body: { 
              hashedPassword: adminUser.password_hash, 
              plainPassword: password 
            }
          });
          
          if (authError) {
            console.error('Edge function error:', authError);
            // Fallback to basic comparison if Edge Function fails
            passwordMatch = adminUser.password_hash === password;
          } else {
            passwordMatch = authResult?.isValid || false;
          }
        } catch (err) {
          console.error('Edge function call failed:', err);
          // Fallback to basic comparison
          passwordMatch = adminUser.password_hash === password;
        }
      } else {
        // Plain text password comparison
        passwordMatch = adminUser.password_hash === password;
      }
      
      if (!passwordMatch) {
        return { success: false, error: 'Nesprávné přihlašovací údaje' };
      }

      // Login successful
      const user = {
        id: adminUser.id,
        username: adminUser.username,
        fullName: adminUser.full_name || 'Admin',
        email: adminUser.email || 'admin@mattress-configurator.com'
      };
      
      this.saveAuthState(user);
      
      // Update last login in database
      try {
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', adminUser.id);
      } catch (dbError) {
        // Don't fail login if database update fails
        console.warn('Failed to update last login:', dbError);
      }
      
      return { success: true, user };

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
      const result = await adminAuth.login(username, password);
      
      if (result.success) {
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
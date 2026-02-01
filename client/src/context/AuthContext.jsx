import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Mock User
    const [user] = useState({ name: 'Demo User', email: 'demo@example.com' });
    const [isAuthenticated] = useState(true);
    const [loading] = useState(false);

    const login = async () => ({ success: true });
    const register = async () => ({ success: true });
    const logout = () => { };

    const value = {
        user,
        token: 'mock-token',
        loading,
        isAuthenticated,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;

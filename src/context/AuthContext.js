import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({ user: null, loading: true });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');

        if (user && token) {
            setAuth({ user, loading: false });
        } else {
            setAuth({ user: null, loading: false });
        }
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setAuth({ user: userData, loading: false });
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setAuth({ user: null, loading: false });
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {!auth.loading && children}
        </AuthContext.Provider>
    );
};

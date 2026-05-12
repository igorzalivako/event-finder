import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import {profileService} from "../services/profileServise";
import {eventsService} from "../services/eventsService";
import {reviewsService} from "../services/reviewsService";
import {getUserById} from "../api/profileApi";

interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    userName: string;
    setUserName?: (newName: string) => void,
    userId: string | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    token: null,
    isAuthenticated: false,
    userId: null,

    userName: "Пользователь",
    setUserName: (newName: string) => {},
    login: () => {},
    logout: () => {},
});

// Функция для декодирования JWT токена
function decodeJWT(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Error decoding JWT:", error);
        return null;
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [userName, setUserName] = useState("Гость");
    const [userId, setUserId] = useState<string | null>(null);
    useEffect(() => {
//      Восстанавливаем токен из localStorage при загрузке
        const savedToken = localStorage.getItem("token");
        console.log(savedToken);
        if (savedToken) {
            login(savedToken);
        }

    }, []);

    const login = async (newToken: string) => {
        setToken(newToken);
        localStorage.setItem("token", newToken);

        // Декодируем JWT для получения информации о пользователе
        const decoded = decodeJWT(newToken);
        if (decoded) {
            // setUserName(decoded.name || "Пользователь");
            setUserId(decoded.profileId);
            const profile = await getUserById(decoded.profileId, newToken);
            setUserName(profile.userName || "Пользователь");
            profileService.setUserId(decoded.profileId);
            profileService.setSetterUserName(setUserName)
            console.log(decoded.profileId);
            eventsService.setCurrentUserId(decoded.profileId);
            reviewsService.setCurrentUserId(decoded.profileId);
        }
    };

    const logout = () => {
        setToken(null);
        setUserName("");
        setUserId(null);
        localStorage.removeItem("token");
        window.location.href = "/event-finder/#/login";
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                isAuthenticated: !!token,
                userName,
                setUserName,
                userId,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
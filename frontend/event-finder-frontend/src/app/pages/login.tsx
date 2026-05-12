import { useState } from "react";
import {Link, useNavigate } from "react-router-dom";
import isEmailValid from "../helpers/isEmailValid";
import { login as loginApi, forgotPassword } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { showSuccess, showError } from "../helpers/toastUtils";

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotEmailError, setForgotEmailError] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const onSubmitClick = async () => {
        let hasError = false;

        if (!email) {
            setEmailError("Введите email");
            hasError = true;
        } else if (!isEmailValid(email)) {
            setEmailError("Неверный формат email");
            hasError = true;
        } else setEmailError("");

        if (!password) {
            setPasswordError("Введите пароль");
            hasError = true;
        } else setPasswordError("");

        if (hasError) return;

        try {
            const data = await loginApi(email, password);
            login(data.token);
            showSuccess("Вы успешно вошли");
            navigate("/");
        } catch (err: any) {
            switch (err.status) {
                case 404:
                    setEmailError("Пользователь с таким email не найден");
                    break;
                case 401:
                    setPasswordError("Неверный пароль");
                    break;
                case 403:
                    showError("Email не подтверждён, пожалуйста подтвердите email");
                    navigate("/email-confirmation");
                    break;
                case 500:
                default:
                    showError("Ошибка сервера, попробуйте позже");
            }
        }
    };

    const openForgotModal = () => {
        setForgotEmail(email);
        setForgotEmailError("");
        setForgotSuccess(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setForgotEmail("");
        setForgotEmailError("");
        setForgotSuccess(false);
        setIsLoading(false);
    };

    const handleForgotSubmit = async () => {
        if (!forgotEmail) {
            setForgotEmailError("Введите email");
            return;
        }

        if (!isEmailValid(forgotEmail)) {
            setForgotEmailError("Неверный формат email");
            return;
        }

        setForgotEmailError("");
        setIsLoading(true);

        try {
            await forgotPassword(forgotEmail);
            setForgotSuccess(true);
        } catch (err: any) {
            switch (err.status) {
                case 404:
                    setForgotEmailError("Пользователь с таким email не найден");
                    break;
                case 500:
                    setForgotEmailError("Ошибка сервера, попробуйте позже");
                    break;
                default:
                    setForgotEmailError("Произошла ошибка");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-[400px] bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-medium text-center mb-4 text-[var(--primary-text-color)]">Вход</h2>
                <div className="space-y-4">
                    {/* EMAIL */}
                    <div>
                        <label className="block mb-1 text-[var(--primary-text-color)]">Логин</label>
                        <input
                            type="email"
                            value={email}
                            maxLength={100}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Введите логин..."
                            className={`w-full px-3 py-2 border rounded-md outline-none transition ${
                                emailError
                                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-1 focus:ring-indigo-500 hover:border-indigo-400"
                            }`}
                        />
                        {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
                    </div>

                    {/* PASSWORD */}
                    <div>
                        <label className="block mb-1 text-[var(--primary-text-color)]">Пароль</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                maxLength={40}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Введите пароль..."
                                className={`w-full px-3 py-2 border rounded-md outline-none transition pr-10 ${
                                    passwordError
                                        ? "border-red-500 focus:ring-1 focus:ring-red-500"
                                        : "border-gray-300 focus:ring-1 focus:ring-indigo-500 hover:border-indigo-400"
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-black"
                            >
                                {showPassword ? "🙈" : "👁"}
                            </button>
                        </div>
                        {passwordError && <p className="text-sm text-red-500 mt-1">{passwordError}</p>}
                    </div>

                    <button
                        onClick={onSubmitClick}
                        className="w-full py-2 cursor-pointer rounded-md text-white bg-[var(--primary-color)] hover:bg-[var(--primary-hover-color)] transition"
                    >
                        Войти
                    </button>

                    {/* LINKS */}
                    <div className="text-center text-sm space-y-1 pt-2">
                        <button
                            onClick={openForgotModal}
                            className="text-[var(--primary-color)] hover:text-[var(--primary-hover-color)] cursor-pointer"
                        >
                            Забыли пароль?
                        </button>
                        <p className="text-[var(--primary-text-color)]">
                            Нет аккаунта?{" "}
                            <Link to="/register" className="text-[var(--primary-color)] hover:text-[var(--primary-hover-color)] font-medium">
                                Создать аккаунт
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* MODAL OVERLAY */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-md p-6 w-[400px] relative">
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-medium mb-2 text-[var(--primary-text-color)]">
                            Восстановление пароля
                        </h3>

                        {!forgotSuccess ? (
                            <>
                                <p className="text-sm text-gray-500 mb-4">
                                    Введите email, указанный при регистрации. Мы отправим инструкцию для сброса пароля.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block mb-1 text-[var(--primary-text-color)]">Email</label>
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="Введите email..."
                                            className={`w-full px-3 py-2 border rounded-md outline-none transition ${
                                                forgotEmailError
                                                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                                                    : "border-gray-300 focus:ring-1 focus:ring-indigo-500 hover:border-indigo-400"
                                            }`}
                                        />
                                        {forgotEmailError && <p className="text-sm text-red-500 mt-1">{forgotEmailError}</p>}
                                    </div>

                                    <button
                                        onClick={handleForgotSubmit}
                                        disabled={isLoading}
                                        className={`w-full py-2 rounded-md text-white transition ${
                                            !isLoading
                                                ? "bg-[var(--primary-color)] cursor-pointer hover:bg-[var(--primary-hover-color)]"
                                                : "bg-gray-400 cursor-not-allowed"
                                        }`}
                                    >
                                        {isLoading ? "Отправка..." : "Отправить"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="mb-4 text-green-600 text-5xl">✓</div>
                                <h4 className="text-lg font-medium mb-2">Проверьте вашу почту</h4>
                                <p className="text-gray-600 text-sm mb-4">
                                    Мы отправили инструкцию для сброса пароля на {forgotEmail}
                                </p>
                                <button
                                    onClick={closeModal}
                                    className="text-[var(--primary-color)] hover:underline font-medium"
                                >
                                    Закрыть
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
// resources/js/app.jsx
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
// import './index.css'
import { Clock, User, LogOut, BookOpen, Award, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// API Service
const API_URL = '/api';

const api = {
    register: async (userData) => {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed');
        return data;
    },

    login: async (email, password) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');
        return data;
    },

    logout: async (token) => {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        return await response.json();
    },

    getQuestions: async (token) => {
        const response = await fetch(`${API_URL}/questions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Failed to load questions');
        return data;
    },

    startExam: async (token) => {
        const response = await fetch(`${API_URL}/exam/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Failed to start exam');
        return data;
    },

    submitExam: async (token, examId, answers) => {
        const response = await fetch(`${API_URL}/exam/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ exam_id: examId, answers })
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Failed to submit exam');
        return data;
    },

    getExamHistory: async (token) => {
        const response = await fetch(`${API_URL}/exam/history`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Failed to load history');
        return data;
    }
};

const CPNSExamSystem = () => {
    const [currentPage, setCurrentPage] = useState('login');
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [examState, setExamState] = useState({
        isActive: false,
        examId: null,
        currentQuestion: 0,
        answers: {},
        timeRemaining: 3600,
        startTime: null
    });
    const [examResults, setExamResults] = useState(null);
    const [examHistory, setExamHistory] = useState([]);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [registerForm, setRegisterForm] = useState({
        name: '',
        email: '',
        password: '',
        nik: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setCurrentUser(JSON.parse(savedUser));
            setCurrentPage('dashboard');
            loadExamHistory(savedToken);
        }
    }, []);

    // Timer countdown
    useEffect(() => {
        let interval;
        if (examState.isActive && examState.timeRemaining > 0) {
            interval = setInterval(() => {
                setExamState(prev => ({
                    ...prev,
                    timeRemaining: prev.timeRemaining - 1
                }));
            }, 1000);
        } else if (examState.isActive && examState.timeRemaining === 0) {
            handleSubmitExam();
        }
        return () => clearInterval(interval);
    }, [examState.isActive, examState.timeRemaining]);

    const loadExamHistory = async (authToken) => {
        try {
            const result = await api.getExamHistory(authToken);
            if (result.success) {
                setExamHistory(result.data);
            }
        } catch (err) {
            console.error('Failed to load exam history:', err);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await api.login(loginForm.email, loginForm.password);
            
            if (result.success) {
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                setToken(result.data.token);
                setCurrentUser(result.data.user);
                setCurrentPage('dashboard');
                setLoginForm({ email: '', password: '' });
                loadExamHistory(result.data.token);
            }
        } catch (err) {
            setError(err.message || 'Login gagal');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await api.register(registerForm);
            
            if (result.success) {
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                setToken(result.data.token);
                setCurrentUser(result.data.user);
                setCurrentPage('dashboard');
                setRegisterForm({ name: '', email: '', password: '', nik: '', phone: '' });
                loadExamHistory(result.data.token);
            }
        } catch (err) {
            setError(err.message || 'Registrasi gagal');
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = async () => {
        setLoading(true);
        setError('');

        try {
            // Start exam in backend
            const examResult = await api.startExam(token);
            
            if (examResult.success) {
                // Load questions from database
                const questionsResult = await api.getQuestions(token);
                
                if (questionsResult.success) {
                    setQuestions(questionsResult.data);
                    setExamState({
                        isActive: true,
                        examId: examResult.data.exam_id,
                        currentQuestion: 0,
                        answers: {},
                        timeRemaining: 3600,
                        startTime: examResult.data.started_at
                    });
                    setExamResults(null);
                    setCurrentPage('exam');
                }
            }
        } catch (err) {
            setError(err.message || 'Gagal memulai ujian');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (questionId, answerIndex) => {
        setExamState(prev => ({
            ...prev,
            answers: {
                ...prev.answers,
                [questionId]: answerIndex
            }
        }));
    };

    const handleSubmitExam = async () => {
        if (!examState.examId) return;

        setLoading(true);
        setError('');

        try {
            const result = await api.submitExam(token, examState.examId, examState.answers);
            
            if (result.success) {
                setExamResults(result.data.results);
                setExamState(prev => ({ ...prev, isActive: false }));
                setCurrentPage('results');
                loadExamHistory(token);
            }
        } catch (err) {
            setError(err.message || 'Gagal submit ujian');
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.logout(token);
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setCurrentUser(null);
            setCurrentPage('login');
            setExamState({
                isActive: false,
                examId: null,
                currentQuestion: 0,
                answers: {},
                timeRemaining: 3600,
                startTime: null
            });
            setExamResults(null);
            setExamHistory([]);
        }
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Login Page
    if (currentPage === 'login') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-md mx-auto">
                        <div className="text-center mb-8">
                            <div className="inline-block p-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-full mb-4">
                                <BookOpen className="w-12 h-12 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sistem Ujian CPNS</h1>
                            <p className="text-gray-600">Computer Assisted Test - Tes Kompetensi Dasar</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={loginForm.email}
                                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={loginForm.password}
                                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all"
                                >
                                    Masuk
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-gray-600">
                                    Belum punya akun?{' '}
                                    <button
                                        onClick={() => {
                                            setCurrentPage('register');
                                            setError('');
                                        }}
                                        className="text-blue-600 font-semibold hover:text-blue-700"
                                    >
                                        Daftar di sini
                                    </button>
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p>Demo Account: demo@cpns.id / password123</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Register Page
    if (currentPage === 'register') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-md mx-auto">
                        <div className="text-center mb-8">
                            <div className="inline-block p-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-full mb-4">
                                <User className="w-12 h-12 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Pendaftaran Peserta</h1>
                            <p className="text-gray-600">Lengkapi data diri Anda</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Daftar Akun</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={registerForm.name}
                                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nama Lengkap"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">NIK</label>
                                    <input
                                        type="text"
                                        value={registerForm.nik}
                                        onChange={(e) => setRegisterForm({ ...registerForm, nik: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="16 digit NIK"
                                        maxLength="16"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={registerForm.email}
                                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
                                    <input
                                        type="tel"
                                        value={registerForm.phone}
                                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="08xxxxxxxxxx"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={registerForm.password}
                                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Minimal 6 karakter"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all"
                                >
                                    Daftar
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-gray-600">
                                    Sudah punya akun?{' '}
                                    <button
                                        onClick={() => {
                                            setCurrentPage('login');
                                            setError('');
                                        }}
                                        className="text-blue-600 font-semibold hover:text-blue-700"
                                    >
                                        Login di sini
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard Page
    if (currentPage === 'dashboard') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-800">Sistem Ujian CPNS</h1>
                                    <p className="text-sm text-gray-600">Computer Assisted Test</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Keluar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Welcome Card */}
                        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-xl p-8 text-white mb-8">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">Selamat Datang, {currentUser.name}!</h2>
                                    <p className="text-blue-100 mb-4">NIK: {currentUser.nik}</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="w-4 h-4" />
                                        <span>{currentUser.email}</span>
                                    </div>
                                </div>
                                <div className="bg-white/20 rounded-lg p-4">
                                    <Award className="w-12 h-12" />
                                </div>
                            </div>
                        </div>

                        {/* Exam Info */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Total Soal</h3>
                                </div>
                                <p className="text-3xl font-bold text-gray-800">{examQuestions.length}</p>
                                <p className="text-sm text-gray-600 mt-1">Soal TKD</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Clock className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Durasi</h3>
                                </div>
                                <p className="text-3xl font-bold text-gray-800">60</p>
                                <p className="text-sm text-gray-600 mt-1">Menit</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Award className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-800">Passing Grade</h3>
                                </div>
                                <p className="text-3xl font-bold text-gray-800">65%</p>
                                <p className="text-sm text-gray-600 mt-1">Minimal nilai lulus</p>
                            </div>
                        </div>

                        {/* Exam Instructions */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Petunjuk Ujian</h3>
                            <div className="space-y-3 text-gray-700">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-blue-600 font-bold text-sm">1</span>
                                    </div>
                                    <p>Ujian terdiri dari 3 kategori: TWK (Tes Wawasan Kebangsaan), TIU (Tes Intelegensia Umum), dan TKP (Tes Karakteristik Pribadi)</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-blue-600 font-bold text-sm">2</span>
                                    </div>
                                    <p>Waktu pengerjaan adalah 60 menit untuk {examQuestions.length} soal</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-blue-600 font-bold text-sm">3</span>
                                    </div>
                                    <p>Pilih salah satu jawaban yang paling tepat untuk setiap soal</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-blue-600 font-bold text-sm">4</span>
                                    </div>
                                    <p>Anda dapat mengubah jawaban sebelum waktu habis atau sebelum menekan tombol "Selesai Ujian"</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-red-600 font-bold text-sm">!</span>
                                    </div>
                                    <p className="font-semibold text-red-600">Timer akan berjalan otomatis saat Anda memulai ujian. Ujian akan otomatis selesai jika waktu habis!</p>
                                </div>
                            </div>
                        </div>

                        {/* Start Button */}
                        <button
                            onClick={handleStartExam}
                            className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            Mulai Ujian
                        </button>

                        {/* Exam History */}
                        {currentUser.examHistory && currentUser.examHistory.length > 0 && (
                            <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
                                <h3 className="text-2xl font-bold text-gray-800 mb-6">Riwayat Ujian</h3>
                                <div className="space-y-4">
                                    {currentUser.examHistory.slice(-5).reverse().map((exam, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600">
                                                    {new Date(exam.date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${exam.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {exam.passed ? 'LULUS' : 'TIDAK LULUS'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-2xl font-bold text-gray-800">{exam.percentage}%</div>
                                                <div className="text-sm text-gray-600">
                                                    {exam.correct} dari {exam.total} benar
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Exam Page
    if (currentPage === 'exam') {
        const currentQ = examQuestions[examState.currentQuestion];
        const progress = ((examState.currentQuestion + 1) / examQuestions.length) * 100;
        const answeredCount = Object.keys(examState.answers).length;

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
                {/* Header */}
                <div className="bg-white shadow-md border-b sticky top-0 z-10">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-800">Ujian CPNS - {currentUser.name}</h1>
                                    <p className="text-sm text-gray-600">Kategori: {currentQ.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Waktu Tersisa</p>
                                    <div className="flex items-center gap-2">
                                        <Clock className={`w-5 h-5 ${examState.timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`} />
                                        <span className={`text-xl font-bold ${examState.timeRemaining < 300 ? 'text-red-600' : 'text-gray-800'}`}>
                                            {formatTime(examState.timeRemaining)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white border-b">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Soal {examState.currentQuestion + 1} dari {examQuestions.length}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                                Terjawab: {answeredCount}/{examQuestions.length}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Question Content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">{examState.currentQuestion + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-3">
                                        {currentQ.category}
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800 leading-relaxed">
                                        {currentQ.question}
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {currentQ.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswerSelect(currentQ.id, idx)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${examState.answers[currentQ.id] === idx
                                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold ${examState.answers[currentQ.id] === idx
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="text-gray-800">{option}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={() => setExamState(prev => ({
                                    ...prev,
                                    currentQuestion: Math.max(0, prev.currentQuestion - 1)
                                }))}
                                disabled={examState.currentQuestion === 0}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                ← Sebelumnya
                            </button>

                            <div className="flex gap-2">
                                {examQuestions.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setExamState(prev => ({ ...prev, currentQuestion: idx }))}
                                        className={`w-10 h-10 rounded-lg font-semibold transition-all ${idx === examState.currentQuestion
                                                ? 'bg-blue-600 text-white'
                                                : examState.answers[examQuestions[idx].id] !== undefined
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>

                            {examState.currentQuestion < examQuestions.length - 1 ? (
                                <button
                                    onClick={() => setExamState(prev => ({
                                        ...prev,
                                        currentQuestion: Math.min(examQuestions.length - 1, prev.currentQuestion + 1)
                                    }))}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all"
                                >
                                    Selanjutnya →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmitExam}
                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all"
                                >
                                    Selesai Ujian ✓
                                </button>
                            )}
                        </div>

                        {/* Submit Warning */}
                        {answeredCount < examQuestions.length && (
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-semibold mb-1">Perhatian!</p>
                                        <p>Anda masih memiliki {examQuestions.length - answeredCount} soal yang belum dijawab. Pastikan semua soal sudah dijawab sebelum menyelesaikan ujian.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Results Page
    if (currentPage === 'results' && examResults) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-800">Hasil Ujian CPNS</h1>
                                    <p className="text-sm text-gray-600">Computer Assisted Test</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Keluar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Result Header */}
                        <div className={`rounded-2xl shadow-xl p-8 mb-8 ${examResults.passed
                                ? 'bg-gradient-to-r from-green-600 to-blue-600'
                                : 'bg-gradient-to-r from-red-600 to-orange-600'
                            } text-white`}>
                            <div className="text-center">
                                <div className="inline-block p-4 bg-white/20 rounded-full mb-4">
                                    {examResults.passed ? (
                                        <CheckCircle className="w-16 h-16" />
                                    ) : (
                                        <XCircle className="w-16 h-16" />
                                    )}
                                </div>
                                <h2 className="text-4xl font-bold mb-2">
                                    {examResults.passed ? 'SELAMAT!' : 'BELUM LULUS'}
                                </h2>
                                <p className="text-xl mb-6">
                                    {examResults.passed
                                        ? 'Anda telah lulus ujian CPNS'
                                        : 'Anda belum memenuhi passing grade'}
                                </p>
                                <div className="bg-white/20 rounded-xl p-6 inline-block">
                                    <p className="text-sm mb-2">Nilai Anda</p>
                                    <p className="text-6xl font-bold">{examResults.percentage}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Score Details */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Ringkasan Hasil</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Jawaban Benar</span>
                                        <span className="font-bold text-green-600 text-xl">{examResults.correct}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Jawaban Salah</span>
                                        <span className="font-bold text-red-600 text-xl">{examResults.total - examResults.correct}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Total Soal</span>
                                        <span className="font-bold text-gray-800 text-xl">{examResults.total}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Passing Grade</span>
                                            <span className="font-bold text-blue-600">65%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Skor Per Kategori</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">TWK (Wawasan Kebangsaan)</span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {examResults.twk.score}/{examResults.twk.total}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${(examResults.twk.score / examResults.twk.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">TIU (Intelegensia Umum)</span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {examResults.tiu.score}/{examResults.tiu.total}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded-full transition-all"
                                                style={{ width: `${(examResults.tiu.score / examResults.tiu.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">TKP (Karakteristik Pribadi)</span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {examResults.tkp.score}/{examResults.tkp.total}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full transition-all"
                                                style={{ width: `${(examResults.tkp.score / examResults.tkp.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Review Answers */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Review Jawaban</h3>
                            <div className="space-y-6">
                                {examQuestions.map((q, idx) => {
                                    const userAnswer = examState.answers[q.id];
                                    const isCorrect = userAnswer === q.correctAnswer;

                                    return (
                                        <div key={q.id} className={`border-l-4 pl-6 py-4 ${isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                                            }`}>
                                            <div className="flex items-start gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-green-600' : 'bg-red-600'
                                                    }`}>
                                                    {isCorrect ? (
                                                        <CheckCircle className="w-5 h-5 text-white" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-bold text-gray-800">Soal {idx + 1}</span>
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                                            {q.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-800 mb-3">{q.question}</p>

                                                    <div className="space-y-2">
                                                        {q.options.map((option, optIdx) => (
                                                            <div
                                                                key={optIdx}
                                                                className={`p-3 rounded-lg ${optIdx === q.correctAnswer
                                                                        ? 'bg-green-100 border border-green-300'
                                                                        : optIdx === userAnswer && !isCorrect
                                                                            ? 'bg-red-100 border border-red-300'
                                                                            : 'bg-white border border-gray-200'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-gray-700">
                                                                        {String.fromCharCode(65 + optIdx)}.
                                                                    </span>
                                                                    <span className="text-gray-800">{option}</span>
                                                                    {optIdx === q.correctAnswer && (
                                                                        <span className="ml-auto text-green-700 text-sm font-semibold">✓ Jawaban Benar</span>
                                                                    )}
                                                                    {optIdx === userAnswer && !isCorrect && (
                                                                        <span className="ml-auto text-red-700 text-sm font-semibold">✗ Jawaban Anda</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setCurrentPage('dashboard')}
                                className="flex-1 bg-white border-2 border-blue-600 text-blue-600 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all"
                            >
                                Kembali ke Dashboard
                            </button>
                            <button
                                onClick={handleStartExam}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-green-700 transition-all"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

const root = createRoot(document.getElementById('root'));
root.render(<CPNSExamSystem />);
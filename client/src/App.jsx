import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { BehaviorProvider } from './context/BehaviorContext';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import NewApplication from './pages/NewApplication';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';

// Layout
import Layout from './components/Layout/Layout';

// Layout wrapper for dashboard pages
const DashboardLayout = () => {
    return (
        <Layout />
    );
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />

            {/* Dashboard Routes - Now Public */}
            <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/application/new" element={<NewApplication />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/application/:id" element={<ApplicationDetail />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <BehaviorProvider>
                    <AppRoutes />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#fff',
                                color: '#1F2937',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10B981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#EF4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </BehaviorProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;

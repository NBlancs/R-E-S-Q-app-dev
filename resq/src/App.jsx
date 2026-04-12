import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './login/Login'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import IncidentMap from './pages/IncidentMap'
import CameraFeed from './pages/CameraFeed'
import CameraList from './pages/CameraList';
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import dashboardData from './data/dashboardData.json'
import {
    clearAuthSession,
    fetchProfile,
    getAuthToken,
    getStoredUser,
    setAuthSession,
} from './services/api'
import './dashboard/Dashboard.css'
import './App.css'

const RoleRoute = ({ allowedRoles, currentRole, fallbackPath, children }) => {
    if (!allowedRoles.includes(currentRole)) {
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [alerts, setAlerts] = useState(dashboardData.alerts);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const restoreSession = async () => {
            const token = getAuthToken();
            const storedUser = getStoredUser();

            if (!token || !storedUser) {
                if (isMounted) {
                    setIsAuthChecking(false);
                }
                return;
            }

            try {
                const profile = await fetchProfile();

                if (!isMounted) {
                    return;
                }

                const mergedUser = {
                    ...storedUser,
                    ...profile,
                };

                setAuthSession({ token, user: mergedUser });
                setCurrentUser(mergedUser);
                setIsLoggedIn(true);
            } catch {
                clearAuthSession();
                if (isMounted) {
                    setCurrentUser(null);
                    setIsLoggedIn(false);
                }
            } finally {
                if (isMounted) {
                    setIsAuthChecking(false);
                }
            }
        };

        restoreSession();

        return () => {
            isMounted = false;
        };
    }, []);

    const fallbackPath = currentUser?.role === 'bfp' ? '/bfp' : '/overview';

    const handleLogin = (user) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        clearAuthSession();
        setCurrentUser(null);
        setIsLoggedIn(false);
    };

    const handleAcknowledgeAlert = (id) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    };

    const handleUserUpdated = (updatedUser) => {
        setCurrentUser(updatedUser);
    };

    if (isAuthChecking) {
        return <div className="app-shell-loading">Loading session...</div>;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route 
                    path="/" 
                    element={
                        isLoggedIn ? (
                            <Navigate to={fallbackPath} replace />
                        ) : (
                            <LoginPage onLogin={handleLogin} />
                        )
                    } 
                />
                <Route 
                    element={
                        isLoggedIn ? (
                            <Layout
                                onLogout={handleLogout}
                                alerts={alerts}
                                onAcknowledgeAlert={handleAcknowledgeAlert}
                                roleLabel={currentUser?.role === 'bfp' ? 'BFP' : 'Admin'}
                                userAvatar={currentUser?.avatar || ''}
                                canAcknowledgeAlerts={currentUser?.role !== 'bfp'}
                                navItems={
                                    currentUser?.role === 'bfp'
                                        ? [
                                            { to: '/bfp', label: 'Incidents Map' },
                                        ]
                                        : [
                                            { to: '/overview', label: 'Overview' },
                                            { to: '/camera-feed', label: 'Camera Feed' },
                                            { to: '/camera-list', label: 'Camera List' },
                                            { to: '/reports', label: 'Reports' },
                                        ]
                                }
                            />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                >
                    <Route
                        path="/overview"
                        element={
                            <RoleRoute allowedRoles={['admin']} currentRole={currentUser?.role} fallbackPath={fallbackPath}>
                                <Overview />
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/camera-feed"
                        element={
                            <RoleRoute allowedRoles={['admin']} currentRole={currentUser?.role} fallbackPath={fallbackPath}>
                                <CameraFeed />
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/camera-list"
                        element={
                            <RoleRoute allowedRoles={['admin']} currentRole={currentUser?.role} fallbackPath={fallbackPath}>
                                <CameraList />
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/reports"
                        element={
                            <RoleRoute allowedRoles={['admin']} currentRole={currentUser?.role} fallbackPath={fallbackPath}>
                                <Reports />
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/bfp"
                        element={
                            <RoleRoute allowedRoles={['bfp']} currentRole={currentUser?.role} fallbackPath={fallbackPath}>
                                <IncidentMap />
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={<Profile onUserUpdated={handleUserUpdated} />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App

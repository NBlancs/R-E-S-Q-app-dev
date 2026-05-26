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
    acknowledgeAlert,
    dismissAlert,
    clearAuthSession,
    fetchAlerts,
    fetchProfile,
    getAuthToken,
    getStoredUser,
    markAlertUnread,
    recordFireDetectionEvent,
    setAuthSession,
} from './services/api'
import { toFrontendAlert } from './services/mappers'
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
    const [alertsSource, setAlertsSource] = useState('demo');
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    const replaceAlertInState = (updatedAlert) => {
        if (!updatedAlert) {
            return;
        }

        setAlerts((previous) => {
            const nextAlert = toFrontendAlert(updatedAlert);
            const filtered = previous.filter((alert) => alert.backendId !== nextAlert.backendId);
            return [nextAlert, ...filtered];
        });
    };

    const loadAlerts = async (isMounted) => {
        if (!isLoggedIn) {
            if (isMounted) {
                setAlerts(dashboardData.alerts);
                setAlertsSource('demo');
            }

            return;
        }

        try {
            const response = await fetchAlerts();
            const nextAlerts = Array.isArray(response) ? response.map(toFrontendAlert) : [];

            if (!isMounted) {
                return;
            }

            setAlerts(nextAlerts);
            setAlertsSource('api');
        } catch {
            if (isMounted) {
                setAlerts(dashboardData.alerts);
                setAlertsSource('demo');
            }
        }
    };

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

    useEffect(() => {
        let isMounted = true;

        loadAlerts(isMounted);

        return () => {
            isMounted = false;
        };
    }, [isLoggedIn]);

    const fallbackPath = currentUser?.role === 'bfp' ? '/bfp' : '/overview';

    const handleLogin = (user) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        clearAuthSession();
        setCurrentUser(null);
        setIsLoggedIn(false);
        setAlerts(dashboardData.alerts);
        setAlertsSource('demo');
    };

    const handleMarkAlertRead = async (id) => {
        if (alertsSource === 'api') {
            try {
                const updatedAlert = await acknowledgeAlert(id);
                replaceAlertInState(updatedAlert);
                return;
            } catch {
                // Keep the UI responsive even if the API is temporarily unavailable.
            }
        }

        setAlerts((prev) => prev.map((alert) => (
            alert.id === id ? { ...alert, isRead: true } : alert
        )));
    };

    const handleMarkAlertUnread = async (id) => {
        if (alertsSource === 'api') {
            try {
                const updatedAlert = await markAlertUnread(id);
                replaceAlertInState(updatedAlert);
                return;
            } catch {
                // Keep the UI responsive even if the API is temporarily unavailable.
            }
        }

        setAlerts((prev) => prev.map((alert) => (
            alert.id === id ? { ...alert, isRead: false } : alert
        )));
    };

    const handleDismissAlert = async (id) => {
        if (alertsSource === 'api') {
            try {
                const updatedAlert = await dismissAlert(id);
                replaceAlertInState(updatedAlert);
                return;
            } catch {
                // Keep the UI responsive even if the API is temporarily unavailable.
            }
        }

        setAlerts((prev) => prev.map((alert) => (
            alert.id === id ? { ...alert, isDismissed: true, isRead: true } : alert
        )));
    };

    const handleFireDetected = async (payload) => {
        if (!isLoggedIn) {
            return;
        }

        try {
            const response = await recordFireDetectionEvent(payload);

            if (response?.alert) {
                replaceAlertInState(response.alert);
                setAlertsSource('api');
            }
        } catch {
            // The camera panel already surfaces the failure if persistence is unavailable.
        }
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
                                onMarkAlertRead={handleMarkAlertRead}
                                onMarkAlertUnread={handleMarkAlertUnread}
                                onDismissAlert={handleDismissAlert}
                                roleLabel={currentUser?.role === 'bfp' ? 'BFP' : 'Admin'}
                                userAvatar={currentUser?.avatar || ''}
                                canDismissAlerts={currentUser?.role !== 'bfp'}
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
                                <CameraFeed onFireDetected={handleFireDetected} />
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

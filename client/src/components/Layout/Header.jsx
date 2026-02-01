import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getInitials, classNames } from '../../utils/helpers';

const Header = ({ title }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    // Sample notifications
    const [notifications, setNotifications] = useState([
        { id: 1, text: 'New application submitted', time: '2 min ago', read: false },
        { id: 2, text: 'Application APP-1234 approved', time: '1 hour ago', read: false },
        { id: 3, text: 'Document verification complete', time: '3 hours ago', read: true },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const clearNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100">
            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowProfile(false);
                            }}
                            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-gray-500">
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={classNames(
                                                    'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
                                                    !notif.read && 'bg-primary-50/50'
                                                )}
                                            >
                                                <div className={classNames(
                                                    'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                                                    notif.read ? 'bg-gray-300' : 'bg-primary-500'
                                                )}></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900">{notif.text}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                                                </div>
                                                <button
                                                    onClick={() => clearNotification(notif.id)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => {
                                setShowProfile(!showProfile);
                                setShowNotifications(false);
                            }}
                            className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg py-1 pr-2 transition-colors"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {user?.email || 'user@example.com'}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-white">
                                        {getInitials(user?.name)}
                                    </span>
                                )}
                            </div>
                            <ChevronDown size={16} className={classNames(
                                'text-gray-400 transition-transform',
                                showProfile && 'rotate-180'
                            )} />
                        </button>

                        {/* Profile Dropdown */}
                        {showProfile && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="font-semibold text-gray-900">{user?.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                                </div>
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            setShowProfile(false);
                                            navigate('/dashboard');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <User size={18} />
                                        My Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProfile(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Settings size={18} />
                                        Settings
                                    </button>
                                </div>
                                <div className="border-t border-gray-100 py-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-danger-600 hover:bg-danger-50 transition-colors"
                                    >
                                        <LogOut size={18} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

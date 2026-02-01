import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FilePlus,
    FileText,
    LogOut,
    Shield,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { classNames } from '../../utils/helpers';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    // const { logout } = useAuth(); // Unused
    // const navigate = useNavigate(); // Unused

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'New Application', path: '/application/new', icon: FilePlus },
        { name: 'Applications', path: '/applications', icon: FileText },
    ];

    /* const handleLogout = () => {
        logout();
        navigate('/login');
    }; */

    return (
        <aside
            className={classNames(
                'fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary-500 rounded-lg">
                        <Shield size={24} className="text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="font-bold text-gray-900">KYC Fraud Shield</h1>
                            <p className="text-xs text-gray-500">Identity Verification</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                classNames(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-50 text-primary-600 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )
                            }
                        >
                            <item.icon size={20} />
                            {!collapsed && <span>{item.name}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout Button Removed - No Auth Mode */}
                {/* <div className="px-3 py-4 border-t border-gray-100">...</div> */}

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

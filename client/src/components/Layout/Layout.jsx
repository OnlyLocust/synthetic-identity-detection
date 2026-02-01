import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ title = 'Dashboard' }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            <div className="pl-64 transition-all duration-300">
                <Header title={title} />

                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;


import React, { useState, FC } from 'react';
import { DataContext, useData } from './hooks/useData';
import { mockPractices, mockUsers, mockLdapConfig, mockRoles } from './data/mockData';
import { Practice, User, LdapConfig, Role } from './types';
import Dashboard from './components/Dashboard';
import PracticesExplorer from './components/PracticesExplorer';
import Users from './components/Users';
import Authentication from './components/Authentication';
import Login from './components/Login';
import RoleManagement from './components/RoleManagement';
import { HomeIcon, FolderIcon, UsersIcon, KeyIcon, ArrowLeftOnRectangleIcon, UserCircleIcon, ShieldCheckIcon } from './components/Icons';

const NavItem: FC<{ id: string; label: string; icon: React.FC<{className?: string}>; activeView: string; setActiveView: (view: string) => void }> = ({ id, label, icon: IconComponent, activeView, setActiveView }) => {
    const isActive = activeView === id;
    return (
        <button
            onClick={() => setActiveView(id)}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
            <IconComponent className="w-5 h-5 mr-3" />
            {label}
        </button>
    );
};

const Sidebar: FC<{ activeView: string; setActiveView: (view: string) => void; handleLogout: () => void }> = ({ activeView, setActiveView, handleLogout }) => {
    const { currentUser, roles } = useData();

    const userRole = currentUser ? roles.find(r => r.id === currentUser.roleId) : null;

    const navItems = [
        { id: 'dashboard', label: 'Panel de Control', icon: HomeIcon },
        { id: 'practices', label: 'Explorador de Prácticas', icon: FolderIcon },
    ];
    
    const adminNavItems = [];
    if (userRole?.permissions.canViewUsers) {
        adminNavItems.push({ id: 'users', label: 'Usuarios', icon: UsersIcon });
    }
    if (userRole?.permissions.canViewRoleManagement) {
        adminNavItems.push({ id: 'roles', label: 'Roles', icon: ShieldCheckIcon });
    }
    if (userRole?.permissions.canViewAuthSettings) {
        adminNavItems.push({ id: 'authentication', label: 'Autenticación', icon: KeyIcon });
    }


    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
                <h1 className="text-2xl font-bold text-indigo-600">OPERTI</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map(item => (
                    <NavItem key={item.id} {...item} activeView={activeView} setActiveView={setActiveView} />
                ))}
                 {adminNavItems.length > 0 && (
                    <>
                        <div className="pt-4 mt-4 border-t border-gray-200">
                            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
                        </div>
                        <div className="mt-2 space-y-2">
                            {adminNavItems.map(item => (
                                <NavItem key={item.id} {...item} activeView={activeView} setActiveView={setActiveView} />
                            ))}
                        </div>
                    </>
                )}
            </nav>
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                    <div>
                        <p className="font-semibold text-sm text-gray-800 truncate">{currentUser?.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md py-2">
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};


const App: React.FC = () => {
    const [practices, setPractices] = useState<Practice[]>(mockPractices);
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [roles, setRoles] = useState<Role[]>(mockRoles);
    const [ldapConfig, setLdapConfig] = useState<LdapConfig>(mockLdapConfig);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeView, setActiveView] = useState<string>('dashboard');

    const handleLogout = () => {
        setCurrentUser(null);
        setActiveView('dashboard');
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard />;
            case 'practices':
                return <PracticesExplorer />;
            case 'users':
                return <Users />;
            case 'roles':
                return <RoleManagement />;
            case 'authentication':
                return <Authentication />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <DataContext.Provider value={{ practices, setPractices, users, setUsers, roles, setRoles, currentUser, ldapConfig, setLdapConfig }}>
            {!currentUser ? (
                <Login onLogin={setCurrentUser} />
            ) : (
                <div className="flex h-screen bg-gray-100 font-sans">
                    <Sidebar activeView={activeView} setActiveView={setActiveView} handleLogout={handleLogout} />
                    <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                        {renderView()}
                    </main>
                </div>
            )}
        </DataContext.Provider>
    );
};

export default App;

import React, { useState } from 'react';
import { User, AuthType } from '../types';
import Card from './ui/Card';
import { useData } from '../hooks/useData';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { users, ldapConfig } = useData();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (!user) {
            setError('Usuario o contraseña incorrectos.');
            return;
        }

        if (user.authType === AuthType.LOCAL) {
            if (user.password === password) {
                onLogin(user);
            } else {
                setError('Usuario o contraseña incorrectos.');
            }
        } else if (user.authType === AuthType.LDAP) {
            if (!ldapConfig.enabled) {
                setError('La autenticación por Directorio Activo está deshabilitada.');
                return;
            }
            // Mock LDAP: For this prototype, we just check if a password was provided.
            if (password) {
                console.log(`Simulating LDAP login for ${user.username}`);
                onLogin(user);
            } else {
                setError('Se requiere contraseña para la autenticación de Directorio Activo.');
            }
        } else {
            setError('Tipo de autenticación de usuario desconocido.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md">
                <Card>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-indigo-600">OPERTI</h1>
                        <p className="mt-2 text-sm text-gray-600">Iniciar sesión en su cuenta</p>
                    </div>
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="username" className="text-sm font-medium text-gray-700">
                                Nombre de usuario
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="p. ej. jdoe"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="********"
                            />
                        </div>
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Iniciar sesión
                            </button>
                        </div>
                    </form>
                     <div className="text-center text-xs text-gray-500 mt-6 border-t pt-4">
                        <p className="font-semibold">Usuarios de prueba:</p>
                        <p><span className="font-medium">admin</span> (Pass: admin)</p>
                        <p><span className="font-medium">msmith</span> (Pass: password123)</p>
                        <p><span className="font-medium">jdoe</span> (AD - cualquier contraseña)</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Login;
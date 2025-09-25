import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { LdapConfig } from '../types';
import Card from './ui/Card';

const Authentication: React.FC = () => {
    const { ldapConfig, setLdapConfig } = useData();
    const [formData, setFormData] = useState<LdapConfig>(ldapConfig);

    useEffect(() => {
        setFormData(ldapConfig);
    }, [ldapConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSave = () => {
        setLdapConfig(formData);
        alert('Configuración guardada exitosamente.');
    };

    const handleTestConnection = () => {
        // En una aplicación real, aquí se haría una llamada al backend
        alert('Prueba de conexión simulada... ¡Éxito! (funcionalidad no implementada en prototipo)');
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-xl font-semibold">Configuración de Autenticación LDAP</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestiona la conexión a un servidor LDAP para la autenticación de usuarios.
                    </p>
                </div>
                
                <div className="space-y-8">
                    {/* --- Estado de la Configuración --- */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Estado de la Configuración</h3>
                        <div className="mt-4 flex items-center">
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="enabled"
                                    checked={formData.enabled}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-900">
                                    {formData.enabled ? 'Autenticación LDAP Habilitada' : 'Autenticación LDAP Deshabilitada'}
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    {formData.enabled && (
                        <>
                            {/* --- Conexión del Servidor --- */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Conexión del Servidor</h3>
                                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="serverUrl" className="block text-sm font-medium text-gray-700">URL del Servidor LDAP</label>
                                        <input type="text" name="serverUrl" id="serverUrl" value={formData.serverUrl} onChange={handleChange} placeholder="ldap://ldap.example.com:389" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="baseDN" className="block text-sm font-medium text-gray-700">Base DN</label>
                                        <input type="text" name="baseDN" id="baseDN" value={formData.baseDN} onChange={handleChange} placeholder="dc=example,dc=com" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                                    </div>
                                     <div>
                                        <label htmlFor="bindDN" className="block text-sm font-medium text-gray-700">Bind DN</label>
                                        <input type="text" name="bindDN" id="bindDN" value={formData.bindDN} onChange={handleChange} placeholder="cn=admin,dc=example,dc=com" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                                    </div>
                                    <div>
                                        <label htmlFor="bindPassword" className="block text-sm font-medium text-gray-700">Bind Password</label>
                                        <input type="password" name="bindPassword" id="bindPassword" value={formData.bindPassword} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                                    </div>
                                </div>
                            </div>

                            {/* --- Esquema de Usuario --- */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Esquema de Usuario</h3>
                                 <div className="mt-4">
                                    <label htmlFor="userSearchFilter" className="block text-sm font-medium text-gray-700">Filtro de Búsqueda de Usuario</label>
                                    <input type="text" name="userSearchFilter" id="userSearchFilter" value={formData.userSearchFilter} onChange={handleChange} placeholder="(sAMAccountName=%u)" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                                    <p className="mt-2 text-xs text-gray-500">Usa %u como placeholder para el nombre de usuario.</p>
                                </div>
                            </div>
                            
                            {/* --- Mapeo de Atributos --- */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Mapeo de Atributos</h3>
                                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-6">
                                     <div>
                                        <label htmlFor="usernameAttribute" className="block text-sm font-medium text-gray-700">Atributo de Usuario</label>
                                        <input type="text" name="usernameAttribute" id="usernameAttribute" value={formData.usernameAttribute} onChange={handleChange} placeholder="sAMAccountName" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                                    </div>
                                    <div>
                                        <label htmlFor="fullNameAttribute" className="block text-sm font-medium text-gray-700">Atributo Nombre Completo</label>
                                        <input type="text" name="fullNameAttribute" id="fullNameAttribute" value={formData.fullNameAttribute} onChange={handleChange} placeholder="cn" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                                    </div>
                                    <div>
                                        <label htmlFor="emailAttribute" className="block text-sm font-medium text-gray-700">Atributo de Email</label>
                                        <input type="text" name="emailAttribute" id="emailAttribute" value={formData.emailAttribute} onChange={handleChange} placeholder="mail" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="pt-8 flex justify-end space-x-3 border-t mt-8">
                     <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={!formData.enabled}
                        className="rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        Probar Conexión
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default Authentication;

import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { User, Role, AuthType } from '../types';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { UserCircleIcon, PencilIcon, TrashIcon, PlusIcon } from './Icons';

const UserForm: React.FC<{
    user: Partial<User> | null;
    onClose: () => void;
    onSave: (user: Partial<User>) => void;
}> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<User>>(user || {});
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { practices } = useData();

    if (!formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handlePermissionChange = (categoryId: string, accessLevel: 'none' | 'view' | 'edit') => {
        const newPermissions = (formData.permissions || []).filter(p => p.categoryId !== categoryId);
        if (accessLevel !== 'none') {
            newPermissions.push({ categoryId, canEdit: accessLevel === 'edit' });
        }
        setFormData(prev => ({ ...prev, permissions: newPermissions }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.authType === AuthType.LOCAL) {
            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden.');
                return;
            }
            if (!formData.id && !password) {
                alert('La contraseña es obligatoria para nuevos usuarios locales.');
                return;
            }
        }
        
        const userToSave = { ...formData };
        if (password) {
            userToSave.password = password;
        }

        onSave(userToSave);
    };
    
    const getPermission = (categoryId: string) => {
        const perm = (formData.permissions || []).find(p => p.categoryId === categoryId);
        if (!perm) return 'none';
        return perm.canEdit ? 'edit' : 'view';
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                    <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
                    <input type="text" name="username" value={formData.username || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <select name="role" value={formData.role || Role.USER} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value={Role.USER}>Usuario</option>
                        <option value={Role.ADMIN}>Administrador</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Autenticación</label>
                    <select name="authType" value={formData.authType || AuthType.LOCAL} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value={AuthType.LOCAL}>Local</option>
                        <option value={AuthType.LDAP}>Directorio Activo</option>
                    </select>
                </div>
                
                {formData.authType === AuthType.LOCAL && (
                    <>
                        <div className="sm:col-span-2 border-t pt-4">
                             <p className="text-sm text-gray-600 mb-4">
                                {formData.id ? 'Establecer una nueva contraseña. Dejar en blanco para no cambiarla.' : 'Establecer la contraseña para el nuevo usuario.'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                        </div>
                    </>
                )}
            </div>
            
            {formData.role === Role.USER && (
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900">Permisos por Categoría</h3>
                    <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-2 space-y-2 bg-gray-50">
                        {practices.flatMap(p => p.categories).map(cat => (
                            <div key={cat.id} className="grid grid-cols-5 items-center gap-2 p-1 rounded hover:bg-white">
                                <span className="col-span-2 truncate text-sm font-medium text-gray-700" title={cat.name}>{cat.name}</span>
                                <label className="text-xs flex items-center justify-center cursor-pointer">
                                    <input type="radio" name={`perm-${cat.id}`} checked={getPermission(cat.id) === 'none'} onChange={() => handlePermissionChange(cat.id, 'none')} />
                                    <span className="ml-1">Ninguno</span>
                                </label>
                                <label className="text-xs flex items-center justify-center cursor-pointer">
                                    <input type="radio" name={`perm-${cat.id}`} checked={getPermission(cat.id) === 'view'} onChange={() => handlePermissionChange(cat.id, 'view')} />
                                    <span className="ml-1">Ver</span>
                                </label>
                                 <label className="text-xs flex items-center justify-center cursor-pointer">
                                    <input type="radio" name={`perm-${cat.id}`} checked={getPermission(cat.id) === 'edit'} onChange={() => handlePermissionChange(cat.id, 'edit')} />
                                    <span className="ml-1">Editar</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white py-2 px-4 border rounded-md text-sm">Guardar</button>
            </div>
        </form>
    );
};


const Users: React.FC = () => {
    const { users, setUsers } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };
    
    const handleAddUser = () => {
        setEditingUser({ 
            id: `u${Date.now()}`, 
            username: '', 
            fullName: '', 
            email: '', 
            role: Role.USER, 
            authType: AuthType.LOCAL,
            permissions: []
        });
        setIsModalOpen(true);
    }

    const handleSaveUser = (userData: Partial<User>) => {
        setUsers(prevUsers => {
            const existing = prevUsers.find(u => u.id === userData.id);
            if (existing) {
                return prevUsers.map(u => u.id === userData.id ? (userData as User) : u);
            }
            return [...prevUsers, userData as User];
        });
        setIsModalOpen(false);
        setEditingUser(null);
    };

    return (
        <div className="space-y-6">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser?.id ? 'Editar Usuario' : 'Nuevo Usuario'}>
                <UserForm user={editingUser} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} />
            </Modal>
            
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <button onClick={handleAddUser} className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                    <PlusIcon className="mr-2 -ml-1"/>
                    Añadir Usuario
                </button>
            </div>

            <Card>
                <ul className="divide-y divide-gray-200">
                    {users.map(user => (
                        <li key={user.id} className="py-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <UserCircleIcon className="w-10 h-10 text-gray-400" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span>{user.email}</span>
                                        <span className="mx-2 text-gray-300">|</span>
                                        <span className="font-medium">{user.authType}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                               <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === Role.ADMIN ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                                    {user.role}
                               </span>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleEditUser(user)} className="text-gray-400 hover:text-indigo-600"><PencilIcon /></button>
                                    <button onClick={() => alert('Eliminar no implementado')} className="text-gray-400 hover:text-red-600"><TrashIcon /></button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

export default Users;
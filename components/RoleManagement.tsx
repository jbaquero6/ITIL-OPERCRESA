
import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { Role, RolePermissions } from '../types';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { ShieldCheckIcon, PencilIcon, TrashIcon, PlusIcon } from './Icons';

const emptyPermissions: RolePermissions = {
    canViewDashboard: true,
    canViewPractices: true,
    canViewUsers: false,
    canViewAuthSettings: false,
    canViewRoleManagement: false,
    canViewAllCategories: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageAuthSettings: false,
    canDeleteActivity: false,
    canCloneActivity: false,
};

const permissionLabels: Record<keyof RolePermissions, string> = {
    canViewDashboard: "Ver Panel de Control",
    canViewPractices: "Ver Explorador de Prácticas",
    canViewUsers: "Ver Gestión de Usuarios",
    canViewAuthSettings: "Ver Config. de Autenticación",
    canViewRoleManagement: "Ver Gestión de Roles",
    canViewAllCategories: "Ver Todas las Categorías (ignora permisos)",
    canManageUsers: "Gestionar Usuarios (Crear/Editar/Eliminar)",
    canManageRoles: "Gestionar Roles (Crear/Editar/Eliminar)",
    canManageAuthSettings: "Gestionar Config. de Autenticación",
    canDeleteActivity: "Eliminar Actividades",
    canCloneActivity: "Clonar Actividades",
};

const RoleForm: React.FC<{
    role: Partial<Role> | null;
    onClose: () => void;
    onSave: (role: Partial<Role>) => void;
}> = ({ role, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Role>>(role || { permissions: emptyPermissions });

    if (!formData) return null;

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [name]: checked }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Rol</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleInfoChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea name="description" value={formData.description || ''} onChange={handleInfoChange} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Permisos</h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-2">
                    {Object.entries(permissionLabels).map(([key, label]) => (
                        <label key={key} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                            <input
                                type="checkbox"
                                name={key}
                                checked={formData.permissions?.[key as keyof RolePermissions] || false}
                                onChange={handlePermissionChange}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{label}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white py-2 px-4 border rounded-md text-sm">Guardar</button>
            </div>
        </form>
    );
};

const RoleManagement: React.FC = () => {
    const { roles, setRoles, users } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);

    const handleEditRole = (role: Role) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };
    
    const handleAddRole = () => {
        setEditingRole({ 
            id: `role-${Date.now()}`, 
            name: '', 
            description: '',
            permissions: emptyPermissions,
        });
        setIsModalOpen(true);
    }

    const handleSaveRole = (roleData: Partial<Role>) => {
        setRoles(prevRoles => {
            const existing = prevRoles.find(r => r.id === roleData.id);
            if (existing) {
                return prevRoles.map(r => r.id === roleData.id ? (roleData as Role) : r);
            }
            return [...prevRoles, roleData as Role];
        });
        setIsModalOpen(false);
        setEditingRole(null);
    };
    
    const handleDeleteRole = (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if (role?.isDefault) {
            alert("No se puede eliminar un rol predeterminado.");
            return;
        }
        if (users.some(u => u.roleId === roleId)) {
            alert("No se puede eliminar un rol que está asignado a uno o más usuarios.");
            return;
        }
        if(window.confirm(`¿Está seguro de que desea eliminar el rol "${role?.name}"?`)) {
            setRoles(prev => prev.filter(r => r.id !== roleId));
        }
    }

    return (
        <div className="space-y-6">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole?.name ? 'Editar Rol' : 'Nuevo Rol'}>
                <RoleForm role={editingRole} onClose={() => setIsModalOpen(false)} onSave={handleSaveRole} />
            </Modal>
            
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Roles</h1>
                <button onClick={handleAddRole} className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                    <PlusIcon className="mr-2 -ml-1"/>
                    Añadir Rol
                </button>
            </div>

            <Card>
                <ul className="divide-y divide-gray-200">
                    {roles.map(role => (
                        <li key={role.id} className="py-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <ShieldCheckIcon className={`w-10 h-10 ${role.isDefault ? 'text-indigo-400' : 'text-gray-400'}`} />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{role.name}</p>
                                    <p className="text-sm text-gray-500">{role.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                               <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.isDefault ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {role.isDefault ? 'Predeterminado' : 'Personalizado'}
                               </span>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleEditRole(role)} className="text-gray-400 hover:text-indigo-600" disabled={role.isDefault}>
                                        <PencilIcon className={role.isDefault ? 'text-gray-300' : ''}/>
                                    </button>
                                    <button onClick={() => handleDeleteRole(role.id)} className="text-gray-400 hover:text-red-600" disabled={role.isDefault}>
                                        <TrashIcon className={role.isDefault ? 'text-gray-300' : ''} />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

export default RoleManagement;
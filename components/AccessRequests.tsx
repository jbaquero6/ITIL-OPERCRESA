
import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { mockAccessRequests } from '../data/mockData';
import { AccessRequest, AccessRequestStatus } from '../types';
import Card from './ui/Card';
import { formatDate } from '../utils/helpers';

const AccessRequests: React.FC = () => {
    const { users, practices } = useData();
    const [requests, setRequests] = useState<AccessRequest[]>(mockAccessRequests);

    const getEntityName = (type: 'user' | 'category', id: string) => {
        if (type === 'user') {
            return users.find(u => u.id === id)?.fullName || 'Desconocido';
        }
        if (type === 'category') {
            return practices.flatMap(p => p.categories).find(c => c.id === id)?.name || 'Desconocido';
        }
        return 'Desconocido';
    };
    
    const handleStatusChange = (requestId: string, newStatus: AccessRequestStatus) => {
        setRequests(prev => prev.map(r => r.id === requestId ? {...r, status: newStatus} : r));
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Solicitudes de Acceso</h1>
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría Solicitada</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getEntityName('user', req.userId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getEntityName('category', req.categoryId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(req.requestDate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            req.status === AccessRequestStatus.APPROVED ? 'bg-green-100 text-green-800' : 
                                            req.status === AccessRequestStatus.REJECTED ? 'bg-red-100 text-red-800' : 
                                            'bg-yellow-100 text-yellow-800'
                                         }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {req.status === AccessRequestStatus.PENDING && (
                                            <>
                                                <button onClick={() => handleStatusChange(req.id, AccessRequestStatus.APPROVED)} className="text-indigo-600 hover:text-indigo-900">Aprobar</button>
                                                <button onClick={() => handleStatusChange(req.id, AccessRequestStatus.REJECTED)} className="text-red-600 hover:text-red-900">Rechazar</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {requests.length === 0 && <p className="text-center py-8 text-gray-500">No hay solicitudes de acceso.</p>}
            </Card>
        </div>
    );
};

export default AccessRequests;

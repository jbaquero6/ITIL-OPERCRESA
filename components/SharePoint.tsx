import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { SharePointConfig } from '../types';
import Card from './ui/Card';

const SharePoint: React.FC = () => {
    const { sharePointConfig, setSharePointConfig } = useData();
    const [formData, setFormData] = useState<SharePointConfig>(sharePointConfig);

    useEffect(() => {
        setFormData(sharePointConfig);
    }, [sharePointConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) || 0 : value);
        setFormData(prev => ({
            ...prev,
            [name]: val,
        }));
    };

    const handleSave = () => {
        setSharePointConfig(formData);
        alert('Configuración de SharePoint guardada exitosamente.');
    };

    const handleTestConnection = () => {
        alert('Prueba de conexión a SharePoint simulada... ¡Éxito! (funcionalidad no implementada en prototipo)');
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-xl font-semibold">Configuración de Integración con SharePoint</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestiona la conexión a SharePoint para el almacenamiento de documentos y evidencias.
                    </p>
                </div>
                
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Estado de la Integración</h3>
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
                                    {formData.enabled ? 'Integración con SharePoint Habilitada' : 'Integración con SharePoint Deshabilitada'}
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    {formData.enabled && (
                        <>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Detalles del Repositorio</h3>
                                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="siteUrl" className="block text-sm font-medium text-gray-700">URL del Sitio de SharePoint</label>
                                        <input type="text" name="siteUrl" id="siteUrl" value={formData.siteUrl} onChange={handleChange} placeholder="https://[tenant].sharepoint.com/sites/..." className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Configuración de Archivos</h3>
                                <div className="mt-4">
                                    <label htmlFor="maxFileNameLength" className="block text-sm font-medium text-gray-700">Longitud Máxima del Nombre de Archivo</label>
                                    <input type="number" name="maxFileNameLength" id="maxFileNameLength" value={formData.maxFileNameLength} onChange={handleChange} min="50" max="250" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                                    <p className="mt-2 text-xs text-gray-500">Define el número máximo de caracteres para el nombre del archivo generado. Ayuda a prevenir errores en SharePoint. Recomendado: 128.</p>
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

export default SharePoint;
import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import { Activity, Document, ActivityStatus } from '../../types';
import { PaperClipIcon, TrashIcon, ExclamationTriangleIcon } from '../Icons';
import { sanitizeFileName } from '../../utils/helpers';
import Modal from '../ui/Modal';

const ActivityForm: React.FC<{
    activity: Partial<Activity> | null;
    onClose: () => void;
    onSave: (activity: Partial<Activity>) => void;
}> = ({ activity, onClose, onSave }) => {
    const [formData, setFormData] = useState({ ...activity, documents: activity?.documents || [] });
    const [error, setError] = useState<string | null>(null);
    const { users, sharePointConfig } = useData();
    const [confirmationRequired, setConfirmationRequired] = useState<Document[]>([]);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

    const isActivityClosed = activity?.activityStatus === ActivityStatus.CLOSED;

    const clearErrorOnChange = (callback: () => void) => {
        setError(null);
        callback();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        clearErrorOnChange(() => setFormData(prev => ({...prev, [name]: value })));
    };
    
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        clearErrorOnChange(() => {
            const progress = parseInt(e.target.value, 10);
            const completionDate = progress === 100 ? (formData?.completionDate || new Date().toISOString().split('T')[0]) : null;
            const activityStatus = progress === 100 ? ActivityStatus.CLOSED : ActivityStatus.OPEN;
            setFormData(prev => ({ ...prev, progress, completionDate, activityStatus }));
        });
    };

    const handleDeleteDocument = (docId: string) => {
        if (isActivityClosed) return;
        clearErrorOnChange(() => {
            setFormData(prev => ({
                ...prev,
                documents: prev.documents?.filter(d => d.id !== docId) || []
            }));
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isActivityClosed) return;
        clearErrorOnChange(() => {
            if (!e.target.files) return;

            const filesToProcess = Array.from(e.target.files);
            const newDocuments: Document[] = [];
            const confirmationList: Document[] = [];

            const activityIdentifier = formData.id || 'NUEVA-ACTIVIDAD';
            const maxLen = sharePointConfig.maxFileNameLength;
            
            const reservedLength = activityIdentifier.length + 20;
            const activityName = sanitizeFileName(formData.name || 'actividad_sin_nombre', maxLen - reservedLength);

            filesToProcess.forEach((file: File) => {
                const existingVersions = formData.documents?.filter(d => d.originalName === file.name) || [];
                const isDuplicate = existingVersions.length > 0;
                const maxVersion = Math.max(0, ...existingVersions.map(d => d.version));
                const newVersion = maxVersion + 1;

                const fileExtension = file.name.split('.').pop();
                const newFileName = `${activityIdentifier}_${activityName}_v${newVersion}.${fileExtension}`;

                const newDoc: Document = {
                    id: `doc-${Date.now()}-${Math.random()}`,
                    name: newFileName,
                    originalName: file.name,
                    url: `#mock-url/${newFileName}`,
                    version: newVersion,
                    uploadDate: new Date().toISOString(),
                };
                
                if (isDuplicate) {
                    confirmationList.push(newDoc);
                } else {
                    newDocuments.push(newDoc);
                }
            });

            if (newDocuments.length > 0) {
                 setFormData(prev => ({
                    ...prev,
                    documents: [...(prev.documents || []), ...newDocuments]
                }));
            }
           
            if (confirmationList.length > 0) {
                setConfirmationRequired(confirmationList);
                setIsConfirmationModalOpen(true);
            }

            e.target.value = '';
        });
    };

    const handleConfirmNewVersions = () => {
        setFormData(prev => ({
            ...prev,
            documents: [...(prev.documents || []), ...confirmationRequired]
        }));
        setIsConfirmationModalOpen(false);
        setConfirmationRequired([]);
    };

    const handleCancelNewVersions = () => {
        setIsConfirmationModalOpen(false);
        setConfirmationRequired([]);
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation: If progress is 100%, at least one document is required.
        if (formData.progress === 100 && (!formData.documents || formData.documents.length === 0)) {
            setError("Para finalizar la actividad (100% de progreso), es obligatorio adjuntar al menos un documento de evidencia.");
            return;
        }

        const dataToSave = {
            ...formData,
            activityStatus: (formData.progress ?? 0) === 100 ? ActivityStatus.CLOSED : ActivityStatus.OPEN,
        };

        if (dataToSave) onSave(dataToSave);
    };

    if (!formData) return null;

    return (
        <>
            <Modal isOpen={isConfirmationModalOpen} onClose={handleCancelNewVersions} title="Confirmar Nueva Versión">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        El/los siguiente(s) archivo(s) ya existe(n) para esta actividad. ¿Estás seguro de que quieres subirlo(s) como una nueva versión?
                    </p>
                    <ul className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-md border">
                        {confirmationRequired.map(doc => (
                            <li key={doc.id} className="text-sm flex items-start">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-medium">{doc.originalName}</span>
                                    <span className="text-gray-500"> se guardará como </span>
                                    <span className="font-semibold text-indigo-600">versión {doc.version}</span>.
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                        <button type="button" onClick={handleCancelNewVersions} className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm">Cancelar</button>
                        <button type="button" onClick={handleConfirmNewVersions} className="bg-indigo-600 text-white py-2 px-4 border rounded-md text-sm">Confirmar y Subir</button>
                    </div>
                </div>
            </Modal>
            <form onSubmit={handleSubmit} className="space-y-4">
                <fieldset disabled={isActivityClosed}>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre de la Actividad</label>
                        <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"/>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="responsible" className="block text-sm font-medium text-gray-700">Responsable</label>
                            <select name="responsible" id="responsible" value={formData.responsible || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100">
                                <option value="">Seleccionar...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                            <input type="date" name="dueDate" id="dueDate" value={formData.dueDate || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="progress" className="block text-sm font-medium text-gray-700">Progreso: {formData.progress || 0}%</label>
                        <input type="range" min="0" max="100" name="progress" id="progress" value={formData.progress || 0} onChange={handleProgressChange} className="mt-1 block w-full disabled:bg-gray-100"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Evidencias</label>
                        <div className="space-y-2">
                            {formData.documents && formData.documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                                    <a href={doc.url} download={doc.name} className="flex items-center truncate text-gray-800 hover:text-indigo-600 group" title={`Descargar ${doc.name}`}>
                                        <PaperClipIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                                        <span className="truncate">{doc.name}</span>
                                    </a>
                                    <button 
                                        type="button" 
                                        onClick={() => handleDeleteDocument(doc.id)} 
                                        className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0 disabled:text-gray-300 disabled:cursor-not-allowed"
                                        disabled={isActivityClosed}
                                        >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2">
                            <label htmlFor="file-upload" className={`relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 border border-dashed border-gray-300 p-2 text-center block ${isActivityClosed ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}>
                                <span>Seleccionar archivos...</span>
                                <input 
                                    id="file-upload" 
                                    name="file-upload" 
                                    type="file" 
                                    className="sr-only" 
                                    multiple
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.msg,.eml,.zip,.rar,.7z"
                                    disabled={isActivityClosed}
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-1 text-center">
                                Formatos aceptados: PDF, DOCX, XLSX, PPTX, MSG, EML, ZIP, RAR, 7Z. Tamaño máx. 10MB por archivo.
                            </p>
                        </div>
                    </div>
                </fieldset>
                {error && (
                    <div className="my-2 p-3 bg-red-100 border border-red-300 text-red-800 text-sm rounded-md">
                        {error}
                    </div>
                )}
                <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm">Cancelar</button>
                    <button type="submit" className="bg-indigo-600 text-white py-2 px-4 border rounded-md text-sm disabled:bg-indigo-300" disabled={isActivityClosed}>Guardar</button>
                </div>
            </form>
        </>
    );
};

export default ActivityForm;
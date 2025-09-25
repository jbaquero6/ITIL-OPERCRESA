import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { Practice, Category, Subcategory, Activity, SemaphoreStatus, Document } from '../types';
import { ChevronRightIcon, ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon, PaperClipIcon, FolderIcon, DuplicateIcon } from './Icons';
import Card from './ui/Card';
import SemaphoreBadge from './ui/Badge';
import { formatDate, calculateSemaphoreStatus } from '../utils/helpers';
import Modal from './ui/Modal';

const ActivityForm: React.FC<{
    activity: Partial<Activity> | null;
    onClose: () => void;
    onSave: (activity: Partial<Activity>) => void;
}> = ({ activity, onClose, onSave }) => {
    const [formData, setFormData] = useState({ ...activity, documents: activity?.documents || [] });
    const { users } = useData();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value }));
    };
    
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const progress = parseInt(e.target.value, 10);
        const completionDate = progress === 100 ? (formData?.completionDate || new Date().toISOString().split('T')[0]) : null;
        setFormData(prev => ({ ...prev, progress, completionDate }));
    };

    const handleDeleteDocument = (docId: string) => {
        setFormData(prev => ({
            ...prev,
            documents: prev?.documents?.filter(d => d.id !== docId) || []
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                id: `doc-${Date.now()}-${Math.random()}`,
                name: file.name,
                url: `#mock-url/${file.name}`
            }));

            setFormData(prev => ({
                ...prev,
                documents: [...(prev?.documents || []), ...newFiles]
            }));
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) onSave(formData);
    };

    if (!formData) return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre de la Actividad</label>
                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="responsible" className="block text-sm font-medium text-gray-700">Responsable</label>
                    <select name="responsible" id="responsible" value={formData.responsible || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="">Seleccionar...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                    <input type="date" name="dueDate" id="dueDate" value={formData.dueDate || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
             </div>
             <div>
                <label htmlFor="progress" className="block text-sm font-medium text-gray-700">Progreso: {formData.progress || 0}%</label>
                <input type="range" min="0" max="100" name="progress" id="progress" value={formData.progress || 0} onChange={handleProgressChange} className="mt-1 block w-full"/>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Evidencias</label>
                <div className="space-y-2">
                    {formData.documents && formData.documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                            <div className="flex items-center truncate">
                                <PaperClipIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                                <span className="truncate text-gray-800" title={doc.name}>{doc.name}</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => handleDeleteDocument(doc.id)} 
                                className="text-gray-400 hover:text-red-600 ml-2">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-2">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 border border-dashed border-gray-300 p-2 text-center block">
                        <span>Seleccionar archivos...</span>
                        <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            multiple
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        />
                    </label>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white py-2 px-4 border rounded-md text-sm">Guardar</button>
            </div>
        </form>
    );
};


const PracticesExplorer: React.FC = () => {
    const { practices, setPractices, currentUser, users, roles } = useData();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Partial<Activity> | null>(null);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(currentMonth);

    const years = useMemo(() => {
        const allYears = new Set<number>([currentYear]);
        practices.forEach(p => 
            p.categories.forEach(c => 
                c.subcategories.forEach(sc => 
                    sc.activities.forEach(a => {
                        if (a.dueDate) {
                            allYears.add(new Date(a.dueDate).getFullYear());
                        }
                    })
                )
            )
        );
        return Array.from(allYears).sort((a, b) => b - a);
    }, [practices]);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const userRole = useMemo(() => {
        return currentUser ? roles.find(r => r.id === currentUser.roleId) : null;
    }, [currentUser, roles]);

    const visiblePractices = useMemo(() => {
        if (!currentUser || !userRole) return [];
        if (userRole.permissions.canViewAllCategories) return practices;

        const allowedCategoryIds = new Set(currentUser.permissions.map(p => p.categoryId));
        return practices
            .map(p => ({
                ...p,
                categories: p.categories.filter(c => allowedCategoryIds.has(c.id)),
            }))
            .filter(p => p.categories.length > 0);
    }, [practices, currentUser, userRole]);

    const practicesByGroup = useMemo(() => {
        return visiblePractices.reduce((acc, practice) => {
            (acc[practice.group] = acc[practice.group] || []).push(practice);
            return acc;
        }, {} as Record<string, Practice[]>);
    }, [visiblePractices]);

    const canUserEditCategory = useMemo(() => {
        if (!currentUser || !selectedCategory || !userRole) return false;
        if (userRole.permissions.canViewAllCategories) return true;
        const permission = currentUser.permissions.find(p => p.categoryId === selectedCategory.id);
        return permission?.canEdit || false;
    }, [currentUser, selectedCategory, userRole]);

    const handleSelectPractice = (practice: Practice) => {
        setSelectedPractice(practice);
        setSelectedCategory(practice.categories[0] || null);
    };
    
    const handleSelectCategory = (category: Category) => {
        setSelectedCategory(category);
    }
    
    const handleAddActivity = (subcategoryId: string) => {
        setSelectedSubcategory(selectedCategory?.subcategories.find(s => s.id === subcategoryId) || null);
        setEditingActivity({ documents: [] });
        setIsModalOpen(true);
    };
    
    const handleEditActivity = (activity: Activity, subcategoryId: string) => {
        setSelectedSubcategory(selectedCategory?.subcategories.find(s => s.id === subcategoryId) || null);
        setEditingActivity(activity);
        setIsModalOpen(true);
    };

    const handleSaveActivity = (activityData: Partial<Activity>) => {
        setPractices(prevPractices => {
            return prevPractices.map(p => {
                if (p.id !== selectedPractice?.id) return p;
                return {
                    ...p,
                    categories: p.categories.map(c => {
                        if (c.id !== selectedCategory?.id) return c;
                        return {
                            ...c,
                            subcategories: c.subcategories.map(sc => {
                                if (sc.id !== selectedSubcategory?.id) return sc;
                                
                                const finalActivity = {
                                    ...activityData,
                                    status: calculateSemaphoreStatus(activityData),
                                } as Activity;

                                if (activityData.id) { // Editing existing
                                    return {
                                        ...sc,
                                        activities: sc.activities.map(a => a.id === activityData.id ? finalActivity : a),
                                    };
                                } else { // Adding new
                                    return {
                                        ...sc,
                                        activities: [...sc.activities, { ...finalActivity, id: `a-${sc.id}-${Date.now()}` }],
                                    };
                                }
                            })
                        };
                    })
                };
            });
        });

        setIsModalOpen(false);
        setEditingActivity(null);
    };

    const handleDeleteActivity = (activityId: string, subcategoryId: string) => {
        if (!window.confirm('¿Está seguro de que desea eliminar esta actividad? Esta acción no se puede deshacer.')) {
            return;
        }

        setPractices(prevPractices => {
            return prevPractices.map(p => {
                if (p.id !== selectedPractice?.id) return p;
                return {
                    ...p,
                    categories: p.categories.map(c => {
                        if (c.id !== selectedCategory?.id) return c;
                        return {
                            ...c,
                            subcategories: c.subcategories.map(sc => {
                                if (sc.id !== subcategoryId) return sc;
                                return {
                                    ...sc,
                                    activities: sc.activities.filter(a => a.id !== activityId),
                                };
                            })
                        };
                    })
                };
            });
        });
    };

    const handleCloneActivity = (activityToClone: Activity, subcategoryId: string) => {
        const clonedActivityData = JSON.parse(JSON.stringify(activityToClone));

        const newActivity: Partial<Activity> = {
            ...clonedActivityData,
            id: `a-${subcategoryId}-${Date.now()}`,
            name: `Copia de ${clonedActivityData.name}`,
            progress: 0,
            completionDate: null,
        };

        const finalClonedActivity = {
            ...newActivity,
            status: calculateSemaphoreStatus(newActivity),
        } as Activity;

        setPractices(prevPractices => {
            return prevPractices.map(p => {
                if (p.id !== selectedPractice?.id) return p;
                return {
                    ...p,
                    categories: p.categories.map(c => {
                        if (c.id !== selectedCategory?.id) return c;
                        return {
                            ...c,
                            subcategories: c.subcategories.map(sc => {
                                if (sc.id !== subcategoryId) return sc;
                                return {
                                    ...sc,
                                    activities: [...sc.activities, finalClonedActivity],
                                };
                            })
                        };
                    })
                };
            });
        });
    };
    
    const filteredSubcategories = useMemo(() => {
        if (!selectedCategory) return [];

        return selectedCategory.subcategories.map(sub => ({
            ...sub,
            activities: sub.activities.filter(activity => {
                if (!activity.dueDate) return false; 
                const activityDate = new Date(activity.dueDate);

                const yearMatch = selectedYear === 'all' || activityDate.getFullYear() === selectedYear;
                const monthMatch = selectedMonth === 'all' || activityDate.getMonth() === selectedMonth;

                return yearMatch && monthMatch;
            })
        }));
    }, [selectedCategory, selectedYear, selectedMonth]);

    return (
        <div className="flex h-full space-x-6">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingActivity?.id ? 'Editar Actividad' : 'Nueva Actividad'}>
                <ActivityForm 
                    activity={editingActivity} 
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveActivity}
                />
            </Modal>
            
            <aside className="w-1/3 max-w-sm flex-shrink-0">
                <Card className="h-full overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Prácticas ITIL</h2>
                    <div className="space-y-1">
                        {Object.entries(practicesByGroup).map(([groupName, practicesInGroup]) => (
                            <div key={groupName}>
                                <button onClick={() => setExpandedGroups(p => ({...p, [groupName]: !p[groupName]}))} className="w-full flex justify-between items-center text-left py-2 px-2 rounded-md hover:bg-gray-100">
                                    <span className="font-semibold text-gray-800">{groupName}</span>
                                    {expandedGroups[groupName] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                </button>
                                {expandedGroups[groupName] && (
                                    <div className="pl-4 py-1 space-y-1">
                                        {practicesInGroup.map(practice => (
                                            <div key={practice.id}>
                                                <button onClick={() => handleSelectPractice(practice)} className={`w-full text-left py-1.5 px-2 text-sm rounded truncate ${selectedPractice?.id === practice.id ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                                                    {practice.name}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            </aside>
            
            <main className="flex-1">
                {selectedPractice ? (
                    <div className="space-y-6">
                        <Card>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">{selectedPractice.name}</h1>
                                    <p className="text-sm text-gray-500">{selectedPractice.group}</p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                        className="bg-white border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="all">Todos los meses</option>
                                        {months.map((month, index) => (
                                            <option key={index} value={index}>{month}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                        className="bg-white border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="all">Todos los años</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-start flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
                                <span className="font-semibold mr-2">Leyenda de Estados:</span>
                                <div className="flex items-center">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></span>
                                    <span>A tiempo / Completado</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5"></span>
                                    <span>Por iniciar</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span>
                                    <span>Vencido / Atrasado</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400 mr-1.5"></span>
                                    <span>No iniciado</span>
                                </div>
                            </div>
                        </Card>
                        
                        <div className="flex items-start space-x-6">
                            <nav className="w-1/4 space-y-2">
                                <h3 className="font-semibold text-gray-600 px-2 mb-1">Categorías</h3>
                                {selectedPractice.categories.map(cat => (
                                    <button key={cat.id} onClick={() => handleSelectCategory(cat)} className={`w-full text-left py-2 px-3 text-sm font-medium rounded-lg truncate ${selectedCategory?.id === cat.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                                        {cat.name}
                                    </button>
                                ))}
                            </nav>

                            <div className="flex-1 space-y-4">
                                {filteredSubcategories.map(sub => (
                                    <Card key={sub.id}>
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-semibold text-lg">{sub.name}</h3>
                                            {canUserEditCategory && (
                                                <button onClick={() => handleAddActivity(sub.id)} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                                    <PlusIcon className="mr-1" /> Añadir Actividad
                                                </button>
                                            )}
                                        </div>
                                        {sub.activities.length > 0 ? (
                                            <ul className="divide-y divide-gray-200">
                                                {sub.activities.map(act => (
                                                    <li key={act.id} className="py-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="truncate">
                                                                <p className="font-medium text-gray-900 truncate" title={act.name}>{act.name}</p>
                                                                <p className="text-sm text-gray-500 truncate">{users.find(u => u.id === act.responsible)?.fullName}</p>
                                                            </div>
                                                            <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                                                                <div className="text-right">
                                                                    <SemaphoreBadge status={act.status} completionDate={act.completionDate} />
                                                                    <p className="text-xs text-gray-500 mt-1">Vence: {formatDate(act.dueDate)}</p>
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    {canUserEditCategory && (
                                                                        <button onClick={() => handleEditActivity(act, sub.id)} className="text-gray-400 hover:text-indigo-600" title="Editar Actividad"><PencilIcon className="w-4 h-4" /></button>
                                                                    )}
                                                                    {userRole?.permissions.canCloneActivity && (
                                                                        <button onClick={() => handleCloneActivity(act, sub.id)} className="text-gray-400 hover:text-blue-600" title="Clonar Actividad"><DuplicateIcon className="w-4 h-4" /></button>
                                                                    )}
                                                                    {userRole?.permissions.canDeleteActivity && (
                                                                         <button onClick={() => handleDeleteActivity(act.id, sub.id)} className="text-gray-400 hover:text-red-600" title="Eliminar Actividad"><TrashIcon className="w-4 h-4" /></button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 text-sm text-gray-600">{act.description}</div>
                                                        {act.documents.length > 0 && (
                                                            <div className="mt-2 flex items-center text-xs text-gray-500">
                                                                <PaperClipIcon className="mr-1.5" /> {act.documents.length} adjuntos
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-500 text-center py-4">No hay actividades para el período seleccionado.</p>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">Selecciona una práctica</h3>
                            <p className="mt-1 text-sm text-gray-500">Elige una práctica del panel de la izquierda para ver sus detalles.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PracticesExplorer;
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { Practice, Category, Subcategory, Activity, Document, ActivityStatus } from '../types';
import { ChevronRightIcon, ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon, PaperClipIcon, FolderIcon, DuplicateIcon, CheckIcon, XMarkIcon, DownloadIcon, EyeIcon, LockClosedIcon, LockOpenIcon } from './Icons';
import Card from './ui/Card';
import SemaphoreBadge from './ui/Badge';
import { formatDate, calculateSemaphoreStatus } from '../utils/helpers';
import Modal from './ui/Modal';
import { ITIL_PRACTICE_GROUPS } from '../constants';
import ActivityForm from './forms/ActivityForm';

const PracticeForm: React.FC<{
    practice: Partial<Practice> | null;
    onClose: () => void;
    onSave: (practice: Partial<Practice>) => void;
}> = ({ practice, onClose, onSave }) => {
    const [formData, setFormData] = useState({ ...practice });
    const practiceGroups = ITIL_PRACTICE_GROUPS.map(g => g.name);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) onSave(formData);
    };

    if (!formData) return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre de la Práctica</label>
                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
            </div>
            <div>
                <label htmlFor="group" className="block text-sm font-medium text-gray-700">Grupo de Práctica</label>
                <select name="group" id="group" value={formData.group || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Seleccionar grupo...</option>
                    {practiceGroups.map(group => <option key={group} value={group}>{group}</option>)}
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white py-2 px-4 border rounded-md text-sm">Guardar</button>
            </div>
        </form>
    );
};

const PracticesExplorer: React.FC = () => {
    const { practices, setPractices, currentUser, users, roles, sharePointConfig } = useData();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
    
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Partial<Activity> | null>(null);
    const [modalContext, setModalContext] = useState<{ categoryId: string | null; subcategoryId: string | null }>({ categoryId: null, subcategoryId: null });
    
    const [editing, setEditing] = useState<{ type: 'category' | 'subcategory' | 'path' | null, id: string | null, name: string }>({ type: null, id: null, name: '' });
    
    const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
    const [editingPractice, setEditingPractice] = useState<Partial<Practice> | null>(null);

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewingDocument, setPreviewingDocument] = useState<Document | null>(null);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(currentMonth);

    const handleSelectPractice = (practice: Practice) => {
        setSelectedPractice(practice);
        setEditing({ type: null, id: null, name: '' });
    };

    useEffect(() => {
        if (selectedPractice) {
            const initialCatExpanded = selectedPractice.categories.reduce((acc, cat) => {
                acc[cat.id] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setExpandedCategories(initialCatExpanded);

            const allSubcategories = selectedPractice.categories.flatMap(c => c.subcategories);
            const initialSubExpanded = allSubcategories.reduce((acc, sub) => {
                acc[sub.id] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setExpandedSubcategories(initialSubExpanded);
        } else {
            setExpandedCategories({});
            setExpandedSubcategories({});
        }
    }, [selectedPractice]);

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

    const canEdit = (categoryId: string) => {
        if (!currentUser || !userRole) return false;
        if (userRole.permissions.canViewAllCategories) return true;
        const permission = currentUser.permissions.find(p => p.categoryId === categoryId);
        return permission?.canEdit || false;
    }

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

    
    // Activity Handlers
    const handleAddActivity = (subcategoryId: string, categoryId: string) => {
        setModalContext({ categoryId, subcategoryId });
        setEditingActivity({ documents: [], progress: 0, activityStatus: ActivityStatus.OPEN });
        setIsActivityModalOpen(true);
    };
    
    const handleEditActivity = (activity: Activity, subcategoryId: string, categoryId: string) => {
        if (activity.activityStatus === ActivityStatus.CLOSED) return;
        setModalContext({ categoryId, subcategoryId });
        setEditingActivity(activity);
        setIsActivityModalOpen(true);
    };

    const handleSaveActivity = (activityData: Partial<Activity>) => {
        if (!modalContext.categoryId || !modalContext.subcategoryId) return;
        
        setPractices(prevPractices => {
            return prevPractices.map(p => {
                if (p.id !== selectedPractice?.id) return p;
                return {
                    ...p,
                    categories: p.categories.map(c => {
                        if (c.id !== modalContext.categoryId) return c;
                        return {
                            ...c,
                            subcategories: c.subcategories.map(sc => {
                                if (sc.id !== modalContext.subcategoryId) return sc;
                                
                                const finalActivity = {
                                    ...activityData,
                                    semaphoreStatus: calculateSemaphoreStatus(activityData),
                                    activityStatus: (activityData.progress ?? 0) === 100 ? ActivityStatus.CLOSED : ActivityStatus.OPEN,
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

        setIsActivityModalOpen(false);
        setEditingActivity(null);
        setModalContext({ categoryId: null, subcategoryId: null });
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
                    categories: p.categories.map(c => ({
                        ...c,
                        subcategories: c.subcategories.map(sc => {
                            if (sc.id !== subcategoryId) return sc;
                            return {
                                ...sc,
                                activities: sc.activities.filter(a => a.id !== activityId),
                            };
                        })
                    }))
                };
            });
        });
    };

    const handleCloneActivity = (activityToClone: Activity, subcategoryId: string) => {
        const newActivity = JSON.parse(JSON.stringify(activityToClone)) as Activity;

        newActivity.id = `a-${subcategoryId}-${Date.now()}`;
        newActivity.name = `Copia de ${activityToClone.name}`;
        newActivity.progress = 0;
        newActivity.completionDate = null;
        newActivity.activityStatus = ActivityStatus.OPEN; // Cloned activities are always open
        newActivity.semaphoreStatus = calculateSemaphoreStatus(newActivity); // Recalculate status

        setPractices(prevPractices => {
            return prevPractices.map(p => {
                if (p.id !== selectedPractice?.id) return p;
                return {
                    ...p,
                    categories: p.categories.map(c => ({
                        ...c,
                        subcategories: c.subcategories.map(sc => {
                            if (sc.id !== subcategoryId) return sc;
                            return {
                                ...sc,
                                activities: [...sc.activities, newActivity],
                            };
                        })
                    }))
                };
            });
        });
    };
    
     const handleReopenActivity = (activityId: string, subcategoryId: string) => {
        setPractices(prevPractices => {
            return prevPractices.map(p => {
                if (p.id !== selectedPractice?.id) return p;
                return {
                    ...p,
                    categories: p.categories.map(c => ({
                        ...c,
                        subcategories: c.subcategories.map(sc => {
                            if (sc.id !== subcategoryId) return sc;
                            return {
                                ...sc,
                                activities: sc.activities.map(a => {
                                    if (a.id === activityId) {
                                        const reopenedActivity = {
                                            ...a,
                                            activityStatus: ActivityStatus.OPEN,
                                            progress: 99,
                                            completionDate: null,
                                        };
                                        return {
                                            ...reopenedActivity,
                                            semaphoreStatus: calculateSemaphoreStatus(reopenedActivity),
                                        }
                                    }
                                    return a;
                                }),
                            };
                        })
                    }))
                };
            });
        });
    };

    // Editing Handlers
    const handleStartEdit = (type: 'category' | 'subcategory' | 'path', id: string, name: string) => {
        setEditing({ type, id, name });
    };

    const handleCancelEdit = () => {
        setEditing({ type: null, id: null, name: '' });
    };

    const handleSaveEdit = () => {
        if (!editing.id || !editing.type) return;

        setPractices(prev => prev.map(p => {
            if (p.id !== selectedPractice?.id) return p;

            let updatedPractice = { ...p };

            if (editing.type === 'category') {
                updatedPractice.categories = updatedPractice.categories.map(c => c.id === editing.id ? { ...c, name: editing.name } : c);
            }
            if (editing.type === 'subcategory') {
                updatedPractice.categories = updatedPractice.categories.map(c => ({
                    ...c,
                    subcategories: c.subcategories.map(s => s.id === editing.id ? { ...s, name: editing.name } : s)
                }));
            }
            if (editing.type === 'path') {
                 updatedPractice.categories = updatedPractice.categories.map(c => ({
                    ...c,
                    subcategories: c.subcategories.map(s => s.id === editing.id ? { ...s, sharepointFolderPath: editing.name } : s)
                }));
            }
            
            return updatedPractice;
        }));
        
        handleCancelEdit();
    };

    // Category/Subcategory Management Handlers
    const handleAddCategory = () => {
        const name = window.prompt('Introduce el nombre de la nueva categoría:');
        if (name && selectedPractice) {
            const newCategory: Category = { id: `cat-${Date.now()}`, name, subcategories: [] };
            setPractices(prev => prev.map(p => p.id === selectedPractice.id ? { ...p, categories: [...p.categories, newCategory] } : p));
        }
    };
    
    const handleDeleteCategory = (categoryId: string) => {
        if (window.confirm('¿Seguro que quieres eliminar esta categoría y todo su contenido?')) {
            setPractices(prev => prev.map(p => p.id === selectedPractice?.id ? {
                ...p,
                categories: p.categories.filter(c => c.id !== categoryId)
            } : p ));
        }
    };

    const handleAddSubcategory = (categoryId: string) => {
        const name = window.prompt('Introduce el nombre de la nueva subcategoría:');
        if (name) {
            const newSubcategory: Subcategory = { 
                id: `subcat-${Date.now()}`, 
                name,
                activities: [],
                sharepointFolderPath: `Evidencias/${selectedPractice?.name.replace(/\s+/g, '_') || 'Practica'}/${name.replace(/\s+/g, '_')}`
            };
            setPractices(prev => prev.map(p => p.id === selectedPractice?.id ? {
                ...p,
                categories: p.categories.map(c => c.id === categoryId ? { ...c, subcategories: [...c.subcategories, newSubcategory] } : c)
            } : p));
        }
    };

    const handleDeleteSubcategory = (subcategoryId: string) => {
        if (window.confirm('¿Seguro que quieres eliminar esta subcategoría y todas sus actividades?')) {
            setPractices(prev => prev.map(p => ({
                ...p,
                categories: p.categories.map(c => ({
                    ...c,
                    subcategories: c.subcategories.filter(s => s.id !== subcategoryId)
                }))
            })));
        }
    };

    // Practice Handlers
    const handleAddPractice = () => {
        setEditingPractice({
            name: '',
            group: ITIL_PRACTICE_GROUPS[0].name,
            categories: [],
        });
        setIsPracticeModalOpen(true);
    };

    const handleEditPractice = (practice: Practice) => {
        setEditingPractice(practice);
        setIsPracticeModalOpen(true);
    };

    const handleSavePractice = (practiceData: Partial<Practice>) => {
        setPractices(prevPractices => {
            if (practiceData.id) { // Editing
                return prevPractices.map(p => p.id === practiceData.id ? { ...p, ...practiceData } as Practice : p);
            } else { // Adding
                const newPractice: Practice = {
                    id: `p-${Date.now()}`,
                    name: practiceData.name || 'Nueva Práctica',
                    group: practiceData.group || ITIL_PRACTICE_GROUPS[0].name,
                    categories: [],
                };
                return [...prevPractices, newPractice];
            }
        });
        setIsPracticeModalOpen(false);
        setEditingPractice(null);
    };

    const handleDeletePractice = (practiceId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta práctica y todo su contenido? Esta acción no se puede deshacer.')) {
            setPractices(prevPractices => prevPractices.filter(p => p.id !== practiceId));
            if (selectedPractice?.id === practiceId) {
                setSelectedPractice(null);
            }
        }
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
    };

    const toggleSubcategory = (subcategoryId: string) => {
        setExpandedSubcategories(prev => ({
            ...prev,
            [subcategoryId]: !prev[subcategoryId]
        }));
    };

    const handlePreview = (doc: Document) => {
        setPreviewingDocument(doc);
        setIsPreviewModalOpen(true);
    };

    const isPdf = (docName: string) => docName.toLowerCase().endsWith('.pdf');

    return (
        <div className="flex h-full space-x-6">
            <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title={editingActivity?.id ? 'Editar Actividad' : 'Nueva Actividad'}>
                <ActivityForm 
                    activity={editingActivity} 
                    onClose={() => setIsActivityModalOpen(false)}
                    onSave={handleSaveActivity}
                />
            </Modal>
             <Modal isOpen={isPracticeModalOpen} onClose={() => setIsPracticeModalOpen(false)} title={editingPractice?.id ? 'Editar Práctica' : 'Nueva Práctica'}>
                <PracticeForm 
                    practice={editingPractice}
                    onClose={() => setIsPracticeModalOpen(false)}
                    onSave={handleSavePractice}
                />
            </Modal>
            <Modal 
                isOpen={isPreviewModalOpen} 
                onClose={() => setIsPreviewModalOpen(false)} 
                title={previewingDocument?.name || 'Vista Previa'}
                maxWidth="sm:max-w-4xl"
            >
                {previewingDocument && (
                    <iframe 
                        src={previewingDocument.url} 
                        className="w-full h-[80vh]" 
                        title={previewingDocument.name}
                    ></iframe>
                )}
            </Modal>
            
            <aside className="w-1/3 max-w-sm flex-shrink-0">
                 <Card className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-xl font-bold">Prácticas ITIL</h2>
                        {userRole?.permissions.canViewAllCategories && (
                            <button onClick={handleAddPractice} className="p-1.5 text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200" title="Añadir nueva práctica">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div className="space-y-1 overflow-y-auto">
                        {Object.entries(practicesByGroup).map(([groupName, practicesInGroup]) => (
                            <div key={groupName}>
                                <button onClick={() => setExpandedGroups(p => ({...p, [groupName]: !p[groupName]}))} className="w-full flex justify-between items-center text-left py-2 px-2 rounded-md hover:bg-gray-100">
                                    <span className="font-semibold text-gray-800">{groupName}</span>
                                    {expandedGroups[groupName] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                </button>
                                {expandedGroups[groupName] && (
                                    <div className="pl-4 py-1 space-y-1">
                                        {practicesInGroup.map(practice => (
                                            <div key={practice.id} className="group flex items-center justify-between rounded-md hover:bg-gray-50">
                                                <button onClick={() => handleSelectPractice(practice)} className={`flex-grow text-left py-1.5 px-2 text-sm rounded-l-md truncate ${selectedPractice?.id === practice.id ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600'}`}>
                                                    {practice.name}
                                                </button>
                                                {userRole?.permissions.canViewAllCategories && (
                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center pr-2 space-x-1 flex-shrink-0">
                                                        <button onClick={() => handleEditPractice(practice)} className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-gray-200" title="Editar Práctica"><PencilIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeletePractice(practice.id)} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-200" title="Eliminar Práctica"><TrashIcon className="w-4 h-4" /></button>
                                                    </div>
                                                )}
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
                                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></span><span>A tiempo / Completado</span></div>
                                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5"></span><span>Por iniciar</span></div>
                                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span><span>Vencido / Atrasado</span></div>
                                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 mr-1.5"></span><span>No iniciado</span></div>
                            </div>
                        </Card>
                        
                        <div className="space-y-4">
                             {userRole?.permissions.canViewAllCategories && (
                                <div className="flex justify-end">
                                    <button onClick={handleAddCategory} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                        <PlusIcon className="mr-1" /> Añadir Categoría
                                    </button>
                                </div>
                            )}

                            {selectedPractice.categories.map(cat => {
                                const isCatExpanded = expandedCategories[cat.id];
                                const canUserEditThisCategory = canEdit(cat.id);
                                const filteredSubcategories: Subcategory[] = cat.subcategories.map(sub => ({
                                    ...sub,
                                    activities: sub.activities.filter(activity => {
                                        if (!activity.dueDate) return false; 
                                        const activityDate = new Date(activity.dueDate);
                                        const yearMatch = selectedYear === 'all' || activityDate.getFullYear() === selectedYear;
                                        const monthMatch = selectedMonth === 'all' || activityDate.getMonth() === selectedMonth;
                                        return yearMatch && monthMatch;
                                    })
                                }));

                                return (
                                <Card key={cat.id}>
                                    <div className="flex justify-between items-center group">
                                         {editing.type === 'category' && editing.id === cat.id ? (
                                            <form onSubmit={e => { e.preventDefault(); handleSaveEdit(); }} className="flex-1 flex items-center space-x-2">
                                                <input type="text" value={editing.name} onChange={e => setEditing(prev => ({ ...prev, name: e.target.value }))} autoFocus className="w-full text-xl font-bold px-2 py-1 border border-indigo-300 rounded-md" />
                                                <button type="submit" className="text-green-600 hover:bg-green-100 p-1 rounded"><CheckIcon className="w-5 h-5" /></button>
                                                <button type="button" onClick={handleCancelEdit} className="text-red-600 hover:bg-red-100 p-1 rounded"><XMarkIcon className="w-5 h-5" /></button>
                                            </form>
                                        ) : (
                                            <div className="flex items-center flex-1 truncate">
                                                <button onClick={() => toggleCategory(cat.id)} className="flex items-center text-left p-1 -ml-1 rounded-md hover:bg-gray-100 flex-shrink-0" aria-expanded={isCatExpanded}>
                                                    {isCatExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-500" /> : <ChevronRightIcon className="w-5 h-5 text-gray-500" />}
                                                    <span className="sr-only">{isCatExpanded ? 'Colapsar' : 'Expandir'}</span>
                                                </button>
                                                <h2 className="font-bold text-xl ml-2 truncate" title={cat.name}>{cat.name}</h2>
                                                {canUserEditThisCategory && (
                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center ml-2 space-x-1 flex-shrink-0">
                                                        <button onClick={() => handleStartEdit('category', cat.id, cat.name)} className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-gray-200" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-200" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {canUserEditThisCategory && editing.id !== cat.id && (
                                             <button onClick={() => handleAddSubcategory(cat.id)} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 ml-4 flex-shrink-0">
                                                <PlusIcon className="mr-1" /> Añadir Subcategoría
                                            </button>
                                        )}
                                    </div>
                                    {isCatExpanded && (
                                        <div className="pl-6 mt-2 border-l border-gray-200 ml-2 space-y-4">
                                            {filteredSubcategories.map(sub => {
                                                const isSubExpanded = expandedSubcategories[sub.id];
                                                return (
                                                <div key={sub.id} className="pt-4">
                                                    <div className="flex justify-between items-center group">
                                                        {editing.type === 'subcategory' && editing.id === sub.id ? (
                                                            <form onSubmit={e => { e.preventDefault(); handleSaveEdit(); }} className="flex-1 flex items-center space-x-2">
                                                                <input type="text" value={editing.name} onChange={e => setEditing(prev => ({ ...prev, name: e.target.value }))} autoFocus className="w-full text-lg font-semibold px-2 py-1 border border-indigo-300 rounded-md" />
                                                                <button type="submit" className="text-green-600 hover:bg-green-100 p-1 rounded"><CheckIcon className="w-5 h-5" /></button>
                                                                <button type="button" onClick={handleCancelEdit} className="text-red-600 hover:bg-red-100 p-1 rounded"><XMarkIcon className="w-5 h-5" /></button>
                                                            </form>
                                                        ) : (
                                                            <div className="flex items-center flex-1 truncate">
                                                                <button onClick={() => toggleSubcategory(sub.id)} className="flex items-center text-left p-1 -ml-1 rounded-md hover:bg-gray-100 flex-shrink-0" aria-expanded={isSubExpanded}>
                                                                    {isSubExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-500" /> : <ChevronRightIcon className="w-5 h-5 text-gray-500" />}
                                                                </button>
                                                                <h3 className="font-semibold text-lg ml-2 truncate" title={sub.name}>{sub.name}</h3>
                                                                {canUserEditThisCategory && (
                                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center ml-2 space-x-1 flex-shrink-0">
                                                                        <button onClick={() => handleStartEdit('subcategory', sub.id, sub.name)} className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-gray-200" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                                                                        <button onClick={() => handleDeleteSubcategory(sub.id)} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-200" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {canUserEditThisCategory && editing.id !== sub.id && (
                                                            <button onClick={() => handleAddActivity(sub.id, cat.id)} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 ml-4 flex-shrink-0">
                                                                <PlusIcon className="mr-1" /> Añadir Actividad
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="pl-8 mt-1 mb-3">
                                                        {editing.type === 'path' && editing.id === sub.id ? (
                                                            <form onSubmit={e => { e.preventDefault(); handleSaveEdit(); }} className="flex items-center space-x-2 text-xs">
                                                                <FolderIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                <input 
                                                                    type="text" 
                                                                    value={editing.name} 
                                                                    onChange={e => setEditing(prev => ({ ...prev, name: e.target.value }))} 
                                                                    autoFocus 
                                                                    className="flex-grow font-mono text-indigo-800 bg-indigo-50 px-1 py-0.5 border border-indigo-300 rounded-md"
                                                                />
                                                                <button type="submit" className="text-green-600 hover:bg-green-100 p-1 rounded"><CheckIcon className="w-4 h-4" /></button>
                                                                <button type="button" onClick={handleCancelEdit} className="text-red-600 hover:bg-red-100 p-1 rounded"><XMarkIcon className="w-4 h-4" /></button>
                                                            </form>
                                                        ) : (
                                                            <div className="flex items-center group text-xs text-gray-600">
                                                                <FolderIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                                                <span>Ruta:</span>
                                                                <code className="ml-2 bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono truncate" title={sub.sharepointFolderPath || 'No definida'}>
                                                                    {sub.sharepointFolderPath || 'No definida'}
                                                                </code>
                                                                {canUserEditThisCategory && (
                                                                    <button onClick={() => handleStartEdit('path', sub.id, sub.sharepointFolderPath || '')} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-gray-200 ml-1" title="Editar Ruta de SharePoint">
                                                                        <PencilIcon className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isSubExpanded && (
                                                    <div className="mt-3 pl-8">
                                                        {sub.activities.length > 0 ? (
                                                            <ul className="divide-y divide-gray-200">
                                                                {sub.activities.map(act => (
                                                                    <li key={act.id} id={`activity-${act.id}`} className="py-3 px-2 -mx-2 transition-all duration-1000">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center truncate">
                                                                                {act.activityStatus === ActivityStatus.CLOSED ? 
                                                                                    <LockClosedIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" /> : 
                                                                                    <LockOpenIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                                                                }
                                                                                <div className="truncate">
                                                                                    <p className="font-medium text-gray-900 truncate" title={act.name}>{act.name}</p>
                                                                                    <p className="text-sm text-gray-500 truncate">{users.find(u => u.id === act.responsible)?.fullName || 'Sin asignar'}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                                                                                <div className="text-right">
                                                                                    <SemaphoreBadge status={act.semaphoreStatus} completionDate={act.completionDate} />
                                                                                    <p className="text-xs text-gray-500 mt-1">Vence: {formatDate(act.dueDate)}</p>
                                                                                </div>
                                                                                <div className="flex items-center space-x-1">
                                                                                    {act.activityStatus === ActivityStatus.OPEN && (canUserEditThisCategory || act.responsible === currentUser?.id) && (<button onClick={() => handleEditActivity(act, sub.id, cat.id)} className="text-gray-400 hover:text-indigo-600" title="Editar Actividad"><PencilIcon className="w-4 h-4" /></button>)}
                                                                                    {act.activityStatus === ActivityStatus.OPEN && userRole?.permissions.canCloneActivity && (<button onClick={() => handleCloneActivity(act, sub.id)} className="text-gray-400 hover:text-blue-600" title="Clonar Actividad"><DuplicateIcon className="w-4 h-4" /></button>)}
                                                                                    {act.activityStatus === ActivityStatus.OPEN && userRole?.permissions.canDeleteActivity && (<button onClick={() => handleDeleteActivity(act.id, sub.id)} className="text-gray-400 hover:text-red-600" title="Eliminar Actividad"><TrashIcon className="w-4 h-4" /></button>)}
                                                                                    {act.activityStatus === ActivityStatus.CLOSED && userRole?.permissions.canViewAllCategories && (<button onClick={() => handleReopenActivity(act.id, sub.id)} className="text-gray-400 hover:text-green-600" title="Reabrir Actividad"><LockOpenIcon className="w-4 h-4" /></button>)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-2 text-sm text-gray-600 pl-6">{act.description}</div>
                                                                        {act.documents.length > 0 && (
                                                                            <div className="mt-3 pt-2 border-t border-gray-100 pl-6">
                                                                                <h4 className="text-xs font-semibold text-gray-600 mb-2">Evidencias:</h4>
                                                                                <p className="text-xs text-gray-500 mb-2">Ruta de SharePoint (simulada): <code>{`/${sharePointConfig.siteUrl.split('/').pop() || 'Site'}/${sub.sharepointFolderPath || '[Ruta-No-Definida]'}/`}</code></p>
                                                                                <div className="space-y-2">
                                                                                    {act.documents.sort((a, b) => a.originalName.localeCompare(b.originalName) || b.version - a.version).map(doc => (
                                                                                        <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm hover:bg-gray-100">
                                                                                            <div className="flex items-center truncate flex-grow">
                                                                                                <PaperClipIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                                                                                                <div className="truncate">
                                                                                                    <span className="font-medium text-gray-800 truncate" title={doc.name}>{doc.name}</span>
                                                                                                    <div className="text-xs text-gray-500">
                                                                                                        <span>v{doc.version}</span>
                                                                                                        <span className="mx-1.5">·</span>
                                                                                                        <span>{formatDate(doc.uploadDate)}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                                                                                                {isPdf(doc.name) && (
                                                                                                    <button onClick={() => handlePreview(doc)} className="text-gray-400 hover:text-blue-600" title="Previsualizar PDF">
                                                                                                        <EyeIcon className="w-4 h-4" />
                                                                                                    </button>
                                                                                                )}
                                                                                                <a href={doc.url} download={doc.name} className="text-gray-400 hover:text-indigo-600" title="Descargar archivo">
                                                                                                    <DownloadIcon className="w-4 h-4" />
                                                                                                </a>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 text-center py-4">No hay actividades para el período seleccionado.</p>
                                                        )}
                                                    </div>
                                                    )}
                                                </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </Card>
                                )
                            })}
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
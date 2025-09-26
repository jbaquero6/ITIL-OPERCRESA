import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { Activity, SemaphoreStatus, Practice, ActivityStatus } from '../types';
import Card from './ui/Card';
import { formatDate, calculateSemaphoreStatus } from '../utils/helpers';
import { ITIL_PRACTICE_GROUPS } from '../constants';
import { ChevronDownIcon, ChevronRightIcon } from './Icons';
import Modal from './ui/Modal';
import ActivityForm from './forms/ActivityForm';

interface EnhancedActivity extends Activity {
    practiceId: string;
    practiceName: string;
    categoryId: string;
    subcategoryId: string;
    categoryName: string;
    subcategoryName: string;
}

// FIX: Define the PracticeStats interface to resolve 'Cannot find name' error.
interface PracticeStats {
    id: string;
    name: string;
    group: string;
    totalActivities: number;
    stats: Record<SemaphoreStatus, number>;
    activityStatusStats: Record<ActivityStatus, number>;
    percentages: Record<SemaphoreStatus, number>;
    averageProgress: number;
}

const Dashboard: React.FC = () => {
    const { practices, setPractices, currentUser, users, roles } = useData();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(currentMonth);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
        ITIL_PRACTICE_GROUPS.reduce((acc, group) => ({ ...acc, [group.name]: true }), {})
    );

    const [selectedActivity, setSelectedActivity] = useState<EnhancedActivity | null>(null);

    const handleSaveActivity = (activityData: Partial<Activity>) => {
        if (!selectedActivity) return;

        const { practiceId, categoryId, subcategoryId } = selectedActivity;

        setPractices(prevPractices => {
            return prevPractices.map(p => {
                if (p.id !== practiceId) return p;
                return {
                    ...p,
                    categories: p.categories.map(c => {
                        if (c.id !== categoryId) return c;
                        return {
                            ...c,
                            subcategories: c.subcategories.map(sc => {
                                if (sc.id !== subcategoryId) return sc;
                                
                                const finalActivity = {
                                    ...activityData,
                                    semaphoreStatus: calculateSemaphoreStatus(activityData),
                                    activityStatus: (activityData.progress ?? 0) === 100 ? ActivityStatus.CLOSED : ActivityStatus.OPEN,
                                } as Activity;

                                return {
                                    ...sc,
                                    activities: sc.activities.map(a => a.id === activityData.id ? finalActivity : a),
                                };
                            })
                        };
                    })
                };
            });
        });
        
        setSelectedActivity(null); // Close modal on save
    };

     const userRole = useMemo(() => {
        return currentUser ? roles.find(r => r.id === currentUser.roleId) : null;
    }, [currentUser, roles]);

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

    const visiblePractices = useMemo(() => {
        if (!currentUser || !userRole) return [];
        if (userRole.permissions.canViewAllCategories) {
            return practices;
        }
        const allowedCategoryIds = new Set(currentUser.permissions.map(p => p.categoryId));
        return practices
            .map(p => ({
                ...p,
                categories: p.categories.filter(c => allowedCategoryIds.has(c.id)),
            }))
            .filter(p => p.categories.length > 0);
    }, [practices, currentUser, userRole]);

    // FIX: Corrected the type for filteredPracticeStats from a complex, incorrect type to PracticeStats[].
    const filteredPracticeStats: PracticeStats[] = useMemo(() => {
        return visiblePractices.map(practice => {
            const allActivities = practice.categories.flatMap(c => c.subcategories.flatMap(sc => sc.activities));

            const filteredActivities = allActivities.filter(activity => {
                if (!activity.dueDate) return false;
                const activityDate = new Date(activity.dueDate);
                
                const yearMatch = selectedYear === 'all' || activityDate.getFullYear() === selectedYear;
                const monthMatch = selectedMonth === 'all' || activityDate.getMonth() === selectedMonth;

                return yearMatch && monthMatch;
            });

            const stats = filteredActivities.reduce((acc, activity) => {
                acc[activity.semaphoreStatus] = (acc[activity.semaphoreStatus] || 0) + 1;
                return acc;
            }, {} as Record<SemaphoreStatus, number>);

            const activityStatusStats = filteredActivities.reduce((acc, activity) => {
                acc[activity.activityStatus] = (acc[activity.activityStatus] || 0) + 1;
                return acc;
            }, {} as Record<ActivityStatus, number>);

            const total = filteredActivities.length;
            const totalProgress = filteredActivities.reduce((sum, act) => sum + (act.progress || 0), 0);
            const averageProgress = total > 0 ? totalProgress / total : 0;

            return {
                id: practice.id,
                name: practice.name,
                group: practice.group,
                totalActivities: total,
                stats,
                activityStatusStats,
                percentages: {
                    [SemaphoreStatus.GREEN]: total > 0 ? ((stats[SemaphoreStatus.GREEN] || 0) / total) * 100 : 0,
                    [SemaphoreStatus.RED]: total > 0 ? ((stats[SemaphoreStatus.RED] || 0) / total) * 100 : 0,
                    [SemaphoreStatus.ORANGE]: total > 0 ? ((stats[SemaphoreStatus.ORANGE] || 0) / total) * 100 : 0,
                    [SemaphoreStatus.GRAY]: total > 0 ? ((stats[SemaphoreStatus.GRAY] || 0) / total) * 100 : 0,
                },
                averageProgress,
            };
        });
    }, [visiblePractices, selectedYear, selectedMonth]);

    const consolidatedGroupStats = useMemo(() => {
        return ITIL_PRACTICE_GROUPS.map(group => {
            const practicesInGroup = filteredPracticeStats.filter(p => p.group === group.name);
    
            const totalActivities = practicesInGroup.reduce((sum, p) => sum + p.totalActivities, 0);
            
            const stats: Record<SemaphoreStatus, number> = practicesInGroup.reduce((acc, p) => {
                (Object.keys(p.stats) as SemaphoreStatus[]).forEach(status => {
                    acc[status] = (acc[status] || 0) + (p.stats[status] || 0);
                });
                return acc;
            }, { [SemaphoreStatus.GREEN]: 0, [SemaphoreStatus.RED]: 0, [SemaphoreStatus.GRAY]: 0, [SemaphoreStatus.ORANGE]: 0 });

            const activityStatusStats: Record<ActivityStatus, number> = practicesInGroup.reduce((acc, p) => {
                (Object.keys(p.activityStatusStats) as ActivityStatus[]).forEach(status => {
                    acc[status] = (acc[status] || 0) + (p.activityStatusStats[status] || 0);
                });
                return acc;
            }, { [ActivityStatus.OPEN]: 0, [ActivityStatus.CLOSED]: 0 });

            const totalProgressSum = practicesInGroup.reduce((sum, p) => sum + (p.averageProgress * p.totalActivities), 0);
            const averageProgress = totalActivities > 0 ? totalProgressSum / totalActivities : 0;
    
            return {
                name: group.name,
                totalActivities,
                stats,
                activityStatusStats,
                percentages: {
                    [SemaphoreStatus.GREEN]: totalActivities > 0 ? (stats[SemaphoreStatus.GREEN] / totalActivities) * 100 : 0,
                    [SemaphoreStatus.RED]: totalActivities > 0 ? (stats[SemaphoreStatus.RED] / totalActivities) * 100 : 0,
                    [SemaphoreStatus.ORANGE]: totalActivities > 0 ? (stats[SemaphoreStatus.ORANGE] / totalActivities) * 100 : 0,
                    [SemaphoreStatus.GRAY]: totalActivities > 0 ? (stats[SemaphoreStatus.GRAY] / totalActivities) * 100 : 0,
                },
                averageProgress,
            };
        });
    }, [filteredPracticeStats]);

    const upcomingDeadlines = useMemo(() => {
        const deadlines = {
            in7days: [] as EnhancedActivity[],
            in15days: [] as EnhancedActivity[],
            in30days: [] as EnhancedActivity[],
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const in7 = new Date(today);
        in7.setDate(today.getDate() + 7);
        const in15 = new Date(today);
        in15.setDate(today.getDate() + 15);
        const in30 = new Date(today);
        in30.setDate(today.getDate() + 30);

        visiblePractices.forEach(practice => {
            practice.categories.forEach(category => {
                category.subcategories.forEach(subcategory => {
                    subcategory.activities.forEach(activity => {
                        if (activity.dueDate && !activity.completionDate) {
                            const dueDate = new Date(activity.dueDate);
                            dueDate.setHours(0, 0, 0, 0);

                            const enhancedActivity: EnhancedActivity = {
                                ...activity,
                                practiceId: practice.id,
                                practiceName: practice.name,
                                categoryId: category.id,
                                subcategoryId: subcategory.id,
                                categoryName: category.name,
                                subcategoryName: subcategory.name,
                            };

                            if (dueDate >= today && dueDate <= in7) {
                                deadlines.in7days.push(enhancedActivity);
                            } else if (dueDate > in7 && dueDate <= in15) {
                                deadlines.in15days.push(enhancedActivity);
                            } else if (dueDate > in15 && dueDate <= in30) {
                                deadlines.in30days.push(enhancedActivity);
                            }
                        }
                    });
                });
            });
        });

        return deadlines;
    }, [visiblePractices]);

    const periodText: string = useMemo(() => {
        if (selectedYear === 'all' && selectedMonth === 'all') {
            return 'en total';
        } else if (selectedMonth === 'all') {
            return `en ${selectedYear}`;
        } else if (selectedYear === 'all') {
            return `en ${months[selectedMonth as number]} (todos los años)`;
        } else {
            return `en ${months[selectedMonth as number]} ${selectedYear}`;
        }
    }, [selectedYear, selectedMonth, months]);

    const renderDeadlineList = (activities: EnhancedActivity[]) => {
        if (activities.length === 0) {
            return <p className="text-sm text-gray-500">Ninguna</p>;
        }
        return (
            <ul className="divide-y divide-gray-100">
                {activities.map(act => (
                    <li key={act.id} className="py-2">
                        <button
                            onClick={() => setSelectedActivity(act)}
                            className="w-full text-left transition-colors hover:bg-gray-50 p-2 -m-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            aria-label={`Ir a la actividad ${act.name}`}
                        >
                            <div className="flex justify-between items-start">
                                 <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium text-gray-800 truncate" title={act.name}>{act.name}</p>
                                    <p className="text-xs text-gray-500 truncate" title={`${act.categoryName} / ${act.subcategoryName}`}>
                                        {act.practiceName} / {act.categoryName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                        <span className="font-semibold">Resp:</span> {users.find(u => u.id === act.responsible)?.fullName || 'Sin asignar'}
                                    </p>
                                </div>
                                <span className="text-sm font-medium text-gray-600 flex-shrink-0 ml-2">{formatDate(act.dueDate)}</span>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="space-y-6">
             <Modal isOpen={!!selectedActivity} onClose={() => setSelectedActivity(null)} title={selectedActivity?.id ? 'Editar Actividad' : 'Nueva Actividad'}>
                <ActivityForm 
                    activity={selectedActivity} 
                    onClose={() => setSelectedActivity(null)}
                    onSave={handleSaveActivity}
                />
            </Modal>
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
                 <div className="flex items-center space-x-2">
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

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-indigo-800 pb-2 border-b border-indigo-200">Resumen General por Grupo</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {consolidatedGroupStats.map(group => (
                         <Card key={group.name}>
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-lg truncate text-indigo-700 flex-1" title={group.name}>{group.name}</h3>
                                {group.totalActivities > 0 && (
                                    <div className="text-right ml-2 flex-shrink-0">
                                        <p className="font-bold text-xl text-indigo-800">{Math.round(group.averageProgress)}%</p>
                                        <p className="text-xs text-indigo-600 -mt-1">Avance</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                {group.totalActivities} actividades {periodText}
                            </p>
                            {group.totalActivities > 0 ? (
                                <>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 my-2 flex">
                                        <div className="bg-green-500 h-2.5 rounded-l-full" style={{ width: `${group.percentages[SemaphoreStatus.GREEN]}%` }}></div>
                                        <div className="bg-orange-500 h-2.5" style={{ width: `${group.percentages[SemaphoreStatus.ORANGE]}%` }}></div>
                                        <div className="bg-red-500 h-2.5" style={{ width: `${group.percentages[SemaphoreStatus.RED]}%` }}></div>
                                        <div className="bg-gray-400 h-2.5 rounded-r-full" style={{ width: `${group.percentages[SemaphoreStatus.GRAY]}%` }}></div>
                                    </div>
                                    <div className="flex flex-col space-y-1 text-sm mt-3">
                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>A tiempo / Completado: <span className="font-medium ml-auto">{group.stats[SemaphoreStatus.GREEN] || 0}</span></div>
                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>Por iniciar: <span className="font-medium ml-auto">{group.stats[SemaphoreStatus.ORANGE] || 0}</span></div>
                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Vencido / Atrasado: <span className="font-medium ml-auto">{group.stats[SemaphoreStatus.RED] || 0}</span></div>
                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>No iniciado: <span className="font-medium ml-auto">{group.stats[SemaphoreStatus.GRAY] || 0}</span></div>
                                        <div className="pt-2 mt-2 border-t border-indigo-100">
                                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Abiertas: <span className="font-medium ml-auto">{group.activityStatusStats?.[ActivityStatus.OPEN] || 0}</span></div>
                                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>Cerradas: <span className="font-medium ml-auto">{group.activityStatusStats?.[ActivityStatus.CLOSED] || 0}</span></div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No hay actividades para este período.</p>
                            )}
                        </Card>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                 {ITIL_PRACTICE_GROUPS.map(group => {
                    const practicesInGroup = filteredPracticeStats.filter(p => p.group === group.name && p.totalActivities > 0);
                    const isExpanded = expandedGroups[group.name];

                    if (practicesInGroup.length === 0 && !Object.values(expandedGroups).some(v => v)) {
                        return null;
                    }

                    return (
                        <Card key={group.name}>
                            <button
                                onClick={() => setExpandedGroups(prev => ({ ...prev, [group.name]: !prev[group.name] }))}
                                className="w-full flex justify-between items-center text-left py-2"
                                aria-expanded={isExpanded}
                            >
                                <h2 className="text-xl font-semibold text-gray-700">{group.name}</h2>
                                {isExpanded ? <ChevronDownIcon className="w-6 h-6 text-gray-500" /> : <ChevronRightIcon className="w-6 h-6 text-gray-500" />}
                            </button>
                            
                            {isExpanded && (
                                <div className="mt-4 border-t pt-6">
                                    {practicesInGroup.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {practicesInGroup.map(practice => (
                                                <Card key={practice.id} className="!p-4 !shadow-md">
                                                     <div className="flex justify-between items-start">
                                                        <h3 className="font-semibold text-base truncate flex-1" title={practice.name}>{practice.name}</h3>
                                                        {practice.totalActivities > 0 && (
                                                            <div className="text-right ml-2 flex-shrink-0">
                                                                <p className="font-bold text-lg text-gray-800">{Math.round(practice.averageProgress)}%</p>
                                                                <p className="text-xs text-gray-500 -mt-1">Avance</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-3 -mt-2">
                                                        {practice.totalActivities} actividades {periodText}
                                                    </p>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 my-2 flex">
                                                        <div className="bg-green-500 h-2 rounded-l-full" style={{ width: `${practice.percentages[SemaphoreStatus.GREEN]}%` }}></div>
                                                        <div className="bg-orange-500 h-2" style={{ width: `${practice.percentages[SemaphoreStatus.ORANGE]}%` }}></div>
                                                        <div className="bg-red-500 h-2" style={{ width: `${practice.percentages[SemaphoreStatus.RED]}%` }}></div>
                                                        <div className="bg-gray-400 h-2 rounded-r-full" style={{ width: `${practice.percentages[SemaphoreStatus.GRAY]}%` }}></div>
                                                    </div>
                                                    <div className="flex flex-col space-y-1 text-xs mt-2">
                                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>A tiempo / Completado: <span className="font-medium ml-auto">{practice.stats[SemaphoreStatus.GREEN] || 0}</span></div>
                                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>Por iniciar: <span className="font-medium ml-auto">{practice.stats[SemaphoreStatus.ORANGE] || 0}</span></div>
                                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Vencido / Atrasado: <span className="font-medium ml-auto">{practice.stats[SemaphoreStatus.RED] || 0}</span></div>
                                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>No iniciado: <span className="font-medium ml-auto">{practice.stats[SemaphoreStatus.GRAY] || 0}</span></div>
                                                        <div className="pt-2 mt-2 border-t border-gray-100">
                                                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Abiertas: <span className="font-medium ml-auto">{practice.activityStatusStats?.[ActivityStatus.OPEN] || 0}</span></div>
                                                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>Cerradas: <span className="font-medium ml-auto">{practice.activityStatusStats?.[ActivityStatus.CLOSED] || 0}</span></div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">No hay datos de prácticas para mostrar en este período.</p>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            <Card>
                <h2 className="text-xl font-semibold mb-4">Próximos Vencimientos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">En 7 días</h3>
                        {renderDeadlineList(upcomingDeadlines.in7days)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">En 15 días</h3>
                        {renderDeadlineList(upcomingDeadlines.in15days)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">En 30 días</h3>
                        {renderDeadlineList(upcomingDeadlines.in30days)}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { Activity, SemaphoreStatus, Role, Practice } from '../types';
import Card from './ui/Card';
import { formatDate } from '../utils/helpers';
import { ITIL_PRACTICE_GROUPS } from '../constants';

interface PracticeStats {
    id: string;
    name: string;
    group: string;
    totalActivities: number;
    stats: Record<SemaphoreStatus, number>;
    percentages: Record<SemaphoreStatus, number>;
}


const Dashboard: React.FC = () => {
    const { practices, currentUser, users } = useData();

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

    const visiblePractices = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === Role.ADMIN) {
            return practices;
        }
        const allowedCategoryIds = new Set(currentUser.permissions.map(p => p.categoryId));
        return practices
            .map(p => ({
                ...p,
                categories: p.categories.filter(c => allowedCategoryIds.has(c.id)),
            }))
            .filter(p => p.categories.length > 0);
    }, [practices, currentUser]);

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
                acc[activity.status] = (acc[activity.status] || 0) + 1;
                return acc;
            }, {} as Record<SemaphoreStatus, number>);

            const total = filteredActivities.length;

            return {
                id: practice.id,
                name: practice.name,
                group: practice.group,
                totalActivities: total,
                stats,
                percentages: {
                    [SemaphoreStatus.GREEN]: total > 0 ? ((stats[SemaphoreStatus.GREEN] || 0) / total) * 100 : 0,
                    [SemaphoreStatus.RED]: total > 0 ? ((stats[SemaphoreStatus.RED] || 0) / total) * 100 : 0,
                    [SemaphoreStatus.ORANGE]: total > 0 ? ((stats[SemaphoreStatus.ORANGE] || 0) / total) * 100 : 0,
                    [SemaphoreStatus.GRAY]: total > 0 ? ((stats[SemaphoreStatus.GRAY] || 0) / total) * 100 : 0,
                }
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
    
            return {
                name: group.name,
                totalActivities,
                stats,
                percentages: {
                    [SemaphoreStatus.GREEN]: totalActivities > 0 ? (stats[SemaphoreStatus.GREEN] / totalActivities) * 100 : 0,
                    [SemaphoreStatus.RED]: totalActivities > 0 ? (stats[SemaphoreStatus.RED] / totalActivities) * 100 : 0,
                    [SemaphoreStatus.ORANGE]: totalActivities > 0 ? (stats[SemaphoreStatus.ORANGE] / totalActivities) * 100 : 0,
                    [SemaphoreStatus.GRAY]: totalActivities > 0 ? (stats[SemaphoreStatus.GRAY] / totalActivities) * 100 : 0,
                }
            };
        });
    }, [filteredPracticeStats]);

    const upcomingDeadlines = useMemo(() => {
        const allActivities = visiblePractices.flatMap(p => p.categories.flatMap(c => c.subcategories.flatMap(sc => sc.activities)));
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const deadlines = {
            in7days: [] as Activity[],
            in14days: [] as Activity[],
            in30days: [] as Activity[],
        };

        const in7 = new Date(today);
        in7.setDate(today.getDate() + 7);
        const in14 = new Date(today);
        in14.setDate(today.getDate() + 14);
        const in30 = new Date(today);
        in30.setDate(today.getDate() + 30);

        for (const activity of allActivities) {
            if (activity.dueDate && !activity.completionDate) {
                const dueDate = new Date(activity.dueDate);
                 dueDate.setHours(0,0,0,0);
                if (dueDate >= today && dueDate <= in7) {
                    deadlines.in7days.push(activity);
                } else if (dueDate > in7 && dueDate <= in14) {
                    deadlines.in14days.push(activity);
                } else if (dueDate > in14 && dueDate <= in30) {
                    deadlines.in30days.push(activity);
                }
            }
        }
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


    return (
        <div className="space-y-6">
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
                            <h3 className="font-semibold text-lg truncate text-indigo-700" title={group.name}>{group.name}</h3>
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
                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Completado a tiempo: <span className="font-medium ml-auto">{group.stats[SemaphoreStatus.GREEN] || 0}</span></div>
                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>Por iniciar: <span className="font-medium ml-auto">{group.stats[SemaphoreStatus.ORANGE] || 0}</span></div>
                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Atrasado/Vencido: <span className="font-medium ml-auto">{group.stats[SemaphoreStatus.RED] || 0}</span></div>
                                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>No iniciado: <span className="font-medium ml-auto">{group.stats[SemaphoreStatus.GRAY] || 0}</span></div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No hay actividades para este período.</p>
                            )}
                        </Card>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                 {ITIL_PRACTICE_GROUPS.map(group => {
                    const practicesInGroup = filteredPracticeStats.filter(p => p.group === group.name && p.totalActivities > 0);
                    
                    if (practicesInGroup.length === 0) {
                        return null;
                    }

                    return (
                        <div key={group.name}>
                            <h2 className="text-xl font-semibold mb-4 text-gray-700 pb-2 border-b">{group.name}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {practicesInGroup.map(practice => (
                                    <Card key={practice.id}>
                                        <h3 className="font-semibold text-lg truncate" title={practice.name}>{practice.name}</h3>
                                        <p className="text-sm text-gray-500 mb-4">
                                            {practice.totalActivities} actividades {periodText}
                                        </p>
                                        <>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 my-2 flex">
                                                <div className="bg-green-500 h-2.5 rounded-l-full" style={{ width: `${practice.percentages[SemaphoreStatus.GREEN]}%` }}></div>
                                                <div className="bg-orange-500 h-2.5" style={{ width: `${practice.percentages[SemaphoreStatus.ORANGE]}%` }}></div>
                                                <div className="bg-red-500 h-2.5" style={{ width: `${practice.percentages[SemaphoreStatus.RED]}%` }}></div>
                                                <div className="bg-gray-400 h-2.5 rounded-r-full" style={{ width: `${practice.percentages[SemaphoreStatus.GRAY]}%` }}></div>
                                            </div>
                                            <div className="flex flex-col space-y-1 text-sm mt-3">
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Completado a tiempo: <span className="font-medium ml-auto">{practice.stats[SemaphoreStatus.GREEN] || 0}</span></div>
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>Por iniciar: <span className="font-medium ml-auto">{practice.stats[SemaphoreStatus.ORANGE] || 0}</span></div>
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Atrasado/Vencido: <span className="font-medium ml-auto">{practice.stats[SemaphoreStatus.RED] || 0}</span></div>
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>No iniciado: <span className="font-medium ml-auto">{practice.stats[SemaphoreStatus.GRAY] || 0}</span></div>
                                            </div>
                                        </>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Card>
                <h2 className="text-xl font-semibold mb-4">Próximos Vencimientos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">En 7 días</h3>
                        {upcomingDeadlines.in7days.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {upcomingDeadlines.in7days.map(act => (
                                    <li key={act.id} className="py-2 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 truncate" title={act.name}>
                                                {act.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {users.find(u => u.id === act.responsible)?.fullName || 'Sin asignar'}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 flex-shrink-0">{formatDate(act.dueDate)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="text-sm text-gray-500">Ninguna</p>)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">En 14 días</h3>
                        {upcomingDeadlines.in14days.length > 0 ? (
                             <ul className="divide-y divide-gray-100">
                                {upcomingDeadlines.in14days.map(act => (
                                     <li key={act.id} className="py-2 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 truncate" title={act.name}>
                                                {act.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {users.find(u => u.id === act.responsible)?.fullName || 'Sin asignar'}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 flex-shrink-0">{formatDate(act.dueDate)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="text-sm text-gray-500">Ninguna</p>)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">En 30 días</h3>
                        {upcomingDeadlines.in30days.length > 0 ? (
                             <ul className="divide-y divide-gray-100">
                                {upcomingDeadlines.in30days.map(act => (
                                     <li key={act.id} className="py-2 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 truncate" title={act.name}>
                                                {act.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {users.find(u => u.id === act.responsible)?.fullName || 'Sin asignar'}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 flex-shrink-0">{formatDate(act.dueDate)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="text-sm text-gray-500">Ninguna</p>)}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
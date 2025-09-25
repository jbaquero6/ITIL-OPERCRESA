import React from 'react';
import { SemaphoreStatus } from '../../types';

interface BadgeProps {
    status: SemaphoreStatus;
    completionDate?: string | null;
}

const statusColors: Record<SemaphoreStatus, string> = {
    [SemaphoreStatus.GREEN]: 'bg-green-100 text-green-800',
    [SemaphoreStatus.RED]: 'bg-red-100 text-red-800',
    [SemaphoreStatus.GRAY]: 'bg-gray-200 text-gray-800',
    [SemaphoreStatus.ORANGE]: 'bg-orange-100 text-orange-800',
};

const getStatusLabel = (status: SemaphoreStatus, completionDate?: string | null): string => {
    switch (status) {
        case SemaphoreStatus.GREEN:
            return 'Completado a tiempo';
        case SemaphoreStatus.RED:
            return completionDate ? 'Completado atrasado' : 'Vencido';
        case SemaphoreStatus.ORANGE:
            return 'Por iniciar';
        case SemaphoreStatus.GRAY:
            return 'No iniciado';
        default:
            return status;
    }
};


const SemaphoreBadge: React.FC<BadgeProps> = ({ status, completionDate }) => {
    return (
        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColors[status]}`}>
            {getStatusLabel(status, completionDate)}
        </span>
    );
};

export default SemaphoreBadge;
import React from 'react';
import { ActivityStatus } from '../../types';

interface ActivityStatusBadgeProps {
    status: ActivityStatus;
}

const statusStyles: Record<ActivityStatus, string> = {
    [ActivityStatus.OPEN]: 'bg-blue-100 text-blue-800',
    [ActivityStatus.CLOSED]: 'bg-gray-200 text-gray-800',
};

const ActivityStatusBadge: React.FC<ActivityStatusBadgeProps> = ({ status }) => {
    return (
        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusStyles[status]}`}>
            {status}
        </span>
    );
};

export default ActivityStatusBadge;


import { Practice, User, Role, SemaphoreStatus, LdapConfig, AccessRequest, AccessRequestStatus, Activity, AuthType } from '../types';
import { calculateSemaphoreStatus } from '../utils/helpers';
import { ITIL_PRACTICE_GROUPS } from '../constants';

// Mock users
export const mockUsers: User[] = [
    { id: 'u1', username: 'admin', fullName: 'Administrador del Sistema', email: 'admin@example.com', role: Role.ADMIN, authType: AuthType.LOCAL, password: 'admin', permissions: [] },
    { id: 'u2', username: 'jdoe', fullName: 'John Doe', email: 'jdoe@example.com', role: Role.USER, authType: AuthType.LDAP, permissions: [{ categoryId: 'p0-0-0', canEdit: true }, { categoryId: 'p1-0-0', canEdit: false }] },
    { id: 'u3', username: 'msmith', fullName: 'Mary Smith', email: 'msmith@example.com', role: Role.USER, authType: AuthType.LOCAL, password: 'password123', permissions: [{ categoryId: 'p2-0-0', canEdit: true }] },
];

// Helper to generate activities
const generateActivities = (count: number, subcategoryId: string): Activity[] => {
    const activities: Activity[] = [];
    const today = new Date();
    for (let i = 1; i <= count; i++) {
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + (Math.random() * 60 - 30));
        const hasCompletionDate = Math.random() > 0.3;
        const completionDate = hasCompletionDate ? new Date(dueDate) : null;
        if (completionDate) {
            completionDate.setDate(dueDate.getDate() + (Math.random() * 10 - 5));
        }
        
        const activityData = {
            id: `a-${subcategoryId}-${i}`,
            name: `Actividad ${i}`,
            description: `Descripción de la actividad ${i}.`,
            responsible: mockUsers[1 + (i % 2)].id,
            dueDate: dueDate.toISOString().split('T')[0],
            completionDate: completionDate ? completionDate.toISOString().split('T')[0] : null,
            progress: completionDate ? 100 : Math.floor(Math.random() * 101),
            documents: [],
        };

        activities.push({
            ...activityData,
            status: calculateSemaphoreStatus(activityData),
        });
    }
    return activities;
};

// Generate mock practices
export const mockPractices: Practice[] = ITIL_PRACTICE_GROUPS.flatMap((group, groupIndex) => 
    group.practices.map((practiceName, practiceIndex) => ({
        id: `p${groupIndex}-${practiceIndex}`,
        name: practiceName,
        group: group.name,
        categories: Array.from({ length: Math.floor(Math.random() * 2) + 1 }, (_, catIndex) => {
            const catId = `p${groupIndex}-${practiceIndex}-${catIndex}`;
            return {
                id: catId,
                name: `Categoría ${catIndex + 1}`,
                subcategories: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, subcatIndex) => {
                    const subcatId = `sc-${catId}-${subcatIndex}`;
                    return {
                        id: subcatId,
                        name: `Subcategoría ${subcatIndex + 1}`,
                        activities: generateActivities(Math.floor(Math.random() * 5) + 1, subcatId),
                    };
                }),
            };
        }),
    }))
);


export const mockLdapConfig: LdapConfig = {
    enabled: false,
    serverUrl: 'ldap://ldap.example.com:389',
    baseDN: 'dc=example,dc=com',
    bindDN: 'cn=admin,dc=example,dc=com',
    bindPassword: '',
    userSearchFilter: '(sAMAccountName=%u)',
    usernameAttribute: 'sAMAccountName',
    fullNameAttribute: 'cn',
    emailAttribute: 'mail',
};

export const mockAccessRequests: AccessRequest[] = [
    { id: 'ar1', userId: 'u3', categoryId: 'p0-1-0', status: AccessRequestStatus.PENDING, requestDate: new Date().toISOString() },
    { id: 'ar2', userId: 'u2', categoryId: 'p2-1-0', status: AccessRequestStatus.APPROVED, requestDate: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'ar3', userId: 'u3', categoryId: 'p1-1-0', status: AccessRequestStatus.REJECTED, requestDate: new Date(Date.now() - 86400000 * 3).toISOString() },
];
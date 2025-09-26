// FIX: Import AccessRequest and AccessRequestStatus.
import { Practice, User, SemaphoreStatus, ActivityStatus, LdapConfig, Activity, AuthType, AccessRequest, AccessRequestStatus, Role, SharePointConfig } from '../types';
import { calculateSemaphoreStatus } from '../utils/helpers';
import { ITIL_PRACTICE_GROUPS } from '../constants';

const exampleItilTasks = [
    { name: "Revisar política de seguridad", description: "Revisar y actualizar anualmente la política de seguridad de la información para alinearla con ISO 27001." },
    { name: "Análisis de Impacto (BIA)", description: "Realizar un Análisis de Impacto en el Negocio para los servicios críticos identificados." },
    { name: "Definir KPIs de Incidentes", description: "Definir y documentar los Indicadores Clave de Rendimiento (KPIs) para el proceso de Gestión de Incidentes." },
    { name: "Plan de migración a la nube", description: "Elaborar el plan detallado para la migración del servidor de base de datos a la plataforma AWS RDS." },
    { name: "Prueba de recuperación ante desastres", description: "Ejecutar el plan de recuperación ante desastres (DRP) para el sistema de ERP y documentar los resultados." },
    { name: "Capacitación en nuevo CRM", description: "Impartir capacitación al equipo de soporte sobre las nuevas funcionalidades del sistema CRM." },
    { name: "Evaluar proveedor de cloud", description: "Realizar una evaluación técnica y financiera de los principales proveedores de servicios en la nube (Azure, AWS, GCP)." },
    { name: "Auditoría de licencias", description: "Realizar una auditoría interna para verificar el cumplimiento de las licencias de software de Microsoft y Adobe." },
    { name: "Actualizar Catálogo de Servicios", description: "Añadir el nuevo servicio de 'Soporte para dispositivos móviles' al Catálogo de Servicios." },
    { name: "Implementar parche de seguridad", description: "Aplicar el último parche de seguridad crítico (CVE-2023-XXXX) en todos los servidores web de producción." },
    { name: "Revisión de SLAs", description: "Revisar los Acuerdos de Nivel de Servicio (SLAs) con el departamento de finanzas." },
    { name: "Optimización de base de datos", description: "Realizar tareas de mantenimiento y optimización en la base de datos principal para mejorar el rendimiento." },
    { name: "Crear informe de capacidad", description: "Generar el informe mensual de capacidad y rendimiento de la infraestructura de servidores." },
    { name: "Documentar proceso de cambios", description: "Actualizar la documentación del proceso de Habilitación de Cambios para incluir la aprobación del CAB." },
    { name: "Resolver problema recurrente", description: "Investigar la causa raíz del problema PBI-00123 (fallos intermitentes en la facturación)." }
];

export const mockRoles: Role[] = [
    {
        id: 'role-admin',
        name: 'Administrador',
        description: 'Acceso total a todas las funciones y configuraciones.',
        isDefault: true,
        permissions: {
            canViewDashboard: true,
            canViewPractices: true,
            canViewUsers: true,
            canViewAuthSettings: true,
            canViewRoleManagement: true,
            canViewAllCategories: true,
            canManageUsers: true,
            canManageRoles: true,
            canManageAuthSettings: true,
            canManageSharePointSettings: true,
            canDeleteActivity: true,
            canCloneActivity: true,
        }
    },
    {
        id: 'role-user',
        name: 'Usuario',
        description: 'Puede ver prácticas asignadas y editar actividades si tiene permiso.',
        isDefault: false,
        permissions: {
            canViewDashboard: true,
            canViewPractices: true,
            canViewUsers: false,
            canViewAuthSettings: false,
            canViewRoleManagement: false,
            canViewAllCategories: false,
            canManageUsers: false,
            canManageRoles: false,
            canManageAuthSettings: false,
            canManageSharePointSettings: false,
            canDeleteActivity: false,
            canCloneActivity: false,
        }
    }
];


// Mock users
export const mockUsers: User[] = [
    { id: 'u1', username: 'admin', fullName: 'Administrador del Sistema', email: 'admin@example.com', roleId: 'role-admin', authType: AuthType.LOCAL, password: 'admin', permissions: [] },
    { id: 'u2', username: 'jdoe', fullName: 'John Doe', email: 'jdoe@example.com', roleId: 'role-user', authType: AuthType.LDAP, permissions: [{ categoryId: 'p0-0-0', canEdit: false }, { categoryId: 'p1-0-0', canEdit: false }] },
    { id: 'u3', username: 'msmith', fullName: 'Mary Smith', email: 'msmith@example.com', roleId: 'role-user', authType: AuthType.LOCAL, password: 'password123', permissions: [{ categoryId: 'p2-0-0', canEdit: false }] },
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
        
        const randomTask = exampleItilTasks[Math.floor(Math.random() * exampleItilTasks.length)];
        
        const progress = completionDate ? 100 : Math.floor(Math.random() * 100);
        
        const activityData = {
            id: `a-${subcategoryId}-${i}`,
            name: randomTask.name,
            description: randomTask.description,
            responsible: mockUsers[1 + (i % 2)].id,
            dueDate: dueDate.toISOString().split('T')[0],
            completionDate: completionDate ? completionDate.toISOString().split('T')[0] : null,
            progress: progress,
            activityStatus: progress === 100 ? ActivityStatus.CLOSED : ActivityStatus.OPEN,
            documents: [],
        };

        activities.push({
            ...activityData,
            semaphoreStatus: calculateSemaphoreStatus(activityData),
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
            const categoryName = `Categoría ${catIndex + 1}`;
            return {
                id: catId,
                name: categoryName,
                subcategories: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, subcatIndex) => {
                    const subcatId = `sc-${catId}-${subcatIndex}`;
                    const subCategoryName = `Subcategoría ${subcatIndex + 1}`;
                    return {
                        id: subcatId,
                        name: subCategoryName,
                        sharepointFolderPath: `Evidencias/${practiceName.replace(/\s+/g, '_')}/${categoryName.replace(/\s+/g, '_')}/${subCategoryName.replace(/\s+/g, '_')}`,
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

export const mockSharePointConfig: SharePointConfig = {
    enabled: true,
    siteUrl: 'https://operti.sharepoint.com/sites/ITIL',
    maxFileNameLength: 128,
};


// FIX: Add mock data for access requests.
export const mockAccessRequests: AccessRequest[] = [
    {
        id: 'req1',
        userId: 'u2', // John Doe
        categoryId: 'p2-0-0', // Requesting access to a category Mary Smith has.
        requestDate: new Date('2023-10-25T10:00:00Z').toISOString(),
        status: AccessRequestStatus.PENDING,
    },
    {
        id: 'req2',
        userId: 'u3', // Mary Smith
        // FIX: Completed the mock AccessRequest object which was previously truncated.
        categoryId: 'p1-0-0', // Requesting access to a category John Doe has read-only.
        requestDate: new Date('2023-10-26T14:30:00Z').toISOString(),
        status: AccessRequestStatus.APPROVED,
    },
    {
        id: 'req3',
        userId: 'u3', // Mary Smith
        categoryId: 'p0-0-0', // Requesting access to a category John Doe has edit rights for.
        requestDate: new Date('2023-10-27T09:00:00Z').toISOString(),
        status: AccessRequestStatus.REJECTED,
    },
];
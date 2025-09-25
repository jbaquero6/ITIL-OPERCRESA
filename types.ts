
export enum SemaphoreStatus {
    GREEN = 'Verde',
    RED = 'Rojo',
    GRAY = 'Gris',
    ORANGE = 'Naranja',
}

export enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

export enum AuthType {
    LOCAL = 'Local',
    LDAP = 'Directorio Activo',
}

export interface Document {
    id: string;
    name: string;
    url: string;
}

export interface Activity {
    id:string;
    name: string;
    description: string;
    responsible: string; // userId
    dueDate: string | null;
    completionDate: string | null;
    progress: number;
    status: SemaphoreStatus;
    documents: Document[];
}

export interface Subcategory {
    id: string;
    name: string;
    activities: Activity[];
}

export interface Category {
    id: string;
    name: string;
    subcategories: Subcategory[];
}

export interface Practice {
    id: string;
    name: string;
    group: string;
    categories: Category[];
}

export interface Permission {
    categoryId: string;
    canEdit: boolean;
}

export interface User {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: Role;
    authType: AuthType;
    password?: string;
    permissions: Permission[];
}

export interface LdapConfig {
    enabled: boolean;
    serverUrl: string;
    baseDN: string;
    bindDN: string;
    bindPassword?: string;
    userSearchFilter: string;
    usernameAttribute: string;
    fullNameAttribute: string;
    emailAttribute: string;
}

// FIX: Add missing types for Access Requests.
export enum AccessRequestStatus {
    PENDING = 'Pendiente',
    APPROVED = 'Aprobado',
    REJECTED = 'Rechazado',
}

export interface AccessRequest {
    id: string;
    userId: string;
    categoryId: string;
    requestDate: string;
    status: AccessRequestStatus;
}

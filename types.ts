export enum SemaphoreStatus {
    GREEN = 'Verde',
    RED = 'Rojo',
    GRAY = 'Gris',
    ORANGE = 'Naranja',
}

export enum ActivityStatus {
    OPEN = 'Abierto',
    CLOSED = 'Cerrado',
}

export enum AuthType {
    LOCAL = 'Local',
    LDAP = 'Directorio Activo',
}

export interface Document {
    id: string;
    name: string; // Will store the new, structured filename
    originalName: string;
    url: string;
    version: number;
    uploadDate: string;
}

export interface Activity {
    id:string;
    name: string;
    description: string;
    responsible: string; // userId
    dueDate: string | null;
    completionDate: string | null;
    progress: number;
    semaphoreStatus: SemaphoreStatus;
    activityStatus: ActivityStatus;
    documents: Document[];
}

export interface Subcategory {
    id: string;
    name: string;
    sharepointFolderPath?: string;
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

export interface RolePermissions {
  // View permissions
  canViewDashboard: boolean;
  canViewPractices: boolean;
  canViewUsers: boolean;
  canViewAuthSettings: boolean;
  canViewRoleManagement: boolean;
  canViewAllCategories: boolean; 

  // Action permissions
  canManageUsers: boolean; 
  canManageRoles: boolean; 
  canManageAuthSettings: boolean;
  canManageSharePointSettings: boolean;

  // Activity-specific permissions
  canDeleteActivity: boolean;
  canCloneActivity: boolean;
}

export interface Role {
  id: string;
  name:string;
  description: string;
  isDefault?: boolean;
  permissions: RolePermissions;
}

export interface User {
    id: string;
    username: string;
    fullName: string;
    email: string;
    roleId: string;
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

export interface SharePointConfig {
    enabled: boolean;
    siteUrl: string;
    maxFileNameLength: number;
}

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
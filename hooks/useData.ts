// Fix: Import Dispatch and SetStateAction to use them as types directly.
import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import { Practice, User, LdapConfig, Role } from '../types';

interface IDataContext {
    practices: Practice[];
    setPractices: Dispatch<SetStateAction<Practice[]>>;
    users: User[];
    setUsers: Dispatch<SetStateAction<User[]>>;
    roles: Role[];
    setRoles: Dispatch<SetStateAction<Role[]>>;
    currentUser: User | null;
    ldapConfig: LdapConfig;
    setLdapConfig: Dispatch<SetStateAction<LdapConfig>>;
}

export const DataContext = createContext<IDataContext | undefined>(undefined);

export const useData = (): IDataContext => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
import { SetMetadata } from '@nestjs/common';


enum UsersType {
    Customer = "customer",
    Driver = 'driver',
    Admin = 'admin',
    Vendor = 'vendor',
    SubAdmin = 'subadmin',
    GlobalAdmin = 'globaladmin'
}
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UsersType[]) => SetMetadata(ROLES_KEY, roles);

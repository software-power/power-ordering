
# Tally Integration Walkthrough

## Overview
Multi-tenant ordering system with Tally Prime integration supporting:
- **Admin**: Full system control
- **Tally Users**: Tenant-specific management with custom roles
- **Employees**: Inherit configuration from Tally Users

## Database Schema

### Migration 006: Role & Submenu Accessibility
- Added `is_client_accessible` to `roles` table
- Added `is_client_accessible` to `submenus` table
- System roles (Tally User, Employee) marked as client-accessible
- Admin role marked as NOT client-accessible

### Migration 007: Stock Permission
- Added `product.view_stock` permission for granular access control

## Multi-Tenant Features

### Role Management
**Admin**:
- Sees all roles
- Can create global roles (accessible to all)
- Can toggle `is_client_accessible` flag

**Tally Users**:
- See only client-accessible roles (system + own + parent's)
- Create custom roles automatically marked `is_client_accessible=TRUE`
- Roles have `parent_id` set to creator
- Can assign custom menus/submenus/permissions

**Employees**:
- Inherit roles from Tally User
- Cannot create roles

### Menu & Submenu Visibility
- Menus filtered by `is_client_accessible` for non-admins
- Submenus filtered similarly in role edit modal
- Products, Orders, Dashboard, Users, Settings, Roles marked as client-accessible

### Permission-Based Data Access
**Stock Visibility**:
- Controlled by `product.view_stock` permission
- Admin always sees stock
- Other users need explicit permission

**Owner Column**:
- Admin sees "Owner" column in Products/Orders (shows Tally User)
- Tally Users/Employees see only their own data

### Dashboard Enhancements
**Employee Dashboard**:
- Shows "Parent User" card with Tally User's name
- Displays inherited Tally connection status

**Tally User Dashboard**:
- Shows Tally connection status
- No parent user card

### Settings Page
**Admin**:
- Company Settings, Defaults, API Endpoints, Tally Integration

**Tally Users**:
- Tally Integration only

**Employees**:
- No Settings access (can be granted via permissions)

## Verification Steps

### 1. Test Admin Role Management
1. Login as Admin
2. Go to **Roles** → Create Role
3. Check "Is Client Accessible" checkbox
4. Assign menus/submenus/permissions
5. Verify role appears for Tally Users

### 2. Test Tally User Custom Roles
1. Login as Tally User
2. Go to **Roles** → Create Role
3. Role automatically marked client-accessible
4. Assign custom permissions (e.g., uncheck "View Stock")
5. Create Employee with this role
6. Verify Employee cannot see stock column

### 3. Test Employee Experience
1. Login as Employee
2. Dashboard shows "Parent User" card
3. Products list respects stock permission
4. Settings page hidden (unless granted permission)

### 4. Test Multi-Tenancy Isolation
1. Create two Tally Users (A and B)
2. Tally User A creates custom role "Sales"
3. Tally User B should NOT see "Sales" role
4. Each Tally User sees only their own employees

## Technical Implementation

### Backend Changes
- [roles/controllers.js](file:///c:/xampp8.2/htdocs/power-react-node-mysql-template/server/src/modules/roles/controllers.js): Tenant filtering
- [users/controllers.js](file:///c:/xampp8.2/htdocs/power-react-node-mysql-template/server/src/modules/users/controllers.js): Parent enforcement
- [products/controllers.js](file:///c:/xampp8.2/htdocs/power-react-node-mysql-template/server/src/modules/products/controllers.js): Owner column
- [orders/controllers.js](file:///c:/xampp8.2/htdocs/power-react-node-mysql-template/server/src/modules/orders/controllers.js): Owner column

### Frontend Changes
- [Dashboard.jsx](file:///c:/xampp8.2/htdocs/power-react-node-mysql-template/client/src/pages/Dashboard.jsx): Parent user card
- [Settings.tsx](file:///c:/xampp8.2/htdocs/power-react-node-mysql-template/client/src/pages/Settings.tsx): Tab visibility
- [ProductsList.tsx](file:///c:/xampp8.2/htdocs/power-react-node-mysql-template/client/src/pages/ProductsList.tsx): Stock permission check
- [RolesList.tsx](file:///c:/xampp8.2/htdocs/power-react-node-mysql-template/client/src/pages/RolesList.tsx): Submenu permissions

## Best Practices

1. **Always use permissions** for data visibility (not just role checks)
2. **Tenant isolation** enforced at database query level
3. **Inheritance** for Tally config (employees don't store duplicate data)
4. **Explicit flags** (`is_client_accessible`) for clear access control


## Overview
This update integrates Tally Prime with the Ordering System, allowing:
- **Client Users**: To configure their local Tally connection (URL, Port).
- **Products**: To be synced from Tally (via `POST /tally/products/sync`).
- **Orders**: To be created and (conceptually) pushed to Tally.
- **Dashboard**: To show Tally connectivity status.

## Changes Applied

### Database
- **Migration `004`**:
    - Added `is_centraluser`, `tally_url`, `tally_port` to `users` table.
    - Created `products` table.
    - Created `orders` table.

### Backend
- **Tally Module** (`server/src/modules/tally`):
    - `service.js`: XML communication logic (using `fetch` and XML templates).
    - `controllers.js`: Endpoints for testing connection and syncing.
    - `routes.js`: `/tally/test`, `/tally/products/sync`.
- **Products & Orders**:
    - Created full CRUD modules for `products` and `orders`.
- **User Management**:
    - Updated `createUser`/`updateUser` to handle Tally config fields.
    - Updated `auth` profile to return Tally config.

### User Management & RBAC
- **Strict Role Separation**:
    - **Admin (ID 1)**: Can manage all settings, see all data, create any user.
    - **Tally User (ID 2)**: Can manage own employees, own roles.
    - **Employee (ID 3)**: Inherits config from Tally User.
- **Tenant Roles**: Roles can now be owned by a user (`user_id`). Tally Users can create their own roles for their employees.
- **Menu Visibility**: Menus can be marked `is_client_accessible` to hide system admin menus from clients.
- **Tally Config Inheritance**: Employees inherit Tally URL/Port from their parent user.

### Frontend
- **Dashboard**:
    - Added "Tally Status" card (shows Connected/Disconnected).
    - Checks connection on load if user is a Client.
- **Settings**:
    - **Admin**: Full access.
    - **Tally User**: Only Tally Integration tab (if main user).
    - **Employee**: Limited view (API Endpoints only).
- **Users**:
    - **Admin**: Can set "Is Central User" and Tally Config.
    - **Tally User**: simplified form (inherits config, forces parent relationship).

## Verification Steps

### 1. Test Admin (Central)
1. Login as Admin.
2. Go to **Settings**. You see "Company Settings", "Defaults", "Tally Integration" (if relevant).
3. Create a **Tally User**:
    - Create User -> Uncheck "Is Central User".
    - Enter Tally URL/Port.
    - Role: "Tally User".
    - Save.

### 2. Test Tally User (Tenant)
1. Login as the new Tally User.
2. Go to **Settings**. You should ONLY see "Tally Integration" (and API).
    - You CANNOT change Company Logo/Name.
3. Go to **Users**. Create an Employee.
    - You should NOT see Tally URL/Port or Parent User fields.
    - Create user.
4. Login as that Employee.
    - Go to **Dashboard**. It should check Tally connection (inherited from parent).
    - Go to **Settings**. You should NOT see Tally config.

### 3. Test Custom Roles
1. Login as Tally User.
2. Go to **Roles**.
3. Create a new Role "Sales Manager".
4. Assign permissions.
5. Create a user with this role.
6. Verify visibility.

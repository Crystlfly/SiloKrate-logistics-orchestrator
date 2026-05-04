import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const userRole = localStorage.getItem('nexus_user_role');

    if (!userRole) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
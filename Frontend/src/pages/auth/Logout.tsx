
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Logout = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    signOut();
  }, [signOut]);

  return <Navigate to="/login" replace />;
};

export default Logout;

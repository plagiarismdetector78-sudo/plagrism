// lib/withAuth.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function withAuth(Component, requiredRole) {
  return function AuthenticatedPage(props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const checkAuth = () => {
        try {
          const userId = localStorage.getItem('userId');
          const role = localStorage.getItem('role');
          
          if (!userId || !role) {
            router.push('/login');
            return;
          }
          
          if (requiredRole && role !== requiredRole) {
            router.push(`/dashboard/${role}`);
            return;
          }
          
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          router.push('/login');
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
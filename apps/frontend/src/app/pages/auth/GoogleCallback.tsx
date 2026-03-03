import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');

    if (error === 'pending_approval') {
      toast.error('Votre compte est en attente d\'approbation par un administrateur.');
      navigate('/login');
      return;
    }

    if (error === 'google_auth_failed') {
      toast.error('Échec de l\'authentification Google. Veuillez réessayer.');
      navigate('/login');
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        loginWithGoogle(user, token);
        toast.success('Connexion réussie!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error parsing user data:', error);
        toast.error('Erreur lors de la connexion');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, loginWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Traitement de l'authentification Google...</p>
      </div>
    </div>
  );
}
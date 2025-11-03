import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRoutes';

function App() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    const REFRESH_INTERVAL = 75 * 60 * 1000;

    const interval = setInterval(async () => {
      try {
        await getToken({
          skipCache: true,
          template: 'jwt-template-tcba'
        });
        console.log('Token refreshed in background');
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }, REFRESH_INTERVAL);

    getToken({
      skipCache: true,
      template: 'jwt-template-tcba'
    });

    return () => clearInterval(interval);
  }, [isSignedIn, getToken]);

  return (
    <div className='min-h-screen flex flex-col bg-white'>
      <Navbar />
      <main className='flex-grow w-full'>
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default App;

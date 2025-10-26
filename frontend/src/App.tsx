import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <div className='min-h-screen flex flex-col'>
      <Navbar />
      <main className='flex-grow w-full px-4 py-4'>
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default App;

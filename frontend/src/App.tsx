// example of how clerk login can be used. Clerk made login components automatically

import HomePage from './pages/HomePage/Home';
import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

function App() {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // This runs once when the component mounts
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    fetch(`${apiUrl}/api/hello`) // replace /api/hello with your actual route
      .then(res => res.json())
      .then(data => {
        console.log('Backend response:', data);
        setMessage(data.message || 'No message received');
      })
      .catch(err => {
        console.error('Error fetching from backend:', err);
        setMessage('Error connecting to backend');
      });
  }, []);

  return (
    <header style={{ padding: '1rem' }}>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>

      {/* Display your backend message */}
      <p style={{ marginTop: '1rem' }}>Backend says: {message || 'Loading...'}</p>

      <HomePage />
    </header>
  );
}

export default App;

// example of how clerk login can be used. Clerk made login components automatically

import HomePage from './pages/HomePage/Home';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

function App() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <HomePage />
    </header>
  );
}

export default App;

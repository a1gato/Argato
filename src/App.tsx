import { useAuth } from './context/AuthContext';
import { Desktop } from './components/Desktop';
import { LoginPage } from './components/LoginPage';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated ? <Desktop /> : <LoginPage />}
    </>
  );
}

export default App;

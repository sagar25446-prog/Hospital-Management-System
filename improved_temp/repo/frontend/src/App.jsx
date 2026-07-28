import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';
import SymptomCheckerWidget from './components/common/SymptomCheckerWidget';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <SymptomCheckerWidget />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

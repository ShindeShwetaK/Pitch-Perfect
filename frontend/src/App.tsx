import './styles/index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ApplicationPage from './pages/ApplicationPage';
import AnalysisPage from './pages/AnalysisPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<ApplicationPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


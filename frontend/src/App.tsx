import { useState } from 'react';
import LandingPage from './components/LandingPage';
import TheatreSeatSelection from './components/TheatreSeatSelection';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [view, setView] = useState<'landing' | 'seats' | 'dashboard'>('landing');
  const [selectedMovie, setSelectedMovie] = useState<string>('DUNE: PART TWO');

  const handleBookTickets = (movieTitle: string) => {
    setSelectedMovie(movieTitle);
    setView('seats');
  };

  const handleOpenDashboard = () => {
    setView('dashboard');
  };

  const handleBackToLanding = () => {
    setView('landing');
  };

  const handleMovieSwitch = (movieTitle: string) => {
    setSelectedMovie(movieTitle);
    setView('seats');
  };

  return (
    <div className="w-full min-h-screen bg-black text-white font-inter">
      {view === 'landing' && (
        <LandingPage 
          onBookTickets={handleBookTickets} 
          onOpenDashboard={handleOpenDashboard} 
        />
      )}

      {view === 'seats' && (
        <TheatreSeatSelection 
          movieTitle={selectedMovie} 
          onBack={handleBackToLanding}
          onMovieSwitch={handleMovieSwitch}
        />
      )}

      {view === 'dashboard' && (
        <AdminDashboard 
          onBack={handleBackToLanding} 
        />
      )}
    </div>
  );
}
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Dashboard from './components/Pages/Dashboard';
import UploadCard from './components/Pages/UploadCard';
import ConfirmProfile from './components/Pages/ConfirmProfile';
import History from './components/Pages/History';
import storage from './utils/storage';
import { AlertProvider } from './components/Common/Alert';
import './styles/globals.css';

import GiftSuggestions from './components/Pages/GiftSuggestions';
import Profiles from './components/Pages/Profiles';
import Settings from './components/Pages/Settings';

function App() {
  useEffect(() => {
    // Initialize storage on app start
    storage.init();

    // Check if first visit
    if (storage.isFirstVisit()) {
      storage.markVisited();
      console.log('First visit - welcome!');
    }

    // Log storage stats for debugging
    console.log('App initialized with:', storage.getStats());
  }, []);

  return (
    <Router>
      <AlertProvider>
        <div className="min-h-screen bg-gray-25 flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadCard />} />
              <Route path="/confirm-profile" element={<ConfirmProfile />} />
              <Route path="/gift-suggestions" element={<GiftSuggestions />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AlertProvider>
    </Router>
  );
}

export default App;
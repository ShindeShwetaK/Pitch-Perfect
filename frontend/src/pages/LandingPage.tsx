import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarNavigation from '../components/landing/SidebarNavigation';
import HeroSection from '../components/landing/HeroSection';
import AboutModal from '../components/shared/AboutModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const loadingTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      rafRef.current = window.requestAnimationFrame(() => {
        setShowLoading(true);
      });
    } else {
      setShowLoading(false);
    }

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const goToApp = useCallback(() => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);

    loadingTimeoutRef.current = window.setTimeout(() => {
      navigate('/app');
    }, 5000); // 5 second loading screen
  }, [isLoading, navigate]);

  return (
    <div className="relative min-h-screen text-cv-text overflow-hidden">
      <SidebarNavigation onOpenAbout={() => setAboutOpen(true)} />
      <HeroSection onPrimaryAction={goToApp} onSecondaryAction={() => setAboutOpen(true)} />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      {isLoading && (
        <div
          className={`fixed inset-0 z-50 flex bg-cv-bg transition-opacity duration-500 ease-in-out ${
            showLoading ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Sidebar to match analysis page layout */}
          <SidebarNavigation onOpenAbout={() => {}} />

          {/* Main content area with loading indicator */}
          <div className="flex-1 flex flex-col items-center justify-center ml-0">
            <div
              className={`relative flex flex-col items-center text-center transition-all duration-500 ease-out ${
                showLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="relative h-28 w-28">
                <svg viewBox="0 0 120 120" className="h-full w-full">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    strokeWidth="4"
                    stroke="#E5E7EB"
                    fill="transparent"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    strokeWidth="6"
                    strokeLinecap="round"
                    stroke="url(#loadingGradient)"
                    fill="transparent"
                    className="stroke-progress"
                    transform="rotate(-90 60 60)"
                  />
                  <defs>
                    <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Lightning icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="h-12 w-12 text-cricket-green"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                  </svg>
                </div>
              </div>

              <p className="mt-6 text-lg font-medium text-cv-text">Preparing live analysis...</p>
              <p className="mt-2 text-sm text-cv-muted">Powering up the vision engine. Please wait a moment.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



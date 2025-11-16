

import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import MarketView from './components/MarketView.tsx';
import { useStockMarket } from './hooks/useStockMarket.ts';
import Toast from './components/ui/Toast.tsx';
import OnboardingModal from './components/OnboardingModal.tsx';
import GuideModal from './components/GuideModal.tsx';
import StockTicker from './components/StockTicker.tsx';
import type { UserProfile, ToastMessage, Team, TeamInvite } from './types.ts';
import ProfileManager from './components/ProfileManager.tsx';
import SetPasswordModal from './components/SetPasswordModal.tsx';
import CreateTeamModal from './components/CreateTeamModal.tsx';
import TeamInviteModal from './components/TeamInviteModal.tsx';
import Footer from './components/Footer.tsx';
import SplashScreen from './components/SplashScreen.tsx';
import ChatbotWidget from './components/ChatbotWidget.tsx';

// A simple simulation of password hashing for this browser-only environment.
const hashPassword = (password: string): string => btoa(password);

const App: React.FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ teamName: string; code: string } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(() => {
    try {
      const activeProfileId = localStorage.getItem('yin_trade_active_profile_id');
      if (activeProfileId) {
          const profiles: UserProfile[] = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
          return profiles.find(p => p.id === activeProfileId) || null;
      }
    } catch (e) {
      console.error("Error loading profile from localStorage, clearing data.", e);
      // Clear potentially corrupt data
      localStorage.removeItem('yin_trade_active_profile_id');
      localStorage.removeItem('yin_trade_profiles'); // <-- Enhanced data integrity
    }
    return null;
  });
  
  const stockMarket = useStockMarket(activeProfile);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'yin_trade_broadcast' && event.newValue) {
            const { message, timestamp } = JSON.parse(event.newValue);
            // Ignore old messages
            if (Date.now() - timestamp < 5000) {
                 setToast({ type: 'info', text: `Admin Broadcast: ${message}` });
            }
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (stockMarket.toast) {
        setToast(stockMarket.toast);
        stockMarket.setToast(null); // Reset toast in hook after passing it up
    }
  }, [stockMarket.toast, stockMarket.setToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
        setIsInitialized(true);
        if (activeProfile) {
            const hasOnboarded = localStorage.getItem('yin_trade_onboarded');
            if (!hasOnboarded) {
                setShowOnboarding(true);
            }
        }
    }, 1500); // Increased delay for splash screen visibility
    return () => clearTimeout(timer);
  }, [activeProfile]);
  
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('yin_trade_onboarded', 'true');
  };
  
  const openGuideFromOnboarding = () => {
      handleOnboardingComplete();
      setShowGuide(true);
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleSetProfile = (profile: UserProfile) => {
    // For enhanced security, admin sessions are ephemeral and not persisted.
    if (profile.name === 'Admin') {
      setActiveProfile(profile);
    } else {
      localStorage.setItem('yin_trade_active_profile_id', profile.id);
      setActiveProfile(profile);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('yin_trade_active_profile_id');
    setActiveProfile(null);
    setIsInviteModalOpen(false);
    setInviteInfo(null);
  };

  const handleSecureProfile = (password: string) => {
    if (!activeProfile) return;

    const hashedPassword = hashPassword(password);
    const updatedProfile: UserProfile = { ...activeProfile, password: hashedPassword };

    // Update master list of profiles
    const profiles: UserProfile[] = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
    const profileIndex = profiles.findIndex(p => p.id === activeProfile.id);
    if (profileIndex !== -1) {
        profiles[profileIndex] = updatedProfile;
        localStorage.setItem('yin_trade_profiles', JSON.stringify(profiles));
    }

    // Update active profile state
    setActiveProfile(updatedProfile);
    setToast({ type: 'success', text: 'Your profile is now password protected!' });
  };

  const handleCreateTeam = (teamName: string) => {
    if (!activeProfile || activeProfile.teamId) return;

    const teams: Team[] = JSON.parse(localStorage.getItem('yin_trade_teams') || '[]');
    const invites: TeamInvite[] = JSON.parse(localStorage.getItem('yin_trade_invites') || '[]');
    
    const newTeamId = `team_${Date.now()}`;
    const newProfileId = activeProfile.id;

    // Create the team
    const newTeam: Team = {
      id: newTeamId,
      name: teamName,
      leaderId: newProfileId,
      memberIds: [newProfileId],
    };
    teams.push(newTeam);
    localStorage.setItem('yin_trade_teams', JSON.stringify(teams));

    // Create a unique invite code
    const newInvite: TeamInvite = {
        code: `${teamName.substring(0, 4).toUpperCase()}${Math.random().toString(36).substring(2, 6)}`,
        teamId: newTeam.id,
        createdAt: Date.now(),
    };
    invites.push(newInvite);
    localStorage.setItem('yin_trade_invites', JSON.stringify(invites));

    // Update the leader's profile
    const updatedProfile: UserProfile = { ...activeProfile, teamId: newTeam.id, isTeamLeader: true };
    const profiles: UserProfile[] = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
    const profileIndex = profiles.findIndex(p => p.id === activeProfile.id);
    if (profileIndex !== -1) {
        profiles[profileIndex] = updatedProfile;
        localStorage.setItem('yin_trade_profiles', JSON.stringify(profiles));
    }

    setActiveProfile(updatedProfile);
    setInviteInfo({ teamName: newTeam.name, code: newInvite.code });
    setIsInviteModalOpen(true);
  };

  const handleViewInviteCode = () => {
    if (!activeProfile?.isTeamLeader || !activeProfile.teamId) return;
    const invites: TeamInvite[] = JSON.parse(localStorage.getItem('yin_trade_invites') || '[]');
    const teams: Team[] = JSON.parse(localStorage.getItem('yin_trade_teams') || '[]');
    const team = teams.find(t => t.id === activeProfile.teamId);
    const invite = invites.find(i => i.teamId === activeProfile.teamId);

    if (team && invite) {
        setInviteInfo({ teamName: team.name, code: invite.code });
        setIsInviteModalOpen(true);
    } else {
        setToast({ type: 'error', text: 'Could not find invite code for your team.' });
    }
  };


  if (!isInitialized) {
    return <SplashScreen />;
  }
  
  if (!activeProfile || !stockMarket.isLoaded) {
    return <ProfileManager onProfileSelected={handleSetProfile} theme={theme} toggleTheme={toggleTheme} />;
  }
  
  if (!stockMarket.profileState) return null; // Wait for profile state to load

  const isAdmin = activeProfile.name === 'Admin';
  
  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans flex flex-col animate-fade-in">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        profile={activeProfile}
        cash={stockMarket.profileState.portfolio.cash}
        marketSentiment={stockMarket.marketSentiment}
        marketStatus={stockMarket.marketStatus}
        onOpenGuide={() => setShowGuide(true)}
        onLogout={handleLogout}
        onSecureProfile={() => setIsSetPasswordModalOpen(true)}
        onCreateTeam={() => setIsCreateTeamModalOpen(true)}
        onViewInviteCode={handleViewInviteCode}
      />
      <StockTicker stocks={stockMarket.stocks} />
      <main className="flex-grow w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <MarketView 
          {...stockMarket} 
          profile={activeProfile} 
          portfolio={stockMarket.profileState.portfolio} 
          activeOrders={stockMarket.profileState.activeOrders} 
          orderHistory={stockMarket.profileState.orderHistory} 
          performanceHistory={stockMarket.profileState.performanceHistory}
          isAdmin={isAdmin} 
          setToast={setToast}
        />
      </main>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <OnboardingModal 
        isVisible={showOnboarding}
        onComplete={handleOnboardingComplete}
        onOpenGuide={openGuideFromOnboarding}
      />
      <GuideModal
        isVisible={showGuide}
        onClose={() => setShowGuide(false)}
      />
      <SetPasswordModal
        isOpen={isSetPasswordModalOpen}
        onClose={() => setIsSetPasswordModalOpen(false)}
        onSetPassword={handleSecureProfile}
      />
       <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onCreateTeam={handleCreateTeam}
      />
      <TeamInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        teamName={inviteInfo?.teamName || ''}
        inviteCode={inviteInfo?.code || ''}
      />
      <Footer />
      <ChatbotWidget
        stocks={stockMarket.stocks}
        portfolio={stockMarket.profileState.portfolio}
       />
    </div>
  );
};

export default App;

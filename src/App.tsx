import React from 'react';
import { GameProvider, useGame } from './game/state/GameContext';
import { GameShell } from './components/layout/GameShell';
import { CompanySetupScreen } from './components/screens/CompanySetupScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { ProductionScreen } from './components/screens/ProductionScreen';
import { ScheduleScreen } from './components/screens/ScheduleScreen';
import { ConcertScreen } from './components/screens/ConcertScreen';
import { AuditionsScreen } from './components/screens/AuditionsScreen';
import { CompanyScreen } from './components/screens/CompanyScreen';
import { TrainingScreen } from './components/screens/TrainingScreen';
import { ShopScreen } from './components/screens/ShopScreen';
import { AgencyHQScreen } from './components/screens/AgencyHQScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';

const ActiveGameRouter: React.FC = () => {
  const { state, activeTab } = useGame();

  if (!state.initialized) {
    return <CompanySetupScreen />;
  }

  return (
    <GameShell>
      {activeTab === 'dashboard' && <DashboardScreen />}
      {activeTab === 'production' && <ProductionScreen />}
      {activeTab === 'schedule' && <ScheduleScreen />}
      {activeTab === 'concert' && <ConcertScreen />}
      {activeTab === 'auditions' && <AuditionsScreen />}
      {activeTab === 'company' && <CompanyScreen />}
      {activeTab === 'training' && <TrainingScreen />}
      {activeTab === 'shop' && <ShopScreen />}
      {activeTab === 'hq' && <AgencyHQScreen />}
      {activeTab === 'settings' && <SettingsScreen />}
    </GameShell>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unexpected application error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1e0b4b] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-[#2e1065] border border-purple-300/30 p-6 space-y-4 text-center">
            <h1 className="pixel-title text-fuchsia-300">K-POP IDOL TYCOON</h1>
            <p className="pixel-micro text-purple-200 leading-relaxed">
              The simulation encountered a recovery issue: {this.state.message}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white pixel-micro cursor-pointer"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    window.localStorage.removeItem('kpop_idol_tycoon_autosave_v1');
                  } catch {
                    // ignore
                  }
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white pixel-micro cursor-pointer"
              >
                Reset Autosave &amp; Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <GameProvider>
        <ActiveGameRouter />
      </GameProvider>
    </AppErrorBoundary>
  );
}

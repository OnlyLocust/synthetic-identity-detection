import { useState } from 'react';
import EchelonLayout, { type EchelonView } from '@/layouts/EchelonLayout';
import OverviewView from '@/sections/OverviewView';
import IdentityScanView from '@/sections/IdentityScanView';
import BiometricsView from '@/sections/BiometricsView';
import BehaviorAnalyticsView from '@/sections/BehaviorAnalyticsView';
import AdminDebugPanel from '@/components/AdminDebugPanel';

function App() {
  const [currentView, setCurrentView] = useState<EchelonView>('overview');

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <OverviewView />;
      case 'identity-scan':
        return <IdentityScanView />;
      case 'biometrics':
        return <BiometricsView />;
      case 'behavior-analytics':
        return <BehaviorAnalyticsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <>
      <EchelonLayout currentView={currentView} onViewChange={setCurrentView}>
        {renderView()}
      </EchelonLayout>
      <AdminDebugPanel />
    </>
  );
}

export default App;

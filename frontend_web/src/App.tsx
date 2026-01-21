import React, { useState, useEffect } from 'react';
import { useGradeData } from './hooks/useGradeData';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ClassDashboard } from './components/views/ClassDashboard';
import { StudentDirectory } from './components/views/StudentDirectory';
import { EvaluationAnalytics } from './components/views/EvaluationAnalytics';
import { HelpSection } from './components/views/HelpSection';
import WelcomeScreen from './components/WelcomeScreen';

const App = () => {
  const { init, ready, loading, data, processFile } = useGradeData();
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    init();
  }, [init]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (!data) {
    return (
      <WelcomeScreen ready={ready} loading={loading} onFile={handleFile} />
    );
  }

  // View Switcher Logic
  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <ClassDashboard data={data} />;
      case 'students':
        return <StudentDirectory data={data} />;
      case 'evaluations':
        return <EvaluationAnalytics data={data} />;
      case 'help':
        return <HelpSection />;
      default:
        return <ClassDashboard data={data} />;
    }
  };

  return (
    <DashboardLayout
      activeView={activeView}
      onViewChange={setActiveView}
      onFileChange={handleFile}
    >
      {renderView()}
      <div className="fixed bottom-1 right-1 text-[10px] text-slate-300 pointer-events-none">
        v1.0.1 - Fix Applied
      </div>
    </DashboardLayout>
  );
};

export default App;
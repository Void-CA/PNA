import React, { useState, useEffect } from 'react';
import { useGradeData } from './hooks/useGradeData';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ClassDashboard } from './components/views/ClassDashboard';
import { StudentDirectory } from './components/views/StudentDirectory';
import { EvaluationAnalytics } from './components/views/EvaluationAnalytics';
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
    </DashboardLayout>
  );
};

export default App;
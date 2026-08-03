import React from 'react';
import { Header } from './components/Header';
import { ShowcaseView } from './components/showcase/ShowcaseView';
import { OproxCodeIDE } from './components/ide/OproxCodeIDE';
import { AiOperatingSystem } from './components/ai/AiOperatingSystem';
import { DatabaseStudio } from './components/database/DatabaseStudio';
import { CloudMonitors } from './components/cloud/CloudMonitors';
import { EnterpriseOS } from './components/memory/EnterpriseOS';
import { MediaStudio } from './components/verticals/MediaStudio';
import { PropTechStudio } from './components/verticals/PropTechStudio';
import { SolutionsPlatform } from './components/solutions/SolutionsPlatform';
import { PlatformHub } from './components/platform/PlatformHub';
import { DesignSystemView } from './components/design/DesignSystemView';
import { DashboardView } from './components/dashboard/DashboardView';
import { useUIState } from './integration/UIStateContext';
import { NotificationToastContainer } from './integration/NotificationToast';

export default function App() {
  const {
    currentMode,
    setCurrentMode,
    serverOnline,
    activeProjectTitle,
    setActiveProjectTitle,
    activePrompt,
    launchIdeWithPrompt,
    theme,
    toggleTheme
  } = useUIState();

  const handleLaunchIdeWithPrompt = (prompt: string, projectTitle: string) => {
    launchIdeWithPrompt(prompt, projectTitle);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        serverOnline={serverOnline}
        activeProjectTitle={activeProjectTitle}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="max-w-[1700px] mx-auto px-4 pt-4">
        {currentMode === 'dashboard' && (
          <DashboardView
            onNavigateMode={setCurrentMode}
            onLaunchIdeWithPrompt={handleLaunchIdeWithPrompt}
            theme={theme}
          />
        )}

        {currentMode === 'ai-os' && (
          <AiOperatingSystem
            initialPrompt={activePrompt}
            onLaunchIdeWithPrompt={handleLaunchIdeWithPrompt}
            theme={theme}
          />
        )}

        {currentMode === 'solutions' && (
          <SolutionsPlatform theme={theme} />
        )}

        {currentMode === 'platform-suite' && (
          <PlatformHub theme={theme} />
        )}

        {currentMode === 'design-system' && (
          <DesignSystemView theme={theme} onToggleTheme={toggleTheme} />
        )}

        {currentMode === 'ide' && (
          <OproxCodeIDE
            initialPrompt={activePrompt}
            onProjectChange={setActiveProjectTitle}
          />
        )}

        {currentMode === 'showcase' && (
          <ShowcaseView
            onLaunchIdeWithPrompt={handleLaunchIdeWithPrompt}
            onNavigateMode={setCurrentMode}
            theme={theme}
          />
        )}

        {currentMode === 'database' && <DatabaseStudio />}

        {currentMode === 'cloud' && <CloudMonitors />}

        {currentMode === 'enterprise' && <EnterpriseOS />}

        {currentMode === 'media' && <MediaStudio />}

        {currentMode === 'proptech' && <PropTechStudio />}
      </main>

      {/* Global Notification Toast Renderer */}
      <NotificationToastContainer />
    </div>
  );
}

import React, { useState, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { useUIState } from './integration/UIStateContext';
import { NotificationToastContainer } from './integration/NotificationToast';

// Shared Modals & Error Boundary
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { NotificationCenterModal } from './components/common/NotificationCenterModal';
import { ProjectManagementModal } from './components/common/ProjectManagementModal';
import { UserSettingsModal } from './components/common/UserSettingsModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy-loaded heavy views & workspaces
const ShowcaseView = lazy(() => import('./components/showcase/ShowcaseView').then(m => ({ default: m.ShowcaseView })));
const OproxCodeIDE = lazy(() => import('./components/ide/OproxCodeIDE').then(m => ({ default: m.OproxCodeIDE })));
const AiOperatingSystem = lazy(() => import('./components/ai/AiOperatingSystem').then(m => ({ default: m.AiOperatingSystem })));
const OproxCodeAiSuite = lazy(() => import('./components/ai/OproxCodeAiSuite').then(m => ({ default: m.OproxCodeAiSuite })));
const StudioAppSuite = lazy(() => import('./components/studio/StudioAppSuite').then(m => ({ default: m.StudioAppSuite })));
const DatabaseStudio = lazy(() => import('./components/database/DatabaseStudio').then(m => ({ default: m.DatabaseStudio })));
const CloudMonitors = lazy(() => import('./components/cloud/CloudMonitors').then(m => ({ default: m.CloudMonitors })));
const EnterpriseOS = lazy(() => import('./components/memory/EnterpriseOS').then(m => ({ default: m.EnterpriseOS })));
const MediaStudio = lazy(() => import('./components/verticals/MediaStudio').then(m => ({ default: m.MediaStudio })));
const OproxRealEstateWorkspace = lazy(() => import('./components/realestate/OproxRealEstateWorkspace').then(m => ({ default: m.OproxRealEstateWorkspace })));
const SolutionsPlatform = lazy(() => import('./components/solutions/SolutionsPlatform').then(m => ({ default: m.SolutionsPlatform })));
const PlatformHub = lazy(() => import('./components/platform/PlatformHub').then(m => ({ default: m.PlatformHub })));
const DesignSystemView = lazy(() => import('./components/design/DesignSystemView').then(m => ({ default: m.DesignSystemView })));

const SuspenseFallback = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-medium">Loading workspace module...</span>
    </div>
  </div>
);

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
    toggleTheme,
    notifications,
    dismissNotification
  } = useUIState();

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);

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
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenUserSettings={() => setIsUserSettingsOpen(true)}
        unreadNotificationsCount={notifications.length}
      />

      <main className="max-w-[1700px] mx-auto px-4 pt-4">
        <ErrorBoundary>
          <Suspense fallback={<SuspenseFallback />}>
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

            {currentMode === 'oprox-code-ai' && (
              <OproxCodeAiSuite
                theme={theme}
                activeProjectTitle={activeProjectTitle}
              />
            )}

            {currentMode === 'studio' && (
              <StudioAppSuite />
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

            {(currentMode === 'real-estate' || currentMode === 'proptech') && <OproxRealEstateWorkspace />}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Global Modals */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateMode={setCurrentMode}
        onToggleTheme={toggleTheme}
        onOpenNewProject={() => {
          setIsCommandPaletteOpen(false);
          setIsProjectManagerOpen(true);
        }}
        theme={theme}
      />

      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onDismiss={dismissNotification}
        theme={theme}
      />

      <ProjectManagementModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        activeProjectTitle={activeProjectTitle}
        onSelectProject={setActiveProjectTitle}
        theme={theme}
      />

      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Global Notification Toast Renderer */}
      <NotificationToastContainer />
    </div>
  );
}

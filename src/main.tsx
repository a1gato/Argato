import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { OSProvider } from './context/OSContext.tsx'
import { SettingsProvider } from './context/SettingsContext.tsx'
import { GroupsProvider } from './context/GroupsContext.tsx'
import { StudentsProvider } from './context/StudentsContext.tsx'
import { UsersProvider } from './context/UsersContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { CohortProvider } from './context/CohortContext';
import { LogProvider } from './context/LogContext';

if (typeof window !== 'undefined') {
  window.onerror = function (msg, url, line, col) {
    alert("Runtime Error: " + msg + "\nAt: " + url + ":" + line + ":" + col);
    return false;
  };
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OSProvider>
      <LogProvider>
        <SettingsProvider>
          <GroupsProvider>
            <CohortProvider>
              <StudentsProvider>
                <UsersProvider>
                  <AuthProvider>
                    <App />
                  </AuthProvider>
                </UsersProvider>
              </StudentsProvider>
            </CohortProvider>
          </GroupsProvider>
        </SettingsProvider>
      </LogProvider>
    </OSProvider>
  </React.StrictMode>,
)

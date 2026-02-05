/**
 * Desktop app root component.
 * This is a placeholder that will later integrate shared components.
 */

function App() {
  const electronAPI = window.electronAPI

  return (
    <div className="app">
      <header className="app-header">
        <h1>Agni Desktop</h1>
        <p>
          Running on {electronAPI?.platform ?? 'unknown'} with Electron{' '}
          {electronAPI?.versions.electron ?? 'unknown'}
        </p>
      </header>
      <main className="app-main">
        <p>
          This is the Agni desktop app shell. The renderer will be integrated
          with shared components from <code>packages/shared</code> and{' '}
          <code>packages/api</code>.
        </p>
      </main>
    </div>
  )
}

export default App

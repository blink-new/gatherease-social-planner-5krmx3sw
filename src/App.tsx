import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Dashboard } from '@/pages/Dashboard'
import { PublicEventView } from '@/pages/PublicEventView'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public routes - no authentication required */}
          <Route path="/event/:eventId" element={<PublicEventView />} />
          
          {/* Protected routes - authentication required */}
          <Route path="/" element={<Dashboard />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from './components/Layout'
import { AboutPage } from './pages/AboutPage'
import { AIContinuityPage } from './pages/AIContinuityPage'
import { AssessmentPage } from './pages/AssessmentPage'
import { CandidatesPage } from './pages/CandidatesPage'
import { CareersPage } from './pages/CareersPage'
import { ContactPage } from './pages/ContactPage'
import { EmployersPage } from './pages/EmployersPage'
import { EngagementPage } from './pages/EngagementPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProofPage } from './pages/ProofPage'
import { SegmentPage } from './pages/SegmentPage'
import { ServicesPage } from './pages/ServicesPage'
import { TermsPrivacyPage } from './pages/TermsPrivacyPage'
import { TrustPage } from './pages/TrustPage'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

// Router-free routes: wrapped by BrowserRouter (client) or MemoryRouter (prerender/SSG).
export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/ai-continuity" element={<AIContinuityPage />} />
          <Route path="/modernization" element={<SegmentPage slug="modernization" />} />
          <Route path="/devops" element={<SegmentPage slug="devops" />} />
          <Route path="/cloud" element={<SegmentPage slug="cloud" />} />
          <Route path="/compliance" element={<SegmentPage slug="compliance" />} />
          <Route path="/talent" element={<SegmentPage slug="talent" />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/proof" element={<ProofPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/employers" element={<EmployersPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/engagement" element={<EngagementPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/trust" element={<TrustPage />} />
          <Route path="/terms-privacy" element={<TermsPrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App

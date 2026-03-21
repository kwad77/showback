import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { personas as personasApi, costObjects as costObjectsApi, birthright as birthrightApi, reports } from '../services/api.js'
import {
  MOCK_TCO_SUMMARY,
  MOCK_PERSONA_DETAILS,
  MOCK_EMPLOYEE_LINE_ITEMS,
  MOCK_PERSONAS,
  MOCK_BIRTHRIGHT,
} from '../data/mockData'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [personas, setPersonas]       = useState([])
  const [costObjects, setCostObjects] = useState([])
  const [birthright, setBirthright]   = useState([])
  const [tcoSummary, setTcoSummary]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [demoMode, setDemoMode]       = useState(false)

  const [personaDetails]     = useState(MOCK_PERSONA_DETAILS)
  const [employeeLineItems]  = useState(MOCK_EMPLOYEE_LINE_ITEMS)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, co, br] = await Promise.all([
        personasApi.list(),
        costObjectsApi.list(),
        birthrightApi.list(),
      ])
      setPersonas(p)
      setCostObjects(co)
      setBirthright(br)
    } catch (err) {
      setError(err.message ?? 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTCO = useCallback(async () => {
    try {
      const summary = await reports.tcoSummary()
      setTcoSummary(summary)
    } catch {
      // API unavailable — activate demo mode with mock data
      setDemoMode(true)
      setTcoSummary(MOCK_TCO_SUMMARY)
      setPersonas(MOCK_PERSONAS)
      setBirthright(MOCK_BIRTHRIGHT)
    }
  }, [])

  const enableDemo = useCallback(() => {
    setDemoMode(true)
    setTcoSummary(MOCK_TCO_SUMMARY)
    setPersonas(MOCK_PERSONAS)
    setBirthright(MOCK_BIRTHRIGHT)
  }, [])

  useEffect(() => {
    fetchAll()
    fetchTCO()
  }, [fetchAll, fetchTCO])

  return (
    <AppContext.Provider
      value={{
        personas,   setPersonas,
        costObjects, setCostObjects,
        birthright,  setBirthright,
        tcoSummary,  setTcoSummary,
        loading,
        error,
        refresh: fetchAll,
        refreshTCO: fetchTCO,
        demoMode,
        enableDemo,
        personaDetails,
        employeeLineItems,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

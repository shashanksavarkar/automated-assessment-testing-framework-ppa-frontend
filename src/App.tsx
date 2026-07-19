import { Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import NewRun from '@/pages/NewRun'
import RunDetail from '@/pages/RunDetail'
import History from '@/pages/History'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<NewRun />} />
        <Route path="runs/:runId" element={<RunDetail />} />
        <Route path="history" element={<History />} />
      </Route>
    </Routes>
  )
}

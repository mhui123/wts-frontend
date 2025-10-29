import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Health() {
  const [status, setStatus] = useState<string>('Loading...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    api
      .get<string>('/health')
      .then((res: { data: string }) => {
        if (mounted) setStatus(res.data)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        if (e instanceof Error) setError(e.message)
        else setError(String(e))
      })
    return () => {
      mounted = false
    }
  }, [])

  if (error) return <div>Health check failed: {error}</div>
  return (
    <div>
      <h2>Backend Health</h2>
      <pre>{status}</pre>
    </div>
  )
}

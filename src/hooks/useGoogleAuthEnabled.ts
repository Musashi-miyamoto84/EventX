import { useEffect, useState } from 'react'
import { fetchIdentitySettings } from '../lib/auth'

export function useGoogleAuthEnabled() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIdentitySettings()
      .then((settings) => setEnabled(settings?.external.google ?? false))
      .finally(() => setLoading(false))
  }, [])

  return { googleEnabled: enabled, loading }
}

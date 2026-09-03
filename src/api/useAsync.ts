import { useCallback, useEffect, useRef, useState } from "react"

export interface AsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

export function useAsync<T>(
  run: () => Promise<T>,
  deps: unknown[],
  enabled = true,
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: enabled,
  })
  const [nonce, setNonce] = useState(0)
  const runRef = useRef(run)
  runRef.current = run

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false })
      return
    }
    let alive = true
    setState((prev) => ({ ...prev, loading: true, error: null }))
    runRef
      .current()
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false })
      })
      .catch((err: unknown) => {
        if (alive) {
          setState({
            data: null,
            error: err instanceof Error ? err.message : "요청에 실패했습니다.",
            loading: false,
          })
        }
      })
    return () => {
      alive = false
    }
  }, [...deps, enabled, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}

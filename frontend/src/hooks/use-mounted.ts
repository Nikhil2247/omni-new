import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** True once the component is running in the browser (false during server rendering and hydration). */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

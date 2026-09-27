import { useEffect, useState } from 'react'

/** 화면 설정 등 가벼운 값을 localStorage에 보관 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)이면 무시
    }
  }, [key, value])
  return [value, setValue] as const
}

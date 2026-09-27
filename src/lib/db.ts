import Dexie, { type EntityTable } from 'dexie'

export interface Stat {
  /** 예: "hiragana:か" */
  id: string
  correct: number
  wrong: number
  /** 연속 정답 수. 틀리면 0으로 초기화 */
  streak: number
  lastSeen: number
}

export const db = new Dexie('study-japanese') as Dexie & {
  stats: EntityTable<Stat, 'id'>
}

db.version(1).stores({ stats: 'id' })

export async function recordAnswer(id: string, ok: boolean): Promise<void> {
  await db.transaction('rw', db.stats, async () => {
    const s = (await db.stats.get(id)) ?? { id, correct: 0, wrong: 0, streak: 0, lastSeen: 0 }
    await db.stats.put({
      ...s,
      correct: s.correct + (ok ? 1 : 0),
      wrong: s.wrong + (ok ? 0 : 1),
      streak: ok ? s.streak + 1 : 0,
      lastSeen: Date.now(),
    })
  })
}

export type Mastery = 'new' | 'weak' | 'learning' | 'mastered'

/** 연속 3번 맞히면 '익힘'으로 판단 */
export function mastery(s: Stat | undefined): Mastery {
  if (!s || s.correct + s.wrong === 0) return 'new'
  if (s.streak >= 3) return 'mastered'
  if (s.streak === 0) return 'weak'
  return 'learning'
}

export async function exportStats(): Promise<string> {
  return JSON.stringify({ version: 1, stats: await db.stats.toArray() })
}

export async function importStats(json: string): Promise<number> {
  const data = JSON.parse(json) as { stats?: Stat[] }
  if (!Array.isArray(data.stats)) throw new Error('올바른 백업 파일이 아니에요')
  await db.transaction('rw', db.stats, async () => {
    await db.stats.clear()
    await db.stats.bulkPut(data.stats!)
  })
  return data.stats.length
}

export async function resetStats(): Promise<void> {
  await db.stats.clear()
}

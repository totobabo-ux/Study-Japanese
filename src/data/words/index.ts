import { WORDS_A } from './wordsA'
import { WORDS_B } from './wordsB'
import { WORDS_C } from './wordsC'
import { WORDS_D } from './wordsD'
import { toRomaji } from '../../lib/romaji'
import type { Word } from './types'

export * from './types'

export function wordRomaji(w: Word): string {
  return w.romaji ?? toRomaji(w.kana)
}

export function wordId(w: Word): string {
  return `word:${w.kana}|${w.kanji ?? ''}`
}

/** 모든 단어 (같은 표기가 겹치면 먼저 나온 것만 사용) */
export const WORDS: Word[] = (() => {
  const seen = new Set<string>()
  return [...WORDS_D.filter((w) => w.topic === 'greetings'), ...WORDS_A, ...WORDS_B, ...WORDS_C, ...WORDS_D.filter((w) => w.topic !== 'greetings')].filter(
    (w) => {
      const id = wordId(w)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    },
  )
})()

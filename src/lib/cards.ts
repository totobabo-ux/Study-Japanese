import { ALL_KANA, CONFUSABLES, baseKanaOf, display, kanaByChar, statId, type Category, type Kana, type Script } from '../data/kana'
import { WORDS, wordId, wordRomaji, type Word } from '../data/words'
import type { Stat } from './db'

export interface Face {
  text: string
  sub?: string
  /** 로마자 독음 (설정에서 켰을 때 표시) */
  romaji?: string
  jp: boolean
}

/** 퀴즈에서 쓰는 공통 학습 카드. front = 일본어 쪽, back = 발음·뜻 쪽 */
export interface StudyCard {
  id: string
  kind: 'kana' | 'word'
  front: Face
  back: Face
  /** 발음 재생용 텍스트 */
  speak: string
  /** 소리가 같은 카드끼리 보기에 함께 나오지 않게 하는 키 */
  soundKey: string
  /** 오답 보기를 고를 때 우선하는 묶음 (행 종류, 주제 등) */
  group: string
  /** 오답 보기로 가장 먼저 쓰는 비슷한 카드 id */
  similar?: string[]
}

/**
 * 출제 방향
 * fb: 일본어 보고 발음·뜻 고르기 / bf: 뜻 보고 일본어 고르기
 * lf: 듣고 일본어 고르기 / lb: 듣고 뜻 고르기
 */
export type Direction = 'fb' | 'bf' | 'lf' | 'lb'

export const KANA_DIRECTIONS: Direction[] = ['fb', 'lf']
export const WORD_DIRECTIONS: Direction[] = ['fb', 'bf', 'lb']

function categoryOf(k: Kana): Category {
  if (k.h.length > 1) return 'yoon'
  return /[がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ]/.test(k.h) ? 'dakuten' : 'basic'
}

export function kanaCard(k: Kana, script: Script): StudyCard {
  const similar = CONFUSABLES[script]
    .filter((set) => set.includes(display(k, script)))
    .flat()
    .map((ch) => kanaByChar(ch))
    .filter((x): x is Kana => !!x && x !== k)
    .map((x) => statId(x, script))
  return {
    id: statId(k, script),
    kind: 'kana',
    front: { text: display(k, script), jp: true },
    back: { text: k.romaji, sub: k.ko, jp: false },
    speak: k.h,
    // を와 お는 소리가 같다
    soundKey: k.romaji === 'wo' ? 'o' : k.romaji,
    group: `${script}:${categoryOf(k)}`,
    similar: similar.length ? [...new Set(similar)] : undefined,
  }
}

export function wordCard(w: Word): StudyCard {
  return {
    id: wordId(w),
    kind: 'word',
    front: { text: w.kana, sub: w.kanji, romaji: wordRomaji(w), jp: true },
    back: { text: w.meaning, jp: false },
    speak: w.kana,
    soundKey: w.kana,
    group: w.topic,
  }
}

export const KANA_CARDS: Record<Script, StudyCard[]> = {
  hiragana: ALL_KANA.map((k) => kanaCard(k, 'hiragana')),
  katakana: ALL_KANA.map((k) => kanaCard(k, 'katakana')),
}
export const WORD_CARDS: StudyCard[] = WORDS.map(wordCard)
export const ALL_CARDS: StudyCard[] = [...KANA_CARDS.hiragana, ...KANA_CARDS.katakana, ...WORD_CARDS]
export const CARD_BY_ID = new Map(ALL_CARDS.map((c) => [c.id, c]))

/** 한 번이라도 맞힌 글자를 '배운 글자'로 본다 */
export function isKanaLearned(s: Stat | undefined): boolean {
  return !!s && s.correct > 0
}

/** 단어에 들어간 글자를 모두 배웠으면 해금 */
export function isWordUnlocked(w: Word, statMap: Map<string, Stat>): boolean {
  for (const ch of w.kana) {
    const base = baseKanaOf(ch)
    if (!base) continue // ー 등 가나가 아닌 기호
    if (!isKanaLearned(statMap.get(statId(base.kana, base.script)))) return false
  }
  return true
}

/** 아직 안 배운 글자 목록 (중복 제거) */
export function missingKana(w: Word, statMap: Map<string, Stat>): string[] {
  const missing = new Set<string>()
  for (const ch of w.kana) {
    const base = baseKanaOf(ch)
    if (base && !isKanaLearned(statMap.get(statId(base.kana, base.script)))) missing.add(display(base.kana, base.script))
  }
  return [...missing]
}

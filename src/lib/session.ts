import { CARD_BY_ID, KANA_DIRECTIONS, WORD_DIRECTIONS, type Direction, type Face, type StudyCard } from './cards'
import { mastery, type Mastery, type Stat } from './db'

export interface Question {
  card: StudyCard
  direction: Direction
  choices: StudyCard[]
}

export interface SessionConfig {
  cards: StudyCard[]
  /** 카드 종류별 출제 방향. 여러 개면 문제마다 무작위 */
  directions?: { kana?: Direction[]; word?: Direction[] }
  /** practice: 정해진 수만큼 가중치 출제 / review: 목록을 한 번씩 (틀리면 한 번 더) */
  mode: { type: 'practice'; count: number } | { type: 'review' }
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pickOne = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** 보기에 표시되는 면 */
export function choiceFace(card: StudyCard, direction: Direction): Face {
  return direction === 'fb' || direction === 'lb' ? card.back : card.front
}

function makeChoices(answer: StudyCard, pool: StudyCard[]): StudyCard[] {
  const usedSound = new Set([answer.soundKey])
  const usedText = new Set([answer.front.text, answer.back.text])
  const choices = [answer]
  const similar = (answer.similar ?? []).map((id) => CARD_BY_ID.get(id)).filter((c): c is StudyCard => !!c)
  const sameKind = [...CARD_BY_ID.values()].filter((c) => c.kind === answer.kind)
  // 비슷한 글자 → 같은 묶음(선택 범위 안) → 선택 범위 → 같은 종류 전체 순서로 채운다
  const sources = [
    shuffle(similar),
    shuffle(pool.filter((c) => c.group === answer.group)),
    shuffle(pool),
    shuffle(sameKind.filter((c) => c.group === answer.group)),
    shuffle(sameKind),
  ]
  for (const source of sources) {
    for (const c of source) {
      if (choices.length >= 4) break
      if (usedSound.has(c.soundKey) || usedText.has(c.front.text) || usedText.has(c.back.text)) continue
      usedSound.add(c.soundKey)
      usedText.add(c.front.text).add(c.back.text)
      choices.push(c)
    }
  }
  return shuffle(choices)
}

const INITIAL_WEIGHT: Record<Mastery, number> = { new: 3, weak: 4, learning: 2, mastered: 1 }

export class Session {
  private weights = new Map<string, number>()
  private queue: StudyCard[] = []
  private requeued = new Set<string>()
  private last?: StudyCard
  answered = 0
  score = 0
  wrong: StudyCard[] = []

  constructor(
    private config: SessionConfig,
    stats: Map<string, Stat>,
  ) {
    for (const c of config.cards) this.weights.set(c.id, INITIAL_WEIGHT[mastery(stats.get(c.id))])
    if (config.mode.type === 'review') this.queue = shuffle(config.cards)
  }

  get total(): number {
    return this.config.mode.type === 'practice' ? this.config.mode.count : this.answered + this.queue.length
  }

  next(): Question | null {
    let card: StudyCard | undefined
    if (this.config.mode.type === 'review') {
      card = this.queue.shift()
    } else if (this.answered < this.config.mode.count) {
      card = this.pickWeighted()
    }
    if (!card) return null
    this.last = card
    const dirs = (card.kind === 'kana' ? this.config.directions?.kana : this.config.directions?.word) ??
      (card.kind === 'kana' ? KANA_DIRECTIONS : WORD_DIRECTIONS)
    return { card, direction: pickOne(dirs), choices: makeChoices(card, this.config.cards) }
  }

  answer(card: StudyCard, ok: boolean): void {
    this.answered++
    const w = this.weights.get(card.id) ?? 1
    this.weights.set(card.id, ok ? Math.max(0.5, w / 2) : 4)
    if (ok) {
      this.score++
    } else {
      if (!this.wrong.includes(card)) this.wrong.push(card)
      // 복습에서 틀린 카드는 마지막에 한 번 더
      if (this.config.mode.type === 'review' && !this.requeued.has(card.id)) {
        this.requeued.add(card.id)
        this.queue.push(card)
      }
    }
  }

  private pickWeighted(): StudyCard {
    const pool = this.config.cards
    const candidates = pool.length > 1 && this.last ? pool.filter((c) => c !== this.last) : pool
    const total = candidates.reduce((sum, c) => sum + (this.weights.get(c.id) ?? 1), 0)
    let r = Math.random() * total
    for (const c of candidates) {
      r -= this.weights.get(c.id) ?? 1
      if (r <= 0) return c
    }
    return candidates[candidates.length - 1]
  }
}

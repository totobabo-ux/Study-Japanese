// 단어 데이터 점검: 파일 간 중복, 가나 외 문자 등
import { WORDS_A } from '../src/data/words/wordsA.ts'
import { WORDS_B } from '../src/data/words/wordsB.ts'
import { WORDS_C } from '../src/data/words/wordsC.ts'
import { WORDS_D } from '../src/data/words/wordsD.ts'

const all = [...WORDS_A.map((w) => ({ ...w, f: 'A' })), ...WORDS_B.map((w) => ({ ...w, f: 'B' })), ...WORDS_C.map((w) => ({ ...w, f: 'C' })), ...WORDS_D.map((w) => ({ ...w, f: 'D' }))]
console.log('total', all.length)
const byKana = new Map<string, typeof all>()
for (const w of all) byKana.set(w.kana, [...(byKana.get(w.kana) ?? []), w])
for (const [k, ws] of byKana) if (ws.length > 1) console.log('DUP', k, ws.map((w) => `${w.f}:${w.kanji ?? '-'}:${w.meaning}:${w.topic}`).join(' | '))
for (const w of all) if (!/^[\u3041-\u3096\u30a1-\u30fa\u30fc]+$/.test(w.kana)) console.log('NONKANA', w.f, w.kana)

// KanjiVG(CC BY-SA 3.0)에서 히라가나·가타카나 필순 데이터를 받아 src/data/strokes.json으로 저장
// 사용법: node scripts/fetch-strokes.mjs
import { writeFileSync } from 'node:fs'

const hira = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん' +
  'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ']
const chars = [...hira, ...hira.map((c) => String.fromCharCode(c.charCodeAt(0) + 0x60))]

const out = {}
for (const ch of chars) {
  const hex = ch.codePointAt(0).toString(16).padStart(5, '0')
  const res = await fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`)
  if (!res.ok) throw new Error(`${ch} (${hex}): HTTP ${res.status}`)
  const svg = await res.text()
  // 획 순서대로 path의 d 속성만 추출 (s1, s2, ... 순)
  out[ch] = [...svg.matchAll(/<path id="kvg:[0-9a-f]+-s\d+"[^>]*\sd="([^"]+)"/g)].map((m) => m[1])
  if (out[ch].length === 0) throw new Error(`${ch}: 획 데이터 없음`)
}
writeFileSync('src/data/strokes.json', JSON.stringify(out))
console.log(`${Object.keys(out).length}자 저장`)

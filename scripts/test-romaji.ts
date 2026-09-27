import { toRomaji } from '../src/lib/romaji'

const cases: [string, string, boolean?][] = [
  ['がっこう', 'gakkou'], ['きって', 'kitte'], ['まっちゃ', 'matcha'], ['コーヒー', 'koohii'],
  ['パーティー', 'paatii'], ['フォーク', 'fooku'], ['きんえん', "kin'en"], ['ほんや', "hon'ya"],
  ['せんせい', 'sensei'], ['ろっぴゃく', 'roppyaku'], ['ハンバーガー', 'hanbaagaa'],
  ['サンドイッチ', 'sandoitchi'], ['コンピューター', 'konpyuutaa'], ['はは', 'haha'],
  ['じゅうよっか', 'juuyokka'], ['しんよう', "shin'you"], ['これをください', 'korewokudasai'.replace('wo', 'o')],
  ['わたしは がくせいです', 'watashiwa gakuseidesu', true], ['がっこうへ いきます', 'gakkoue ikimasu', true],
  ['みずを のみます', 'mizuo nomimasu', true],
]
let fail = 0
for (const [kana, want, p] of cases) {
  const got = toRomaji(kana, p)
  if (got !== want) { fail++; console.log('FAIL', kana, got, '≠', want) }
}
console.log(fail ? `${fail} failed` : `all ${cases.length} passed`)

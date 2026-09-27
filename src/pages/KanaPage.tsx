import { Tabs } from '../components/Tabs'
import { KanaTable } from './KanaTable'
import { Rules } from './Rules'
import { Writing } from './Writing'

const TABS = [
  { id: 'table', label: '문자표' },
  { id: 'write', label: '쓰기' },
  { id: 'rules', label: '발음 규칙' },
]

export function KanaPage({ tab = 'table' }: { tab?: string }) {
  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">문자</h1>
      <Tabs base="kana" current={tab} tabs={TABS} />
      {tab === 'table' && <KanaTable />}
      {tab === 'write' && <Writing />}
      {tab === 'rules' && <Rules />}
    </div>
  )
}

import { useSearchParams } from 'react-router-dom'
import Tabs from '../components/molecules/Tabs.jsx'
import SizeGuide from './tools/SizeGuide.jsx'
import Glossary from './tools/Glossary.jsx'
import ChartMaker from './tools/ChartMaker.jsx'
import { LengthConverter, GaugeAdapter, SpreadCalculator, YarnCalculator } from './tools/Calculators.jsx'
import page from './Page.module.css'
import PageHeader from '../components/organisms/PageHeader.jsx'

const TOOLS = [
  { value: 'sizes', label: 'Sizes', render: () => <SizeGuide /> },
  { value: 'glossary', label: 'Glossary', render: () => <Glossary /> },
  { value: 'spread', label: 'Spread inc/dec', render: () => <SpreadCalculator /> },
  { value: 'gauge', label: 'Swatch adapter', render: () => <GaugeAdapter /> },
  { value: 'yarn', label: 'Yarn amount', render: () => <YarnCalculator /> },
  { value: 'length', label: 'Length', render: () => <LengthConverter /> },
  { value: 'chart', label: 'Chart maker', render: () => <ChartMaker /> },
]

// All the helpers in one place. The chosen tool is in the URL (?tool=gauge),
// so a tool can be bookmarked or linked to.
export default function ToolsPage() {
  const [params, setParams] = useSearchParams()
  const current = TOOLS.find((t) => t.value === params.get('tool')) ?? TOOLS[0]
  return (
    <>
      <PageHeader title="Tools" subtitle="Sizes, terms and quick maths for adapting any pattern to your hook, yarn and gauge." />
      <div className={page.toolbar}>
        <Tabs label="Tools" options={TOOLS} value={current.value} onChange={(v) => setParams({ tool: v })} />
      </div>
      <div className="enter" key={current.value}>{current.render()}</div>
    </>
  )
}

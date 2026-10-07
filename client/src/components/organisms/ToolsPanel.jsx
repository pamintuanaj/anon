import Tabs from '../molecules/Tabs.jsx'
import SizeGuide from '../../pages/tools/SizeGuide.jsx'
import Glossary from '../../pages/tools/Glossary.jsx'
import ChartMaker from '../../pages/tools/ChartMaker.jsx'
import { LengthConverter, GaugeAdapter, SpreadCalculator, YarnCalculator, YarnEstimator } from '../../pages/tools/Calculators.jsx'
import page from '../../pages/Page.module.css'

// The list of tools, shared by the Tools page and the tracker's side drawer so
// they can never drift apart. `compact` gives the chart maker a one-column
// layout for the narrower drawer.
export const TOOLS = [
  { value: 'sizes', label: 'Sizes', render: () => <SizeGuide /> },
  { value: 'glossary', label: 'Glossary', render: () => <Glossary /> },
  { value: 'spread', label: 'Spread inc/dec', render: () => <SpreadCalculator /> },
  { value: 'gauge', label: 'Swatch adapter', render: () => <GaugeAdapter /> },
  { value: 'yarn', label: 'Yarn amount', render: () => <YarnCalculator /> },
  { value: 'estimate', label: 'Yarn estimate', render: () => <YarnEstimator /> },
  { value: 'length', label: 'Length', render: () => <LengthConverter /> },
  { value: 'chart', label: 'Chart maker', render: (compact) => <ChartMaker compact={compact} /> },
]

export default function ToolsPanel({ tool, onTool, compact = false }) {
  const current = TOOLS.find((t) => t.value === tool) ?? TOOLS[0]
  return (
    <>
      <div className={page.toolbar}>
        <Tabs label="Tools" options={TOOLS} value={current.value} onChange={onTool} />
      </div>
      <div className="enter" key={current.value}>{current.render(compact)}</div>
    </>
  )
}

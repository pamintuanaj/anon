import { useSearchParams } from 'react-router-dom'
import ToolsPanel from '../components/organisms/ToolsPanel.jsx'
import PageHeader from '../components/organisms/PageHeader.jsx'

// All the helpers in one place. The chosen tool is in the URL (?tool=gauge),
// so a tool can be bookmarked or linked to. The same tools open inside the
// tracker in a side drawer (see ToolsDrawer).
export default function ToolsPage() {
  const [params, setParams] = useSearchParams()
  return (
    <>
      <PageHeader title="Tools" subtitle="Sizes, terms and quick maths for adapting any pattern to your hook, yarn and gauge." />
      <ToolsPanel tool={params.get('tool')} onTool={(v) => setParams({ tool: v })} />
    </>
  )
}

import { Link } from 'react-router-dom'
import { Empty } from '../components/molecules/StatusMessage.jsx'

export default function NotFound() {
  return (
    <Empty action={<Link to="/">Back to the community</Link>}>
      This page dropped a stitch. There is nothing at this address.
    </Empty>
  )
}

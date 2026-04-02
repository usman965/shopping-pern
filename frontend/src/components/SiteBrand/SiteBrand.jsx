import { Link } from 'react-router-dom'
import './SiteBrand.css'

const SITE_NAME = 'Shopping Center'

function SiteBrand() {
  return (
    <Link
      to="/"
      className="site-brand"
      aria-label={`${SITE_NAME}, go to home`}
    >
      <img
        className="site-brand-icon"
        src="/favicon.svg"
        alt=""
        width={28}
        height={28}
        decoding="async"
      />
      <span className="site-brand-name">{SITE_NAME}</span>
    </Link>
  )
}

export default SiteBrand

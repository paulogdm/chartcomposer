import Meta from './Meta'
import Footer from './Footer'
export default ({ children }) => (
  <div>
    <Meta />
    { children }
    <Footer />
  </div>
)

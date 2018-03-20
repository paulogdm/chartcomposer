import Meta from './Meta'
import Footer from './Footer'
import { createOauthFlow } from 'react-oauth-flow'

export default ({ children }) => (
  <div>
    <Meta />
    { children }
    <Footer />
  </div>
)


const { Sender, Receiver } = createOauthFlow({
  authorizeUrl: 'https://www.dropbox.com/oauth2/authorize',
  tokenUrl: 'https://api.dropbox.com/oauth2/token',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/authreceiver',
})
export { Sender, Receiver }
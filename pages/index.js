
import chordpro from 'chordprojs'
import sleepy from '../songz/SleepyAngel.txt'

export default () => {
    const html = chordpro.format(sleepy)
    return (
        <div>
            Welcome to next.js / muzik!<br/>
            {html}
        </div>
    )
}


import chordpro from 'chordprojs'

const sleepy = `{title:Sleepy Angel}
{subtitle:When no one’s lookin}
{key:G}

{c:Intro}
[G]

{c:Verse}
[C]Sleepy Angel, Sleepy [G]Angel, We [Em]kept you up too [D]long.
[C]Sleepy Angel, Sleepy [G]Angel, It's [Em]time to take you [D]home.

{c:Picking segue}
[C]    [G]
[C]    [G]
[C]    [G]    [G]

{c:Verse}
[C]Keep it coming, keep it [G]coming
You'll [Em]be wrecked before [D]long
[C]Keep it coming, keep it [G]coming
With [Em]everyone led [D]on

{c:VerseMod} You know you've [C]always been real good [Em]lookin, when no one's [D]lookin, are you doing [G]good?

{c:Picking segue}
[C]    [G]
[C]    [G]
[C]    [G]
[C]    [G]    [G]

{c:Verse}
It's never been a [C]struggle, a toil, or [G]trouble You can [Em]see the state I'm [D]in
My shadow [C]walks ten steps be[G]hind me waiting [Em]for to do us [D]in

{c:VerseMod}
Keeping [C]records, scores and [Em]letters  cause a writer's [D]heart is a writer's [G]home cause a writer's [D]heart is a writer's [C]home

{c:Picking ending}
[C]    [G]`

export default () => {
    const parsed = chordpro.parse(sleepy)
    console.error("parsed", parsed)
    return (
        <div>
            Welcome to next.js / muzik!<br/>
            {JSON.stringify(parsed)}
        </div>
    )
}

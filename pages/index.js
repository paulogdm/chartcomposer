
import ChordProJS from 'chordprojs'
import DropboxChooser from 'react-dropbox-chooser'
import React from 'react'

const DROPBOX_APP_KEY = 'z6rx6iyd3ofb186'

export default class IndexPage extends React.Component {
    constructor(props) {
        super()
        this.state = {
            songs: {},
        }
    }

    setSong = (song) => {
        console.log("setSong", song)
        this.setState({
            songs: {
                ...this.state.songs,
                [song.id]: song,
            },
            songId: song.id,
        })
    }

    onChange = e => {
        console.log(e.currentTarget.value)
    }

    render() {
        const { songs, songId } = this.state
        const song = songs[songId]
        return (
            <div>
                <h1>ChartComposer</h1>
                {song ?
                    <SongEditor song={song} onChange={this.onChange} /> :
                    <SongChooser setSong={this.setSong} />}
            </div>
        )
    }
}

const SongEditor = ({song, onChange}) => {
    const parsed = ChordProJS.parse(song.chordpro)
    console.log("ChordProJS parsed", parsed)
    return (
        <textarea
            value={song.chordpro}
            onChange={onChange}
            style={{
                width: "100%",
                height: 500,
            }}
        />
    )
}

const SongChooser = ({setSong}) => {
    return (
        <div>
            <h2>Choose a file to edit:</h2>
            <DropboxChooser
                appKey={DROPBOX_APP_KEY}
                className="dropbox_custom_class"
                extensions={['.pro']}
                linkType="direct"
                folderselect={false}
                multiselect={true}
                cancel={() => { console.log("CANCEL") }}
                success={fs => {
                    console.log("DROPBOX! ", fs)
                    const song = fs[0]
                    fetch(song.link)
                        .then(resp => resp.text())
                        .then(chordpro => {
                            setSong({
                                ...song,
                                chordpro,
                            })
                        })
                }}
            />
        </div>
    )
}

/*

import 'isomorphic-fetch'
import dropbox from 'dropbox'

var Dropbox = require('dropbox').Dropbox;
var dbx = new Dropbox({ accessToken: 'YOUR_ACCESS_TOKEN_HERE' });
dbx.filesListFolder({path: ''})
  .then(function(response) {
    console.log(response);
  })
  .catch(function(error) {
    console.log(error);
  });
*/

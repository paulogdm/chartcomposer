
import ChordProJS from 'chordprojs'
import DropboxChooser from 'react-dropbox-chooser'
import React from 'react'

import Page from '../components/Page'

const DROPBOX_APP_KEY = 'z6rx6iyd3ofb186'

export default class IndexPage extends React.Component {
    constructor(props) {
        super()
        this.state = {
            songs: {},
        }
    }

    componentDidMount() {
        if (localStorage) {
            const songs = JSON.parse(localStorage.getItem("songs") || "{}")
            this.setState({songs})
        }
    }

    addSong = (song) => {
        console.log("addSong", song)
        const songs = {
            ...this.state.songs,
            [song.id]: song,
        }
        this.setState({ songs })
        localStorage.setItem("songs", JSON.stringify(songs))
        /*
        if (Object.keys(songs) === 1) {
            this.setState({ songId: song.id})
        }
        */
    }

    setSongId = songId => {
        console.log("setSongId", songId)
        this.setState({ songId })
    }

    onChange = e => {
        console.log(e.currentTarget.value)
    }

    render() {
        const { songs, songId } = this.state
        const song = songs[songId]
        return (
            <Page>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh"
                }}>
                    <h1 style={{ paddingLeft: 10 }}>ChartComposer</h1>
                    <div style={{ display: "flex", flex: 1 }}>
                        <div style={{
                            borderRight: "1px solid #ccc",
                            display: "flex",
                            flexDirection: "column",
                            width: "30%",
                        }}>
                            <div>
                                <SongChooser addSong={this.addSong} />
                            </div>
                            <div style={{
                                background: "#eee",
                                flex: 1
                            }}>
                                <SongList songs={songs}
                                    setSongId={this.setSongId}
                                />
                            </div>
                        </div>
                        <div style={{
                            background: "#fff",
                            padding: 10,
                            flex: 1,
                        }}>
                            {song ?
                                <SongEditor song={song}
                                    onChange={this.onChange}
                                /> :
                                null
                            }
                        </div>
                    </div>
                </div>
            </Page>
        )
    }
}

const SongList = ({setSongId, songs}) => {
    return (
        <ol
            style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
            }}
        >
            {Object.keys(songs).map(songId =>
                <li
                    key={songId}
                    onClick={() => {
                        setSongId(songId)
                    }}
                    style={{
                        background: "#fff",
                        borderBottom: "1px solid #ccc",
                        cursor: "pointer",
                        padding: 10,
                    }}
                >
                    {songs[songId].name}
                </li>
            )}
        </ol>
    )
}

const SongEditor = ({song, onChange}) => {
    const parsed = ChordProJS.parse(song.chordpro)
    console.log("ChordProJS parsed", parsed)
    return (
        <textarea
            value={song.chordpro}
            onChange={onChange}
            style={{
                border: "none",
                width: "100%",
                height: "100%",
                padding: 0,
            }}
        />
    )
}

const fetchFilesAndAddSong = (files, addSong) => {
    files.forEach(song => {
        fetch(song.link)
            .then(resp => resp.text())
            .then(chordpro => {
                addSong({
                    ...song,
                    chordpro,
                })
            })
        })
}

const SongChooser = ({addSong}) => {
    return (
        <div style={{
            display: "flex",
            padding: 10,
            borderBottom: "1px solid #ccc",
        }}>
            <DropboxChooser
                appKey={DROPBOX_APP_KEY}
                className="dropbox_custom_class"
                extensions={['.pro']}
                linkType="direct"
                folderselect={false}
                multiselect={true}
                cancel={() => { console.log("CANCEL") }}
                success={files => {
                    console.log("DROPBOX files! ", files)
                    fetchFilesAndAddSong(files, addSong)
                }}
            />
            <div style={{margin: 5}}>
                or
            </div>
            <div>
                <input placeholder="Dropbox share link" />
            </div>
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

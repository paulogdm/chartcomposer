import React from "react";
import Head from "next/head";

import { AppContext } from "./../context/App.js";
import { APP_NAME } from "./../utils/constants";
import removeFileExtension from "./../utils/removeFileExtension";

export default class Meta extends React.Component {
  static contextType = AppContext;
  render() {
    const { getSongById, songId } = this.context;
    const [song, folderId] = getSongById(songId);
    return (
      <div>
        <Head>
          <title>{song ? removeFileExtension(song.name) : APP_NAME}</title>
          <meta charSet="utf-8" />
          <meta
            name="Description"
            content={`${APP_NAME} lets you create and share sheet music with your friends.`}
          />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, user-scalable=no"
          />
          <meta name="theme-color" content="#eeeeee" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="stylesheet" href="/bootstrap.min.css" />
          <link rel="stylesheet" href="/SongView.css" />
        </Head>
        <style jsx global>{`
          body {
            font: 13px menlo, sans-serif;
            margin: 0;
          }
          @media print {
            @page {
              margin: 0;
            }
            body {
              padding: 2em;
            }
          }
        `}</style>
      </div>
    );
  }
}

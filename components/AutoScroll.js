import React from "react";
import { Button } from "react-bootstrap";

// Convert the duration parameter to a number of seconds.
function durationSeconds(dur) {
  var matches = dur.match(/([0-9]*):([0-9]*)/);
  if (matches) {
    var mins = parseInt(matches[1]);
    var secs = parseInt(matches[2]);
    dur = 60 * mins + secs;
  }

  return dur;
}

export default class AutoScroll extends React.Component {
  componentDidMount() {
    this.bAutoScroll = false;
    this.tAutoscrollStart = 0;
    this.nSongTop = 0;
    this.below = 0;
  }

  componentWillUnmount() {
    console.debug("AUTOSCROLL CWU");
    const songView = document.querySelector(".panel-song-view");
    songView.scrollTo(0, 0);
    if (this.autoScrollTimeout) {
      console.debug("unsetting autoScrollTimeout", this.autoScrollTimeout);
      window.clearTimeout(this.autoScrollTimeout);
      this.autoScrollTimeout = null;
    }
  }

  autoScroll = () => {
    if (!this.bAutoScroll) {
      // stop autoscrolling
      return;
    }

    const songView = document.querySelector(".panel-song-view");

    // By 30 seconds before the end of the song we want the last line to be at the bottom of the viewport.
    // So we find the amount of song that is below the fold, and the time to scroll it, and prorate that.
    // TODO(elsigh): This seems to fail if the song is less than 40 seconds long.
    const delta = Number(new Date()) - this.tAutoscrollStart;
    const duration = (durationSeconds(this.props.duration) - 40) * 1000;
    if (!duration || delta >= duration) {
      // done scrolling
      console.log("done autoscrolling");
      songView.scrollTo(0, songView.scrollHeight);
      this.bAutoScroll = false;
      return;
    }

    const scrollTo = Math.round(
      this.nSongTop + (delta / duration) * this.below,
    );
    if (0 > scrollTo) {
      return;
    }
    // TODO(elsigh): remove DOM check
    if (songView) {
      songView.scrollTo(0, scrollTo);
    } else {
      this.bAutoScroll = false;
      return;
    }

    this.autoScrollTimeout = window.setTimeout(this.autoScroll, 20);
  };

  toggleAutoScroll = () => {
    this.bAutoScroll = !this.bAutoScroll;
    if (this.bAutoScroll) {
      // start autoscroll
      if (this.tAutoscrollStart) {
        // Resume autoscroll.
        console.log("toggleAutoScroll: resume");
        this.tAutoscrollStart += Number(new Date()) - this.tAutoscrollStop; // add paused time
        this.autoScroll();
      } else {
        // Start autoscroll for the very first time.
        console.log("toggleAutoScroll: start");
        var songView = document.querySelector(".panel-song-view");
        var startElement =
          document.querySelector(".SongView-section") ||
          document.querySelector(".verse") ||
          null;
        var startImage =
          document.querySelector(".image") || document.querySelector(".x_pdf");
        if (
          startImage &&
          (!startElement ||
            startImage.getBoundingClientRect().y <
              startElement.getBoundingClientRect().y)
        ) {
          // If there is both a "verse" and an "image", choose the one closest to the top.
          startElement = startImage;
        }

        if (startElement) {
          // scrollTo parameters are relative to the SongView, but
          // getBoundingClientRect is relative to the viewport.
          // So we have to offset by the top of the SongView relative to viewport.
          songView.scrollTo(0, 0); // Reset SongView so all coordinates are relative to 0
          var songViewTop = songView.getBoundingClientRect().y;
          this.nSongTop = startElement.getBoundingClientRect().y - songViewTop; // "top" is the first verse so we skip over YouTube videos etc.
          var nSongHeight = songView.scrollHeight - this.nSongTop;
          this.below = nSongHeight - songView.clientHeight;
          songView.scrollTo(0, this.nSongTop);
          if (this.below <= 0) {
            // it fits in the viewport - no need to autoscroll
            console.log("no need to autoscroll - it all fits");
            this.bAutoScroll = false;
            return;
          }
          // Start after 10 seconds so the first line is visible for a while
          this.tAutoscrollStart = Number(new Date()) + 10 * 1000;
          this.autoScrollTimeout = window.setTimeout(
            this.autoScroll,
            10 * 1000,
          );
        } else {
          console.log("WARNING: Could not find first song element.");
        }
      }
    } else {
      this.tAutoscrollStop = Number(new Date());
      this.autoScrollTimeout = null;
      console.log("toggleAutoScroll: stop");
    }
  };

  render() {
    return (
      <Button
        className="AutoScroll"
        onClick={this.toggleAutoScroll}
        style={{
          position: "fixed",
          right: 40,
        }}
      >
        Autoscroll
      </Button>
    );
  }
}

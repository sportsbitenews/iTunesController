# iTunesController
Control iTunes from cmd line!

Kind of a pointless project but pretty cool to mess around with Powershell. Works using Powershell called via the [Edge.js](https://github.com/tjanczuk/edge) project by @tjanczuk
##### There's a reason why they call it POWERshell.

###Command List [so far]

####Open Itunes
`itunes start`
######Opens iTunes. iTunes needs to be open to run commands. All commands automatically open iTunes if closed.

####Restart Song From Beginning
`itunes restart`
######Plays song from start.

####Play Next Song
`itunes next`
######Skips to the next song.

####Pause Current Song
`itunes pause`
######Halts playback of the current song.

####Play Current Song
`itunes play [optional song name]`
######Resumes current song if stopped.
######If optional song name is specified, it will search for a song matching the song name entered. If multiple matching entries are found, it will prompt the user to choose from a list.

Notice:
- Still a little buggy but it definitely works! Working on deterministic setup commands as getting setup is the hardest part.






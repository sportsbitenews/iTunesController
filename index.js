#!/usr/bin/env node
var edge = require('edge');
var chalk = require('chalk');
var Shell = require('node-powershell');
var readlineSync = require('readline-sync');

// ========================================================== //
// ================== Setup XML iTunes File ================= //
// ========================================================== //

var db = require('./db.js');

// ========================================================== //
// ================== iTunes Controller ===================== //
// ========================================================== //

var iTunesController = function() {
    
    // Private Methods
    
    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }
    
    function playTrackFromLocation(location, trackName, artistName){
        var location = location.substring(location.indexOf('localhost') + 10);
        location = replaceAll(location, '%20', ' ');
        location = replaceAll(location, '/', '\\');
        
        var iTunes_playSongFomLoc = edge.func('ps', function () {/*
            $iTunes = New-Object -ComObject iTunes.Application
            $iTunes.PlayFile("$inputFromJS")
            */
        });
        
        console.log(chalk.green("Playing '" + trackName + "' by " + artistName));
            
        iTunes_playSongFomLoc(location, function (error, result) {
            if (error) throw error;
        });
    }
    
    // Public Methods
    
    this.start = function() {
        var iTunes_start = edge.func('ps', function () {/*
        $iTunes = New-Object -ComObject iTunes.Application
        */
    });
        console.log(chalk.blue('Starting iTunes...'));
    iTunes_start('Node.js', function (error, result) {
        if (error) throw error;
        });
    }
	this.restartTrack = function(){
		var iTunes_restart = edge.func('ps', function(){/*
			$iTunes = New-Object -ComObject iTunes.Application
			$iTunes.BackTrack()
			$iTunes.CurrentTrack.Name, $iTunes.CurrentTrack.Artist
		    */
		});
		iTunes_restart('Node.js', function (error, result) {
		    if (error) throw error;
		    console.log(chalk.green("Restarted '" + result[0] + "' by " + result[1]));
		});
	}
	this.nextTrack = function(){
        var iTunes_restart = edge.func('ps', function(){/*
			$iTunes = New-Object -ComObject iTunes.Application
			$iTunes.NextTrack()
			$iTunes.CurrentTrack.Name, $iTunes.CurrentTrack.Artist
		*/
        });
        iTunes_restart('Node.js', function (error, result) {
		    if (error) throw error;
            console.log(chalk.green("Playing '" + result[0] + "' by " + result[1]));
		});
	}
    this.play = function(){
        var iTunes_play = edge.func('ps', function(){/*
            $iTunes = New-Object -ComObject iTunes.Application
            $iTunes.Play()
            $iTunes.CurrentTrack.Name, $iTunes.CurrentTrack.Artist
		*/
		});
		iTunes_play('Node.js', function (error, result) {
		    if (error) throw error;
		    console.log(chalk.green("Playing '" + result[0] + "' by " + result[1]));
		});
	}
	this.pause = function(){
		var iTunes_pause = edge.func('ps', function(){/*
            $iTunes = New-Object -ComObject iTunes.Application
            $iTunes.Pause()
            $iTunes.CurrentTrack.Name, $iTunes.CurrentTrack.Artist, $iTunes.PlayerPosition
        */
		});
        iTunes_pause('Node.js', function (error, result) {
            if (error) throw error;
            
            var time = secondsToTime(result[2]);
            
            console.log(chalk.green("Paused '" + result[0] + "' by " + result[1] + " at " + time['m'] + ":" + time['s']));
		});
	}
	this.refresh = function(){
        db.refresh();
    }

    this.searchSong = function() {
        // Build search query
        var searchQuery = process.argv.slice(3);
        searchQuery = searchQuery.join(" ");
        
        // Search database for song title
        db.findSongByTitle(searchQuery, function(result){

            // If only one result, play that song
            if(result.length == 1){
                playTrackFromLocation(result[0].LOCATION, result[0].TITLE, result[0].ARTIST);
                
            // Otherwise, ask the user which song they want to play (by number)
            } else {
                console.log("--- Multiple Songs Found -----");
                for(var i = 0; i < result.length; i++){
                    console.log(chalk.yellow("[" + i + "] - " + result[i].TITLE + " - " + result[i].ARTIST + " - " + result[i].ALBUM));
                }
                
                // Wait for user's response.
                console.log("");
                var songSelection = readlineSync.question('Which song # you want to play [Enter #]: ');
                
                if(!isNaN(songSelection)){
                    // Play selected track
                    console.log("");
                    playTrackFromLocation(result[songSelection].LOCATION, result[songSelection].TITLE, result[songSelection].ARTIST);
                } else {
                    console.log("invalid input");
                }
            }
        });
    }
};

// ========================================================= //
// ================= Control Flow ========================== //
// ========================================================= //

var control = new iTunesController();

switch(process.argv[2]){
	case "start":
		control.start();
		break;
	case "play":
		control.play();
		break;
	case "pause":
		control.pause();
		break;
	case "restart":
		control.restartTrack();
		break;
	case "next":
		control.nextTrack();
		break;
	case "refresh":
		control.refresh();
		break;
    case "song":
		control.searchSong();
		break;
}

function secondsToTime(secs) {
    secs = Math.round(secs);
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}



/* 
  Cool Stuff:

  Node-Powershell: https://www.npmjs.com/package/node-powershell
  Invoking Command Line Arguments: http://stackoverflow.com/questions/4351521/how-do-i-pass-command-line-arguments-to-node-js
  Windows Tools: https://github.com/coreybutler/node-windows
  Look into spawning child processes and listening to stdout commands: http://stackoverflow.com/questions/10179114/execute-powershell-script-from-node-js
  iTunes Powershell Functions: http://www.thomasmaurer.ch/projects/powershell-itunes/
  Original idea for this: https://github.com/mrkev/spotify-terminal

*/
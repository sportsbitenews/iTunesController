
var itunes = require('itunes-library-stream');
var chalk = require('chalk');
var userhome = require('userhome');
var path = require('path');
var fs = require('fs');
var location = path.resolve(userhome(), 'Music/iTunes/iTunes Music Library.xml');
var fs = require("fs");
var file = "itunes.db";
var exists = fs.existsSync(file);
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database(file);

// ================================================ //
// ============== CREATE TABLE ===================== //
// ================================================= //

var createTableSQL = "CREATE TABLE ITUNES_LIBRARY (" +
        "TRACK_ID INT PRIMARY KEY NOT NULL, " +
        "TITLE TEXT, " +
        "ARTIST TEXT, " +
        "ALBUM TEXT, " +
        "LOCATION TEXT); ";

// ================================================= //
// ============== SELECT ALL FROM TABLE ============ //
// ================================================= //

var selectAllSQL = "SELECT * FROM ITUNES_LIBRARY; ";

/**
    * INSERT INTO Itunes Library Table
    * @param {Array} array of Statements Objects
    * @param {Function} callback
    *
    * @return void 
    */

function insertTrack(insertStatementsArray){
    // Begin a transaction. 
    db.serialize(function () {
        db.exec('begin transaction'); 
        var request = [];
        for(var i = 0; i < insertStatementsArray.length; i++){
            var promise = new Promise(function(resolve){
                db.run("INSERT INTO ITUNES_LIBRARY VALUES (?, ?, ?, ?, ?) ", insertStatementsArray[i].c1, insertStatementsArray[i].c2, insertStatementsArray[i].c3, insertStatementsArray[i].c4, insertStatementsArray[i].c5);
                resolve();
                request.push(promise);
            });
        }
        
        Promise.all(request).then(function(values){
            // Commit the transaction
            db.exec('COMMIT')
            .close(function(){
                console.log(chalk.green("Added " + insertStatementsArray.length + " new songs..."));
                console.log("Happy Panda :-) Database updated with all your music.");
            });
            
        });
    });
}                                 

var insertTrackSQL = "INSERT INTO ITUNES_LIBRARY (TRACK_ID, TITLE, ARTIST, ALBUM, LOCATION) " + 
        "VALUES ";

var DatabaseController = function(){}

  /**
    * CREATE a New Table 
    * @return void 
    */

DatabaseController.prototype.createTable = function(){
    db.run(createTableSQL);
    console.log("Created table");
}

  /**
    * CLOSE the database connection
    * @return void 
    */

DatabaseController.prototype.closeDB = function(){
    db.close();
}

  /**
    * SELECT ALL 
    * @param {Function} callback
    *
    * @return {} rows - all songs in iTunes Library
    */

DatabaseController.prototype.selectAll = function(callback){
    db.serialize(function() {    
      db.all(selectAllSQL, function(err, rows) {
          callback(rows);
      });
    });
}

/**
    * GET all songs by Artist Name
    * @param {String} artistName
    * @param {Function} callback
    *
    * @return {} rows - all songs that match the query
    */

DatabaseController.prototype.selectByArtistName = function(artistName, callback){
    db.all("SELECT * FROM ITUNES_LIBRARY WHERE ARTIST = ? ", artistName, function(err, rows) {
        callback(rows);
    });
}

/**
    * GET a song by TrackID
    * @param {Integer} trackId
    * @param {Function} callback
    *
    * @return {} track - the track that has the corresponding TRACK_ID
    */

DatabaseController.prototype.selectByTrackID = function(trackID, callback){
    db.each("SELECT * FROM ITUNES_LIBRARY WHERE TRACK_ID = ? ", trackID, function(err, track) {
        callback(track);
    });
}

/**
    * SEARCH for a song by track text
    * @param {String} search
    * @param {Function} callback
    *
    * @return {} queryResults - all query results that have the matching text
    */

DatabaseController.prototype.findSongByTitle = function(search, callback){
    db.all("SELECT * FROM ITUNES_LIBRARY WHERE TITLE LIKE ? ", '%' + search + '%', function(err, queryResults) {
          callback(queryResults);
    });
}

/**
    * UPDATE the database with any songs inside ItunesLibary.xml but not in database
    *
    * @return void
    */

DatabaseController.prototype.refresh = function(){
    console.log(chalk.yellow("Looking for songs..."));
    var stream = fs.createReadStream(location)
      .pipe(itunes.createTrackStream());

    var statement = insertTrackSQL;
    var endOfLine = require('os').EOL;
    var inserts = [];
    var index = 0;

    stream.on('data', function(data) {
        var trackID = data['Track ID'];
        
        // Check if the song is in the database or not
        db.all("SELECT * FROM ITUNES_LIBRARY WHERE TRACK_ID = ? ", trackID, function(err, row){
            
            // If the song doesn't exist, add it to be inserted
            if(row[0]){
            if(!row[0].TRACK_ID){
                var name = data.Name;
                var artist = data.Artist;
                var album = data.Album;
                var location = data.Location;

                if(name) name.split('(').join('');
                if(name) name.split(')').join('');

                if(artist) artist.split('()').join('');
                if(artist) artist.split(')').join('');

                // Add object to insert to an array
                inserts[index] = {
                    c1: trackID,
                    c2: name || '-----',
                    c3: artist || '-----',
                    c4: album || '-----',
                    c5: location
                }
                console.log(data['Track ID'] + " - " + data.Name + " - " + data.Artist);
                index++;
            }
        }
        });
    });

    stream.on('end', function(){
        index = 0;
        insertTrack(inserts);
    });
}

module.exports = new DatabaseController;

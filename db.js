
var itunes = require('itunes-library-stream');
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

// ================================================= //
// ============== INSERT INTO TABLE ===================== //
// ================================================= //

function insertTrack(insertStatementsArray){
    console.log("Updating database...");
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
            console.log("now we're here");
            
            db.exec('COMMIT')
            .close(function(){
                console.log("Happy Panda :-) Database updated with all your music.");
            });
            
        });
    });
}                                 

var insertTrackSQL = "INSERT INTO ITUNES_LIBRARY (TRACK_ID, TITLE, ARTIST, ALBUM, LOCATION) " + 
        "VALUES ";

var DatabaseController = function(){}

DatabaseController.prototype.createTable = function(){
    db.run(createTableSQL);
    console.log("Created table");
}

DatabaseController.prototype.closeDB = function(){
    db.close();
}

DatabaseController.prototype.selectAll = function(){
    db.serialize(function() {    
      db.each(selectAllSQL, function(err, row) {
          console.log(row.TRACK_ID + " - " + row.TITLE + " - " + row.ARTIST);
      });
    });
    console.log("Ran Select All");
}

DatabaseController.prototype.refresh = function(){
    var stream = fs.createReadStream(location)
      .pipe(itunes.createTrackStream());

    var statement = insertTrackSQL;
    var endOfLine = require('os').EOL;
    var inserts = [];
    var index = 0;

    stream.on('data', function(data) {
        var trackID = data['Track ID'];
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
      });

    stream.on('end', function(){
        index = 0;
        insertTrack(inserts);
    });
}

module.exports = new DatabaseController;
    

//db.serialize(function() {
//    
//  db.each("SELECT * FROM ITUNES_LIBRARY WHERE ARTIST = 'Cyanide Canaries'; ", function(err, row) {
//      console.log(row.TRACK_ID + " - " + row.TITLE + " - " + row.ARTIST);
//  });
//});


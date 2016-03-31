
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

// ================================================= //
// ============== CREATE TABLE ===================== //
// ================================================= //

var createTableSQL = "CREATE TABLE ITUNES_LIBRARY (" +
		"TRACK_ID INT PRIMARY KEY NOT NULL, " +
		"TITLE TEXT, " +
		"ARTIST TEXT, " +
		"LOCATION TEXT); ";

// ================================================= //
// ============== SELECT ALL FROM TABLE ===================== //
// ================================================= //

var selectAllSQL = "SELECT * FROM ITUNES_LIBRARY; ";

// ================================================= //
// ============== INSERT INTO TABLE ===================== //
// ================================================= //

function insertTrack(statement){
		db.run(statement, function(error){
			console.log(error);
		});
}


var insertTrackSQL = "INSERT INTO ITUNES_LIBRARY (TRACK_ID, TITLE, ARTIST, LOCATION) " + 
		"VALUES ";

var DatabaseController = function(){

}

DatabaseController.prototype.createTable = function(){
	db.run(createTableSQL);
	console.log("Created table");
}

DatabaseController.prototype.closeDB = function(){
	db.close();
}

DatabaseController.prototype.refresh = function(){
	var stream = fs.createReadStream(location)
	  .pipe(itunes.createTrackStream());

	var statement = insertTrackSQL;

	stream.on('data', function(data) {
		var trackID = data['Track ID'];
		var name = data.Name;
		var artist = data.Artist;
		var location = data.Location;

		if(name) name.replace('(', '');
		if(name) name.replace(')', '');

		if(name) artist.replace('(', '');
		if(name) artist.replace(')', '');

	  	// Insert into the database
	  	statement = statement + "(" + trackID + ", " + (name || 'no title') + ", " + (artist || 'no artist') + ", " + location + "), ";
	  	console.log(data['Track ID'] + " - " + data.Name + " - " + data.Artist);

	  });

	stream.on('end', function(){
		console.log("Executing database insert");
	  	statement = statement.substring(0, statement.length - 2);
	  	console.log(statement);
	  	//fs.writeFile('statement.txt', statement, 'utf-8');
	  	insertTrack(statement);

	});
}

module.exports = new DatabaseController;




db.serialize(function() {
	
  db.each("SELECT * FROM ITUNES_LIBRARY WHERE ARTIST = 'Cyanide Canaries'; ", function(err, row) {
      console.log(row.TRACK_ID + " - " + row.TITLE + " - " + row.ARTIST);
  });
});


/*   
 * node.ly - A node.js library to implement your own URL shortener, 
 * inspired by Bit.ly 
 * Copyright (C) 2010 Gianfranco Cecconi <giacecco@giacec.co.uk>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var SYS = require("sys"), HTTP = require("http");
var COM_GIACECCO_TOOLS = require("./com_giacecco_tools");
var SQLITE3 = require("./sqlite"); // node-sqlite is courtesy of http://grumdrig.com/node-sqlite/ 

/* = Note on Node.ly short URLs length and file size =
 * 
 * Experimentally, the data required to store 10,000 worst-case-scenario 
 * URLs is 23,224,320 bytes (see MAX_URL_LENGTH below).
 *  
 * SQLite 3's theoretical max database size is 2 TB (see
 * http://www.sqlite.org/whentouse.html ). 
 * 
 * If my calculation below is right...
 * 
 * Length of short URL	Max no. of short URLs	Projected file size (circa)
 * 2					5,329					12 MB
 * 3					389,017					861 MB
 * 4					28,398,241				61 GB
 * 5					2,073,071,593			4 TB
 * (...)
 * 
 * ... it is clear that I can't use SQLite 3 for short URLs beyond 4
 * characters. With more than 28M URLs supported, I may not be too sad though.
 * 
 * Someone may also want to consider the max size of files on your operating
 * system / file system combination. I work on MacOS 10.6.x , which gives me 
 * almost 8 EB of max file size! 
 * (http://support.apple.com/kb/HT2422?viewlocale=en_US)
 */

// TODO: is the line below the best way of doing this? if I returned 
// MAX_URL_LENGTH directly, would the calling procedure be able to 
// change it? 
exports.RFC_ALLOWED_CHARACTERS = function() {
	// According to http://www.rfc-editor.org/rfc/rfc1738.txt the following is 
	// the list of characters that can be used in an URL
	return "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$-_.+!*'(),";	
}();

exports.MAX_URL_LENGTH = function() {
	// According to http://www.boutell.com/newfaq/misc/urllength.html that 
	// did some testing in 2008, Microsoft IE cannot manage URLs longer
	// than 2083 characters, and that's the shortest around
	return 2083;
}();

/* Two possible signatures for the constructor:
 * 1) (shortenedURLLength, allowedCharacters, filenameWithoutExtension) to create a new file
 * 2) (filenameWithoutExtension) to open an existing one; if the file does not exist, a new
 *    one is created with default settings */
exports.shortener = function() {

	// constants	
	var NODE_LY_FILE_EXTENSION = ".nodely";

	// variables
	var db, SHORTENED_URL_LENGTH, ALLOWED_CHARACTERS, MAX_ENCODABLE_NUMBER;
	
	// Like ToBase / FromBase, where the base is the list of characters that 
	// are allowed in an URL
	var NumberToShortString = function(n) {
		if(n > MAX_ENCODABLE_NUMBER)
			throw new Error("You attempted to convert to short string a number that is too big for encoding.");
		for(var result = ""; result.length < SHORTENED_URL_LENGTH; result += ALLOWED_CHARACTERS[0]) {};
		result += new COM_GIACECCO_TOOLS.BaseConversion(ALLOWED_CHARACTERS).ToBase(n);	
		return result.substr(result.length - SHORTENED_URL_LENGTH, SHORTENED_URL_LENGTH);
	};
	
	// See NumberToShortenedString
	var ShortStringToNumber = function(s) {
		return new COM_GIACECCO_TOOLS.BaseConversion(ALLOWED_CHARACTERS).FromBase(s);
	};

	/* Apparently I do not need to worry about race conditions, because
	 * node-sqlite uses SQLite's serialised threading mode. */
	var ShortenSync = function(fullURL) {
		if(fullURL.length > this.MAX_URL_LENGTH)
			throw new Error("The length of the URL you are trying to shorten is not supported.");
		/* TODO: lower any character of fullURL that should not be case 
		 * sensitive, e.g. the protocol enunciation. */
		var nextId, shortURL, lastAccessed = (new Date()).valueOf();
		var q = db.query("select * from URLs where fullURL = ?", [fullURL]);
		if(q.all[0].length > 0) {
			// the URL has been shortened before
			shortURL = q.all[0][0]["shortURL"];
			db.query("update URLs set nrOfAccesses = ?, lastAccessed = ? where shortURL = ?;", [ q.all[0][0]["nrOfAccesses"] + 1, lastAccessed, shortURL]);
		} else {
			// the URL has NOT been shortened before
			q = db.query("select max(id) as maxId from URLs;");
			if(typeof(q.all[0][0]["maxId"]) == "undefined") {
				// the cache is empty
				nextId = 0;
			} else {
				nextId = q.all[0][0]["maxId"];
				if(nextId < Math.pow(ALLOWED_CHARACTERS.length, SHORTENED_URL_LENGTH) - 1) {
					// there is unused space in the cache
					nextId++;
				} else {
					// the cache is full
					// TODO: the choice of the short URL to be reused can be
					// much cleverer than it is now
					q = db.query("select id from URLs order by nrOfAccesses asc, lastAccessed asc;");
					nextId = q.all[0][0]["id"];
				};
			};
			shortURL = NumberToShortString(nextId);
			
			q = db.query("select shortURL from URLs where shortURL = ?", [ shortURL ]);
			if(q.all[0].length == 0) {
				// the short URL has not been used before
				db.query("insert into URLs (shortURL, id, fullURL, nrOfAccesses, lastAccessed, lastUpdated) values (?, ?, ?, 0, ?, ?);", [shortURL, nextId, fullURL, lastAccessed, lastAccessed]);
			} else {
				// the short URL has been used before
				db.query("update URLs set fullURL = ?, nrOfAccesses = 0, lastAccessed = ?, lastUpdated = ? where shortURL = ?;", [ fullURL, lastAccessed, lastAccessed, shortURL ]);
			};
		};
		return shortURL;
	};
	
	/* Apparently I do not need to worry about race conditions, because
	 * node-sqlite uses SQLite's serialised threading mode. */
	var RetrieveSync = function(shortURL) {
		var lastAccessed = (new Date()).valueOf();
		var q = db.query("select fullURL, nrOfAccesses from URLs where shortURL = ?;", [ shortURL ]);
		if(q.all[0].length == 0) {
			// the short URL does not exist
			return null;
		};
		db.query("update URLs set nrOfAccesses = ?, lastAccessed = ? where shortURL = ?;", [ q.all[0][0]["nrOfAccesses"] + 1, lastAccessed, shortURL ]);
		return q.all[0][0]["fullURL"];
	};

	// starts a basic web site to access the shortener on port 8000,
	// unless a different HTTP port is specified
	var CreateServer = function(port) {
		HTTP.createServer(function (request, response) {
			requestComponents = require('url').parse(request.url, true);
			if((typeof(requestComponents["query"]) == "undefined") && (requestComponents["pathname"].length == (SHORTENED_URL_LENGTH + 1))) {
				// the web browser is requesting to resolve a short URL
				// http://en.wikipedia.org/wiki/URL_redirection
				response.writeHead(
					302, { 
						'Content-Type': 'text/plain', 
						'Location' : RetrieveSync(requestComponents["pathname"].substring(1, requestComponents["pathname"].length))
					});
				response.end();
			} else 
				switch(requestComponents["pathname"]) {
				case "/shorten":
					// this is the shortest form to request to shorten an 
					// URL, to be used as it was an API 
					response.writeHead(200, {'Content-Type': 'text/plain'});
					response.end(ShortenSync(requestComponents["query"]["URL"]));
				default:
					response.writeHead(200, {'Content-Type': 'text/plain'});
					response.end('Hello World\n');
				};
		}).listen(port || 8000);
	};
	
	// the actual constructor instructions start here
	
	switch(arguments.length) {
	
	case 1: // the user's trying to open an existing file
		
		// the file does not exist, I shall abort..
		if(!COM_GIACECCO_TOOLS.FileExistsSync(arguments[0] + NODE_LY_FILE_EXTENSION)) 
			throw new Error("You are trying to open a file that does not exist.");
		
		// the file exists, I read it
		db = SQLITE3.openDatabaseSync(arguments[0] + NODE_LY_FILE_EXTENSION);
		var temp = JSON.parse(db.query("SELECT json FROM Meta;").all[0][0]["json"]);
		ALLOWED_CHARACTERS = temp["ALLOWED_CHARACTERS"];
		SHORTENED_URL_LENGTH = temp["SHORTENED_URL_LENGTH"];
		break;
		
	case 3: // the user's trying to create a new file
				
		// the file exists already! I shall abort...
		if(COM_GIACECCO_TOOLS.FileExistsSync(arguments[2] + NODE_LY_FILE_EXTENSION)) 
			throw new Error("You are trying to create a file that exists already.");

		// the file does not exist, I can proceed
		
		// this is just your choice, really...
		SHORTENED_URL_LENGTH = arguments[0];
		if(typeof(SHORTENED_URL_LENGTH) == "undefined") SHORTENED_URL_LENGTH = 4;
		
		ALLOWED_CHARACTERS = arguments[1];
		if(typeof(ALLOWED_CHARACTERS) == "undefined") ALLOWED_CHARACTERS = this.RFC_ALLOWED_CHARACTERS;

		// A very conservative check on the potential size of the URL database...
		if(Math.pow(ALLOWED_CHARACTERS.length, SHORTENED_URL_LENGTH) * 2322 >= Math.pow(2, 41))
			throw new Error("The URL database you are trying to create is too big. Try narrowing the set of allowed characters or the length of the short URLs.");
		
		// I create the file
		db = SQLITE3.openDatabaseSync(arguments[2] + NODE_LY_FILE_EXTENSION);
		db.query("CREATE TABLE URLs(shortURL TEXT PRIMARY KEY ASC, id INTEGER, fullURL TEXT, nrOfAccesses INTEGER, lastAccessed INTEGER, lastUpdated INTEGER);");
		db.query("CREATE TABLE Meta (json TEXT);");
		db.query("INSERT INTO Meta (json) VALUES (?)", [JSON.stringify({
			"ALLOWED_CHARACTERS"   : ALLOWED_CHARACTERS,
			"SHORTENED_URL_LENGTH" : SHORTENED_URL_LENGTH
		})]);
		break;
		
	default: // wrong number of parameters in the constructor
		
		throw new Error("You are trying to create a shortener object with the wrong number of parameters.");
		
	};
	MAX_ENCODABLE_NUMBER = Math.pow(ALLOWED_CHARACTERS.length, SHORTENED_URL_LENGTH);
	return {
		"ShortenSync"            : ShortenSync,
		"RetrieveSync"           : RetrieveSync,
		"CreateServer"           : CreateServer
	};
	
};



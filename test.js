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

var GenerateRandomString = function(stringLength, allowedCharacters) {
	for(var result = ""; result.length < stringLength; result += allowedCharacters[Math.floor(Math.random() * allowedCharacters.length)]) {};
	return result;
};

var CreateRandomData = function(referenceToShortener, noOfWrites, noOfReads) {
	var x, y, allOK = true, testFullURLs = [], testShortURLs = [];
	// the writing
	for(x = 0; x < noOfWrites; x++) {
		testFullURLs[x] = GenerateRandomString(10 + Math.floor(Math.random() * (LY_NODE_SHORTENER.MAX_URL_LENGTH - 10)), LY_NODE_SHORTENER.RFC_ALLOWED_CHARACTERS);
		testShortURLs[x] = referenceToShortener.ShortenSync(testFullURLs[x]);
	};
	// the checking
	for(x = 0; allOK && (x < noOfReads); x++) {
		y = Math.floor(Math.random() * noOfWrites);
		allOK = allOK && (testFullURLs[y] == referenceToShortener.RetrieveSync(testShortURLs[y]));
	};
	if(allOK)
		SYS.puts("Testing completed successfully, please reset the file if required.");
	else
		SYS.puts("Testing has failed.");	
};

var TestMaxDatabaseSize = function(referenceToShortener, nrOfURLs) {
	for(var x = 0; x < nrOfURLs; x++) 
		referenceToShortener.ShortenSync(GenerateRandomString(LY_NODE_SHORTENER.MAX_URL_LENGTH, LY_NODE_SHORTENER.RFC_ALLOWED_CHARACTERS));		
};

var LY_NODE = new require("./ly_node_common"); 
var SYS = require("sys");
var pippo;
LY_NODE.databaseExists(undefined, undefined, "test", function(err, dbExists) {
	if(dbExists) {
		LY_NODE.createShortener(undefined, undefined, "test",
				function(err, shortener) { 
					if(err) 
						throw err;
					else 
						pippo = shortener; 
		});
	} else {
		LY_NODE.createShortener(4, LY_NODE.RFC_ALLOWED_CHARACTERS, 
								undefined, undefined, "test", 
								function(err, shortener) { 
									if(err) 
										throw err;
									else 
										pippo = shortener; 
								});
	}});


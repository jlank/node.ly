/* node.ly
 * A library to implement your own URL shortener, inspired by Bit.ly 
 * (http://bit.ly), written in node.js (http://nodejs.org), by
 * Gianfranco Cecconi (giacecco@giacec.co.uk).
 */

var LY_NODE_SHORTENER = new require("./ly_node_common"); 
var SYS = require("sys");

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

// TODO: I should do some testing of writing and reading lots of URLs and check
// how speed goes
//var pippo = new LY_NODE_SHORTENER.shortener(4, LY_NODE_SHORTENER.RFC_ALLOWED_CHARACTERS, "test");
var pippo = new LY_NODE_SHORTENER.shortener("test");
//CreateRandomData(pippo, 100, 50);
pippo.CreateServer();

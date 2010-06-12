var FILESYS = require("fs");

exports.FileExistsSync = function(filename) {
	var fileExists = true;
	try {
		FILESYS.statSync(filename);
	} catch(e) {
		fileExists = false;
	};
	return fileExists;
};
	
exports.BaseConversion = function(baseSymbols) {
		
	// ToBase and FromBase simply convert a number from base 10 to any base
	// and vice versa. The alternative base is not defined by the number
	// of its symbols, but by the actual list of symbols (e.g. "012" for
	// base 2)
	var ToBase = function(n) {
		var toBase = BASE_SYMBOLS.length;
		for(var result = ""; n > 0; n = Math.floor(n / toBase)) 
			result = BASE_SYMBOLS[n % toBase] + result;
		return result;
	};
	
	// See "ToBase"
	var FromBase = function(s) {
		var result = 0;
		for(var x = 0; x < s.length; x ++) 
			result += BASE_SYMBOLS.indexOf(s[x]) * Math.pow(BASE_SYMBOLS.length, s.length - x - 1);
		return result;
	};

	// TODO: raise error if baseSymbols is undefined
	var BASE_SYMBOLS = baseSymbols;
	return {
		"ToBase": ToBase,
		"FromBase": FromBase
	};
	
};
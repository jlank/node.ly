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
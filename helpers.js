/*   
 * node.ly - A node.js library to implement your own URL shortener, 
 * inspired by Bit.ly 
 * Copyright (C) 2012 John Lancaster <john.k.lancaster@gmail.com>
 * http://github.com/jlank/node.ly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
module.exports = exports = helpers = function helper(cfg) {
  var chars  = cfg.chars || 'abc';
  var maxNum = cfg.maxNum || 0;
  var urlLen = cfg.urlLen || 100;

console.log(maxNum + ' ' + chars + ' ' + urlLen);
  var toStr = function(num) {
    if (num > maxNumber) {
      console.error("value is greater than maxNumber of URLs");
    }
    for (var result = ""; result.length < urlLength; result += characters[0]) {};
    result += toBase(num, characters);  
  
    return result.substr(result.length - urlLength, urlLength);
  };
  
  var toNumber = function(str) {
  
    return fromBase(str, chars);
  };
  
  var toBase = function(num, chars) {
  	var charsLength = chars.length;
  
  	for(var result = ""; num > 0; num = Math.floor(num / charsLength)) {
  		result = chars[num % charsLength] + result;
     }
  
  	return result;
  };
  
  var fromBase = function(str, chars) {
  	var result = 0;
  
  	for (var x = 0; x < str.length; x ++) {
  		result += chars.indexOf(str[x]) * Math.pow(chars.length, str.length - x - 1);
    }
  
  	return result;
  };
  exports.toStr = toStr;
  exports.toNumber = toNumber;
  exports.toBase = toBase;
  exports.fromBase = fromBase;
}

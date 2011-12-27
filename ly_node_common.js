/*   
 * node.ly - A node.js library to implement your own URL shortener, 
 * inspired by Bit.ly 
 * Copyright (C) 2010 Gianfranco Cecconi <giacecco@giacec.co.uk>
 * http://github.com/giacecco/node.ly
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

var com_giacecco = require('./com_giacecco_tools')
  , check = require('validator').check
  , nano = require("nano")('http://localhost:5984')
  , uuid = require('node-uuid')
  , db_name = "dt"
  , db = nano.use(db_name);

exports.shorten = function(url) {

  // variables
  var fullURL = url
    , shortened_url_length = 7
    , allowed_characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$-_.+!*'(),"
    , max_encodable_number = Math.pow(allowed_characters.length, shortened_url_length)
    , nextID = 0;
  
  // Like ToBase / FromBase, where the base is the list of characters that 
  // are allowed in an URL
  var numberToShortString = function(num) {
    if(num > max_encodable_number)
      throw new Error("You attempted to convert to short string a number that is too big for encoding.");
    for(var result = ""; result.length < shortened_url_length; result += allowed_characters[0]) {};
    result += new com_giacecco.BaseConversion(allowed_characters).ToBase(num);  
    return result.substr(result.length - shortened_url_length, shortened_url_length);
  };
  
  // See numberToShortenedString
  var ShortStringToNumber = function(s) {
    return new com_giacecco.BaseConversion(allowed_characters).FromBase(s);
  };

  var ShortenSync = function(fullURL) {
    if(check(fullURL).isUrl())
      fullURL = "http://" + fullURL;
    var nextId
      , _id = uuid.v1()
      , shortURL
      , lastAccessed = (new Date()).valueOf();
    
    return db.view("lookup", "by_hash", { "key" : fullURL }, function(e,b,h) {
      if(e)
        throw new Error(e);
      if(b.rows.key) {
        // this link has been shortened before
        shortURL = b.rows.value;
      } else {
        // this link hasn't been shortened
        db.get("count", function(e,b,h) {
          if(e)
            console.error(e.stack);
          if(b.maxID === "undefined") {
            // no url has been shortened before, start at 0
            nextID = 0;
          } else {
            // get the most recent index, may be a race condition if 2 concurrent req's get the same #,
            // need to come up with a better way to get count, possibly with a map/reduce
            nextID = b.maxID;
            if(nextID < Math.pow(allowed_characters.length, shortened_url_length) - 1) {
              console.log(nextID);
              nextID++;
            } else {
              // here you can decide how to handle reaching the max, 
              // do you overwrite old ones? start over with a new db or domain?
              console.error("reached limit of URLs that can be shortened ");
            }
          }
        });
        shortURL = numberToShortString(nextID);
      }

      db.view("lookup", "by_hash", { "key" : shortURL }, function(e, b, h) {
        if(e)
          console.error(e.stack);
    console.log(b.rows);
        if(b.rows.length >= 0) {
          db.insert({ "id" : nextID, "short_url_hash" : shortURL, "url" : fullURL }, _id, function(e,b,h) {
            if(e)
              throw new Error(e);
            // if we successfully update the db, return with the shortURL
            return shortURL;
          });
        } else {
        console.log('here');
          // how to handle maxID? 
        }
      });
    });
  };
  
  var RetrieveSync = function(shortURL) {
    //var lastAccessed = (new Date()).valueOf();
    return db.view("lookup", "by_hash", { "key" : shortURL }, function(e,b,h) {
      if(e)
        throw new Error(e)
      if(!b.rows.key[shortURL]) {
        return null;
      } else {
       return b.rows.value;
      }
    });
  };
  
  // the actual constructor instructions start here
  switch(arguments.length) {
  
  case 1: // the user's trying to open an existing file
    ShortenSync(arguments[0]);    
    break;
    
  case 3: // the user's trying to create a new file
        
    break;
    
  default: // wrong number of parameters in the constructor
    
    throw new Error("You are trying to create a shortener object with the wrong number of parameters.");
    
  };

  return {
    "shortened_url_length"   : function() { return shortened_url_length; }(),
    "allowed_characters"     : function() { return allowed_characters; }(),
    "ShortenSync"            : ShortenSync,
    "RetrieveSync"           : RetrieveSync
  };
};



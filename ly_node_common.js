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
  if(check(url).isUrl()) {
    this.fullURL = url;
    this.shortURL = "";
    this.nextID = undefined;
    var shortened_url_length = 7
      , allowed_characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$-_.+!*'(),"
      , max_encodable_number = Math.pow(allowed_characters.length, shortened_url_length);
  }
  
  // Like ToBase / FromBase, where the base is the list of characters that are allowed in an URL
  var toShort = function(num) {
    if(num > max_encodable_number)
      console.error("You attempted to convert to short string a number that is too big for encoding.");
    for(var result = ""; result.length < shortened_url_length; result += allowed_characters[0]) {};
    result += new com_giacecco.BaseConversion(allowed_characters).ToBase(num);  
    return result.substr(result.length - shortened_url_length, shortened_url_length);
  };
  
  // See numberToShortenedString
  var ShortStringToNumber = function(s) {
    return new com_giacecco.BaseConversion(allowed_characters).FromBase(s);
  };

  var ShortenSync = function(fullURL) {
    var _id = uuid.v1()
      , _rev = ""
      , lastAccessed = (new Date()).valueOf();
    
    db.view("lookup", "by_url", { "key" : fullURL }, function(e,b,h) {
      if(e)
        console.error(e);
      if(b.rows[0] !== undefined && b.rows[0].key === fullURL) {
        // this link has been shortened before
        // increment some counter if you want to see how many accesses it has had
        shortURL = b.rows[0].value;
        console.log('been here, done that');
        return shortURL;
      } else {
        // this link hasn't been shortened
        db.get("count", function(e,b,h) {
          if(e)
            console.error(e);
          if(b.maxID === undefined) {
            // no db count has been set up
          } else {
            // get the most recent index, may be a race condition if 2 concurrent req's get the same #,
            // need to come up with a better way to get count, possibly with a map/reduce
            nextID = b.maxID;
            _rev = b._rev;

            if(nextID > Math.pow(allowed_characters.length, shortened_url_length) - 1) {
              // here you can decide how to handle reaching the max, 
              // do you overwrite old ones? start over with a new db or domain?
              console.error("reached limit of URLs that can be shortened");
            }
          }

          this.shortURL = toShort(nextID);
console.log(this.shortURL);
console.log(toShort(nextID));

          db.view("lookup", "by_hash", { "key" : toShort(nextID) }, function(e, b, h) {
            if(e)
              console.error(e);
            // TODO: fix this, should check max id number
            // console.log(b.rows.length);
            if(b.rows.length >= 0) {
              db.insert({ "id" : nextID, "short_url_hash" : shortURL, "url" : fullURL }, _id, function(e,b,h) {
                if(e)
                  console.error(e);
                // if we successfully update the db, return with the shortURL
              });
              nextID = nextID + 1;
              db.insert({ "_rev" : _rev, "maxID" : nextID }, "count", function(e,b,h) {
                if(e)
                  console.error(e); 
                return shortURL;
              });
            } else {
              console.error('maxed out IDs, whoa');
              // how to handle maxID? 
            }
          });
        });
      }
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
    "fullURL"            : this.fullURL,
    "shortURL"           : this.shortURL,
    "URLCount"           : this.nextID
  };
};



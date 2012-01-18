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

var check = require('validator').check
  , nano = require("nano")('http://localhost:5984')
  , uuid = require('node-uuid')
  , db_name = "dt"
  , db = nano.use(db_name)
  , urlLength = 7
  , characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$-_.+!*'(),"
  , maxNumber = Math.pow(characters.length, urlLength)
  , helpers = require('./helpers')({chars : characters, maxNum : maxNumber, urlLen : urlLength});

var shorten = function(url) {
  if (check(url).isUrl()) {
    var fullURL = url
      , shortURL = ""
      , nextID = undefined;
  }

  var ShortenSync = function(fullURL) {
    console.log(fullURL);
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
            console.error('no db count');
          } else {
            // get the most recent index, may be a race condition if 2 concurrent req's get the same #,
            nextID = b.maxID;
            _rev = b._rev;

            if(nextID > Math.pow(characters.length, urlLength) - 1) {
              // here you can decide how to handle reaching the max, 
              // do you overwrite old ones? start over with a new db or domain?
              console.error("reached limit of URLs that can be shortened");
            }
            else {
              shortURL = helpers.toStr(nextID);
            }
          }

          db.view("lookup", "by_hash", { "key" : helpers.toStr(nextID) }, function(e, b, h) {
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
    return {
      "fullURL"  : fullURL,
      "shortURL" : shortURL,
      "URLCount" : nextID
    }
  };

  ShortenSync(fullURL); 

};

var lookup = function(shortURL) {
  return db.view("lookup", "by_hash", { "key" : shortURL }, function(e,b,h) {
    if (e)
      throw new Error(e)
    if (!b.total_rows > 0) {
      return null;
    } 
    else {
      console.log(b.rows[0].value);
      return b.rows[0].value;
    }
  });
};
 
exports.shorten = shorten;
exports.lookup = lookup;

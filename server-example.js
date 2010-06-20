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

// Starts a basic web site to access the shortener on port 8000,
// unless a different HTTP port is specified. Returns the port
// number.
var CreateServer = function(shortener, port) {
	var HTTP = require('http');
	port = port || 8000;
	HTTP.createServer(function (request, response) {
		require("./com_giacecco_tools").SwitchRegExp(require('url').parse(request.url)['href'], [

            // The web browser is requesting to resolve a short URL.
			[ new RegExp("^\/(.{" + shortener.SHORTENED_URL_LENGTH + "})$") , function(matches) { 
				// There is a very interesting article about the choice of		                                                                             
				// the actual HTTP return code at 
				// http://www.google.com/buzz/dclinton/JKoWPTAAyvw/More-thoughts-on-URL-shorteners-This-post-explores
				response.writeHead(302, { 
					'Content-Type': 'text/plain', 
					'Location' : shortener.RetrieveSync(matches[1]) // careful here, matches[0] is the whole URL, not the parenthesised expressions!
				});
				response.end();
			}],

			// This is the shortest form to request node.ly to shorten an 
			// URL, to be used as if it was an API 
			[ /^\/shorten\?URL=(.*)$/ , function(matches) {
				response.writeHead(200, {'Content-Type': 'text/plain'});
				response.end(shortener.ShortenSync(matches[1]));						
			}], 

			// everything else
			[ /^\/.*/ , function() {
				response.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
				response.end(require("fs").readFileSync("server-example.html"));
			}]
			
		]);
	}).listen(port);
	return port;
};

var SYS = require("sys");
var LY_NODE = new require("./ly_node_common"); 
var databaseName = "test";
LY_NODE.databaseExists(undefined, undefined, databaseName, 
	function(err, dbExists) {
		if(dbExists) {
			LY_NODE.createShortener(undefined, undefined, "test",
									function(err, s) { 
										if(err) 
											throw err;
										else 
											SYS.puts("Starting server on port " + CreateServer(s, 8000) + "...");
									});
		} else {
			LY_NODE.createShortener(4, LY_NODE.RFC_ALLOWED_CHARACTERS, 
									undefined, undefined, "test", 
									function(err, s) { 
										if(err) 
											throw err;
										else 
											SYS.puts("Starting server on port " + CreateServer(s, 8000) + "...");
									});
		};
	});

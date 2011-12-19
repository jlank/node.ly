var nano = require('nano')('http://localhost:5984')
  , db_name = "dt"
  , db = nano.use(db_name);


db.view("lookup", "hash", { "key" : "hashash" }, function(e,b,h) {
  if(e)
    throw new Error(e)
  console.log(b);
});


/*var COM_GIACECCO_TOOLS = require('./com_giacecco_tools');

var SHORTENED_URL_LENGTH = 4
  , ALLOWED_CHARACTERS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$-_.+!*'(),"
  , MAX_ENCODABLE_NUMBER = Math.pow(ALLOWED_CHARACTERS.length, SHORTENED_URL_LENGTH);
 
  // Like ToBase / FromBase, where the base is the list of characters that 
  // are allowed in an URL
  var numberToShortString = function(num) {
    if(num > MAX_ENCODABLE_NUMBER)
      throw new Error("You attempted to convert to short string a number that is too big for encoding.");
    for(var result = ""; result.length < SHORTENED_URL_LENGTH; result += ALLOWED_CHARACTERS[0]) {};
    result += new COM_GIACECCO_TOOLS.BaseConversion(ALLOWED_CHARACTERS).ToBase(num);
    console.log(MAX_ENCODABLE_NUMBER);
    console.log(result);
    console.log(result.substr(result.length - SHORTENED_URL_LENGTH, SHORTENED_URL_LENGTH));
    return result.substr(result.length - SHORTENED_URL_LENGTH, SHORTENED_URL_LENGTH);
  };

numberToShortString(102983);
*/

/**
 * Very basic NEXUS parser
 *
 * Supports TREES block
 *
 */

//--------------------------------------------------------------------------------------------------
// http://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript
function isNumber (o) {
  return ! isNaN (o-0);
}

//--------------------------------------------------------------------------------------------------
//https://raw.github.com/kvz/phpjs/master/functions/strings/strstr.js
function strstr (haystack, needle, bool) {
  // http://kevin.vanzonneveld.net
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Onno Marsman
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // *     example 1: strstr('Kevin van Zonneveld', 'van');
  // *     returns 1: 'van Zonneveld'
  // *     example 2: strstr('Kevin van Zonneveld', 'van', true);
  // *     returns 2: 'Kevin '
  // *     example 3: strstr('name@example.com', '@');
  // *     returns 3: '@example.com'
  // *     example 4: strstr('name@example.com', '@', true);
  // *     returns 4: 'name'
  var pos = 0;

  haystack += '';
  pos = haystack.indexOf(needle);
  if (pos == -1) {
    return false;
  } else {
    if (bool) {
      return haystack.substr(0, pos);
    } else {
      return haystack.slice(pos);
    }
  }
}

//--------------------------------------------------------------------------------------------------
// https://github.com/kvz/phpjs/blob/master/functions/strings/strchr.js
function strchr (haystack, needle, bool) {
  // http://kevin.vanzonneveld.net
  // +   original by: Philip Peterson
  // -    depends on: strstr
  // *     example 1: strchr('Kevin van Zonneveld', 'van');
  // *     returns 1: 'van Zonneveld'
  // *     example 2: strchr('Kevin van Zonneveld', 'van', true);
  // *     returns 2: 'Kevin '
  return strstr(haystack, needle, bool);
}

var NEXUSPunctuation = "()[]{}/\\,;:=*'\"`+-";
var NEXUSWhiteSpace  = "\n\r\t ";

//--------------------------------------------------------------------------------------------------
function TokenTypes(){}
TokenTypes.None     = 0;
TokenTypes.String     = 1;
TokenTypes.Hash     = 2;
TokenTypes.Number     = 3;
TokenTypes.SemiColon  = 4;
TokenTypes.OpenPar    = 5;
TokenTypes.ClosePar   = 6;
TokenTypes.Equals     = 7;
TokenTypes.Space    = 8;
TokenTypes.Comma      = 9;
TokenTypes.Asterix    = 10;
TokenTypes.Colon    = 11;
TokenTypes.Other    = 12;
TokenTypes.Bad      = 13;
TokenTypes.Minus    = 14;
TokenTypes.DoubleQuote  = 15;
TokenTypes.Period     = 16;
TokenTypes.Backslash  = 17;
TokenTypes.QuotedString = 18;
TokenTypes.Comment = 19;

//--------------------------------------------------------------------------------------------------
function NumberTokens(){}
NumberTokens.start    = 0;
NumberTokens.sign     = 1;
NumberTokens.digit    = 2;
NumberTokens.fraction   = 3;
NumberTokens.expsymbol  = 4;
NumberTokens.expsign  = 5;
NumberTokens.exponent   = 6;
NumberTokens.bad    = 7;
NumberTokens.done     = 8;

//--------------------------------------------------------------------------------------------------
function StringTokens(){}
StringTokens.ok     = 0;
StringTokens.quote    = 1;
StringTokens.done     = 2;

//--------------------------------------------------------------------------------------------------
function NexusParseError(){}
NexusParseError.ok       = 0;
NexusParseError.nobegin    = 1;
NexusParseError.noend    = 2;
NexusParseError.syntax     = 3;
NexusParseError.badcommand   = 4;
NexusParseError.noblockname  = 5;
NexusParseError.badblock   = 6;
NexusParseError.nosemicolon  = 7;
NexusParseError.notnexus  = 8;

//--------------------------------------------------------------------------------------------------
function NexusParseErrorHumanized(err){
  switch (err) {
    case NexusParseError.ok:
      return "ok"
    case NexusParseError.nobegin:
      return "problem with begin block"
    case NexusParseError.noend:
      return "problem with end block"
    case NexusParseError.syntax:
      return "syntax error"
    case NexusParseError.badcommand:
      return "bad command"
    case NexusParseError.noblockname:
      return "block name doesn't exist"
    case NexusParseError.badblock:
      return "bad block"
    case NexusParseError.nosemicolon:
      return "no semicolon"
    case NexusParseError.notnexus:
      return "not a nexus file"
  }
}


//--------------------------------------------------------------------------------------------------
function Scanner(str)
{
  this.error = 0;
  this.comment = '';
  this.pos = 0;
  this.str = str;
  this.token = 0;
  this.buffer = '';
  this.returnspace = false;
}

//----------------------------------------------------------------------------------------------
Scanner.prototype.GetToken = function(returnspace)
{
  this.returnspace = typeof returnspace !== 'undefined' ? returnspace : false;

  this.token = TokenTypes.None;
  while ((this.token == TokenTypes.None) && (this.pos < this.str.length))
  {

    if (strchr(NEXUSWhiteSpace, this.str.charAt(this.pos)))
    {
      if (this.returnspace && (this.str.charAt(this.pos) == ' '))
      {
        this.token = TokenTypes.Space;
      }
    }
    else
    {
      if (strchr(NEXUSPunctuation, this.str.charAt(this.pos)))
      {
        this.buffer = this.str.charAt(this.pos);
        switch (this.str.charAt(this.pos))
        {
          case '[':
            var comment = this.ParseComment();
            this.token = TokenTypes.Comment;
            break;
          case "'":
            if (this.ParseString())
            {
              this.token = TokenTypes.QuotedString;
            }
            else
            {
              this.token = TokenTypes.Bad;
            }
            break;
          case '(':
            this.token = TokenTypes.OpenPar;
            break;
          case ')':
            this.token = TokenTypes.ClosePar;
            break;
          case '=':
            this.token = TokenTypes.Equals;
            break;
          case ';':
            this.token = TokenTypes.SemiColon;
            break;
          case ',':
            this.token = TokenTypes.Comma;
            break;
          case '*':
            this.token = TokenTypes.Asterix;
            break;
          case ':':
            this.token = TokenTypes.Colon;
            break;
          case '-':
            this.token = TokenTypes.Minus;
            break;
          case '"':
            this.token = TokenTypes.DoubleQuote;
            break;
          case '/':
            this.token = TokenTypes.BackSlash;
            break;
          default:
            this.token = TokenTypes.Other;
            break;
        }
      }
      else
      {
        if (this.str.charAt(this.pos) == '#')
        {
          this.token = TokenTypes.Hash;
        }
        else if (this.str.charAt(this.pos) == '.')
        {
          this.token = TokenTypes.Period;
        }
        else
        {
          if (isNumber(this.str.charAt(this.pos)))
          {
            if (this.ParseToken()) {
              if (/^([-+]?\d*\.?\d+)(?:[eE]([-+]?\d+))?$/.test(this.buffer)) {
                this.token = TokenTypes.Number;
              } else {
                this.token = TokenTypes.String;
              }
            } else {
              this.token = TokenTypes.Bad;
            }
          }
          else
          {
            if (this.ParseToken())
            {
              this.token = TokenTypes.String;
            }
            else
            {
              this.token = TokenTypes.Bad;
            }
          }
        }
      }
    }
    this.pos++;
  }

  return this.token;
}

//----------------------------------------------------------------------------------------------
Scanner.prototype.ParseComment = function()
{
  this.buffer = '';

  while ((this.str.charAt(this.pos) != ']') && (this.pos < this.str.length))
  {
    this.buffer += this.str.charAt(this.pos);
    this.pos++;
  }
  this.buffer += this.str.charAt(this.pos);

  return this.buffer;
}

//----------------------------------------------------------------------------------------------
// we don't use it in Taxus, parsing as string instead
Scanner.prototype.ParseNumber = function()
{
  this.buffer = '';
  var state = NumberTokens.start;

  while (
    (this.pos < this.str.length)
    && (!strchr (NEXUSWhiteSpace, this.str.charAt(this.pos)))
    && (!strchr (NEXUSPunctuation, this.str.charAt(this.pos)))
    && (this.str.charAt(this.pos) != '-')
    && (state != NumberTokens.bad)
    && (state != NumberTokens.done)
    )
  {
    if (isNumber(this.str.charAt(this.pos)))
    {
      switch (state)
      {
        case NumberTokens.start:
        case NumberTokens.sign:
          state =  NumberTokens.digit;
          break;
        case NumberTokens.expsymbol:
        case NumberTokens.expsign:
          state =  NumberTokens.exponent;
          break;
        default:
          break;
      }
    }
    else if ((this.str.charAt(this.pos) == '-') && (this.str.charAt(this.pos) == '+'))
    {
      switch (state)
      {
        case NumberTokens.start:
          state = NumberTokens.sign;
          break;
        case NumberTokens.digit:
          state = NumberTokens.done;
          break;
        case NumberTokens.expsymbol:
          state = NumberTokens.expsign;
          break;
        default:
          state = NumberTokens.bad;
          break;
      }
    }
    else if ((this.str.charAt(this.pos) == '.') && (state == NumberTokens.digit))
    {
      state = NumberTokens.fraction;
    }
    else if (((this.str.charAt(this.pos) == 'E') || (this.str.charAt(this.pos) == 'e')) && ((state == NumberTokens.digit) || (state == NumberTokens.fraction)))
    {
      state = NumberTokens.expsymbol;
    }
    else
    {
      state = NumberTokens.bad;
    }

    if ((state != NumberTokens.bad) && (state != NumberTokens.done))
    {
      this.buffer += this.str.charAt(this.pos);
      this.pos++;
    }
  }
  this.pos--;

  return true;
}

//----------------------------------------------------------------------------------------------
Scanner.prototype.ParseString = function()
{
  this.buffer = '';

  this.pos++;

  var state = StringTokens.ok;
  while ((state != StringTokens.done) && (this.pos < this.str.length))
  {
    //console.log(this.pos + ' ' + this.str.charAt(this.pos));
    switch (state)
    {
      case StringTokens.ok:
        if (this.str.charAt(this.pos) == "'")
        {
          state = StringTokens.quote;
        }
        else
        {
          this.buffer += this.str.charAt(this.pos);
        }
        break;

      case StringTokens.quote:
        if (this.str.charAt(this.pos) == "'")
        {
          this.buffer += this.str.charAt(this.pos);
          state = StringTokens.ok;
        }
        else
        {
          state = StringTokens.done;
          this.pos--;
        }
        break;

      default:
        break;
    }
    this.pos++;
  }
  this.pos--;

  return (state == StringTokens.done) ? true : false;
}

//----------------------------------------------------------------------------------------------
Scanner.prototype.ParseToken = function()
{
  this.buffer = '';

  while (
    this.pos < this.str.length
    && (!strchr (NEXUSWhiteSpace, this.str.charAt(this.pos)))
      && (!strchr (NEXUSPunctuation, this.str.charAt(this.pos)))
      )
    {
      this.buffer += this.str.charAt(this.pos);
      this.pos++;
    }
  this.pos--;

  return true;
}

//--------------------------------------------------------------------------------------------------
NexusReader.prototype = new Scanner;

//----------------------------------------------------------------------------------------------
function NexusReader()
{
  Scanner.apply(this, arguments);

  this.nexusCommands = ['begin', 'dimensions', 'end', 'endblock', 'link', 'taxa', 'taxlabels', 'title', 'translate', 'tree', 'set'];
  this.nexusBlocks = ['taxa', 'trees', 'taxus'];
};

//----------------------------------------------------------------------------------------------
NexusReader.prototype.GetBlock = function()
{
  var blockname = '';

  var command = this.GetCommand();

  if (command.toLowerCase() != 'begin')
  {
    this.error = NexusParseError.nobegin;
  }
  else
  {
    // get block name
    var t = this.GetToken();

    if (t == TokenTypes.String)
    {
      blockname = this.buffer.toLowerCase();
      t = this.GetToken();
      if (t != TokenTypes.SemiColon)
      {
        this.error = NexusParseError.noblockname;
      }
    }
    else
    {
      this.error = NexusParseError.noblockname;
    }

  }
  return blockname.toLowerCase();
}

//----------------------------------------------------------------------------------------------
NexusReader.prototype.GetCommand = function()
{
  var command = '';

  var t = this.GetToken();

  while (t === TokenTypes.Comment) {
    t = this.GetToken();
  }

  if (t == TokenTypes.String)
  {
    if (this.nexusCommands.indexOf(this.buffer.toLowerCase()) != -1)
    {
      command = this.buffer.toLowerCase();
    }
    else
    {
      this.error = NexusParseError.badcommand;
    }
  }
  else
  {
    this.error = NexusParseError.syntax;
  }
  return command.toLowerCase();
}

//----------------------------------------------------------------------------------------------
NexusReader.prototype.IsNexusFile = function()
{
  this.error = NexusParseError.ok;

  var nexus = false;
  var t = this.GetToken();
  if (t == TokenTypes.Hash)
  {
    t = this.GetToken();
    if (t == TokenTypes.String)
    {
      nexus = ( this.buffer.toLowerCase() == 'nexus') ? true : false;
    }
  }
  return nexus;
}

//----------------------------------------------------------------------------------------------
NexusReader.prototype.SkipCommand = function()
{
  var t = null;
  do {
    t = this.GetToken();
  } while ((this.error == NexusParseError.ok) && (t != TokenTypes.SemiColon));
  return this.error;
}

//--------------------------------------------------------------------------------------------------
function parseNexus(str)
{
  var nexus = {};

  nexus.status = NexusParseError.ok;

  var nx = new NexusReader(str);

  if (!nx.IsNexusFile())
  {
    nexus.status = NexusParseError.notnexus;
    return nexus;
  }

  var blockname = nx.GetBlock();

  var last_error = NexusParseError.ok;

  while(blockname != ""){

    if (blockname == 'taxa')
    {
      var command = nx.GetCommand();

      while (
        (command != 'end')
        && (command != 'endblock')
        && (nx.error == NexusParseError.ok)
        )
      {
        switch (command)
        {
          case 'taxlabels':
            // nx.SkipCommand();
            var labels = [];

            var t = nx.GetToken();

            while (t != TokenTypes.SemiColon) {
              if (t === TokenTypes.Comment) {
                labels[labels.length-1] += nx.buffer;
              } else {
                labels.push(nx.buffer);
              }

              t = nx.GetToken();
            }

            nexus.taxablock = {}
            nexus.taxablock.taxlabels = labels

            command = nx.GetCommand();

            break;

          default:
            nx.SkipCommand();
            command = nx.GetCommand();
            break;
        }

        // If end command eat the semicolon
        if ((command == 'end') || (command == 'endblock'))
        {
          nx.GetToken();
        }
      }

      // blockname = nx.GetBlock();
    } else if (blockname == 'trees')
    {
      nexus.treesblock = {}
      nexus.treesblock.trees = [];

      command = nx.GetCommand();

      while (
        ((command != 'end') && (command != 'endblock'))
        && (nx.error == NexusParseError.ok)
        )
      {
        switch (command)
        {
          case 'translate':

            // translation table is an associative array
            nexus.treesblock.translate = {};

            var done = false;
            while (!done && (nx.error == NexusParseError.ok))
            {
              // get index of taxa
              var t = nx.GetToken();

              if ([TokenTypes.Number, TokenTypes.String, TokenTypes.QuotedString].indexOf(t) != -1)
              {
                var otu = nx.buffer;

                // get taxa name
                t = nx.GetToken();

                if ([TokenTypes.Number, TokenTypes.String, TokenTypes.QuotedString].indexOf(t) != -1)
                {
                  // cast otu to string
                  nexus.treesblock.translate[String(otu)] = nx.buffer;

                  //console.log(otu + ' ' + nx.buffer);

                  t = nx.GetToken();
                  switch (t)
                  {
                    case TokenTypes.Comma:
                      break;

                    case TokenTypes.SemiColon:
                      done = true;
                      break;

                    default:
                      nx.error = NexusParseError.syntax;
                      break;
                  }
                }
                else
                {
                  nx.error = NexusParseError.syntax;
                }
              }
              else
              {
                nx.error = NexusParseError.syntax;
              }
            }

            command = nx.GetCommand();
            break;

          case 'tree':
            if (command == 'tree')
            {
              var tree = {};

              t = nx.GetToken();
              if (t == TokenTypes.Asterix)
              {
                tree.default = true;
                t = nx.GetToken();
              }
              if (t == TokenTypes.String)
              {
                tree.label = nx.buffer;
              }
              t = nx.GetToken();
              if (t == TokenTypes.Equals)
              {
                tree.newick = '';
                t = nx.GetToken();
                while (t != TokenTypes.SemiColon)
                {
                  if (t == TokenTypes.QuotedString)
                  {
                    var s = nx.buffer;
                    s = s.replace("'", "''");
                    s = "'" + s + "'";
                    tree.newick += s;
                  }
                  else
                  {
                    tree.newick += nx.buffer;
                  }
                  t = nx.GetToken();
                }
                tree.newick += ';';

                nexus.treesblock.trees.push(tree);
              }

            }
            command = nx.GetCommand();
            break;

          default:
            //echo "Command to skip: $command\n";
            nx.SkipCommand();
            command = nx.GetCommand();
            break;
        }

        // If end command eat the semicolon
        if ((command == 'end') || (command == 'endblock'))
        {
          nx.GetToken();
        }


      }

      // blockname = nx.GetBlock();
    } else if (blockname == 'taxus')
    {
      nexus.taxus = {}

      var command = nx.GetCommand();
      var counter = 0;

      while (
        (command != 'end')
        && (command != 'endblock')
        && (nx.error == NexusParseError.ok)
        )
      {

        switch (command)
        {
          case 'set':
            var key = "";
            var value = "";

            var t = nx.GetToken();

            // key="some value"
            // key
            if (t == TokenTypes.QuotedString || t == TokenTypes.String){
              key = nx.buffer;
            } else {
              nx.error = NexusParseError.syntax;
              break;
            }

            // =
            t = nx.GetToken();

            if (t != TokenTypes.Equals){
              nx.error = NexusParseError.syntax;
              break;
            }

            t = nx.GetToken();

            while (t != TokenTypes.SemiColon){
              if ([TokenTypes.DoubleQuote].indexOf(t) == -1){
                value += nx.buffer;
              }

              t = nx.GetToken();
            }

            nexus.taxus[key] = value;

            command = nx.GetCommand();
            break;

          default:
            nx.SkipCommand();
            command = nx.GetCommand();
            break;
        }

        if (counter >= 128){
          endNotFounds = true;
          break;
        }
        counter += 1;

        if ((command == 'end') || (command == 'endblock'))
        {
          nx.GetToken();
        }
      }
    } else {
      var command = null;
      var counter = 0;
      var endNotFound = false;

      while ((command != 'end') && (command != 'endblock')) {
        command = nx.GetCommand();

        if ((command != 'end') && (command != 'endblock')){
          nx.error = NexusParseError.ok;
          nx.SkipCommand();
        } else
          nx.GetToken();

        if (counter >= 128){
          endNotFounds = true;
          break;
        }
        counter += 1;
      }

      nx.error = endNotFound ? NexusParseError.badblock : NexusParseError.ok;
    }

    last_error = nx.error;
    blockname = nx.GetBlock()
  }

  if (nx.error == NexusParseError.nobegin)
    nx.error = last_error;

  nexus.status = nx.error;

  return nexus;
}


function taxusToNexus(taxus) {
  nexus = {}

  nexus.status = 0
  nexus.taxablock = {}
  nexus.taxablock.taxlabels = []

  let leaves = taxus.getLeaves().sort()

  leaves.forEach((l) => {
    nexus.taxablock.taxlabels.push(l.name)
  })

  nexus.treesblock = {}
  nexus.treesblock.trees = []

  let tree = {}
  tree.label = 'tree'
  tree.newick = taxus.getTree().to_taxus_newick(true)
  nexus.treesblock.trees.push(tree)

  nexus.taxus = taxus.metadataFromCurrentState()

  return nexus

}


function nexusToString(nexus) {

}

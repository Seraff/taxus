const nexus = require('./nexus.js');

function NexusRepresentation(str){
  this.parsed = nexus.parse(str);

  this.is_success = function(){
    return this.parsed.status === nexus.NexusError.ok;
  }

  this.get_newick = function(){
    if (this.is_success()){
      return this.parsed.treesblock.trees[0].newick.match(/\(.+\)/)[0];
    } else {
      return false;
    }
  }
}

module.exports = NexusRepresentation;

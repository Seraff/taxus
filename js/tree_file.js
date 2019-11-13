const fs = require('fs');
const NexusRepresentation = require('./nexus_representation.js');

function TreeFile(path){
  file = this

  file.path = path;
  file.is_nexus = false;
  file.original_content = null;
  file.newick = null;
  file.nexus_rep = null

  read();

  function read(){
    file.original_content = fs.readFileSync(path, 'utf8');
    file.newick = file.original_content.match(/\(.+\)/)[0];

    file.nexus_rep = new NexusRepresentation(file.original_content);
    file.is_nexus = file.nexus_rep.is_success();
  }

  file.write = function(path, new_newick){
    var data = file.original_content.replace(file.newick, new_newick);
    fs.writeFileSync(path, data, 'utf8');
  }
}

module.exports = TreeFile;

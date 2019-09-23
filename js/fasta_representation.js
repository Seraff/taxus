var Fasta = require('bionode-fasta')
const fs = require('fs');
const p = require('path');
/**
 * FastaRepresentation class doesn't know anything about Fangorn
 * Stores fasta sequence
 */

function FastaRepresentation(path){
  var fasta = this;
  var _path = path;

  fasta.sequences = {};

  fasta._path = path;
  fasta._src_filename = p.posix.basename(path);

  f_name_array = fasta._src_filename.split('.')
  f_name_array.splice(f_name_array.length - 1, 0, 'fangorn');

  fasta._out_filename = f_name_array.join('.')
  fasta.out_path = p.join(p.dirname(path), fasta._out_filename)

  fasta.read_from_file = function(callback){
    try {
      Fasta.obj(_path)
        .on('data', function(data) {
          id = data.id.split(/\s/)[0];
          data.title = data.id;
          data.id = id
          fasta.sequences[id] = data;
        }).on('end', callback);
    } catch(err) {
      console.error(err);
      return false;
    }
    return true;
  }

  // Checks if fasta is compatible for the names provided
  // returns true if fasta is compatible with tree
  // returns object { not_in_fasta: [...], not_in_tree: [...] } if problems found
  fasta.check_consistency = function(leave_ids){

    var not_in_fasta = [];
    var not_in_tree = [];

    var fasta_ids = Object.values(fasta.sequences).map(function(e){ return e.id })

    fasta_ids.forEach(function(id){
      if (!(leave_ids.includes(id))){
        not_in_tree.push(id);
      }
    });

    leave_ids.forEach(function(id){
      if (!(fasta_ids.includes(id))){
        not_in_fasta.push(id);
      }
    });

    if (not_in_tree.length != 0 || not_in_fasta.length != 0){
      return {  not_in_tree: not_in_tree, not_in_fasta: not_in_fasta };
    }

    return true;
  }

  fasta.each_sequence = function(f){
    for (var k in fasta.sequences){
      if (fasta.sequences.hasOwnProperty(k)) {
        f(fasta.sequences[k]);
      }
    }
  }
}

FastaRepresentation.extract_id = function(title){
  return title.split(/\s/)[0]
}


module.exports = FastaRepresentation;

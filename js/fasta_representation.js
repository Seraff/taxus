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

  fasta.read_from_file = function(path){
    try {
      Fasta.obj(path)
        .on('data', function(data) {
          id = data.id.split(/\s/)[0];
          data.title = data.id;
          data.id = id
          fasta.sequences[id] = data;
        }).on('end', function(){
          var event = new Event('loaded');
          fasta.dispatchEvent(event);
        });
    } catch(err) {
      console.error(err);
      return false;
    }
    return true;
  }

  fasta.check_consistency = function(ids){
    if (ids.length != Object.keys(fasta.sequences).length){
      return false;
    }

    ids.forEach(function(id){
      if (!fasta.sequences.hasOwnProperty(id))
        return false;
    })

    return true;
  }

  fasta.each_sequence = function(f){
    for (var k in fasta.sequences){
      if (fasta.sequences.hasOwnProperty(k)) {
        f(fasta.sequences[k]);
      }
    }
  }

  fasta.read_from_file(path);
  return fasta;
}

FastaRepresentation.extract_id = function(title){
  return title.split(/\s/)[0]
}


module.exports = FastaRepresentation;

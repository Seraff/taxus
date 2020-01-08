const parser = require('bio-parsers')
const fs = require('fs');
const p = require('path');
/**
 * FastaRepresentation class doesn't know anything about Fangorn
 * Stores fasta sequence
 */

function FastaRepresentation(){
  var fasta = this;

  fasta.sequences = {};
  fasta.original_str = null;
  fasta.path = null;
  fasta.out_path = null;

  fasta.read_from_file = function(path, callback){
    fasta.sequences = {}

    var str = fs.readFileSync(path, 'utf8')
    fasta.read_from_str(str, function(entries){
      fasta.path = path
      fasta.out_path = path_is_fangorized(path) ? path : fangorize_path(path)

      callback(entries)
    })
  }

  fasta.read_from_str = function(str, callback){
    fasta.sequences = {}

    fasta = parser.fastaToJson(str, function(json){
      json.forEach(function(el){
        var entry = new FastaEntry(el)
        fasta.sequences[entry.id] = entry;
      })

      fasta.original_str = str

      callback(fasta.sequences)
    });
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

function FastaEntry(json){
  var entry = this
  entry.json = json

  entry.original_title = json.parsedSequence.name
  entry.id = entry.original_title.split(/\s/)[0]
  entry.sequence = json.parsedSequence.sequence

  entry.to_fasta = function(){
    var content = '>' + entry.original_title + '\n'
    content += entry.sequence + '\n'
    return content
  }
}

module.exports = FastaRepresentation;

const fs = require('fs')
const p = require('path')
/**
 * FastaRepresentation class doesn't know anything about Fangorn
 * Parses fasta sequence
 * Stores each entry in object { "seq_id": FastaEntry, ... }
 */

function fasta_to_json(fasta_str){
  var json = []

  var fasta = fasta_str.split('>')
  fasta.shift()

  fasta.forEach(function(rec){
    var splitted = rec.trim().split('\n').map(function(el){ return el.trim() })

    var header = splitted[0]
    var id = splitted[0].split(/\s/)[0]
    splitted.shift()
    var seq = splitted.join('').toUpperCase()

    json.push({ header: header, id: id, sequence: seq })
  })

  return json
}

function FastaRepresentation(){
  var fasta = this

  fasta.sequences = {}
  fasta.original_str = null
  fasta.path = null
  fasta.out_path = null

  fasta.read_from_file = function(path, callback){
    fasta.sequences = {}

    var str = fs.readFileSync(path, 'utf8')
    fasta.read_from_str(str)
    fasta.path = path
    fasta.out_path = path_is_fangorized(path) ? path : fangorize_path(path)
  }

  fasta.read_from_str = function(str){
    fasta.sequences = {}

    var json = fasta_to_json(str)

    json.forEach(function(el){
      var entry = new FastaEntry(el)
      fasta.sequences[entry.id] = entry
    })

    fasta.original_str = str
  }

  // Checks if fasta is compatible for the names provided
  // returns true if fasta is compatible with tree
  // returns object { not_in_fasta: [...], not_in_tree: [...] } if problems found
  fasta.check_consistency = function(leave_ids){
    var result = { not_in_tree: [], not_in_fasta: [] }

    var fasta_ids = Object.values(fasta.sequences).map(function(e){ return e.id })

    fasta_ids.forEach(function(id){
      if (!(leave_ids.includes(id))){
        result.not_in_tree.push(id)
      }
    })

    leave_ids.forEach(function(id){
      if (!(fasta_ids.includes(id))){
        result.not_in_fasta.push(id)
      }
    })

    return result
  }

  fasta.each_sequence = function(f){
    for (var k in fasta.sequences){
      if (hasOwnProperty(fasta.sequences, k)) {
        f(fasta.sequences[k])
      }
    }
  }

  fasta.getIds = function () {
    return Object.keys(fasta.sequences)
  }
}

FastaRepresentation.extract_id = function(title){
  return title.split(/\s/)[0]
}

function FastaEntry(json){
  var entry = this
  entry.json = json

  entry.header = json.header
  entry.id = json.id
  entry.sequence = json.sequence

  entry.to_fasta = function(){
    var content = '>' + entry.header + '\n'
    content += entry.sequence + '\n'
    return content
  }
}

module.exports = FastaRepresentation

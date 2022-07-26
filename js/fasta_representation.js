/**
 * FastaRepresentation class doesn't know anything about Taxus
 * Parses fasta sequence
 * Stores each entry in object { "seq_id": FastaEntry, ... }
 */

class FastaRepresentation {
  constructor() {
    this.sequences = {}
    this.original_str = null
    this.path = null
    this.out_path = null
  }

  readFromFile(path, callback){
    window.api.loadFile(path).then(content => {
      this.readFromStr(content)
      this.path = path
      this.out_path = pathIsTaxusized(path) ? path : taxusizePath(path)
      callback()
    }, error => {
      console.error(error)
    })
  }

  readFromStr(str){
    this.sequences = {}

    var json = FastaRepresentation.fastaToJson(str)

    json.forEach((el) => {
      var entry = new FastaEntry(el)
      this.sequences[entry.id] = entry
    })

    this.original_str = str
  }

  // Checks if fasta is compatible for the names provided
  // returns true if fasta is compatible with tree
  // returns object { not_in_fasta: [...], not_in_tree: [...] } if problems found
  checkConsistency(leave_ids){
    var result = { not_in_tree: [], not_in_fasta: [] }

    // TODO smells bad!
    var fasta_ids = Object.values(this.sequences).map(function(e){ return e.id })

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

  eachSequence(f){
    for (var k in this.sequences){
      if (hasOwnProperty(this.sequences, k)) {
        f(this.sequences[k])
      }
    }
  }

  getIds(){
    return Object.keys(this.sequences)
  }

  getSeqs(){
    return Object.values(this.sequences)
  }

  static extract_id(title){
    return title.split(/\s/)[0]
  }

  static fastaToJson(fasta_str) {
    var json = []

    var fasta = fasta_str.split('>')
    fasta.shift()

    fasta.forEach(function (rec) {
      var splitted = rec.trim().split('\n').map(function (el) { return el.trim() })

      var header = splitted[0]
      var id = splitted[0].split(/\s/)[0]
      splitted.shift()
      var seq = splitted.join('').toUpperCase()

      json.push({ header: header, id: id, sequence: seq })
    })

    return json
  }
}

class FastaEntry {
  constructor(json){
    this.json = json

    this.header = json.header
    this.id = json.id
    this.sequence = json.sequence
  }

  toFasta(){
    var content = '>' + this.header + '\n'
    content += this.sequence + '\n'
    return content
  }
}

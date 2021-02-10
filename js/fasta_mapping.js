class FastaMapping {
  constructor (nodes, fastaRep) {
    this.nodes = nodes
    this.fastaRep = fastaRep

    this.nodes_by_name = {}
    this.nodes.forEach((n) => {
      this.nodes_by_name[n.name] = n
    })

    this.fasta_by_name = {}
    this.fastaRep.each_sequence((l) => {
      this.fasta_by_name[l.id] = l
    })

    this.mapping = {}

    var all_names = [...Object.keys(this.nodes_by_name), ...Object.keys(this.fasta_by_name)]
    _.uniq(all_names).forEach((name) => {
      this.mapping[name] = { node: null, fasta: null }

      if (hasOwnProperty(this.nodes_by_name, name)) {
        this.mapping[name].node = this.nodes_by_name[name]
      }

      if (hasOwnProperty(this.fasta_by_name, name)) {
        this.mapping[name].fasta = this.fasta_by_name[name]
      }
    })
  }

  eachMapping (f) {
    _.each(this.mapping, f)
  }

  nodesWithoutFasta () {
    var result = _.select(this.mapping, (m) => { return m.fasta === null} )
    return result.map((m) => { return m.node })
  }

  fastaWithoutNodes () {
    var result = _.select(this.mapping, (m) => { return m.node === null} )
    return result.map((m) => { return m.fasta })
  }

  getNodeForFasta (fasta) {
    return this.mapping[fasta.id].node
  }

  getFastaForNode (node) {
    return this.mapping[node.name].fasta
  }
}

module.exports = FastaMapping

class FastaMapping {
  constructor (nodes, fastas) {
    this.nodes = nodes
    this.fastas = fastas

    this.nodes_by_name = {}
    this.fasta_by_name = {}
    this.mapping = {}

    this.buildIndex()
  }

  buildIndex () {
    this.nodes_by_name = {}
    this.fasta_by_name = {}
    this.mapping = {}

    this.nodes.forEach((n) => {
      this.nodes_by_name[n.name] = n
    })

    this.fastas.forEach((f) => {
      this.fasta_by_name[f.id] = f
    })

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

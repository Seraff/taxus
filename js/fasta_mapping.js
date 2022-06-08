class FastaMapping {
  constructor (nodes, fastas) {
    this.nodes = nodes
    this.fastas = fastas

    this.buildIndex()
  }

  buildIndex() {
    this.nodes_by_name = {}
    this.fasta_by_name = {}
    this.mapping = []

    this.nodes.forEach((n) => {
      this.nodes_by_name[n.name] = n
    })

    this.fastas.forEach((f) => {
      this.fasta_by_name[f.id] = f
    })

    var all_names = [...Object.keys(this.nodes_by_name), ...Object.keys(this.fasta_by_name)]

    _.uniq(all_names).forEach((name) => {
      let new_mapping = { node: null, fasta: null }

      if (hasOwnProperty(this.nodes_by_name, name)) {
        new_mapping.node = this.nodes_by_name[name]
      }

      if (hasOwnProperty(this.fasta_by_name, name)) {
        new_mapping.fasta = this.fasta_by_name[name]
      }

      this.mapping.push(new_mapping)
    })
  }

  eachMapping(f) {
    this.mapping.forEach(f)
  }

  nodesWithoutFasta() {
    let result = []
    this.eachMapping((m) => {
      if (m.fasta === null)
        result.push(m)
    })
    return result.map((m) => { return m.node })
  }

  fastaWithoutNodes() {
    let result = []
    this.eachMapping((m) => {
      if (m.node === null)
        result.push(m)
    })
    return result.map((m) => { return m.fasta })
  }

  getNodeForFasta(fasta) {
    return this.nodes_by_name[fasta.id]
  }

  getFastaForNode(node) {
    return this.fasta_by_name[node.name]
  }
}

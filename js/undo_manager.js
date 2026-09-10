/**
 * Undo/redo support for the tree editing actions.
 *
 * The manager works with whole-state mementos: before running an action it
 * takes a snapshot of everything the editing actions can touch (topology,
 * branch lengths, names, annotations, marks, fasta headers and selection),
 * runs the action and takes a second snapshot of the result.
 * Undo re-applies the "before" snapshot, redo re-applies the "after" one.
 *
 * Snapshots keep references to the very same node objects, so restoring a
 * state also brings back the nodes an action has detached from the tree
 * (rerooting, for instance, drops the old root).
 */
class UndoManager {
  static MAX_ACTIONS = 15

  constructor (taxus) {
    this.taxus = taxus
    this.undo_stack = []
    this.redo_stack = []
  }

  /**
   * Runs the action and remembers how to undo it.
   *
   * The action is not put into the history if it returns false, which is the
   * way taxus actions report that nothing has been changed.
   */
  record (action) {
    if (!this.taxus.treeIsLoaded()) { return action() }

    let before = TreeState.capture(this.taxus)
    let result = action()

    if (result === false) { return result }

    this.undo_stack.push({ before: before, after: TreeState.capture(this.taxus) })

    if (this.undo_stack.length > UndoManager.MAX_ACTIONS) {
      this.undo_stack.shift()
    }

    this.redo_stack = []
    this.notify()

    return result
  }

  undo () {
    if (!this.canUndo()) { return false }

    let entry = this.undo_stack.pop()
    entry.before.restore(this.taxus)
    this.redo_stack.push(entry)
    this.notify()

    return true
  }

  redo () {
    if (!this.canRedo()) { return false }

    let entry = this.redo_stack.pop()
    entry.after.restore(this.taxus)
    this.undo_stack.push(entry)
    this.notify()

    return true
  }

  canUndo () {
    return this.undo_stack.length > 0
  }

  canRedo () {
    return this.redo_stack.length > 0
  }

  // Forgets the history, a new tree starts with an empty one
  reset () {
    this.undo_stack = []
    this.redo_stack = []
    this.notify()
  }

  notify () {
    dispatchDocumentEvent('taxus_state_update')
  }
}

/**
 * A snapshot of everything the undoable actions can modify.
 */
class TreeState {
  constructor (root, nodes) {
    this.root = root
    this.nodes = nodes
  }

  static capture (taxus) {
    let tree = taxus.getTree()
    let nodes = tree.get_nodes()

    // in cladogram view the tree reports no branch lengths at all
    let captureNodes = tree.withOriginalBranchLengths(() => {
      return nodes.map((node) => { return TreeState.captureNode(tree, node) })
    })

    return new TreeState(nodes[0], captureNodes())
  }

  static captureNode (tree, node) {
    let fasta = TreeState.fastaOf(node)

    return {
      node: node,
      parent: node.parent,
      children: node.children ? node.children.slice() : null,
      name: node.name,
      attribute: node.attribute,
      branch_length: tree.branch_length()(node),
      annotation: node.annotation,
      taxablock_annotation: node.taxablock_annotation,
      parsed_annotation: Object.assign({}, node.parsed_annotation),
      parsed_taxablock_annotation: Object.assign({}, node.parsed_taxablock_annotation),
      own_fasta: node.own_fasta,
      selected: node.selected === true,
      fasta: fasta,
      fasta_id: fasta ? fasta.id : null,
      fasta_header: fasta ? fasta.header : null
    }
  }

  static fastaOf (node) {
    let is_leaf = d3.layout.phylotree.is_leafnode(node)
    return (node.is_taxus_node && is_leaf) ? node.fasta() : null
  }

  static isMarked (parsed_annotation) {
    return parsed_annotation['!taxus_marked'] === true
  }

  restore (taxus) {
    let changes = { marks: false, titles: false }

    this.nodes.forEach((state) => {
      this.restoreNode(state, changes)
    })

    this.redraw(taxus, changes)
  }

  restoreNode (state, changes) {
    let node = state.node

    if (TreeState.isMarked(state.parsed_annotation) !== TreeState.isMarked(node.parsed_annotation)) {
      changes.marks = true
    }

    node.parent = state.parent

    if (state.children) {
      node.children = state.children.slice()
    } else {
      delete node.children
    }

    node.name = state.name

    // after a rerooting phylotree reads branch lengths from __mapped_bl
    // instead of the original `attribute` string, so both are restored
    node.attribute = state.attribute
    node.__mapped_bl = state.branch_length
    node.annotation = state.annotation
    node.taxablock_annotation = state.taxablock_annotation
    node.parsed_annotation = Object.assign({}, state.parsed_annotation)
    node.parsed_taxablock_annotation = Object.assign({}, state.parsed_taxablock_annotation)
    node.own_fasta = state.own_fasta
    node.selected = state.selected

    if (state.fasta) {
      if (state.fasta.id !== state.fasta_id || state.fasta.header !== state.fasta_header) {
        changes.titles = true
      }

      state.fasta.id = state.fasta_id
      state.fasta.header = state.fasta_header
    }
  }

  redraw (taxus, changes) {
    let tree = taxus.getTree()
    let fasta_is_loaded = taxus.fastaIsLoaded()

    if (changes.titles && fasta_is_loaded) {
      taxus.fastaMapping.buildIndex()
    }

    tree.update_layout(this.root, true)
    tree.safe_update()

    // nodes are styled through their branches, so they need a second pass
    taxus.reinitNodes()
    tree.safe_update()
    taxus.redrawFeatures()

    taxus.makeTreeDirty()
    if ((changes.marks || changes.titles) && fasta_is_loaded) {
      taxus.makeFastaDirty()
    }

    dispatchDocumentEvent('tree_topology_changed')
    if (changes.marks) { dispatchDocumentEvent('node_mark_status_changed') }
    if (changes.titles && fasta_is_loaded) { dispatchDocumentEvent('node_titles_changed') }

    tree.dispatch_selection_modified_event()
  }
}

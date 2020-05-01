const assert = require('assert')

describe('Fangorn', () => {

  var Fangorn = null

  before(function () {
    Fangorn = require('../js/fangorn.js')
    d3 = require('../js/vendor/d3.v3.min.js')
    require('../js/vendor/phylotree-src.js')
  })

  it('inits', () => {
    var fangorn = Fangorn()
  })

  it('opens nexus', () => {
    var fangorn = Fangorn()
    fangorn.load_tree_file('test/files/small.tre')
  })

})

describe('Fasta loading test', () => {

})

describe('Fasta saving test', () => {

})

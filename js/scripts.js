const app = require('electron')
const cp = require('child_process');
const FindInPage = require('electron-find').FindInPage
const Fangorn = require('./js/fangorn.js');
const fileDialog = require('file-dialog');

initSizes = function() {
  var bounds = app.remote.getCurrentWindow().webContents.getOwnerBrowserWindow().getBounds();
  $("svg#tree_display").css({ width: bounds.width-40, height: bounds.height-100});
}
var _f;

$(document).ready(function() {

  var fangorn = Fangorn();
  _f = fangorn;

  var example_tree = "((first:0.150276,second:0.213019):0.230956,(third:0.263487,fourth:0.202633):0.246917);";
  fangorn.load_tree_from_text(example_tree);

  initSizes();

  const findInPage = new FindInPage(app.remote.getCurrentWebContents(), {
    parentElement: $(".window-content")[0],
    offsetTop: 65,
    duration: 150
  })

  $("#open-tree").on("click", function(){
    fileDialog({ multiple: false }, file => {
      fangorn.load_tree(file[0].path);
    });
  });

  $("#open-fasta").on("click", function(){
    fileDialog({ multiple: false }, file => {
      fangorn.load_fasta(file[0].path);
    });
  });

  $(window).on("resize", function(){
    initSizes();
  });

  $(window).on("keydown", function(e) {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {
      findInPage.openFindWindow();
    }
  });

  $("#search-action").on("click", function() {
    findInPage.openFindWindow();
  });

  $("#mark-node").on("click", function() {
    fangorn.get_tree().get_selection().forEach(function(n){
      n.mark();
    });

    fangorn.get_tree().modify_selection(function(n){ return false; });
  });

  $("#unmark-node").on("click", function() {
    fangorn.get_tree().get_selection().forEach(function(n){
      n.unmark();
    });

    fangorn.get_tree().modify_selection(function(){});
  });

  $("[data-direction]").on ("click", function (e) {
    var which_function = $(this).data ("direction") == 'vertical' ? fangorn.get_tree().spacing_x : fangorn.get_tree().spacing_y;
    which_function (which_function () + (+ $(this).data ("amount"))).safe_update();
  });

});


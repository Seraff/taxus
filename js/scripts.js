const app = require('electron')
const { BrowserWindow } = require('electron').remote
const cp = require('child_process');
const fileDialog = require('file-dialog');
const FindInPage = require('electron-find').FindInPage
const Fangorn = require('./js/fangorn.js');
var fg = null;

initSizes = function() {
  var bounds = app.remote.getCurrentWindow().webContents.getOwnerBrowserWindow().getBounds();
  width = $('#main-tree-container')[0].clientWidth
  $("svg#tree_display").css({ width: width-30, height: bounds.height-120});
}

updateControls = function(fangorn) {
  $('#annotate-node-action').attr('disabled','disabled');
  $('#reroot-action').attr('disabled','disabled');
  $("[data-direction]").attr('disabled','disabled');
  $('.mark-button').attr('disabled','disabled');
  $('#open-fasta').attr('disabled','disabled');

  if (fangorn.tree_is_loaded()){
    $("[data-direction]").removeAttr('disabled');
    $("#open-fasta").removeAttr('disabled');

    if (fangorn.fasta_is_loaded() && fangorn.is_one_leaf_selected())
      $('#annotate-node-action').removeAttr('disabled');

    if (fangorn.get_selection().length == 1)
      $('#reroot-action').removeAttr('disabled');

    if (fangorn.fasta_is_loaded() && fangorn.get_selected_leaves().length > 0)
      $('.mark-button').removeAttr('disabled');

    if (fangorn.fasta_is_loaded())
      $('#save-fasta-action').removeAttr('disabled');
    else
      $('#save-fasta-action').attr('disabled','disabled');
  }
}

var showAlert = function(title, body){
  $("#universal-dialog").find('.title').html(title)
  $("#universal-dialog").find('.modal-body').html(body)
  $("#universal-dialog")[0].showModal();
}

var showLogAlert = function(title, subtitle, rows){
  $("#universal-dialog").find('.title').html(title)

  $("#universal-dialog").find('.modal-body').html('')
  $("#universal-dialog").find('.modal-body').append(subtitle)
  $("#universal-dialog").find('.modal-body').append('<div id="log_body" style="overflow-y: auto; max-height: 200px; border: none;"></div>');

  rows.forEach(function(r){ $("#log_body").append(r + "</br>"); });

  $("#universal-dialog")[0].showModal();
}

$(document).ready(function() {
  document.addEventListener("fangorn_state_update", function(e){
    updateControls(fangorn);
  });

  var fangorn = Fangorn();
  fg = fangorn;

  fangorn.dispatch_state_update();

  initSizes();

  const findInPage = new FindInPage(app.remote.getCurrentWebContents(), {
    parentElement: document.querySelector("#main-tree-container"),
    offsetTop: 65,
    duration: 150
  })

  $("#open-tree").on("click", function(){
    fileDialog({ multiple: false }, file => {
      fangorn.load_tree(file[0].path);
      $("#pane-with-bg").css("background-image", "none");
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

  $("#remove-selected-action").on("click", function() {
    fangorn.get_selection().forEach(function(n){
      n.mark();
    });

    fangorn.get_tree().refresh();
    fangorn.get_tree().modify_selection(function(n){ return false; });
  });

  $("#remove-unselected-action").on("click", function() {
    var selected = fangorn.get_selection();

    fangorn.get_leaves().forEach(function(l){
      if (!selected.includes(l))
        l.mark();
    });

    fangorn.get_tree().refresh();
    fangorn.get_tree().modify_selection(function(n){ return false; });
  });

  $("#restore-selected-action").on("click", function() {
    fangorn.get_selection().forEach(function(n){
      n.unmark();
    });

    fangorn.get_tree().refresh();
    fangorn.get_tree().modify_selection(function(){});
  });

  $("#show-fasta-action").on("click", function() {
    if ($('#fasta-panel').is(":hidden")){
      $('#fasta-panel').show();
      $("#show-fasta-action").addClass("btn-pressed");
      initSizes();
    }
    else{
      $('#fasta-panel').hide();
      $("#show-fasta-action").removeClass("btn-pressed");
      initSizes();
    }
  });

  $("#save-fasta-action").on("click", function(){
    fangorn.save_fasta();
  });

  $('#annotate-node-action').on("click", function(){
    if (!fangorn.fasta_is_loaded() || fangorn.get_selection().length != 1)
      return false;

    var node = fangorn.get_selection()[0];
    var title = node.fasta.title;
    $("#seq-title-input").val(title);

    $("#annotate-dialog")[0].showModal();
  });

  $("#annotation-dialog-cancel").on("click", function(){
    $("#seq-title-input").val('');
    $("#annotate-dialog")[0].close(false);
  });

  $("#annotation-dialog-save").on("click", function(){
    var node = fangorn.get_selection()[0];
    fangorn.update_node_title(node, $("#seq-title-input").val());
    $("#seq-title-input").val('');
    $("#annotate-dialog")[0].close(false);
    fangorn.get_tree().safe_update()
  });

  $('#reroot-action').on("click", function(){
    fangorn.reroot_to_selected_node();
  });

  $("#universal-dialog-close").on("click", function(){
    $("#universal-dialog")[0].close(false);
  });

  $("[data-direction]").on ("click", function () {
    var which_function = $(this).data ("direction") == 'vertical' ? fangorn.get_tree().spacing_x : fangorn.get_tree().spacing_y;
    which_function (which_function () + (+ $(this).data ("amount"))).safe_update();
  });

});


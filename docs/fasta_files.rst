Fasta Files
===========

After opening a tree file it's possible to import a fasta file the tree built from.

.. Attention:: The fasta file should have the same number of sequences as the number of taxa in the tree. Tree taxa names and fasta file headers should be the same.

Opening and Saving Fasta Files
------------------------------

To open a fasta file, select :menuselection:`File --> Open Fasta`.

.. Note:: It is possible to apply a fasta file only if the tree is loaded.

To save a fasta file, select :menuselection:`File --> Save Fasta` or :menuselection:`File --> Save Fasta as...` if you want to save the file under a different name.

"Save Fasta" action doesn't rewrite the original file but saves a copy with `.fangorn.` suffix in the name.

Fasta Panel
-----------

To open a Fasta panel press "Show Fasta" button in the toolbar (|fasta_panel_button|).

The panel contains the name of the currently opened file and it's content.

.. image:: _static/img/fasta_panel.gif
  :scale: 75%
  :align: center

.. |fasta_panel_button| image:: _static/img/fasta_panel_button.png
  :scale: 50%

Removing Sequences
------------------

Sequences of one or several selected taxa in the tree can be removed from the fasta file.

To remove entries from fasta use the group of removal instruments in the toolbar or select :menuselection:`Edit --> Delete selected`, :menuselection:`Edit --> Delete unselected`, :menuselection:`Edit --> Keep selected` from the main menu.

.. image:: _static/img/removal_buttons.png
  :scale: 75%
  :align: center

* |remove_selected_button| - remove selected taxa from the fasta file
* |remove_unselected_button| - keep in fasta file only selected taxa
* |return_selected_button| - return selected taxa to fasta file

.. image:: _static/img/sequence_removal.gif
  :scale: 75%
  :align: center

.. |remove_selected_button| image:: _static/img/remove_selected_button.png
  :scale: 50%

.. |remove_unselected_button| image:: _static/img/remove_unselected_button.png
  :scale: 50%

.. |return_selected_button| image:: _static/img/return_selected_button.png
  :scale: 50%

Headers editing
---------------

When the fasta file is loaded it is possible to change the name of taxa and corresponding header of sequence simultaneously.

To change the header of taxa select it and click the "Annotate Node" button (|annotate_node_button|).

Edit the name of taxa/header in the window and press "Save".

.. image:: _static/img/name_editing.png
  :scale: 50%
  :align: center

.. Note:: This operation changes a tree and a fasta file. To apply changes to files both tree and fasta files should be saved.

.. |annotate_node_button| image:: _static/img/annotate_node_button.png
  :scale: 50%

Copying sequences
-----------------

When the fasta file is opened and one or several taxa is selected the sequences can be copied to system clipboard using :menuselection:`Edit --> Copy` action in the main menu (or standard Copy keystroke of your OS).

Search
------

The fasta search mechanism works in the same way as the `search inside the tree <basics.html#search>`__. To enable search inside fasta headers press the "Fasta mode" button (|search_fasta_mode_button|) of the search panel.

.. |search_fasta_mode_button| image:: _static/img/search_fasta_mode_button.png
  :scale: 50%

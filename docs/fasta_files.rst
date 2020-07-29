Fasta Files
===========

After opening a tree file it's possible to import a fasta file the tree built from.

.. Attention:: The fasta file should have the same number of sequences as the number of taxa in the tree. Tree taxa names and fasta file headers should be the same.

Opening and Saving Fasta Files
------------------------------

To open a fasta file select :menuselection:`File --> Open Fasta`.

.. Note:: It is possible to apply fasta file only if the tree is loaded.

To save a fasta file select :menuselection:`File --> Save Fasta` or :menuselection:`File --> Save Fasta as...` if you want to save the file under the different name.

"Save Fasta" action doesn't rewrite the original file, but saves a copy with `.fangorn.` suffix in the name.

Fasta Panel
-----------

To open a Fasta panel press "Show Fasta" button in the tool bar (|fasta_panel_button|).

The panel contain the name of currently opened file and it's content

.. image:: _static/img/fasta_panel.gif
  :scale: 75%
  :align: center

.. |fasta_panel_button| image:: _static/img/fasta_panel_button.png
  :scale: 50%

Removing Sequences
------------------

Sequences of one or several several selected taxa in tree can be removed from fasta file.

To remove entries from fasta use the group of removal instruments in the tool bar or select :menuselection:`Edit --> Delete selected`, :menuselection:`Edit --> Delete unselected`, :menuselection:`Edit --> Keep selected` from main menu.

.. image:: _static/img/removal_buttons.png
  :scale: 75%
  :align: center

* |remove_selected_button| - remove selected taxa from fasta file
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

To change the header of taxa select it and click "Annotate Node" button (|annotate_node_button|).

Edit the name of taxa/header in the window and press "Save".

.. image:: _static/img/name_editing.png
  :scale: 50%
  :align: center

.. Note:: This operation changes a tree and a fasta file. To apply changes to files both tree and fasta files should be saved.

.. |annotate_node_button| image:: _static/img/annotate_node_button.png
  :scale: 50%

Copying sequences
-----------------

When the fasta file is opened and one or several taxa is selected the sequences can be copied to system clipboard unsing :menuselection:`Edit --> Copy` action in main menu (or standard Copy keystroke of your OS).

Search
------

#TODO

Shortcuts
---------

.. csv-table::
  :header: "Action", "Shortcut (Windows, Linux)", "Shortcut (Mac)"
  :align: center

  "Open Fasta", :kbd:`Ctrl` + :kbd:`Shift` + :kbd:`O`, :kbd:`Cmd` + :kbd:`Shift` + :kbd:`O`
  "Save Fasta", :kbd:`Ctrl` + :kbd:`Shift` + :kbd:`S`, :kbd:`Cmd` + :kbd:`Shift` + :kbd:`S`
  "Delete selected", :kbd:`Ctrl` + :kbd:`D`, :kbd:`Cmd` + :kbd:`D`
  "Delete unselected", :kbd:`Ctrl` + :kbd:`U`, :kbd:`Cmd` + :kbd:`U`
  "Keep selected", :kbd:`Ctrl` + :kbd:`K`, :kbd:`Cmd` + :kbd:`K`
  "Copy sequences of selected taxa", :kbd:`Ctrl` + :kbd:`C`, :kbd:`Cmd` + :kbd:`C`

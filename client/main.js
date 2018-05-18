import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './libs/w2ui-1.5.rc1.min';
import './libs/w2ui-1.5.rc1.min.css';

import './main.css';
import './main.html';


let w2uiGrid = null;

function insertRecord(name) {
  Meteor.call('insertRecord', name, function(err, data) {
    data._ids.forEach((item_id) => {
      w2ui['grid_'+name].add({ recid: w2ui['grid_'+name].records.length + 1, _id: item_id });
    });
  });
}

function databaseEntryFromRecordId(db, recid) {
  // gets record id (recid) and returns database entry (including _id)
  return db.find((entry) => {
    return entry.recid == recid;
  });
}

function deleteRecord(db, name) {
  let selection = w2ui['grid_'+name].getSelection();
  if (selection.length < 1) {
    // nothing changed
    return;
  }
  // single select
  let dbItem = databaseEntryFromRecordId(db, selection[0]);
  if (!dbItem) {
    return;
  }
  Meteor.call('deleteRecord', name, dbItem._id, function(err, data) {
    showCollection(name);
  })
}

function saveChanges(db, name) {
  let update = [];
  let changes = w2ui['grid_'+name].getChanges()
  if (changes.length < 1) {
    // nothing changed
    return;
  }
  changes.forEach((change) => {
    let dbItem = databaseEntryFromRecordId(db, change.recid)
    if (!dbItem) {
      return;
    }

    let c = Object.assign({}, change);
    delete c['recid']
    update.push({
      _id: dbItem._id,
      fields: c,
    });
  });
  Meteor.call('updateRecord', name, update, function(err, data) {
    showCollection(name);
  });
}

function buttonClicked(db, name) {
  return function(event) {
    switch (event.target) {
      case 'add':
        insertRecord(name);
        break;
      case 'save':
        saveChanges(db, name);
        break;
      case 'delete':
        deleteRecord(db, name);
        break;
    }
  }
}

function recordSelected(event) {
  w2uiGrid.toolbar.enable('delete');
}

function recordDeSelected(event) {
  w2uiGrid.toolbar.disable('delete');
}

function showCollection(name) {
  Meteor.call('collection', name, function(err, db) {
    let columnNames = [];
    let i = 0;
    db.forEach((item) => {
      item['_id'] = item['_id'];
      Object.keys(item).forEach((key) => {
        if (columnNames.indexOf(key) == -1) {
          columnNames.push(key);
        }
      });
      item['recid'] = ++i;
    });

    let columns = [];
    columnNames.forEach((item) => {
      let col = {
        field: item,
        caption: item,
        sortable: true,
        searchable: true,
        size: (1.0/columnNames.length*100)+'%'
      };
      if (item != '_id') {
        col.editable = { type: 'text' };
      }
      columns.push(col);
    });

    let grid = {
      name: 'grid_'+name,
      show: {toolbar: true},
      multiSelect: false,
      columns: columns,
      records: db,
      toolbar: {
        items: [
          { id: 'delete', type: 'button', caption: 'Delete', icon: 'w2ui-icon-cross' },
          { id: 'add', type: 'button', caption: 'Add Record', icon: 'w2ui-icon-plus' },
          { id: 'save', type: 'button', caption: 'Save', icon: 'w2ui-icon-check' }
        ],
        onClick: buttonClicked(db, name)
      },
      onSelect: recordSelected,
      onUnselect: recordDeSelected
    }
    if (w2uiGrid) {
      w2uiGrid.destroy();
    }
    w2uiGrid = $().w2grid(grid);
    w2uiGrid.toolbar.disable('delete');
    window.w2ui.layout.content('main', w2uiGrid);
  });
}

Template.body.onCreated(function helloOnCreated() {
  // get meta information about database
  Meteor.call('db', function(err, db) {
    var layout = $('#layout').w2layout({
      name: 'layout',
      panels: [
        { type: 'left', size: 150, resizable: true },
        { type: 'main', content: '' /*,
          tabs:  {
            active: '1table',
            tabs: [
              { id: '1table', caption: 'table' },
              { id: '2json', caption: 'json' }
            ]
          }*/
        }
      ]
    });

    let collection_nodes = [];
    let db_nodes = [{
      id: 'database',
      text: db.name,
      expanded: true,
      group: true,
      nodes: collection_nodes
    }];
    db.collections.forEach((item) => {
      collection_nodes.push(
        {
          id: item,
          text: item,
          img: 'icon-page'
        })
    });
    layout.content('left', $().w2sidebar({
    	name: 'sidebar',
    	img: null,
    	nodes: db_nodes,
      onClick: (event) => {
        showCollection(event.target);
      }
    }));
  });
});

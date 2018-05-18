import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './libs/w2ui/w2ui-1.5.rc1.min';
import './libs/w2ui/w2ui-1.5.rc1.min.css';

import './main.css';
import './main.html';


let w2uiGrid = null;
let w2uiJson = null;
let collectionName = null;
let recids = 0;

function insertRecord(db) {
  Meteor.call('insertRecord', collectionName, function(err, data) {
    data._ids.forEach((item_id) => {
      recids++;
      db.push({ recid: recids, _id: item_id })
      w2ui['grid_'+collectionName].add({ recid: recids, _id: item_id });
    });
  });
}

function databaseEntryFromRecordId(db, recid) {
  // gets record id (recid) and returns database entry (including _id)
  return db.find((entry) => {
    return entry.recid == recid;
  });
}

function deleteRecord(db) {
  let selection = w2ui['grid_'+collectionName].getSelection();
  if (selection.length < 1) {
    // nothing changed
    return;
  }
  // single select
  let dbItem = databaseEntryFromRecordId(db, selection[0]);
  if (!dbItem) {
    return;
  }
  Meteor.call('deleteRecord', collectionName, dbItem._id, function(err, data) {
    // TODO: get selected tab name instead of hardcoded 'table'
    showCollection(collectionName, 'table');
  })
}

function saveChanges(db) {
  let update = [];
  let changes = w2ui['grid_'+collectionName].getChanges()
  if (changes.length < 1) {
    // nothing changed
    console.log('nothing changed.');
    return;
  }
  changes.forEach((change) => {
    let dbItem = databaseEntryFromRecordId(db, change.recid)
    if (!dbItem) {
      console.log('record id '+change.recid+' not found');
      return;
    }

    let c = Object.assign({}, change);
    delete c['recid']
    update.push({
      _id: dbItem._id,
      fields: c,
    });
  });
  Meteor.call('updateRecord', collectionName, update, function(err, data) {
    // TODO: get selected tab name instead of hardcoded 'table'
    showCollection(collectionName, 'table');
  });
}

function buttonClicked(db) {
  return function(event) {
    switch (event.target) {
      case 'add':
        insertRecord(db);
        break;
      case 'save':
        saveChanges(db);
        break;
      case 'delete':
        deleteRecord(db);
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

function createGrid(db, columnNames) {
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
    name: 'grid_'+collectionName,
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
      onClick: buttonClicked(db)
    },
    onSelect: recordSelected,
    onUnselect: recordDeSelected
  }
  w2uiGrid = $().w2grid(grid);
  w2uiGrid.toolbar.disable('delete');
  window.w2ui.layout.content('main', w2uiGrid);
}

function destroyGrid() {
  if (w2uiGrid) {
    w2uiGrid.destroy();
  }
  w2uiGrid = null;
}

function showCollection(name, type) {
  collectionName = name;
  Meteor.call('collection', name, function(err, db) {
    let columnNames = [];
    db.forEach((item) => {
      item['_id'] = item['_id'];
      Object.keys(item).forEach((key) => {
        if (columnNames.indexOf(key) == -1) {
          columnNames.push(key);
        }
      });
      item.recid = ++recids;
    });
    destroyGrid();
    destroyJSON();
    if (type == 'table') {
      createGrid(db, columnNames);
    } else if (type == 'json') {
      createJson(db, columnNames);
    }
  });
  w2ui.layout.showTabs('main');
}

function createJson(db, columnNames) {

}

function destroyJSON() {
  if (w2uiJson) {

  }
  w2uiJson = null;
}

function tabClicked(event) {
  switch(event.target) {
    case 'tab_table':
      showCollection(collectionName, 'table');
      break;
    case 'tab_json':
      showCollection(collectionName, 'json');
      break;
  }
}

Template.body.onCreated(function helloOnCreated() {
  // get meta information about database
  Meteor.call('db', function(err, db) {
    var layout = $('#layout').w2layout({
      name: 'layout',
      panels: [
        { type: 'left', size: 150, resizable: true },
        { type: 'main', content: '',
          tabs:  {
            active: 'tab_table',
            tabs: [
              { id: 'tab_table', caption: 'table' },
              { id: 'tab_json', caption: 'json' }
            ],
            onClick: tabClicked
          }
        }
      ]
    });
    w2ui.layout.hideTabs('main');
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
        // TODO: get selected tab name instead of hardcoded 'table'
        showCollection(event.target, 'table');
      }
    }));
  });
});

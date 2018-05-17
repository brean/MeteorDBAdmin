import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './libs/w2ui-1.5.rc1.min';
import './libs/w2ui-1.5.rc1.min.css';

import './main.css';
import './main.html';


function _id(_id) {
  let str = '';
  // id is already a string - default for meteor data
  if (typeof _id === 'string') {
    return _id;
  }
  // get id as hex from ObjectId-Uint8Array
  // default for direct mongodb insert
  _id.id.forEach((item) => {
    str+=parseInt(item).toString(16);
  })
  return str;
}


let w2uiGrid = null;

function showCollection(name) {
  Meteor.call('collection', name, function(err, db) {
    let columnNames = [];
    let i = 0;
    db.forEach((item) => {
      item['_id'] = _id(item['_id']);
      Object.keys(item).forEach((key) => {
        if (columnNames.indexOf(key) == -1) {
          columnNames.push(key);
        }
      });
      item['recid'] = ++i;
    });

    let columns = [];
    columnNames.forEach((item) => {
      let col = {field: item, caption: item, sortable: true, searchable: true, size: (1.0/columnNames.length*100)+'%'};
      columns.push(col);
    });

    let grid = {
      name: 'grid_'+name,
      show: {toolbar: true},
      columns: columns,
      records: db
    }
    if (w2uiGrid) {
      w2uiGrid.destroy();
    }
    w2uiGrid = $().w2grid(grid);
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

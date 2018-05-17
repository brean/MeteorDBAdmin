import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
var ObjectId = require('mongodb').ObjectID;

if (Meteor.isServer) {
  function getCollection(name, callback) {
    // get collection by name
    let db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    db.collections(function (e, r) {
      r.forEach((item) => {
        if (item.s.name == name) {
          callback(item);
        }
      });
    });
  }

  Meteor.methods({
    'db': function() {
      /**
       * gather meta information about MongoDB collections
       */
      let future = new Future();
      let db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
      let data = {
        name: db.databaseName,
        collections: []
      };

      db.collections(function (e, r) {
        r.forEach((item) => {
          data.collections.push(item.s.name);
        });
        future.return(data)
      });
      return future.wait();
    },
    'insertRecord': function(name) {
      let future = new Future();
      getCollection(name, function(item) {
        item.insert({}, {}, function(err, item) {
          future.return({_ids: item.insertedIds});
        });
      });
      return future.wait();
    },
    'updateRecord': function(name, update) {
      let future = new Future();
      getCollection(name, function(item) {
        let i = 0;
        update.forEach((data) => {
          if (!data._id || data._id.length < 12) {
            return
          }
          item.update(
            {_id: ObjectId(data._id)},
            {$set: data.fields},
            {upsert: false, multi: false},
            function(err, item) {
              i++;
              console.log(data.fields);
              console.log(data._id);
              if (i == update.length) {
                future.return({changed: i});
              }
            }
          );
        });
      });
      return future.wait();
    },
    'collection': function(name) {
      let future = new Future();
      // TODO: spaghetti!
      getCollection(name, function(item) {
        item.count({}, {}, (err, count) => {
          item.find({}, {}, (err, docs) => {
            let data = [];
            let i = 0;
            // do not use simple for-i-loop, forEach iterates over a
            // db-cursor
            docs.forEach(function(doc) {
              data.push(doc);
              i++;
              if (i == count) {
                future.return(data);
              }
            });
          });
        });
      });
      return future.wait();
    }
  });
}

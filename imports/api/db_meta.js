import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';

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
    'deleteRecord': function(name, _id) {
      let future = new Future();
      getCollection(name, function(item) {
        // default for mongodb is to use random strings, so we'll do the same
        item.remove({_id: _id}, {}, function(err, item) {
          future.return({});
        });
      });
      return future.wait();
    },
    'insertRecord': function(name) {
      // create new entry
      let future = new Future();
      getCollection(name, function(item) {
        // default for mongodb is to use random strings, so we'll do the same
        _id = Random.id();
        item.insert({_id: _id}, {}, function(err, item) {
          future.return({_ids: item.insertedIds});
        });
      });
      return future.wait();
    },
    'updateRecord': function(name, update) {
      // update single record (from inline-editing)
      let future = new Future();
      getCollection(name, function(item) {
        let i = 0;
        function updateDone(err, item) {
          i++;
          if (i == update.length) {
            future.return({changed: i});
          }
        };
        update.forEach((data) => {
          if (!data._id) {
            return
          }
          item.update(
            {_id: data._id},
            {$set: data.fields},
            {upsert: false, multi: false},
            updateDone
          );
        });
      });
      return future.wait();
    },
    'collection': function(name) {
      // get all collection entries by name
      let future = new Future();
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

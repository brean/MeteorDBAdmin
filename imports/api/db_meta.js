import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';


if (Meteor.isServer) {
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
    'collection': function(name) {
      let future = new Future();
      let db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
      // TODO: spaghetti!
      db.collections(function (e, r) {
        r.forEach((item) => {
          if (item.s.name == name) {
            item.count({}, {}, (err, count) => {
              item.find({}, {}, (err, docs) => {
                let data = [];
                let i = 0;
                docs.forEach(function(doc) {
                  data.push(doc);
                  i++;
                  if (i == count) {
                    future.return(data);
                  }
                });
              });
            })
          }
        });
      });
      return future.wait();
    }
  });
}

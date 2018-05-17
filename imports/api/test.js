import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

/**
 * This is just to create a test collection for some test data
 */

export const Test = new Mongo.Collection('test');

if (Meteor.isServer) {
  function createTest() {
    let data = {'name': 'Test Tester', 'mail': 'test@example.com'}
    if (!Test.findOne({name: data.name})) {
      Test.insert(data);
    }
  }

  createTest();

  Meteor.publish('test', function annotationToolPublication() {
    return Test.find({});
  });
}

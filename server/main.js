import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import '/imports/api/test.js';
import '/imports/api/db_meta.js';

Meteor.startup(() => {
  Future = Npm.require('fibers/future');
});

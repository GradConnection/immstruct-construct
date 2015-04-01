/* This module provides the ability to initialize localized immstruct data
within each component, rather than forcing the building of the immstruct at the
top. */

var immstruct = require("immstruct")
var Immutable = require("immutable")
var createConstruct = require('./index').createConstruct;
var nest = require('./index').nest;

/* Imagine attaching this function to FriendListItem.construct,
   FriendListItem is a `component`. */
var FriendListItemState = createConstruct(function(name) {
  return {
    firstName: name,
    country: new Promise(function(resolve, reject) {
      setTimeout(function() {
        // Does a 1 second lookup, simulating API access.
        resolve(this.state.routeParams.country)
      }.bind(this), 250)
    }.bind(this)),
  }
})

/* Imagine attaching this function to FriendList.construct,
   FriendList is a `component`.*/
var FriendListState = createConstruct(function(names) {
  return {
    friendListItemStates: this.many(FriendListItemState, 
      ["friendListItemStates"], nest(names))
  };
})

/* Imagine attaching this function to App.construct,
   App is a `component`.*/
var AppState = createConstruct(function() {
  var names = ["John", "Shepard", "Liara"];
  // Bind names to friendListState, the transformation determined by the 
  // function.
  this.bind(['names'], ['friendListState'], function(names) {
    return this.one(FriendListState, ["friendListState"], names.deref())
  });
  return {
    names: names,
    friendListState: this.one(FriendListState, ["friendListState"], names)
  }
});

var structure = immstruct({});

structure.on('change', function(path, a, b) {
  console.log("change at path:", path, a);
})

AppState({
  structure: structure,
  path: [],
  state: {
    routeParams: { country: "Australia" }
  }
}).then(function() {
  console.log("All promises complete. structure:")
  console.log(JSON.stringify(structure.cursor().deref(), null, " "));

  structure.cursor(['names']).update(function() {
    return Immutable.List(["Tom", "Mary", "Richard", "Jennifer"])
  });

});

/* output:
change at path: [] Map { "friendListState": Map { "friendListItemStates": Map { 0: Map { "firstName": "John" }, 1: Map { "firstName": "Shepard" }, 2: Map { "firstName": "Liara" } } }, "names": List [ "John", "Shepard", "Liara" ] }
change at path: [ 'friendListState', 'friendListItemStates', 0 ] Map { "firstName": "John", "country": "Australia" }
change at path: [ 'friendListState', 'friendListItemStates', 1 ] Map { "firstName": "Shepard", "country": "Australia" }
change at path: [ 'friendListState', 'friendListItemStates', 2 ] Map { "firstName": "Liara", "country": "Australia" }
change at path: [ 'friendListState' ] Map { "friendListItemStates": List [ Map { "firstName": "John", "country": "Australia" }, Map { "firstName": "Shepard", "country": "Australia" }, Map { "firstName": "Liara", "country": "Australia" } ] }
All promises complete. structure:
{
 "friendListState": {
  "friendListItemStates": [
   {
    "firstName": "John",
    "country": "Australia"
   },
   {
    "firstName": "Shepard",
    "country": "Australia"
   },
   {
    "firstName": "Liara",
    "country": "Australia"
   }
  ]
 },
 "names": [
  "John",
  "Shepard",
  "Liara"
 ]
}
change at path: [ 'names' ] List [ "Tom", "Mary", "Richard", "Jennifer" ]
change at path: [ 'friendListState', 'friendListItemStates', 0 ] Map { "firstName": "Tom", "country": "Australia" }
change at path: [ 'friendListState', 'friendListItemStates', 1 ] Map { "firstName": "Mary", "country": "Australia" }
change at path: [ 'friendListState', 'friendListItemStates', 2 ] Map { "firstName": "Richard", "country": "Australia" }
change at path: [ 'friendListState', 'friendListItemStates', 3 ] Map { "firstName": "Jennifer", "country": "Australia" }
change at path: [ 'friendListState' ] Map { "friendListItemStates": List [ Map { "firstName": "Tom", "country": "Australia" }, Map { "firstName": "Mary", "country": "Australia" }, Map { "firstName": "Richard", "country": "Australia" }, Map { "firstName": "Jennifer", "country": "Australia" } ] }
*/


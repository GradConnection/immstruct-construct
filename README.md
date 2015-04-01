This module provides the ability to initialize localized immstruct data
within each component, rather than forcing the building of the immstruct at the
top.

# Usage #

        /* This module provides the ability to initialize localized immstruct data
        within each component, rather than forcing the building of the immstruct at the
        top. */

        var immstruct = require("immstruct")
        var createConstruct = require('./index').createConstruct;

        /* Imagine attaching this function to FriendListItem.construct,
           FriendListItem is a `component`. */
        var FriendListItemState = createConstruct(function(name) {
          return {
            firstName: name,
            country: new Promise(function(resolve, reject) {
              setTimeout(function() {
                // Does a 1 second lookup, simulating API access.
                resolve(this.state.routeParams.country)
              }.bind(this), 1000)
            }.bind(this)),
          }
        })

        /* Imagine attaching this function to FriendList.construct,
           FriendList is a `component`.*/
        var FriendListState = createConstruct(function(names) {
          return {
            friendListItemStates: Promise.all(names.map(
                function(name, i) {
                  return FriendListItemState(this, ["friendListItemStates", i], name)
                }.bind(this)))
          };
        })

        /* Imagine attaching this function to App.construct,
           App is a `component`.*/
        var AppState = createConstruct(function() {
          return {
            friendListState: FriendListState(this, "friendListState", 
              ["John", "Shepard", "Liara"])
          }
        });

        var structure = immstruct({});

        structure.on('swap', function(a, b, path) {
          console.log("swap at path:", path);
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
        });

        /* output:

        swap at path: [ 'friendListState', 'friendListItemStates', 0 ]
        swap at path: [ 'friendListState', 'friendListItemStates', 1 ]
        swap at path: [ 'friendListState', 'friendListItemStates', 2 ]
        swap at path: [ 'friendListState', 'friendListItemStates', 0 ]
        swap at path: [ 'friendListState', 'friendListItemStates', 1 ]
        swap at path: [ 'friendListState', 'friendListItemStates', 2 ]
        swap at path: [ 'friendListState' ]
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
         }
        }
        */



To run example:


     npm install
     node usage.js


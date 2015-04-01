var Immutable = require("immutable")

module.exports = {
  createConstruct: function(construct, callback) {
    // `construct` is a dictionary of string keys to values or promises.
    // `callback` with `this` bound to `self`, is called when all promises
    // resolve.

    return function(self, name) {
      var args = [];
      for (var i = 2; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      self = {
        structure: self.structure,
        path: (self.path || []).concat(name || []),
        state: self.state || {},
      };
      self.cursor = function(name) {
        return self.structure.cursor(self.path.concat(name || []))
      }
      return Promise.resolve(construct.apply(self, args))
        .then(function(obj) {
          var keys = Object.keys(obj);
          var deferKeys = [];
          var deferObjs = [];

          // Immediately update structure with all available values, 
          // depth-first.
          self.structure.cursor(self.path).update(function(collection) {
            return (collection || Immutable.Map()).withMutations(
              function(collection) {
                keys.forEach(function(key) {
                  if (typeof obj[key].then === "undefined") {
                    collection = collection.set(
                      key, Immutable.fromJS(obj[key]));
                  }
                  else {
                    deferKeys.push(key);
                    deferObjs.push(obj[key]);
                  }
                });
              });
          });

          // Update structure from deferred promises when they are available.
          // TODO: update structure for each promise instead of waiting for
          // all of them.
          return Promise.all(deferObjs)
            .then(function(objs) {
              self.cursor().update(
                function(collection) {
                  return collection.withMutations(
                    function(collection) {
                      deferKeys.forEach(function(key, i) { 
                        collection = collection.set(
                          key, Immutable.fromJS(objs[i]));
                      });
                    });
              })
              if (callback) {
                callback.apply(self);
              }

              return self.cursor().deref();
            });
      });
    }
  }
};

var Immutable = require("immutable")

var one = function(construct, path) {
  var args = [];
  for (var i = 2; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  return construct.apply(null, [this, [].concat(path)].concat(args))
}

var many = function(construct, path, array) {
  return Promise.all(array.map(function(args, i) {
      return construct.apply(null, [this, [].concat(path).concat(i)]
        .concat(args))
    }.bind(this)));
}


var bind = function(path, to, f) {
  var ref = this.structure.reference(this.path.concat(path));
  ref.observe(function() {
    f.apply(this, [ref.cursor()]).then(function(value) {
      this.cursor().set(to, value);
    }, console.error);
  }.bind(this));
}

module.exports = {
  nest: function(array) {
    return Immutable.fromJS(array).toJS().map(function(obj) {
      return [obj];
    });
  },
  createConstruct: function(construct) {
    // `construct` is a dictionary of string keys to values or promises.
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
      self.one = one.bind(self)
      self.many = many.bind(self)
      self.bind = bind.bind(self)

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
              self.cursor().update(function(collection) {
                return (collection || Immutable.Map()).withMutations(
                  function(collection) {
                    deferKeys.forEach(function(key, i) { 
                      collection = collection.set(
                        key, Immutable.fromJS(objs[i]));
                    });
                  });
              });
              return self.cursor().deref();
            });
      });
    }
  }
};

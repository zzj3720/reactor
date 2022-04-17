function anonymous(constraint, rule
) {
    var self = this;
    var subst = {};
    if (!self.argsMatch(subst, rule.head[1], constraint)) return Promise.resolve();
    var constraintIds = [self.Store.lookup("prime", 1), [constraint.id]];
    return new Promise(function (resolve, reject) {
        self.Helper.forEach(constraintIds, function iterateConstraint(ids, callback) {
            if (!self.Store.allAlive(ids)) return callback();
            if (self.History.has("prime", ids)) return callback();
            var localSubst = {...subst};
            if (!self.argsMatch(localSubst, self.head[0], self.Store.find(ids[0]))) return callback();
            if (!((m, n) => {
                console.log(`zuozijian src/run.ts:94`, rule);
                return n.get() % m.get() === 0;
            })(...self.instantiateArguments(localSubst, rule.guard[0].args))) return callback();
            Promise.resolve().then(function () {
                self.History.add("prime", ids);
                self.Store.kill(ids[1]);
                callback();
            })
                .catch(function () {
                    callback();
                })
        }, resolve)
    })
}

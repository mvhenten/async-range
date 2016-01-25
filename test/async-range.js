"use strict";

var range = require("../index");
var test = require("tape");
var random = require("lodash/random");
var noop = require("lodash/noop");

function isOrdered(result) {
    var prev = -1;

    return result.every(function(result) {
        var current = prev;
        prev = result[0];

        return current < result[0];
    });
}

test("isOrdered fixture", function(assert) {
    var notOrdered = [
        [2],
        [1]
    ];
    var ordered = [
        [1],
        [2]
    ];
    assert.equal(isOrdered(notOrdered), false, "returns false on unordered");
    assert.equal(isOrdered(ordered), true, "returns true on ordered");
    assert.end();
});

test("range processes in async", function(assert) {
    function iterator(n, next) {
        var timeout = random(10, 100);
        setTimeout(function() {
            next(null, n, timeout);
        }, timeout);
    }

    var len = random(30, 100);

    range(0, len, iterator, function(err, result) {
        assert.equal(err, undefined);
        assert.ok(Array.isArray(result), "got result array back");
        assert.equal(result.length - 1, len, "got expected no. result");

        assert.ok(isOrdered(result), "result are in expected order");
        assert.end();
    });
});

test("range bails out on err", function(assert) {
    var onErr = random(10, 100);

    function iterator(n, next) {
        var timeout = random(10, 100);
        setTimeout(function() {
            if (n == onErr) return next("Cannot process " + onErr);
            return next(null, n);
        }, timeout);
    }

    range(0, onErr + 10, iterator, function(err, result) {

        assert.equal(err, "Cannot process " + onErr);
        assert.ok(isOrdered(result), "result are in expected order");
        assert.end();
    });
});

test("range bails on error, but still all result due to concurrency", function(assert) {
    var onErr = random(10, 100);

    function iterator(n, next) {
        if (n !== onErr) return next(null, n);

        setTimeout(function() {
            return next("Cannot process " + onErr);
        }, 100);
    }

    var len = onErr + 10;

    range(0, len, iterator, function(err, result) {
        assert.equal(err, "Cannot process " + onErr);
        assert.ok(isOrdered(result), "result are in expected order");
        assert.equal(result.length, len, "Still got all result due to concurrency");
        assert.end();
    });
});

test("maxConcurrency can force serial", function(assert) {
    var current = 0;

    function iterator(n, next) {
        var timeout = random(10, 100);

        if (n !== current)
            assert.fail("iter not running in serial");

        current++;

        setTimeout(function() {
            next(null, n, timeout);
        }, timeout);
    }

    var len = random(30, 100);

    range(0, len, 1, iterator, function(err, result) {
        assert.equal(err, undefined);
        assert.ok(Array.isArray(result), "got result array back");
        assert.equal(result.length - 1, len, "got expected no. result");
        assert.ok(isOrdered(result), "result are in expected order");
        assert.end();
    });
});

test("maxConcurrency can be higher then job count", function(assert) {
    function iterator(n, next) {
        setTimeout(next.bind(null, null, n), 100);
    }

    var len = random(30, 100);

    range(0, len, 1000, iterator, function(err, result) {
        assert.equal(err, undefined);
        assert.ok(Array.isArray(result), "got result array back");
        assert.equal(result.length - 1, len, "got expected no. result");
        assert.ok(isOrdered(result), "result are in expected order");
        assert.end();
    });
});

test("maxConcurrency ensures early bail out", function(assert) {
    var onErr = random(10, 100);
    var len = onErr + 10;

    function iterator(n, next) {
        var err = n == onErr ? "Cannot process " + onErr : null;
        setTimeout(next.bind(null, err, n), 100);
    }

    range(0, len, iterator, function(err, result) {

        assert.equal(err, "Cannot process " + onErr);
        assert.ok(isOrdered(result), "result are in expected order");

        assert.equal(result.length, onErr, "Got result up to err");
        assert.ok(result.length < len, "Less result then in range");
        assert.end();
    });
});

test("range is a factory", function(assert) {
    var len = random(10, 100);

    function iterator(n, next) {
        setTimeout(next.bind(null, null, n), 100);
    }

    var factory = range(0, len, iterator);

    assert.equal(factory.name, "rangeFactory", "returned a named function rangeFactory");
    assert.equal(typeof factory, "function", "got a function back");

    factory(function(err, result) {
        assert.equal(err, undefined);
        assert.ok(Array.isArray(result), "got result array back");
        assert.equal(result.length - 1, len, "got expected no. result");
        assert.ok(isOrdered(result), "result are in expected order");
        assert.end();
    });
});

test("range is a factory, can do maxConcurrency", function(assert) {
    var len = random(10, 100);

    var current = 0;

    function iterator(n, next) {
        if (n !== current) {
            assert.fail("iter not running in serial");
        }

        current++;

        setTimeout(next.bind(null, null, n), 100);
    }

    var factory = range(0, len, 1, iterator);

    factory(function(err, result) {
        assert.equal(err, undefined);
        assert.ok(Array.isArray(result), "got result array back");
        assert.equal(result.length - 1, len, "got expected no. result");
        assert.ok(isOrdered(result), "result are in expected order");
        assert.end();
    });
});

test("range asserts input", function(assert) {

    assert.throws(function() {
        range("a", 1, "foo", "foo");
    }, /Start must be an int/, "Start must be an int");

    assert.throws(function() {
        range(10, 1, "foo", "foo");
    }, /Start must be < end/, "Start must be < end");

    assert.throws(function() {
        range(1, "foo", "foo", "foo");
    }, /End must be an int/, "End must be an int");

    assert.throws(function() {
        range(10, 1, "foo", "foo");
    }, /Start must be < end/, "Start must be < end");

    assert.throws(function() {
        range(1, 2, noop, "foo");
    }, /Done must be a function/, "Done must be a function");

    assert.end();
});
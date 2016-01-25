"use strict";

var sliced = require("sliced");

function assert(thruthy, msg) {
    if (!thruthy) throw new TypeError(msg);
}

var MAX_CONCURENCY = 10;


function worker(memo, iter, done) {
    var next = memo.next;

    if (next === null) return done();

    iter(next, function(err) {
        if (err) return done(err);
        
        if(arguments.length > 1)
            memo.result[next] = sliced(arguments, 1);

        worker(memo, iter, done);
    });
}

function workers(memo, iter, max, done) {
    var workers = 0;

    while (workers < max) {
        workers++;
        worker(memo, iter, done);
    }
}

function _range(start, end, maxConcurrency, iter, done) {
    var current = start;
    var doneCalled = false;

    var memo = {
        result: {},

        get next() {
            var next = current;
            if (memo.done) return null;
            current++;
            return next;
        },

        get done() {
            return end < current;
        },

        get finished() {
            return Object.keys(memo.result).length - 1 == (end - start);
        },
    };

    workers(memo, iter, 10, function(err) {
        if (doneCalled) return;

        if (err || memo.finished && memo.done) {
            doneCalled = true;

            var indexes = Object.keys(memo.result);

            indexes.sort(function(a, b) {
                return a - b;
            });

            return done(err, indexes.map(function(key) {
                return memo.result[key];
            }));
        }
    });
}

/**
 * Process a range of numbers asynchronously
 * 
 * If the "maxConcurrency" parameter is omitted, it defaults to MAX_CONCURRENCY = 10
 * If the "done" callback is omitted, returns a factory.
 * 
 * @param {number} start - Start of the range, must be an integer
 * @param {number} end - End of the range, must be an integer
 * @param {number} maxConcurrency - Max number of workers. Use 1 to force serial.
 * @param {function} iter - Iterator to call for each number
 * @param {function} done - Callback when done, or on error.
 */
function range(start, end, maxConcurrency, iter, done) {
    if (typeof maxConcurrency !== "number") {
        return range(start, end, MAX_CONCURENCY, maxConcurrency, iter);
    }

    if (!done)
        return function rangeFactory(done) {
            range(start, end, maxConcurrency, iter, done);
        };

    assert(/^\d+$/.test(Math.abs(start)), "Start must be an integer number");
    assert(/^\d+$/.test(Math.abs(end)), "End must be an integer number");
    assert(/^\d+$/.test(Math.abs(maxConcurrency)), "maxConcurrency must be an integer number");
    assert(start < end, "Start must be < end");

    assert(typeof iter === "function", "Iterator must be a function");
    assert(typeof done === "function", "Done must be a function");

    _range(start, end, maxConcurrency, iter, done);
}

module.exports = range;
# async-range

Asynchronously process a range of numbers.

### Installlation

    npm install async-range
    
### Usage

##### range(start, end, [maxConcurrency], iterator, [callback]);

Produces a new array of values returned by the `iterator` by calling it for every
number in the range from `start` - `end`, *including* start and end.

This is often useful in batch processing, where a range of possible results is 
required. This function takes care of the bookkeeping for you.

**Arguments**

* `start` - Start of the range, must be an integer
* `end` - End of the range, must be an integer > start
* `maxConcurrency` - Max number of workers. Use 1 to force serial.
* `iter` - Iterator to call for each number
* `done` - Callback when done, or on error.

**N.B.**

If the "maxConcurrency" parameter is omitted, it defaults to `MAX_CONCURRENCY = 10`

If the "done" callback is omitted, this function returns a factory.

**Concurrency**

On success, all results are guaranteed to be returned in the proper order. In case
of an `error` condition, the results array is not guaranteed to be continous, and
more or less results then expected may be returned due to parallel processing.

Workers may still be running after this function has returned an error, but their
results will not be collected. If you need to be certain, set `maxConcurrency` to
**one** to force processing in serial.

### Examples

Process 1 - 1000 and returns the result:

```javascript

    var range = require("async-range");
    
    range(1, 1000, db.User.findOne, function(err, users){
        // users is an array of loaded users
        // err may contain a database error
    });
```

Process in serial, only returning results up to the first error:

```javascript

    var range = require("async-range");
    
    range(1, 1000, 1, db.User.findOne, function(err, users){
        // Processing is done in "serial"
        // users is an array of loaded users
        // err may contain a database error
    });
```

Returns a factory for later usage:

```javascript

    var range = require("async-range");
    
    var worker = range(1, 1000, 1, db.User.findOne);
    
    worker(function(err, users){
        // Processing is done in "serial"
        // users is an array of loaded users
        // err may contain a database error
    });
```

### Contributing

If you feel this module lacks functionality, please open up an issue or a pull
request. Pull requests should come with a unit test. In lieu of a formal styleguide, 
take care to maintain the existing coding style.

### License

The MIT License (MIT)

Copyright (c) 2016 Matthijs van Henten

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

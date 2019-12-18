# node-streamsink

Pipe a stream to a `StreamSink`, and then you can create a `ReadableStream`,
`String`, or `Buffer` from the `StreamSink`.

## Usage

```js
var StreamSink = require('streamsink');

var sink = new StreamSink();

fs.createReadStream("foo.txt").pipe(sink);
sink.on('finish', function() {
  // sink has now buffered foo.txt
  sink.createReadStream().pipe(someDestination);

  // or use toString([encoding], [start], [end])
  console.log(sink.toString('utf8'));

  // or use toBuffer()
  sink.toBuffer();
});

// you can also create instances from a list of buffers
var sink = StreamSink.fromBufferList([new Buffer("aoeu"), new Buffer("foo")]);
```

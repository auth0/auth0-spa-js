var stream = require('stream');
var util = require('util');

module.exports = StreamSink;
StreamSink.fromBuffer = fromBuffer;
StreamSink.fromBufferList = fromBufferList;

function fromBuffer(buffer, options) {
  return fromBufferList([buffer], options);
}

function fromBufferList(bufferList, options) {
  var sink = new StreamSink(options);
  sink.buffer = bufferList;
  sink.length = 0;
  bufferList.forEach(function(buffer) {
    sink.length += buffer.length;
  });
  return sink;
}

util.inherits(StreamSink, stream.Writable);
function StreamSink(options) {
  stream.Writable.call(this, options);
  this.buffer = [];
  this.length = 0;
}

StreamSink.prototype._write = function(chunk, encoding, callback) {
  this.buffer.push(chunk);
  this.length += chunk.length;
  callback();
};

StreamSink.prototype.createReadStream = function(options) {
  var s = new stream.Readable(options);
  s.buffer = this.buffer;
  s._read = function(size) {
    for (var i = 0; i < s.buffer.length; i += 1) {
      s.push(s.buffer[i]);
    }
    s.push(null);
  };
  return s;
};

StreamSink.prototype.toString = function(encoding, start, end) {
  return this.toBuffer().toString(encoding, start, end);
};

StreamSink.prototype.toBuffer = function() {
  return Buffer.concat(this.buffer, this.length);
};

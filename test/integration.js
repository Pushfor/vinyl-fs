'use strict';

var path = require('path');

var fs = require('graceful-fs');
var miss = require('mississippi');
var expect = require('expect');

var vfs = require('../');

var cleanup = require('./utils/cleanup');
var testStreams = require('./utils/test-streams');
var testConstants = require('./utils/test-constants');

var pipe = miss.pipe;
var concat = miss.concat;

var count = testStreams.count;

var base = testConstants.outputBase;
var inputDirpath = testConstants.inputDirpath;
var outputDirpath = testConstants.outputDirpath;
var symlinkDirpath = testConstants.symlinkDirpath;
var inputBase = path.join(base, './in/');
var inputGlob = path.join(inputBase, './*.txt');
var outputBase = path.join(base, './out/');
var outputSymlink = path.join(symlinkDirpath, './foo');
var outputDirpathSymlink = path.join(outputDirpath, './foo');
var content = testConstants.content;

var clean = cleanup(base);

describe('integrations', function() {

  beforeEach(clean);
  afterEach(clean);

  it('does not exhaust available file descriptors when streaming thousands of files', function(done) {
    // This can be a very slow test on boxes with slow disk i/o
    this.timeout(0);

    // Make a ton of files. Changed from hard links due to Windows failures
    var expectedCount = 6000;

    fs.mkdirSync(base);
    fs.mkdirSync(inputBase);

    for (var idx = 0; idx < expectedCount; idx++) {
      var filepath = path.join(inputBase, './test' + idx + '.txt');
      fs.writeFileSync(filepath, content);
    }

    pipe([
      vfs.src(inputGlob, { buffer: false }),
      count(expectedCount),
      vfs.dest(outputBase),
    ], done);
  });

  it.only('something something symlink directory', function(done) {

    function assert(files) {
      var symlinkResult = fs.readlinkSync(outputSymlink);
      var destResult = fs.readlinkSync(outputDirpathSymlink);

      expect(symlinkResult).toEqual(inputDirpath);
      expect(destResult).toEqual(inputDirpath);
    }

    pipe([
      vfs.src(inputDirpath),
      vfs.symlink(symlinkDirpath),
      vfs.dest(outputDirpath),
      concat(assert),
    ], done);
  });
});

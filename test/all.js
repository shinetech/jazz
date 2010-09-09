var assert = require("assert");
var jazz = require("../lib/jazz");
var sys = require("sys");

function Muffin(numberOfBites) {
  this._numberOfBites = numberOfBites;
};

Muffin.prototype = { 
  get numberOfBites() {
    return this._numberOfBites;
  }
};

var testCases = [
  ["Hello, World",
    [{}, "Hello, World"]],
  ["Hello, {name}",
    [{name: "Tom"}, "Hello, Tom"]],
  ["Hello, {if name}{name}{end}",
    [{}, "Hello, "],
    [{name: "Bob"}, "Hello, Bob"]],
  ["Hello, {if name}{name}{else}Anonymous{end}",
    [{}, "Hello, Anonymous"],
    [{name: "Bert"}, "Hello, Bert"]],
  ["Hello, {if empty name}Anonymous{else}{name}{end}",
    [{name: ""}, "Hello, Anonymous"],
    [{name: "Jim"}, "Hello, Jim"]],
  ["Hello, {if not empty name}{name}{else}Anonymous{end}",
    [{name: ""}, "Hello, Anonymous"],
    [{name: "Jim"}, "Hello, Jim"]],
  ["Hello, {if empty names}Anonymous{else}{flatten(names)}{end}",
    [{names: [], flatten: function(names, cb) { cb("NO"); }}, "Hello, Anonymous"],
    [{names: ["Jim", "Joe"], flatten: function(names, cb) { cb(names[0] + names[1]); }}, "Hello, JimJoe"]],
  ["Hello, {if not empty names}{flatten(names)}{else}Anonymous{end}",
    [{names: [], flatten: function(names, cb) { cb("NO"); }}, "Hello, Anonymous"],
    [{names: ["Jim", "Joe"], flatten: function(names, cb) { cb(names[0] + names[1]); }}, "Hello, JimJoe"]],
  ["Hello, {if firstName}{firstName}{elif lastName}Mr. {lastName}{else}Anonymous{end}",
    [{}, "Hello, Anonymous"],
    [{firstName: "Steve"}, "Hello, Steve"],
    [{lastName: "Lee"}, "Hello, Mr. Lee"]],
  ["Hello, {if firstName}{firstName}{elif lastName}Mr. {lastName}{elif nickName}{nickName}{else}Anonymous{end}",
    [{}, "Hello, Anonymous"],
    [{firstName: "Jeff"}, "Hello, Jeff"],
    [{lastName: "Lee"}, "Hello, Mr. Lee"],
    [{nickName: "Steve"}, "Hello, Steve"],
    [{lastName: "Lee", nickName: "Steve"}, "Hello, Mr. Lee"]],
  ["Hello, {if firstName}{firstName}{elif lastName}Mr. {lastName}{end}",
    [{}, "Hello, "],
    [{firstName: "Bobby"}, "Hello, Bobby"],
    [{lastName: "Lee"}, "Hello, Mr. Lee"]],
  ["{foreach user in users}{user}\n{end}",
    [{users: ["tom", "ben", "stan"]}, "tom\nben\nstan\n"]],
  ["{foreach i in outer}{i}\n{foreach j in inner}  {j}\n{end}{end}",
    [{"outer": [1, 2, 3], "inner": [4, 5, 6]}, "1\n  4\n  5\n  6\n2\n  4\n  5\n  6\n3\n  4\n  5\n  6\n"]],
  ["Hey,\nNice socks. Mind if I borrow them?\n\r",
    [{}, "Hey,\nNice socks. Mind if I borrow them?\n\r"]],
  ["Testing \"Quotes\" y'see",
    [{}, "Testing \"Quotes\" y'see"]],
  ["{user.name}",
    [{"user": {"name": "Tom"}}, "Tom"]],
  ["{foreach friend in user.friends}{friend}\n{end}",
    [{"user": {"friends": ["Bob", "Bert", "Benita"]}}, "Bob\nBert\nBenita\n"]],
  ["{if user.active}ACTIVE{else}INACTIVE{end}",
    [{"user": {"active": true}}, "ACTIVE"],
    [{"user": {"active": false}}, "INACTIVE"]],
  ["{if user.active}{user.name} is ACTIVE{else}{user.name} is INACTIVE{end}",
    [{"user": {"active": true, "name": "Tom"}}, "Tom is ACTIVE"],
    [{"user": {"active": false, "name": "Steve"}}, "Steve is INACTIVE"]],
  ["{foo()}",
    [{foo: function(cb) { cb("Hello!"); }}, "Hello!"]],
  ["{html(s)}",
    [{html: function(s, cb) { cb(s.replace(/</g, '&lt;').replace(/>/g, '&gt;')); }, s: "<lol>"}, "&lt;lol&gt;"]],
  ["{delay(tv)}",
    [{delay: function(tv, cb) { setTimeout(function() { cb("Done!"); }, tv) }, tv: 500}, "Done!"]],
  ["{foo('a string')}",
    [{foo: function(s, cb) { cb(s); }}, "a string"]],
  ["{foo('bar','baz')}",
    [{foo: function(a, b, cb) { cb(a + "=" + b); }}, "bar=baz"]],
  ["{if (foo)}{foo}{end}",
    [{foo: true}, "true"],
    [{foo: false}, ""]],
  ["{if a and b}a and b{elif a}a only{elif b}b only{else}neither :({end}",
    [{a: true, b: true}, "a and b"],
    [{a: true, b: false}, "a only"],
    [{a: false, b: true}, "b only"],
    [{a: false, b:false}, "neither :("]],
  ["{if a and (b or c)}both{elif a}left{elif b or c}right{else}none{end}",
    [{a: true, b: true, c: false}, "both"],
    [{a: true, b: false, c: true}, "both"],
    [{a: true, b: false, c: false}, "left"],
    [{a: false, b: true, c: false}, "right"],
    [{a: false, b: false, c: true}, "right"],
    [{a: false, b: false, c: false}, "none"]],
  ["{if (a and b) or c}either{else}neither{end}",
    [{a: true, b: true, c: false}, "either"],
    [{a: true, b: true, c: true}, "either"],
    [{a: false, b: true, c: true}, "either"],
    [{a: true, b: false, c: false}, "neither"]],
  ["{if not a}not a{else}a{end}",
    [{a: true}, "a"],
    [{a: false}, "not a"]],
  ["{if not a and b}not a and b{end}",
    [{a: false, b: true}, "not a and b"],
    [{a: true, b: false}, ""],
    [{a: true, b: true}, ""]],
  ["{if (not a) and not b}(not a) and not b{end}",
    [{a: false, b: false}, "(not a) and not b"]],
  ["{if a eq 'test'}a{else}b{end}",
    [{a: "test"}, "a"],
    [{a: "muppet"}, "b"]],
  ["{if a eq 'foo' and b eq 'bar'}{a},{b}{else}{a}{end}",
    [{a: "foo", b: "bar"}, "foo,bar"],
    [{a: "foo", b: "muppet"}, "foo"],
    [{a: "quack", b: "moo"}, "quack"]],
  ["{if a neq 'yes'}no :({else}yes :){end}",
    [{a: "yes"}, "yes :)"],
    [{a: "ffa"}, "no :("]],
  ["{sum(5, 10)}",
    [{sum: function(a, b, cb) { cb(a + b); }}, "15"]],
  ["{product(10, 0x0a)}",
    [{product: function(a, b, cb) { cb(a * b); }}, "100"]],
  ["{1.5 gt b}",
    [{b: 2.0}, "false"],
    [{b: 1.0}, "true"]],
  ["{'test'}",
    [{}, "test"]],
  ["{math.sum(2, 5)}",
    [{math: {sum: function(a, b, cb) { cb(a + b); }}}, "7"]],
  ["{1 and 2}",
    [{}, "2"]],
  ["{1 eq b}",
    [{b: 1}, "true"],
    [{b: 2}, "false"]],
  ["{45}",
    [{}, "45"]],
  ["{{}}",
    [{}, "{}"]],
  ["{pagination.end}",
    [{pagination: { end: "This shouldn't be picked up as a token" }}, "This shouldn't be picked up as a token"]],
  ["{muffin.numberOfBites}",
    [{muffin: new Muffin(5) }, "5"]],
  ["{consumeMuffin({'jeepers': 'cool'})}",
    [{consumeMuffin: function(hash, cb) { cb(hash['jeepers']); }}, "cool"]],
  ["{chokeMuffin({'oh wow': { 'this isnt cool at all': 'really isnt' }})}",
    [{chokeMuffin: function(hash, cb) { cb(hash['oh wow']['this isnt cool at all']); }}, "really isnt"]],
  ["{explodingMuffin({'kapow':{'geegolly':{'ohno':powpow}}})}",
    [{powpow: 'howdy', explodingMuffin: function(hash, cb) { cb(hash['kapow']['geegolly']['ohno']); }}, "howdy"]],
  ["{megaMuffin({'size':pewpew.maximum})}",
    [{pewpew: {maximum: 5}, megaMuffin: function(hash, cb) { cb(hash['size']); }}, "5"]]
];

testCases.forEach(function(testCase) {
  var source = testCase[0];
  var tests = testCase.slice(1);
  for (var i = 0; i < tests.length; i++) (function() {
    var params = tests[i][0] || {};
    var expected = tests[i][1] || "";
    var options = tests[i][2] || {};

    var template = jazz.compile(source, options);
    template.eval(params, function(output) {
      assert.equal(output, expected);
    });
  })();
});

process.loop();
sys.puts("OK!");


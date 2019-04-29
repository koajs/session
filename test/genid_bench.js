'use strict';

const Benchmark = require('benchmark');
const uuid = require('uuid');
const uid = require('uid-safe');

const suite = new Benchmark.Suite();

const genidByUid = () => `${Date.now()}-${uid.sync(24)}`;
const genidByUuidV1 = () => uuid.v1();
const genidByUuidV4 = () => uuid.v4();

console.log('genidByUid() => %s', genidByUid());
console.log('genidByUuidV1() => %s', genidByUuidV1());
console.log('genidByUuidV4() => %s', genidByUuidV4());

// add tests
suite
.add('uid()', function() {
  genidByUid();
})
.add('genidByUuidV1()', function() {
  genidByUuidV1();
})
.add('genidByUuidV4()', function() {
  genidByUuidV4();
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
// run async
.run({ async: true });

// genidByUid() => 1556529339180-DRnQyEqlYjGr_Zq_42fHpdFMlBfVlAoG
// genidByUuidV1() => 5af3b830-6a5f-11e9-91fb-abc918efca3d
// genidByUuidV4() => 27088fa8-8436-4c8b-aae7-76ba316db9e3
//
// uid() x 260,850 ops/sec ±1.50% (84 runs sampled)
// genidByUuidV1() x 1,181,483 ops/sec ±0.93% (86 runs sampled)
// genidByUuidV4() x 301,840 ops/sec ±1.40% (83 runs sampled)
// Fastest is genidByUuidV1()

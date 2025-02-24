const { expandCategories, traceUpCategory, topologicalSort } = require('./categories.js');

const sampleCategories1 = [
    {
        "name": "organism"
    },
    {
        "name": "animal",
        "parents": ["organism"]
    },
    {
        "name": "mammal",
        "parents": ["animal"]
    },
    {
        "name": "dog",
        "parents": ["mammal"]
    },
    {
        "name": "chihuahua",
        "parents": ["dog"]
    },
    {
        "name": "shiba_inu",
        "parents": ["dog"]
    },
    {
        "name": "human",
        "parents": ["mammal"]
    },
    {
        "name": "plant",
        "parents": ["organism"]
    },
    {
        "name": "cedar",
        "parents": ["plant"]
    },
    {
        "name": "pine",
        "parents": ["plant"]
    }
];

console.log("mammal ... ")
console.log(expandCategories(sampleCategories1, "mammal"))
console.log("mammal (trace up) ... ")
console.log(traceUpCategory(sampleCategories1, "mammal"))
console.log("human ... ")
console.log(expandCategories(sampleCategories1, "human"))
console.log("human (trace up) ...")
console.log(traceUpCategory(sampleCategories1, "human"))
console.log("plant ...")
console.log(expandCategories(sampleCategories1, "plant"))
console.log("plant (trace up) ...")
console.log(traceUpCategory(sampleCategories1, "plant"))

const ts_result = topologicalSort(sampleCategories1)
console.log("topological sorted (sorted list) ...")
console.log(ts_result["sortedList"])
console.log("topological sorted (left set) ...")
console.log(ts_result["leftSet"])

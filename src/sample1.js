import { expandCategories } from "./categories.js";

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
console.log("human ... ")
console.log(expandCategories(sampleCategories1, "human"))
console.log("plant ...")
console.log(expandCategories(sampleCategories1, "plant"))

import { expandCategories } from "./categories.js";

const sampleCategories2 = [
    {
        "name": "sport"
    },
    {
        "name": "ski",
        "parents": ["sport"]
    },
    {
        "name": "skate",
        "parents": ["sport"]
    },
    {
        "name": "baseball",
        "parents": ["sport"]
    },
    {
        "name": "tennis",
        "parents": ["sport"]
    }
];

const additionalCategories = [
    {
        "name": "wintersport",
        "parent": "sport",
        "children": ["ski", "skate"]
    }
];

const categories = sampleCategories2.concat(additionalCategories);

console.log("wintersport ... ")
console.log(expandCategories(categories, "wintersport"))
console.log("sport ... ")
console.log(expandCategories(categories, "sport"))

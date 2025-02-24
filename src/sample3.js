const { searchRel } = require('./categories.js');

const sampleCategories2 = [
    {
        "name": "parent"
    },
    {
        "name": "father",
        "parents": ["parent"]
    },
    {
        "name": "mother",
        "parents": ["parent"]
    },
    {
        "name": "ancestor",
        "children": ["parent"]
    }
];


const entities = [
    {"name": "人名",
        "url": ""
    }
]

const rels = [
    // 人名1は人名2の先祖/父/母である
    {"entity1": "のびろべえ", "entity2": "のび助", "relation": "ancestor"},
    {"entity1": "のび助", "entity2": "のび太", "relation": "father"},
    {"entity1": "玉子", "entity2": "のび太", "relation": "mother"},
    {"entity1": "のび太", "entity2": "ノビスケ", "relation": "father"},
    {"entity1": "ノビスケ", "entity2": "セワシ", "relation": "ancestor"},
]

/*
 * entity1を起点にして 「AはBの先祖である」を探索する
 */
const isAncestorCheck = (entity1, entity2) => {
    return searchRel(rels, "entity1", "entity2", "relation", "ancestor", sampleCategories2, true, false, false, entity1, entity2);
}

/*
 * entity2を起点にして 「BはAの先祖である」を探索する
 */
const isAncestorCheck2 = (entity1, entity2) => {
    return searchRel(rels, "entity2", "entity1", "relation", "ancestor", sampleCategories2, true, false, false, entity2, entity1);
}

const checkDemo = (entity1, entity2) => {
    console.log("例:");
    console.log(`entity1: ${entity1}, entity2: ${entity2}`);
    console.log("");

    // entity1を起点にして 「AはBの先祖である」を探索する
    const result = isAncestorCheck(entity1, entity2);
    const isAncestor = result['answer'];
    const foundNameSet = result['foundNameSet'];

    // entity2を起点にして 「BはAの先祖である」を探索する (entity1まで)
    const result2 = isAncestorCheck2(entity1, entity2);
    const foundNameSet2 = result2['foundNameSet'];

    // entity2を起点にして 「BはAの先祖である」を探索する (すべて)
    const result3 = isAncestorCheck2(null, entity2);
    const foundNameSet3 = result3['foundNameSet'];

    if (isAncestor) {
        console.log(`${entity1}は${entity2}の先祖です。`);
    } else {
        console.log(`${entity1}は${entity2}の先祖ではありません。`);
    }
    console.log(`${entity1}の子孫`);
    console.log(foundNameSet);
    console.log(`${entity2}の先祖 (${entity1}まで)`);
    console.log(foundNameSet2);
    console.log(`${entity2}の先祖 (すべて)`);
    console.log(foundNameSet3);
    console.log("");
}

checkDemo("のびろべえ", "ノビスケ");
checkDemo("のび助", "ノビスケ");
checkDemo("玉子", "ノビスケ");
checkDemo("玉子", "のびろべえ");
checkDemo("のびろべえ", "セワシ");

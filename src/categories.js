/*
 * Copyright (C) 2025 Novisoftware
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * 与えられたカテゴリ名を下位カテゴリを含めたカテゴリ名のSetに展開します。
 * 
 * @type Set
 * @param {Object} categories 
 * @param {String} categoryName 
 * @returns カテゴリ名のSet
 */
function expandCategories(categories, categoryName) {
    let foundNames = new Set();
    if (categories.filter(obj => obj["name"] === categoryName) === 0) {
        return foundNames;
    }
    foundNames.add(categoryName);

    while (true) {
        let isChanged = false;

        categories.forEach(obj => {
            const currentName = obj["name"];
            if ("parents" in obj) {
                const parentNames = obj["parents"];
                parentNames.forEach(parentName => {
                    if (foundNames.has(parentName)) {
                        if (!foundNames.has(currentName)) {
                            isChanged = true;
                            foundNames.add(currentName);
                        }
                    }
                }
                );
            }
            if ("children" in obj) {
                if (foundNames.has(currentName)) {
                    const beforeN = foundNames.size;
                    foundNames = new Set([...foundNames, ...obj["children"]]);
                    const afterN = foundNames.size;
                    if (beforeN !== afterN) {
                        isChanged = true;
                    }
                }
            }
        });
        if (! isChanged) {
            break;
        }
    }

    return foundNames;
}

/**
 * 与えられたカテゴリ名の上位カテゴリを列挙し、カテゴリ名のSetに展開します。
 * 
 * @type Set
 * @param {Object} categories 
 * @param {String} categoryName 
 * @returns カテゴリ名のSetで上位カテゴリをカテゴリを返却します。指定されたカテゴリを含みます。
 */
function traceUpCategory(categories, categoryName) {
    let foundNames = new Set();
    if (categories.filter(obj => obj["name"] === categoryName) === 0) {
        return foundNames;
    }
    foundNames.add(categoryName);

    // 幅優先探索で上位カテゴリを洗い出す
    while (true) {
        let isChanged = false;
        const addNames = new Set();

        categories.forEach(obj => {
            const currentName = obj["name"];
            if ("parents" in obj) {
                foundNames.forEach(foundName => {
                    if (currentName === foundName) {
                        const beforeN = foundNames.size;
                        foundNames = new Set([...foundNames, ...obj["parents"]]);
                        const afterN = foundNames.size;
                        if (beforeN !== afterN) {
                            isChanged = true;
                        }
                    }
                });
            }

            if ("children" in obj) {
                if (! currentName in foundNames) {
                    if (obj["children"].intersect(foundNames).size > 0) {
                        isChanged = true;
                        foundNames.add(currentName);
                    }
                }
            }
        });
        if (! isChanged) {
            break;
        }
    }

    return foundNames;
}

/**
 * 与えられたカテゴリ名の上位カテゴリを取得します。
 * 
 * @type Set
 * @param {Object} categories 
 * @param {String} categoryName 
 * @returns カテゴリ名のSetで上位カテゴリを返却します。。指定されたカテゴリを含みません。
 */
function superordinateCategory(categories, categoryName) {
    const work = traceUpCategory(categories, categoryName);
    work.delete(categoryName);
    return work;
}

/**
 * 与えられたカテゴリを辞書の形式に変換します。
 * 
 * @type Object
 * @param {Object} categories 
 * @returns parentDict は名前→親の形式の辞書を返却し、 childDict は名前→子の形式の辞書を返却します。
 */
function makeDict(categories) {
    // 辞書(キー: 自ノード、 値: 子ノードの集合)
    const childDict = {};
    // 辞書(キー: 自ノード、 値: 親ノードの集合)
    const parentDict = {};
    categories.forEach(category => {
        const selfName = category['name'];
        if (!(selfName in childDict)) {
            childDict[selfName] = new Set();
        }
        if (!(selfName in parentDict)) {
            parentDict[selfName] = new Set();
        }
        if ('parents' in category) {
            parentDict[selfName] = parentDict[selfName].union(new Set(category['parents']));           

            category['parents'].forEach(parent => {
                if (parent in childDict) {
                    childDict[parent].add(selfName);
                } else {
                    childDict[parent] = new Set(selfName);
                }
            });
        }

        if ('children' in category) {
            childDict[selfName] = childDict[selfName].union(new Set(category['children']));

            category['children'].forEach(child => {
                if (child in parentDict) {
                    parentDict[child].add(selfName);
                } else {
                    parentDict[child] = new Set(selfName);
                }
            });            
        }
    });

    return {"parentDict": parentDict, "childDict": childDict};
}

/**
 * カテゴリとして与えられたグラフに対してトポロジカルソートを行います。
 * カテゴリの定義が循環(閉路)を含むかを点検するために使用します。
 * 
 * @param {*} categories 
 * @returns 
 */
function topologicalSort(categories) {
    const dict = makeDict(categories);
    const parentDict = dict["parentDict"];
    const sorted = [];
    const foundSet = new Set();

    while (true) {
        let isChanged = false;
        for (let [cateName, parentNameSet] of Object.entries(parentDict)) {
            if (foundSet.has(cateName)) {
                continue;
            }
            if (!parentNameSet.isSubsetOf(foundSet)) {
                continue;
            }
            foundSet.add(cateName);
            sorted.push(cateName);
            isChanged = true;
        };
        if (! isChanged) {
            break;
        }
    }

    const parentdictKeys = Object.keys(parentDict);

    // console.log("Set(parentDict.keys)", parentdictKeys);

    const left = new Set(parentdictKeys).difference(new Set(sorted));

    return {"sortedList": sorted, "leftSet": left};
}


export {expandCategories, traceUpCategory, superordinateCategory, makeDict, topologicalSort};

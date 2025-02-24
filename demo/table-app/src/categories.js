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

/*
 * Expand category name to name set.
 * (trace down)
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

/*
 * Expand category name to name set.
 * (trace up)
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

/*
 * 上位カテゴリを洗い出す
 */
function superordinateCategory(categories, categoryName) {
    const work = traceUpCategory(categories, categoryName);
    work.delete(categoryName);
    return work;
}

/*
 * 辞書の形式に変換するユーティリティ
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

/*
 * トポロジカルソートを行うユーティリティ。
 * 閉路の有無を点検するために使用する。
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

/*
 * 関係を辿る
 *
 * (リレーションのデータ)
 * rels: 関係のリスト
 * colEnt1: entity1のカラム名
 * colEnt2: entity2のカラム名
 * colRel: 関係のカラム名
 * 
 * (リレーションの検索方法)
 * specifiedRel: 辿るためのリレーション名
 * categories: 関係のカテゴリ体系のリスト
 * isTransitive: リレーションの推移性の有無 (true, false)
 * isSymmetric: リレーションの対称性の有無 (true, false)
 * isReflexive: リレーションの反射性の有無 (true, false)
 * 
 * (開始, ゴールのエンティティ)
 * start: 開始name
 * goal: 終了name (nullを指定すると、ゴールは決めずにすべて列挙する)
 */
function searchRel(rels, colEnt1, colEnt2, colRel, specifiedRel, categories, isTransitive, isSymmetric, isReflexive, start, goal) {
    // specifiedRel に implies される relation の集合を取得する
    const specifiedRelSet = expandCategories(categories, specifiedRel);

    // 推論に使う関係だけを取り出す
    const workRelList = [];
    rels.forEach((currentRel) => {
        if (specifiedRelSet.has(currentRel[colRel])) {
            workRelList.push([currentRel[colEnt1], currentRel[colEnt2]]);
            if (isSymmetric) {
                workRelList.push([currentRel[colEnt2], currentRel[colEnt1]]);
            }
        }
    });

    let isReached = false;

    const traceOutput = [];
    const foundNameSet = new Set();
    foundNameSet.add(start);
    traceOutput.push(start);
    while (true) {
        let isChanged = false;

        for (let index = 0; index < workRelList.length; index++) {
            const r = workRelList[index];
            if (foundNameSet.has(r[0])) {
                if (!foundNameSet.has(r[1])) {
                    isChanged = true;
                    foundNameSet.add(r[1]);
                    traceOutput.push(r[1]);
                    if (goal !== null && r[1] === goal) {
                        isReached = true;
                        break;
                    }
                }
            }
        }
        if (isReached) {
            break;
        }
        if (! isTransitive) {
            // 関係が推移性を持たないときは繰り返さない
            break;
        }
        if (! isChanged) {
            // 変化がないときは終了
            break;
        }
    }

    // 反射性を持たないときは、start を除外する
    const ret = isReflexive ? traceOutput : traceOutput.filter((objName) => (objName !== start)); 

    return {"answer": isReached, "foundNameSet": ret};
}

export {expandCategories, traceUpCategory, superordinateCategory, makeDict, topologicalSort, searchRel};

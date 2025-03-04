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
const { expandCategories } = require('./categories.js');

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


export {searchRel};

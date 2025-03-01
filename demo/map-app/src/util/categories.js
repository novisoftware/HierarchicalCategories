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


function searchRel2(rels, colEnt1, colEnt2, colRel, specifiedRel, categories, isTransitive, isSymmetric, startSet, goalSet) {
    // specifiedRel に implies される relation の集合を取得する
    const specifiedRelSet = expandCategories(categories, specifiedRel);

    // 推論に使う関係だけを取り出す
    const workRelList = [];
    rels.forEach((currentRel) => {
        if (specifiedRelSet.has(currentRel[colRel])) {
            workRelList.push([currentRel[colEnt1], currentRel[colEnt2], currentRel]);
            if (isSymmetric) {
                workRelList.push([currentRel[colEnt2], currentRel[colEnt1], currentRel]);
            }
        }
    });

    let isReached = false;
    let reachNum = 0;

    const fromDict = {};

    const traceOutput = [];
    const foundNameSet = new Set(startSet);
    foundNameSet.forEach((name) => {
        traceOutput.push(name);
    });

    const foundGoal = new Set();
    while (true) {
        let isChanged = false;

        for (let index = 0; index < workRelList.length; index++) {
            const r = workRelList[index];
            const fromBusStop = r[0];
            const toBusStop = r[1];
            const rel = r[2];
            if (foundNameSet.has(fromBusStop)) {
                if (!foundNameSet.has(toBusStop)) {
                    isChanged = true;
                    foundNameSet.add(toBusStop);
                    traceOutput.push(toBusStop);

                    // 逆引き辞書を作成
                    if (!([toBusStop] in fromDict)) {
                        fromDict[toBusStop] = new Set();
                    }
                    fromDict[toBusStop].add([fromBusStop, rel]);

                    if (goalSet !== null && goalSet.has(toBusStop)) {
                        foundGoal.add(toBusStop);
                        isReached = true;
                        reachNum += 1;
                    }
                }
            }
        }
        /*
        if (isReached) {
            break;
        }
        */
        if (reachNum >= 3) {
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

        console.log("foundNameSet.size", foundNameSet.size);
    }

    // 得られた経路はゴールに到着しないものを含むツリー状になっている。
    // ゴールから逆順に辿る。
    // foundGoalを起点としてfromDictを遡る
    const traceOutput2 = [];
    const foundNameSet2 = new Set(foundGoal);
    const foundRouteSet = new Set();

    while(true) {
        let isChanged = false;
        foundNameSet2.forEach((toBusStop) => {
            if ([toBusStop] in fromDict) {
                fromDict[toBusStop].forEach(([fromBusStop, rel]) => {
                    // 注: JavaScriptのタプルはキーとして使えない
                    if (!foundRouteSet.has(fromBusStop + "\n" + toBusStop /*, rel */)) {
                        isChanged = true;
                        foundRouteSet.add(fromBusStop + "\n" + toBusStop /*, rel */);
                        traceOutput2.push([fromBusStop, toBusStop, rel]);
                    }
                    console.log("trace2 fromBusStop", fromBusStop);
                    // foundRouteSetの要素数をconsole.logで確認
                    console.log("foundRouteSet.size", foundRouteSet.size);                   

                    foundNameSet2.add(fromBusStop);
            }
                );
            }
        });
        if (! isChanged) {
            break;
        }
    }
    console.log("isReached", isReached);


    const route = traceOutput2.reverse()

    return {"answer": isReached, "route": route};
}




export {searchRel2};

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

function searchRel2(rels, colEnt1, colEnt2, colRel, specifiedRel, categories, isSymmetric, startSet, goalSet) {
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

    const routeDict = {};
    const foundNameDict = {}
    Array.from(startSet).forEach(e => {foundNameDict[e] = 0})

    // ルートの重み(固定値)
    const FIX_DISTANCE = 1;

    console.log("search start");

    const foundGoal = new Set();
    while (true) {
        let isChanged = false;

        for (let index = 0; index < workRelList.length; index++) {
            const r = workRelList[index];
            const fromBusStop = r[0];
            const toBusStop = r[1];
            const rel = r[2];
            if (fromBusStop in foundNameDict) {
                if (!(toBusStop in foundNameDict)) {
                    isChanged = true;
                    // スタートからtoBusStopまでの距離
                    const distance = foundNameDict[fromBusStop] + FIX_DISTANCE
                    foundNameDict[toBusStop] = distance;

                    // 逆引き辞書を作成
                    if (!(toBusStop in routeDict)) {
                        routeDict[toBusStop] = {}
                    }
                    routeDict[toBusStop][fromBusStop] = [distance, rel];
                } else {
                    const distance = foundNameDict[fromBusStop] + FIX_DISTANCE
                    if (foundNameDict[toBusStop] > distance) {
                        isChanged = true;
                        foundNameDict[toBusStop] = distance;
                        routeDict[toBusStop] = {}
                        routeDict[toBusStop][fromBusStop] = [distance, rel];
                    };
                }
                if (isChanged && goalSet !== null && goalSet.has(toBusStop)) {
                    foundGoal.add(toBusStop);
                    isReached = true;
                    reachNum += 1;
                }
            }
        }
        if (reachNum > 0) {
            break;
        }
        if (! isChanged) {
            // 変化がないときは終了
            break;
        }

        console.log("foundNameDict.size", foundNameDict.size);
    }

    console.log("search end");

    // 得られた経路はゴールに到着しないものを含むツリー状になっている。
    // ゴールから逆順に辿る。
    // foundGoalを起点としてrouteDictを遡る
    const traceOutput2 = [];
    const foundNameSet2 = new Set(foundGoal);
    const foundRouteSet = new Set();

    while(true) {
        let isChanged = false;
        foundNameSet2.forEach((toBusStop) => {
            if (toBusStop in routeDict) {
                for (let fromBusStop in routeDict[toBusStop]) {
                    const [distance, rel] = routeDict[toBusStop][fromBusStop];
                    // 注: JavaScriptのタプルはキーとして使えない
                    const keyStr = fromBusStop + "\n" + toBusStop;

                    if (!foundRouteSet.has(keyStr)) {
                        isChanged = true;
                        foundRouteSet.add(keyStr);
                        traceOutput2.push([fromBusStop, toBusStop, rel]);
                    }
                    console.log("trace2 fromBusStop", fromBusStop);
                    // foundRouteSetの要素数をconsole.logで確認
                    console.log("foundRouteSet.size", foundRouteSet.size);                   

                    foundNameSet2.add(fromBusStop);
                }
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


export {searchRel, searchRel2};

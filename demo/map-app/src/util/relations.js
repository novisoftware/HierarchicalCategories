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

function searchRel2(rels, colEnt1, colEnt2, colRel, specifiedRel, categories, isSymmetric, startSet, goalSet, busStopShortCodeDict) {
    const codeToName = (code) => {
        const busStop = busStopShortCodeDict[code];
        if (!busStop) {
            return "???";
        }
        return busStop["busstopName"];
    };

    // specifiedRel に implies される relation の集合を取得する
    const specifiedRelSet = expandCategories(categories, specifiedRel);

    // 推論に使う関係だけを取り出す
    const workRelList = [];
    rels.forEach((currentRel) => {
        if (currentRel["systemCode"] == "6201"
            || currentRel["systemCode"] == "6202"
        ) {
            // 深夜は無視する
            return;
        }
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
    const ignoreNameDict = {}
    Array.from(startSet).forEach(e => {foundNameDict[e] = 0})

    // ルートの重み(固定値)
    const FIX_DISTANCE = 1;

    console.log("search start");
    let goalDistance = null;

    const foundGoal = new Set();
    while (true) {
        let isChanged = false;

        for (let index = 0; index < workRelList.length; index++) {
            const r = workRelList[index];
            const fromBusStop = r[0];
            const toBusStop = r[1];
            const rel = r[2];
            if (fromBusStop in foundNameDict) {
                // スタートからtoBusStopまでの距離
                const distance = foundNameDict[fromBusStop] + FIX_DISTANCE
                if (goalDistance == null || distance <= goalDistance) {
                    if (!(toBusStop in foundNameDict)) {
                        // toBusStopに到着するまでの経路が初めて見つかった場合
    
                        console.log(`${fromBusStop} to ${toBusStop} (${codeToName(fromBusStop)} to ${codeToName(toBusStop)}) : distance = ${distance}  new add`)
                        isChanged = true;
                        foundNameDict[toBusStop] = distance;
    
                        // 逆引き辞書を作成
                        if (!(toBusStop in routeDict)) {
                            routeDict[toBusStop] = {};
                        }
                        routeDict[toBusStop][fromBusStop] = [distance, new Set([rel])];
                    } else {
                        if (foundNameDict[toBusStop] > distance) {
                            // toBusStopに到着するまでの、より距離の短い経路が見つかった場合
    
                            console.log(`${fromBusStop} to ${toBusStop} (${codeToName(fromBusStop)} to ${codeToName(toBusStop)}) : distance = ${distance}  replace ${foundNameDict[toBusStop]}`)
                            isChanged = true;
                            // その場所に辿り着くために必要な距離を更新する
                            foundNameDict[toBusStop] = distance;
                            // 逆引き辞書に登録された他の経路を消す(遠いので)
                            routeDict[toBusStop] = {};
                            routeDict[toBusStop][fromBusStop] = [distance, new Set([rel])];
                        }
                        else if (foundNameDict[toBusStop] == distance) {
                            // toBusStopに到着するまでの、最短と同じ距離の経路が見つかった場合
    
                            console.log(`${fromBusStop} to ${toBusStop} (${codeToName(fromBusStop)} to ${codeToName(toBusStop)}) : distance = ${distance}  same distance to ${foundNameDict[toBusStop]}`)
                            let addSet = new Set([rel]);
                            if (fromBusStop in routeDict[toBusStop]) {
                                let [_, old_rels] = routeDict[toBusStop][fromBusStop];
                                // let old_rels = wk[1];
                                addSet = addSet.union(old_rels);
                                
                                if (addSet.size != old_rels.size) {
                                    isChanged = true;
                                }
                            }
                            routeDict[toBusStop][fromBusStop] = [distance, addSet];
                        };
                    }
                    if (isChanged && goalSet !== null && goalSet.has(toBusStop)) {
                        if (goalDistance == null || distance < goalDistance) {
                            goalDistance = distance;
                        }
                        foundGoal.add(toBusStop);
                        isReached = true;
                        reachNum += 1;
                    }
                }
            }
        }
        /*
        if (reachNum > 0) {
            break;
        }
        */
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
                    const [distance, rels] = routeDict[toBusStop][fromBusStop];

                    // 注: JavaScriptのタプルはキーとして使えない
                    const keyStr = fromBusStop + "\n" + toBusStop;

                    if (!foundRouteSet.has(keyStr)) {
                        isChanged = true;
                        foundRouteSet.add(keyStr);
                        traceOutput2.push([fromBusStop, toBusStop, rels]);

                        console.log(`遡ってチェック ${fromBusStop} から ${toBusStop} (${codeToName(fromBusStop)} から ${codeToName(toBusStop)}) : 距離 ${distance} `);
                    }
                    // console.log("trace2 fromBusStop", fromBusStop);
                    // foundRouteSetの要素数をconsole.logで確認
                    // console.log("foundRouteSet.size", foundRouteSet.size);                   

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

const { trace } = require('console');
const { searchRel2 } = require('./categories.js'); 

const file_01_entity = "01_E_名古屋市_市バス停留所一覧 _busstop-latitude-longitude.csv";
const file_02_relation = "02_R_名古屋市_市バス停留所並順_busstop-order.csv";
const file_03_relation = "03_R_名古屋市_市バス系統一覧_bus-startend.csv";

/*
fetch(file_01E)
.then(response => response.json())
.then(rawCsv => {
  console.log("reading");

})
.catch(error => console.error('Error fetching data:', error));
*/

function read_busstop_latitude_longitude(rawCsv) {
    const busStopCodeDict = {};
    const busStopKanaDict = {}

    rawCsv.split('\n').forEach((line, index) => {
        if (index === 0) {
          return;
        }
        /*
        if (index > 20) {
            return;
        }
        */
        // 停留所名称,停留所かな,停留所+乗降場所ｺｰﾄﾞ,停留所ｺｰﾄﾞ,乗降場所ｺｰﾄﾞ,乗降場所補足情報,緯度,経度
        // 相川一丁目,あいかわいっちょうめ,01000301,01000,301,1番,35.103004,136.969528
        const items = line.split(',');
        const busstopName = items[0];
        const busstopKana = items[1];
        const busstopCode = items[2];
        const busstopMemo = items[5];
        const latitude = items[6];
        const longitude = items[7];
        // console.log(busstopName, busstopKana, busstopCode, busstopMemo, latitude, longitude);

        busStopCodeDict[busstopCode] = {
            "busstopName": busstopName,
            "busstopKana": busstopKana,
            "busstopMemo": busstopMemo,
            "latitude": latitude,
            "longitude": longitude
        };

        if (!(busstopKana in busStopKanaDict)) {
            busStopKanaDict[busstopKana] = new Set();
        }
        busStopKanaDict[busstopKana].add(busstopCode)
      }
    );

    return [busStopCodeDict, busStopKanaDict]
} 

// 停留所並び順
function read_busstop_order(rawCsv, busStopDict) {
    const busstop_order_list = [];
    const busstop_rel_list = [];

    rawCsv.split('\n').forEach((line, index) => {
        if (index === 0) {
          return;
        }
        /*
        if (index > 20) {
            return;
        }
        */
        const items = line.split(',');
        // 系統ｺｰﾄﾞ,路線ｺｰﾄﾞ,方向ｺｰﾄﾞ,並順,バス停標柱ｺｰﾄﾞ
        system_code = items[0];
        route_code = items[1];
        direction_code = items[2];
        order = items[3];
        busstop_code = items[4];

        // console.log(system_code, route_code, direction_code, order, busstop_code, busStopDict[busstop_code]['busstopName']);

        busstop_order_list.push({
            "system_code": system_code,
            "route_code": route_code,
            "direction_code": direction_code,
            "order": order,
            "busstop_code": busstop_code
        });
      }
    );

    for (index = 2; index < busstop_order_list.length; index ++ ) {
        if (busstop_order_list[index-1]["system_code"] === busstop_order_list[index]["system_code"]
            && busstop_order_list[index-1]["route_code"] === busstop_order_list[index]["route_code"]
            && busstop_order_list[index-1]["direction_code"] === busstop_order_list[index]["direction_code"]) {
                busstop_rel_list.push({
                    "busstop_code1": busstop_order_list[index-1]['busstop_code'],
                    "busstop_code2": busstop_order_list[index]['busstop_code'],
                    "relation": "next"
                });
        }
    }

    /*
    busstop_rel_list.forEach((busstop_rel) => {
        console.log(busStopDict[busstop_rel['busstop_code1']]['busstopName'],
            "→",
            busStopDict[busstop_rel['busstop_code2']]['busstopName']);
    });
    */

    return [busstop_order_list, busstop_rel_list];
}

// バス系統
function read_bus_system(rawCsv) {
    const busSystemArray = [];

    rawCsv.split('\n').forEach((line, index) => {
        if (index === 0) {
          return;
        }
        /*
        if (index > 20) {
            return;
        }
        */
        const items = line.split(',');
        // 系統ｺｰﾄﾞ,路線ｺｰﾄﾞ,方向ｺｰﾄﾞ,系統記号,起点,終点,経由等
        system_code = items[0];
        route_code = items[1];
        direction_code = items[2];
        system_symbol = items[3];
        start = items[4];
        end = items[5];
        via = items[6];

        console.log(system_code, route_code, direction_code, system_symbol, start, end, via);
        busSystemArray.push({
            "system_code": system_code,
            "route_code": route_code,
            "direction_code": direction_code,
            "system_symbol": system_symbol,
            "start": start,
            "end": end,
            "via": via
        });

        return busSystemArray;
    });
}

const fs = require('fs');
const rawCsv1 = fs.readFileSync(file_01_entity, 'utf-8');
const [busStopCodeDict, busStopKanaDict] = read_busstop_latitude_longitude(rawCsv1);
const rawCsv2 = fs.readFileSync(file_02_relation, 'utf-8');
const [busstop_order_list, busstop_rel_list] = read_busstop_order(rawCsv2, busStopCodeDict);
const rawCsv3 = fs.readFileSync(file_03_relation, 'utf-8');
const busSystemArray = read_bus_system(rawCsv3);

if (process.argv.length == 3) {
    try {
        const busstopKana = process.argv[2];
        console.log(busstopKana);

        const busstopCodeSet = busStopKanaDict[busstopKana];
        Array.from(busstopCodeSet).forEach((busstopCode) => {
            console.log(busstopCode, busStopCodeDict[busstopCode]);
        });
    } catch (e) {
        console.error('処理中にエラーが発生しました:', e);
    }
}

if (process.argv.length == 4) {
    try {
        const busstopKanaFrom = process.argv[2];
        const busstopKanaTo = process.argv[3];
        console.log(busstopKanaFrom);
        const busstopCodeSetFrom = busStopKanaDict[busstopKanaFrom];
        Array.from(busstopCodeSetFrom).forEach((busstopCode) => {
            console.log(busstopCode, busStopCodeDict[busstopCode]);
        });
        console.log(busstopKanaTo);
        const busstopCodeSetTo = busStopKanaDict[busstopKanaTo];
        Array.from(busstopCodeSetTo).forEach((busstopCode) => {
            console.log(busstopCode, busStopCodeDict[busstopCode]);
        });


        /*
                    "busstop_code1": busstop_order_list[index-1]['busstop_code'],
                    "busstop_code2": busstop_order_list[index]['busstop_code'],
                    "relation": "next"        
        */
        //   searchRel2(rels, colEnt1, colEnt2, colRel, specifiedRel, categories, isTransitive, isSymmetric, isReflexive, startSet, goalSet)
        const r = searchRel2(busstop_rel_list, "busstop_code1", "busstop_code2", "relation",
            "next", [] /* categoriesは使わない */, true, false, false, busstopCodeSetFrom, busstopCodeSetTo)

        const trace2 = r["traceOutput2"];

        trace2.forEach((busstopCode) => {
            console.log(busstopCode, busStopCodeDict[busstopCode]["busstopName"]);
        });

    } catch (e) {
        console.error('処理中にエラーが発生しました:', e);
    }
}

/*
市バス停留所並順
https://data.bodik.jp/dataset/231002_7109030000_busstop-order

市バス停留所一覧
https://data.bodik.jp/dataset/231002_7109030000_busstop-latitude-longitude

市バス系統一覧
https://data.bodik.jp/dataset/231002_7109030000_bus-startend

市バス停留所URL
https://data.bodik.jp/dataset/231002_7101020000_busstop-url
*/

const isDebug = true;

const file_01_entity = "01_E_名古屋市_市バス停留所一覧 _busstop-latitude-longitude.csv";
const file_02_relation = "02_R_名古屋市_市バス停留所並順_busstop-order.csv";
const file_03_relation = "03_R_名古屋市_市バス系統一覧_bus-startend.csv";

/*
 * 名古屋市 市バス停留所一覧
 */
function read_busstop_latitude_longitude(rawCsv) {
    const busStopCodeArray = [];
    const busStopCodeDict = {};
    const busStopShortCodeDict = {};
    const busStopKanaDict = {}
    const busStopKanaDictShort = {};

    rawCsv.split('\n').forEach((line, index) => {
        if (index === 0) {
          return;
        }
        // 停留所名称,停留所かな,停留所+乗降場所ｺｰﾄﾞ,停留所ｺｰﾄﾞ,乗降場所ｺｰﾄﾞ,乗降場所補足情報,緯度,経度
        // 相川一丁目,あいかわいっちょうめ,01000301,01000,301,1番,35.103004,136.969528
        const items = line.split(',');
        const busstopName = items[0];
        const busstopKana = items[1];
        // 停留所+乗降場所コード
        const busstopCode = items[2];
        // 停留所コード
        const busstopCodeShort = items[3];
        // 乗降場所コード
        const busstopPlaceNumber = items[4];
        const busstopMemo = items[5];
        const latitude = items[6];
        const longitude = items[7];

        busStopCodeArray.push({
            "busstopCode": busstopCode,
            "busstopName": busstopName,
            "busstopKana": busstopKana,
            "busstopPlaceNumber": busstopPlaceNumber,
            "busstopMemo": busstopMemo,
            "busstopCodeShort": busstopCodeShort,
            "latitude": latitude,
            "longitude": longitude
        })

        busStopCodeDict[busstopCode] = {
            "busstopName": busstopName,
            "busstopKana": busstopKana,
            "busstopPlaceNumber": busstopPlaceNumber,
            "busstopMemo": busstopMemo,
            "busstopCodeShort": busstopCodeShort,
            "latitude": latitude,
            "longitude": longitude
        };
        busStopShortCodeDict[busstopCodeShort] = {
            "busstopName": busstopName,
            "busstopKana": busstopKana,
            "busstopMemo": busstopMemo,
            "latitude": latitude,
            "longitude": longitude
        };

        // かな表記(停留所コード)
        if (!(busstopKana in busStopKanaDictShort)) {
            busStopKanaDictShort[busstopKana] = new Set();
        }
        busStopKanaDictShort[busstopKana].add(busstopCodeShort)
        if (!(busstopName in busStopKanaDictShort)) {
            busStopKanaDictShort[busstopName] = new Set();
        }
        busStopKanaDictShort[busstopName].add(busstopCodeShort)


        // かな表記
        if (!(busstopKana in busStopKanaDict)) {
            busStopKanaDict[busstopKana] = new Set();
        }
        busStopKanaDict[busstopKana].add(busstopCodeShort)
        
        // 漢字表記
        if (!(busstopName in busStopKanaDict)) {
            busStopKanaDict[busstopName] = new Set();
        }
        busStopKanaDict[busstopName].add(busstopCode)
        busStopKanaDict[busstopName].add(busstopCodeShort)
      }
    );

    return [busStopCodeArray, busStopCodeDict, busStopShortCodeDict, busStopKanaDict, busStopKanaDictShort]
} 


/*
 * 名古屋市 市バス系統一覧
 */
function read_bus_system(rawCsv) {
    const busSystemArray = [];
    const busSystemDict = {};

    rawCsv.split('\n').forEach((line, index) => {
        if (index === 0) {
          return;
        }
        const items = line.split(',');
        // 系統ｺｰﾄﾞ,路線ｺｰﾄﾞ,方向ｺｰﾄﾞ,系統記号,起点,終点,経由等
        const system_code = items[0];
        const route_code = items[1];
        const direction_code = items[2];
        const system_symbol = items[3];
        const start = items[4];
        const end = items[5];
        const via = items[6];

        // console.log(system_code, route_code, direction_code, system_symbol, start, end, via);
        busSystemArray.push({
            "system_code": system_code,
            "route_code": route_code,
            "direction_code": direction_code,
            "system_symbol": system_symbol,
            "start": start,
            "end": end,
            "via": via
        });

        const system_key = [system_code, route_code, direction_code];
        // console.log("build_system_key", system_key);
        busSystemDict[system_key] = {
            "system_symbol": system_symbol,
            "direction_code": direction_code,
            "start": start,
            "end": end,
            "via": via,
        };
    });

    return [busSystemArray, busSystemDict];
}


/*
 * 名古屋市 市バス停留所並順
 */
function read_busstop_order(rawCsv, busStopDict, busSystemDict) {
    const busstop_order_list = [];
    const busstop_rel_list = [];

    rawCsv.split('\n').forEach((line, index) => {
        if (index === 0) {
          return;
        }
        const items = line.split(',');
        // 系統ｺｰﾄﾞ,路線ｺｰﾄﾞ,方向ｺｰﾄﾞ,並順,バス停標柱ｺｰﾄﾞ
        const system_code = items[0];
        const route_code = items[1];
        const direction_code = items[2];
        const order = items[3];
        const busstop_code = items[4];

        // console.log("busstop_code", busstop_code);

        busstop_order_list.push({
            "system_code": system_code,
            "route_code": route_code,
            "direction_code": direction_code,
            "order": order,
            "busstop_code": busstop_code,
            "busstop_code_short": busStopDict[busstop_code]['busstopCodeShort'],
        });
      }
    );

    for (let index = 2; index < busstop_order_list.length; index ++ ) {
        if (busstop_order_list[index-1]["system_code"] === busstop_order_list[index]["system_code"]
            && busstop_order_list[index-1]["route_code"] === busstop_order_list[index]["route_code"]
            && busstop_order_list[index-1]["direction_code"] === busstop_order_list[index]["direction_code"]) {
                busstop_rel_list.push({
                    // 停留所コード
                    // (探索に使用)
                    "busstop_code1": busstop_order_list[index-1]['busstop_code_short'],
                    "busstop_code2": busstop_order_list[index]['busstop_code_short'],
                    // 停留所コード＋乗降場所コード
                    // (表示に使用)
                    "busstop_code1_detail": busstop_order_list[index-1]['busstop_code'],
                    "busstop_code2_detail": busstop_order_list[index]['busstop_code'],
                    "relation": "next",
                    "system_key": [busstop_order_list[index]["system_code"], busstop_order_list[index]["route_code"], busstop_order_list[index]["direction_code"]]
                });
        }
    }

    return [busstop_order_list, busstop_rel_list];
}


/*
 * 名古屋市 市バス停留所URL
 */
function read_busstop_url(rawCsv /* , busStopDict, busSystemDict */) {
    const busstop_url_dict = [];

    rawCsv.split('\n').forEach((line, index) => {
        if (index === 0) {
          return;
        }
        const items = line.split(',');
        // 停留所コード,停留所名,URL
        // 01000,相川一丁目,https://map.kotsu.city.nagoya.jp/map/QR.jsp?from=b_01000

        const busstop_code = items[0];
        const busstop_name = items[1];
        const busstop_url = items[2];
        busstop_url_dict.push({
            "name": busstop_name,
            "url": busstop_url,
        });
      }
    );

    return busstop_url_dict;
}

export {read_busstop_latitude_longitude, read_bus_system, read_busstop_order, read_busstop_url};

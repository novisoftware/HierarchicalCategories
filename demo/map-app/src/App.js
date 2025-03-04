import React, { useState } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import { read_busstop_latitude_longitude, read_bus_system, read_busstop_order, read_busstop_url } from './util/bus.js';
import { searchRel2 } from './util/relations.js';
import { mapDisplay } from './util/map.js';
import { Mermaid } from './util/mermaid.js'


function App() {
    const [busStopCodeArray, setBusStopCodeArray] = useState([]);
    const [busStopCodeDict, setBusStopCodeDict] = useState({});
    const [busStopShortCodeDict, setBusStopShortCodeDict] = useState({});
    const [busStopKanaDict, setBusStopKanaDict] = useState({});
    const [busStopKanaDictShort, setBusStopKanaDictShort] = useState({});


    const [busstopUrlDict, setBusstopUrlDict] = useState({});
    const [busSystemArray, setBusSystemArray] = useState([]);
    const [busSystemDict, setBusSystemDict] = useState({});
    const [busstopOrderList, setBusstopOrderList] = useState([]);
    const [busstopRelList, setBusstopRelList] = useState([]);
    const [text, setText] = useState("");
    const [queryValue, setQueryValue] = useState("");
    const [posSeries, setPosSeries] = useState([]);
    const [graphMermaid, setGraphMermaid] = useState(<></>);
    const [mermaidData, setMermaidData] = useState("graph TB;");
    // const ref = useRef(null);

    console.log("App()");

    if (busStopCodeArray.length === 0) {
        fetch(`${process.env.PUBLIC_URL}/data/bus/busstop-latitude-longitude.csv`)
            .then(response => response.text())
            .then(csv => {
                const [r1, r2, r3, r4, r5] = read_busstop_latitude_longitude(csv);
                setBusStopCodeArray(r1);
                setBusStopCodeDict(r2);
                setBusStopShortCodeDict(r3);
                setBusStopKanaDict(r4);
                setBusStopKanaDictShort(r5);
            })
            .catch(error => console.error('Error fetching data:', error));
    }
    if (Object.keys(busstopUrlDict).length === 0) {
        fetch(`${process.env.PUBLIC_URL}/data/bus/busstop-url.csv`)
            .then(response => response.text())
            .then(csv => {
                const r = read_busstop_url(csv);
                setBusstopUrlDict(r);
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    if (busSystemArray.length === 0) {
        fetch(`${process.env.PUBLIC_URL}/data/bus/bus-startend.csv`)
            .then(response => response.text())
            .then(csv => {
                const [r1, r2] = read_bus_system(csv);
                setBusSystemArray(r1);
                setBusSystemDict(r2);
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    if (busstopOrderList.length === 0) {
        fetch(`${process.env.PUBLIC_URL}/data/bus/busstop-order.csv`)
            .then(response => response.text())
            .then(csv => {
                const [r1, r2] = read_busstop_order(csv, busStopCodeDict);
                setBusstopOrderList(r1);
                setBusstopRelList(r2);
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    // 以下の関数は、停留所コードから「停留所名（停留所かな）:停留所コード」の形式の文字列に変換する関数
    const busstopCode2str = (busstopCode) => {
        // グラフ描画でのラベルには乗り降りの場所の情報を含めない停留所コードを使用する。
        const id = busstopCode;
        return 'obj' + id + '(["`' + busStopShortCodeDict[busstopCode]["busstopKana"] + "<br>" + busStopShortCodeDict[busstopCode]["busstopName"] + '`"])';
    };

    const pathToMermaid = (path) => {
        const isDebug = false;
        let output = "";

        console.log("CHECK");

        // 注:
        // TB (または TD )で上から下へのグラフ
        // LR で左から右へのグラフになります
        output += ("graph TB;");
        output += ("\n")
        path.forEach(([busstopCode1, busstopCode2, rel]) => {
            // console.log("rel", rel);
            const systemKey = rel["systemKey"];

            // console.log("systemKey", systemKey);
            const system = busSystemDict[systemKey];
            const via = system["via"] === "" ? "" : "-" + system["via"];
            const systemDisp = system["systemSymbol"] + ":" + system["start"] + "-" + system["end"]
                + via
                + (isDebug ? ("-" + system["directionCode"]) : (""));

            output += ("    " + busstopCode2str(busstopCode1) + " -- " + systemDisp + " --> " + busstopCode2str(busstopCode2));
            output += ("\n")
        });

        return output;
    }

    const updateQueryValue = (text) => {
        // 地図上にプロットするlat, lng の系列
        const workPosSeries = [];
        let mermaidData = 'graph TB;';
        if (text.includes(" ")) {
            const splited = text.split(" ");
            // 出発
            const busstopKanaFrom = splited[0];
            // 到着
            const busstopKanaTo = splited[1];
            if ((busstopKanaFrom in busStopKanaDict) && (busstopKanaTo in busStopKanaDict)) {
                // 経路の探索をする
                const busstopCodeSetFrom = busStopKanaDict[busstopKanaFrom];
                const busstopCodeSetTo = busStopKanaDict[busstopKanaTo];
                const r = searchRel2(busstopRelList, "busstopCode1", "busstopCode2", "relation",
                    "next", [], // categoriesは使わない
                    false, // 対称的な関係ではない
                    busstopCodeSetFrom, busstopCodeSetTo)

                // 地図プロット用のデータを作る
                const subSeries = [];
                const path = r["route"];
                for (let index = 0; index < path.length; index++) {
                    const [_, __, rel] = path[index];
                    subSeries.push([busStopCodeDict[rel["busstopCode1Detail"]]["latitude"], busStopCodeDict[rel["busstopCode1Detail"]]["longitude"]]);
                    // console.log("pos", subSeries[workPosSeries.length - 1]);
                    subSeries.push([busStopCodeDict[rel["busstopCode2Detail"]]["latitude"], busStopCodeDict[rel["busstopCode2Detail"]]["longitude"]]);

                    // console.log("pos", subSeries[workPosSeries.length - 1]);
                }
                workPosSeries.push(subSeries);
                console.log("updated 1", "path.length = ", path.length, "workPosSeries.length = ", workPosSeries.length);

                // 有向グラフ表示用のデータを作る
                mermaidData = pathToMermaid(path);
            }
        }
        else {
            if (text.match(/^[,\d]+$/) != null) {
                // 路線データを取り出す
                // console.log("経路", text);
                const routeId = text;
                const routeData = busstopRelList.filter(rel => {
                    return rel["systemKey"].startsWith(routeId)
                });

                // 地図プロット用のデータを作る
                // console.log("routeData.length", routeData.length);
                const work = routeData.map(rel => {
                    const code1 = rel["busstopCode1Detail"];
                    const code2 = rel["busstopCode2Detail"];
                    const latlng1 = busStopCodeDict[code1];
                    const latlng2 = busStopCodeDict[code2];
                    return [[latlng1["latitude"], latlng1["longitude"]], [latlng2["latitude"], latlng2["longitude"]]]
                });
                // workPosSeries.push([])
                work.forEach(x => { workPosSeries.push(x) });

                // 有向グラフ表示用のデータを作る
                const path = routeData.map(rel => {
                    const code1 = rel["busstopCode1"];
                    const code2 = rel["busstopCode2"];
                    return [code1, code2, rel]
                });
                mermaidData = pathToMermaid(path);
            }
        }
        console.log("updated 0");
        setQueryValue(text);
        setPosSeries(workPosSeries);

        console.log("mermaidData is :", mermaidData);

        console.log("render start" + (new Date()));
        const data = mermaidData;
        setMermaidData(data);
    }

    const splitedText = text.split(" ");

    // バス停留場をフィルタする
    const filterFunc =
        (busstop, x) => {
            if (x.length === 0) {
                return false;
            }
            if (x === "すべて") {
                if (busstop["latitude"] == null || busstop["longitude"] == null) {
                    return false;
                }
                if (parseFloat(isNaN(busstop["latitude"])) || isNaN(parseFloat(busstop["longitude"]))) {
                    return false;
                }
                return true;
            }
            if (busstop["busstopName"].includes(x)) {
                return true;
            }
            if (busstop["busstopKana"] && busstop["busstopKana"].includes(x)) {
                return true;
            }

            return false;
        }
    let busstopList = [];
    for (let index = 0; index < splitedText.length; index++) {
        busstopList = busstopList.concat(busStopCodeArray.filter(busstop => (filterFunc(busstop, splitedText[index]))));
    }

    return (<>
        <h3>名古屋市の市バスを調べる</h3>
        アルゴリズムの紹介の意味で名古屋市の市バスの経路探索を実演します。<br/>
        名古屋市交通局によりCreative Commons Attribution 4.0 Internationalで公開されたオープンデータを使用しています(<a href="./public/data/bus/LICENSE.txt" target="_blank">詳細</a>)<br/>
        <input value={text} style={{"width": "200px"}} onChange={(event) => { setText(event.target.value) }} />
        <button onClick={() => { updateQueryValue(text) }}>ボタン</button>
        <br />
        {mapDisplay(busstopList, posSeries)}
        <Mermaid src={mermaidData}/>
    </>);
}

export default App;

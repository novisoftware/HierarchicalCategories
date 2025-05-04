import React, { useEffect, useState } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import { read_busstop_latitude_longitude, read_bus_system, read_busstop_order, read_busstop_url } from './util/bus.js';
import { searchRel2 } from './util/relations.js';
import { mapDisplay } from './util/map.js';
import { Mermaid } from './util/mermaid.js'

const emptyMermaidData = "graph TB;";

function App() {
    // バス経路情報
    const [busStopCodeArray, setBusStopCodeArray] = useState([]);
    const [busStopCodeDict, setBusStopCodeDict] = useState({});
    const [busStopShortCodeDict, setBusStopShortCodeDict] = useState({});
    const [busStopKanaDict, setBusStopKanaDict] = useState({});
    const [busStopKanaDictShort, setBusStopKanaDictShort] = useState({});
    const [busstopUrlDict, setBusstopUrlDict] = useState({});
    const [busSystemArray, setBusSystemArray] = useState([]);
    const [busSystemDict, setBusSystemDict] = useState({});
    const [systemSymbolList, setSystemSymbolList] = useState([]);
    const [busstopOrderList, setBusstopOrderList] = useState([]);
    const [busstopRelList, setBusstopRelList] = useState([]);
    const [ini1, setIni1] = useState(false);
    const [ini2, setIni2] = useState(false);
    const [ini3, setIni3] = useState(false);
    const [ini4, setIni4] = useState(false);
    // 地図上のバス停表示
    const [busstopList, setBusstopList] = useState([]);
    const [busSystemFilter, setBusSystemFilter] = useState(null);
    const [busSystemFilterWork, setBusSystemFilterWork] = useState("");
    const [filterMessage, setFilterMessage] = useState("絞り込みなし");
    // 検索テキスト
    const [text, setText] = useState("");
    // 検索用内部文字列
    const [queryValue, setQueryValue] = useState("");
    // 地図上への線分描画用データ
    const [posSeries, setPosSeries] = useState([]);
    // グラフ表示用データ
    const [mermaidData, setMermaidData] = useState(emptyMermaidData);

    console.log("App()");

    useEffect(() => {
        fetch(`${process.env.PUBLIC_URL}/data/bus/busstop-latitude-longitude.csv`)
            .then(response => response.text())
            .then(csv => {
                const [r1, r2, r3, r4, r5] = read_busstop_latitude_longitude(csv);
                setBusStopCodeArray(r1);
                setBusStopCodeDict(r2);
                setBusStopShortCodeDict(r3);
                setBusStopKanaDict(r4);
                setBusStopKanaDictShort(r5);

                // busstop-latitude-longitude.csv の解析結果を使用し、busstop-order.csv を解析する。
                // このため fetch を入れ子にしている。
                const busStopCodeDictWork = r2;
                fetch(`${process.env.PUBLIC_URL}/data/bus/busstop-order.csv`)
                    .then(response => response.text())
                    .then(csv => {
                        const [r6, r7] = read_busstop_order(csv, busStopCodeDictWork);
                        setBusstopOrderList(r6);
                        setBusstopRelList(r7);
                        setIni1(true);
                    })
                    .catch(error => console.error('Error fetching data:', error));
            })
            .catch(error => console.error('Error fetching data:', error));
        fetch(`${process.env.PUBLIC_URL}/data/bus/busstop-url.csv`)
            .then(response => response.text())
            .then(csv => {
                const r = read_busstop_url(csv);
                setBusstopUrlDict(r);
                setIni2(true);
            })
            .catch(error => console.error('Error fetching data:', error));
        fetch(`${process.env.PUBLIC_URL}/data/bus/bus-startend.csv`)
            .then(response => response.text())
            .then(csv => {
                const [r1, r2, r3] = read_bus_system(csv);
                setBusSystemArray(r1);
                setBusSystemDict(r2);
                setSystemSymbolList(r3);
                setIni3(true);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, [ini1, ini2, ini3]);

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
        path.forEach(([busstopCode1, busstopCode2, rels]) => {
            rels.forEach((rel) => {
                // console.log("rel", rel);
                const systemKey = rel["systemKey"];

                console.log("systemKey = " + systemKey);

                // console.log("systemKey", systemKey);
                const system = busSystemDict[systemKey];
                const via = system["via"] === "" ? "" : "-" + system["via"];
                const systemDisp = system["systemSymbol"] + ":" + system["start"] + "-" + system["end"]
                    + via
                    + (isDebug ? ("-" + system["directionCode"]) : (""));

                output += ("    " + busstopCode2str(busstopCode1) + " -- " + systemDisp + " --> " + busstopCode2str(busstopCode2));
                output += ("\n")
            })
        });

        return output;
    }

    // バス停留場をフィルタする関数
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

    const getBusstopList = (splited) => {
        let busstopListWork = [];
        for (let index = 0; index < splited.length; index++) {
            busstopListWork = busstopListWork.concat(busStopCodeArray.filter(busstop => (filterFunc(busstop, splited[index]))));
        }
        console.log("busstopList length = " + busstopList.length);
        return busstopListWork;
    }

    const updateQueryValue = (text) => {
        console.log("updateQueryValue text = " + text);
        console.log("busstopRelList.length = " + busstopRelList.length);
        // 地図上にプロットするlat, lng の系列
        const workPosSeries = [];
        let mermaidData = emptyMermaidData;

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
                    busstopCodeSetFrom, busstopCodeSetTo,
                    busStopShortCodeDict // デバッグ用バス停コードリスト
                )

                // 地図プロット用のデータを作る
                // let subSeries = [];
                const path = r["route"];
                let lastBusStop = null;
                const busStopCodeSet = new Set();

                for (let index = 0; index < path.length; index++) {
                    const [_, __, rels] = path[index];
                    const relArray = Array.from(rels);

                    rels.forEach((rel) => {
                        const pos1 = [busStopCodeDict[rel["busstopCode1Detail"]]["latitude"], busStopCodeDict[rel["busstopCode1Detail"]]["longitude"]];
                        const pos2 = [busStopCodeDict[rel["busstopCode2Detail"]]["latitude"], busStopCodeDict[rel["busstopCode2Detail"]]["longitude"]];

                        workPosSeries.push(["bus", [pos2, pos1]]);

                        busStopCodeSet.add(rel["busstopCode1Detail"]);
                        busStopCodeSet.add(rel["busstopCode2Detail"]);
                    });

                    setBusstopList(Array.from(busStopCodeSet).map(code => (busStopCodeDict[code])));

                    lastBusStop = new Set();
                    rels.forEach((rel) => {
                        lastBusStop = lastBusStop.union(new Set(rel["busstopCode2Detail"]));
                    });

                    // console.log("pos", subSeries[workPosSeries.length - 1]);
                }
                // workPosSeries.push(["bus", subSeries]);
                console.log("updated 1", "path.length = ", path.length, "workPosSeries.length = ", workPosSeries.length);

                // 有向グラフ表示用のデータを作る
                mermaidData = pathToMermaid(path);
            }
        }
        else {
            if (text.match(/^[,\d]+$/) == null) {
                const splited = [text];
                setBusstopList(getBusstopList(splited));
            } else {
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
                    return ["bus", [[latlng1["latitude"], latlng1["longitude"]], [latlng2["latitude"], latlng2["longitude"]]]]
                });
                // workPosSeries.push([])
                work.forEach(x => { workPosSeries.push(x) });

                // ピン表示
                const busstopSet = new Set();
                const busstopListWork1 = [];
                routeData.map(rel => {
                    const code1 = rel["busstopCode1Detail"];
                    const code2 = rel["busstopCode2Detail"];
                    if (!busstopSet.has(code1)) {
                        busstopSet.add(code1);
                        busstopListWork1.push(code1);
                    }
                    if (!busstopSet.has(code2)) {
                        busstopSet.add(code2);
                        busstopListWork1.push(code2);
                    }
                });
                const busstopListWork2 = busstopListWork1.map(code => (busStopCodeDict[code]));
                setBusstopList(busstopListWork2);

                // 有向グラフ表示用のデータを作る
                // （無意味だし見づらくなるので、やっぱり作らない）
                /*
                const path = routeData.map(rel => {
                    const code1 = rel["busstopCode1"];
                    const code2 = rel["busstopCode2"];
                    return [code1, code2, new Set([rel])]
                });
                mermaidData = pathToMermaid(path);
                */
                mermaidData = emptyMermaidData;
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

    const filteredSystemSymbolMap = (busSystemFilter) => {
        const workMap = {};

        systemSymbolList.map(systemSymbol => {
            const busSystemArrayWork = busSystemArray.filter(s => (s["systemSymbol"] === systemSymbol));
            // 停留所を入力して、バス系統を絞り込む場合
            const work2 = busSystemArrayWork.filter(s => {
                const code = s["systemCode"] + "," + s["routeCode"] + "," + s["directionCode"];
                const routeData = busstopRelList.filter(rel => {
                    return rel["systemKey"].startsWith(code)
                });
                if (routeData.filter(rel => (
                    rel["busstopCode1"] === busSystemFilter ||
                    rel["busstopCode2"] === busSystemFilter
                )).length > 0) {
                    return true;
                }
                return false;
            });

            /*
            if (work2.length > 0) {
                console.log("work2.length = " + work2.length + "   (" + systemSymbol + ")");               
            } else {
                console.log("work2.length = " + work2.length);
            }
            */
            if (work2.length > 0) {
                workMap[systemSymbol] = work2;
            }
        });

        return workMap;
    }


    return (<>
        <div style={{ padding: "0 10px 0 10px" }}>
            <h3>名古屋市の市バスを調べてみよう</h3>
            アルゴリズムの実演の意味で名古屋市の市バスについて調べます。情報の正確性、完全性、最新性について一切の責を負いません。<br />
            経路の表示はバス停留所を直線で結んでいます(走行する道路のデータはないため)<br />
            データ中に含まれる深夜バスは当面休止中とのことです(2025年現在)。<br />
            名古屋市交通局によりCreative Commons Attribution 4.0 Internationalで公開されたオープンデータを使用しています(<a href="https://github.com/novisoftware/HierarchicalCategories/blob/main/demo/map-app/README.md" target="_blank">詳細</a>)<br />
            テキスト入力欄に停留所名を入力すると、部分一致する停留所の情報を表示します。<br />
            テキスト入力欄に出発停留所名と到着停留所名をスペースで区切って入力すると経路を表示します（完全一致する停留所）。<br />
            例）「いけした やだ」<br />

            {/* 以下は、バス停留所名を入力するテキストボックス */}
            <input value={text} style={{ "width": "200px" }} onChange={(event) => { setText(event.target.value) }} />
            <button onClick={() => { updateQueryValue(text); }}>調べる</button>
            <button onClick={() => { setText(""); updateQueryValue(""); }}>クリア</button>
            <br />
        </div>
        {mapDisplay(busstopList, posSeries)}
        <Mermaid src={mermaidData} />
        <div style={{ padding: "0 10px 0 10px" }}>
            <h3>バス系統を調べる</h3>
            <p>系統名は、系統記号の右に<span style={{ background: "#A0A0FF", margin: "0.5em", whiteSpace: "nowrap", paddingRight: "0.5em", paddingLeft: "0.5em", borderRadius: "1em" }}>起点 - 終点 経由地 方向</span>で示しています。
                系統名をクリックすると、地図上に経路を表示します。
                <br />
                バス系統をバス停留所で絞り込むことができます(&nbsp;
                <input value={busSystemFilterWork} style={{ "width": "200px" }} onChange={(event) => { setBusSystemFilterWork(event.target.value) }} />
                <button onClick={() => {
                    const busStop = busStopCodeArray.filter((x) => (x["busstopName"] === busSystemFilterWork || x["busstopKana"] === busSystemFilterWork));
                    if (busStop.length > 0) {
                        const filterCode = busStop[0]["busstopCodeShort"];
                        const filterd = filteredSystemSymbolMap(filterCode)
                        setBusSystemFilter(filterd);
                        console.log("busstop found. len = " + busStop.length);
                        console.log("code = " + busStop[0]["busstopCodeShort"]);
                        console.log("filtered keys = " + Array.from(Object.keys(filterd)).length);
                        setFilterMessage("バス停留所「" + busStopShortCodeDict[filterCode]["busstopName"] + "(" + busStopShortCodeDict[filterCode]["busstopKana"] + ")」で絞り混み");
                    }
                    else {
                        console.log("busstop not found. len == " + busStop.length);
                        setBusSystemFilter(null);
                        setFilterMessage("該当なし");
                    }
                }}>バス系統絞り込み</button>
                <button onClick={() => {
                    setBusSystemFilterWork("");
                    setBusSystemFilter(null);
                    setFilterMessage("絞り込みなし");
                }}>クリア</button>
                &nbsp;)
            </p>
            <div style={{ width: "100%", height: "250px", "border": "1px solid #000000", overflowY: "scroll" }}>
                {filterMessage}
                <ul>
                    {
                        systemSymbolList.map(systemSymbol => {
                            const busSystemArrayWork = (() => {
                                if (busSystemFilter !== null) {
                                    if (systemSymbol in busSystemFilter) {
                                        return busSystemFilter[systemSymbol];
                                    } else {
                                        return null;
                                    }
                                } else {
                                    return busSystemArray.filter(s => (s["systemSymbol"] === systemSymbol));
                                }
                            })();

                            if (busSystemArrayWork == null) {
                                console.log("busSystemArrayWork is null");
                                // バス系統の中で一つも該当する路線がなかった場合、バス系統自体表示しない
                                return <></>;
                            }
                            console.log("busSystemArrayWork is not null");

                            const work2 = busSystemArrayWork.map(s => {
                                const code = s["systemCode"] + "," + s["routeCode"] + "," + s["directionCode"];
                                return <a key={code} onClick={() => {
                                    updateQueryValue(code);
                                    // updateQueryValue("いけした");
                                }}><span style={{ background: queryValue === code ? "#7070FF" : "#A0A0FF", margin: "0.5em", whiteSpace: "nowrap", paddingRight: "0.5em", paddingLeft: "0.5em", borderRadius: "1em" }}>{s["start"]} - {s["end"]} {s["via"]} {s["directionCode"]}</span></a>;
                            });
                            return (
                                <li key={systemSymbol}>
                                    {systemSymbol}
                                    &nbsp;
                                    {work2}
                                </li>
                            );
                        })
                    }
                </ul>
            </div>
            <br />
        </div>
    </>);
}

export default App;

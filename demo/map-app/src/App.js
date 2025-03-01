// import logo from './logo.svg';
// import React, { useEffect, useState } from 'react';
import Leaflet from 'leaflet'
import React, { Component, useEffect, useState } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
// import MapDisplay from './Map.js'
// import {expandCategories, superordinateCategory} from './categories.js';
import { read_busstop_latitude_longitude, read_bus_system, read_busstop_order, read_busstop_url} from './util/bus.js';
import { searchRel2 } from './util/categories.js';

Leaflet.Icon.Default.imagePath =
    '//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/'


function mapDisplay(busstopList, posSeries) {
    // 座標の初期値
    let position = [35.158478, 136.938949];

    console.log("配列の長さ", busstopList.length)
    busstopList.forEach((busStop) => {
        console.log("位置", busStop["latitude"], busStop["longitude"])
    });

    return (
        <MapContainer center={position} zoom={13}
            boxZoom={true}
            doubleClickZoom={false}
            maxZoom={18}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <>
                {
                    busstopList.map(busStop =>
                        <Marker key={busStop["latitude"] + "_" + busStop["longitude"]} position={[parseFloat(busStop["latitude"]), parseFloat(busStop["longitude"])]}>
                            <Popup>
                                {busStop["busstopKana"]}<br />
                                {busStop["busstopName"]}<br />
                                {busStop["busstopMemo"]}
                            </Popup>
                        </Marker>
                    )
                }
            </>
            <>
                {
                    posSeries.length === 0 ?
                        <></>
                    :
                        <Polyline pathOptions={{"color": "blue"}} positions={posSeries} />
                }
            </>
        </MapContainer>);
}


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

    console.log("App()");

    if (busStopCodeArray.length === 0) {
        console.log("check 1");
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
        console.log("check 2");
        fetch(`${process.env.PUBLIC_URL}/data/bus/busstop-url.csv`)
            .then(response => response.text())
            .then(csv => {
                const r = read_busstop_url(csv);
                setBusstopUrlDict(r);
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    if (busSystemArray.length === 0) {
        console.log("check 3");
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
        console.log("check 4");
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
        console.log("busstopCode", busstopCode)
        // グラフ描画には乗り降りの場所の情報を含めない停留所コードを使用する。
        const id = busstopCode;
        console.log("id", id);
        console.log("B", busStopShortCodeDict[busstopCode])
        return 'obj' + id + '(["`' + busStopShortCodeDict[busstopCode]["busstopKana"] + "<br>"+ busStopShortCodeDict[busstopCode]["busstopName"] + '`"])';
    };
    
    const updateQueryValue = (text) => {
        const workPosSeries = [];
        if (text.includes(" ")) {
            const splited = text.split(" ");
            // 出発
            const busstopKanaFrom = splited[0];
            // 到着
            const busstopKanaTo = splited[1];
            if ((busstopKanaFrom in busStopKanaDict) && (busstopKanaTo in busStopKanaDict)) {
                const busstopCodeSetFrom = busStopKanaDict[busstopKanaFrom];
                const busstopCodeSetTo = busStopKanaDict[busstopKanaTo];
                const r = searchRel2(busstopRelList, "busstop_code1", "busstop_code2", "relation",
                    "next", [], // categoriesは使わない
                    true,
                    false,
                    busstopCodeSetFrom, busstopCodeSetTo)
                
                const lineSeries = []
                    // traceOutput2.push([fromBusStop, toBusStop, rel]);
                const path = r["route"];
                for (let index = 0; index < path.length; index ++) {
                    const [_, __, rel] = path[index];
                    workPosSeries.push([busStopCodeDict[rel["busstop_code1_detail"]]["latitude"], busStopCodeDict[rel["busstop_code1_detail"]]["longitude"]]);
                    console.log("pos", workPosSeries[workPosSeries.length - 1]);
                    workPosSeries.push([busStopCodeDict[rel["busstop_code2_detail"]]["latitude"], busStopCodeDict[rel["busstop_code2_detail"]]["longitude"]]);
                    console.log("pos", workPosSeries[workPosSeries.length - 1]);
                }
                console.log("updated 1", "path.length = ", path.length, "workPosSeries.length = ", workPosSeries.length);
            }
        }
        console.log("updated 0");
        setQueryValue(text);
        setPosSeries(workPosSeries);
    }

    const splitedText = text.split(" ");

    const filterFunc = 
        (busstop, x) => {
            if (x.length === 0) {
                return false;
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
        <input value={text} onChange={(event) => { setText(event.target.value) }} />
        <button onClick={() => { updateQueryValue(text) }}>ボタン</button>
        <br />
        {mapDisplay(busstopList, posSeries)}
    </>);
}

export default App;

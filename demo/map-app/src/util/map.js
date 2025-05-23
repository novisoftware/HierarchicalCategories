import Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'

Leaflet.Icon.Default.imagePath =
    '//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/'


function mapDisplay(busstopList, polylineSeries) {
    // 座標の初期値
    let position = [35.158478, 136.938949];

    return (
        <MapContainer
            center={position}
            maxZoom={18}
            zoom={13}
            boxZoom={true}
            doubleClickZoom={false}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <>
                {
                    busstopList.map(busStop => {
                        const info = busStop["info"];
                        const url = busStop["url"];

                        return (<Marker key={info["latitude"] + "_" + info["longitude"] + "_" + info["busstopName"] + "_" + info["busstopMemo"]} position={[parseFloat(info["latitude"]), parseFloat(info["longitude"])]}>
                            <Popup>
                                <a href={url} target="_blank">
                                    {info["busstopKana"]}<br />
                                    {info["busstopName"]}
                                </a>
                                <br />
                                {info["busstopMemo"]}
                            </Popup>
                        </Marker>);
                    }
                    )
                }
            </>
            <>
                {
                    polylineSeries.map(polylineData => {
                        const [kind, polyline] = polylineData;
                        const color = kind === "bus" ? "blue" : "gray";

                        return <Polyline pathOptions={{ "color": color }} positions={polyline} />
                    }
                    )
                }
            </>
        </MapContainer>);
}

export { mapDisplay };

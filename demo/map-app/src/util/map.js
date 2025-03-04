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
                    polylineSeries.map(polyline =>
                        <Polyline pathOptions={{"color": "blue"}} positions={polyline} />
                    )
                }
            </>
        </MapContainer>);
}

export {mapDisplay};

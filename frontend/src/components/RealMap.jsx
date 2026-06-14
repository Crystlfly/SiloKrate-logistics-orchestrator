import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RealMap = ({ points }) => {
  const center = [28.6139, 77.2090]; 

  return (
    <MapContainer center={center} zoom={4} scrollWheelZoom={true} className="h-full w-full z-0">
      {/* Dark-themed Map Tiles (CartoDB Dark Matter) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {points?.map((point, idx) => (
        <Marker key={idx} position={[point.latitude, point.longitude]}>
          <Popup>
            <div className="font-sans min-w-[160px]">
              
              {/* Header */}
              <h3 className="font-black text-sm text-zinc-900 m-0 leading-tight">
                {point.location_name || `Warehouse Hub`}
              </h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 mb-2 border-b border-zinc-200 pb-2">
                ID: {point.warehouse_id || 'N/A'}
              </p>

              {/* Data Rows */}
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Status</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                    point.status?.toLowerCase() === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {point.status || 'Active'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Capacity</span>
                  <span className="font-bold text-zinc-800">
                    {point.total_capacity_sqft ? point.total_capacity_sqft.toLocaleString() : '--'} sqft
                  </span>
                </div>
              </div>

            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default RealMap;
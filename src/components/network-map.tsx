import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  severity: "high" | "medium" | "low" | "ok";
};

const colors: Record<MapPoint["severity"], string> = {
  high: "#d1481f",
  medium: "#c98016",
  low: "#0b6e7a",
  ok: "#8aa7ab",
};

export default function NetworkMap({ points }: { points: MapPoint[] }) {
  const center: [number, number] = points.length
    ? [points[0]!.lat, points[0]!.lng]
    : [18.52, 73.86];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="rounded-xl"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={p.severity === "ok" ? 5 : 10}
          pathOptions={{
            color: colors[p.severity],
            fillColor: colors[p.severity],
            fillOpacity: p.severity === "ok" ? 0.5 : 0.75,
            weight: 2,
          }}
        >
          <Tooltip>{p.label}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface NewsEvent {
  title: string;
  description: string;
  date: string;
  lat: number;
  lon: number;
  severity: 'high' | 'medium' | 'low';
  type: string;
}

interface NewsEventMarkersProps {
  events: NewsEvent[];
}

export const NewsEventMarkers = ({ events }: NewsEventMarkersProps) => {
  const getEventIcon = (severity: string) => {
    let color = '#6b7280'; // gray
    if (severity === 'high') color = '#dc2626'; // red
    else if (severity === 'medium') color = '#f59e0b'; // yellow
    else if (severity === 'low') color = '#10b981'; // green

    return L.divIcon({
      className: 'custom-event-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <>
      {events.map((event, index) => (
        <Marker
          key={index}
          position={[event.lat, event.lon]}
          icon={getEventIcon(event.severity)}
        >
          <Popup>
            <div className="space-y-2 min-w-[200px]">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm">{event.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  event.severity === 'high' ? 'bg-red-100 text-red-700' :
                  event.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {event.severity}
                </span>
              </div>
              <p className="text-xs text-gray-600">{event.description}</p>
              <div className="text-xs text-gray-500">
                <div>📅 {new Date(event.date).toLocaleDateString('ar-SA')}</div>
                <div>📍 {event.lat.toFixed(4)}, {event.lon.toFixed(4)}</div>
                <div className="mt-1 px-2 py-1 bg-gray-100 rounded">
                  {event.type}
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

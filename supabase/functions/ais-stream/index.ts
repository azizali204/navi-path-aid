import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const AIS_STREAM_API_KEY = Deno.env.get('AIS_STREAM_API_KEY');
  if (!AIS_STREAM_API_KEY) {
    console.error('AIS_STREAM_API_KEY is not set');
    return new Response("Server configuration error", { status: 500 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  console.log("WebSocket connection established with client");
  
  // Connect to AISStream
  const aisSocket = new WebSocket(`wss://stream.aisstream.io/v0/stream?api-key=${AIS_STREAM_API_KEY}`);
  
  aisSocket.onopen = () => {
    console.log("Connected to AISStream");
    
    // Subscribe to Southern Red Sea area (12.3N, 42.0E → 19.5N, 46.0E)
    const subscriptionMessage = {
      APIKey: AIS_STREAM_API_KEY,
      BoundingBoxes: [
        [
          [42.0, 12.3], // Southwest corner [lon, lat]
          [46.0, 19.5]  // Northeast corner [lon, lat]
        ]
      ]
    };
    
    aisSocket.send(JSON.stringify(subscriptionMessage));
    console.log("Sent subscription to Southern Red Sea area");
  };

  aisSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Extract relevant ship data
      if (data.MessageType === "PositionReport" && data.Message?.PositionReport) {
        const report = data.Message.PositionReport;
        const metadata = data.MetaData;
        
        const shipData = {
          mmsi: metadata?.MMSI,
          lat: report.Latitude,
          lon: report.Longitude,
          cog: report.Cog, // Course over ground
          sog: report.Sog, // Speed over ground
          type: metadata?.ShipType,
          name: metadata?.ShipName,
          timestamp: metadata?.time_utc
        };
        
        // Forward to client if valid position
        if (shipData.lat && shipData.lon) {
          socket.send(JSON.stringify(shipData));
        }
      }
    } catch (error) {
      console.error("Error processing AIS message:", error);
    }
  };

  aisSocket.onerror = (error) => {
    console.error("AISStream error:", error);
  };

  aisSocket.onclose = () => {
    console.log("AISStream connection closed");
    socket.close();
  };

  socket.onclose = () => {
    console.log("Client disconnected");
    aisSocket.close();
  };

  socket.onerror = (error) => {
    console.error("Client socket error:", error);
    aisSocket.close();
  };

  return response;
});

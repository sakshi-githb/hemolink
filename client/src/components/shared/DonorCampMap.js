import React, { useEffect, useRef } from "react";

const DonorCampMap = ({ camps }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) {
          resolve(window.L);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => resolve(window.L);
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then((L) => {
      if (!mapRef.current) return;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [18.52, 73.85],
          zoom: 12,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (!camps || camps.length === 0) return;

      const redIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:32px;height:32px;border-radius:50% 50% 50% 0;
          background:linear-gradient(135deg,#9333ea,#ec4899);
          transform:rotate(-45deg);border:2px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const bounds = [];

      camps.forEach(async (camp) => {
        try {
          const query = encodeURIComponent(camp.address + ", India");
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
            { headers: { "Accept-Language": "en" } },
          );
          const results = await res.json();
          if (results && results.length > 0) {
            const { lat, lon } = results[0];
            const latlng = [parseFloat(lat), parseFloat(lon)];
            bounds.push(latlng);

            const marker = L.marker(latlng, { icon: redIcon }).addTo(map)
              .bindPopup(`
                <div style="font-family:sans-serif;min-width:190px;">
                  <div style="font-weight:700;font-size:14px;margin-bottom:6px;">🏕️ ${camp.campName}</div>
                  <div style="font-size:12px;color:#444;margin-bottom:3px;">📍 ${camp.address}</div>
                  <div style="font-size:12px;color:#444;margin-bottom:3px;">📅 ${camp.date} at ${camp.time}</div>
                  <div style="font-size:12px;color:#7c3aed;font-weight:600;">🏥 ${camp.organisation?.organisationName || ""}</div>
                </div>
              `);

            markersRef.current.push(marker);

            if (bounds.length > 0) {
              try {
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
              } catch (e) {}
            }
          }
        } catch (err) {
          console.log("Geocode error:", camp.address, err);
        }
      });
    });
  }, [camps]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: 360,
          borderRadius: 16,
          border: "1px solid rgba(168,85,247,0.25)",
          overflow: "hidden",
          zIndex: 1,
          position: "relative",
        }}
      />
      {(!camps || camps.length === 0) && (
        <div
          style={{
            textAlign: "center",
            padding: "12px 0",
            fontSize: 13,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          No camps to show on map yet
        </div>
      )}
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
          marginTop: 6,
          textAlign: "right",
        }}
      >
        📍 Click any pin for camp details · © OpenStreetMap
      </div>
    </div>
  );
};

export default DonorCampMap;

import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { ref, set, onValue } from "firebase/database";
import { database } from "./firebase";

export default function Map() {
  const [userId, setUserId] = useState(""); // Current user ID
  const [trackingId, setTrackingId] = useState(""); // ID of the user to track
  const [mapInstance, setMapInstance] = useState(null); // Leaflet map instance
  const [currentLocation, setCurrentLocation] = useState(null); // Current user's location
  const [routingControl, setRoutingControl] = useState(null); // Routing control instance
  const [distance, setDistance] = useState(0); // Distance between users

  // Fix default marker icon
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, []);

  // Initialize the map
  useEffect(() => {
    const container = L.DomUtil.get("map");
    if (container != null) {
      container._leaflet_id = null; // Prevent reinitialization error
    }

    const map = L.map("map", {
      center: [51.505, -0.09],
      zoom: 13,
      doubleClickZoom: false, // Disable double-click zoom
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    setMapInstance(map);
  }, []);

  // Function to save the current user's location in Firebase
  const handleSaveLocation = () => {
    if (!userId) {
      alert("Please enter your User ID.");
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          const userRef = ref(database, `users/${userId}`);
          set(userRef, { latitude, longitude })
            .then(() => {
              alert(`User ID ${userId} and location saved successfully!`);
              setCurrentLocation([latitude, longitude]); // Save the user's location
              L.marker([latitude, longitude])
                .addTo(mapInstance)
                .bindPopup(`User: ${userId}`)
                .openPopup(); // Add marker for the current user
            })
            .catch((error) => {
              console.error("Error saving location:", error);
            });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not retrieve your location. Please enable location services.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Function to track another user's location and display the route in real-time
  const handleTrackUser = () => {
    if (!trackingId) {
      alert("Please enter a User ID to track.");
      return;
    }

    const trackedUserRef = ref(database, `users/${trackingId}`);
    onValue(trackedUserRef, (snapshot) => {
      if (snapshot.exists() && currentLocation) {
        const { latitude: trackedLat, longitude: trackedLng } = snapshot.val();

        // Remove previous routing control
        if (routingControl) {
          mapInstance.removeControl(routingControl);
        }

        // Add marker for the tracked user
        const trackedMarker = L.marker([trackedLat, trackedLng])
          .addTo(mapInstance)
          .bindPopup(`User: ${trackingId}`)
          .openPopup();

        // Calculate the distance between the users
        const currentLatLng = L.latLng(currentLocation[0], currentLocation[1]);
        const trackedLatLng = L.latLng(trackedLat, trackedLng);
        const calculatedDistance = currentLatLng.distanceTo(trackedLatLng) / 1000; // Convert to km
        setDistance(calculatedDistance.toFixed(2));

        // Add a new route to the map
        const newRoutingControl = L.Routing.control({
          waypoints: [currentLatLng, trackedLatLng],
          routeWhileDragging: true,
        }).addTo(mapInstance);

        setRoutingControl(newRoutingControl); // Save the routing control instance
      } else {
        alert("Tracked user not found or your location is not set.");
      }
    });
  };

  return (
    <div className="w-full mx-auto p-5">
      {/* Step 1: Save Current User's Location */}
      <div className="flex max-w-[90%] mx-auto flex-col gap-4 mb-5">
        <label className="flex items-center gap-2">
          Enter Your User ID:
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="border border-gray-300 rounded p-2 text-black"
          />
        </label>
        <button
          onClick={handleSaveLocation}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save My Location
        </button>
      </div>

      {/* Step 2: Track Another User */}
      <div className="flex flex-col max-w-[90%] mx-auto gap-4 mb-5">
        <label className="flex items-center gap-2">
          Enter User ID to Track:
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="border border-gray-300 rounded p-2 text-black"
          />
        </label>
        <button
          onClick={handleTrackUser}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Track User
        </button>
      </div>

      {/* Distance Display */}
      {distance > 0 && (
        <div className="text-center mb-4">
          <p>Distance between users: <strong>{distance} km</strong></p>
        </div>
      )}

      {/* Map Section */}
      <div
        id="map"
        className="h-[400px] w-[90%] max-w-full border border-gray-300 z-0"
        style={{ margin: "0 auto", position: "relative" }} // Center the map horizontally
      ></div>
    </div>
  );
}

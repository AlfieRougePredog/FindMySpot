// =====================================================
// FINDMYSPOT - MAP.JS
// Shared map code, using Leaflet.js and OpenStreetMap.
// Leaflet must load BEFORE this file, because it provides
// the "L" object used below.
// =====================================================


// ===== MAP SETTINGS =====
// The map starts here: the approximate center of Panabo City, Davao del Norte
const DEFAULT_MAP_CENTER = [7.3089, 125.6842];
const DEFAULT_MAP_ZOOM = 14;

// We remember the parking pin positions, so we can fit them all into view
let establishmentPositions = [];

// We remember the driver's pin, so pressing the button again moves it instead of adding a new one
let userLocationMarker = null;


// ===== CREATING THE MAP =====
// Draws a map inside the element with the given id
function createMap(elementId) {
  const map = L.map(elementId).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);

  // The map pictures come from OpenStreetMap.
  // The attribution text (credit) is required by OpenStreetMap, so we always show it.
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  return map;
}

// Zooms and moves the map so that all the given positions are visible
function fitMapToPositions(map, positions) {
  if (positions.length > 0) {
    map.fitBounds(positions, { padding: [40, 40], maxZoom: 16 });
  }
}


// ===== PARKING PINS =====

// Creates the round pin: green if there is space, red if the parking area is full
// (the colors are set in driver.css)
function createMarkerIcon(isAvailable) {
  return L.divIcon({
    className: "map-pin " + (isAvailable ? "has-space" : "is-full"),
    iconSize: [26, 26],
    popupAnchor: [0, -14]
  });
}

// Creates the content of the popup that opens when a pin is clicked.
// onSelect runs when "View Details" is clicked.
// onDirections runs when "Get Directions" is clicked.
function createPopupContent(establishment, onSelect, onDirections) {
  const availableCount = countAvailableSlots(establishment);
  const totalCount = establishment.slots.length;
  const statusClass = availableCount > 0 ? "has-space" : "is-full";

  const popup = document.createElement("div");
  popup.className = "map-popup";

  // Button 1: View Details
  const detailsButton = createTextElement("button", "btn btn-outline btn-small map-popup-button", "View Details");
  detailsButton.type = "button";
  detailsButton.addEventListener("click", function () {
    onSelect(establishment);
  });

  // Button 2: Get Directions
  const directionsButton = createTextElement("button", "btn btn-primary btn-small map-popup-button", "Get Directions");
  directionsButton.type = "button";
  directionsButton.addEventListener("click", function () {
    onDirections(establishment);
  });

  popup.append(
    createTextElement("strong", "map-popup-name", establishment.name),
    createTextElement("span", "map-popup-status " + statusClass, getAvailabilityText(availableCount, totalCount)),
    createTextElement("span", "map-popup-address", establishment.address),
    detailsButton,
    directionsButton
  );

  return popup;
}

// Adds one pin for each establishment, then zooms the map to show all of them
function addEstablishmentMarkers(map, establishments, onSelect, onDirections) {
  establishmentPositions = [];

  establishments.forEach(function (establishment) {
    const position = [establishment.latitude, establishment.longitude];
    const hasSpace = countAvailableSlots(establishment) > 0;

    L.marker(position, {
      icon: createMarkerIcon(hasSpace),
      title: establishment.name
    })
      .addTo(map)
      .bindPopup(createPopupContent(establishment, onSelect, onDirections));

    establishmentPositions.push(position);
  });

  fitMapToPositions(map, establishmentPositions);
}


// ===== THE DRIVER'S OWN LOCATION =====
// Asks the browser for the driver's location (the browser asks the driver for permission first).
// showMessage is a function that shows a message to the driver: showMessage(text, isError)
function showUserLocation(map, showMessage) {

  // Some old browsers do not have this feature
  if (!navigator.geolocation) {
    showMessage("Your browser does not support finding your location.", true);
    return;
  }

  showMessage("Finding your location...", false);

  navigator.geolocation.getCurrentPosition(

    // This function runs if the location was found
    function (position) {
      const userPosition = [position.coords.latitude, position.coords.longitude];

      // Move the existing pin, or create it the first time
      if (userLocationMarker) {
        userLocationMarker.setLatLng(userPosition);
      } else {
        userLocationMarker = L.marker(userPosition, {
          icon: L.divIcon({
            className: "map-pin map-pin-user",
            iconSize: [22, 22],
            popupAnchor: [0, -12]
          }),
          title: "Your location"
        })
          .addTo(map)
          .bindPopup("You are here");
      }

      // Zoom so that both the driver and the parking pins are visible
      fitMapToPositions(map, establishmentPositions.concat([userPosition]));
      showMessage("Showing your current location.", false);
    },

    // This function runs if something went wrong
    function (error) {
      if (error.code === error.PERMISSION_DENIED) {
        showMessage("Location permission was denied. Allow location for this site in your browser settings, then try again.", true);
      } else if (error.code === error.TIMEOUT) {
        showMessage("Finding your location took too long. Please try again.", true);
      } else {
        showMessage("Your location is not available right now.", true);
      }
    },

    // Settings: ask for a precise location, and give up after 10 seconds
    { enableHighAccuracy: true, timeout: 10000 }
  );
}
// =====================================================
// FINDMYSPOT - DRIVER.JS
// JavaScript that belongs only to the driver dashboard.
// The menu switching and small helpers are in js/main.js.
// The sample parking data is in js/sample-data.js.
// The subscription rules are in js/subscription.js.
// The map code is in js/map.js.
// =====================================================

// ===== DRIVER LOGIN PROTECTION =====
const currentDriver = requireRole("driver", "../login.html");

if (!currentDriver) {
  throw new Error("Driver login required.");
}

// ===== SHARED STATE =====
// The parking area the driver selected (null until one is chosen).
// Parking Details, Parking Slots and Directions all show this one.
let selectedEstablishment = null;


// ===== SMALL HELPERS =====

// Opens a dashboard section by "clicking" its sidebar button.
// main.js already knows how to switch sections, so we reuse it.
function goToSection(sectionName) {
  const button = document.querySelector('.sidebar-link[data-section="' + sectionName + '"]');
  if (button) {
    button.click();
  }
}

// Creates one line of information: a label on the left, the value on the right
function createDetailRow(label, value) {
  const row = document.createElement("div");
  row.className = "detail-row";
  row.append(
    createTextElement("span", "detail-label", label),
    createTextElement("span", "detail-value", value)
  );
  return row;
}

// Creates the green or red availability badge
function createAvailabilityBadge(establishment) {
  const availableCount = countAvailableSlots(establishment);
  const totalCount = establishment.slots.length;
  const badgeClass = availableCount > 0
    ? "availability-badge has-space"
    : "availability-badge is-full";

  return createTextElement("span", badgeClass, getAvailabilityText(availableCount, totalCount));
}

// Creates a small button that runs a function when clicked
function createButton(text, className, onClick) {
  const button = createTextElement("button", className, text);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

// Builds the Google Maps link for a parking area.
// We only give Google Maps the destination. Google Maps then uses the
// driver's current location as the starting point by itself.
function createDirectionsUrl(establishment) {
  return "https://www.google.com/maps/dir/?api=1&destination=" +
    establishment.latitude + "," + establishment.longitude +
    "&travelmode=driving";
}


// ===== SELECTING A PARKING AREA =====

// Remembers the chosen parking area and fills the three panels
function selectEstablishment(establishment) {
  selectedEstablishment = establishment;
  renderDetails(establishment);
  renderSlots(establishment);
  renderDirections(establishment);
}

// Used by the "View Details" buttons
function showDetailsFor(establishment) {
  selectEstablishment(establishment);
  goToSection("parking-details");
}

// Used by the "Get Directions" buttons
function showDirectionsFor(establishment) {
  selectEstablishment(establishment);
  goToSection("directions");
}


// ===== PARKING DETAILS =====
const detailsEmpty = document.getElementById("details-empty");
const detailsPanel = document.getElementById("details-panel");

function renderDetails(establishment) {
  const actions = document.createElement("div");
  actions.className = "details-actions";
  actions.append(
    createButton("View Slots", "btn btn-outline btn-small", function () {
      goToSection("parking-slots");
    }),
    createButton("Get Directions", "btn btn-primary btn-small", function () {
      goToSection("directions");
    })
  );

  detailsPanel.replaceChildren(
    createTextElement("h3", "", establishment.name),
    createAvailabilityBadge(establishment),
    createDetailRow("Type", establishment.type),
    createDetailRow("Address", establishment.address),
    createDetailRow("Hours", establishment.hours),
    createDetailRow("Total slots", String(establishment.slots.length)),
    createDetailRow("Last updated", formatLastUpdated(establishment.lastUpdated)),
    actions
  );

  detailsEmpty.hidden = true;
  detailsPanel.hidden = false;
}

document.getElementById("details-empty-button").addEventListener("click", function () {
  goToSection("find-parking");
});


// ===== PARKING SLOTS =====
const slotsEmpty = document.getElementById("slots-empty");
const slotsPanel = document.getElementById("slots-panel");
const slotsTitle = document.getElementById("slots-title");
const slotsSummary = document.getElementById("slots-summary");
const slotsUpdated = document.getElementById("slots-updated");
const slotGrid = document.getElementById("slot-grid");

function renderSlots(establishment) {
  slotsTitle.textContent = establishment.name;
  slotsSummary.textContent = getAvailabilityText(countAvailableSlots(establishment), establishment.slots.length);
  slotsUpdated.textContent = "Last updated: " + formatLastUpdated(establishment.lastUpdated);

  // One box for each slot: green if Available, red if Occupied
  slotGrid.replaceChildren();
  establishment.slots.forEach(function (slot) {
    const isAvailable = slot.status === "available";

    const box = document.createElement("div");
    box.className = "slot-box " + (isAvailable ? "is-available" : "is-occupied");
    box.append(
      createTextElement("strong", "", slot.label),
      createTextElement("span", "", isAvailable ? "Available" : "Occupied")
    );
    slotGrid.append(box);
  });

  slotsEmpty.hidden = true;
  slotsPanel.hidden = false;
}


// ===== DIRECTIONS =====
const directionsEmpty = document.getElementById("directions-empty");
const directionsPanel = document.getElementById("directions-panel");

function renderDirections(establishment) {
  // A link that looks like a button. It opens Google Maps in a new tab.
  const mapsLink = createTextElement("a", "btn btn-primary", "Open in Google Maps");
  mapsLink.href = createDirectionsUrl(establishment);
  mapsLink.target = "_blank";
  mapsLink.rel = "noopener noreferrer";

  const actions = document.createElement("div");
  actions.className = "details-actions";
  actions.append(
    mapsLink,
    createButton("View Details", "btn btn-outline", function () {
      goToSection("parking-details");
    })
  );

  directionsPanel.replaceChildren(
    createTextElement("h3", "", establishment.name),
    createAvailabilityBadge(establishment),
    createDetailRow("Address", establishment.address),
    createDetailRow("Coordinates", establishment.latitude.toFixed(5) + ", " + establishment.longitude.toFixed(5)),
    createDetailRow("Hours", establishment.hours),
    actions,
    createTextElement(
      "p",
      "sample-note",
      "Google Maps opens in a new tab and uses your current location as the starting point. Availability is reported by parking staff and may change."
    )
  );

  directionsEmpty.hidden = true;
  directionsPanel.hidden = false;
}

document.getElementById("directions-empty-button").addEventListener("click", function () {
  goToSection("find-parking");
});


// ===== FIND PARKING: PAGE ELEMENTS =====
const searchInput = document.getElementById("parking-search");
const resultCount = document.getElementById("result-count");
const parkingList = document.getElementById("parking-list");
const noResultsMessage = document.getElementById("no-results");


// ===== FIND PARKING: BUILDING THE CARDS =====

// Creates the card for one parking establishment
function createParkingCard(establishment) {
  const card = document.createElement("article");
  card.className = "parking-card";

  const actions = document.createElement("div");
  actions.className = "details-actions";
  actions.append(
    createButton("View Details", "btn btn-outline btn-small", function () {
      showDetailsFor(establishment);
    }),
    createButton("Get Directions", "btn btn-primary btn-small", function () {
      showDirectionsFor(establishment);
    })
  );

  card.append(
    createTextElement("h3", "", establishment.name),
    createAvailabilityBadge(establishment),
    createTextElement("p", "", establishment.type),
    createTextElement("p", "", establishment.address),
    createTextElement("p", "", "Hours: " + establishment.hours),
    actions
  );

  return card;
}

// Shows a list of establishments on the page.
// totalCount is how many establishments drivers can see in total (before searching).
function renderParkingList(establishments, totalCount) {
  parkingList.replaceChildren();

  establishments.forEach(function (establishment) {
    parkingList.append(createParkingCard(establishment));
  });

  resultCount.textContent =
    "Showing " + establishments.length + " of " + totalCount + " parking areas";

  noResultsMessage.hidden = establishments.length > 0;
}


// ===== FIND PARKING: SEARCHING =====

// Filters the visible establishments by what the driver typed
function searchParking() {
  const searchText = searchInput.value.trim().toLowerCase();

  // Drivers only see establishments with a trial or an active subscription
  const visibleEstablishments = getVisibleEstablishments();

  const matches = visibleEstablishments.filter(function (establishment) {
    const name = establishment.name.toLowerCase();
    const address = establishment.address.toLowerCase();
    return name.includes(searchText) || address.includes(searchText);
  });

  renderParkingList(matches, visibleEstablishments.length);
}

searchInput.addEventListener("input", searchParking);

// Show all visible parking areas when the page first loads
searchParking();


// ===== INTERACTIVE MAP =====
const locateButton = document.getElementById("locate-button");
const mapMessage = document.getElementById("map-message");

// The map stays empty (null) until the Interactive Map section is opened for the first time.
// A map cannot be drawn inside a hidden section, so we wait.
let parkingMap = null;

// Shows a message next to the "Show My Location" button (in red if it is an error)
function setMapMessage(text, isError) {
  mapMessage.textContent = text;
  mapMessage.classList.toggle("error", isError);
}

// Runs every time the Interactive Map section is opened
function openMapSection() {
  if (parkingMap === null) {
    // First time: draw the map and add the pins (only for visible establishments)
    parkingMap = createMap("parking-map");
    addEstablishmentMarkers(parkingMap, getVisibleEstablishments(), showDetailsFor, showDirectionsFor);
  } else {
    // Opened again: tell the map to measure its box again
    parkingMap.invalidateSize();
  }
}

// main.js announces every section that opens. We only care about the map section.
document.addEventListener("sectionchange", function (event) {
  if (event.detail === "map") {
    openMapSection();
  }
});

// When the button is clicked, find and show the driver's location
locateButton.addEventListener("click", function () {
  showUserLocation(parkingMap, setMapMessage);
});


// ===== DASHBOARD NUMBER CARDS =====
function updateDriverStats() {
  const visible = getVisibleEstablishments();
  let availableTotal = 0;
  let occupiedTotal = 0;

  visible.forEach(function (establishment) {
    const available = countAvailableSlots(establishment);
    availableTotal += available;
    occupiedTotal += establishment.slots.length - available;
  });

  renderStatCards([
    { label: "Parking areas", value: visible.length, note: "Visible to drivers" },
    { label: "Available slots", value: availableTotal, note: "Reported by staff", tone: "good" },
    { label: "Occupied slots", value: occupiedTotal, note: "Reported by staff", tone: "bad" }
  ]);
}

updateDriverStats();
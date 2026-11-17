
/* =====================================================
   FINDMYSPOT - STAFF.JS
   Staff dashboard, subscription, and slot management.
   ===================================================== */


// ===== SUBSCRIPTION ELEMENTS =====
const trialNotice = document.getElementById("trial-notice");
const subscriptionCard = document.getElementById("subscription-card");
const subscriptionStatus = document.getElementById("subscription-status");
const subscriptionEstablishment = document.getElementById("subscription-establishment");
const subscriptionDays = document.getElementById("subscription-days");
const subscriptionExpiryLabel = document.getElementById("subscription-expiry-label");
const subscriptionExpiry = document.getElementById("subscription-expiry");
const subscriptionPrice = document.getElementById("subscription-price");
const subscriptionButton = document.getElementById("subscription-button");
const subscriptionMessage = document.getElementById("subscription-message");


// ===== SLOT MANAGEMENT ELEMENTS =====
const slotGrid = document.getElementById("slot-grid");
const slotEstablishmentName = document.getElementById("slot-establishment-name");
const slotEstablishmentAddress = document.getElementById("slot-establishment-address");
const slotLastUpdated = document.getElementById("slot-last-updated");

const totalSlotsText = document.getElementById("total-slots");
const availableSlotsText = document.getElementById("available-slots");
const occupiedSlotsText = document.getElementById("occupied-slots");

const saveSlotsButton = document.getElementById("save-slots-button");
const slotSaveMessage = document.getElementById("slot-save-message");

const parkingDetails = document.getElementById("staff-parking-details");


// ===== STAFF DATA =====
let assignedEstablishment = null;
let savedSlotStatuses = [];
let savedLastUpdated = null;
let hasUnsavedChanges = false;


// ===== SUBSCRIPTION STATUS INFORMATION =====
const SUBSCRIPTION_STATUS_INFO = {
  trial: {
    label: "Free Trial",
    cssClass: "status-trial",
    buttonText: "Subscribe Now",
    expiryLabel: "Trial ends on"
  },

  active: {
    label: "Active",
    cssClass: "status-active",
    buttonText: "Renew Subscription",
    expiryLabel: "Expires on"
  },

  expired: {
    label: "Expired",
    cssClass: "status-expired",
    buttonText: "Subscribe Now",
    expiryLabel: "Expired on"
  }
};


// =====================================================
// 1. SUBSCRIPTION CARD
// =====================================================

function renderSubscriptionCard(establishment) {
  const subscription = getSubscription(establishment.id);

  if (subscription === null) {
    subscriptionCard.hidden = true;
    trialNotice.hidden = true;
    return;
  }

  const info = SUBSCRIPTION_STATUS_INFO[subscription.status];
  const daysLeft = getDaysRemaining(subscription);

  subscriptionCard.hidden = false;
  subscriptionCard.className = "subscription-card " + info.cssClass;

  subscriptionStatus.textContent = info.label;
  subscriptionEstablishment.textContent = establishment.name;

  subscriptionDays.textContent =
    daysLeft + (daysLeft === 1 ? " day" : " days");

  subscriptionExpiryLabel.textContent = info.expiryLabel;
  subscriptionExpiry.textContent =
    formatDate(getExpirationDateText(subscription));

  subscriptionPrice.textContent =
    "₱" + SUBSCRIPTION_PRICE_PESOS +
    " per " + SUBSCRIPTION_DAYS + " days";

  subscriptionButton.textContent = info.buttonText;

  if (subscription.status === "trial" && daysLeft > 7) {
    trialNotice.textContent =
      "Free trial: " + daysLeft +
      " days left. You can subscribe at any time for ₱" +
      SUBSCRIPTION_PRICE_PESOS +
      " per " + SUBSCRIPTION_DAYS + " days.";

    trialNotice.hidden = false;
  } else {
    trialNotice.hidden = true;
  }
}


// =====================================================
// 2. PARKING AREA DETAILS
// =====================================================

function renderParkingDetails(establishment) {
  parkingDetails.innerHTML = "";

  const details = [
    ["Establishment Name", establishment.name],
    ["Type", establishment.type],
    ["Address", establishment.address],
    ["Operating Hours", establishment.hours],
    ["Total Parking Slots", establishment.slots.length]
  ];

  details.forEach(function (detail) {
    const row = document.createElement("div");
    row.className = "parking-detail-row";

    const label = document.createElement("span");
    label.className = "parking-detail-label";
    label.textContent = detail[0];

    const value = document.createElement("span");
    value.className = "parking-detail-value";
    value.textContent = detail[1];

    row.append(label, value);
    parkingDetails.appendChild(row);
  });
}


// =====================================================
// 3. SLOT MANAGEMENT
// =====================================================

// Saves the original statuses so we can detect unsaved changes.
function rememberSavedSlots() {
  savedSlotStatuses = assignedEstablishment.slots.map(function (slot) {
    return slot.status;
  });

  savedLastUpdated = assignedEstablishment.lastUpdated
    ? new Date(assignedEstablishment.lastUpdated)
    : null;

  hasUnsavedChanges = false;
}


// Displays the last updated date and time.
function renderLastUpdated() {
  if (!assignedEstablishment.lastUpdated) {
    slotLastUpdated.textContent = "Last updated: Not available";
    return;
  }

  const date = new Date(assignedEstablishment.lastUpdated);

  slotLastUpdated.textContent =
    "Last updated: " + date.toLocaleString();
}


// Updates the total, available, and occupied counts.
function renderSlotSummary() {
  const total = assignedEstablishment.slots.length;

  const available = assignedEstablishment.slots.filter(function (slot) {
    return slot.status === "available";
  }).length;

  const occupied = total - available;

  totalSlotsText.textContent = total;
  availableSlotsText.textContent = available;
  occupiedSlotsText.textContent = occupied;
}


// Creates the parking slot buttons.
function renderSlotButtons() {
  slotGrid.innerHTML = "";

  if (!assignedEstablishment.slots ||
      assignedEstablishment.slots.length === 0) {

    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "No parking slots are assigned to this establishment.";

    slotGrid.appendChild(message);
    return;
  }

  assignedEstablishment.slots.forEach(function (slot, index) {
    const isAvailable = slot.status === "available";

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "parking-slot " + (isAvailable ? "available" : "occupied");

    button.setAttribute(
      "aria-label",
      slot.label + ", " + (isAvailable ? "Available" : "Occupied")
    );

    const icon = document.createElement("span");
    icon.className = "slot-icon";
    icon.textContent = "P";

    const name = document.createElement("span");
    name.className = "slot-name";
    name.textContent = slot.label || "Slot " + (index + 1);

    const status = document.createElement("span");
    status.className = "slot-status";
    status.textContent = isAvailable ? "Available" : "Occupied";

    button.append(icon, name, status);

    // Clicking a slot changes its status.
    button.addEventListener("click", function () {
      toggleSlotStatus(index);
    });

    slotGrid.appendChild(button);
  });
}


// Changes one slot from Available to Occupied or vice versa.
function toggleSlotStatus(index) {
  const slot = assignedEstablishment.slots[index];

  if (slot.status === "available") {
    slot.status = "occupied";
  } else {
    slot.status = "available";
  }

  hasUnsavedChanges = true;

  renderSlotButtons();
  renderSlotSummary();
  renderSaveMessage();
}


// Shows whether the staff member has unsaved changes.
function renderSaveMessage() {
  if (hasUnsavedChanges) {
    slotSaveMessage.textContent =
      "You have unsaved changes. Click Save Changes to update availability.";

    slotSaveMessage.className = "";
    saveSlotsButton.disabled = false;
  } else {
    slotSaveMessage.textContent = "No unsaved changes.";
    slotSaveMessage.className = "success-message";
    saveSlotsButton.disabled = true;
  }
}


// Displays all slot-management information.
function renderSlotManagement() {
  slotEstablishmentName.textContent = assignedEstablishment.name;
  slotEstablishmentAddress.textContent = assignedEstablishment.address;

  renderSlotButtons();
  renderSlotSummary();
  renderLastUpdated();
  renderSaveMessage();
}


// Saves the updated parking slots to localStorage.
function saveSlotChanges() {
  if (!hasUnsavedChanges) {
    return;
  }

  const previousLastUpdated = savedLastUpdated
    ? new Date(savedLastUpdated)
    : null;

  // Update the time when the staff member saves.
  assignedEstablishment.lastUpdated = new Date();

  const saveSuccessful = saveEstablishments(sampleEstablishments);

  if (saveSuccessful) {
    rememberSavedSlots();

    renderLastUpdated();
    renderSaveMessage();

    slotSaveMessage.textContent =
      "Your parking slot updates have been saved successfully.";

    slotSaveMessage.className = "success-message";

  } else {
    // Restore the previous slot statuses if saving fails.
    assignedEstablishment.slots.forEach(function (slot, index) {
      slot.status = savedSlotStatuses[index];
    });

    assignedEstablishment.lastUpdated = previousLastUpdated;

    renderSlotManagement();

    slotSaveMessage.textContent =
      "Unable to save your changes. Please check your browser storage and try again.";

    slotSaveMessage.className = "error-message";
  }
}


// =====================================================
// 4. STARTING THE STAFF DASHBOARD
// =====================================================

function startStaffDashboard(user) {
  document.getElementById("topbar-user-name").textContent =
    user.displayName;

  // Find the parking area assigned to this staff account.
  assignedEstablishment = sampleEstablishments.find(function (item) {
    return item.id === user.establishmentId;
  });

  if (!assignedEstablishment) {
    slotGrid.innerHTML = "";

    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent =
      "No parking area is assigned to your account. Please contact the administrator.";

    slotGrid.appendChild(message);

    parkingDetails.textContent =
      "No parking area is assigned to your account.";

    subscriptionCard.hidden = true;
    trialNotice.hidden = true;

    saveSlotsButton.disabled = true;
    return;
  }

  // Display the assigned establishment.
  renderSubscriptionCard(assignedEstablishment);
  renderParkingDetails(assignedEstablishment);

  // Prepare the slot information.
  rememberSavedSlots();
  renderSlotManagement();

  // Save button.
  saveSlotsButton.addEventListener("click", saveSlotChanges);

  // Subscription button.
  subscriptionButton.addEventListener("click", function () {
    subscriptionMessage.textContent =
      "The payment window is built in a later step. For now, this button only shows this message.";
  });

  // Temporary subscription demo tools.
  const demoStateSelect = document.getElementById("demo-state");
  const demoApplyButton = document.getElementById("demo-apply");

  demoApplyButton.addEventListener("click", function () {
    setDemoSubscriptionState(
      assignedEstablishment.id,
      demoStateSelect.value
    );

    subscriptionMessage.textContent = "";
    renderSubscriptionCard(assignedEstablishment);
  });
}


// =====================================================
// 5. LOGIN CHECK
// =====================================================

// Only a logged-in staff member can use this page.
const currentUser = requireRole("staff", "../login.html");

if (currentUser !== null) {
  startStaffDashboard(currentUser);
}

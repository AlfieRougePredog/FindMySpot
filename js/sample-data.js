// =====================================================
// FINDMYSPOT - SAMPLE-DATA.JS
// TEMPORARY parking data, used while we build the
// Phase 4 features. In Phase 5, this file is removed and
// the data comes from the database through the server.
// All names, addresses and coordinates here are made up.
//
// How it works now:
// 1. The fake data below is the STARTING data.
// 2. When staff save slot updates, the new data is kept in
//    the browser's localStorage.
// 3. Every page that loads this file reads the saved data first.
// =====================================================


// ===== STORAGE SETTINGS =====
// The name under which the data is kept inside localStorage
const STORAGE_KEY = "findmyspot-establishments";


// ===== HELPER: CREATE THE SLOTS OF ONE ESTABLISHMENT =====
// total = how many slots there are
// occupiedNumbers = the slot numbers that are Occupied (all others are Available)
function createSlots(total, occupiedNumbers) {
  const slots = [];

  for (let number = 1; number <= total; number++) {
    slots.push({
      label: "Slot " + number,
      status: occupiedNumbers.includes(number) ? "occupied" : "available"
    });
  }

  return slots;
}


// ===== THE STARTING (FAKE) PARKING ESTABLISHMENTS =====
const defaultEstablishments = [
  {
    id: "sample-1",
    name: "Sample Plaza Parking",
    type: "Mall or Commercial Building",
    address: "Sample Street, Barangay Sample, Panabo City, Davao del Norte",
    hours: "Daily, 8:00 AM to 9:00 PM",
    latitude: 7.3089,
    longitude: 125.6842,
    slots: createSlots(12, [1, 2, 4, 5, 7, 9])
  },
  {
    id: "sample-2",
    name: "Sample Cafe Parking",
    type: "Restaurant or Cafe",
    address: "Sample Avenue, Barangay Sample, Panabo City, Davao del Norte",
    hours: "Daily, 7:00 AM to 10:00 PM",
    latitude: 7.3115,
    longitude: 125.687,
    slots: createSlots(8, [1, 2, 3, 4, 5, 6, 7, 8])      // Every slot is Occupied (Full)
  },
  {
    id: "sample-3",
    name: "Sample Hotel Parking",
    type: "Hotel or Lodging",
    address: "Sample Road, Barangay Sample, Panabo City, Davao del Norte",
    hours: "Open 24 hours",
    latitude: 7.305,
    longitude: 125.681,
    slots: createSlots(10, [3, 6])
  },
  {
    id: "sample-4",
    name: "Sample Lot Parking",
    type: "Private Parking Lot",
    address: "Sample Highway, Barangay Sample, Panabo City, Davao del Norte",
    hours: "Monday to Saturday, 6:00 AM to 8:00 PM",
    latitude: 7.314,
    longitude: 125.6795,
    slots: createSlots(15, [1, 2, 3, 5, 8, 10, 11, 13, 14])
  },
  {
    id: "sample-5",
    name: "Sample Clinic Parking",
    type: "Other",
    address: "Sample Lane, Barangay Sample, Panabo City, Davao del Norte",
    hours: "Monday to Friday, 8:00 AM to 5:00 PM",
    latitude: 7.302,
    longitude: 125.689,
    slots: createSlots(6, [2, 4])
  }
];

// Fake "Last updated" times (6, 12, 18... minutes ago) for the starting data.
// In Phase 5 the real time comes from the database.
defaultEstablishments.forEach(function (establishment, index) {
  const minutesAgo = (index + 1) * 6;
  establishment.lastUpdated = new Date(Date.now() - minutesAgo * 60 * 1000);
});


// ===== LOADING AND SAVING =====

// Reads the saved establishments from localStorage.
// If nothing is saved yet (or the saved data is broken), the starting data is used.
function loadEstablishments() {
  try {
    const savedText = localStorage.getItem(STORAGE_KEY);

    if (savedText !== null) {
      const saved = JSON.parse(savedText);

      if (Array.isArray(saved) && saved.length > 0) {
        // localStorage keeps only text, so dates come back as text.
        // We turn each one back into a real Date.
        saved.forEach(function (establishment) {
          establishment.lastUpdated = new Date(establishment.lastUpdated);
        });
        return saved;
      }
    }
  } catch (error) {
    // The browser blocked storage or the data was broken.
    // We ignore it and use the starting data below.
  }

  return defaultEstablishments;
}

// Saves the establishments to localStorage.
// Returns true if it worked, false if the browser did not allow it.
function saveEstablishments(establishments) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(establishments));
    return true;
  } catch (error) {
    return false;
  }
}


// ===== THE DATA THE PAGES USE =====
// The driver and staff pages both use this list
const sampleEstablishments = loadEstablishments();


// ===== HELPER: COUNT THE AVAILABLE SLOTS OF ONE ESTABLISHMENT =====
function countAvailableSlots(establishment) {
  // filter() keeps only the slots whose status is "available"
  const availableSlots = establishment.slots.filter(function (slot) {
    return slot.status === "available";
  });

  return availableSlots.length;
}



// ===== ESTABLISHMENT APPLICATIONS (practice storage) =====
// The registration page saves new applications here, and the admin page reads them.
// In Phase 5, the server and database replace this.
const APPLICATIONS_STORAGE_KEY = "findmyspot-applications";

// Reads the saved applications. If nothing is saved (or the data is broken), returns an empty list.
function loadApplications() {
  try {
    const savedText = localStorage.getItem(APPLICATIONS_STORAGE_KEY);

    if (savedText !== null) {
      const saved = JSON.parse(savedText);

      if (Array.isArray(saved)) {
        return saved;
      }
    }
  } catch (error) {
    // The browser blocked storage or the data was broken. We start with an empty list.
  }

  return [];
}

// Saves the applications. Returns true if it worked, false if the browser did not allow it.
function saveApplications(applications) {
  try {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
    return true;
  } catch (error) {
    return false;
  }
}



// ===== USER ACCOUNTS (practice storage) =====
// The signup page saves new accounts here, and the admin page reads them.
// NO PASSWORDS are ever saved here. In Phase 5, the server stores a securely hashed password.
const ACCOUNTS_STORAGE_KEY = "findmyspot-accounts";

// Reads the saved accounts. If nothing is saved (or the data is broken), returns an empty list.
function loadAccounts() {
  try {
    const savedText = localStorage.getItem(ACCOUNTS_STORAGE_KEY);

    if (savedText !== null) {
      const saved = JSON.parse(savedText);

      if (Array.isArray(saved)) {
        return saved;
      }
    }
  } catch (error) {
    // The browser blocked storage or the data was broken. We start with an empty list.
  }

  return [];
}

// Saves the accounts. Returns true if it worked, false if the browser did not allow it.
function saveAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    return true;
  } catch (error) {
    return false;
  }
}
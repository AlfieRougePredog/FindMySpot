// =====================================================
// FINDMYSPOT - SUBSCRIPTION.JS
// Subscription rules for parking establishments.
//
// DEMO VERSION: the data is saved in this browser
// (localStorage), so anyone can edit it. In Phase 5, the
// database and the server take over: the server checks
// every request, and payments are confirmed by the payment
// gateway. Never rely on this file for real security.
//
// This file needs js/sample-data.js to load first.
// =====================================================


// ===== SUBSCRIPTION SETTINGS =====
const TRIAL_DAYS = 30;                   // One-time free trial for a newly approved establishment
const SUBSCRIPTION_DAYS = 30;            // Every payment gives 30 days
const SUBSCRIPTION_PRICE_PESOS = 199;    // The price for 30 days
const DAY_IN_MS = 24 * 60 * 60 * 1000;   // One day in milliseconds (JavaScript counts time in milliseconds)

// The name we use to save the demo subscriptions in the browser
const SUBSCRIPTIONS_STORAGE_KEY = "findmyspot-demo-subscriptions";


// ===== DATE HELPERS =====

// Returns a date for "now plus this many days". Use a negative number for the past.
// The date is written as text, for example "2026-11-10T08:30:00.000Z"
function daysFromNow(days) {
  return new Date(Date.now() + days * DAY_IN_MS).toISOString();
}

// Returns a new date, a number of days after the given date
function addDays(dateText, days) {
  return new Date(new Date(dateText).getTime() + days * DAY_IN_MS).toISOString();
}

// Turns a date text into a readable date, for example "December 10, 2026"
function formatDate(dateText) {
  return new Date(dateText).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


// ===== DEMO DATA =====
// Creates one subscription record for each sample establishment.
// Every date is counted from today, so nothing here is a fixed date.
function createDemoSubscriptions() {
  return {

    // New trial: just approved, 30 days left
    "sample-1": {
      status: "trial",
      approvedDate: daysFromNow(0),
      trialStartDate: daysFromNow(0),
      trialExpirationDate: daysFromNow(30),
      subscriptionStartDate: null,
      subscriptionExpirationDate: null,
      paymentStatus: "none",
      lastPaymentDate: null
    },

    // Paid and active: paid 10 days ago, 20 days left
    "sample-2": {
      status: "active",
      approvedDate: daysFromNow(-40),
      trialStartDate: daysFromNow(-40),
      trialExpirationDate: daysFromNow(-10),
      subscriptionStartDate: daysFromNow(-10),
      subscriptionExpirationDate: daysFromNow(20),
      paymentStatus: "paid",
      lastPaymentDate: daysFromNow(-10)
    },

    // The trial ended 10 days ago, but it is still saved as "trial".
    // The system will change it to "expired" by itself.
    "sample-3": {
      status: "trial",
      approvedDate: daysFromNow(-40),
      trialStartDate: daysFromNow(-40),
      trialExpirationDate: daysFromNow(-10),
      subscriptionStartDate: null,
      subscriptionExpirationDate: null,
      paymentStatus: "none",
      lastPaymentDate: null
    },

    // Trial with 5 days left
    "sample-4": {
      status: "trial",
      approvedDate: daysFromNow(-25),
      trialStartDate: daysFromNow(-25),
      trialExpirationDate: daysFromNow(5),
      subscriptionStartDate: null,
      subscriptionExpirationDate: null,
      paymentStatus: "none",
      lastPaymentDate: null
    },

    // The paid period ended 15 days ago, but it is still saved as "active".
    // The system will change it to "expired" by itself.
    "sample-5": {
      status: "active",
      approvedDate: daysFromNow(-75),
      trialStartDate: daysFromNow(-75),
      trialExpirationDate: daysFromNow(-45),
      subscriptionStartDate: daysFromNow(-45),
      subscriptionExpirationDate: daysFromNow(-15),
      paymentStatus: "paid",
      lastPaymentDate: daysFromNow(-45)
    }
  };
}


// ===== SAVING AND LOADING =====

// Saves all subscriptions in the browser
function saveSubscriptions(subscriptions) {
  try {
    localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (error) {
    // If the browser blocks storage, we simply cannot save
  }
}

// Loads all subscriptions. The very first time, it creates the demo data.
function getAllSubscriptions() {
  try {
    const savedText = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);

    if (savedText) {
      return JSON.parse(savedText);
    }
  } catch (error) {
    // If the saved data cannot be read, we start again with the demo data
  }

  const demoSubscriptions = createDemoSubscriptions();
  saveSubscriptions(demoSubscriptions);
  return demoSubscriptions;
}

// Deletes the saved subscriptions and creates fresh demo data (for testing).
// After using it, reload the page.
function resetDemoSubscriptions() {
  saveSubscriptions(createDemoSubscriptions());
}


// ===== READING A SUBSCRIPTION =====

// If the trial or the paid period has ended, change the status to "expired".
// Returns true if the status was changed.
function applyExpiry(subscription) {
  const now = Date.now();

  if (subscription.status === "trial" && now >= new Date(subscription.trialExpirationDate).getTime()) {
    subscription.status = "expired";
    return true;
  }

  if (subscription.status === "active" && now >= new Date(subscription.subscriptionExpirationDate).getTime()) {
    subscription.status = "expired";
    return true;
  }

  return false;
}

// Gets the subscription of one establishment (or null if it has none).
// Every time we read it, we check whether it has expired, and save the change.
function getSubscription(establishmentId) {
  const subscriptions = getAllSubscriptions();
  const subscription = subscriptions[establishmentId];

  if (!subscription) {
    return null;
  }

  if (applyExpiry(subscription)) {
    saveSubscriptions(subscriptions);
  }

  return subscription;
}

// How many days are left in the trial or in the paid period.
// A part of a day counts as a full day (6 days and 3 hours left = 7 days).
// An expired subscription has 0 days left.
function getDaysRemaining(subscription) {
  if (!subscription || subscription.status === "expired") {
    return 0;
  }

  const expirationDate = subscription.status === "trial"
    ? subscription.trialExpirationDate
    : subscription.subscriptionExpirationDate;

  const millisecondsLeft = new Date(expirationDate).getTime() - Date.now();

  if (millisecondsLeft <= 0) {
    return 0;
  }

  return Math.ceil(millisecondsLeft / DAY_IN_MS);
}

// The date the current period ends (or ended, if the subscription is expired)
function getExpirationDateText(subscription) {
  if (subscription.status === "active") {
    return subscription.subscriptionExpirationDate;
  }

  if (subscription.status === "trial") {
    return subscription.trialExpirationDate;
  }

  // Expired: use the end of the last period (the paid period if there was one, otherwise the trial)
  return subscription.subscriptionExpirationDate || subscription.trialExpirationDate;
}


// ===== RULES =====

// Can this establishment be used right now? (Only "trial" and "active" can.)
function isSubscriptionUsable(establishmentId) {
  const subscription = getSubscription(establishmentId);

  return subscription !== null &&
    (subscription.status === "trial" || subscription.status === "active");
}

// The establishments that drivers are allowed to see.
// Expired establishments, and establishments with no subscription, are hidden.
function getVisibleEstablishments() {
  return sampleEstablishments.filter(function (establishment) {
    return isSubscriptionUsable(establishment.id);
  });
}

// Gives an establishment its free trial.
// It must only be called when an administrator APPROVES the establishment.
// Returns true if the trial started, or false if the establishment already had
// its trial (a trial can only be given once).
function startTrial(establishmentId) {
  const subscriptions = getAllSubscriptions();
  const existing = subscriptions[establishmentId];

  // If a trial start date already exists, the trial was used before
  if (existing && existing.trialStartDate) {
    return false;
  }

  const now = new Date().toISOString();

  subscriptions[establishmentId] = {
    status: "trial",
    approvedDate: now,
    trialStartDate: now,
    trialExpirationDate: addDays(now, TRIAL_DAYS),
    subscriptionStartDate: null,
    subscriptionExpirationDate: null,
    paymentStatus: "none",
    lastPaymentDate: null
  };

  saveSubscriptions(subscriptions);
  return true;
}


// ===== DEMO TEST SITUATIONS (TEMPORARY, removed in Phase 5) =====
// Each situation says what kind of subscription to create and how many days are left.
// A negative number means the period already ended that many days ago.
const DEMO_TEST_STATES = {
  "trial-30": { type: "trial", daysLeft: 30 },
  "trial-8": { type: "trial", daysLeft: 8 },
  "trial-7": { type: "trial", daysLeft: 7 },
  "trial-3": { type: "trial", daysLeft: 3 },
  "trial-ended": { type: "trial", daysLeft: -10 },
  "active-20": { type: "active", daysLeft: 20 },
  "paid-ended": { type: "active", daysLeft: -15 }
};

// DEMO ONLY: rewrites the subscription of one establishment into a test situation,
// so we can test the pop-ups and the card without waiting for real days to pass.
function setDemoSubscriptionState(establishmentId, stateName) {
  const testState = DEMO_TEST_STATES[stateName];

  if (!testState) {
    return;
  }

  const subscriptions = getAllSubscriptions();

  if (testState.type === "trial") {
    // A trial that has "daysLeft" days left
    subscriptions[establishmentId] = {
      status: "trial",
      approvedDate: daysFromNow(testState.daysLeft - TRIAL_DAYS),
      trialStartDate: daysFromNow(testState.daysLeft - TRIAL_DAYS),
      trialExpirationDate: daysFromNow(testState.daysLeft),
      subscriptionStartDate: null,
      subscriptionExpirationDate: null,
      paymentStatus: "none",
      lastPaymentDate: null
    };
  } else {
    // A paid period that has "daysLeft" days left. The trial ended on the day of the payment.
    const paymentDate = daysFromNow(testState.daysLeft - SUBSCRIPTION_DAYS);

    subscriptions[establishmentId] = {
      status: "active",
      approvedDate: daysFromNow(testState.daysLeft - SUBSCRIPTION_DAYS - TRIAL_DAYS),
      trialStartDate: daysFromNow(testState.daysLeft - SUBSCRIPTION_DAYS - TRIAL_DAYS),
      trialExpirationDate: paymentDate,
      subscriptionStartDate: paymentDate,
      subscriptionExpirationDate: daysFromNow(testState.daysLeft),
      paymentStatus: "paid",
      lastPaymentDate: paymentDate
    };
  }

  saveSubscriptions(subscriptions);
}
// =====================================================
// FINDMYSPOT - DEMO-AUTH.JS
// TEMPORARY demo login, used only while we build the
// front end. In Phase 5, this file is removed and replaced
// by real, secure login on the server.
//
// WARNING: anyone can read the passwords below by looking
// at this file. They are fake demo passwords.
// NEVER put a real password in this file.
// =====================================================


// ===== DEMO ACCOUNTS =====
// establishmentId connects the staff account to a parking establishment
// from js/sample-data.js ("sample-1" is Sample Plaza Parking)
const DEMO_ACCOUNTS = [
  {
    role: "driver",
    username: "driver",
    email: "driver@findmyspot.test",
    password: "driver123",
    displayName: "Demo Driver",
    establishmentId: null
  },
  {
    role: "staff",
    username: "staff",
    email: "staff@findmyspot.test",
    password: "staff123",
    displayName: "Demo Staff",
    establishmentId: "sample-1"
  },
  {
    role: "admin",
    username: "admin",
    email: "admin@findmyspot.test",
    password: "admin123",
    displayName: "Demo Administrator",
    establishmentId: null
  }
];

// The page each role opens after logging in.
// These paths start from the main FindMySpot folder, where the login pages are.
const DASHBOARD_PAGES = {
  driver: "driver/dashboard.html",
  staff: "staff/dashboard.html",
  admin: "admin/dashboard.html"
};

// The name we use to remember who is logged in (kept inside this browser tab only)
const DEMO_SESSION_KEY = "findmyspot-demo-user";


// ===== FIND THE DEMO ACCOUNT OF A ROLE =====
// Used to show the demo username and password on the login pages
function findDemoAccount(role) {
  return DEMO_ACCOUNTS.find(function (account) {
    return account.role === role;
  });
}


// ===== DEMO LOGIN =====
// Checks the typed username (or email) and password for the chosen role.
// Returns the logged-in user, or null if something is wrong.
function demoLogin(role, identifier, password) {
  // Ignore spaces around the username and capital letters
  const typedName = identifier.trim().toLowerCase();

  // find() gives back the first account that matches everything, or undefined if none does
  const account = DEMO_ACCOUNTS.find(function (demoAccount) {
    const nameMatches = demoAccount.username === typedName || demoAccount.email === typedName;
    return demoAccount.role === role && nameMatches && demoAccount.password === password;
  });

  if (!account) {
    return null;
  }

  // Remember who is logged in. We never save the password.
  const user = {
    username: account.username,
    role: account.role,
    displayName: account.displayName,
    establishmentId: account.establishmentId
  };

  try {
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    // If the browser blocks storage, the login still works, but we cannot remember it
  }

  return user;
}


// ===== WHO IS LOGGED IN =====

// Returns the logged-in user, or null if nobody is logged in
function getCurrentUser() {
  try {
    const savedText = sessionStorage.getItem(DEMO_SESSION_KEY);
    return savedText ? JSON.parse(savedText) : null;
  } catch (error) {
    return null;
  }
}

// For protected pages: lets the page continue only if the logged-in user has the given role.
// Otherwise it sends the visitor to the login page and returns null.
// (This is only a demo check. In Phase 5, the SERVER makes this decision.)
function requireRole(role, loginPage) {
  const user = getCurrentUser();

  if (user === null || user.role !== role) {
    window.location.replace(loginPage);
    return null;
  }

  return user;
}

// Forgets who is logged in
function demoLogout() {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch (error) {
    // Nothing to do if the browser blocks storage
  }
}

// Any link with the attribute data-logout forgets the login first, then opens its page
document.querySelectorAll("[data-logout]").forEach(function (link) {
  link.addEventListener("click", demoLogout);
});
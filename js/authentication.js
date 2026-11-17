// =====================================================
// FINDMYSPOT - AUTHENTICATION.JS
// JavaScript for the login, signup, establishment
// registration and admin login pages.
// This file is shared by those pages, so each section
// first checks that its own page is open before running.
// The demo accounts come from js/demo-auth.js (temporary).
// The practice saving (applications and accounts) comes
// from js/sample-data.js.
//
// PRACTICE VERSION: applications and accounts are kept in
// this browser. NO PASSWORDS are saved. In Phase 5, the
// server stores everything securely and hashes passwords.
// =====================================================


// ===== SHARED HELPERS (used by more than one page) =====

// Sets up the Driver / Parking Staff tabs.
// "onChange" is a function that runs each time a tab is clicked.
function setupRoleTabs(onChange) {
  const roleTabs = document.querySelectorAll(".role-tab");

  roleTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const chosenRole = tab.dataset.role;

      // Highlight the chosen tab and remove the highlight from the other one
      roleTabs.forEach(function (otherTab) {
        const isChosen = otherTab.dataset.role === chosenRole;
        otherTab.classList.toggle("active", isChosen);
        otherTab.setAttribute("aria-pressed", isChosen);
      });

      // Tell the page which role was chosen
      onChange(chosenRole);
    });
  });
}

// Shows a message under the form button. If isError is true, it shows in red.
function showFormMessage(text, isError) {
  const formMessage = document.getElementById("form-message");
  formMessage.textContent = text;
  formMessage.classList.toggle("error", isError);
}

// Makes a simple unique id, like "app-1731234567890-482"
function createId(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

// TEMPORARY: shows the demo username and password of a role inside the given element
function showDemoNote(noteElement, role) {
  const account = findDemoAccount(role);
  noteElement.textContent =
    "Demo mode. Username: " + account.username +
    "  |  Password: " + account.password +
    "  (temporary demo account)";
}

// TEMPORARY: tries to log in with the demo accounts.
// If it works, it opens the dashboard of that role.
function tryDemoLogin(role, identifier, password) {
  const user = demoLogin(role, identifier, password);

  if (user === null) {
    // We do not say WHICH part was wrong, so nobody can use the message to guess usernames
    showFormMessage("Incorrect username or password. Please try again.", true);
    return;
  }

  showFormMessage("Login successful. Opening your dashboard...", false);
  window.location.href = DASHBOARD_PAGES[user.role];
}


// ===== LOGIN PAGE =====
const loginForm = document.getElementById("login-form");

// Only run this section if we are on the login page
if (loginForm) {

  // What changes on the page for each type of user
  const loginContent = {
    driver: {
      description: "Log in to find parking and check reported slot availability.",
      button: "Log In as Driver"
    },
    staff: {
      description: "Log in to update the slots of your assigned establishment. Staff accounts must be approved by an administrator.",
      button: "Log In as Parking Staff"
    }
  };

  // Find the parts of the page we need to change
  const roleDescription = document.getElementById("role-description");
  const loginSubmit = document.getElementById("login-submit");
  const demoNote = document.getElementById("demo-note");

  // Remember which role is chosen (Driver is the default)
  let selectedRole = "driver";

  // When a role tab is clicked, update the page for that role
  setupRoleTabs(function (role) {
    selectedRole = role;
    roleDescription.textContent = loginContent[role].description;
    loginSubmit.textContent = loginContent[role].button;
    showDemoNote(demoNote, role);
    showFormMessage("", false);
  });

  // Show the demo account of the default role when the page first loads
  showDemoNote(demoNote, selectedRole);

  // When the form is submitted
  loginForm.addEventListener("submit", function (event) {
    // Stop the browser from reloading the page (the normal form behavior)
    event.preventDefault();

    const identifier = document.getElementById("login-identifier").value;
    const password = document.getElementById("login-password").value;

    tryDemoLogin(selectedRole, identifier, password);
  });
}


// ===== SIGNUP PAGE =====
const signupForm = document.getElementById("signup-form");

// Only run this section if we are on the signup page
if (signupForm) {

  // What changes on the page for each type of user
  const signupContent = {
    driver: {
      description: "Create an account to find parking and check reported slot availability.",
      button: "Create Driver Account",
      success: "Your Driver account was created (practice version). Email verification will be added in Phase 5."
    },
    staff: {
      description: "Create an account to manage the slots of your establishment. You need an invitation code, and an administrator must approve your account.",
      button: "Create Parking Staff Account",
      success: "Your Parking Staff account was submitted. It is now waiting for administrator approval. (Email verification will be added in Phase 5.)"
    }
  };

  // Find the parts of the page we need to change
  const roleDescription = document.getElementById("role-description");
  const signupSubmit = document.getElementById("signup-submit");
  const staffFields = document.getElementById("staff-fields");
  const driverTerms = document.getElementById("driver-terms");
  const establishmentSelect = document.getElementById("signup-establishment");

  // Remember which role is chosen (Driver is the default)
  let selectedRole = "driver";

  // Fills the Establishment drop-down with the establishments from sample-data.js
  function fillEstablishmentSelect() {
    sampleEstablishments.forEach(function (establishment) {
      const option = document.createElement("option");
      option.value = establishment.id;
      option.textContent = establishment.name;
      establishmentSelect.append(option);
    });
  }

  // Shows or hides a group of fields.
  // Hidden fields are also disabled, so the browser ignores them when checking the form.
  function setGroupVisible(group, isVisible) {
    group.hidden = !isVisible;
    group.querySelectorAll("input, select").forEach(function (field) {
      field.disabled = !isVisible;
    });
  }

  // Updates the whole page for the chosen role
  function applySignupRole(role) {
    selectedRole = role;
    roleDescription.textContent = signupContent[role].description;
    signupSubmit.textContent = signupContent[role].button;
    setGroupVisible(staffFields, role === "staff");
    setGroupVisible(driverTerms, role === "driver");
    showFormMessage("", false);
  }

  fillEstablishmentSelect();

  // When a role tab is clicked, update the page for that role
  setupRoleTabs(applySignupRole);

  // Set up the page for the default role when it first loads
  applySignupRole("driver");

  // When the form is submitted
  signupForm.addEventListener("submit", function (event) {
    // Stop the browser from reloading the page (the normal form behavior)
    event.preventDefault();

    // Check that both passwords are the same
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;

    if (password !== confirmPassword) {
      showFormMessage("Passwords do not match. Please try again.", true);
      return;
    }

    // Read the fields. The password is NEVER saved in this practice version.
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const username = document.getElementById("signup-username").value.trim().toLowerCase();

    // Read the saved accounts, so we can check for duplicates
    const accounts = loadAccounts();

    const emailTaken = accounts.some(function (account) {
      return account.email.toLowerCase() === email;
    });
    const usernameTaken = accounts.some(function (account) {
      return account.username.toLowerCase() === username;
    });

    if (emailTaken) {
      showFormMessage("An account with this email already exists.", true);
      return;
    }
    if (usernameTaken) {
      showFormMessage("This username is already taken. Please choose another one.", true);
      return;
    }

    // Build the new account
    const newAccount = {
      id: createId("acc"),
      role: selectedRole,
      firstName: document.getElementById("signup-first-name").value.trim(),
      lastName: document.getElementById("signup-last-name").value.trim(),
      email: email,
      mobile: document.getElementById("signup-mobile").value.trim(),
      username: username,
      // Drivers are active at once. Staff wait for the administrator.
      status: selectedRole === "driver" ? "active" : "pending",
      createdAt: new Date().toISOString()
    };

    // Extra details for staff only
    if (selectedRole === "staff") {
      const chosenEstablishment = sampleEstablishments.find(function (establishment) {
        return establishment.id === establishmentSelect.value;
      });

      if (!chosenEstablishment) {
        showFormMessage("Please choose your establishment.", true);
        return;
      }

      newAccount.establishmentId = chosenEstablishment.id;
      newAccount.establishmentName = chosenEstablishment.name;
      newAccount.position = document.getElementById("signup-position").value.trim();
      newAccount.invitationCode = document.getElementById("signup-invitation-code").value.trim().toUpperCase();
    }

    // Put the newest account first, then save
    accounts.unshift(newAccount);

    if (!saveAccounts(accounts)) {
      showFormMessage("Your browser would not save the account. Please allow site storage and try again.", true);
      return;
    }

    signupForm.reset();
    showFormMessage(signupContent[selectedRole].success, false);
  });
}


// ===== ESTABLISHMENT REGISTRATION PAGE =====
const establishmentForm = document.getElementById("establishment-form");

// Only run this section if we are on the establishment registration page
if (establishmentForm) {

  // The biggest file we accept for the proof document
  const MAX_FILE_SIZE_MB = 5;
  const proofInput = document.getElementById("establishment-proof");
  const typeSelect = document.getElementById("establishment-type");

  // When the form is submitted
  establishmentForm.addEventListener("submit", function (event) {
    // Stop the browser from reloading the page (the normal form behavior)
    event.preventDefault();

    // Check the size of the chosen file (files[0] is the first chosen file)
    const proofFile = proofInput.files[0];

    if (proofFile && proofFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showFormMessage("The file is too large. Please choose a file up to " + MAX_FILE_SIZE_MB + " MB.", true);
      return;
    }

    // Build the application. The admin page reads these exact names.
    // type is the readable text of the chosen option (for example "Private Parking Lot").
    const newApplication = {
      id: createId("app"),
      establishmentName: document.getElementById("establishment-name").value.trim(),
      type: typeSelect.options[typeSelect.selectedIndex].textContent,
      address: document.getElementById("establishment-address").value.trim(),
      capacity: Number(document.getElementById("establishment-capacity").value),
      operatingHours: document.getElementById("establishment-hours").value.trim(),
      contactName: document.getElementById("establishment-contact-name").value.trim(),
      email: document.getElementById("establishment-email").value.trim(),
      mobile: document.getElementById("establishment-mobile").value.trim(),
      position: document.getElementById("establishment-position").value.trim(),
      // Practice version: only the file NAME is saved, not the file itself
      proofFileName: proofFile ? proofFile.name : "No file",
      status: "pending",
      submittedAt: new Date().toISOString()
    };

    // Read the saved applications, add the new one at the top, and save
    const applications = loadApplications();
    applications.unshift(newApplication);

    if (!saveApplications(applications)) {
      showFormMessage("Your browser would not save the application. Please allow site storage and try again.", true);
      return;
    }

    establishmentForm.reset();
    showFormMessage(
      "Your application was sent to an administrator for review. (Practice version: it is kept in this browser.)",
      false
    );
  });
}


// ===== ADMIN LOGIN PAGE =====
const adminLoginForm = document.getElementById("admin-login-form");

// Only run this section if we are on the admin login page
if (adminLoginForm) {

  // Show the demo admin account when the page first loads
  showDemoNote(document.getElementById("demo-note"), "admin");

  // When the form is submitted
  adminLoginForm.addEventListener("submit", function (event) {
    // Stop the browser from reloading the page (the normal form behavior)
    event.preventDefault();

    const identifier = document.getElementById("admin-identifier").value;
    const password = document.getElementById("admin-password").value;

    tryDemoLogin("admin", identifier, password);
  });
}
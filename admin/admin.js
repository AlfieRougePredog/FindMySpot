// =====================================================
// FINDMYSPOT - ADMIN.JS
// JavaScript that belongs only to the admin dashboard.
// The menu switching and small helpers are in js/main.js.
// The establishment list is in js/sample-data.js.
//
// PRACTICE VERSION: invitation codes are made and kept in
// the browser. In Phase 5, the server creates the codes with
// secure random values, checks them during staff signup,
// and counts how many times each one was used.
// =====================================================

// ===== ADMIN LOGIN PROTECTION =====
const currentAdmin = requireRole("admin", "../admin-login.html");

if (!currentAdmin) {
  throw new Error("Admin login required.");
}

// ===== SETTINGS =====
// The name under which the codes are kept inside localStorage
const CODES_STORAGE_KEY = "findmyspot-invitation-codes";

// The letters and numbers a code can use.
// We left out 0, O, 1, I and L, because they look alike.
const CODE_CHARACTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// The words shown in the Status column
const STATUS_LABELS = {
  "active": "Active",
  "expired": "Expired",
  "used-up": "Used up",
  "revoked": "Revoked"
};


// ===== PAGE ELEMENTS =====
const codeForm = document.getElementById("code-form");
const establishmentSelect = document.getElementById("code-establishment");
const expiryInput = document.getElementById("code-expiry");
const limitInput = document.getElementById("code-limit");
const codeMessage = document.getElementById("code-message");
const noCodesMessage = document.getElementById("no-codes");
const tableWrapper = document.getElementById("codes-table-wrapper");
const tableBody = document.getElementById("codes-table-body");


// ===== LOADING AND SAVING THE CODES =====

// Reads the saved codes. If nothing is saved (or the data is broken), returns an empty list.
function loadCodes() {
  try {
    const savedText = localStorage.getItem(CODES_STORAGE_KEY);

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

// Saves the codes. Returns true if it worked, false if the browser did not allow it.
function saveCodes() {
  try {
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(invitationCodes));
    return true;
  } catch (error) {
    return false;
  }
}

// The list of all codes, newest first
const invitationCodes = loadCodes();


// ===== SMALL HELPERS =====

// Shows a message under the form (in red if it is an error)
function setCodeMessage(text, isError) {
  codeMessage.textContent = text;
  codeMessage.classList.toggle("error", isError);
}

// Turns a Date into text like "2026-11-07" (using the local date, not UTC).
// This format can be compared with < and >, because the biggest unit (year) comes first.
function toDateText(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// Turns "2026-11-07" into friendly text like "Nov 7, 2026"
function formatDateText(dateText) {
  const parts = dateText.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

// Makes a code like "FMS-7K3Q-9X2M"
function createCodeText() {
  let codeText;

  // Keep making codes until we get one that does not exist yet
  do {
    // crypto.getRandomValues gives better random numbers than Math.random()
    const randomNumbers = new Uint32Array(8);
    crypto.getRandomValues(randomNumbers);

    let letters = "";
    randomNumbers.forEach(function (number) {
      letters += CODE_CHARACTERS[number % CODE_CHARACTERS.length];
    });

    codeText = "FMS-" + letters.slice(0, 4) + "-" + letters.slice(4, 8);
  } while (invitationCodes.some(function (code) { return code.code === codeText; }));

  return codeText;
}

// Works out the status of one code: "revoked", "expired", "used-up" or "active".
// The order matters: a revoked code is always "revoked", even if it also expired.
function getCodeStatus(code) {
  if (code.revoked) {
    return "revoked";
  }
  // A code works through the end of its expiration day
  if (code.expiresOn < toDateText(new Date())) {
    return "expired";
  }
  if (code.usedCount >= code.usageLimit) {
    return "used-up";
  }
  return "active";
}


// ===== THE FORM =====

// Fills the establishment drop-down.
// For now, every sample establishment counts as "approved". In Phase 5, only approved ones appear.
function fillEstablishmentSelect() {
  establishmentSelect.replaceChildren();
  sampleEstablishments.forEach(function (establishment) {
    const option = document.createElement("option");
    option.value = establishment.id;
    option.textContent = establishment.name;
    establishmentSelect.append(option);
  });
}

// Sets the starting values: the earliest date is today, and the suggested date is 7 days from now
function setStartingFormValues() {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  expiryInput.min = toDateText(today);
  expiryInput.value = toDateText(nextWeek);
}

// Runs when the admin clicks "Generate Code"
codeForm.addEventListener("submit", function (event) {
  // Stop the page from reloading
  event.preventDefault();

  const establishment = sampleEstablishments.find(function (item) {
    return item.id === establishmentSelect.value;
  });
  const expiresOn = expiryInput.value;
  const usageLimit = Number(limitInput.value);

  // Check the form before making the code
  if (!establishment) {
    setCodeMessage("Please choose an establishment.", true);
    return;
  }
  if (expiresOn === "" || expiresOn < toDateText(new Date())) {
    setCodeMessage("Please choose an expiration date that is today or later.", true);
    return;
  }
  if (!Number.isInteger(usageLimit) || usageLimit < 1 || usageLimit > 50) {
    setCodeMessage("The usage limit must be a whole number from 1 to 50.", true);
    return;
  }

  // Make the code and put it at the top of the list
  const newCode = {
    code: createCodeText(),
    establishmentId: establishment.id,
    establishmentName: establishment.name,
    expiresOn: expiresOn,
    usageLimit: usageLimit,
    usedCount: 0,
    revoked: false,
    createdAt: new Date().toISOString()
  };
  invitationCodes.unshift(newCode);

  if (saveCodes()) {
    setCodeMessage("Code " + newCode.code + " was created for " + establishment.name + ".", false);
  } else {
    setCodeMessage("The code was created, but your browser would not save it. It will disappear when you refresh.", true);
  }

  renderCodesTable();
});


// ===== THE TABLE =====

// Copies a code to the clipboard
function copyCode(codeText) {
  // Some browsers only allow copying on secure pages (https or localhost)
  if (!navigator.clipboard) {
    setCodeMessage("Copying is not available in this browser. Please select the code and copy it by hand.", true);
    return;
  }

  navigator.clipboard.writeText(codeText).then(
    function () {
      setCodeMessage("Copied " + codeText + " to the clipboard.", false);
    },
    function () {
      setCodeMessage("Could not copy the code. Please select it and copy it by hand.", true);
    }
  );
}

// Disables a code. A revoked code cannot be turned back on.
function revokeCode(code) {
  const sure = window.confirm("Revoke code " + code.code + "? Staff will no longer be able to use it. This cannot be undone.");

  if (!sure) {
    return;
  }

  code.revoked = true;

  if (saveCodes()) {
    setCodeMessage("Code " + code.code + " was revoked.", false);
  } else {
    setCodeMessage("The code was revoked, but your browser would not save it. Refreshing will undo it.", true);
  }

  renderCodesTable();
}

// Creates one small button for the Actions column
function createActionButton(text, onClick) {
  const button = createTextElement("button", "btn btn-outline btn-small", text);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

// Creates one table row for one code
function createCodeRow(code) {
  const status = getCodeStatus(code);

  const row = document.createElement("tr");

  // The Status cell shows a colored badge with the status as text
  const statusCell = document.createElement("td");
  statusCell.append(createTextElement("span", "code-status is-" + status, STATUS_LABELS[status]));

  // The Actions cell: Copy always, Revoke only if the code is not revoked yet
  const actionsCell = document.createElement("td");
  actionsCell.className = "code-actions";
  actionsCell.append(createActionButton("Copy", function () {
    copyCode(code.code);
  }));
  if (!code.revoked) {
    actionsCell.append(createActionButton("Revoke", function () {
      revokeCode(code);
    }));
  }

  row.append(
    createTextElement("td", "code-text", code.code),
    createTextElement("td", "", code.establishmentName),
    createTextElement("td", "", formatDateText(code.expiresOn)),
    createTextElement("td", "", code.usedCount + " / " + code.usageLimit),
    statusCell,
    actionsCell
  );

  return row;
}

// Draws all the rows. Runs on page load and after every change.
function renderCodesTable() {
  tableBody.replaceChildren();

  invitationCodes.forEach(function (code) {
    tableBody.append(createCodeRow(code));
  });

  // Show the table if there are codes, otherwise show the "no codes" message
  const hasCodes = invitationCodes.length > 0;
  tableWrapper.hidden = !hasCodes;
  noCodesMessage.hidden = hasCodes;
}

// =====================================================
// ESTABLISHMENT APPLICATIONS
// The registration page saves the applications (see sample-data.js).
// Here the admin reviews them and approves or rejects each one.
// =====================================================

// The words shown in the Status column
const APPLICATION_STATUS_LABELS = {
  "pending": "Pending",
  "approved": "Approved",
  "rejected": "Rejected"
};

// ===== PAGE ELEMENTS (APPLICATIONS) =====
const applicationsMessage = document.getElementById("applications-message");
const noApplicationsMessage = document.getElementById("no-applications");
const applicationsTableWrapper = document.getElementById("applications-table-wrapper");
const applicationsTableBody = document.getElementById("applications-table-body");
const applicationPanel = document.getElementById("application-panel");

// The list of all applications, newest first
const establishmentApplications = loadApplications();


// ===== SMALL HELPERS (APPLICATIONS) =====

// Shows a message above the table (in red if it is an error)
function setApplicationsMessage(text, isError) {
  applicationsMessage.textContent = text;
  applicationsMessage.classList.toggle("error", isError);
}

// Turns a saved date text into friendly text like "Nov 7, 2026"
function formatSavedDate(isoText) {
  return new Date(isoText).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

// Saves the applications and shows a warning if the browser did not allow it
function saveApplicationChanges() {
  if (!saveApplications(establishmentApplications)) {
    setApplicationsMessage("Your browser would not save the change. Refreshing will undo it.", true);
    return false;
  }
  return true;
}

// Creates one row of information in the detail panel: a label and a value
function createApplicationDetailRow(label, value) {
  const row = document.createElement("div");
  row.className = "app-detail-row";
  row.append(
    createTextElement("span", "app-detail-label", label),
    createTextElement("span", "app-detail-value", value)
  );
  return row;
}


// ===== THE DETAIL PANEL =====

// Hides the detail panel
function closeApplicationPanel() {
  applicationPanel.hidden = true;
  applicationPanel.replaceChildren();
}

// Shows all the details of one application, with the buttons to decide
function showApplicationPanel(application) {
  const status = application.status;

  const rows = [
    createTextElement("h3", "", application.establishmentName),
    createTextElement("span", "application-status is-" + status, APPLICATION_STATUS_LABELS[status]),
    createApplicationDetailRow("Type", application.type),
    createApplicationDetailRow("Address", application.address),
    createApplicationDetailRow("Four-wheeled capacity", application.capacity + " slots"),
    createApplicationDetailRow("Operating hours", application.operatingHours),
    createApplicationDetailRow("Applicant", application.contactName + " (" + application.position + ")"),
    createApplicationDetailRow("Email", application.email),
    createApplicationDetailRow("Mobile number", application.mobile),
    createApplicationDetailRow("Proof document", application.proofFileName + " (file name only in this practice version)"),
    createApplicationDetailRow("Submitted", formatSavedDate(application.submittedAt))
  ];

  // After a decision, also show when it was made, and why if it was rejected
  if (application.reviewedAt) {
    rows.push(createApplicationDetailRow("Reviewed", formatSavedDate(application.reviewedAt)));
  }
  if (status === "rejected") {
    rows.push(createApplicationDetailRow("Rejection reason", application.rejectionReason));
  }

  // The buttons. Approve and Reject appear only while the application is Pending.
  const actions = document.createElement("div");
  actions.className = "application-actions";

  if (status === "pending") {
    const approveButton = createTextElement("button", "btn btn-primary btn-small", "Approve");
    approveButton.type = "button";
    approveButton.addEventListener("click", function () {
      approveApplication(application);
    });

    const rejectButton = createTextElement("button", "btn btn-outline btn-small", "Reject");
    rejectButton.type = "button";
    rejectButton.addEventListener("click", function () {
      rejectApplication(application);
    });

    actions.append(approveButton, rejectButton);
  }

  actions.append(createActionButton("Close", closeApplicationPanel));

  applicationPanel.replaceChildren(...rows, actions);
  applicationPanel.hidden = false;
}


// ===== APPROVING AND REJECTING =====

// Approves an application. This cannot be undone.
function approveApplication(application) {
  const sure = window.confirm("Approve " + application.establishmentName + "? This cannot be undone.");

  if (!sure) {
    return;
  }

  application.status = "approved";
  application.reviewedAt = new Date().toISOString();

  if (saveApplicationChanges()) {
    setApplicationsMessage(application.establishmentName + " was approved.", false);
  }

  renderApplicationsTable();
  showApplicationPanel(application);
}

// Rejects an application. The admin must give a short reason. This cannot be undone.
function rejectApplication(application) {
  const reason = window.prompt("Why are you rejecting " + application.establishmentName + "? Write a short reason.");

  // null means the admin clicked Cancel
  if (reason === null) {
    return;
  }

  if (reason.trim() === "") {
    setApplicationsMessage("Please write a reason to reject an application.", true);
    return;
  }

  application.status = "rejected";
  application.rejectionReason = reason.trim();
  application.reviewedAt = new Date().toISOString();

  if (saveApplicationChanges()) {
    setApplicationsMessage(application.establishmentName + " was rejected.", false);
  }

  renderApplicationsTable();
  showApplicationPanel(application);
}


// ===== THE TABLE (APPLICATIONS) =====

// Creates one table row for one application
function createApplicationRow(application) {
  const row = document.createElement("tr");

  const statusCell = document.createElement("td");
  statusCell.append(createTextElement(
    "span",
    "application-status is-" + application.status,
    APPLICATION_STATUS_LABELS[application.status]
  ));

  const actionsCell = document.createElement("td");
  actionsCell.append(createActionButton("Review", function () {
    setApplicationsMessage("", false);
    showApplicationPanel(application);
  }));

  row.append(
    createTextElement("td", "", application.establishmentName),
    createTextElement("td", "", application.type),
    createTextElement("td", "", String(application.capacity)),
    createTextElement("td", "", application.contactName),
    createTextElement("td", "", formatSavedDate(application.submittedAt)),
    statusCell,
    actionsCell
  );

  return row;
}

// Draws all the rows. Runs on page load and after every change.
function renderApplicationsTable() {
  applicationsTableBody.replaceChildren();

  establishmentApplications.forEach(function (application) {
    applicationsTableBody.append(createApplicationRow(application));
  });

  // Show the table if there are applications, otherwise show the "no applications" message
  const hasApplications = establishmentApplications.length > 0;
  applicationsTableWrapper.hidden = !hasApplications;
  noApplicationsMessage.hidden = hasApplications;
}

// Every time the admin opens this section, read the saved list again.
// This way, an application sent from another tab appears without refreshing the page.
document.addEventListener("sectionchange", function (event) {
  if (event.detail === "establishment-applications") {
    // splice() replaces the contents of the list, so it stays the same list
    establishmentApplications.splice(0, establishmentApplications.length, ...loadApplications());
    setApplicationsMessage("", false);
    closeApplicationPanel();
    renderApplicationsTable();
  }
});

// =====================================================
// USER AND STAFF MANAGEMENT
// The signup page saves the accounts (see sample-data.js).
// Manage Users shows drivers. Manage Staff shows parking staff.
// Both sections work the same way, so one function builds them.
// =====================================================

// The words shown in the Status column
const ACCOUNT_STATUS_LABELS = {
  "active": "Active",
  "pending": "Pending approval",
  "approved": "Approved",
  "rejected": "Rejected",
  "suspended": "Suspended"
};

// The list of all accounts (drivers and staff), newest first
const userAccounts = loadAccounts();

// Returns "First Last"
function getFullName(account) {
  return account.firstName + " " + account.lastName;
}

// Builds one section (a table, a message, and a detail panel).
// config says which accounts to show and which columns to use.
function createAccountSection(config) {
  const message = document.getElementById(config.prefix + "-message");
  const noAccountsMessage = document.getElementById("no-" + config.prefix);
  const accountsWrapper = document.getElementById(config.prefix + "-table-wrapper");
  const accountsBody = document.getElementById(config.prefix + "-table-body");
  const panel = document.getElementById(config.prefix + "-panel");

  // Shows a message above the table (in red if it is an error)
  function setMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle("error", isError);
  }

  function closePanel() {
    panel.hidden = true;
    panel.replaceChildren();
  }

  // Changes the status of one account, saves it, and redraws
  function changeStatus(account, newStatus, successText, rejectionReason) {
    account.status = newStatus;
    account.reviewedAt = new Date().toISOString();

    if (rejectionReason) {
      account.rejectionReason = rejectionReason;
    }

    if (saveAccounts(userAccounts)) {
      setMessage(successText, false);
    } else {
      setMessage("Your browser would not save the change. Refreshing will undo it.", true);
    }

    renderTable();
    showPanel(account);
  }

  // Returns the buttons that make sense for the account's current status
  function getActions(account) {
    const name = getFullName(account);
    const actions = [];

    if (account.status === "pending") {
      actions.push({
        text: "Approve",
        isPrimary: true,
        run: function () {
          if (window.confirm("Approve " + name + " as parking staff for " + account.establishmentName + "?")) {
            changeStatus(account, "approved", name + " was approved.");
          }
        }
      });

      actions.push({
        text: "Reject",
        isPrimary: false,
        run: function () {
          const reason = window.prompt("Why are you rejecting " + name + "? Write a short reason.");

          // null means the admin clicked Cancel
          if (reason === null) {
            return;
          }
          if (reason.trim() === "") {
            setMessage("Please write a reason to reject an account.", true);
            return;
          }
          changeStatus(account, "rejected", name + " was rejected.", reason.trim());
        }
      });
    }

    // Active drivers and approved staff can be suspended
    if (account.status === "active" || account.status === "approved") {
      actions.push({
        text: "Suspend",
        isPrimary: false,
        run: function () {
          if (window.confirm("Suspend " + name + "? Once login is connected in Phase 5, they will not be able to use FindMySpot until you reactivate them.")) {
            changeStatus(account, "suspended", name + " was suspended.");
          }
        }
      });
    }

    // A suspended account goes back to Active (drivers) or Approved (staff)
    if (account.status === "suspended") {
      actions.push({
        text: "Reactivate",
        isPrimary: true,
        run: function () {
          const backTo = account.role === "driver" ? "active" : "approved";
          changeStatus(account, backTo, name + " was reactivated.");
        }
      });
    }

    return actions;
  }

  // Shows all the details of one account, with the buttons
  function showPanel(account) {
    const rows = [
      createTextElement("h3", "", getFullName(account)),
      createTextElement("span", "application-status is-" + account.status, ACCOUNT_STATUS_LABELS[account.status])
    ];

    config.detailRows(account).forEach(function (pair) {
      rows.push(createApplicationDetailRow(pair[0], pair[1]));
    });

    rows.push(createApplicationDetailRow("Registered", formatSavedDate(account.createdAt)));

    if (account.reviewedAt) {
      rows.push(createApplicationDetailRow("Last status change", formatSavedDate(account.reviewedAt)));
    }
    if (account.status === "rejected") {
      rows.push(createApplicationDetailRow("Rejection reason", account.rejectionReason));
    }

    const actionsBox = document.createElement("div");
    actionsBox.className = "application-actions";

    getActions(account).forEach(function (action) {
      const button = createTextElement(
        "button",
        action.isPrimary ? "btn btn-primary btn-small" : "btn btn-outline btn-small",
        action.text
      );
      button.type = "button";
      button.addEventListener("click", action.run);
      actionsBox.append(button);
    });

    actionsBox.append(createActionButton("Close", closePanel));

    panel.replaceChildren(...rows, actionsBox);
    panel.hidden = false;
  }

  // Creates one table row for one account
  function createRow(account) {
    const row = document.createElement("tr");

    const cells = config.columns(account).map(function (text) {
      return createTextElement("td", "", text);
    });

    const statusCell = document.createElement("td");
    statusCell.append(createTextElement(
      "span",
      "application-status is-" + account.status,
      ACCOUNT_STATUS_LABELS[account.status]
    ));

    const actionsCell = document.createElement("td");
    actionsCell.append(createActionButton("Review", function () {
      setMessage("", false);
      showPanel(account);
    }));

    row.append(...cells, statusCell, actionsCell);
    return row;
  }

  // Draws all the rows of this section's role
  function renderTable() {
    const accounts = userAccounts.filter(function (account) {
      return account.role === config.role;
    });

    accountsBody.replaceChildren();
    accounts.forEach(function (account) {
      accountsBody.append(createRow(account));
    });

    accountsWrapper.hidden = accounts.length === 0;
    noAccountsMessage.hidden = accounts.length > 0;
  }

  // Every time the admin opens this section, read the saved list again,
  // so accounts created in another tab appear without refreshing.
  document.addEventListener("sectionchange", function (event) {
    if (event.detail === config.sectionName) {
      // splice() replaces the contents of the list, so it stays the same list
      userAccounts.splice(0, userAccounts.length, ...loadAccounts());
      setMessage("", false);
      closePanel();
      renderTable();
    }
  });

  return { render: renderTable };
}


// ===== THE TWO SECTIONS =====
const driverAccountsSection = createAccountSection({
  role: "driver",
  prefix: "users",
  sectionName: "manage-users",
  columns: function (account) {
    return [getFullName(account), account.email, account.mobile, formatSavedDate(account.createdAt)];
  },
  detailRows: function (account) {
    return [
      ["Account type", "Driver"],
      ["Email", account.email],
      ["Mobile number", account.mobile],
      ["Username", account.username]
    ];
  }
});

const staffAccountsSection = createAccountSection({
  role: "staff",
  prefix: "staff",
  sectionName: "manage-staff",
  columns: function (account) {
    return [
      getFullName(account),
      account.establishmentName,
      account.position,
      account.invitationCode,
      formatSavedDate(account.createdAt)
    ];
  },
  detailRows: function (account) {
    return [
      ["Account type", "Parking Staff"],
      ["Establishment", account.establishmentName],
      ["Position", account.position],
      ["Invitation code entered", account.invitationCode + " (not checked in this practice version)"],
      ["Email", account.email],
      ["Mobile number", account.mobile],
      ["Username", account.username]
    ];
  }
});

// =====================================================
// PARKING AREAS
// An approved application becomes a parking area here:
// the admin adds the coordinates and the number of slots.
// The areas are kept in the same list the driver and staff pages use
// (sampleEstablishments, see sample-data.js).
// =====================================================

// The largest number of slots one area can have
const MAX_AREA_SLOTS = 200;

// Rough limits of the Philippines. They catch typing mistakes like swapped numbers.
const LATITUDE_RANGE = [4, 22];
const LONGITUDE_RANGE = [116, 127];

// ===== PAGE ELEMENTS (PARKING AREAS) =====
const areasMessage = document.getElementById("areas-message");
const noWaitingMessage = document.getElementById("no-waiting");
const waitingWrapper = document.getElementById("waiting-table-wrapper");
const waitingBody = document.getElementById("waiting-table-body");

const areaFormPanel = document.getElementById("area-form-panel");
const areaFormTitle = document.getElementById("area-form-title");
const areaForm = document.getElementById("area-form");
const latitudeInput = document.getElementById("area-latitude");
const longitudeInput = document.getElementById("area-longitude");
const slotCountInput = document.getElementById("area-slot-count");
const areaCancelButton = document.getElementById("area-cancel");
const areaFormMessage = document.getElementById("area-form-message");

const noAreasMessage = document.getElementById("no-areas");
const areasWrapper = document.getElementById("areas-table-wrapper");
const areasBody = document.getElementById("areas-table-body");

// The id of the application whose form is open (null when the form is closed)
let formApplicationId = null;


// ===== SMALL HELPERS (PARKING AREAS) =====

// Shows a message above the tables (in red if it is an error)
function setAreasMessage(text, isError) {
  areasMessage.textContent = text;
  areasMessage.classList.toggle("error", isError);
}

// Shows a message inside the form (in red if it is an error)
function setAreaFormMessage(text, isError) {
  areaFormMessage.textContent = text;
  areaFormMessage.classList.toggle("error", isError);
}

// Reads the saved parking areas and applications again.
// splice() replaces the contents of a list, so it stays the same list.
function reloadAreaData() {
  sampleEstablishments.splice(0, sampleEstablishments.length, ...loadEstablishments());
  establishmentApplications.splice(0, establishmentApplications.length, ...loadApplications());
}

// Saves the parking areas and warns the admin if the browser did not allow it
function saveAreaChanges() {
  if (!saveEstablishments(sampleEstablishments)) {
    setAreasMessage("Your browser would not save the change. Refreshing will undo it.", true);
    return false;
  }
  return true;
}

// Returns the approved applications that do not have a parking area yet
function getWaitingApplications() {
  return establishmentApplications.filter(function (application) {
    if (application.status !== "approved") {
      return false;
    }
    return !sampleEstablishments.some(function (area) {
      return area.applicationId === application.id;
    });
  });
}

// Finds a saved parking area by its id
function findArea(areaId) {
  return sampleEstablishments.find(function (area) {
    return area.id === areaId;
  });
}


// ===== THE FORM (PARKING AREAS) =====

function closeAreaForm() {
  formApplicationId = null;
  areaFormPanel.hidden = true;
  areaForm.reset();
  setAreaFormMessage("", false);
}

// Opens the form for one approved application
function openAreaForm(application) {
  formApplicationId = application.id;
  areaForm.reset();
  setAreaFormMessage("", false);

  areaFormTitle.textContent = "Create parking area: " + application.establishmentName;

  // Suggest the capacity from the application (but never more than the maximum)
  slotCountInput.value = Math.min(application.capacity, MAX_AREA_SLOTS);

  areaFormPanel.hidden = false;
  latitudeInput.focus();
}

areaCancelButton.addEventListener("click", closeAreaForm);

// Runs when the admin clicks "Create Parking Area"
areaForm.addEventListener("submit", function (event) {
  // Stop the page from reloading
  event.preventDefault();

  if (formApplicationId === null) {
    return;
  }

  // Read the saved data again, in case something changed in another tab
  reloadAreaData();

  const application = establishmentApplications.find(function (item) {
    return item.id === formApplicationId;
  });

  if (!application || application.status !== "approved") {
    setAreaFormMessage("This application is no longer approved. Please close the form and try again.", true);
    return;
  }

  const alreadyCreated = sampleEstablishments.some(function (area) {
    return area.applicationId === application.id;
  });
  if (alreadyCreated) {
    closeAreaForm();
    setAreasMessage("A parking area for " + application.establishmentName + " already exists.", true);
    renderAreasSection();
    return;
  }

  // Check the numbers before making the area
  const latitudeText = latitudeInput.value.trim();
  const longitudeText = longitudeInput.value.trim();
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  const slotCount = Number(slotCountInput.value);

  if (latitudeText === "" || longitudeText === "" || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    setAreaFormMessage("Please enter the latitude and longitude as numbers, like 7.3089 and 125.6842.", true);
    return;
  }
  if (latitude < LATITUDE_RANGE[0] || latitude > LATITUDE_RANGE[1] ||
      longitude < LONGITUDE_RANGE[0] || longitude > LONGITUDE_RANGE[1]) {
    setAreaFormMessage("These coordinates are outside the Philippines. Check that the latitude and longitude are not swapped.", true);
    return;
  }
  if (!Number.isInteger(slotCount) || slotCount < 1 || slotCount > MAX_AREA_SLOTS) {
    setAreaFormMessage("The number of slots must be a whole number from 1 to " + MAX_AREA_SLOTS + ".", true);
    return;
  }

  // Make the parking area. All new slots start as Available (no occupied slot numbers).
  const newArea = {
    id: "area-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    applicationId: application.id,
    name: application.establishmentName,
    type: application.type,
    address: application.address,
    hours: application.operatingHours,
    latitude: latitude,
    longitude: longitude,
    slots: createSlots(slotCount, []),
    lastUpdated: new Date()
  };
  sampleEstablishments.push(newArea);

// Save the parking area first
const wasSaved = saveAreaChanges();

// Only start the free trial if the parking area was saved
const trialStarted = wasSaved ? startTrial(newArea.id) : false;

closeAreaForm();

  if (wasSaved) {
    const trialText = trialStarted ? " Its 30-day free trial has started." : "";
    setAreasMessage("Parking area created for " + newArea.name + " with " + slotCount + " slots." + trialText + " Drivers will see it after they refresh.", false);
  }

  // The invitation code drop-down should list the new area too
  fillEstablishmentSelect();
  renderAreasSection();
});


// ===== CHANGING THE SLOTS OF AN AREA =====

// Reads the saved data again, finds the area, applies the change, saves and redraws
function updateArea(areaId, change) {
  reloadAreaData();

  const area = findArea(areaId);
  if (!area) {
    setAreasMessage("This parking area was not found. The list was refreshed.", true);
    renderAreasSection();
    return;
  }

  if (change(area) && saveAreaChanges()) {
    renderAreasSection();
  } else {
    renderAreasSection();
  }
}

// Adds one new Available slot at the end
function addSlot(area) {
  updateArea(area.id, function (freshArea) {
    const newNumber = freshArea.slots.length + 1;

    if (newNumber > MAX_AREA_SLOTS) {
      setAreasMessage("A parking area can have at most " + MAX_AREA_SLOTS + " slots.", true);
      return false;
    }

    freshArea.slots.push({ label: "Slot " + newNumber, status: "available" });
    setAreasMessage(freshArea.name + " now has " + newNumber + " slots.", false);
    return true;
  });
}

// Removes the last slot (after the admin confirms)
function removeLastSlot(area) {
  if (area.slots.length <= 1) {
    setAreasMessage("A parking area needs at least 1 slot.", true);
    return;
  }

  const lastSlot = area.slots[area.slots.length - 1];
  const sure = window.confirm("Remove " + lastSlot.label + " from " + area.name + "? This cannot be undone.");

  if (!sure) {
    return;
  }

  updateArea(area.id, function (freshArea) {
    if (freshArea.slots.length <= 1) {
      setAreasMessage("A parking area needs at least 1 slot.", true);
      return false;
    }

    freshArea.slots.pop();
    setAreasMessage(freshArea.name + " now has " + freshArea.slots.length + " slots.", false);
    return true;
  });
}


// ===== THE TABLES (PARKING AREAS) =====

// One row of the "waiting for a parking area" table
function createWaitingRow(application) {
  const row = document.createElement("tr");

  const actionsCell = document.createElement("td");
  actionsCell.append(createActionButton("Create Parking Area", function () {
    setAreasMessage("", false);
    openAreaForm(application);
  }));

  row.append(
    createTextElement("td", "", application.establishmentName),
    createTextElement("td", "", application.type),
    createTextElement("td", "", String(application.capacity)),
    createTextElement("td", "", application.contactName),
    actionsCell
  );

  return row;
}

// One row of the parking areas table
function createAreaRow(area) {
  const row = document.createElement("tr");

  const availableCount = countAvailableSlots(area);
  const slotsText = area.slots.length + " slots (" + availableCount + " available)";
  const coordinatesText = area.latitude.toFixed(5) + ", " + area.longitude.toFixed(5);

  const actionsCell = document.createElement("td");
  actionsCell.className = "code-actions";
  actionsCell.append(
    createActionButton("Add Slot", function () {
      addSlot(area);
    }),
    createActionButton("Remove Last Slot", function () {
      removeLastSlot(area);
    })
  );

  row.append(
    createTextElement("td", "", area.name),
    createTextElement("td", "", area.type),
    createTextElement("td", "", slotsText),
    createTextElement("td", "", coordinatesText),
    createTextElement("td", "", formatLastUpdated(area.lastUpdated)),
    actionsCell
  );

  return row;
}

// Draws both tables. Runs on page load and after every change.
function renderAreasSection() {
  const waiting = getWaitingApplications();

  waitingBody.replaceChildren();
  waiting.forEach(function (application) {
    waitingBody.append(createWaitingRow(application));
  });
  waitingWrapper.hidden = waiting.length === 0;
  noWaitingMessage.hidden = waiting.length > 0;

  areasBody.replaceChildren();
  sampleEstablishments.forEach(function (area) {
    areasBody.append(createAreaRow(area));
  });
  areasWrapper.hidden = sampleEstablishments.length === 0;
  noAreasMessage.hidden = sampleEstablishments.length > 0;
}

// Every time the admin opens this section, read the saved data again,
// so applications approved or changes made in another tab appear without refreshing.
document.addEventListener("sectionchange", function (event) {
  if (event.detail === "manage-parking-areas") {
    reloadAreaData();
    setAreasMessage("", false);
    closeAreaForm();
    renderAreasSection();
  }
});

// =====================================================
// DASHBOARD NUMBER CARDS
// =====================================================

// Counts what needs the administrator's attention
function updateAdminStats() {
  const pendingApplications = establishmentApplications.filter(function (application) {
    return application.status === "pending";
  }).length;

  const pendingStaff = userAccounts.filter(function (account) {
    return account.role === "staff" && account.status === "pending";
  }).length;

  const activeCodes = invitationCodes.filter(function (code) {
    return getCodeStatus(code) === "active";
  }).length;

  renderStatCards([
    { label: "Pending applications", value: pendingApplications, note: "Waiting for your review" },
    { label: "Pending staff", value: pendingStaff, note: "Waiting for approval" },
    { label: "Active invitation codes", value: activeCodes, note: "Can still be used", tone: "good" },
    { label: "Parking areas", value: sampleEstablishments.length, note: "Visible to drivers" }
  ]);
}

// Each time the Dashboard section opens, read the saved data again,
// so the numbers include changes made in other tabs.
document.addEventListener("sectionchange", function (event) {
  if (event.detail === "dashboard") {
    establishmentApplications.splice(0, establishmentApplications.length, ...loadApplications());
    userAccounts.splice(0, userAccounts.length, ...loadAccounts());
    invitationCodes.splice(0, invitationCodes.length, ...loadCodes());
    sampleEstablishments.splice(0, sampleEstablishments.length, ...loadEstablishments());
    updateAdminStats();
  }
});

// ===== STARTING THE PAGE =====
fillEstablishmentSelect();
setStartingFormValues();
renderCodesTable();
renderApplicationsTable();
driverAccountsSection.render();
staffAccountsSection.render();
renderAreasSection();
updateAdminStats();
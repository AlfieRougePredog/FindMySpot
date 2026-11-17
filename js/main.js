// =====================================================
// FINDMYSPOT - MAIN.JS
// Shared JavaScript used by the public website and
// by the driver, staff and admin dashboards.
// Features are added here one at a time, with comments.
// =====================================================


// ===== SHARED HELPERS =====

// Creates one element (like <p> or <h3>) with a class and some text.
// We use textContent, not innerHTML, so text is always shown as plain text (safer).
function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

// Returns the availability text, for example "6 of 12 slots available"
function getAvailabilityText(availableCount, totalCount) {
  if (availableCount > 0) {
    return availableCount + " of " + totalCount + " slots available";
  }
  return "Full: 0 of " + totalCount + " slots available";
}
// Turns a date into friendly text, like "6 minutes ago"
function formatLastUpdated(date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (minutes < 1) {
    return "Just now";
  }
  if (minutes === 1) {
    return "1 minute ago";
  }
  if (minutes < 60) {
    return minutes + " minutes ago";
  }
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Draws the number cards at the top of a dashboard.
// stats is a list like: [{ label: "Slots", value: 12, note: "In total", tone: "good" }]
// tone is optional: "good" gives a green edge, "bad" a red edge.
function renderStatCards(stats) {
  const grid = document.getElementById("stat-grid");

  // Only run if this page has a place for the cards
  if (!grid) {
    return;
  }

  grid.replaceChildren();

  stats.forEach(function (stat) {
    const card = document.createElement("div");
    card.className = "stat-card" + (stat.tone ? " is-" + stat.tone : "");
    card.append(
      createTextElement("span", "stat-number", String(stat.value)),
      createTextElement("span", "stat-label", stat.label),
      createTextElement("span", "stat-note", stat.note)
    );
    grid.append(card);
  });
}

// ===== FOOTER YEAR =====
// Finds the footer element that has the id "current-year"
const yearElement = document.getElementById("current-year");

// Only run if that element exists on this page (not every page has a footer)
if (yearElement) {
  // new Date().getFullYear() gives the current year, for example 2026
  yearElement.textContent = new Date().getFullYear();
}


// ===== DASHBOARD MENU (used by the driver, staff and admin dashboards) =====
// Every section of a dashboard has the class "dashboard-section"
const dashboardSections = document.querySelectorAll(".dashboard-section");

// Only run if this page is a dashboard
if (dashboardSections.length > 0) {

  // Every button with a data-section attribute can open a section
  // (the sidebar links and the quick-action cards)
  const sectionButtons = document.querySelectorAll("[data-section]");
  const sidebarLinks = document.querySelectorAll(".sidebar-link");

  // Shows one section and hides all the others
  function showSection(sectionName) {

    // A section is shown only if its id matches "section-" plus the chosen name
    dashboardSections.forEach(function (section) {
      section.hidden = section.id !== "section-" + sectionName;
    });

    // Highlight the matching sidebar link and remove the highlight from the others
    sidebarLinks.forEach(function (link) {
      const isChosen = link.dataset.section === sectionName;
      link.classList.toggle("active", isChosen);
      link.setAttribute("aria-current", isChosen ? "page" : "false");
    });

    // Announce which section was opened, so other scripts can react
    // (for example, driver.js creates the map when the map section opens)
    document.dispatchEvent(new CustomEvent("sectionchange", { detail: sectionName }));
  }

  // When any of those buttons is clicked, open its section
  sectionButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      showSection(button.dataset.section);
    });
  });

  // When the page first loads, start on the Dashboard section
  showSection("dashboard");
}
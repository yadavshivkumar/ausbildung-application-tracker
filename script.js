(() => {
  "use strict";

  const STORAGE_KEY = "ausbildungTracker.applications.v1";
  const SCHEMA_VERSION = 1;
  const STATUSES = [
    "Applied", "Documents Requested", "Interview", "Offer Received",
    "Accepted", "Rejected", "Withdrawn"
  ];
  const ACTIVE_STATUSES = ["Applied", "Documents Requested", "Interview", "Offer Received"];
  const STATUS_COLORS = {
    "Applied": "#6484ec", "Documents Requested": "#e0a33e", "Interview": "#9876df",
    "Offer Received": "#35a979", "Accepted": "#16845b", "Rejected": "#db6666", "Withdrawn": "#9ba4b4"
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const dateOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const makeId = () => (crypto && crypto.randomUUID) ? crypto.randomUUID() : `app-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(d);
  };
  const shortDate = (value) => {
    if (!value) return { month: "—", day: "—" };
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return { month: "—", day: "—" };
    return { month: new Intl.DateTimeFormat(undefined, { month: "short" }).format(d), day: d.getDate() };
  };
  const dayDifference = (value) => {
    if (!value) return null;
    const a = new Date(`${todayISO()}T00:00:00`);
    const b = new Date(`${value}T00:00:00`);
    return Math.round((b - a) / 86400000);
  };
  const statusClass = (status) => `status-${status.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "?";
  const companyColor = (name = "") => [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 5;
  const compareDates = (a, b) => (a || "9999-12-31").localeCompare(b || "9999-12-31");
  const isActive = (app) => ACTIVE_STATUSES.includes(app.status);
  const isOffer = (app) => ["Offer Received", "Accepted"].includes(app.status);

  const seedApplications = () => [
    { id: makeId(), company: "Siemens AG", role: "Fachinformatiker/in für Anwendungsentwicklung", city: "Berlin", appliedDate: dateOffset(-18), status: "Interview", deadline: dateOffset(12), interviewDate: dateOffset(4), followUpDate: dateOffset(2), website: "https://www.siemens.com", contact: "Talent Acquisition", notes: "Prepare examples of coding projects and review the company profile.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: makeId(), company: "Deutsche Bahn", role: "Eisenbahner/in im Betriebsdienst", city: "Hamburg", appliedDate: dateOffset(-14), status: "Applied", deadline: dateOffset(18), interviewDate: "", followUpDate: dateOffset(5), website: "https://www.deutschebahn.com", contact: "", notes: "Follow up if there is no response after a week.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: makeId(), company: "Bosch", role: "Mechatroniker/in", city: "Stuttgart", appliedDate: dateOffset(-30), status: "Documents Requested", deadline: dateOffset(6), interviewDate: "", followUpDate: dateOffset(1), website: "https://www.bosch.com", contact: "Recruiting team", notes: "Upload the latest school certificate and language certificate.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: makeId(), company: "Bayer AG", role: "Chemielaborant/in", city: "Leverkusen", appliedDate: dateOffset(-22), status: "Offer Received", deadline: dateOffset(9), interviewDate: dateOffset(-3), followUpDate: dateOffset(3), website: "https://www.bayer.com", contact: "", notes: "Review offer conditions and response deadline.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: makeId(), company: "Lufthansa Technik", role: "Fluggerätmechaniker/in", city: "Frankfurt am Main", appliedDate: dateOffset(-11), status: "Applied", deadline: dateOffset(25), interviewDate: "", followUpDate: "", website: "https://www.lufthansa-technik.com", contact: "", notes: "Application submitted online.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: makeId(), company: "dm-drogerie markt", role: "Kaufmann/-frau im Einzelhandel", city: "Karlsruhe", appliedDate: dateOffset(-40), status: "Rejected", deadline: "", interviewDate: "", followUpDate: "", website: "https://www.dm.de", contact: "", notes: "Thank them for the update and keep looking for other openings.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  let applications = [];
  let currentView = "dashboard";
  let detailApplicationId = null;
  let toastTimer = null;

  function loadApplications() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        applications = seedApplications();
        persist();
        return;
      }
      const parsed = JSON.parse(raw);
      const rows = Array.isArray(parsed) ? parsed : parsed.applications;
      if (!Array.isArray(rows)) throw new Error("The saved data format is not recognized.");
      applications = rows.map(normalizeApplication).filter(Boolean);
    } catch (error) {
      applications = seedApplications();
      showToast("Saved data could not be read. Sample data has been loaded.", "error");
      persist();
    }
  }

  function normalizeApplication(item) {
    if (!item || typeof item !== "object" || !item.company || !item.role) return null;
    const status = STATUSES.includes(item.status) ? item.status : "Applied";
    return {
      id: String(item.id || makeId()),
      company: String(item.company).slice(0, 100),
      role: String(item.role).slice(0, 120),
      city: String(item.city || "").slice(0, 100),
      appliedDate: validDate(item.appliedDate) ? item.appliedDate : todayISO(),
      status,
      deadline: validDate(item.deadline) ? item.deadline : "",
      interviewDate: validDate(item.interviewDate) ? item.interviewDate : "",
      followUpDate: validDate(item.followUpDate) ? item.followUpDate : "",
      website: String(item.website || "").slice(0, 300),
      contact: String(item.contact || "").slice(0, 160),
      notes: String(item.notes || "").slice(0, 1500),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    };
  }

  function validDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
      return true;
    } catch (error) {
      showToast("Could not save data. Check browser storage availability.", "error");
      return false;
    }
  }

  function showToast(message, type = "success") {
    const region = $("#toastRegion");
    if (!region) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    region.appendChild(toast);
    setTimeout(() => toast.remove(), 3600);
  }

  function statusOptions(selected = "", includeAll = false) {
    return `${includeAll ? '<option value="">All statuses</option>' : ""}${STATUSES.map(status => `<option value="${escapeHTML(status)}" ${status === selected ? "selected" : ""}>${escapeHTML(status)}</option>`).join("")}`;
  }

  function init() {
    loadApplications();
    $("#todayLabel").textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
    $("#status").innerHTML = statusOptions("Applied");
    $("#statusFilter").innerHTML = statusOptions("", true);
    $("#appliedDate").value = todayISO();
    bindEvents();
    renderAll();
  }

  function bindEvents() {
    $$(".nav-item").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
    $$("[data-go]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.go)));
    $$("[data-add]").forEach(button => button.addEventListener("click", () => openForm()));
    $("#topAddBtn").addEventListener("click", () => openForm());
    $("#mobileMenuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
    $("#applicationForm").addEventListener("submit", handleSubmit);
    $("#closeModalBtn").addEventListener("click", closeForm);
    $("#cancelModalBtn").addEventListener("click", closeForm);
    $("#closeDetailBtn").addEventListener("click", closeDetails);
    $("#detailCloseBtn").addEventListener("click", closeDetails);
    $("#detailEditBtn").addEventListener("click", () => {
      const app = applications.find(item => item.id === detailApplicationId);
      closeDetails();
      if (app) openForm(app);
    });
    $("#applicationModal").addEventListener("click", event => { if (event.target === $("#applicationModal")) closeForm(); });
    $("#detailModal").addEventListener("click", event => { if (event.target === $("#detailModal")) closeDetails(); });
    $("#searchInput").addEventListener("input", renderApplicationsTable);
    $("#statusFilter").addEventListener("change", renderApplicationsTable);
    $("#sortSelect").addEventListener("change", renderApplicationsTable);
    $("#clearFiltersBtn").addEventListener("click", () => {
      $("#searchInput").value = "";
      $("#statusFilter").value = "";
      $("#sortSelect").value = "updated";
      renderApplicationsTable();
    });
    $("#notes").addEventListener("input", () => $("#notesCount").textContent = `${$("#notes").value.length} / 1500`);
    ["company", "role", "city", "appliedDate", "website"].forEach(id => {
      $(`#${id}`).addEventListener("input", () => clearFieldError(id));
    });
    $("#dashboardExportBtn").addEventListener("click", openExportMenu);
    $("#importFileInput").addEventListener("change", handleImportFile);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") { closeForm(); closeDetails(); $("#sidebar").classList.remove("open"); }
    });
    document.addEventListener("click", event => {
      const editButton = event.target.closest("[data-edit]");
      const viewButton = event.target.closest("[data-detail]");
      const deleteButton = event.target.closest("[data-delete]");
      if (editButton) {
        const app = applications.find(item => item.id === editButton.dataset.edit);
        if (app) openForm(app);
      } else if (viewButton) {
        openDetails(viewButton.dataset.detail);
      } else if (deleteButton) {
        deleteApplication(deleteButton.dataset.delete);
      }
    });
  }

  function navigate(view) {
    if (!["dashboard", "applications", "deadlines"].includes(view)) return;
    currentView = view;
    $$(".view").forEach(section => section.classList.toggle("active", section.id === `${view}View`));
    $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    $("#breadcrumbCurrent").textContent = view === "dashboard" ? "Dashboard" : view === "applications" ? "Applications" : "Deadlines";
    $("#sidebar").classList.remove("open");
    if (view === "applications") renderApplicationsTable();
    if (view === "deadlines") renderDeadlines();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderAll() {
    renderDashboard();
    renderApplicationsTable();
    renderDeadlines();
    $("#navApplicationCount").textContent = applications.length;
  }

  function renderDashboard() {
    const total = applications.length;
    const active = applications.filter(isActive).length;
    const interviews = applications.filter(app => app.status === "Interview").length;
    const offers = applications.filter(isOffer).length;
    const tasks = getTasks().filter(task => task.days >= 0 && task.days <= 14).length;
    const overdue = getTasks().filter(task => task.days < 0).length;
    $("#statTotal").textContent = total;
    $("#statActive").textContent = `${active} active`;
    $("#activeTrack").style.width = `${total ? Math.round(active / total * 100) : 0}%`;
    $("#statInterviews").textContent = interviews;
    $("#statOffers").textContent = offers;
    $("#offerRate").textContent = `${total ? Math.round(offers / total * 100) : 0}% of total`;
    $("#statActions").textContent = tasks;
    $("#overdueNote").textContent = `${overdue} overdue`;
    $("#overdueNote").classList.toggle("positive", overdue === 0);
    renderPipeline();
    renderDashboardDeadlines();
    renderRecentTable();
  }

  function renderPipeline() {
    const counts = STATUSES.map(status => ({ status, count: applications.filter(app => app.status === status).length }));
    $("#pipeline").innerHTML = counts.map(({ status, count }) => {
      const width = applications.length ? count / applications.length * 100 : 0;
      return `<div class="pipeline-row"><span class="pipeline-label">${escapeHTML(status)}</span><div class="pipeline-track"><div class="pipeline-fill" style="width:${width}%;background:${STATUS_COLORS[status]}"></div></div><span class="pipeline-count">${count}</span></div>`;
    }).join("");
  }

  function getTasks() {
    const tasks = [];
    applications.forEach(app => {
      if (app.status === "Accepted" || app.status === "Rejected" || app.status === "Withdrawn") return;
      if (app.deadline) tasks.push({ id: `${app.id}-deadline`, appId: app.id, company: app.company, role: app.role, type: "Application deadline", date: app.deadline, days: dayDifference(app.deadline) });
      if (app.interviewDate) tasks.push({ id: `${app.id}-interview`, appId: app.id, company: app.company, role: app.role, type: "Interview", date: app.interviewDate, days: dayDifference(app.interviewDate) });
      if (app.followUpDate) tasks.push({ id: `${app.id}-followup`, appId: app.id, company: app.company, role: app.role, type: "Follow-up", date: app.followUpDate, days: dayDifference(app.followUpDate) });
    });
    return tasks.sort((a, b) => a.date.localeCompare(b.date) || a.company.localeCompare(b.company));
  }

  function taskTag(task) {
    if (task.days < 0) return `<span class="deadline-tag overdue">Overdue</span>`;
    if (task.days === 0) return `<span class="deadline-tag soon">Today</span>`;
    if (task.days <= 3) return `<span class="deadline-tag soon">${task.days}d left</span>`;
    return `<span class="deadline-tag">${task.days}d left</span>`;
  }

  function renderDashboardDeadlines() {
    const tasks = getTasks().filter(task => task.days <= 14).slice(0, 4);
    const container = $("#dashboardDeadlines");
    if (!tasks.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><strong>You're all caught up</strong><p>No upcoming tasks in the next 14 days.</p></div>`;
      return;
    }
    container.innerHTML = tasks.map(task => {
      const date = shortDate(task.date);
      return `<div class="deadline-row"><div class="date-tile ${task.days < 0 ? "overdue" : ""}"><span class="month">${escapeHTML(date.month)}</span><span class="day">${date.day}</span></div><div class="deadline-info"><strong>${escapeHTML(task.company)}</strong><small>${escapeHTML(task.type)} · ${escapeHTML(task.role)}</small></div>${taskTag(task)}</div>`;
    }).join("");
  }

  function companyMarkup(app) {
    return `<div class="company-cell"><div class="company-logo color-${companyColor(app.company)}">${escapeHTML(initials(app.company))}</div><div><span class="company-name">${escapeHTML(app.company)}</span><span class="company-role">${escapeHTML(app.role)}</span></div></div>`;
  }

  function statusMarkup(status) {
    return `<span class="status-badge ${statusClass(status)}">${escapeHTML(status)}</span>`;
  }

  function rowActions(app) {
    return `<div class="row-actions"><button class="row-action" data-detail="${escapeHTML(app.id)}" title="View details" aria-label="View ${escapeHTML(app.company)}">↗</button><button class="row-action" data-edit="${escapeHTML(app.id)}" title="Edit" aria-label="Edit ${escapeHTML(app.company)}">✎</button><button class="row-action delete" data-delete="${escapeHTML(app.id)}" title="Delete" aria-label="Delete ${escapeHTML(app.company)}">×</button></div>`;
  }

  function renderRecentTable() {
    const body = $("#recentTableBody");
    const rows = [...applications].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 5);
    body.innerHTML = rows.map(app => `<tr><td>${companyMarkup(app)}</td><td>${escapeHTML(app.city || "—")}</td><td>${formatDate(app.appliedDate)}</td><td>${statusMarkup(app.status)}</td><td>${rowActions(app)}</td></tr>`).join("");
    $("#recentEmpty").classList.toggle("hidden", rows.length > 0);
    body.closest(".table-wrap").classList.toggle("hidden", rows.length === 0);
  }

  function getFilteredApplications() {
    const query = $("#searchInput").value.trim().toLowerCase();
    const status = $("#statusFilter").value;
    const sort = $("#sortSelect").value;
    const rows = applications.filter(app => {
      const matchesQuery = !query || [app.company, app.role, app.city, app.contact, app.notes].some(value => String(value || "").toLowerCase().includes(query));
      return matchesQuery && (!status || app.status === status);
    });
    rows.sort((a, b) => {
      if (sort === "applied-desc") return b.appliedDate.localeCompare(a.appliedDate);
      if (sort === "applied-asc") return a.appliedDate.localeCompare(b.appliedDate);
      if (sort === "deadline") return compareDates(a.deadline, b.deadline);
      if (sort === "company") return a.company.localeCompare(b.company);
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });
    return rows;
  }

  function renderApplicationsTable() {
    const body = $("#applicationsTableBody");
    if (!body) return;
    const rows = getFilteredApplications();
    body.innerHTML = rows.map(app => {
      const days = dayDifference(app.deadline);
      let deadlineText = formatDate(app.deadline);
      if (app.deadline && days < 0 && !["Accepted", "Rejected", "Withdrawn"].includes(app.status)) deadlineText += ` <span class="deadline-tag overdue">Overdue</span>`;
      else if (app.deadline && days >= 0 && days <= 3 && !["Accepted", "Rejected", "Withdrawn"].includes(app.status)) deadlineText += ` <span class="deadline-tag soon">${days === 0 ? "Today" : `${days}d`}</span>`;
      return `<tr><td>${companyMarkup(app)}</td><td>${escapeHTML(app.city || "—")}</td><td>${formatDate(app.appliedDate)}</td><td>${deadlineText}</td><td>${statusMarkup(app.status)}</td><td>${rowActions(app)}</td></tr>`;
    }).join("");
    $("#resultsCount").textContent = `${rows.length} of ${applications.length} application${applications.length === 1 ? "" : "s"}`;
    $("#applicationsEmpty").classList.toggle("hidden", rows.length > 0);
    $("#applicationsEmptyTitle").textContent = applications.length && ($("#searchInput").value || $("#statusFilter").value) ? "No matching applications" : "No applications yet";
    $("#applicationsEmptyText").textContent = applications.length && ($("#searchInput").value || $("#statusFilter").value) ? "Try changing your search or filters." : "Add your first opportunity to start tracking your progress.";
    body.closest(".table-wrap").classList.toggle("hidden", rows.length === 0);
  }

  function renderDeadlines() {
    const tasks = getTasks();
    const overdue = tasks.filter(task => task.days < 0).length;
    const next7 = tasks.filter(task => task.days >= 0 && task.days <= 7).length;
    const next30 = tasks.filter(task => task.days >= 0 && task.days <= 30).length;
    $("#deadlineSummary").innerHTML = `<div class="deadline-summary-card danger"><span>Overdue tasks</span><strong>${overdue}</strong></div><div class="deadline-summary-card warning"><span>Due in the next 7 days</span><strong>${next7}</strong></div><div class="deadline-summary-card"><span>Due in the next 30 days</span><strong>${next30}</strong></div>`;
    const container = $("#allDeadlineItems");
    if (!tasks.length) {
      container.innerHTML = "";
      $("#deadlinesEmpty").classList.remove("hidden");
      return;
    }
    $("#deadlinesEmpty").classList.add("hidden");
    container.innerHTML = tasks.map(task => {
      const date = shortDate(task.date);
      return `<div class="all-deadline-item"><div class="date-tile ${task.days < 0 ? "overdue" : ""}"><span class="month">${escapeHTML(date.month)}</span><span class="day">${date.day}</span></div><div class="deadline-item-main"><strong>${escapeHTML(task.company)} <span style="font-weight:500;color:#8792a6">· ${escapeHTML(task.type)}</span></strong><p>${escapeHTML(task.role)}${task.days < 0 ? ` · ${Math.abs(task.days)} day${Math.abs(task.days) === 1 ? "" : "s"} overdue` : task.days === 0 ? " · Due today" : ` · In ${task.days} day${task.days === 1 ? "" : "s"}`}</p></div><div class="deadline-item-side">${taskTag(task)}<button class="row-action" data-detail="${escapeHTML(task.appId)}" title="View application">↗</button><button class="row-action" data-edit="${escapeHTML(task.appId)}" title="Edit application">✎</button></div></div>`;
    }).join("");
  }

  function openForm(app = null) {
    const form = $("#applicationForm");
    form.reset();
    clearAllErrors();
    $("#applicationId").value = app ? app.id : "";
    $("#modalTitle").textContent = app ? "Edit application" : "Add application";
    $("#saveApplicationBtn").textContent = app ? "Save changes" : "Save application";
    $("#company").value = app?.company || "";
    $("#role").value = app?.role || "";
    $("#city").value = app?.city || "";
    $("#appliedDate").value = app?.appliedDate || todayISO();
    $("#status").value = app?.status || "Applied";
    $("#deadline").value = app?.deadline || "";
    $("#interviewDate").value = app?.interviewDate || "";
    $("#followUpDate").value = app?.followUpDate || "";
    $("#website").value = app?.website || "";
    $("#contact").value = app?.contact || "";
    $("#notes").value = app?.notes || "";
    $("#notesCount").textContent = `${$("#notes").value.length} / 1500`;
    $("#formErrorBanner").classList.add("hidden");
    $("#applicationModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#company").focus(), 50);
  }

  function closeForm() {
    $("#applicationModal").classList.add("hidden");
    if ($("#detailModal").classList.contains("hidden")) document.body.style.overflow = "";
  }

  function clearFieldError(id) {
    const input = $(`#${id}`);
    input?.classList.remove("invalid");
    const error = $(`#${id}Error`);
    if (error) error.textContent = "";
  }

  function clearAllErrors() {
    ["company", "role", "city", "appliedDate", "website"].forEach(clearFieldError);
    $("#formErrorBanner").classList.add("hidden");
  }

  function setFieldError(id, message) {
    const input = $(`#${id}`);
    input.classList.add("invalid");
    const error = $(`#${id}Error`);
    if (error) error.textContent = message;
  }

  function validateForm() {
    clearAllErrors();
    const values = {
      company: $("#company").value.trim(),
      role: $("#role").value.trim(),
      city: $("#city").value.trim(),
      appliedDate: $("#appliedDate").value,
      deadline: $("#deadline").value,
      interviewDate: $("#interviewDate").value,
      followUpDate: $("#followUpDate").value,
      website: $("#website").value.trim()
    };
    let valid = true;
    for (const key of ["company", "role", "city"]) {
      if (!values[key]) { setFieldError(key, "This field is required."); valid = false; }
    }
    if (!validDate(values.appliedDate)) { setFieldError("appliedDate", "Enter a valid application date."); valid = false; }
    if (values.website) {
      try {
        const url = new URL(values.website);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        setFieldError("website", "Enter a valid URL, including https://."); valid = false;
      }
    }
    for (const key of ["deadline", "interviewDate", "followUpDate"]) {
      if (values[key] && !validDate(values[key])) {
        $("#formErrorBanner").textContent = `Please enter a valid ${key === "deadline" ? "deadline" : key === "interviewDate" ? "interview date" : "follow-up date"}.`;
        $("#formErrorBanner").classList.remove("hidden");
        valid = false;
      }
    }
    if (!valid) {
      const first = $(".field input.invalid, .field select.invalid, .field textarea.invalid");
      first?.focus();
      return null;
    }
    return values;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const values = validateForm();
    if (!values) return;
    const id = $("#applicationId").value;
    const old = applications.find(app => app.id === id);
    const record = {
      id: old ? old.id : makeId(),
      ...values,
      status: $("#status").value,
      contact: $("#contact").value.trim(),
      notes: $("#notes").value.trim(),
      createdAt: old?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (old) applications = applications.map(app => app.id === id ? record : app);
    else applications.unshift(record);
    persist();
    closeForm();
    renderAll();
    showToast(old ? "Application updated successfully." : "Application added successfully.");
  }

  function deleteApplication(id) {
    const app = applications.find(item => item.id === id);
    if (!app) return;
    const confirmed = window.confirm(`Delete the application for ${app.company}?\n\nThis action cannot be undone.`);
    if (!confirmed) return;
    applications = applications.filter(item => item.id !== id);
    persist();
    renderAll();
    if (detailApplicationId === id) closeDetails();
    showToast("Application deleted.");
  }

  function openDetails(id) {
    const app = applications.find(item => item.id === id);
    if (!app) return;
    detailApplicationId = id;
    $("#detailTitle").textContent = app.company;
    const website = app.website ? `<a href="${escapeHTML(app.website)}" target="_blank" rel="noopener noreferrer">${escapeHTML(app.website)}</a>` : "—";
    const fields = [
      ["Location", app.city], ["Application date", formatDate(app.appliedDate)],
      ["Application deadline", formatDate(app.deadline)], ["Interview date", formatDate(app.interviewDate)],
      ["Next follow-up", formatDate(app.followUpDate)], ["Contact person", app.contact || "—"]
    ];
    $("#detailContent").innerHTML = `<div class="detail-hero"><div class="company-logo color-${companyColor(app.company)}">${escapeHTML(initials(app.company))}</div><div><h3>${escapeHTML(app.role)}</h3><p>${escapeHTML(app.city || "Location not specified")} · ${statusMarkup(app.status)}</p></div></div><div class="detail-grid">${fields.map(([label, value]) => `<div class="detail-field"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value || "—")}</strong></div>`).join("")}<div class="detail-field"><span>Company website</span>${website}</div></div><div class="detail-notes"><span>Notes / next action</span><p>${escapeHTML(app.notes || "No notes added yet.")}</p></div>`;
    $("#detailModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeDetails() {
    $("#detailModal").classList.add("hidden");
    detailApplicationId = null;
    if ($("#applicationModal").classList.contains("hidden")) document.body.style.overflow = "";
  }

  function openExportMenu() {
    const choice = window.prompt("Export your applications:\n1 = JSON backup\n2 = CSV spreadsheet\n3 = Import JSON backup\n\nEnter 1, 2, or 3:");
    if (choice === "1") exportJSON();
    else if (choice === "2") exportCSV();
    else if (choice === "3") $("#importFileInput").click();
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportJSON() {
    const backup = { app: "Ausbildung Application Tracker", schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), applications };
    downloadFile(`ausbildung-applications-${todayISO()}.json`, JSON.stringify(backup, null, 2), "application/json;charset=utf-8");
    showToast("JSON backup exported.");
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportCSV() {
    const columns = ["company", "role", "city", "appliedDate", "status", "deadline", "interviewDate", "followUpDate", "website", "contact", "notes"];
    const csv = [columns.join(","), ...applications.map(app => columns.map(key => csvEscape(app[key])).join(","))].join("\r\n");
    downloadFile(`ausbildung-applications-${todayISO()}.csv`, "\uFEFF" + csv, "text/csv;charset=utf-8");
    showToast("CSV spreadsheet exported.");
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("File is too large. Choose a JSON file under 5 MB.", "error");
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : parsed.applications;
      if (!Array.isArray(incoming)) throw new Error("This JSON file does not contain an applications array.");
      const normalized = incoming.map(normalizeApplication).filter(Boolean);
      if (incoming.length && !normalized.length) throw new Error("No valid application records were found.");
      const mode = window.confirm(`Found ${normalized.length} valid application record(s).\n\nOK = Replace current applications\nCancel = Merge with current applications`);
      if (mode) {
        applications = normalized;
      } else {
        const byId = new Map(applications.map(app => [app.id, app]));
        normalized.forEach(app => byId.set(app.id, app));
        applications = [...byId.values()];
      }
      persist();
      renderAll();
      showToast(`Imported ${normalized.length} application record(s).`);
    } catch (error) {
      showToast(error.message || "Could not import this JSON file.", "error");
    }
  }

  init();
})();

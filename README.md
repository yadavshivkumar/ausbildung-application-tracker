# Ausbildung Application Tracker

A responsive, light-themed frontend project for tracking applications to German vocational training programs (*Ausbildung*). Built with HTML5, CSS3, and vanilla JavaScript. No backend, framework, package manager, or database is required.

## Features

- Dashboard statistics: total and active applications, interviews, offers, and upcoming actions.
- Application pipeline grouped by status.
- Full CRUD: add, view, edit, and delete applications.
- Application statuses: Applied, Documents Requested, Interview, Offer Received, Accepted, Rejected, Withdrawn.
- Search by company, role, city, contact, or notes.
- Filter by status and sort by updated date, application date, deadline, or company name.
- Track application deadlines, interview dates, and follow-up dates.
- Highlight overdue and near-term tasks.
- Form validation for required fields, date values, and website URLs.
- Automatic saving to browser `localStorage`.
- JSON backup and restore; CSV export for spreadsheets.
- Responsive desktop, tablet, and mobile layout.
- Sample records are created on first launch.

## Project files

```text
ausbildung-application-tracker/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Setup instructions

### Option 1: Open directly

1. Download and extract the project ZIP.
2. Open the `ausbildung-application-tracker` folder.
3. Double-click `index.html` to open it in a modern browser.

### Option 2: Use Visual Studio Code

1. Open the project folder in VS Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html` and choose **Open with Live Server**.

No `npm install`, build step, server API, or environment variables are needed. The stylesheet uses Google Fonts when internet access is available and falls back to system fonts when it is not.

## How to use

1. Open the dashboard. On first launch, sample records are added automatically.
2. Select **Add application** to enter a company, Ausbildung occupation, city, application date, status, and optional dates or notes.
3. Use **Applications** to search, filter, sort, inspect, edit, or delete records.
4. Use **Deadlines** to review deadlines, interviews, and follow-up dates.
5. Choose **Export data** and then:
   - `1` for a JSON backup,
   - `2` for a CSV spreadsheet,
   - `3` to import a JSON backup.
6. When importing JSON, confirm to replace all current records, or cancel to merge. Merge uses record IDs to update matching records and append new ones.

## Data storage and privacy

- Data is saved in this browser under the key `ausbildungTracker.applications.v1`.
- Data persists after refresh and browser restart, provided the browser's site data is not cleared.
- `localStorage` is specific to the browser and origin. It does not synchronize between devices or browsers.
- Opening the page through `file://` can have browser-specific storage behavior. Using Live Server is recommended for consistent storage.
- Export a JSON backup periodically. Clearing browser data can permanently remove local records.
- Do not use this frontend-only project to store sensitive personal information. There is no login, encryption, server backup, or multi-user access control.

## Data model

Each application record has these fields:

| Field | Meaning |
|---|---|
| `id` | Unique record ID |
| `company` | Company or employer name |
| `role` | Ausbildung occupation |
| `city` | Location |
| `appliedDate` | Date application was submitted |
| `status` | Current stage |
| `deadline` | Application deadline, optional |
| `interviewDate` | Interview date, optional |
| `followUpDate` | Next follow-up date, optional |
| `website` | Company website, optional |
| `contact` | Contact person or email, optional |
| `notes` | Notes and next action |
| `createdAt` / `updatedAt` | ISO timestamps |

## Validation and behavior notes

- Company, occupation, city, and application date are required.
- If a website is provided, it must be an absolute `http://` or `https://` URL.
- Deadline, interview, and follow-up dates are optional.
- Dashboard task counts include upcoming deadlines, interviews, and follow-ups for applications that are not Accepted, Rejected, or Withdrawn.
- A date can appear as overdue if it has passed and the application remains active. Update the status or date when circumstances change.
- The dashboard uses sample data only on the first launch, when no saved data exists. To reset the demo, clear this app's local storage from browser developer tools.

## Test checklist

- [ ] Add a valid application and confirm it appears in the table and dashboard.
- [ ] Try saving without a company, role, or city.
- [ ] Enter an invalid website URL and confirm validation.
- [ ] Edit an application and check that it updates rather than duplicating.
- [ ] Delete a record and confirm the browser asks for confirmation.
- [ ] Search by company, role, or city.
- [ ] Filter by each status and reset filters.
- [ ] Sort by deadline and application date.
- [ ] Add an overdue date and a future follow-up; verify the deadline screen.
- [ ] Refresh the browser and confirm data persists.
- [ ] Export JSON, import it back, and test replace and merge.
- [ ] Export CSV and open it in a spreadsheet application.
- [ ] Test at desktop, tablet, and mobile widths.

## Limitations and future enhancements

This is a frontend-only educational project. Future enhancements could include a backend API and database, authentication, encrypted cloud sync, document attachments, calendar integration, browser notifications, multilingual support, and automated company/job-board imports.

## Viva questions with sample answers

**1. What is the purpose of this project?**  
It helps applicants organize Ausbildung opportunities, track each application's status, and remember deadlines, interviews, and follow-ups.

**2. Why did you use HTML, CSS, and JavaScript?**  
HTML defines the interface structure, CSS handles styling and responsive layouts, and JavaScript manages records, validation, filtering, calculations, and storage.

**3. What is CRUD?**  
CRUD means Create, Read, Update, and Delete. The application supports all four operations for application records.

**4. What is `localStorage`?**  
It is a browser API for storing string key-value pairs that normally remain available across page reloads and browser restarts for the same origin. The project serializes records with `JSON.stringify()` and parses them with `JSON.parse()`.

**5. What is the difference between `localStorage` and `sessionStorage`?**  
`localStorage` persists beyond a tab session until data is cleared. `sessionStorage` is scoped to a page session and is generally cleared when that tab/window session ends.

**6. How does search work?**  
JavaScript converts the query and selected record fields to lowercase, then checks whether the query occurs in company, role, city, contact, or notes.

**7. How is the application pipeline calculated?**  
The code counts records for each status and divides each count by the total number of records to calculate the progress-bar width.

**8. How are deadlines prioritized?**  
Each date is compared with today's date. Tasks are sorted chronologically and labeled overdue, due today, or upcoming.

**9. How is form validation implemented?**  
Required fields are checked, dates are checked for a valid `YYYY-MM-DD` format, and optional websites are parsed as URLs and restricted to HTTP or HTTPS.

**10. How does JSON export/import work?**  
Export serializes application records and metadata to a downloadable JSON file. Import parses a selected JSON file, validates and normalizes records, then replaces or merges the current list.

**11. Why is CSV useful?**  
CSV allows the records to be opened in spreadsheet tools such as Excel or LibreOffice Calc for sorting, reporting, and printing.

**12. What are the main limitations?**  
There is no backend, account system, cross-device sync, server-side backup, or multi-user access. Browser data can be lost if site data is cleared.

**13. How could the project be improved?**  
A REST API and database could provide accounts, cloud backup, shared access, secure authentication, and synchronization. Calendar integration and notifications could improve reminders.

**14. What is responsive design?**  
Responsive design adapts layout and controls to different screen sizes using flexible CSS grids, media queries, and overflow handling.

**15. Why should a JSON backup be made?**  
The data is stored locally in one browser. A JSON backup provides a portable copy that can be restored if browser storage is cleared or the user changes devices.

## Conclusion

The project demonstrates core frontend development concepts through a practical application: semantic HTML, responsive CSS, JavaScript state management, CRUD operations, validation, local persistence, data export/import, and dashboard analytics.

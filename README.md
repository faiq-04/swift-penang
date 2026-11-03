# Swift Penang

A community information and feedback platform for the Penang LRT Mutiara Line construction.
Group project for **CMT322 Web Engineering & Technologies** (Universiti Sains Malaysia, 2026/2027 Semester 1), Part A front-end simulation.

## Features

| Feature | What it does |
|---|---|
| Home | Introduction, latest updates ticker and quick navigation |
| Construction Updates | Work notices with search, location and category filters |
| Disruption Information | Road closures, pedestrian access and business access notices with status filters |
| Access Guides | Practical routes for drivers, pedestrians and businesses |
| My Alerts | Choose areas and disruption types to see matching alerts; preferences are saved in the browser |
| Community Feedback | Submit a concern with form validation, get a reference number, and track its status |
| Help Centre | Searchable FAQs with categories and expandable answers |

## How to run

No installation needed. Download or clone the repository and open `index.html` in a browser.

## Built with

HTML, CSS and JavaScript only (no frameworks). Data is stored as sample arrays in JavaScript and in the browser's `localStorage`; server and database integration is planned for Part B.

## Folder structure

```
index.html        All pages (single-page layout, one <section> per page)
css/styles.css    Part 1 styles and shared design system
css/part2.css     Part 2 styles (My Alerts, Feedback, Help Centre)
js/main.js        Part 1 logic (navigation, updates, disruptions, guides)
js/part2.js       Part 2 logic (alerts, feedback and tracking, FAQs)
```

## Team

- Frontend Part 1 (Yan Keer): Home, Construction Updates, Disruption Information, Access Guides
- Frontend Part 2 (Faiq Ahmed): My Alerts, Community Feedback, Help Centre


# U.S. Immigration Infrastructure Atlas — Architecture

## Purpose

The U.S. Immigration Infrastructure Atlas is a geographic information system for documenting the physical, administrative, operational, and transportation infrastructure through which the United States government administers immigration enforcement, border control, detention, processing, removal, and related activities.

The current ICE facilities dataset is the first implemented dataset within this broader atlas.

---

## Core geographic object classes

The atlas uses three fundamental geographic object classes.

### 1. Locations

Discrete physical places represented primarily as points.

Examples:

- ICE offices
- detention facilities
- processing centers
- Border Patrol stations
- ports of entry
- training facilities
- airports
- transportation hubs
- headquarters
- laboratories
- field offices

Locations distinguish between a physical site and the organizational entities associated with that site.

### 2. Networks & Movements

Linear, networked, or time-dependent movement data.

Examples:

- ICE Air routes
- ground transportation routes
- flight movements
- transfer movements
- recurring transportation corridors
- live or near-live aircraft activity

These records may be represented as lines, origin-destination relationships, trajectories, or time-dependent point locations.

### 3. Areas

Geographic jurisdictions and operational regions represented as polygons or multipolygons.

Examples:

- ICE Areas of Responsibility
- Border Patrol sectors
- field office jurisdictions
- enforcement regions
- program jurisdictions

---

## Site and Entity model

A physical location and an organizational record are not necessarily the same thing.

### Site

A Site represents a physical geographic place.

Site-level attributes may include:

- site_id
- site_name
- address
- city
- county
- state
- ZIP
- latitude
- longitude
- location_precision
- geometry
- physical site notes

### Entity

An Entity represents a distinct facility, office, organizational unit, program presence, or operation associated with a Site.

Entity-level attributes may include:

- entity_id
- official_name
- alternate_name
- agency
- component
- subcomponent
- function
- status
- operator
- owner
- jurisdiction
- opened
- closed
- source information
- dataset-specific attributes

One Site may contain one or many Entities.

Example:

Washington, DC headquarters site
- ICE Headquarters
- ERO Headquarters
- HSI Headquarters
- OPLA Headquarters
- OPR Headquarters
- other organizational entities

Co-located entities must not be merged merely because they share coordinates.

---

## Institutional relationships

Programs, agreements, ownership, operators, and organizational relationships are not treated as fundamental geographic object classes.

Instead, they describe or connect geographic objects.

Examples:

- 287(g) agreements
- detention operators
- facility owners
- agency-component relationships
- parent facilities
- jurisdictional assignments
- transportation relationships

---

## Organizational model

The atlas must remain agency-neutral at the application level.

Agency-specific datasets may retain their own internal organizational structures.

Examples:

DHS
- ICE
  - ERO
  - HSI
  - OPLA
  - OPR
  - other components

- CBP
  - U.S. Border Patrol
  - Office of Field Operations
  - Air and Marine Operations
  - other components

The atlas must not force CBP or other agencies into an ICE-specific classification scheme.

---

## Data architecture principle

Source datasets retain their native schemas.

Examples:

- ICE Facilities Master
- future CBP facilities dataset
- transportation route datasets
- flight activity datasets
- jurisdiction datasets

A separate atlas-level model will normalize the minimum common attributes necessary for search, display, filtering, linking, and cross-dataset analysis.

The canonical ICE Facilities Master should not be rewritten solely to conform to the atlas-wide schema.

---

## Atlas-level common fields

Likely shared fields across geographic objects include:

- atlas_id
- object_class
- dataset
- agency
- name
- status
- geometry
- geometry_type
- valid_from
- valid_to
- last_verified
- source_reference

Additional fields remain dataset-specific.

---

## Temporal model

The atlas must support:

- current records
- historical records
- openings and closures
- changing organizational assignments
- changing jurisdictions
- transportation events
- live or near-live activity

Current state must not overwrite historical state when historical information is available.

---

## Application layer hierarchy

The public map should eventually operate above individual agency datasets.

Conceptual hierarchy:

### Locations
- ICE
- CBP
- other agencies or programs

### Networks & Movements
- ICE Air
- ground transportation
- live or recent movement data

### Areas
- ICE AORs
- Border Patrol sectors
- other jurisdictions

Agency-specific filters appear only when relevant.

The existing ICE Category and Subcomponent filters remain useful within the ICE facilities dataset.

---

## Current implementation

The current web application contains:

- 3,120 ICE facility/entity records
- point mapping
- clustering
- search
- category filtering
- dependent subcomponent filtering
- status filtering
- co-location handling
- facility detail records
- deep-linked facility URLs
- synchronized map/results selection
- responsive layout
- GitHub version control
- Cloudflare Pages deployment

This implementation is considered the first production proof of concept for the broader atlas.

---

## Near-term development priorities

1. Preserve the working ICE implementation.
2. Introduce an atlas-level dataset/layer registry.
3. Add CBP datasets without forcing them into the ICE schema.
4. Separate Site and Entity concepts in the future normalized data model.
5. Add polygon support for jurisdictions.
6. Add line/event support for transportation and movement data.
7. Add public methodology and dataset documentation.
8. Build provenance/source infrastructure when source documentation is sufficiently developed.

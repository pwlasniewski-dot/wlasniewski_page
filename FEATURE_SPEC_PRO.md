# Feature Specification: Professional Offer & Contract System (Pro-Grade)

## Executive Summary
This document outlines the architecture and features for a high-end, professional Offer & Contract management system (CRM style), inspired by industry leaders like HoneyBook, Dubsado, and Pixieset. The goal is to provide a "WOW" experience for the client and a seamless, automated workflow for the photographer.

## 1. Core Workflow: "The Golden Path"
1. **Inquiry/Draft**: Admin creates an offer using a **Template** or from scratch using the **Offer Builder**.
2. **Review & Send**: Admin previews the "Client Experience" (Web + PDF). Sends via email with a magic link.
3. **Client View**: Client opens a beautiful, mobile-responsive web portal (no login required, secure link).
4. **Interaction**: Client selects packages/addons (optional items), sees real-time price updates.
5. **Contract**: Client clicks "Accept & Sign". The Contract is generated dynamically with selected options.
6. **Signature**: Client signs digitally (mouse/finger).
7. **Finalization**: System auto-generates signed PDF, emails both parties, and archives to **Google Drive/S3**.

## 2. Admin System: The Command Center

### 2.1. Offer Dashboard (Kanban)
- **Visual Pipeline**: Columns for `Draft`, `Sent`, `Viewed` (Tracking!), `Negotiating`, `Signed/Paid`, `Archived`.
- **Quick Actions**: "Duplicate to New Client", "Download PDF", "Resend Link".

### 2.2. The Offer Builder (Block-Based)
Instead of a giant form, we use a modular "Block" system:
- **Header Block**: Hero image, title, client details.
- **Service Block**: Grid/List of services with images, descriptions, prices.
- **Gallery Block**: Showcase previous work (images from Portfolio).
- **Video Block**: Embed "About Me" or similar.
- **Pricing Block**: Interactive quote table (Client can toggle "Add-ons").
- **Text Block**: Rich text for personal notes.

### 2.3. Smart Contract Editor
- **Variable System**: Insert `{{ClientName}}`, `{{EventDate}}`, `{{TotalPrice}}`, `{{SelectedPackages}}`.
- **Clause Library**: Save snippets (e.g., "Wedding Clause", "Commercial Usage Clause") to drag-and-drop.
- **Version History**: Track changes before signing.

## 3. Client Experience: "The Wow Factor"

### 3.1. Web Proposal (The "Mini-site")
- **Design**: Full-screen, immersive, responsive.
- **Personalization**: "Przygotowano specjalnie dla: Anna & Piotr".
- **Interactivity**:
  - "Select your Package" checkboxes (if options allowed).
  - Real-time total calculation.
  - "Ask a Question" chat bubbles (contextual negotiations).

### 3.2. Digital Signing
- **Legality**: Captures IP, Timestamp, User-Agent.
- **UI**: Smooth signature pad (Canvas).
- **Terms**: Scroll-to-accept enforcement.

## 4. Technical Architecture Enhancements

### 4.1. PDF Generation Engine Upgrade
- **Current**: `jspdf` (Imperative, hard to style, manual coordinates).
- **Pro**: `@react-pdf/renderer`.
  - Write PDFs using React Components / Flexbox.
  - Identical styling to the web view.
  - Supports custom fonts and high-res images natively.

### 4.2. Storage & Backup Strategy
- **Dual-Sync**:
  1. **S3 (Cloudflare R2 / AWS)**: Fast, public/private access for the web app.
  2. **Google Drive Integration**: Auto-upload signed PDFs to `My Drive / Clients / 2024 / [Client Name]`.
     - Uses Google Drive API (requires Service Account setup).

## 5. Development Roadmap (Phases)

### Phase 1: The Foundation (Core)
- [ ] Install `@react-pdf/renderer`.
- [ ] Create `OfferBuilder` UI (React components).
- [ ] Refactor Database Schema (if needed for Block system).

### Phase 2: PDF & Contract Engine
- [ ] Create `OfferDocument` and `ContractDocument` in React-PDF.
- [ ] Implement `SignaturePad` component.
- [ ] Variable interpolation logic.

### Phase 3: Client Experience
- [ ] "Mini-site" layout implementation.
- [ ] Mobile optimization.

### Phase 4: Integrations
- [ ] Google Drive API setup.
- [ ] Email triggers (SendGrid/Postmark/Resend).

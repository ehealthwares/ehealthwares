const pptxgen = require("pptxgenjs");

// ---------- Palette ----------
const NAVY = "1B3A5C";
const NAVY_DK = "132A44";
const TEAL = "0E7C7B";
const CORAL = "E76F51";
const LIGHT = "EFF4F6";
const WHITE = "FFFFFF";
const DARK = "2A2A2A";
const MIDGRAY = "6B7280";
const CARD = "F7FAFB";

const FONT_HEAD = "Cambria";
const FONT_BODY = "Calibri";

const ICON = (name, variant = "white") => `icons/${name}_${variant}.png`;

function newDeck() {
  const p = new pptxgen();
  p.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  p.layout = "WIDE";
  return p;
}

function bg(slide, color) {
  slide.background = { color };
}

function iconBadge(slide, name, x, y, size, circleColor, variant = "white") {
  slide.addShape("ellipse", { x, y, w: size, h: size, fill: { color: circleColor }, line: { type: "none" } });
  const iSize = size * 0.52;
  const off = (size - iSize) / 2;
  slide.addImage({ path: ICON(name, variant), x: x + off, y: y + off, w: iSize, h: iSize });
}

function kicker(slide, text, opts = {}) {
  slide.addText(text.toUpperCase(), {
    x: opts.x ?? 0.6, y: opts.y ?? 0.4, w: opts.w ?? 8, h: 0.3,
    fontFace: FONT_BODY, fontSize: 12, bold: true, color: opts.color ?? TEAL,
    charSpacing: 2, align: "left", isTextBox: true, margin: 0,
  });
}

function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: opts.x ?? 0.6, y: opts.y ?? 0.68, w: opts.w ?? 11.6, h: opts.h ?? 0.9,
    fontFace: FONT_HEAD, fontSize: opts.size ?? 32, bold: true,
    color: opts.color ?? NAVY, align: "left", isTextBox: true, margin: 0,
    lineSpacing: opts.size ? opts.size * 1.05 : 34,
  });
}

function pageNum(slide, n, dark = false) {
  slide.addText(String(n).padStart(2, "0"), {
    x: 12.6, y: 7.08, w: 0.5, h: 0.3, fontFace: FONT_BODY, fontSize: 10,
    color: dark ? "9FB2C4" : "B7C2CA", align: "right", isTextBox: true, margin: 0,
  });
  slide.addText("eHealthwares", {
    x: 0.6, y: 7.08, w: 3, h: 0.3, fontFace: FONT_BODY, fontSize: 10,
    color: dark ? "9FB2C4" : "B7C2CA", align: "left", isTextBox: true, margin: 0,
  });
}

const pres = newDeck();

/* ============================================================
   SLIDE 1 — COVER
============================================================ */
{
  const s = pres.addSlide();
  bg(s, NAVY);
  s.addShape("ellipse", { x: 10.6, y: -2.2, w: 6.5, h: 6.5, fill: { color: NAVY_DK }, line: { type: "none" } });
  s.addShape("ellipse", { x: 11.6, y: 4.6, w: 4.2, h: 4.2, fill: { color: TEAL, transparency: 82 }, line: { type: "none" } });
  s.addShape("ellipse", { x: -1.6, y: 5.6, w: 3.4, h: 3.4, fill: { color: TEAL, transparency: 86 }, line: { type: "none" } });

  s.addText("HEALTHCARE TECHNOLOGY  \u2022  PITCH DECK", {
    x: 0.9, y: 2.15, w: 8, h: 0.35, fontFace: FONT_BODY, fontSize: 13, bold: true,
    color: "6FD6C7", charSpacing: 3, isTextBox: true, margin: 0,
  });
  s.addText("eHealthwares", {
    x: 0.85, y: 2.5, w: 10, h: 1.5, fontFace: FONT_HEAD, fontSize: 62, bold: true,
    color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText("Connect healthcare data for meaningful use.", {
    x: 0.9, y: 3.95, w: 9.5, h: 0.55, fontFace: FONT_HEAD, fontSize: 22, italic: true,
    color: "6FD6C7", isTextBox: true, margin: 0,
  });
  s.addText(
    "Connecting healthcare organizations, professionals, patients and information through intelligent healthcare technology.",
    {
      x: 0.9, y: 4.6, w: 8.2, h: 0.8, fontFace: FONT_BODY, fontSize: 15,
      color: "CBD8E4", isTextBox: true, margin: 0, lineSpacingMultiple: 1.3,
    }
  );

  s.addShape("line", { x: 0.9, y: 6.55, w: 2.2, h: 0, line: { color: TEAL, width: 2 } });
  s.addText("eHealthwares Informatics Limited", {
    x: 0.9, y: 6.68, w: 6, h: 0.3, fontFace: FONT_BODY, fontSize: 12, bold: true,
    color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText("John  \u2022  CTO & Founder", {
    x: 0.9, y: 6.97, w: 6, h: 0.3, fontFace: FONT_BODY, fontSize: 11,
    color: "9FB2C4", isTextBox: true, margin: 0,
  });
}

/* ============================================================
   SLIDE 2 — THE PROBLEM
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "The Problem");
  title(s, "Healthcare information is disconnected", { w: 11.5 });

  const items = [
    { icon: "FaPuzzlePiece", h: "Fragmented records", d: "Patient information is scattered across facilities and systems that don't talk to each other." },
    { icon: "FaUsers", h: "Poor coordination", d: "Healthcare professionals and organizations struggle to coordinate around a shared picture of the patient." },
    { icon: "FaMapMarkerAlt", h: "Access barriers", d: "Patients face location and communication barriers that stand between them and the right care." },
    { icon: "FaDatabase", h: "Data hard to use", d: "Valuable health data is difficult to collect, retrieve and meaningfully use at the point of decision." },
  ];
  const cols = 2, cw = 5.55, ch = 1.85, gx = 0.5, gy = 0.35;
  const startX = 0.6, startY = 1.95;
  items.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cw + gx);
    const y = startY + row * (ch + gy);
    s.addShape("roundRect", { x, y, w: cw, h: ch, rectRadius: 0.08, fill: { color: CARD }, line: { type: "none" } });
    iconBadge(s, it.icon, x + 0.28, y + 0.28, 0.62, TEAL);
    s.addText(it.h, {
      x: x + 1.1, y: y + 0.22, w: cw - 1.35, h: 0.35, fontFace: FONT_HEAD, fontSize: 16, bold: true,
      color: NAVY, isTextBox: true, margin: 0,
    });
    s.addText(it.d, {
      x: x + 1.1, y: y + 0.58, w: cw - 1.35, h: 1.1, fontFace: FONT_BODY, fontSize: 12.5,
      color: MIDGRAY, isTextBox: true, margin: 0, lineSpacingMultiple: 1.25,
    });
  });

  s.addShape("roundRect", { x: 0.6, y: 6.45, w: 12.1, h: 0.65, rectRadius: 0.08, fill: { color: NAVY }, line: { type: "none" } });
  s.addText([
    { text: "Result:  ", options: { bold: true, color: "6FD6C7" } },
    { text: "inefficient care, delayed decisions and poor healthcare experiences.", options: { color: WHITE } },
  ], {
    x: 0.9, y: 6.45, w: 11.6, h: 0.65, fontFace: FONT_BODY, fontSize: 13.5, valign: "middle",
    isTextBox: true, margin: 0,
  });
  pageNum(s, 2);
}

/* ============================================================
   SLIDE 3 — OUR SOLUTION
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "Our Solution");
  title(s, "A connected healthcare information ecosystem", { w: 11.6 });

  s.addShape("roundRect", { x: 0.6, y: 2.05, w: 3.7, h: 4.55, rectRadius: 0.1, fill: { color: NAVY }, line: { type: "none" } });
  iconBadge(s, "FaProjectDiagram", 1.85, 2.85, 1.2, TEAL);
  s.addText("Breaking location\nand channel barriers", {
    x: 0.95, y: 4.35, w: 3, h: 0.8, fontFace: FONT_HEAD, fontSize: 17, bold: true, italic: true,
    color: WHITE, align: "center", isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
  });
  s.addText("Connecting the right people, information and workflows.", {
    x: 0.95, y: 5.2, w: 3, h: 1.1, fontFace: FONT_BODY, fontSize: 12.5,
    color: "CBD8E4", align: "center", isTextBox: true, margin: 0, lineSpacingMultiple: 1.3,
  });

  const rx = 4.65;
  const blocks = [
    { icon: "FaHospital", h: "Health Information Management Suites", d: "We build Health Information Management suites for healthcare facilities \u2014 the operational backbone for hospitals, labs and pharmacies." },
    { icon: "FaComments", h: "Free Omnichannel Exchange", d: "We enable free, omnichannel, communication-driven health information exchange \u2014 so information moves wherever it's needed." },
  ];
  let by = 2.05;
  blocks.forEach((b) => {
    iconBadge(s, b.icon, rx, by, 0.7, TEAL);
    s.addText(b.h, {
      x: rx + 0.9, y: by - 0.02, w: 7.1, h: 0.4, fontFace: FONT_HEAD, fontSize: 17, bold: true,
      color: NAVY, isTextBox: true, margin: 0,
    });
    s.addText(b.d, {
      x: rx + 0.9, y: by + 0.42, w: 7.1, h: 0.85, fontFace: FONT_BODY, fontSize: 13,
      color: MIDGRAY, isTextBox: true, margin: 0, lineSpacingMultiple: 1.3,
    });
    by += 1.55;
  });

  s.addShape("roundRect", { x: rx, y: 5.25, w: 8.0, h: 1.35, rectRadius: 0.08, fill: { color: LIGHT }, line: { type: "none" } });
  s.addText(
    "We break location and channel barriers, connecting the right people, information and workflows \u2014 wherever care happens.",
    {
      x: rx + 0.35, y: 5.25, w: 7.3, h: 1.35, fontFace: FONT_HEAD, fontSize: 14.5, italic: true,
      color: TEAL, valign: "middle", isTextBox: true, margin: 0, lineSpacingMultiple: 1.3,
    }
  );
  pageNum(s, 3);
}

/* ============================================================
   SLIDE 4 — WHAT WE BUILD
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "What We Build");
  title(s, "Healthcare systems + intelligent information exchange", { w: 11.8, size: 28 });

  const items = [
    { icon: "FaHospital", h: "Hospital", sub: "EMR", d: "Electronic medical records and facility management." },
    { icon: "FaPrescriptionBottleAlt", h: "Pharmacy", sub: "PMS", d: "Pharmacy management for dispensing and inventory." },
    { icon: "FaFlask", h: "Laboratory", sub: "Order & Workflow", d: "Laboratory order and workflow management." },
    { icon: "FaExchangeAlt", h: "Exchange", sub: "HIE", d: "Health Information Exchange across organizations." },
    { icon: "FaComments", h: "Omnichannel", sub: "Engine", d: "Communication engine spanning web, SMS, WhatsApp." },
    { icon: "FaRobot", h: "AI Assistant", sub: "MyAIha", d: "AI-powered health assistant for patients and staff." },
  ];
  const cols = 3, cw = 3.87, ch = 2.15, gx = 0.25, gy = 0.28, startX = 0.6, startY = 1.95;
  items.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cw + gx);
    const y = startY + row * (ch + gy);
    s.addShape("roundRect", { x, y, w: cw, h: ch, rectRadius: 0.09, fill: { color: CARD }, line: { color: "E2E8EC", width: 1 } });
    iconBadge(s, it.icon, x + 0.3, y + 0.28, 0.62, i % 2 === 0 ? NAVY : TEAL);
    s.addText(it.h, {
      x: x + 0.3, y: y + 1.05, w: cw - 0.6, h: 0.32, fontFace: FONT_HEAD, fontSize: 15.5, bold: true,
      color: NAVY, isTextBox: true, margin: 0,
    });
    s.addText(it.sub, {
      x: x + 0.3, y: y + 1.34, w: cw - 0.6, h: 0.25, fontFace: FONT_BODY, fontSize: 10.5, bold: true,
      color: CORAL, isTextBox: true, margin: 0, charSpacing: 1,
    });
    s.addText(it.d, {
      x: x + 0.3, y: y + 1.62, w: cw - 0.6, h: 0.5, fontFace: FONT_BODY, fontSize: 10.5,
      color: MIDGRAY, isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
    });
  });
  pageNum(s, 4);
}

/* ============================================================
   SLIDE 5 — HOW IT WORKS
============================================================ */
{
  const s = pres.addSlide();
  bg(s, NAVY);
  kicker(s, "How It Works", { color: "6FD6C7" });
  title(s, "From information collection to meaningful action", { color: WHITE, w: 11.8, size: 28 });

  const steps = [
    { icon: "FaClipboardList", h: "Collect" },
    { icon: "FaLink", h: "Connect" },
    { icon: "FaCogs", h: "Process" },
    { icon: "FaRoute", h: "Route" },
    { icon: "FaSearch", h: "Retrieve" },
    { icon: "FaBolt", h: "Act" },
  ];
  const n = steps.length, cw = 1.75, gap = (12.1 - cw * n) / (n - 1), startX = 0.6, y = 2.7;
  steps.forEach((st, i) => {
    const x = startX + i * (cw + gap);
    if (i < n - 1) {
      s.addShape("line", {
        x: x + cw, y: y + 0.5, w: gap, h: 0,
        line: { color: "3E5A78", width: 1.5, dashType: "dash" },
      });
    }
    iconBadge(s, st.icon, x + (cw - 1) / 2, y, 1, i === n - 1 ? CORAL : TEAL);
    s.addText(String(i + 1), {
      x: x, y: y - 0.38, w: cw, h: 0.3, fontFace: FONT_BODY, fontSize: 11, bold: true,
      color: "6FD6C7", align: "center", isTextBox: true, margin: 0,
    });
    s.addText(st.h, {
      x: x - 0.2, y: y + 1.15, w: cw + 0.4, h: 0.4, fontFace: FONT_HEAD, fontSize: 15, bold: true,
      color: WHITE, align: "center", isTextBox: true, margin: 0,
    });
  });

  s.addShape("roundRect", { x: 1.4, y: 5.15, w: 10.5, h: 1.5, rectRadius: 0.1, fill: { color: NAVY_DK }, line: { type: "none" } });
  s.addText(
    "Our workflow-driven communication connects patients and healthcare stakeholders through appropriate channels, and routes information to the right person, at the right level, at the right time.",
    {
      x: 1.8, y: 5.15, w: 9.7, h: 1.5, fontFace: FONT_BODY, fontSize: 14, italic: true,
      color: "CBD8E4", valign: "middle", align: "center", isTextBox: true, margin: 0, lineSpacingMultiple: 1.35,
    }
  );
  pageNum(s, 5, true);
}

/* ============================================================
   SLIDE 6 — OUR DIFFERENTIATION
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "Our Differentiation");
  title(s, "More than an EMR. More than communication.", { w: 11.6 });

  const items = [
    { icon: "FaComments", t: "Omnichannel questionnaires" },
    { icon: "FaCogs", t: "Workflow-driven communication" },
    { icon: "FaHospital", t: "Healthcare Information Management" },
    { icon: "FaUsers", t: "Stakeholder connection" },
    { icon: "FaBrain", t: "AI-enabled information exchange" },
  ];
  const cw = 2.3, gap = 0.15, startX = 0.6, y = 2.1;
  items.forEach((it, i) => {
    const x = startX + i * (cw + gap);
    s.addShape("roundRect", { x, y, w: cw, h: 2.15, rectRadius: 0.09, fill: { color: i % 2 === 0 ? LIGHT : CARD }, line: { type: "none" } });
    iconBadge(s, it.icon, x + (cw - 0.72) / 2, y + 0.3, 0.72, TEAL);
    s.addText(it.t, {
      x: x + 0.15, y: y + 1.2, w: cw - 0.3, h: 0.85, fontFace: FONT_BODY, fontSize: 12.5, bold: true,
      color: NAVY, align: "center", isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
    });
  });

  title(s, "Connecting the full care team", { x: 0.6, y: 4.75, size: 20, w: 8 });
  const stakeholders = ["Doctors", "Nurses", "Pharmacists", "Patients", "Hospitals", "Laboratories", "Pharmaceutical Stores"];
  let cx = 0.6, sy = 5.5;
  stakeholders.forEach((st) => {
    const w = 0.42 + st.length * 0.1;
    if (cx + w > 12.7) { cx = 0.6; sy += 0.62; }
    s.addShape("roundRect", { x: cx, y: sy, w, h: 0.5, rectRadius: 0.25, fill: { color: NAVY }, line: { type: "none" } });
    s.addText(st, {
      x: cx, y: sy, w, h: 0.5, fontFace: FONT_BODY, fontSize: 12, bold: true, color: WHITE,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
    });
    cx += w + 0.18;
  });
  pageNum(s, 6);
}

/* ============================================================
   SLIDE 7 — CUSTOMERS
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "Customers");
  title(s, "Who we serve", { w: 8 });

  const items = [
    { icon: "FaUserInjured", h: "Patients" },
    { icon: "FaUserMd", h: "Independent Practitioners" },
    { icon: "FaBuilding", h: "Healthcare Organizations" },
    { icon: "FaHospital", h: "Hospitals" },
    { icon: "FaFlask", h: "Laboratories" },
    { icon: "FaPrescriptionBottleAlt", h: "Pharmacies" },
    { icon: "FaHandHoldingUsd", h: "Payers / HMOs" },
  ];
  const cols = 4, cw = 2.85, ch = 1.65, gx = 0.2, gy = 0.25, startX = 0.6, startY = 2.05;
  items.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cw + gx);
    const y = startY + row * (ch + gy);
    s.addShape("roundRect", { x, y, w: cw, h: ch, rectRadius: 0.09, fill: { color: (i + row) % 2 === 0 ? CARD : LIGHT }, line: { type: "none" } });
    iconBadge(s, it.icon, x + (cw - 0.6) / 2, y + 0.24, 0.6, row === 0 ? NAVY : TEAL);
    s.addText(it.h, {
      x: x + 0.12, y: y + 0.98, w: cw - 0.24, h: 0.55, fontFace: FONT_BODY, fontSize: 12, bold: true,
      color: NAVY, align: "center", isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
  });

  s.addText("These customers can use and pay for our products and services.", {
    x: 0.6, y: 6.55, w: 11.5, h: 0.4, fontFace: FONT_HEAD, fontSize: 14, italic: true,
    color: TEAL, isTextBox: true, margin: 0,
  });
  pageNum(s, 7);
}

/* ============================================================
   SLIDE 8 — PAYER OPPORTUNITY
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "Payer Opportunity");
  title(s, "Making healthcare resources work where they matter most", { w: 11.8, size: 27 });
  s.addText(
    "We enable efficient use of time, skills, knowledge and healthcare resources by connecting members to the right information, stakeholder and level of specialist \u2014 exactly where applicable.",
    {
      x: 0.6, y: 1.85, w: 11.6, h: 0.75, fontFace: FONT_BODY, fontSize: 14,
      color: MIDGRAY, isTextBox: true, margin: 0, lineSpacingMultiple: 1.3,
    }
  );

  const items = [
    { icon: "FaCompass", h: "Member Navigation" },
    { icon: "FaHandsHelping", h: "Care Coordination" },
    { icon: "FaShareAlt", h: "Referral Routing" },
    { icon: "FaChartLine", h: "Utilization Efficiency" },
    { icon: "FaSmile", h: "Improved Member Experience" },
  ];
  const cw = 2.3, gap = 0.15, startX = 0.6, y = 2.95;
  items.forEach((it, i) => {
    const x = startX + i * (cw + gap);
    s.addShape("roundRect", { x, y, w: cw, h: 2.6, rectRadius: 0.09, fill: { color: NAVY }, line: { type: "none" } });
    iconBadge(s, it.icon, x + (cw - 0.78) / 2, y + 0.35, 0.78, CORAL);
    s.addText(it.h, {
      x: x + 0.15, y: y + 1.45, w: cw - 0.3, h: 1.0, fontFace: FONT_HEAD, fontSize: 14, bold: true,
      color: WHITE, align: "center", isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
    });
  });
  pageNum(s, 8);
}

/* ============================================================
   SLIDE 9 — AI & HEALTHCARE INFORMATION EXCHANGE
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "AI & Healthcare Information Exchange");
  title(s, "Turning healthcare data into meaningful use", { w: 11.6 });

  iconBadge(s, "FaBrain", 0.75, 2.15, 1.9, NAVY);
  s.addText("Domain expertise\n+ Software + AI", {
    x: 0.4, y: 4.2, w: 2.6, h: 0.9, fontFace: FONT_HEAD, fontSize: 14, bold: true, italic: true,
    color: TEAL, align: "center", isTextBox: true, margin: 0, lineSpacingMultiple: 1.25,
  });

  const caps = [
    { icon: "FaNetworkWired", t: "Efficient personnel connection" },
    { icon: "FaClipboardList", t: "Intelligent data collection" },
    { icon: "FaSearch", t: "Seamless information retrieval" },
    { icon: "FaComments", t: "Communication across multiple channels" },
    { icon: "FaCheckCircle", t: "Better-informed healthcare decisions" },
  ];
  let cy = 2.0;
  caps.forEach((c) => {
    iconBadge(s, c.icon, 4.0, cy, 0.55, TEAL);
    s.addText(c.t, {
      x: 4.75, y: cy + 0.02, w: 7.2, h: 0.5, fontFace: FONT_BODY, fontSize: 14.5, bold: true,
      color: DARK, valign: "middle", isTextBox: true, margin: 0,
    });
    cy += 0.72;
  });

  s.addShape("roundRect", { x: 4.0, y: 5.9, w: 8.7, h: 0.85, rectRadius: 0.42, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("The right information.  The right person.  The right time.", {
    x: 4.0, y: 5.9, w: 8.7, h: 0.85, fontFace: FONT_HEAD, fontSize: 16, italic: true, bold: true,
    color: "6FD6C7", align: "center", valign: "middle", isTextBox: true, margin: 0,
  });
  pageNum(s, 9);
}

/* ============================================================
   SLIDE 10 — TRACTION
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "Traction");
  title(s, "Already operating in real healthcare environments", { w: 11.8, size: 28 });

  const stats = [
    { num: "5", label: "Hospitals\ndeployed" },
    { num: "3,000+", label: "Patients\nreached" },
  ];
  let sx = 0.6;
  stats.forEach((st) => {
    const w = 3.5;
    s.addShape("roundRect", { x: sx, y: 2.1, w, h: 2.5, rectRadius: 0.1, fill: { color: NAVY }, line: { type: "none" } });
    s.addText(st.num, {
      x: sx, y: 2.25, w, h: 1.25, fontFace: FONT_HEAD, fontSize: 52, bold: true,
      color: "6FD6C7", align: "center", isTextBox: true, margin: 0,
    });
    s.addText(st.label, {
      x: sx, y: 3.5, w, h: 0.9, fontFace: FONT_BODY, fontSize: 14, bold: true,
      color: WHITE, align: "center", isTextBox: true, margin: 0, lineSpacingMultiple: 1.2,
    });
    sx += w + 0.35;
  });

  const rx = 8.15;
  const notes = [
    { icon: "FaCheckCircle", t: "Healthcare workflows already in active, daily use" },
    { icon: "FaChartLine", t: "Building toward a broader connected healthcare ecosystem" },
  ];
  let ny = 2.2;
  notes.forEach((n) => {
    iconBadge(s, n.icon, rx, ny, 0.55, TEAL);
    s.addText(n.t, {
      x: rx + 0.75, y: ny, w: 4.0, h: 0.85, fontFace: FONT_BODY, fontSize: 13.5, bold: true,
      color: DARK, valign: "middle", isTextBox: true, margin: 0, lineSpacingMultiple: 1.25,
    });
    ny += 1.15;
  });

  pageNum(s, 10);
}

/* ============================================================
   SLIDE 11 — MARKET
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "Market");
  title(s, "Built for Africa", { w: 8 });

  iconBadge(s, "FaGlobeAfrica", 8.7, 1.95, 3.1, NAVY);

  s.addText(
    "Our initial focus is the African healthcare market, where fragmented healthcare information and access barriers create significant opportunities for digital transformation.",
    {
      x: 0.6, y: 1.95, w: 7.5, h: 1.05, fontFace: FONT_BODY, fontSize: 14.5,
      color: MIDGRAY, isTextBox: true, margin: 0, lineSpacingMultiple: 1.35,
    }
  );

  title(s, "How we scale", { x: 0.6, y: 3.15, size: 18, w: 6 });
  const items = [
    { icon: "FaHospital", t: "Replicating facility implementations" },
    { icon: "FaHandshake", t: "Partnering with EMR and healthcare technology providers" },
    { icon: "FaUsers", t: "Connecting healthcare organizations and professionals" },
    { icon: "FaGlobeAfrica", t: "Expanding across ECOWAS and other African markets" },
  ];
  let ly = 3.75;
  items.forEach((it) => {
    iconBadge(s, it.icon, 0.6, ly, 0.5, TEAL);
    s.addText(it.t, {
      x: 1.25, y: ly + 0.02, w: 6.5, h: 0.5, fontFace: FONT_BODY, fontSize: 13, bold: true,
      color: DARK, valign: "middle", isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
    ly += 0.68;
  });
  pageNum(s, 11);
}

/* ============================================================
   SLIDE 12 — BUSINESS MODEL
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "Business Model");
  title(s, "B2B2C Healthcare Technology", { w: 9 });

  const items = [
    { icon: "FaHospital", t: "Healthcare facility software" },
    { icon: "FaUserMd", t: "Practitioner solutions" },
    { icon: "FaExchangeAlt", t: "Healthcare information exchange" },
    { icon: "FaFileContract", t: "Contractual technology services" },
    { icon: "FaCloud", t: "SaaS solutions" },
    { icon: "FaUserFriends", t: "Patient-facing services" },
  ];
  const cols = 3, cw = 3.87, ch = 1.55, gx = 0.25, gy = 0.25, startX = 0.6, startY = 1.95;
  items.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cw + gx);
    const y = startY + row * (ch + gy);
    s.addShape("roundRect", { x, y, w: cw, h: ch, rectRadius: 0.09, fill: { color: row === 0 ? LIGHT : CARD }, line: { type: "none" } });
    iconBadge(s, it.icon, x + 0.25, y + (ch - 0.65) / 2, 0.65, NAVY);
    s.addText(it.t, {
      x: x + 1.05, y: y, w: cw - 1.2, h: ch, fontFace: FONT_BODY, fontSize: 13, bold: true,
      color: NAVY, valign: "middle", isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
  });

  s.addShape("roundRect", { x: 0.6, y: 5.95, w: 12.1, h: 0.85, rectRadius: 0.09, fill: { color: NAVY }, line: { type: "none" } });
  s.addText(
    "Our ecosystem serves both healthcare organizations and individual practitioners \u2014 while ultimately improving patient access and outcomes.",
    {
      x: 0.95, y: 5.95, w: 11.4, h: 0.85, fontFace: FONT_HEAD, fontSize: 14, italic: true,
      color: WHITE, valign: "middle", isTextBox: true, margin: 0,
    }
  );
  pageNum(s, 12);
}

/* ============================================================
   SLIDE 13 — WHY US
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "Why Us");
  title(s, "Healthcare expertise + Software + AI", { w: 10 });

  const domains = [
    { icon: "FaStethoscope", t: "Medical" },
    { icon: "FaHeartbeat", t: "Diagnostics" },
    { icon: "FaHospital", t: "Healthcare" },
    { icon: "FaPills", t: "Pharmaceutical" },
  ];
  const cw = 2.75, gap = 0.2, startX = 0.6, y = 2.05;
  domains.forEach((d, i) => {
    const x = startX + i * (cw + gap);
    s.addShape("roundRect", { x, y, w: cw, h: 1.9, rectRadius: 0.09, fill: { color: TEAL }, line: { type: "none" } });
    iconBadge(s, d.icon, x + (cw - 0.65) / 2, y + 0.28, 0.65, NAVY);
    s.addText(d.t, {
      x, y: y + 1.15, w: cw, h: 0.5, fontFace: FONT_HEAD, fontSize: 15, bold: true,
      color: WHITE, align: "center", isTextBox: true, margin: 0,
    });
  });

  s.addShape("line", { x: 0.6, y: 4.35, w: 12.1, h: 0 });
  const combo = [
    { icon: "FaCode", t: "Software Development", d: "Building reliable, scalable healthcare systems." },
    { icon: "FaBrain", t: "Applied AI", d: "AI grounded in real clinical and operational context." },
  ];
  let cx = 0.6;
  combo.forEach((c) => {
    const w = 5.85;
    iconBadge(s, c.icon, cx, 4.55, 0.65, NAVY);
    s.addText(c.t, {
      x: cx + 0.85, y: 4.55, w: w - 0.85, h: 0.35, fontFace: FONT_HEAD, fontSize: 15, bold: true,
      color: NAVY, isTextBox: true, margin: 0,
    });
    s.addText(c.d, {
      x: cx + 0.85, y: 4.9, w: w - 0.85, h: 0.55, fontFace: FONT_BODY, fontSize: 12.5,
      color: MIDGRAY, isTextBox: true, margin: 0, lineSpacingMultiple: 1.25,
    });
    cx += w + 0.4;
  });

  s.addText(
    "We understand both the healthcare workflows and the technology required to connect them.",
    {
      x: 0.6, y: 5.85, w: 12.1, h: 0.6, fontFace: FONT_HEAD, fontSize: 15, italic: true,
      color: TEAL, isTextBox: true, margin: 0,
    }
  );
  pageNum(s, 13);
}

/* ============================================================
   SLIDE 14 — IMPACT
============================================================ */
{
  const s = pres.addSlide();
  bg(s, NAVY);
  kicker(s, "Impact", { color: "6FD6C7" });
  title(s, "Improving access, experience and outcomes", { color: WHITE, w: 11.6 });

  const items = [
    "Break location and channel barriers",
    "Improve access to healthcare personnel",
    "Improve access to healthcare information",
    "Enable more coordinated care",
    "Support underserved populations",
    "Make healthcare data actionable",
    "Improve healthcare outcomes",
  ];
  const cols = 2, cw = 5.75, rowH = 0.72, startX = 0.6, startY = 2.05, gx = 0.6;
  items.forEach((t, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cw + gx);
    const y = startY + row * rowH;
    iconBadge(s, "FaCheckCircle", x, y, 0.45, TEAL);
    s.addText(t, {
      x: x + 0.6, y: y - 0.03, w: cw - 0.6, h: 0.5, fontFace: FONT_BODY, fontSize: 14, bold: true,
      color: WHITE, valign: "middle", isTextBox: true, margin: 0,
    });
  });
  pageNum(s, 14, true);
}

/* ============================================================
   SLIDE 15 — VISION
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "Vision");
  s.addText("A healthcare system where information moves with the patient.", {
    x: 0.6, y: 1.75, w: 11.8, h: 1.5, fontFace: FONT_HEAD, fontSize: 30, bold: true, italic: true,
    color: NAVY, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
  });

  const nodes = ["Patients", "Professionals", "Organizations", "Information"];
  const cw = 2.55, gap = 0.55, startX = 0.75, y = 3.7;
  nodes.forEach((n, i) => {
    const x = startX + i * (cw + gap);
    if (i < nodes.length - 1) {
      s.addText("\u2194", {
        x: x + cw, y: y - 0.05, w: gap, h: 0.9, fontFace: FONT_BODY, fontSize: 26, bold: true,
        color: CORAL, align: "center", valign: "middle", isTextBox: true, margin: 0,
      });
    }
    s.addShape("roundRect", { x, y, w: cw, h: 0.85, rectRadius: 0.42, fill: { color: i % 2 === 0 ? NAVY : TEAL }, line: { type: "none" } });
    s.addText(n, {
      x, y, w: cw, h: 0.85, fontFace: FONT_HEAD, fontSize: 15, bold: true, color: WHITE,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
    });
  });

  s.addText(
    "Making healthcare data accessible, connected and meaningfully usable \u2014 wherever it is needed.",
    {
      x: 0.75, y: 5.15, w: 11.3, h: 0.6, fontFace: FONT_BODY, fontSize: 15,
      color: MIDGRAY, isTextBox: true, margin: 0,
    }
  );
  pageNum(s, 15);
}

/* ============================================================
   SLIDE 16 — WHAT WE ARE LOOKING FOR
============================================================ */
{
  const s = pres.addSlide();
  bg(s, WHITE);
  kicker(s, "What We Are Looking For");
  title(s, "Partners to accelerate scale", { w: 8 });

  const items = [
    { icon: "FaHospital", t: "Healthcare Organizations" },
    { icon: "FaHandHoldingUsd", t: "Payers / HMOs" },
    { icon: "FaHandshake", t: "Strategic Technology Partners" },
    { icon: "FaExchangeAlt", t: "EMR Partners" },
    { icon: "FaChartPie", t: "Investors" },
    { icon: "FaUsers", t: "Healthcare Ecosystem Partners" },
  ];
  const cols = 3, cw = 3.87, ch = 1.75, gx = 0.25, gy = 0.25, startX = 0.6, startY = 2.0;
  items.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cw + gx);
    const y = startY + row * (ch + gy);
    s.addShape("roundRect", { x, y, w: cw, h: ch, rectRadius: 0.09, fill: { color: NAVY }, line: { type: "none" } });
    iconBadge(s, it.icon, x + (cw - 0.68) / 2, y + 0.28, 0.68, CORAL);
    s.addText(it.t, {
      x: x + 0.2, y: y + 1.1, w: cw - 0.4, h: 0.55, fontFace: FONT_BODY, fontSize: 13, bold: true,
      color: WHITE, align: "center", isTextBox: true, margin: 0, lineSpacingMultiple: 1.15,
    });
  });

  s.addText(
    "To help us expand adoption, integrate healthcare ecosystems and scale across Africa.",
    {
      x: 0.6, y: 6.55, w: 11.5, h: 0.4, fontFace: FONT_HEAD, fontSize: 14, italic: true,
      color: TEAL, isTextBox: true, margin: 0,
    }
  );
  pageNum(s, 16);
}

/* ============================================================
   SLIDE 17 — CLOSING
============================================================ */
{
  const s = pres.addSlide();
  bg(s, NAVY);
  s.addShape("ellipse", { x: -2.2, y: -2.4, w: 6.2, h: 6.2, fill: { color: NAVY_DK }, line: { type: "none" } });
  s.addShape("ellipse", { x: 10.8, y: 4.2, w: 5.2, h: 5.2, fill: { color: TEAL, transparency: 84 }, line: { type: "none" } });

  s.addText("eHealthwares", {
    x: 0.9, y: 2.5, w: 10, h: 1.2, fontFace: FONT_HEAD, fontSize: 48, bold: true,
    color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText("Connect healthcare data for meaningful use.", {
    x: 0.95, y: 3.55, w: 9, h: 0.5, fontFace: FONT_HEAD, fontSize: 19, italic: true,
    color: "6FD6C7", isTextBox: true, margin: 0,
  });
  s.addText("Connecting healthcare data, people and workflows to improve healthcare outcomes.", {
    x: 0.95, y: 4.15, w: 8.5, h: 0.5, fontFace: FONT_BODY, fontSize: 13.5,
    color: "CBD8E4", isTextBox: true, margin: 0,
  });

  s.addShape("line", { x: 0.95, y: 5.65, w: 2.2, h: 0, line: { color: TEAL, width: 2 } });
  s.addText("John", {
    x: 0.95, y: 5.8, w: 6, h: 0.4, fontFace: FONT_HEAD, fontSize: 17, bold: true,
    color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText("CTO & Founder  \u2022  eHealthwares Informatics Limited", {
    x: 0.95, y: 6.2, w: 8, h: 0.35, fontFace: FONT_BODY, fontSize: 13,
    color: "9FB2C4", isTextBox: true, margin: 0,
  });
}

pres.writeFile({ fileName: "eHealthwares_Pitch_Deck.pptx" }).then(() => {
  console.log("done");
});

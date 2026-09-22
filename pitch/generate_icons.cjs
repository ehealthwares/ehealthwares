const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const fa = require("react-icons/fa");

const ICONS = [
  "FaPuzzlePiece", "FaUsers", "FaMapMarkerAlt", "FaDatabase",
  "FaProjectDiagram", "FaHospital", "FaPrescriptionBottleAlt", "FaFlask",
  "FaExchangeAlt", "FaComments", "FaRobot", "FaClipboardList",
  "FaLink", "FaCogs", "FaRoute", "FaSearch", "FaBolt", "FaLayerGroup",
  "FaUserInjured", "FaUserMd", "FaHandHoldingUsd", "FaCompass",
  "FaHandsHelping", "FaShareAlt", "FaChartLine", "FaSmile", "FaBrain",
  "FaGlobeAfrica", "FaBuilding", "FaFileContract", "FaCloud",
  "FaStethoscope", "FaHeartbeat", "FaPills", "FaCode", "FaHandshake",
  "FaChartPie", "FaUserFriends", "FaNetworkWired", "FaCheckCircle",
];

const COLORS = { white: "ffffff" };

async function run() {
  for (const name of ICONS) {
    const Icon = fa[name];
    if (!Icon) {
      console.error("MISSING:", name);
      continue;
    }
    for (const [key, hex] of Object.entries(COLORS)) {
      const svg = ReactDOMServer.renderToStaticMarkup(
        React.createElement(Icon, { size: 256, color: `#${hex}` })
      );
      const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 512 512">${svg.replace(/<svg[^>]*>|<\/svg>/g, "")}</svg>`;
      const buf = await sharp(Buffer.from(fullSvg)).resize(256, 256).png().toBuffer();
      fs.writeFileSync(`icons/${name}_${key}.png`, buf);
    }
  }
  console.log("done generating", ICONS.length, "icons");
}

run();

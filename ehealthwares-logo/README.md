# eHealthWares — Brand Identity System

**"One healthcare platform. Multiple intelligent modules."**

4 logo concepts × 8 variants = 32 pure-SVG files. Flat vector, transparent
backgrounds, no gradients, scalable from 24px app icon to signage.

## Concepts

| Folder | Concept | Story |
|---|---|---|
| `01-modular-cross-grid` | 3×3 block grid: cross of blue core + teal arms, corner blocks as satellite modules | modules assembling into one care platform |
| `02-hex-module-cluster` | Blue core hexagon (cross cut-out) + 6 interlocking module hexagons | honeycomb = interoperability, 1 platform + N modules |
| `03-interlocking-modules` | 4 outlined module frames with negative-space cross + coral care cross at center | independent components operating as one |
| `04-connected-journey` | Continuous monoline: stethoscope → medicines → ECG → tablet | the patient journey flowing into one digital platform |
| `05-hex-module-icons` | Core hex + 6 module hexes, each containing its own icon | every module identified at a glance (care, analytics, admin, pharmacy, payments, emergency) |

## Module color system

Every color maps to a platform module. Future module identities inherit their
color while keeping the shared geometry/wordmark.

| Color | Hex | Module |
|---|---|---|
| Blue | `#2563EB` | Core technology platform, trust, infrastructure |
| Teal | `#0D9488` | Clinical care & healthcare services |
| Green | `#16A34A` | Pharmacy, wellness & health outcomes |
| Purple | `#7C3AED` | Digital health, innovation & analytics |
| Amber | `#F59E0B` | Payments, billing & healthcare commerce |
| Coral | `#F43F5E` | Emergency care, alerts & critical services |
| Navy | `#0F2A43` | Enterprise management & administration |
| Slate (tagline only) | `#64748B` | Supporting text |

## Variants (per concept)

| File | Use |
|---|---|
| `icon-color.svg` | App icon, favicon, avatar — full modular color |
| `icon-mono.svg` | Single-color print, engraving, legal (navy) |
| `icon-white.svg` | Reversed on dark/photo backgrounds |
| `horizontal.svg` | Website header, letterhead |
| `horizontal-tagged.svg` | Same + "HEALTHIER WITH EVERY STEP" |
| `stacked.svg` | Square-ish placements, splash screens |
| `stacked-tagged.svg` | Same + tagline |
| `wordmark.svg` | Text-only placements |

## Typography

Wordmark: `eHealthWares` — "eHealth" navy `#0F2A43`, "Wares" blue `#2563EB`,
bold contemporary sans (Segoe UI → Helvetica Neue → Arial system stack).

**Production note:** convert text to outlines in Figma/Inkscape/Illustrator
before final asset export so rendering is identical on every device.

## Clear space & minimum size

- Clear space around any lockup: height of one icon "module" block on all sides.
- Icon minimum: 24×24px (32px for `05-hex-module-icons` where module detail
  needs to stay readable). Horizontal lockup minimum: 120px wide. Below that,
  use `icon-color.svg` or `wordmark.svg` alone.

## Concept 05 module icons

Each ring hex of `05-hex-module-icons` carries the icon of its module:

| Hex | Color | Module | Icon |
|---|---|---|---|
| Center | Blue | Core platform | White cross cut-out |
| East | Teal | Clinical care | Heart |
| North-East | Purple | Digital health & analytics | Bar chart |
| North-West | Navy | Enterprise & administration | Padlock |
| West | Green | Pharmacy & wellness | Capsule |
| South-West | Amber | Payments & billing | Credit card |
| South-East | Coral | Emergency & alerts | Alert triangle |

Reversed version (`icon-white.svg`) knocks the icons out as negative space so
they read correctly on dark backgrounds.

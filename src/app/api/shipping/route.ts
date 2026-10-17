import { NextRequest, NextResponse } from "next/server";

// Australia Post API integration
// Docs: https://developers.auspost.com.au/apis/shipping
// Postcode Search & Postage Assessment Calculator use digitalapi.auspost.com.au with AUTH-KEY header
// MyPost Business Shipping (shipments/labels/tracking) uses Basic auth + ACCOUNT_NUMBER header

const AUSPOST_API_KEY = process.env.AUSPOST_API_KEY || "";
const AUSPOST_API_PASSWORD = process.env.AUSPOST_API_PASSWORD || "";
const AUSPOST_ACCOUNT_NUMBER = process.env.AUSPOST_ACCOUNT_NUMBER || "";
const AUSPOST_BASE_URL = process.env.AUSPOST_BASE_URL || "https://digitalapi.auspost.com.au/test";

// Postcode Search & Postage Calculator use the digitalapi base with AUTH-KEY header
// These APIs work with just the API key (no password/account number needed)
const AUSPOST_DIGITAL_API = "https://digitalapi.auspost.com.au";

// PawnPass Hub address (receiver for inbound, sender for outbound)
const PAWNPASS_HUB = {
  name: "PawnPass Hub",
  lines: ["311 North East Road"],
  suburb: "Hampstead Gardens",
  state: "SA",
  postcode: "5086",
  phone: "0439726576",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create_shipment":
        return await createShipment(body);
      case "get_label":
        return await getLabel(body);
      case "track_shipment":
        return await trackShipment(body);
      case "find_lockers":
        return await findLockers(body);
      case "postcode_search":
        return await postcodeSearch(body);
      case "postage_calc":
        return await postageCalc(body);
      case "postage_services":
        return await postageServices(body);
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", detail: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

// Create a shipment and generate a label
// NOTE: Requires MyPost Business API (AUSPOST_API_PASSWORD + AUSPOST_ACCOUNT_NUMBER).
// Until those are configured, returns mock shipment data.
async function createShipment(body: any) {
  const {
    customerName,
    customerAddress,
    customerPhone,
    itemWeight,
    itemValue,
    itemDescription,
    direction, // "inbound" (customer → hub) or "outbound" (hub → customer)
    lockerId, // optional Parcel Locker ID for delivery
  } = body;

  const isFrom = direction === "inbound"
    ? { name: customerName, lines: customerAddress.lines, suburb: customerAddress.suburb, state: customerAddress.state, postcode: customerAddress.postcode, phone: customerPhone }
    : PAWNPASS_HUB;

  const to = direction === "inbound"
    ? PAWNPASS_HUB
    : { name: customerName, lines: customerAddress.lines, suburb: customerAddress.suburb, state: customerAddress.state, postcode: customerAddress.postcode, phone: customerPhone };

  // Mock mode — MyPost Business API not yet configured (need password + account number)
  if (!AUSPOST_API_PASSWORD || !AUSPOST_ACCOUNT_NUMBER) {
    return NextResponse.json({
      status: "DRAFT",
      shipment_id: `PP-MOCK-${Date.now()}`,
      tracking_number: `33PP${Math.floor(Math.random() * 10000000000)}`,
      qr_code_url: `/api/shipping/qr/PP-MOCK-${Date.now()}`,
      label_url: `/api/shipping/label/PP-MOCK-${Date.now()}`,
      total_cost: 18.75,
      transit_cover_cost: 2.50,
      mock: true,
      message: "Running in mock mode — MyPost Business API credentials not yet configured",
    });
  }

  // Express Post with Signature + Transit Cover (insurance)
  const shipmentPayload = {
    shipments: [
      {
        sender_references: [`PawnPass-${Date.now()}`],
        from: isFrom,
        to: lockerId ? { ...to, delivery_point_id: lockerId } : to,
        items: [
          {
            item_reference: `PP-${Date.now()}`,
            product_id: "7E55", // Express Post Signature
            weight: itemWeight,
            features: {
              TRANSIT_COVER: {
                attributes: {
                  COVER_AMOUNT: itemValue,
                },
              },
              SIGNATURE_REQUIRED: {},
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(`${AUSPOST_BASE_URL}/shipping/v1/shipments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + Buffer.from(`${AUSPOST_API_KEY}:${AUSPOST_API_PASSWORD}`).toString("base64"),
      "ACCOUNT_NUMBER": AUSPOST_ACCOUNT_NUMBER,
    },
    body: JSON.stringify(shipmentPayload),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: "AusPost API error", detail: data }, { status: response.status });
  }

  return NextResponse.json(data);
}

// Get shipping label PDF
async function getLabel(body: any) {
  const { shipmentId } = body;

  if (!AUSPOST_API_PASSWORD || !AUSPOST_ACCOUNT_NUMBER) {
    return NextResponse.json({
      label_url: `/api/shipping/label/${shipmentId}`,
      mock: true,
    });
  }

  const response = await fetch(`${AUSPOST_BASE_URL}/shipping/v1/labels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + Buffer.from(`${AUSPOST_API_KEY}:${AUSPOST_API_PASSWORD}`).toString("base64"),
      "ACCOUNT_NUMBER": AUSPOST_ACCOUNT_NUMBER,
    },
    body: JSON.stringify({ shipments: [{ shipment_id: shipmentId }] }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}

// Track a shipment
async function trackShipment(body: any) {
  const { trackingNumber } = body;

  if (!AUSPOST_API_PASSWORD || !AUSPOST_ACCOUNT_NUMBER) {
    // Mock tracking response
    return NextResponse.json({
      tracking_number: trackingNumber,
      status: "In transit",
      events: [
        { status: "Article accepted at", location: "GREENACRES SA 5086", date: new Date().toISOString() },
        { status: "Article processed at", location: "ADELAIDE SA 5000", date: new Date().toISOString() },
      ],
      mock: true,
    });
  }

  const response = await fetch(`${AUSPOST_BASE_URL}/shipping/v1/track?tracking_numbers=${trackingNumber}`, {
    headers: {
      "Authorization": "Basic " + Buffer.from(`${AUSPOST_API_KEY}:${AUSPOST_API_PASSWORD}`).toString("base64"),
    },
  });

  const data = await response.json();
  return NextResponse.json(data);
}

// Find nearby Parcel Lockers by postcode
// NOTE: AusPost Parcel Locker lookup requires the MyPost Business API (not yet available).
// The Postcode Search + Postage Calculator key we have does NOT include locker lookups.
// We return curated lockers near the PawnPass hub (Greenacres is across the road).
async function findLockers(body: any) {
  const { postcode, suburb } = body;

  // Mock locker data — Greenacres is across the road from the hub
  return NextResponse.json({
    lockers: [
      {
        id: "GREENACRES-001",
        name: "Greenacres Shopping Centre",
        address: "Corner Hampstead & Muller Roads, Greenacres SA 5086",
        distance_km: 0.3,
        lat: -34.8886,
        lng: 138.6120,
        hours: "24/7",
        max_dimensions: "35 × 44 × 61 cm",
        max_weight: "16 kg",
      },
      {
        id: "MODBURY-001",
        name: "Tea Tree Plaza",
        address: "976 North East Road, Modbury SA 5092",
        distance_km: 3.5,
        lat: -34.8310,
        lng: 138.6490,
        hours: "24/7",
        max_dimensions: "35 × 44 × 61 cm",
        max_weight: "16 kg",
      },
      {
        id: "KLEMZIG-001",
        name: "Klemzig Post Office",
        address: "428 Payneham Road, Klemzig SA 5087",
        distance_km: 2.1,
        lat: -34.8790,
        lng: 138.6240,
        hours: "24/7",
        max_dimensions: "35 × 44 × 61 cm",
        max_weight: "16 kg",
      },
    ],
  });
}

// Search Australian postcodes and suburbs
// Uses the Postcode Search API (AUTH-KEY header, no password/account needed)
async function postcodeSearch(body: any) {
  const { query } = body;

  if (!AUSPOST_API_KEY) {
    return NextResponse.json({
      localities: {
        locality: [
          { postcode: "5086", location: "HAMPSTEAD GARDENS", state: "SA", latitude: -34.8745, longitude: 138.6288 },
          { postcode: "5086", location: "GREENACRES", state: "SA", latitude: -34.8686, longitude: 138.6281 },
        ],
      },
      mock: true,
    });
  }

  const response = await fetch(
    `${AUSPOST_DIGITAL_API}/postcode/search.json?q=${encodeURIComponent(query)}`,
    { headers: { "AUTH-KEY": AUSPOST_API_KEY } }
  );

  const data = await response.json();
  return NextResponse.json(data);
}

// List available parcel services for a given route + weight + dimensions
// Uses the Postage Assessment Calculator API
async function postageServices(body: any) {
  const { fromPostcode, toPostcode, weight, length = 20, width = 15, height = 10 } = body;

  if (!AUSPOST_API_KEY) {
    return NextResponse.json({
      services: {
        service: [
          { code: "AUS_PARCEL_EXPRESS", name: "Express Post", price: "15.20", max_extra_cover: 500 },
          { code: "AUS_PARCEL_REGULAR", name: "Parcel Post", price: "11.70", max_extra_cover: 500 },
        ],
      },
      mock: true,
    });
  }

  const params = new URLSearchParams({
    from_postcode: fromPostcode,
    to_postcode: toPostcode,
    weight: String(weight),
    length: String(length),
    width: String(width),
    height: String(height),
  });

  const response = await fetch(
    `${AUSPOST_DIGITAL_API}/postage/parcel/domestic/service.json?${params}`,
    { headers: { "AUTH-KEY": AUSPOST_API_KEY } }
  );

  const data = await response.json();
  return NextResponse.json(data);
}

// Calculate postage for a specific service + options
// Uses the Postage Assessment Calculator API
async function postageCalc(body: any) {
  const {
    fromPostcode,
    toPostcode,
    weight,
    length = 20,
    width = 15,
    height = 10,
    serviceCode = "AUS_PARCEL_REGULAR",
    optionCode = "AUS_SERVICE_OPTION_STANDARD",
    suboptionCode,
    extraCover,
  } = body;

  if (!AUSPOST_API_KEY) {
    return NextResponse.json({
      postage_result: {
        service: "Parcel Post",
        delivery_time: "Delivered in 2-3 business days",
        total_cost: "11.70",
        costs: { cost: { item: "Parcel Post", cost: "11.70" } },
      },
      mock: true,
    });
  }

  const params = new URLSearchParams({
    from_postcode: fromPostcode,
    to_postcode: toPostcode,
    weight: String(weight),
    length: String(length),
    width: String(width),
    height: String(height),
    service_code: serviceCode,
  });

  if (optionCode) params.set("option_code", optionCode);
  if (suboptionCode) params.set("suboption_code", suboptionCode);
  if (extraCover) params.set("extra_cover", String(extraCover));

  const response = await fetch(
    `${AUSPOST_DIGITAL_API}/postage/parcel/domestic/calculate.json?${params}`,
    { headers: { "AUTH-KEY": AUSPOST_API_KEY } }
  );

  const data = await response.json();
  return NextResponse.json(data);
}

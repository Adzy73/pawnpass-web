import { NextRequest, NextResponse } from "next/server";

// Australia Post Shipping API integration
// Docs: https://developers.auspost.com.au/apis/shipping
// Base URL: https://digitalapi.auspost.com.au (production) / https://digitalapi.auspost.com.au/test (sandbox)

const AUSPOST_API_KEY = process.env.AUSPOST_API_KEY || "";
const AUSPOST_API_PASSWORD = process.env.AUSPOST_API_PASSWORD || "";
const AUSPOST_ACCOUNT_NUMBER = process.env.AUSPOST_ACCOUNT_NUMBER || "";
const AUSPOST_BASE_URL = process.env.AUSPOST_BASE_URL || "https://digitalapi.auspost.com.au/test";

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
    // Return mock response if no API key configured (dev mode)
    if (!AUSPOST_API_KEY) {
      return NextResponse.json({
        status: "DRAFT",
        shipment_id: `PP-MOCK-${Date.now()}`,
        tracking_number: `33PP${Math.floor(Math.random() * 10000000000)}`,
        qr_code_url: `/api/shipping/qr/PP-MOCK-${Date.now()}`,
        label_url: `/api/shipping/label/PP-MOCK-${Date.now()}`,
        total_cost: 18.75,
        transit_cover_cost: 2.50,
        mock: true,
        message: "Running in mock mode — no AUSPOST_API_KEY configured",
      });
    }
    return NextResponse.json({ error: "AusPost API error", detail: data }, { status: response.status });
  }

  return NextResponse.json(data);
}

// Get shipping label PDF
async function getLabel(body: any) {
  const { shipmentId } = body;

  if (!AUSPOST_API_KEY) {
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

  if (!AUSPOST_API_KEY) {
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
async function findLockers(body: any) {
  const { postcode, suburb } = body;

  if (!AUSPOST_API_KEY) {
    // Mock locker data — Greenacres is across the road from the hub
    return NextResponse.json({
      lockers: [
        {
          id: "GREENACRES-001",
          name: "Greenacres Shopping Centre",
          address: "Corner Hampstead & Muller Roads, Greenacres SA 5086",
          distance_km: 0.3,
          hours: "24/7",
          max_dimensions: "35 × 44 × 61 cm",
          max_weight: "16 kg",
        },
        {
          id: "MODBURY-001",
          name: "Tea Tree Plaza",
          address: "976 North East Road, Modbury SA 5092",
          distance_km: 3.5,
          hours: "24/7",
          max_dimensions: "35 × 44 × 61 cm",
          max_weight: "16 kg",
        },
        {
          id: "KLEMZIG-001",
          name: "Klemzig Post Office",
          address: "428 Payneham Road, Klemzig SA 5087",
          distance_km: 2.1,
          hours: "24/7",
          max_dimensions: "35 × 44 × 61 cm",
          max_weight: "16 kg",
        },
      ],
      mock: true,
    });
  }

  // Real AusPost API call would go here
  const response = await fetch(
    `${AUSPOST_BASE_URL}/shipping/v1/parcel-lockers?postcode=${postcode}&suburb=${encodeURIComponent(suburb)}`,
    {
      headers: {
        "Authorization": "Basic " + Buffer.from(`${AUSPOST_API_KEY}:${AUSPOST_API_PASSWORD}`).toString("base64"),
      },
    }
  );

  const data = await response.json();
  return NextResponse.json(data);
}

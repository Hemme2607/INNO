// Henter GLS trackingstatus ud fra Shopify-ordrens trackingnummer.
const GLS_TRACKING_ENDPOINT =
  "https://gls-group.eu/app/service/open/rest/TrackAndTrace/piece/";

type TrackingEvent = {
  status?: string;
  statusText?: string;
  statusDescription?: string;
  description?: string;
  city?: string;
  location?: string;
  locationName?: string;
  depot?: string;
  date?: string;
  dateTime?: string;
  eventTime?: string;
};

type TrackingSummary = {
  status: string;
  location?: string | null;
  timestamp?: string | null;
  trackingNumber: string;
  url: string;
};

// GLS-links kan gemme trackingnummeret i querystring – denne helper udtrækker det.
function extractTrackingNumberFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const matchParam = parsed.searchParams.get("match");
    if (matchParam) return matchParam;
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}

function pickOrderKey(order: any): string | null {
  return (
    (order?.id ? String(order.id) : null) ||
    (order?.order_number ? String(order.order_number) : null) ||
    (order?.name ? String(order.name) : null)
  );
}

// Formaterer dato/tid til dansk læsbart format
function formatTimestamp(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  try {
    return parsed.toLocaleString("da-DK", {
      timeZone: "Europe/Copenhagen",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return parsed.toISOString();
  }
}

// Slår status op direkte hos GLS – returværdi er et kort resume der kan sættes i prompten.
async function fetchGLSStatus(
  trackingNumber: string,
): Promise<TrackingSummary | null> {
  const url = `${GLS_TRACKING_ENDPOINT}${encodeURIComponent(trackingNumber)}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://gls-group.eu/",
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      return {
        status: "Kunne ikke hente live tracking. Brug linket til GLS Tracking.",
        trackingNumber,
        url: `https://gls-group.eu/EU/en/parcel-tracking?match=${trackingNumber}`,
      };
    }
    const historyCandidates =
      payload?.tuStatus?.history ??
      payload?.history ??
      payload?.events ??
      payload?.tuStatus?.statusHistory ??
      [];
    const events: TrackingEvent[] = Array.isArray(historyCandidates)
      ? historyCandidates
      : [];
    const latest =
      events[events.length - 1] ??
      payload?.tuStatus ??
      payload?.historyEvent ??
      null;

    const baseStatus =
      latest?.statusDescription ??
      latest?.statusText ??
      latest?.description ??
      payload?.tuStatus?.statusDescription ??
      "Status ikke tilgængelig";
    const location =
      latest?.location ??
      latest?.locationName ??
      latest?.city ??
      payload?.tuStatus?.depot ??
      null;
    const timestampRaw =
      latest?.dateTime ?? latest?.date ?? latest?.eventTime ?? null;
    const timestamp = formatTimestamp(timestampRaw);

    const lowerStatus = String(baseStatus).toLowerCase();
    let statusText = baseStatus;
    if (lowerStatus.includes("deliver")) {
      statusText = `Leveret${timestamp ? ` ${timestamp}` : ""}`;
    } else if (lowerStatus.includes("in transit") || lowerStatus.includes("transit")) {
      statusText = `På vej${timestamp ? ` (sidst opdateret ${timestamp})` : ""}`;
    } else if (lowerStatus.includes("pickup") || lowerStatus.includes("parcel center")) {
      statusText = `Hos GLS (${baseStatus})${timestamp ? ` – ${timestamp}` : ""}`;
    }

    return {
      status: statusText,
      location,
      timestamp,
      trackingNumber,
      url: `https://gls-group.eu/EU/en/parcel-tracking?match=${trackingNumber}`,
    };
  } catch (_error) {
    return {
      status: "Kunne ikke hente GLS tracking lige nu.",
      trackingNumber,
      url: `https://gls-group.eu/EU/en/parcel-tracking?match=${trackingNumber}`,
    };
  }
}

// Finder GLS-fulfillments i Shopify-ordren og returnerer potentielle trackingnumre.
function collectGLSCandidates(order: any) {
  const fulfillments = Array.isArray(order?.fulfillments)
    ? order.fulfillments
    : [];
  const candidates: Array<{ trackingNumber: string; url: string }> = [];

  for (const fulfillment of fulfillments) {
    const company = String(fulfillment?.tracking_company ?? "").toLowerCase();
    const urls = Array.isArray(fulfillment?.tracking_urls)
      ? fulfillment.tracking_urls
      : fulfillment?.tracking_url
      ? [fulfillment.tracking_url]
      : [];
    const number =
      fulfillment?.tracking_number ??
      fulfillment?.tracking_numbers?.[0] ??
      null;
    // Vi slår KUN op hos GLS, hvis transportøren/firmaet eller trackinglinket tydeligt indeholder "gls".
    const hasGLS =
      company.includes("gls") ||
      urls.some((link: string) => String(link).toLowerCase().includes("gls"));

    if (!hasGLS) continue;

    const trackingNumber =
      number ??
      urls
        .map((link: string) => extractTrackingNumberFromUrl(link))
        .find(Boolean) ??
      null;
    if (!trackingNumber) continue;

    candidates.push({
      trackingNumber,
      url:
        urls.find((link: string) =>
          String(link).toLowerCase().includes("gls"),
        ) ??
        `https://gls-group.eu/EU/en/parcel-tracking?match=${trackingNumber}`,
    });
  }

  return candidates;
}

// Udfør trackingopslag for alle ordrer og returnér et map orderId -> trackingtekst.
export async function fetchTrackingSummariesForOrders(
  orders: any[],
): Promise<Record<string, string>> {
  if (!Array.isArray(orders) || orders.length === 0) return {};
  const summaries: Record<string, string> = {};

  for (const order of orders) {
    const key = pickOrderKey(order);
    if (!key) continue;
    const candidates = collectGLSCandidates(order);
    if (!candidates.length) continue;

    const candidate = candidates[0];
    const status = await fetchGLSStatus(candidate.trackingNumber);
    console.log("tracking: GLS status", {
      orderKey: key,
      trackingNumber: candidate.trackingNumber,
      status,
    });
    if (!status) continue;

    const pieces = [
      status.status,
      status.location ? `Lokation: ${status.location}` : null,
      status.timestamp ? `Opdateret: ${status.timestamp}` : null,
      `Link: ${status.url}`,
    ]
      .filter(Boolean)
      .join(" — ");

    summaries[key] = `GLS tracking (${candidate.trackingNumber}): ${pieces}`;
  }

  return summaries;
}

// /app/api/geonames/[endpoint]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: any) {
  const endpoint = params.endpoint; // countryInfoJSON, childrenJSON, etc.
  const url = new URL("http://api.geonames.org/" + endpoint);
  const searchParams = req.nextUrl.searchParams;
  searchParams.set("username", process.env.NEXT_PUBLIC_GEONAMES_USERNAME || "demo");
  url.search = searchParams.toString();

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Erreur GeoNames" }, { status: 500 });
  }
}

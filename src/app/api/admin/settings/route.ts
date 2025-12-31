import { NextResponse } from "next/server";
// ✅ FIXED: Relative path to jump up 4 folders to 'src', then into 'lib/prisma'
import { prisma } from "@/lib/db/prisma"; 

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 1 },
    });
    
    // Return empty object if null, so frontend doesn't crash
    return NextResponse.json({ ok: true, settings: settings || {} });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    // Remove ID to prevent database conflicts
    delete body.id;

    // Update or Create the settings (ID is always 1)
    const settings = await prisma.systemSetting.upsert({
      where: { id: 1 },
      update: body,
      create: { id: 1, ...body },
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("Settings Error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
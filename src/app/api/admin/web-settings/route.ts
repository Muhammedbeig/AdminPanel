import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db/prisma";

export async function GET() {
  try {
    const settings = await prisma.webSetting.findUnique({
      where: { id: 1 },
    });
    return NextResponse.json({ ok: true, settings: settings || {} });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    delete body.id; // Protect ID

    const settings = await prisma.webSetting.upsert({
      where: { id: 1 },
      update: body,
      create: { id: 1, ...body },
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
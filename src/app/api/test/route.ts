import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { UserTable } from "@/lib/server/db/schema";

// import { drizzle } from 'drizzle-orm/libsql';
// import { createClient } from "@libsql/client";

export async function GET(request: NextRequest) { 
  console.log('<GET /api/test> 触发');
  // const result = await db.select().from(UserTable);
  // const result = db.select().from(UserTable).get();
  // const result = await db.query.UserTable.findMany();
  const result = await db.query.UserTable.findMany();

  // const client = createClient({
  //   url: "file:./src/local.db",
  // });
  // const db = drizzle(client);
 
  // const result = await db.run('select 1');
  
  console.log('<GET /api/test> 结束');
  console.log('<GET /api/test> result:', typeof result, "|", result);
  return NextResponse.json({ result });
}

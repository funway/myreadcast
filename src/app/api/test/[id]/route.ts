import { logger } from '@/lib/server/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; 
  logger.debug('Dynamic Route', { id });
  console.log(`[pid:${process.pid}] Dynamic Route. id: ${id}`);
  return NextResponse.json({id: id});
}
import { NextResponse } from "next/server";
import { ActionResult } from "../shared/types";

export class ApiResponse {
  
  static success<T = void>(data?: T, message?: string, status = 200) {
    const body: ActionResult<T> = {
      success: true,
      message,
      data
    };

    return NextResponse.json(body, { status });
  }

  static fail(message: string, status = 500) {
    const body: ActionResult = {
      success: false,
      message
    };

    return NextResponse.json(body, { status });
  }
}
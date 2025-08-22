import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CookieOptions = Record<string, any>;

interface CookieEntry {
  value: string | null;  // 用 null 表示删除
  options?: CookieOptions;
}

export class CookieJar {
  private cookies: Map<string, CookieEntry>;

  constructor() {
    this.cookies = new Map();
  }

  /**
   * 设置或更新一个 cookie
   */
  set(name: string, value: string, options?: CookieOptions) {
    this.cookies.set(name, { value, options });
  }

  /**
   * 删除一个 cookie
   */
  delete(name: string) {
    this.cookies.set(name, { value: null });
  }

  /**
   * 将收集的 cookies 应用到 NextResponse
   */
  apply(res: NextResponse) {
    for (const [name, entry] of this.cookies.entries()) {
      if (entry.value === null) {
        res.cookies.delete(name);
      } else {
        res.cookies.set(name, entry.value, entry.options);
      }
    }
  }
}
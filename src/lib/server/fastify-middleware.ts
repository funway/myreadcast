/**
 * Before nextjs 15.5, its built-int middleware only supports running in edge runtime. That sucks!
 * Therefore, we have to implement this custom server-middleware to capture all requests and handle them on the server-side.
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '@/lib/server/logger';

export async function middleware(request: FastifyRequest, reply: FastifyReply) {
  logger.debug("所有 cookie: ", request.cookies);
  // reply.setCookie('test_cookie', '123123', {
  //   path: '/',
  //   maxAge: 10_000,
  // });
  reply
    .setCookie('foo', 'foo', {
      domain: 'example.com',
      path: '/'
    })
    .cookie('baz', 'baz') // alias for setCookie
    .setCookie('bar', 'bar', {
      path: '/',
    })
  // .send({ hello: 'world' })
  
  reply.raw.setHeader('Set-Cookie', 'test_cookie=123123; Path=/; Max-Age=10000');


  const setCookieHeader = reply.cookies;
  console.log('In Set-Cookie header:', setCookieHeader);
}


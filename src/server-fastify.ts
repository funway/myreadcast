import Fastify from 'fastify';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.FASTIFY_HOST || 'localhost';
const port = Number(process.env.FASTIFY_PORT) || 3000;

// 创建 Fastify 服务器实例
const server = Fastify({
  logger: dev ? { level: 'info' } : { level: 'error' },
});

// 创建 Next.js 应用实例
const nextApp = next({ dev, hostname, port, turbopack: dev });
const nextHandler = nextApp.getRequestHandler();

// 定义 fastify 的钩子处理函数
// - 使用 preHandler 钩子注入我们自定义的中间件
server.addHook('preHandler', async (request, reply) => {
  try {
    // call our middleware() here
  } catch (error) {
    server.log.error(error, 'Middleware error');
    reply.status(500).send({ error: 'Internal server error' });  // send() 表示发送响应，所以后续 handler 就不会再处理了
  }
});

// 定义 fastify 的路由处理函数
// - 所有路由都交给 Next.js 处理
server.all('/*', async (request, reply) => {
  try {
    await nextHandler(request.raw, reply.raw);
    // reply.sent = true;   // 这是错误写法, sent 是只读属性，用来判断是否执行了 reply.send()
    reply.hijack();      // 告诉 fastify 这个请求被 nextjs 接管了，你不用管了。(其实可以不用加吧)
  } catch (error) {
    server.log.error(error, '🛑 Next.js handler error');
    if (!reply.sent) {
      reply.status(500).send({ error: 'Internal server error' });
    }
  }
});

// 1. 使用 prepare().then() 保证 nextApp 先完成初始化
nextApp.prepare().then(() => {
  // 2. 然后再启动 fastify 服务器
  const serverStart = async () => {
    try {
      await server.listen({ port, host: hostname });
      
      console.log(
        `\n 🚀 Fastify server is running! \n` +
        `  - URL:  http://${hostname}:${port} \n` +
        `  - ENV:  ${process.env.NODE_ENV} \n`
      );
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };
  serverStart();
}).catch((error) => {
  console.error('🛑 Next.js app prepare failed: ', error)
});

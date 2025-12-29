🔔 Webhook called at: 2025-12-26T06:18:33.948Z
📱 WhatsApp message received: {
  from: 'whatsapp:+917778051665',
  body: 'wallet | income | 5000 | Salary | Bank | Monthly salary',
  timestamp: '2025-12-26T06:18:33.951Z'
}
✅ Twilio signature validated
🔍 Looking up user with phone: +917778051665 (original: whatsapp:+917778051665 )
🔎 Query result: {
  profile: { id: '216031fb-749d-4b70-a600-7c326a3121e7' },
  profileError: null
}
❌ Error processing WhatsApp message (344ms): Error: Attempted to call getBooks() from the server but getBooks is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.
    at POST (app/api/whatsapp/route.ts:153:33)
  151 |
  152 |     // Get user's books
> 153 |     const books = await getBooks(profile.id)
      |                                 ^
  154 |     
  155 |     if (books.length === 0) {
  156 |       return createTwiMLResponse(
Error stack: Error: Attempted to call getBooks() from the server but getBooks is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.
    at /workspaces/book-keeping/.next/dev/server/chunks/[root-of-the-server]__193aa459._.js:191:11
    at POST (/workspaces/book-keeping/.next/dev/server/chunks/[root-of-the-server]__193aa459._.js:426:156)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async AppRouteRouteModule.do (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js:5:37789)
    at async AppRouteRouteModule.handle (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js:5:45045)
    at async responseGenerator (/workspaces/book-keeping/.next/dev/server/chunks/22f75_next_059f7a2f._.js:14338:38)
    at async AppRouteRouteModule.handleResponse (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js:1:187851)
    at async handleResponse (/workspaces/book-keeping/.next/dev/server/chunks/22f75_next_059f7a2f._.js:14400:32)
    at async handler (/workspaces/book-keeping/.next/dev/server/chunks/22f75_next_059f7a2f._.js:14453:13)
    at async DevServer.renderToResponseWithComponentsImpl (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/base-server.js:1413:9)
    at async DevServer.renderPageComponent (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/base-server.js:1465:24)
    at async DevServer.renderToResponseImpl (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/base-server.js:1515:32)
    at async DevServer.pipeImpl (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/base-server.js:1021:25)
    at async NextNodeServer.handleCatchallRenderRequest (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/next-server.js:394:17)
    at async DevServer.handleRequestImpl (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/base-server.js:912:17)
    at async /workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/dev/next-dev-server.js:382:20
    at async Span.traceAsyncFn (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/trace/trace.js:157:20)
    at async DevServer.handleRequest (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/dev/next-dev-server.js:378:24)
    at async invokeRender (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/lib/router-server.js:240:21)
    at async handleRequest (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/lib/router-server.js:436:24)
    at async requestHandlerImpl (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/lib/router-server.js:484:13)
    at async Server.requestListener (/workspaces/book-keeping/node_modules/.pnpm/next@16.0.10_@babel+core@7.28.5_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/lib/start-server.js:226:13)
📤 Sending TwiML response (length: 164 bytes)
⏱️ Total webhook processing time: 561ms
 POST /api/whatsapp 200 in 5.4s (compile: 4.8s, render: 576ms)

 NEW ERROR  ❌ Error Creating Entry
  Webhook called at: 2025-12-26T06:26:32.138Z
📱 WhatsApp message received: {
  from: 'whatsapp:+917778051665',
  body: 'wallet | income | 5000 | Salary | Bank | Monthly salary',
  timestamp: '2025-12-26T06:26:32.140Z'
}
✅ Twilio signature validated
🔍 Looking up user with phone: +917778051665 (original: whatsapp:+917778051665 )
🔎 Query result: {
  profile: { id: '216031fb-749d-4b70-a600-7c326a3121e7' },
  profileError: null
}
✨ Created new category: Salary
Error creating entry: {
  code: '23514',
  details: 'Failing row contains (c3198ba9-0656-4f4f-85d6-d13d178b91bd, 2e04a139-8f67-4629-bc89-4e074c64ceb5, fc183909-f70c-4e40-a9bb-c094b5d5c14a, Monthly salary, 5000, income, Bank, 2025-12-26, 2025-12-26 06:26:32.979879+00, 2025-12-26 06:26:32.979879+00).',
  hint: null,
  message: 'new row for relation "entries" violates check constraint "entries_payment_mode_check"'
}
📤 Sending TwiML response (length: 147 bytes)
⏱️ Total webhook processing time: 879ms

New error
🔔 Webhook called at: 2025-12-26T06:30:44.592Z
📱 WhatsApp message received: {
  from: 'whatsapp:+917778051665',
  body: 'wallet | income | 5000 | Salary | Cash | Monthly salary',
  timestamp: '2025-12-26T06:30:44.593Z'
}
✅ Twilio signature validated
🔍 Looking up user with phone: +917778051665 (original: whatsapp:+917778051665 )
🔎 Query result: {
  profile: { id: '216031fb-749d-4b70-a600-7c326a3121e7' },
  profileError: null
}
Error creating entry: {
  code: '23514',
  details: 'Failing row contains (c8ba6c21-0491-46b8-a4a8-fbe4310ed8c8, 2e04a139-8f67-4629-bc89-4e074c64ceb5, fc183909-f70c-4e40-a9bb-c094b5d5c14a, Monthly salary, 5000, income, Cash, 2025-12-26, 2025-12-26 06:30:45.811845+00, 2025-12-26 06:30:45.811845+00).',
  hint: null,
  message: 'new row for relation "entries" violates check constraint "entries_payment_mode_check"'
}
Entry data attempted: {
  book_id: '2e04a139-8f67-4629-bc89-4e074c64ceb5',
  category_id: 'fc183909-f70c-4e40-a9bb-c094b5d5c14a',
  type: 'income',
  amount: 5000,
  payment_mode: 'Cash'
}
📤 Sending TwiML response (length: 241 bytes)
⏱️ Total webhook processing time: 1268ms
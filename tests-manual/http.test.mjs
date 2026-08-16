process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

const { createApp } = await import("./src/app.js");
const app = createApp();
const server = app.listen(0);
const port = server.address().port;
const base = `http://localhost:${port}`;

let failed = 0;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + " — " + label);
  if (!cond) failed++;
}

const health = await fetch(base + "/api/health");
check("GET /api/health -> 200", health.status === 200);

const unknown = await fetch(base + "/api/nonexistent");
check("GET unknown route -> 404 via notFound handler", unknown.status === 404);

const noAuth = await fetch(base + "/api/auth/me");
check("GET /api/auth/me without token -> 401 (auth middleware runs before any DB call)", noAuth.status === 401);

const badBody = await fetch(base + "/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "x@x.com" }), // missing name/password
});
check("POST /api/auth/signup missing fields -> 400 (validated before DB call)", badBody.status === 400);

const shortPw = await fetch(base + "/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "A", email: "x@x.com", password: "short" }),
});
check("POST /api/auth/signup short password -> 400", shortPw.status === 400);

server.close();
console.log(failed ? `\n>>> ${failed} HTTP TEST(S) FAILED <<<` : "\n>>> ALL HTTP TESTS PASSED <<<");
process.exit(failed ? 1 : 0);

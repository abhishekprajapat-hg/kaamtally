class HttpError extends Error {
  constructor(status, message, fields) { super(message); this.status = status; this.fields = fields; }
}
const bad = (message, fields) => new HttpError(400, message, fields);
const notFound = (what = 'Not found') => new HttpError(404, what);
// Express 5 forwards rejected promises to the error handler automatically.
module.exports = { HttpError, bad, notFound };

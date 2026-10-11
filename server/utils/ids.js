/**
 * Normalise "an ObjectId, a populated document, or a lean populated object"
 * to a plain id string. Template-literal / toString() on a populated value
 * yields '[object Object]', which silently broke every lookup keyed by it.
 */
function idOf(value) {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
}

module.exports = { idOf };

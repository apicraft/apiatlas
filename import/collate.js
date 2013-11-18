var existing = require('./existing.json');
var model = require('./model.json');

existing.request = {
  headers: {}, 
  verbs: {}
};

existing.response = {
  headers: {},
  codes: {}
};

var votes = { raw: {}, total: 0, down: 0, up: 0 };

model.request.header.forEach(function(header) {
  header.votes = votes;
  existing.request.headers[header.name.toLowerCase()] = header;
});

model.request.verb.forEach(function(verb) {
  verb.votes = votes;
  existing.request.verbs[verb.name.toLowerCase()] = verb;
});

model.response.header.forEach(function(header) {
  header.votes = votes;
  existing.response.headers[header.name.toLowerCase()] = header;
});

model.response.code.forEach(function(code) {
  code.votes = votes;
  existing.response.codes[code.name.toLowerCase()] = code;
});

console.log(JSON.stringify(existing, null, 2));

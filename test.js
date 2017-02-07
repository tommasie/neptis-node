var r = /\d+$/g;
var s = 'http://localhost:8080/RestNeptis/webresources/entities.city/74';
console.log(r.exec(s));
console.log(s.match(r));

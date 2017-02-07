var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4j:emaldyst@localhost:7474');

db.cypher({
    query: "MATCH (n) DELETE n"
}, function(err,res) {
    if(err)
        console.log(err);
    else console.log(JSON.stringify(res));
});

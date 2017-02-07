var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4j:emaldyst@localhost:7474');

db.cypher({
    query: "MATCH (a)-[:GOES_TO]->(b) RETURN a,b",
    lean:true
}, function(err,res) {
    if(err)
        console.log(err);
    else console.log(JSON.stringify(res));
});

/*db.cypher({
    query: "MATCH (room:Museum) RETURN room"
}, function(err,res) {
    if(err)
        console.log(err);
    else console.log(JSON.stringify(res));
});*/

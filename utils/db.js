import mysql from 'mysql'

const con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "hrm_node_2"
})

con.connect(function(err) {
    if (err) {
        console.log("Error connecting: " + err.stack)
    } else {
        console.log("Connected")
    }
})

export default con;
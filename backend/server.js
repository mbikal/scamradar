const express = require("express");
const app = express ();
const PORT = 3000;

app.use(express.json());

app.get("/health",(req, res)=>{
    res.status(200).json({message: "Server is healthy"});
})
app.post("/api/analyze", (req, res)=>{
    const receivedData = req.body;
    console.log("Received data:", receivedData);
    res.status(200).json({message: "score: 50", data: receivedData});
})

app.listen(PORT, ()=>{
    console.log(`Server is running on Port http://localhost:${PORT}`)
})

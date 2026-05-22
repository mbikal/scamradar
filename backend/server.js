require("dotenv").config();
const express = require("express");
const app = express ();
const cors = require("cors");
const helmet = require("helmet");
const PORT = process.env.Server_PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.get("/health",(req, res)=>{
    res.status(200).json({message: "Server is healthy"});
})
app.post("/api/analyze", (req, res)=>{
    const receivedData = req.body;
    console.log("Received data:", receivedData);
    res.status(200).json({riskScore: 50,message: "Analysis complete", data: receivedData});
})

app.listen(PORT, ()=>{
    console.log(`Server is running on Port http://localhost:${PORT}`)
})

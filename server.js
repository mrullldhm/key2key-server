import express from "express";

const app = express();
const PORT = 5500;

// Middleware (built-in)
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the key2key API");
});

// Port listening
app.listen(5500,()=>{
    console.log(`The API is listening on http://localhost:${PORT}`)
})

const express = require("express");
const cors = require("cors");


//~ Authentication

const app = express();

app.use(express.json());
app.use(cors());

//*check---

app.get('/getmsg',(req,res)=>{
	return res.json("Hey, I'm alive!")
})


const port = process.env.PORT || 5555; // Use the PORT environment variable if available

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// app.listen(5555, () => console.log("listing...."));

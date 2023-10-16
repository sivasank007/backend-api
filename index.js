const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

require('dotenv').config();

//~ Authentication

const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
app.use(cookieParser());

var image = "";

//~creating db

// const db = mysql.createConnection({
// 	host: "localhost",
// 	user: "root",
// 	password: '',
// 	database: "fos",
// });

const db = mysql.createConnection({
	host: process.env.DB_HOST,       // Replace with your database hostname
	user: process.env.DB_USER,       // Replace with your database username
	password: process.env.DB_PASS,   // Replace with your database password
	database: process.env.DB_NAME,   // Replace with your database name
  });

//!___________________CRUD DASHBOARD____________________________

//~--------------------READ OPERATION---------------------------

//*GET MENU DATA

app.get("/getmenudata", (req, res) => {
	const sql = "SELECT * FROM MENU";
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data);
	});
});

//*Display desired 'MENU' table data

app.get("/getdesiredmenudata/:id", (req, res) => {
	const id = req.params.id;
	const sql = `SELECT * FROM MENU where menuid = ${id}`;
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data[0]);
	});
});

//*Display desired 'MENU' table data -> menu name

app.get("/getdesiredmenuname/:id", (req, res) => {
	const id = req.params.id;
	const sql = `SELECT menuname FROM MENU where menuid = ${id}`;
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data[0].menuname);
	});
});

//*Display MENU_ITEMS table data

app.get("/getmenuitemsdata", (req, res) => {
	const sql = "SELECT * FROM menuitems";
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data);
	});
});

//*Display desired 'MENU_ITEMS' table data

app.get("/getmenuitemsdesireddata/:id", (req, res) => {
	const sql = "SELECT * FROM menuitems where menuitemsid=?";
	const id = req.params.id;
	db.query(sql, [id], (err, data) => {
		if (err) res.json(err);
		return res.json(data[0]);
	});
});

//*multer - used to store image from frontend to server folder

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "public/images/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "_" + Date.now() + path.extname(file.originalname),
		);
	}, 
});

const upload = multer({ storage: storage });

//~------------------------CREATE OPERATION-------------------------

//*add MENU data

app.post("/addmenu", (req, res) => {
	const sql = "insert into menu (`menuname`,`menudescription`) values (?)";
	const val = [req.body.menuname, req.body.menudescription];
	db.query(sql, [val], (err, data) => {
		if (err) return res.json(err);
		return res.json(data);
	});
});

//*add MENUITEMS data

app.post("/insertproduct", upload.single("image"), (req, res) => {
	const imageFilePath = req.file.filename;
	const sql =
		"INSERT INTO MENUITEMS (`menuitem`,`price`,`quantity`,`description`,`menuid`,`count`,`image`) VALUES (?)";
	const val = [
		req.body.menuitem,
		req.body.price,
		req.body.quantity,
		req.body.description,
		req.body.menuid,
		req.body.count,
		imageFilePath,
	];

	db.query(sql, [val], (err, data) => {
		if (err) return res.json(err);
		return res.json(data);
	});
});

//~------------------------UPDATE OPERATION---------------------------------

//*update MENU data
app.put("/updatemenu/:id", (req, res) => {
	const id = req.params.id;
	const { menuname, menudescription } = req.body;

	const sql =
		"update menu set `menuname`=?, `menudescription`=? where `menuid`=?";
	const values = [menuname, menudescription, id];

	db.query(sql, values, (err, data) => {
		if (err) {
			return res.json(err);
		}
		return res.json(data);
	});
});

//*update MENU_ITEM data
app.put("/updateproduct/:id", upload.single("image"), (req, res) => {
    const productId = req.params.id;
    const imageFilePath = req.file ? req.file.filename : null;

    const { menuitem, price, quantity, description, menuid, count } = req.body;

    let sql =
        "UPDATE MENUITEMS SET `menuitem`=?, `price`=?, `quantity`=?, `description`=?, `menuid`=?, `count`=?";

    const values = [menuitem, price, quantity, description, menuid, count];

    if (imageFilePath) {
        sql += ", `image`=?";
        values.push(imageFilePath);
    }

    sql += " WHERE `menuitemsid`=?"; // Use `menuitemsid` column for updating

    values.push(productId);

    db.query(sql, values, (err, data) => {
        if (err) {
            return res.json(err);
        }
        return res.json(data);
    });
});



//~--------------------------------DELETE OPERATION---------------------------------

//*delete MENU data

app.delete("/deletemenu/:id", (req, res) => {
	const id = req.params.id;
	const q = `DELETE FROM menu WHERE menuid=${id}`;
	db.query(q, (err, data) => {
		if (err) {
			res.json(err);
		}
		res.send("Deleted");
	});
});

//*delete MENU_ITEMS data

app.delete("/deletemenuitems/:id", (req, res) => {
	const id = req.params.id;
	const q = `DELETE FROM menuitems WHERE menuitemsid=${id}`;
	db.query(q, (err, data) => {
		if (err) {
			res.json(err);
		}
		res.send("Deleted");
	});
});

//*delete MENUITEMS data based menuID

app.delete("/deletemenuitemsmenu/:id", (req, res) => {
	const id = req.params.id;
	const q = `DELETE FROM menuitems WHERE menuid=${id}`;
	db.query(q, (err, data) => {
		if (err) {
			res.json(err);
		}
		res.send("Deleted");
	});
});

//~--------------------------------LOGIN OPERATION---------------------------------

// //~---------------ADD USER

//* Registration route
app.post('/adduser', async (req, res) => {
	const checkemail = `SELECT mail FROM customer_registration WHERE mail = ?`;
	const checkphoneNumber = `SELECT phnum FROM customer_registration WHERE phnum = ?`;
	const email = req.body.mail;
	const phone = req.body.phone;
  
	db.query(checkemail, [email], (err, emailData) => {
	  if (err) {
		return res.json(err);
	  }
  
	  if (emailData.length > 0) {
		return res.json("Email already exists");
	  }
  
	  db.query(checkphoneNumber, [phone], (err, phoneData) => {
		if (err) {
		  return res.json(err);
		}
  
		if (phoneData.length > 0) {
		  return res.json("Phone number already exists");
		}
  
		const val = [
		  req.body.userName,
		  email,
		  phone,
		  req.body.password,
		];
  
		const sql =
		  "INSERT INTO customer_registration (customername, mail, phnum, password) VALUES (?)";
  
		db.query(sql, [val], (err, result) => {
		  if (err) {
			return res.json(err);
		  }
		  return res.json(result);
		});
	  });
	});
  });
  
  

//*CHECK USER

const secretKey = 'luisantsecretekey';

//* Login route
app.post('/login', (req, res) => {
	const { email,phoneNumber, password } = req.body;
  
	//* Fetch user from the database using email or phone number
	const getUserQuery = 'SELECT * FROM customer_registration WHERE mail = ? OR phnum = ?';
	db.query(getUserQuery, [email,phoneNumber], (err, result) => {
	  if (err) {
		return res.status(500).json({ error: 'Internal Server Error' });
	  }
  
	  if (result.length === 0) { 
		return res.status(401).json({ error: 'Authentication failed. User not found.' });
	  }
  
	  const user = result[0];
	  const customerID = user.customerID;
	  const passwordMatch = bcrypt.compare(password, user.password);
  
	  if (!passwordMatch) {
		return res.status(401).json({ error: 'Authentication failed. Incorrect password.' });
	  }
  
	  //* Create a JWT token
	  const token = jwt.sign({ userId: customerID }, secretKey, { expiresIn: '1d' });
  
	  return res.json({token ,customerID});
	});
  });
  
//~------------------CHECK ADMIN

app.post("/checkadmin", (req, res) => {
	const val = [req.body.mail, req.body.password];
	const sql =
		"SELECT * FROM adminlogin WHERE `adminMail` = ? and `adminPass` = ?";
	db.query(sql, val, (err, result) => {
		if (result.length > 0) {
			return res.json(result[0].adminId);
		} else {
			console.log(val);
			return res.json(result);
		}
	});
});

//~------------------GET DESIRED ADMIN DATA

app.get("/getdesiredadmin/:id", (req, res) => {
	const id = req.params.id;
	const sql =
		'SELECT * FROM adminlogin WHERE adminId = ?';
	db.query(sql,id, (err, result) => {
		if(err){
			return res.json(err)
		}
		else{
			return res.json(result[0])
		}
	});
});

//*GET ALL USERS

app.get("/getuser", (req, res) => {
	const sql = "SELECT * FROM customer_registration";
	const id = req.params.id;
	db.query(sql, [id], (err, data) => {
		if (err) res.json(err);
		res.send(data);
	});
});

//*GET SPECIFIC USER 

app.get("/getuser/:id", (req, res) => {
	const sql = "SELECT * FROM customer_registration where customerID=?";
	const id = req.params.id;
	db.query(sql, [id], (err, data) => {
		if (err) res.json(err);
		res.send(data);
	});
});

//*Update Account Info

app.put("/updateaccountdetails/:id", (req, res) => {
	const id = req.params.id;
	const { customerName } = req.body;

	const sql =
		"update customer_registration set `customername`=? where `customerID`=?";
	const values = [customerName, id];

	db.query(sql, values, (err, data) => {
		if (err) {
			return res.json(err);
		}
		return res.json(data);
	});
});

//*Update User Password

app.put("/changepassword/:id", (req, res) => {
	const id = req.params.id;
	const { password } = req.body;

	const sql =
		"update customer_registration set `password`=? where `customerID`=?";
	const values = [password, id];

	db.query(sql, values, (err, data) => {
		if (err) {
			return res.json(err);
		}
		return res.json(data);
	});
});

//~--------------------------------ADDRESS---------------------------------

//*GET CUSTOMER ADDRESS

app.get("/customerexistingaddress/:id", (req, res) => {
	const id = req.params.id;
	const sql = `SELECT * FROM customers_address where customerID=${id}`;
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data);
	});
});

//*ADD CUSTOMER ADDRESS

app.post("/customeraddress", (req, res) => {
	const sql =
		"INSERT INTO customers_address (`customerID`,`customername`,`mail`,`address`,`pincode`,`city`,`state`,`phnum`) VALUES (?)";
	const val = [
		req.body.cid,
		req.body.name,
		req.body.email,
		req.body.fullAddress,
		req.body.pincode,
		req.body.city,
		req.body.state,
		req.body.phoneNumber,
	];
	db.query(sql, [val], (err, data) => {
		if (err) return res.json(err);
		return "success";
	});
});

//*DELETE CUSTOMER ADDRESS

app.delete("/deleteaddress/:id", (req, res) => {
	const id = req.params.id;
	const q = `DELETE FROM customers_address WHERE addressID=${id}`;
	db.query(q, (err, data) => {
		if (err) {
			res.json(err);
		}
		res.send("Deleted");
	});
});

//*GET SELECTED ADDRESS

app.get("/getaddress/:id", (req, res) => {
	const id = req.params.id;
	const sql = `SELECT * FROM customers_address WHERE addressID = ?`;
	db.query(sql, [id], (err, data) => {
		if (err) {
			res.json(err);
		}
		return res.json(data[0]);
	});
});

//*EDIT CUSTOMER ADDRESS

app.put("/editaddress/:id", (req, res) => {
	const id = req.params.id;
	const sql =
		"UPDATE customers_address SET `CUSTOMERNAME` =?,`MAIL`=?,`ADDRESS`=?,`PINCODE`=?,`CITY`=?,`STATE`=?,`PHNUM`=? WHERE addressID=?";
	db.query(
		sql,
		[
			req.body.name,
			req.body.email,
			req.body.fullAddress,
			req.body.pincode,
			req.body.city,
			req.body.state,
			req.body.phoneNumber,
			id,
		],
		(err, result) => {
			if (err) return res.json("Error");
			return res.json({ updated: true });
		},
	);
});

//~--------------------------------CART---------------------------------

//*GET CART OF SPECFIC USER

app.get("/cartdata/:id", (req, res) => {
	const id = req.params.id;
	const sql = "SELECT * FROM cart where customerId = ?";
	db.query(sql, [id], (err, data) => {
		if (err) res.json(err);
		return res.json(data);
	});
});

//*DELETE CART OF SPECFIC USER's Row

app.delete("/deletecartitem/:id", (req, res) => {
	const id = req.params.id;
	const q = "delete from CART where cartid = ?";
	db.query(q, id, (err, data) => {
		if (err) {
			res.json(err);
		}
		res.send("Deleted");
	});
});
 
//*DELETE CART OF SPECFIC USER

app.post("/handleResetCart/:id", (req, res) => {
	const id = req.params.id;
	const q = "delete from CART where customerId = ?";
	db.query(q, [id], (err, data) => {
		if (err) {
			res.json(err);
		}
		res.send("Deleted");
	});
});

//*INCREMENT CART ITEM
app.put("/cartincrement/:id", (req, res) => {
	const id = req.params.id;
	const sql = "update cart set count = count + 1 where cartid =?";
	db.query(sql, [id], (err, data) => {
		if (err) return res.json(err);
		return res.json(data);
	});	
});

//*DECREMENT CART ITEM

app.put("/cartdecrement/:id", (req, res) => {
	const id = req.params.id;
	const sql = "update cart set count = count - 1 where cartid =?";
	db.query(sql, [id], (err, data) => {
		if (err) return res.json(err);
		return res.json(data);
	});
});

//*INSERT INTO CART

app.post("/cart", (req, res) => {
	const sql =
		"INSERT INTO CART (`menuid`,`menuitemid`,`menuitem`,`price`,`quantity`,`count`,`image`,`customerId`) VALUES (?)";
	const val = [
		req.body.menuid,
		req.body.menuitemid,
		req.body.menuname,
		req.body.price,
		req.body.quantity,
		req.body.count,
		req.body.image,
		req.body.cid,
	];
	db.query(sql, [val], (err, data) => {
		if (err) return res.json(err);
		return res.json(data);
	});
});

//*LOCALCART TO DATABASE CART

app.post("/cartlogin", (req, res) => {
	const sql =
		"INSERT INTO CART (`menuid`,`menuitemid`,`menuitem`,`price`,`quantity`,`count`,`image`,`customerId`) VALUES ?";

	const values = req.body.localCart.map((item) => [
		item.menuid,
		item.menuitemid,
		item.menuname,
		item.price,
		item.quantity,
		item.count,
		item.image,
		req.body.cid,
	]);
	console.log(values);
	db.query(sql, [values], (err, data) => {
		if (err) return res.json(err);
		return res.json(data);
	});
});

//~--------------------------------ORDER DETAILS----------------------------------

//* INSERT ORDER DETAILS AND INVOICE DETAILS

app.post("/orderdetails", (req, res) => {
	const cart = req.body.cart;
	const paymentMode = req.body.paymentMode;
	const customerID = req.body.cid;
	const addressID = req.body.addressID;
	const collectionTime = req.body.collectionTime;

	// Generate a random 5-digit number for order Number
	const randomFiveDigitNumber = Math.floor(1000 + Math.random() * 9000);

	// Get the current date and time in the "YYMMDDmmss" format
	const currentDate = new Date();
	const year = currentDate.getFullYear().toString().slice(-2);
	const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
	const day = currentDate.getDate().toString().padStart(2, '0');
	const hours = currentDate.getHours().toString().padStart(2, '0');
	const minutes = currentDate.getMinutes().toString().padStart(2, '0');
	const seconds = currentDate.getSeconds().toString().padStart(2, '0');

	// Combine the random number and date/time to create the orderNumber
	const orderNumber = `${randomFiveDigitNumber}${year}${month}${day}${hours}${minutes}${seconds}`;
	const values = cart.map(({ menuid, menuitemid, count, menuitem, price }) => [
		customerID,
		orderNumber,
		addressID,
		menuid,
		menuitemid,
		count,
		paymentMode,
		menuitem,
		price,
		collectionTime
	]);

	let totalBill = cart.reduce((total, { price, count }) => total + (price * count), 0) ;
	totalBill = totalBill - (totalBill/10); //10 percent discount 
	
	const sql =
		"INSERT INTO orderdetails (customerID, orderNumber, addressId, menuid, menuitemid, quantity, paymentMode, menuitems, price,delivermode) VALUES ?";
	
	// Insert data into the orderdetails table
	db.query(sql, [values], (error, results) => {
		if (error) {
		console.error(error);
		res.status(500).send("Error inserting into orderdetails");
		} else {
			// Generate a random 3-digit number
			const randomThreeDigitNumber = Math.floor(100 + Math.random() * 900);

			// Generate 4 random alphabets
			const randomAlphabets = Array.from({ length: 4 }, () =>
				String.fromCharCode(65 + Math.floor(Math.random() * 26))
			).join("");
			const invoiceNumber = `${randomThreeDigitNumber}${randomAlphabets}${year}${month}${day}${hours}${minutes}${seconds}`;
		// After successfully inserting into orderdetails, insert into invoicedetails
		const invoiceSql =
			"INSERT INTO invoicedetails (invoiceNumber,orderNumber, customerID, addressId,totalBill) VALUES ?";
		const invoiceValues = [[invoiceNumber,orderNumber, customerID, addressID,totalBill]];
	
		// Insert data into the invoicedetails table
		db.query(invoiceSql, [invoiceValues], (err, invoiceResults) => {
			if (err) {
			console.error(err);
			res.status(500).send("Error inserting into invoicedetails");
			} else {
			res.status(200).send("Data inserted into orderdetails and invoicedetails successfully");
			}
		});
		}
	});
});

//*order pending status

app.post('/pushorderpending',(req,res)=>{
	const cart = req.body.cart;
	const customerID = req.body.cid;
	const addressID = req.body.id;
	const collectionTime = req.body.collectionTime;

	const values = cart.map(({ menuid, menuitemid, count, menuitem, price }) => [
		menuid,
		menuitemid,
		count,
		menuitem,
		price,
		customerID,
		addressID,
		collectionTime
	]);

	const sql = "INSERT INTO orderpending  (menuid, menuitemid, count, menuitem, price,customerId,addressId,deliverymode) VALUES ?"

	db.query(sql,[values],(err,result)=>{
		if(err){
			return res.json(err)
		}
	})
})

app.get('/getorderpending',(req,res)=>{
	const sql = "select * from orderpending"
	db.query(sql,(err,data)=>{
		if(err){ 
			return res.json(err)
		}
		return res.json(data)
	})
})

//* delete order pending by admin

app.delete('/deleteorderpendingbyadmin/:id',(req,res)=>{
	const {id} = req.params;
	const sql = `delete from orderpending where pendingId = ${id}`
	db.query(sql,(err,result)=>{
		if(err){
			return res.json(err)
		}
	})
})

//* delete order completed by admin

app.delete('/deleteordercompletedbyadmin/:id',(req,res)=>{
	const {id} = req.params;
	const sql = `delete from orderdetails where customer_orderID = ${id}`
	db.query(sql,(err,result)=>{
		if(err){
			return res.json(err)
		}
	})
})

//* delete order pending by customer when order gets completed
 
app.delete('/deleteorderpending/:id',(req,res)=>{
	const {id} = req.params;
	const sql = `delete from orderpending where customerId = ${id}`
	db.query(sql,(err,result)=>{
		if(err){
			return res.json(err)
		}
	})
})


//*GET ORDER DETAILS

app.get('/getorderdetails',(req,res)=>{
	const sql = "SELECT * FROM orderdetails";
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data);
	});
})

//* GET MONTHLY ORDERS COUNT

app.get('/getmonthlyorders', (req, res) => {
	const month = req.query.selectedMonth;
	const sql = `SELECT COUNT(*) AS totalOrders FROM orderdetails WHERE MONTH(orderdeddatetime) = ?`;
   
	db.query(sql, [month], (err, data) => {
		if (err) res.json(err);
		return res.json(data[0])
	  });
  });

//* GET DAILY ORDERS COUNT

app.get('/getdailyorderscount', (req, res) => {
	const date = req.query.selectedDate; // Access the date from the query parameters
	const sql = `SELECT COUNT(*) as totalOrders FROM orderdetails WHERE DATE(orderdeddatetime) = ?`;
  
	db.query(sql, [date], (err, data) => {
	  if (err) res.json(err);
	  return res.json(data[0]);
	});
  });
  
  
//*GET INVOICE DETAILS

app.get('/getinvoicedetails',(req,res)=>{
	const sql = "SELECT * FROM invoicedetails";
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data);
	});
})

//*GET INVOICE DETAILS

app.get('/getinvoicedetails/:id',(req,res)=>{
	const id = req.params.id;
	const sql = "SELECT * FROM invoicedetails where invoiceNumber = ?";
	db.query(sql, [id], (err, data) => {
		if (err) res.json(err);
		return res.json(data[0]);
	});
})

//*GET SPECIFIC ORDER DETAILS 

app.get('/getorderdetails/:id',(req,res)=>{
	const id = req.params.id;
	const sql = "SELECT * FROM orderdetails WHERE `customerID` = ?";
	db.query(sql,[id], (err, data) => {
		if (err) res.json(err);
		return res.json(data);
	});
})

//* get order details

app.get('/getorderedlist/:id',(req,res)=>{
	const id = req.params.id;
	const sql = "select * from orderdetails where orderNumber = ?"
	db.query(sql,[id], (err, data) => {
		if (err) res.json(err);
		return res.json(data);
	});
})

//* get order details

app.get('/getorder',(req,res)=>{
	const id = req.params.id;
	const sql = "SELECT orderNumber, customerID, MAX(orderdeddatetime) AS order_datetime,GROUP_CONCAT(CONCAT(quantity, ' x ', menuitems) SEPARATOR '\n') AS order_items,SUM(price) AS total_amount FROM orderdetails GROUP BY orderNumber, customerID ORDER BY order_datetime"
	db.query(sql,[id], (err, data) => {
		if (err) res.json(err);
		return res.json(data[0]);
	});
})

//* get order count based on a month

app.get('/getdesiredordercount', (req, res) => {
	
    const sqlStatements = [
        "SET @target_week1 = 30;",
        "SET @target_week2 = 31;",
        "SET @target_week3 = 32;",
        "SET @target_week4 = 52;",
        "SELECT aw.week_number, YEAR(od.orderdeddatetime) AS year, COALESCE(COUNT(od.orderNumber), 0) AS weekly_order_count FROM (SELECT @target_week1 AS week_number UNION ALL SELECT @target_week2 UNION ALL SELECT @target_week3 UNION ALL SELECT @target_week4) AS aw LEFT JOIN orderdetails od ON aw.week_number = WEEK(od.orderdeddatetime) AND YEAR(od.orderdeddatetime) = YEAR(CURDATE()) GROUP BY aw.week_number, year ORDER BY year, aw.week_number;"
    ];

    const results = [];

    function executeQuery(index) {
        if (index >= sqlStatements.length) {
            // All queries are executed, extract and send the relevant data as JSON
            const responseData = results[results.length - 1]; // Get the last query's result
            res.json(responseData);
            return;
        }

        db.query(sqlStatements[index] ,(err, data) => {
            if (err) {
                console.error(`Error in SQL statement ${index + 1}:`, err);
            } else {
                console.log(`Result of SQL statement ${index + 1}:`, data);
                results.push(data);
            }

            // Move on to the next query
            executeQuery(index + 1);
        });
    }

    // Start executing queries
    executeQuery(0);
});

//~---------------------DASHBOARD-----------------------------

//* get total order count

app.get('/gettotalorderscount',(req,res)=>{
	const sql = "select COUNT(*) as count from orderdetails"
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data[0]);
	});
})


//* get total customer

app.get('/gettotalcustomerscount',(req,res)=>{
	const sql = "select COUNT(*) as count from customer_registration"
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data[0]);
	});
})


//* get total menu

app.get('/gettotalmenucount',(req,res)=>{
	const sql = "select COUNT(*) as count from menu"
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data[0]);
	});
})


//* get total menu items

app.get('/gettotalmenuitemscount',(req,res)=>{
	const sql = "select COUNT(*) as count from menuitems"
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data[0]);
	});
})

//* get recent 5 order request

app.get('/getrecentorders',(req,res)=>{
	const sql = "SELECT * FROM fos.orderdetails order by orderdeddatetime DESC limit 4"
	db.query(sql, (err, data) => {
		if (err) res.json(err);
		return res.json(data);
	});
})

const port = process.env.PORT || 3306; // Use the PORT environment variable if available

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// app.listen(5555, () => console.log("listing...."));

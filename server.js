// app imports
require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const express = require('express');
const cookieParser = require('cookie-parser');
const { log, count } = require('console');
const db = require('better-sqlite3')("MobusDB"); // Import the database connection
db.pragma('journal_mode = WAL'); // Enable foreign key support
db.PRAGMA = "foreign_keys = ON";
const app = express();
app.use(cookieParser());
const port = process.env.PORT || 4000;

// set up database tables if they don't exist
const createUsersTable = db.transaction(() => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
      checkbox BOOLEAN NOT NULL DEFAULT 0,
    )
  `).run();
});


// end database setup

// set app view engine
app.set('view engine', 'ejs');

// app uses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// middleware to log requests
app.use(function (req, res, next){
  res.locals.error = []; // Initialize error variable
  // verify user session or cookie
  try {
    const decoded = jwt.verify(req.cookies.user, process.env.JWT_SECRET);
    req.user = decoded; // Store user info in res.locals for use in templates
     // Store user info in res.locals for use in templates
  }catch(err) {
    req.user = false; // No valid session, user is not logged in
     // No valid session, user is not logged in
    // console.error('No valid session or cookie found:', err.message); //debug line
  }
  try {
    const adminToken = jwt.verify(req.cookies.admin, process.env.JWT_SECRET);
    req.admin = adminToken;
  } catch (error) {
    req.admin = false;
    // console.error('No valid session or cookie found:', err.message); //debug line
  }

  res.locals.user = req.user; // Make user info available in templates
  res.locals.admin = req.admin; // Make user info available in templates
  // console.log(req.admin); //debug line
  // console.log(req.user)

  next();
});

// middleware for protecting dashboard before cookie set or log in
function isauthenticated(req, res, next) {
  if (req.user) {
    return next()
  }
  res.redirect("/") 
}

function isAdmin(req, res, next) {
  if (req.admin) {
    return next()
  }
  res.redirect("/admin")
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// SYSTEM ROUTES
app.get('/', (req, res) => {
  res.render('index', { title: 'home page' });
});
app.get('/login', (req, res) => {
  res.render('login', { title: 'login page' });
});
app.get('/register', (req, res) => {
  res.render('registeration', { title: 'registration page' });
});

// protected dashboard route
app.get('/dashboard', isauthenticated, (req, res) => {
  res.render('dashboard', { title: 'dashboard page', user: req.user });
});

// ADMIN ROUTE
app.get("/admin", (req, res) =>{
  res.render("admin/signin", {admin: "admin login"})
});
app.get("/home", isAdmin, (req, res) =>{
  res.render("admin/home", {title: "admin Home"})
});


// USER SIGN UP TO THE DATABASE
app.post('/register', (req, res) => {
  // error array to store validation errors
  const error = [];

  // input validation [first name, last name, email, phone, password]
  const { first_name, last_name, email, phone, password, confirm_password } = req.body;


  if(typeof first_name !== 'string') first_name = '';
  if(typeof last_name !== 'string') last_name = '';
  if(typeof email !== 'string') email = '';
  if(typeof phone !== 'string') phone = '';
  if(typeof password !== 'string') password = '';
  if(typeof confirm_password !== 'string') confirm_password = '';

  // also check if user already exit in db
  const checkUser = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?');
  const existingUser = checkUser.get(email, phone);
  if(existingUser) {
    if(existingUser.email === email) error.push('Email already exists');
    if(existingUser.phone === phone) error.push('Phone number already exists');
  }


  if(!first_name || !last_name || !email || !phone || !password || !confirm_password) error.push('All fields are required');

  if(first_name && !/^[a-zA-Z]+$/.test(first_name)) error.push('First name must contain only letters');
  if(last_name && !/^[a-zA-Z]+$/.test(last_name)) error.push('Last name must contain only letters');
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error.push('Invalid email format');
  if(phone && !/^\d{10}$/.test(phone)) error.push('Phone number must be 10 digits');
  if(password !== confirm_password) error.push('Passwords do not match');

  if(error.length > 0) {
    // send response with errors
    return res.json({ success: false, error: error });
  }

  // save the user to db
  try{

    // inssert user into db
  const salt = bcrypt.genSaltSync(10); // Generate a salt
  const passwordHash = bcrypt.hashSync(password, salt); // Hash the password with the salt
  const insertUser = db.prepare(`
    INSERT INTO users (first_name, last_name, email, phone, password)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertUser.run(first_name, last_name, email, phone, passwordHash);

  // get user id from db
  const getUserId = db.prepare('SELECT id, first_name, last_name, phone, email FROM users WHERE email = ?');
  const user = getUserId.get(email);

  // create a user session or cookie

  const token = jwt.sign({
    // exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, 
    userId: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, phone: user.phone }, process.env.JWT_SECRET,); // Create a JWT token

  res.cookie('user', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    // maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'strict' // Prevent CSRF attacks
  }); // Set a cookie for the user



  // send response
  res.send({success: true, message: "User registered successfully!"});

  }catch(err) {
    // console.error('Error saving user to database:', err);  // debuge line
    return res.json({ success: false, error: ['An error occurred while saving the user. Please try again.'] });
  }

});

// USER LOGIN TO THE DATABASE
app.post('/login', async (req, res) => {
  // error container
  let error = []
  // console.log(req.body) //debuge point
  const { email, password } = req.body;

  // input validation
  if(typeof email !== "string") email = ''
  if(typeof password !== "string") password = ''
  if(!email || !password) error.push("All fields Required!!!")

  // check if acount exits or not
  const userCheck = db.prepare("SELECT * FROM users WHERE email = ?")
  const userdata = userCheck.get(email)
  if (!userdata) {
    error.push("Account Doesn't Exit!!!")
    return res.send({success: false, error: error})
  }else{
    // compair password hash
    const matchPassword = await bcrypt.compare(password, userdata.password)
    if (!matchPassword) {
      error.push("Wrong Password !!!")
      return res.send({success: false, error: error})
    }

    // give user session or cookie
    const token = jwt.sign({
      // exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, 
      userId: userdata.id, firstName: userdata.first_name, lastName: userdata.last_name, email: userdata.email, phone: userdata.phone }, process.env.JWT_SECRET,); // Create a JWT token

    res.cookie('user', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      // maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'strict' // Prevent CSRF attacks
    }); // Set a cookie for the user

    // success response
    res.send({success: true, message: "User logged in successfully!"});
  }

  // send error to front end
  if (error.length > 0) {
    res.send({success: false, error: error});
  }

});

// ADMIN LOGIN TO THE DATABASE
app.post('/admin', (req, res) => {
  // error container
  let error = []
  // console.log(req.body) //debuge point
  const { email, password } = req.body;

  // input validation
  if(typeof email !== "string") email = ''
  if(typeof password !== "string") password = ''
  if(!email || !password) error.push("All fields Required!!!")

  if ((process.env.ADMIN_EMAILS != email) || (process.env.ADMIN_PASSWORD != password)) {
    error.push("Access Denied!!!")
    return res.status(403).json({success: false, error: error})
  }else{
    // give user session or cookie
    const token = jwt.sign({
      // exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, 
      name: process.env.ADMIN_NAME}, 
      process.env.JWT_SECRET,); // Create a JWT token

    res.cookie('admin', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      // maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'strict' // Prevent CSRF attacks
    }); // Set a cookie for the user

    // success response
    res.send({success: true, message: "Admin logged in successfully!"});
  }

  // send error to front end
  if (error.length > 0) {
    res.send({success: false, error: error});
  }

});
app.get("/log_admin", (req, res) =>{
  res.clearCookie("admin");
  res.redirect("/admin")
});

// USER LOGOUT
app.get('/logout', (req, res) => {
  res.clearCookie('user'); // Clear the user cookie
  res.redirect('/'); // Redirect to login page after logout
});

// =======================================  api routes (POST API) ==============================================

// ADD BUS DETAILS
app.post("/api/add_bus", (req, res)=>{
  let error = []
  // console.log(req.body)
  const { Plate_number, Bus_capacity, Bus_type, Bus_driver, bus_name, bus_session } = req.body
  if(!Plate_number  || !Bus_capacity   || !Bus_type  || !Bus_driver || !bus_name || !bus_session ){
    error.push("All Feilds Required !!!")
    return res.send({success: false, error: error})
  } 

  try {
    // generate bus id & and insert in db
    const Bus_id = getRandomInt(10, 10000)
    const busDetails = db.prepare("INSERT INTO Buses (Bus_id, Plate_number, capacity, type, driver, name, session) VALUES (?, ?, ?, ?, ?, ?, ?)")
    busDetails.run(Bus_id, Plate_number, Bus_capacity, Bus_type, Bus_driver, bus_name, bus_session)
    res.send({success: true, message: "Bus Details Added Successfully"})
  } catch (err) {
    console.log(err);
    
    error.push(`Bus Plate Number ${Plate_number} or Driver ${Bus_driver} Already Assigned`, err)
  }

  if (error.length > 0) {
    return res.send({success: false, error: error})
  }
});

// ADD SEATS DETAILS
app.post("/api/add_seat", (req, res)=>{
  let err = []
  // console.log(req.body);
  const { BusPlate, SeatNumber, category, seat_price } = req.body

  if (!BusPlate || !SeatNumber || !category || !seat_price) {
    err.push("All feilds Are Required!!!")
    return res.send({success: false, error: err})
  }

  try {
    // retrive bus is using plate
    const BusData = db.prepare("SELECT Bus_id FROM Buses WHERE Plate_number = ?")
    const Bus = BusData.get(BusPlate)
    if (!Bus) {
      err.push("invalide Bus Plate Number")
      return res.send({success: false, error: err})
    }
    const Bus_id = Bus.Bus_id

    // check if Bus seat already added
    const checkSeat = db.prepare("SELECT seat_id FROM Seats WHERE Bus_plate = ? AND seat_number = ?")
    const rowCheck = checkSeat.get(BusPlate, SeatNumber)
    if (rowCheck) {
      err.push(`Seat Already added for Bus ${BusPlate}`)
      return res.send({success: false, error: err})
    }

    // generate seat id & and insert in db
    const seat_id = getRandomInt(10, 10000)
    let seat_status = "open"
    const Seat_details = db.prepare("INSERT INTO Seats (seat_id, bus_id, Bus_plate, seat_number, seat_type, seat_price, seat_status) VALUES (?, ?, ?, ?, ?, ?, ?)")
    Seat_details.run(seat_id, Bus_id, BusPlate, SeatNumber, category, seat_price, seat_status)
    res.send({success: true, message: "Bus Seat Added Successfully"})
  } catch (error) {
    // console.log(error);
    err.push("The Seat Added Already Exits in the System")
  }

  if (err.length > 0) {
    res.send({success: false, error: err})
  }

});

// ADD TRIPS DETAILS
app.post("/api/add_trips", (req, res)=>{
  let error = []
  // console.log(req.body);
  const { departure, cost, driver } = req.body
  if (!departure || !cost || !driver) {
    error.push("All feilds Required Please !!!")
    return res.send({success: false, error: error})
  }

  // get(fetch) bus id using driver
  const get_bus_Id = db.prepare("SELECT Bus_id FROM Buses WHERE driver = ?")
  const busRow = get_bus_Id.get(driver)
  if (!busRow) {
    error.push("Bus Driver Doesn't Exit in the system")
    return res.send({successs: false, error: error})
  } 

  try {
    // generate trip id
    const trip_id = getRandomInt(20, 4000)
    // get bus id
    const bus_id = busRow.Bus_id
    // console.log(bus_id);
    
    // insert trip info to db
    const trip = db.prepare("INSERT INTO Trips (trip_id, bus_id, Route_id, departure_time, price, driver) VALUES(?, ?, ?, ?, ?, ?)")
    trip.run(trip_id, bus_id, trip_id, departure, cost, driver)
    res.send({success: true, message: "Trip is added successfully", RouteID: trip_id})
  } catch (err) {
    // console.log(err);
    
    error.push(`This Bus Driver, ${driver} is aready on a Trip at this Time`)

  }



  if (error.length > 0) {
    res.send({success: false, error: error})
  }

})

// ADD ROUTES DETAILS
app.post("/api/add_route", (req, res)=>{
  let error = []
  // console.log(req.body);
  const { id, origin, destination, distance } = req.body
  if(!id || !origin || !destination || !distance) {
    error.push("All feilds Required !!!")
    return res.send({success: false, error: error})
  }

  // console.log(id);
  

    // get(fetch) bus id using driver
    const get_bus_Id = db.prepare("SELECT bus_id FROM Trips WHERE Route_id = ?")
    const busRow = get_bus_Id.get(id)
    const bus_id = busRow.bus_id;
    
    
    if (!busRow) {
      error.push("Bus Driver Doesn't Exit in the system")
      return res.send({successs: false, error: error})
    } 

  try {
    const route = db.prepare("INSERT INTO Routes (Route_id, origin, destination, distance, Bus_id) VALUES(?, ?, ?, ?, ?)")
    route.run(id, origin, destination, distance, bus_id)
    res.send({success: true, message: "Route added succesfully"})
  } catch (err) {
    // console.log(err);
    error.push("Route Origin or Destination Already added to System")
  }

  if (error.length > 0) {
    return res.send({success: false, error: error})
  }
})

// BOOKING
app.post("/api/booking", (req, res) =>{
  let error = []
  const { bus_id, seat_id } = req.body

  if (!seat_id || !bus_id) {
    error.push("Please select a seat to continue")
    return res.send({success: false, error: error})
  }

  // console.log(seat_id);
  // console.log(bus_id);

  try {
    // retrive bus data
  const busdata = db.prepare(`SELECT *
    FROM Buses
    INNER JOIN Trips ON Trips.bus_id = Buses.bus_id
    INNER JOIN Routes ON Routes.bus_id = Buses.bus_id
	WHERE Buses.bus_id = ?
  `)
  const busRow = busdata.get(bus_id)

  // retrive the seat number
  const seatData = db.prepare(`
    SELECT seat_number FROM Seats
    WHERE seat_id = ?
    `)
  const seatNumber = seatData.get(seat_id)
  const buscapacity = Number(busRow.capacity)

  // current data
  const now = new Date();
  const date = now.toLocaleString('en-GB', { hour12: false })

  // insert into booking table and reduce the number of capacity of the bus
  const booking_id = getRandomInt(10, 20000)
  const user_id = req.user.userId;
  const booking_reference = `MoBus-${getRandomInt(10, 10000000000000)}`
  const status = "unpaid"
  
  // insert booking
  const book_seat = db.prepare(`
    INSERT INTO Booking 
    (booking_id, user_id, seat_id, bus_id, booking_reference, route_id, seat_number, trip_id, 
    bus_driver, session, d_time, price, origin, destination, distance, bus_plate, date, status) 
    VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?,
     ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  book_seat.run(booking_id, user_id, seat_id, bus_id, booking_reference, busRow.Route_id, seatNumber.seat_number, busRow.trip_id, 
    busRow.driver, busRow.session, busRow.departure_time, busRow.price, busRow.origin, busRow.destination, busRow.distance, busRow.Plate_number, date, status)

  // reduce the bus capacity
  const seat_status = "Pending"
  const updatesetsleft = db.prepare(`
    UPDATE Seats
    SET seat_status = ?
    WHERE seat_id = ?;
    `)
  updatesetsleft.run(seat_status, seat_id)

  // reduce bus capacity
  const new_capacity = (buscapacity - 1);
  // if (new_capacity == -1) {
  //   error.push("The bus is Fully Booked!!!")
  //   return res.send({success: true, error: error})
  // }
  const capacitychange = db.prepare(`
      UPDATE Buses
      SET capacity = ?
      WHERE bus_id = ?;
    `)
  capacitychange.run(new_capacity, bus_id)

  // send to ui
  res.send({success: true, message: "Seat Added to Book List Successfully"})
  } catch (err) {
    // console.log(err);
    error.push("You Have Aready booked This Bus Proceed to Payment")
  }

  if (error.length > 0) {
    res.send({success: false, error: error})
  }
})

app.post("/api/make_booking", (req, res)=>{
  let error = []
  // console.log(req.body);s
  const { origin, destination, session} = req.body
  let route = `${origin} → ${destination}`
  if (!origin || !destination || !session) {
    error.push("Fill All to continue")
    return res.send({success: false, error: error})
  }

  const trip = db.prepare(`
    SELECT * FROM Routes 
    INNER JOIN Buses ON Routes.Bus_id = Buses.Bus_id
    INNER JOIN Trips ON Buses.Bus_id = Trips.bus_id
    WHERE origin = ? OR destination = ? OR session = ?
`)
  const tripRow = trip.all(origin, destination, session)
  
  if (tripRow.length === 0) {
    error.push("No Bus Shedule Found")
  }

  if (error.length > 0) {
    return res.send({success: false, error: error})
  }

  // send to front end
  res.send({success: true, data: tripRow});
})

// cancel booking / ticket
app.post("/api/cancel_ticket", (req, res) =>{
  console.log(req.body);
  
  const { booking_id, seat_id, bus_id } = req.body
  const delTicket = db.prepare("DELETE FROM Booking WHERE booking_id = ?")
  const delData = delTicket.run(booking_id)

  // pull up bus capacity
  const busData = db.prepare("SELECT capacity FROM Buses WHERE Bus_id = ?")
  const cap = busData.get(bus_id)
  const capacity = Number(cap.capacity) + 1
  
  if (delData) {

    // release the seat that was booked back to open(free)
    const releaseSeat = db.prepare("UPDATE Seats SET seat_status = ? WHERE seat_id = ?")
    releaseSeat.run("open", seat_id)

    // update back the bus capacity to previous
    const update_Avaliable_seats = db.prepare("UPDATE Buses SET capacity = ? WHERE Bus_id = ?")
    update_Avaliable_seats.run(capacity, bus_id)

    // send message to ui
    res.send({success: true, message: "Ticket was Canceled Successfully"})
  }
})

// payments and check out
app.post("/api/payment", async (req, res) =>{  
  // console.log(req.body);
  let error = []
  const { payment_method, amount, phone, booking_id} = req.body
  if (!payment_method || !amount || !phone || !booking_id) {
    error.push("Payment Method Is Required")
    return res.send({success: false, error: error})
  }

  try {
    // if method is mtn
    if (payment_method == "mtn") {
      // request payment from mtn api (momo)
      const ref_uuid = crypto.randomUUID();
      // console.log(ref_uuid);
      // TOKEN FOR USER
        const token = Buffer.from(`${process.env.UUID_MTN}:${process.env.API_KEY}`).toString("base64");
        const generate_access_token = await fetch("https://sandbox.momodeveloper.mtn.com/collection/token/", {
          method: "POST",
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json',
            "Ocp-Apim-Subscription-Key" : process.env.MTN_PRIMARY_KEY 
          }
        })
        const access_token = await generate_access_token.json()
        const mtn_token = access_token.access_token;
        // console.log(mtn_token);

      // REQUEST TO PAY
        const requestTopay = await fetch("https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay", {
          method: "POST", 
          headers: {
            "Authorization": `Bearer ${mtn_token}`,
            "X-Reference-Id": ref_uuid, //test (request id) uuid but show be randomly generated
            "X-Target-Environment": process.env.MTN_ENVIROMENT,
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": process.env.MTN_PRIMARY_KEY,
          },
          body: JSON.stringify({
              "amount":  `${amount}`,
              "currency": "EUR",
              "externalId": "00004335",
              "payer": {
                "partyIdType": "MSISDN",
                "partyId": `256${phone}`
              },
              "payerMessage": "MoBus Ticket Payment",
              "payeeNote": "MoMo Market Payment"
          })
        }); // console.log(requestTopay.status);
        
      // GETRESPONSE TO REQUESTOPAY
        const getStatus = await fetch(`https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${ref_uuid}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${mtn_token}`,
            "X-Target-Environment": process.env.MTN_ENVIROMENT,
            "Ocp-Apim-Subscription-Key": process.env.MTN_PRIMARY_KEY
          }
        })
        const response_data = await getStatus.json();
        // console.log(response_data); 

        // if status is success full [update status is booking to paid, insert into payment with the is generated]
        const status = "paid"
        if (response_data.status) {
          // update the the booking reg
          const updatePayStatus = db.prepare(`
            UPDATE Booking
            SET status = 'paid'
            WHERE booking_id = ?;
          `)
          updatePayStatus.run(booking_id)

          // insert transaction results to the payment
          const paymentID = getRandomInt(10, 2000000)
          const paymentRecord = db.prepare(`
            INSERT INTO payments (payment_id, booking_id, transaction_ref, amount, status)
            VALUES (?, ?, ?, ?, ?)
            `)
          paymentRecord.run(paymentID, booking_id, response_data.financialTransactionId, response_data.amount, response_data.status)

          // success
          res.send({success: true, message: "Ticket Payment Successfully"})
        }else{
          // console.log("Payment Rejected");
          error.push("Payment Rejected")
        }

    }else{
      // other operation (add other isp on this sector)
      error.push("Select Mtn Number to continue")
      return res.send({success: false, error: error})
    }
  } catch (err) {
    // console.log(err);
    error.push("Something Whent Wrong, Try Again Later");
  } 

  if (error.length > 0) {
    return res.send({success: false, error: error})
  }
})

// ======================================= end of post ==================================================

// ======================================== api routes (GET API) ========================================

// DISPLAY TO FRONT END
// origin, destination, distance, departure_time, price, driver
// SELECT * 
    // FROM Routes INNER JOIN Trips ON Routes.Route_id = Trips.trip_id
app.get("/api/get_data", (req, res)=>{
  let error = []
  // trip
  const routesData = db.prepare(`
    SELECT *
    FROM Buses
    INNER JOIN Trips ON Trips.bus_id = Buses.bus_id
    INNER JOIN Routes ON Routes.bus_id = Buses.bus_id
    `)
  const routesRow = routesData.all()
  

  if (routesRow.length === 0) {
    return res.send({success: false, error: ["No routes found"]});
  }

  // send to front end
  res.send({success: true, data: routesRow, user: req.user});
})

// get trips and routes
app.get("/api/get_routes", (req, res)=>{
    let error = []
  // trip
  const route = db.prepare(`
    SELECT origin, destination, bus_id
    FROM Routes
    `)
  const Row = route.all()
  

  if (Row.length === 0) {
    return res.send({success: false, error: ["No routes found"]});
  }

  // send to front end
  res.send({success: true, data: Row});
})

// fetch seats
app.get("/api/get_seat/:id", (req, res)=>{
  let error = []
  const seat_id = parseInt(req.params.id)
  
  try {
    const seatData = db.prepare(`
      SELECT * 
      FROM Seats
      WHERE Bus_id = ? 
      AND seat_status = 'open'
      `)
    const seatRow = seatData.all(seat_id)
    const seatCount = seatRow.length

    if (seatCount === 0) {
      error.push("Bus is full All seats Booked")
      return res.send({success: false, error: error});
    }

    // send to front end
    res.send({success: true, data: seatRow });
  } catch (err) {
    console.log(err);
    error.push("Bus is full All seats Booked")
  }

  if (error.length > 0) {
    res.send({success: false, error: error})
  }
  
})

// fetch booking records
// SELECT * 
      // FROM Booking
	  // INNER JOIN users ON Booking.user_id = users.id
      // WHERE user_id = ? 
app.get("/api/get_booking/:id", (req, res)=>{
  let error = []
  const user_id = parseInt(req.params.id)

    try {
    const BookingData = db.prepare(`
      SELECT
      booking_id, user_id, seat_id, bus_id, booking_reference, route_id, seat_number, trip_id, bus_driver, session, d_time, price, origin, destination
      ,distance, bus_plate, date, first_name, last_name, email, phone, booking_id
      FROM Booking
	    INNER JOIN users ON Booking.user_id = users.id
      WHERE user_id = ? AND status = 'unpaid' 
      `)
    const bookingRow = BookingData.all(user_id)
    const BookingCount = bookingRow.length

    if (BookingCount === 0) {
      error.push("You Dont Have Any Active Bookings")
      return res.send({success: false, error: error});
    }

    // send to front end
    res.send({success: true, data: bookingRow, count: BookingCount });
  } catch (err) {
    console.log(err);
    error.push("No Booking Records Avaliable")
  }

  if (error.length > 0) {
    res.send({success: false, error: error})
  }
})

// fetch all avaliable receipts of a given user
app.get("/api/get_receipt", (req, res)=>{
  const user_tag = req.user.userId
  // console.log(user_tag);
  let error = []
  const receiptData = db.prepare(`
    SELECT * 
    FROM Booking
    INNER JOIN payments ON Booking.booking_id = payments.booking_id
    WHERE user_id = ? AND Booking.status = 'paid'
    `)
  const receiptRow = receiptData.all(user_tag)
  const count = receiptRow.length

  if ( count == 0) {
    error.push("No Avaliable Receipts found")
  }

  if (error.length > 0) {
    return res.send({success: false, error: error})
  }

  // send to front end
  res.send({success: true, data: receiptRow, count: count});
})

// fetch receipt using booking id
app.get("/api/get_receipt/:id", (req, res)=>{
  let error = []
  const booking_id = parseInt(req.params.id)
  // console.log(booking_id);
  
  try {
    // load up to the history and issue reciepts
          const loadReciept = db.prepare(`
            SELECT * 
            FROM payments 
            INNER JOIN Booking ON Booking.booking_id = payments.booking_id
            WHERE payments.booking_id = ?
            `)
          const receiptData = loadReciept.all(booking_id)
          // console.log(receiptData);
          
          if (receiptData.length == 0) {
            error.push("No Receipt Yet?!!")
          }

        if (error.length > 0) {
          res.send({success: false, error: error})
        }

        // sucess
        res.send({success: true, data: receiptData, user: req.user})


  } catch (error) {
    console.log(error);
    
  }

})

// ========================================= admin sector =========================================

app.get("/api/get_total_booking", (req, res)=>{
  const totalBooking = db.prepare(`
    SELECT * FROM Booking
    `)
  const totalRowBooking = totalBooking.all()
  if (totalRowBooking.length == 0) {
    return res.send({success: true, count: 0})
  }

  // suuccess
  res.send({success: true, count: totalRowBooking.length})
})

app.get("/api/get_total_users", (req, res)=>{
  const totaluser = db.prepare(`
    SELECT * FROM users
    `)
  const totalRowusers = totaluser.all()
  if (totalRowusers.length == 0) {
    return res.send({success: true, count: 0})
  }

  // suuccess
  res.send({success: true, count: totalRowusers.length})
})

app.get("/api/get_total_buses", (req, res)=>{
  const totalBuses = db.prepare(`
    SELECT * FROM Buses
    `)
  const totalRowBuses = totalBuses.all()
  if (totalRowBuses.length == 0) {
    return res.send({success: true, count: 0})
  }

  // suuccess
  res.send({success: true, count: totalRowBuses.length})
})

app.get("/api/get_total_routes", (req, res)=>{
  const totalRoutes = db.prepare(`
    SELECT * FROM Routes
    `)
  const totalRowRoutes = totalRoutes.all()
  if (totalRowRoutes.length == 0) {
    return res.send({success: true, count: 0})
  }

  // suuccess
  res.send({success: true, count: totalRowRoutes.length})
})

















// LUNCH SERVER
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// ==== INSERT BUS DETAILS ====
const busForm = document.getElementById("busForm");
const addBus = document.getElementById("addBus");

busForm.onsubmit = (e)=>{
    e.preventDefault();
}

addBus.onclick = ()=>{
    fetch("/api/add_bus",{
        method: "POST",
        async: true,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            Plate_number: document.getElementById("plateNumber").value,
            Bus_capacity: document.getElementById("Capacity").value,
            Bus_type: document.getElementById("bus_type").value,
            Bus_driver: document.getElementById("bus_driver").value,
            bus_name: document.getElementById("bus_name").value,
            bus_session: document.getElementById("bus_session").value,
        })
    })
    .then(response => response.json())
    .then(data => {
        // console.log(data)
        if (data.message) {
            showNotification(data.message, 'success');
            busForm.reset();
            // redirect user
        }else{
            showNotification(data.error[0], 'error'); 
        }
    })
    .catch(error => console.error(error))
}

// ==== INSERT SEATS DATA ====
const addSeat = document.getElementById("addSeat")
const seatBtn = document.getElementById("seatBtn")

addSeat.onsubmit = (e)=>{
    e.preventDefault();
}

seatBtn.onclick = ()=>{
    fetch("/api/add_seat", {
        method: "POST",
        async: true,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            BusPlate: document.getElementById("Bus_plate").value,
            SeatNumber: document.getElementById("seats_number").value,
            category: document.getElementById("category").value,
            seat_price: document.getElementById("seat_price").value,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            showNotification(data.message, "success")
            addSeat.reset()
            // redirect
            switchTab("trips")
        }else{
            showNotification(data.error[0], "error")
        }
        
    })
    .catch(error => console.error(error))
}

// ==== INSERT TRIP DETAILS ====
const addTrip = document.getElementById("addTrip")
const tripBtn = document.getElementById("tripBtn")

addTrip.onsubmit = (e) =>{
    e.preventDefault()
}

tripBtn.onclick = () =>{
    fetch("/api/add_trips", {
        method: "POST",
        async: true,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            departure: document.getElementById("departure").value,
            cost: document.getElementById("cost").value,
            driver: document.getElementById("driver").value,
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            showNotification(data.message, "success")
            addTrip.reset()
            document.getElementById("Route_id").value = data.RouteID;
            // redirect
        }else{
            showNotification(data.error[0], "error")
        }
    })
    .catch(error => console.error(error))
}

// ==== INSERT ROUTES DETAILS ===
const addRoute = document.getElementById("addRoute")
const routeBtn = document.getElementById("routeBtn")

addRoute.onsubmit = (e) =>{
    e.preventDefault()
}

routeBtn.onclick = () =>{
    // alert("shina2")
    fetch("/api/add_route", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: document.getElementById("Route_id").value,
            origin: document.getElementById("origin").value,
            destination: document.getElementById("destination").value,
            distance: document.getElementById("distance").value
        })
    })
    .then(response => response.json())
    .then(data =>{
        if (data.message) {
            showNotification(data.message, "success")
            addRoute.reset()
            // redirect
            switchTab("daily")
        }else{
            showNotification(data.error[0], "error")
        }
    })
    .catch(error => console.error(error))
}
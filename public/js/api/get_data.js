// ===== NOTIFICATION =====
function showNotification(msg, type = 'success') {
            const el = document.getElementById('notification');
            const txt = document.getElementById('notificationText');
            const icon = el.querySelector('i');
            txt.textContent = msg;
            el.className = 'notification show';
            if (type === 'error') {
            el.classList.add('error');
            icon.className = 'fas fa-exclamation-circle';
            } else {
            el.classList.remove('error');
            icon.className = 'fas fa-check-circle';
            }
            clearTimeout(el._timer);
            el._timer = setTimeout(() => { el.className = 'notification'; }, 2000);
}


// close pop up
function closepopup(elementID) {
    const overlay = document.getElementById(`${elementID}`);
    overlay.classList.toggle('show');
    // location.href = "/dashboard"
}

// ========= FETCHING ROUTE AND TRIP DETAILS
const preview = document.getElementById("preview")
const originSelector = document.getElementById("origin")
const destinationSelector = document.getElementById("destination")
const userProfile = document.getElementById("display_user")
const bookingList = document.getElementById("booking_list")
const userid = document.getElementById("userID");
const notificationCount = document.getElementById("count")

async function loadData() {
    try {
        const response = await fetch("/api/get_data");
        const result = await response.json()
        // console.log(result.user.userId);
        
        if (result.data) {
            // display to element (trips) <span><i class="fas fa-road"></i> ${routes.distance} KM</span>
            preview.innerHTML = result.data.map(routes =>
                `<div class="route-card">
                    <h4><i class="fas fa-bus"></i> ${routes.origin} → ${routes.destination} [${routes.departure_time}]</h4>
                    <div class="route-info">
                        <span><i class="fas fa-money-bill-wave"></i> UGX ${routes.price}</span>
                        <span><i class="fas fa-bus"></i> ${routes.name} (${routes.Plate_number})</span>
                        <span><i class="fas fa-users"></i>${routes.capacity} Seats Left</span>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="booking(${routes.Bus_id})">Book seat</button>
                </div>
                `
            ).join('')   

        }else{
            // Skeleton loading
            preview.innerHTML = result.error.map(error =>
                `
                <div class="skeleton-card">
                    <div class="skeleton-line title"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>

                `
            ).join('')
        }

    } catch (error) {
        console.error(error);
    }
}

// load and open booking list for seat selection and notification
// booking details
const bookingForm = document.getElementById("booking_form")
const bookingBtn = document.getElementById("bookingBtn")
const bus_shedule = document.getElementById("bus_shedule")

if (bookingForm) {
    bookingForm.onsubmit = (e)=>{
    e.preventDefault()
}
}

if (bookingBtn) {
    bookingBtn.onclick = ()=>{
    fetch("/api/make_booking", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            origin: document.getElementById("origin").value,
            destination: document.getElementById("destination").value,
            session: document.getElementById("Trip_time").value
        })
    })
    .then(response => response.json())
    .then(buses => {
        // console.log(buses);
        
        if (buses.data) {
            bus_shedule.innerHTML = buses.data.map(bus => `
                <div style="border:1px solid var(--gray); border-radius:8px; padding:12px; margin-bottom:10px;">
                                <h4 style='color: #ff6600; text-transform: capitalize;'><i class="fa fa-road" aria-hidden="true"></i> ${bus.origin} → ${bus.destination}</h4>
                                <p>Fare (Cost): <strong style='text-transform: uppercase;'>${bus.price} UGX</strong></p>

                                <p>Bus Code: <strong style='text-transform: uppercase;'>${bus.Plate_number}</strong> | Session: <strong style='text-transform: uppercase;'>${bus.session}</strong> | Departure: <strong style='text-transform: uppercase;'>${bus.departure_time}</strong></p>
                                <button class="btn-primary btn-sm" onclick="booking(${bus.Bus_id})">Book a Seat</button>
                                <button class="btn-primary btn-sm" >Book The Whole Bus</button>
                            </div>
                `).join('')
            // showNotification(buses.message, "success")
        }else{
            // Skeleton loading
            // bus_shedule.innerHTML = buses.error.map(error =>
            //     `
            //     <div class="skeleton-card">
            //         <div class="skeleton-line title"></div>
            //         <div class="skeleton-line"></div>
            //         <div class="skeleton-line short"></div>
            //     </div>

            //     `
            // ).join('')
            showNotification(buses.error[0], "error")
        }
    })
    .catch(error => console.error(error));
}   
}

// load the destination and origin in drop down
async function loadRoute() {
    
    try {
        const response = await fetch("/api/get_routes");
        const result = await response.json()
        // console.log(result);

        if (result.data) {
            const originOption = document.getElementById("origin")
            const destinationOption = document.getElementById("destination")

            // clear the optionss
            originOption.length = 1
            result.data.forEach(item => {
                // origin
                const origin = document.createElement("option");
                origin.value = item.origin;       // Value sent to server
                origin.textContent = item.origin; // Text shown to user

                // destination
                const destination = document.createElement("option");
                destination.value = item.destination;       // Value sent to server
                destination.textContent = item.destination; // Text shown to user


                originOption.appendChild(origin); 
                destinationOption.appendChild(destination); 
            });    
        }else{
            console.log("something went wrong");
        }
        
    } catch (error) {
        // console.error(error);
    }
}

// get booking reccords
async function get_booking(user_id) {
    // console.log(user_id);
    
    try {
        const response = await fetch(`/api/get_booking/${user_id}`);
        const result = await response.json()
        // console.log(result);
        if (result.data) {
            bookingList.innerHTML = result.data.map(reccipt => `
                <div style="background:#f0f0f0; padding:12px; margin-top: 10px; border-radius:8px;">
                                <p><i class="fas fa-circle" style="color:var(--primary);"></i> Reference: <strong>${reccipt.booking_reference}</strong></p>
                                <p><i class="fas fa-road" style="color:var(--primary);"></i> Route: <strong>${reccipt.origin} → ${reccipt.destination}</strong> | <i class="fas fa-bus" style="color:var(--primary);"></i> Plate Number: <strong>${reccipt.bus_plate}</strong> | <i class="fas fa-clock" style="color:var(--primary);"></i> Travel Time: <strong>${reccipt.session}</strong> | <i class="fas fa-clock" style="color:var(--primary);"></i> Departure: <strong>${reccipt.d_time}</strong></p>
                                <p><i class="fas fa-circle" style="color:var(--primary);"></i> Distance: <strong>${reccipt.distance} KM</strong> </p>
                                <p><i class="fas fa-circle" style="color:var(--primary);"></i> Fare (Cost): <strong>${reccipt.price} UGX</strong> </p>
                                <p><i class="fas fa-circle" style="color:var(--primary);"></i> Seat Number: <strong>Seat ${reccipt.seat_number}</strong></p>
                                <p><i class="fas fa-circle" style="color:var(--primary);"></i> Date: <strong>${reccipt.date}</strong></p>
                                <button onclick="loadPrice(${reccipt.price}, ${reccipt.phone}, ${reccipt.booking_id})" class="btn-secondary btn-sm" style="margin-top:18px;"><i class="fas fa-credit-card"></i> Make Payment</button>
                                <button onclick="cancel_ticket(${reccipt.booking_id}, ${reccipt.seat_id}, ${reccipt.bus_id})" class="btn-primary btn-sm" style="margin-top:18px;"><i class="fas fa-window-close"></i> Cancel Ticket</button>
                            </div>
                `).join('')
        }else{
            bookingList.innerHTML = result.error.map(error => `
               <p id="noBookings" style="text-align:center; color:var(--gray); padding:20px;">${error}</p>
                `).join('')
        }

        // counts (NOTIFICATION)
        if (result.count) {
            notificationCount.innerHTML = result.count;
        }else{
            notificationCount.innerHTML = 0;
        }


        
    } catch (error) {
        // console.error(error);
    }
}

// booking (seat) function
function booking(seat_id) {
    // console.log("this the bus id"+" "+seat_id);
    
    fetch(`/api/get_seat/${seat_id}`)
    .then(response => {
        if (!response.ok) {
        console.log('Item not found');
        }
        return response.json();
    })
    .then(result => {
        // console.log(result);
        
        if (result.data) {
            LoadSeats(result.data)
        }else{
            showNotification(result.error[0], "error")
        }
    })
    .catch(error => {
        showNotification("Create an Account to Continue", "error")
        // console.error('Error:', error);
    });
}
// boooking tab
function LoadSeats(seats) {
        // console.log(seats);
        const seatsOption = document.getElementById("seats")

        // clear the optionss
        seatsOption.length = 1
        seats.forEach(item => {
            //insert bus id
            document.getElementById("bus_id").value = item.bus_id;    
            
            const option = document.createElement("option");
            option.value = item.seat_id;       // Value sent to server
            option.textContent = `SEAT ${item.seat_number}`; // Text shown to user (${item.seat_type}) (${item.seat_price}) //optional
            seatsOption.appendChild(option); 
        });

        const overlay = document.getElementById('popupOverlay_book_seat');
        overlay.classList.toggle('show');
}

// cancel / delete ticket
function cancel_ticket(booking_id, seat_id, bus_id) {
    if (confirm("Are You Sure You Want To Cancel The Ticket?")) {
        fetch(`/api/cancel_ticket`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                booking_id: booking_id,
                seat_id: seat_id,
                bus_id: bus_id,
            })
        })
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            if (data.message) {
                showNotification(data.message, "success")
                location.href = '/dashboard'
            }
        })
        .catch(error => console.error(error))
    } else {
    // ignored but just in case
  }
}

// payments / checkout
const paymentForm = document.getElementById("paymentForm")
const transportPrice = document.getElementById("amount")
const userNumber = document.getElementById("mobile_number")
const paymentBtn = document.getElementById("paymentBtn")

const Booking_id = document.getElementById("booking_id")

function loadPrice(price, phone_number, id, user_id) {
    transportPrice.value = price
    userNumber.value = phone_number
    Booking_id.value = id

    // pop up form
    const overlay = document.getElementById('popupOverlay');
    overlay.classList.toggle('show');
}

if (paymentForm) {
    paymentForm.onsubmit = (e) =>{
        e.preventDefault()
    }
}

if (paymentBtn) {
    paymentBtn.onclick = ()=>{
        // change the text to processing payment
        paymentBtn.innerText = "Processing...",
        fetch("/api/payment", {
            method: "POST",
            aysnc: true,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                payment_method: document.getElementById("payment_method").value,
                amount: transportPrice.value,
                phone: userNumber.value,
                booking_id: Booking_id.value,
            })
        }).then(response => response.json())
        .then(data => {
            if (data.message) {
                // show notification
                showNotification(data.message, "success")

                // other operations
                location.href = "/dashboard"
            }else{
                paymentBtn.innerText = "Finish Payment",
                showNotification(data.error[0], "error")
            }
        })
        .catch(error => console.error(error)
        )
    }
}


const receiptlist = document.getElementById("bookingList_receipt")
const notfy_book = document.getElementById("count2")
async function loadReceipt() {
    try {
        const response = await fetch("/api/get_receipt");
        const result = await response.json()
        // console.log(result);

        if (result.data) {
            receiptlist.innerHTML = result.data.map(receiptData => `
                <div class="booking-item">
                    <div>
                                <strong>${receiptData.origin} → ${receiptData.destination}</strong><br>
                                <small>${receiptData.date}</small>
                            </div>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <button class="btn btn-primary btn-sm" onclick="recept_veiw(${receiptData.booking_id})"><i class="fa-solid fa-receipt"></i> View Receipt</button>
                            </div>
                </div>
                `).join('')
        }else{
            receiptlist.innerHTML = result.error.map(error => `
                <p style="text-align:center; color:var(--gray); padding:20px;">${error}</p>
                `).join('')
        }

        if (result.count) {
            notfy_book.innerHTML = result.count
        }else{
            notfy_book.innerHTML = 0
        }
        
    } catch (error) {
        // console.error(error);
    }
}

// receipt view
const previwReceipt = document.getElementById("receiptView")
function recept_veiw(booking_id) {
    // console.log(booking_id);
   fetch(`/api/get_receipt/${booking_id}`)
    .then(response => {
        if (!response.ok) {
        console.log('Receipt not found');
        }
        return response.json();
    })
    .then(result => {
        // console.log(result);

        if (result.data) {
            previwReceipt.innerHTML = result.data.map(recieptDetails => `
                <div class="receipt-thin" id="thinReceipt">
                            <!-- header slim -->
                            <div class="thin-header">
                                <div class="thin-brand">
                                    <i class="fas fa-bus"></i>
                                    <h2>MoBus <span>Africa</span></h2>
                                </div>
                                <!-- <div class="thin-badge" style="text-transform: uppercase">
                                    <i class="fas fa-check-circle"></i>
                                </div> -->
                            </div>

                            <!-- trip details compact -->
                            <div class="trip-thin" id="tripThin">
                                <div class="row-thin">
                                    <span class="label"><i class="fas fa-route" style="margin-right:4px;"></i> Route</span>
                                    <span class="value" id="thinRoute">${recieptDetails.origin} → ${recieptDetails.destination}</span>
                                </div>
                                <div class="row-thin">
                                    <span class="label"><i class="far fa-calendar-alt"></i> Date & time</span>
                                    <span class="value" id="thinDateTime">${recieptDetails.date}</span>
                                </div>
                                <div class="row-thin">
                                    <span class="label"><i class="fas fa-chair"></i> Seat</span>
                                    <span class="value" id="thinSeat">SEAT ${recieptDetails.seat_number}</span>
                                </div>
                                <div class="divider-dot"></div>
                                <div class="row-thin" style="padding-top:2px;">
                                    <span class="label" style="font-weight:600;">Total</span>
                                    <span class="value fare-lg" id="thinFare">UGX ${recieptDetails.amount}</span>
                                </div>
                            </div>

                            <!-- passenger & ref inline -->
                            <div class="passenger-thin">
                                <span><i class="fas fa-user-circle"></i> <span id="thinPassenger" style='text-transform: capitalize'>${result.user.firstName} ${result.user.lastName}· ID: MB-${result.user.userId}</span></span>
                                <span><i class="fas fa-ticket-alt"></i> <span id="thinRef">${recieptDetails.booking_reference}</span></span>
                            </div>

                            <!-- QR code – slim -->
                            <div class="qr-thin">
                                <div id="qr-thin-container">
                                    <img src="https://quickchart.io/qr?text=${encodeURIComponent(recieptDetails.status)}&size=300" alt="QR code" srcset="">
                                </div>
                                <div class="scan-thin">
                                    <i class="fas fa-qrcode"></i> Scan This QR Code At Entry To Confirm Payment
                                </div>
                                <!-- <p>Designed By Mr. OJ Omollo</> -->
                            </div>

                            <!-- actions thin 
                            <div class="actions-thin">
                                <button class="btn-thin btn-thin-outline" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
                                <button class="btn-thin btn-thin-primary" onclick="downloadPDF()" id="downloadThinBtn"><i class="fas fa-download"></i> Save</button>
                                <button class="btn-thin" style="background: #e74c3c; color: #fff;" onclick="closepopup('popupOverlay_receipt')"><i class="fas fa-window-close"></i> close</button>
                            </div>
                            -->
                        </div>
                `)
        }else{
            // 
        }
    })
    
    

    // show pop up
    const overlay = document.getElementById('popupOverlay_receipt');
    overlay.classList.toggle('show');
}

function downloadPDF() {
            // Target the element
            const element = document.getElementById('thinReceipt');
            
            // Configure optional settings
            const options = {
                margin: 10,
                filename: 'receipt.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: {
                    unit: 'mm',
                    format: [110, 150], // width, height in mm
                    orientation: 'portrait'
                }
            };

            // Generate and save the PDF
            html2pdf().set(options).from(element).save();
}






















// load on page start
loadData()
loadRoute()
loadReceipt()
if (userid) {
    // LoadReceipt(userid.value)
    get_booking(userid.value)   
}

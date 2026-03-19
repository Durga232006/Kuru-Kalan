document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.querySelector("#bookingTable tbody");
    const historyBody = document.querySelector("#historyTable tbody");
    const bookedContainersDisplay = document.querySelector("#bookedContainers p");
    const availableContainersDisplay = document.querySelector("#availableContainers p");
    const totalContainersDisplay = document.querySelector("#totalContainers p");

    const TOTAL_FACILITY_CONTAINERS = 500;

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    function renderRow(booking, isHistory) {
        const containersReq = parseInt(booking.quantity) || 0;
        const photoHtml = booking.photoUrl
            ? `<img src="${booking.photoUrl}" style="width:50px;height:50px;border-radius:4px;object-fit:cover;">`
            : `<span data-lang-key="msg-no-photo">${translations[currentLang]?.['msg-no-photo'] || 'No Photo'}</span>`;

        const dateStr = booking.bookingDate
            ? new Date(booking.bookingDate).toLocaleDateString('en-IN')
            : '-';

        const shortId = booking._id ? booking._id.toString().slice(-6).toUpperCase() : '-';

        let actionHtml = '';
        if (isHistory) {
            const approvedDate = booking.approvedAt ? new Date(booking.approvedAt).toLocaleDateString('en-IN') : '-';
            actionHtml = `<span style="color:#2e7d32;font-weight:bold;font-size:12px;" data-lang-key="th-status">${translations[currentLang]?.['status-approved'] || 'Approved'}</span>`;
        } else if (booking.status === 'Approved') {
            actionHtml = `<span style="color:#2e7d32;font-weight:bold;" data-lang-key="btn-app-today">${translations[currentLang]?.['btn-app-today'] || '✅ Approved Today'}</span>`;
        } else {
            actionHtml = `
                <button onclick="approveBooking('${booking._id}', '${booking.farmerName}', '${booking.mobileNumber}')"
                    style="background:#2e7d32;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;" data-lang-key="btn-approve">
                    ${translations[currentLang]?.['btn-approve'] || 'Approve'}
                </button>`;
        }

        return `
            <tr>
                <td><strong>${shortId}</strong></td>
                <td>${photoHtml}</td>
                <td>${booking.farmerName || '-'}</td>
                <td>${booking.mobileNumber || '-'}</td>
                <td>${booking.address || '-'}</td>
                <td>${booking.landArea || '-'} ${booking.landUnit || ''}</td>
                <td>${booking.estimatedPaddy || '-'}</td>
                <td>${booking.containerSize || '-'}</td>
                <td>${containersReq}</td>
                <td>${dateStr}</td>
                <td>${actionHtml}</td>
            </tr>`;
    }

    async function loadBookings() {
        try {
            const res = await fetch('/api/bookings');
            if (!res.ok) throw new Error("Server error: " + res.status);
            const bookings = await res.json();
            
            // Store bookings globally so PDF download can access them
            window.allBookingsForPdf = bookings;

            const today = new Date();
            let bookedCount = 0;

            const activeBookings = [];
            const historyBookings = [];

            bookings.forEach((booking) => {
                bookedCount += parseInt(booking.quantity) || 0;

                if (booking.status === 'Approved' && booking.approvedAt) {
                    const approvedDate = new Date(booking.approvedAt);
                    if (!isSameDay(approvedDate, today)) {
                        // Approved on a previous day → goes to history
                        historyBookings.push(booking);
                        return;
                    }
                }
                // Pending OR approved today → stays in main table
                activeBookings.push(booking);
            });

            // Render Active bookings
            tableBody.innerHTML = '';
            if (activeBookings.length === 0) {
                tableBody.innerHTML = `<tr><td colspan='11' style='text-align:center;padding:20px;color:#555;' data-lang-key="msg-no-bookings">${translations[currentLang]?.['msg-no-bookings'] || 'No active bookings today.'}</td></tr>`;
            } else {
                activeBookings.forEach(b => { tableBody.innerHTML += renderRow(b, false); });
            }

            // Update stat cards
            if (totalContainersDisplay) totalContainersDisplay.innerText = TOTAL_FACILITY_CONTAINERS;
            if (bookedContainersDisplay) bookedContainersDisplay.innerText = bookedCount;
            if (availableContainersDisplay) availableContainersDisplay.innerText = Math.max(0, TOTAL_FACILITY_CONTAINERS - bookedCount);

            // Re-apply translations for dynamic content
            applyTranslations(currentLang);

        } catch (err) {
            console.error("Error fetching bookings:", err);
            tableBody.innerHTML = `<tr><td colspan='11' style='text-align:center;color:red;padding:20px;' data-lang-key="msg-err-load">${translations[currentLang]?.['msg-err-load'] || 'Failed to load bookings.'}</td></tr>`;
        }
    }

    window.approveBooking = async function (bookingId, farmerName, mobileNumber) {
        const confirmMsg = currentLang === 'ta'
            ? `${farmerName} க்கான பதிவை அங்கீகரிக்க வேண்டுமா? ${mobileNumber} க்கு ஒரு உறுதிப்படுத்தல் SMS அனுப்பப்படும்.`
            : `Approve booking for ${farmerName}?\nAn SMS confirmation will be sent to ${mobileNumber}.`;

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch(`/api/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Approved' })
            });
            const data = await res.json();
            if (res.ok) {
                const alertMsg = currentLang === 'ta'
                    ? `✅ பதிவு அங்கீகரிக்கப்பட்டது!\n\n[SMS ${mobileNumber} க்கு அனுப்பப்பட்டது]\n"அன்புள்ள ${farmerName}, உங்கள் கொள்கலன் முன்பதிவு குரு களன் கிடங்கு மூலம் அங்கீகரிக்கப்பட்டுள்ளது. ஒதுக்கீட்டிற்கு மையத்திற்குச் செல்லவும்."`
                    : `✅ Booking Approved!\n\n[SMS Sent to ${mobileNumber}]\n"Dear ${farmerName}, your container booking has been APPROVED by Kuru Kalan Storage. Please visit the center for allocation."`;

                alert(alertMsg);
                loadBookings();
            } else {
                alert("Failed: " + data.message);
            }
        } catch (err) {
            alert("Error: Could not update status. Is the server running?");
        }
    };

    loadBookings();

    // PDF Download Logic
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            if (!window.allBookingsForPdf || window.allBookingsForPdf.length === 0) {
                alert("No bookings available to download.");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');

            doc.setFontSize(18);
            doc.text("Kuru Kalan - Approved Bookings History", 14, 20);
            doc.setFontSize(11);
            doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 28);

            const tableColumn = ["Booking ID", "Name", "Mobile", "Land (ha)", "Est. Paddy (kg)", "Size", "Qty Required", "Booking Date", "Approved Date"];
            const tableRows = [];

            const today = new Date();
            let historyFound = false;

            window.allBookingsForPdf.forEach(booking => {
                if (booking.status === 'Approved' && booking.approvedAt) {
                    const approvedDate = new Date(booking.approvedAt);
                    if (!isSameDay(approvedDate, today)) {
                        historyFound = true;
                        const shortId = booking._id ? booking._id.toString().slice(-6).toUpperCase() : '-';
                        const bDate = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN') : '-';
                        const aDate = new Date(booking.approvedAt).toLocaleDateString('en-IN');
                        
                        const bookingData = [
                            shortId,
                            booking.farmerName || '-',
                            booking.mobileNumber || '-',
                            booking.landArea ? `${booking.landArea} ${booking.landUnit || ''}` : '-',
                            booking.estimatedPaddy || '-',
                            booking.containerSize || '-',
                            parseInt(booking.quantity) || 0,
                            bDate,
                            aDate
                        ];
                        tableRows.push(bookingData);
                    }
                }
            });

            if (!historyFound) {
                alert("There are no approved historical bookings to download yet.");
                return;
            }

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'grid',
                headStyles: { fillColor: [46, 125, 50] } // #2e7d32
            });

            doc.save(`Kuru_Kalan_History_${new Date().toISOString().split('T')[0]}.pdf`);
        });
    }
});
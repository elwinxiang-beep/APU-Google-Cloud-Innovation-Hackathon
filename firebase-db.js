// Import Firebase modular SDKs via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, query, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase project configuration keys
const firebaseConfig = {
    apiKey: "AIzaSyBqcJbIM_h9JWEKosk_iQxWhRQtz4Jw6dY",
    authDomain: "hostelkaki-dev.firebaseapp.com",
    projectId: "hostelkaki-dev",
    storageBucket: "hostelkaki-dev.firebasestorage.app",
    messagingSenderId: "1054798372880",
    appId: "1:1054798372880:web:4ef36928f91348d0e06a95"
};

// Initialize Firebase App & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 1. Sync User Session / Login to Firestore 'users' collection
 */
export async function syncUserToDatabase(userObject) {
    try {
        await addDoc(collection(db, "users"), {
            userId: userObject.id,
            name: userObject.name,
            role: userObject.role,
            unit: userObject.unit,
            phone: userObject.phone,
            lastLogin: serverTimestamp()
        });
        console.log("User session synced to Firestore.");
    } catch (error) {
        console.error("Error syncing user session: ", error);
    }
}

/**
 * 2. Submit a New Maintenance Ticket to Firestore 'tickets' collection
 */
export async function submitTicketToDatabase(reportData) {
    try {
        const docRef = await addDoc(collection(db, "tickets"), {
            ticketId: reportData.id,
            reporterName: reportData.reporterName,
            reporterPhone: reportData.reporterPhone,
            datetime: reportData.datetime,
            locationType: reportData.locationType,
            customLocation: reportData.customLocation || "",
            category: reportData.category,
            urgency: reportData.urgency,
            description: reportData.description,
            status: reportData.status || "Pending",
            floorplan: reportData.floorplan || {},
            imageUrl: reportData.imageUrl || "", // Base64 or URL string
            videoUrl: reportData.videoUrl || "",
            staffNotes: reportData.staffNotes || "",
            createdAt: serverTimestamp()
        });

        console.log("Ticket successfully written to Firestore with ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding ticket to Firestore: ", error);
        throw error;
    }
}

/**
 * 3. Update Ticket Status & Staff Notes in Firestore
 */
export async function updateTicketStatusInDatabase(firebaseDocId, status, staffNotes) {
  try {
    // Directly target the specific document using its unique Firebase ID
    const docRef = doc(db, "tickets", firebaseDocId);
    await updateDoc(docRef, { 
      status: status, 
      staffNotes: staffNotes 
    });
    console.log(`Ticket ${firebaseDocId} successfully updated in Firestore!`);
  } catch (e) {
    console.error("Error updating ticket in Firestore:", e);
    throw e;
  }
}

/**
 * 4. Sets up a real-time listener on the 'tickets' collection.
 * Whenever data changes in Firestore, it instantly triggers the callback function.
 * @param {Function} onUpdateCallback - Function to handle the updated array of tickets
 * @returns {Function} Unsubscribe function to stop listening if needed
 */
export function listenToTickets(onUpdateCallback) {
    const q = query(collection(db, "tickets"));
    
    // onSnapshot listens continuously for live changes in the database
    return onSnapshot(q, (querySnapshot) => {
        let remoteReports = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            remoteReports.push({ 
                firebaseDocId: docSnap.id, 
                ...data,
                // Preserve custom ticket ID (e.g., HK-2026-xxxx)
                id: data.id || docSnap.id 
            });
        });
        
        // Pass fresh data back to the frontend application
        onUpdateCallback(remoteReports);
    }, (error) => {
        console.error("Error in real-time ticket listener: ", error);
    });
}
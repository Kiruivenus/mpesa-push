import { useState } from "react";
import "./index.css";
import Axios from "axios";

function App() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null, 'success', 'fail', or 'cancel'
  const [paymentInfo, setPaymentInfo] = useState(null); // Stores payment details
  const [errors, setErrors] = useState({ phone: "", amount: "" });

  const validateInputs = () => {
    let isValid = true;
    const newErrors = { phone: "", amount: "" };

    if (!/^254\d{9}$/.test(phone)) {
      newErrors.phone =
        "Phone number must start with 254 and be 12 digits long (e.g., 254794424486).";
      isValid = false;
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = "Please enter a valid amount.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const payHandler = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setStatus(null);
    setPaymentInfo(null);

    try {
      const tokenResponse = await Axios.post(
        `${import.meta.env.VITE_API_URL}/stkPush`
      );
      const { access_token } = tokenResponse.data;

      const stkPushResponse = await Axios.post(
        `${import.meta.env.VITE_API_URL}/stkPush`,
        { amount, phone },
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      // Start polling or listening for payment updates
      const { CheckoutRequestID } = stkPushResponse.data;
      pollPaymentStatus(CheckoutRequestID);
    } catch (error) {
      console.error(error);
      setStatus("fail");
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = (checkoutRequestId) => {
    const interval = setInterval(async () => {
      try {
        const response = await Axios.get(
          `${import.meta.env.VITE_API_URL}/paymentStatus`,
          { params: { checkoutRequestId } }
        );

        if (response.data.status === "success") {
          clearInterval(interval);
          setStatus("success");
          setPaymentInfo(response.data.paymentInfo); // e.g., receipt number, amount, etc.
        } else if (response.data.status === "cancel") {
          clearInterval(interval);
          setStatus("cancel");
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
        clearInterval(interval);
        setStatus("fail");
      }
    }, 5000); // Poll every 5 seconds
  };

  return (
    <div className="min-h-screen bg-gradient-to-br px-7 from-green-50 to-green-100 flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-3xl font-semibold text-center text-green-600 mb-6">
          Pay With <span className="font-bold">Mpesa</span>
        </h1>
        <form className="flex flex-col space-y-4" onSubmit={payHandler}>
          <div>
            <input
              type="text"
              placeholder="Enter phone number (e.g., 254794424486)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.phone ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-green-400 focus:outline-none`}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
          <div>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.amount ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-green-400 focus:outline-none`}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 text-lg font-semibold text-white rounded-lg ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-4">
          Ensure the phone number starts with 254 and is registered for Mpesa.
        </p>
      </div>

      {status && (
        <div className="fixed inset-0 bg-black px-9 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 text-center">
            {status === "success" && paymentInfo ? (
              <>
                <div className="text-green-500 flex justify-center items-center mb-4">
                  <img
                    className="h-11 w-11"
                    src="https://i.im.ge/2025/01/22/HQ4fH4.1001584309.png"
                    alt="Success Icon"
                  />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  Payment Completed Successfully
                </h2>
                <p className="text-gray-500">Receipt: {paymentInfo.receipt}</p>
                <p className="text-gray-500">Amount: {paymentInfo.amount}</p>
              </>
            ) : status === "cancel" ? (
              <>
                <div className="text-red-500 flex justify-center items-center mb-4">
                  <img
                    className="h-11 w-11"
                    src="https://i.im.ge/2025/01/22/HQ4pZp.1001584362.png"
                    alt="Cancel Icon"
                  />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  Payment Canceled
                </h2>
                <p className="text-gray-500">
                  You canceled the payment request. Try again if needed.
                </p>
              </>
            ) : (
              <>
                <div className="text-red-500 flex justify-center items-center mb-4">
                  <img
                    className="h-11 w-11"
                    src="https://i.im.ge/2025/01/22/HQ4pZp.1001584362.png"
                    alt="Failure Icon"
                  />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  Payment Request Failed
                </h2>
                <p className="text-gray-500">
                  Something went wrong. Please try again later.
                </p>
              </>
            )}
            <button
              onClick={() => setStatus(null)}
              className="mt-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

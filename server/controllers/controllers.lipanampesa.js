import request from "request";
import 'dotenv/config';
import { getTimestamp } from "../Utils/utils.timestamp.js";

// Static ngrok callback URL
const CALLBACK_URL = "https://f905-102-215-33-50.ngrok-free.app";

// @desc Initiate STK Push
// @method POST
// @route /stkPush
// @access Public
export const initiateSTKPush = async (req, res) => {
    try {
        const { amount, phone, Order_ID } = req.body;

        const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
        const shortCode = "174379";
        const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
        const auth = "Bearer " + req.safaricom_access_token;

        const timestamp = getTimestamp();
        const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');

        console.log("Callback URL:", CALLBACK_URL);

        request(
            {
                url,
                method: "POST",
                headers: {
                    Authorization: auth
                },
                json: {
                    BusinessShortCode: shortCode,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline",
                    Amount: amount,
                    PartyA: phone,
                    PartyB: shortCode,
                    PhoneNumber: phone,
                    CallBackURL: `${CALLBACK_URL}/api/stkPushCallback/${Order_ID}`,
                    AccountReference: "Venus Online Shop",
                    TransactionDesc: "Paid online"
                }
            },
            function (error, response, body) {
                if (error) {
                    console.error("STK Push Error:", error);
                    return res.status(503).send({
                        message: "Error with the STK push",
                        error: error.message || "Unknown error"
                    });
                }
                res.status(200).json(body);
            }
        );
    } catch (e) {
        console.error("Error while initiating STK Push:", e);
        res.status(503).send({
            message: "Something went wrong while initiating STK Push. Contact admin.",
            error: e.message
        });
    }
};

// @desc Callback route where Safaricom posts transaction status
// @method POST
// @route /stkPushCallback/:Order_ID
// @access Public
export const stkPushCallback = async (req, res) => {
    try {
        const { Order_ID } = req.params;

        const {
            MerchantRequestID,
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata
        } = req.body.Body.stkCallback;

        const meta = CallbackMetadata.Item || [];
        const PhoneNumber = meta.find(o => o.Name === "PhoneNumber")?.Value?.toString() || "";
        const Amount = meta.find(o => o.Name === "Amount")?.Value?.toString() || "";
        const MpesaReceiptNumber = meta.find(o => o.Name === "MpesaReceiptNumber")?.Value?.toString() || "";
        const TransactionDate = meta.find(o => o.Name === "TransactionDate")?.Value?.toString() || "";

        console.log("-".repeat(20), " CALLBACK DATA ", "-".repeat(20));
        console.log(`
            Order_ID: ${Order_ID},
            MerchantRequestID: ${MerchantRequestID},
            CheckoutRequestID: ${CheckoutRequestID},
            ResultCode: ${ResultCode},
            ResultDesc: ${ResultDesc},
            PhoneNumber: ${PhoneNumber},
            Amount: ${Amount}, 
            MpesaReceiptNumber: ${MpesaReceiptNumber},
            TransactionDate: ${TransactionDate}
        `);

        res.status(200).json({ success: true });
    } catch (e) {
        console.error("Error in STK Push callback:", e);
        res.status(503).send({
            message: "Something went wrong with the callback.",
            error: e.message
        });
    }
};

// @desc Check the status of a transaction
// @method GET
// @route /confirmPayment/:CheckoutRequestID
// @access Public
export const confirmPayment = async (req, res) => {
    try {
        const { CheckoutRequestID } = req.params;

        const url = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
        const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
        const shortCode = "174379";
        const auth = "Bearer " + req.safaricom_access_token;

        const timestamp = getTimestamp();
        const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');

        request(
            {
                url,
                method: "POST",
                headers: {
                    Authorization: auth
                },
                json: {
                    BusinessShortCode: shortCode,
                    Password: password,
                    Timestamp: timestamp,
                    CheckoutRequestID
                }
            },
            function (error, response, body) {
                if (error) {
                    console.error("Error querying transaction status:", error);
                    return res.status(503).send({
                        message: "Error checking transaction status. Contact admin.",
                        error: error.message || "Unknown error"
                    });
                }
                res.status(200).json(body);
            }
        );
    } catch (e) {
        console.error("Error while querying payment status:", e);
        res.status(503).send({
            message: "Something went wrong while checking transaction status. Contact admin.",
            error: e.message
        });
    }
};

import request from "request";
import 'dotenv/config';

export const accessToken = (req, res, next) => {
    try {
        const secret = "vyBeoXQVWlPEBS7HxGaPl6Gf1OzEx87pCjFO5TLbRw1Bw3QYwEl2vUgRDKj2TbIu";
        const consumer = "uyiYYu0azA2sRjbmBZgAQoF64DvWPSNvPoF4mgevkuYdyYpw";
        const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
        const auth = Buffer.from(`${consumer}:${secret}`).toString('base64');

        request(
            {
                url: url,
                headers: {
                    "Authorization": "Basic " + auth,
                },
            },
            (error, response, body) => {
                if (error) {
                    console.error("Request error:", error);
                    return res.status(500).send({
                        message: "Something went wrong when trying to process your payment",
                        error: error.message,
                    });
                }

                try {
                    // Check for HTTP success status
                    if (response.statusCode !== 200) {
                        console.error("Non-200 response:", response.statusCode, body);
                        return res.status(response.statusCode).send({
                            message: "Failed to fetch access token",
                            error: body || "Unknown error",
                        });
                    }

                    const parsedBody = JSON.parse(body);
                    if (parsedBody.access_token) {
                        req.safaricom_access_token = parsedBody.access_token;
                        next();
                    } else {
                        console.error("Access token missing in response:", body);
                        res.status(500).send({
                            message: "Access token not found in response",
                            error: body,
                        });
                    }
                } catch (parseError) {
                    console.error("JSON parsing error:", parseError, body);
                    res.status(500).send({
                        message: "Invalid response from Safaricom",
                        error: parseError.message,
                    });
                }
            }
        );
    } catch (error) {
        console.error("Access token error:", error);
        res.status(500).send({
            message: "Something went wrong when trying to process your payment",
            error: error.message,
        });
    }
};

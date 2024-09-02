import axios from "axios";
import config from "../config";
const apiKey = config.API_KEY;

export async function externalChat({ prompt, sessionId, requestId }) {
  try {
    const response = await axios.post(
      `${config.external_chat}`,
      { prompt,apiKey },
      {
        headers: {
          "X-SessionId": sessionId,
          "X-RequestId": requestId,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
export async function feedbackChat({
  sessionId,
  requestId,
  feedback,
  thumbsUpSign,
}) {
  try {
    const response = await axios.post(
      `${config.feedback_chat}`,
      {
        session_id: sessionId,
        request_id: requestId,
        is_thumbs_up: thumbsUpSign,
        feedback_message: feedback,
        environment:'external',
      }
    );
    return response.data.message;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

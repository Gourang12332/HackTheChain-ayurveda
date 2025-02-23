/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState, useRef } from "react";
import Webcam from "react-webcam";

const CLOUD_NAME = "dbtv6upvc";
const UPLOAD_PRESET = "HackTheChain";

const Predict = () => {
  // const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [showWebcam, setShowWebcam] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const webcamRef = useRef<Webcam>(null);

  const startWebcam = () => setShowWebcam(true);

  const capture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setShowWebcam(false);
        await uploadToCloudinary(imageSrc);
      }
    }
  };

  const uploadToCloudinary = async (imageBase64: string) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", imageBase64);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.secure_url) {
      // setImageUrl(data.secure_url);
      await sendToBackend(data.secure_url);
    }
    setLoading(false);
  };

  const sendToBackend = async (url: string) => {
    setLoading(true);
    const response = await fetch(" https://ff5a-35-194-188-130.ngrok-free.app/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Type: "jpg", Url: url }),
    });
    const result = await response.json();
    setPrediction(result.report);
    await initializeChat(result.report);
    setLoading(false);
  };

  const initializeChat = async (prediction: any) => {
    const initialPrompt = `Hey gemini , please remember the upcoming object as it is my personal report and i will ask u queries
    about that ${JSON.stringify(prediction)}`;
    const response = await fetch(" https://ff5a-35-194-188-130.ngrok-free.app/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: initialPrompt }),
    });
    const result = await response.json();
    setChatMessages([{ role: "AI", content: result.reply }]);
  };

  const sendMessage = async () => {
      if (!userMessage.trim()) return;
    const newMessages = [...chatMessages, { role: "User", content: userMessage }];
    setChatMessages(newMessages);
    setUserMessage("");

    const response = await fetch(" https://ff5a-35-194-188-130.ngrok-free.app/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });
    const result = await response.json();
    
    setChatMessages([...newMessages, { role: "AI", content: formatChatResponse(result.response) }]);
    };
  const formatChatResponse = (response: any) => {
    if (Array.isArray(response)) {
      console.log("started editing....")
      return response.map(obj => 
        Object.entries(obj)
          .map(([key, value]) => `🔹 ${key}:\n   ${value}`)
          .join("\n\n")
      ).join("\n\n");
    }
    return response;
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-green-50 to-amber-50 text-gray-900 p-6 space-y-6">
      <h1 className="text-4xl font-bold text-green-800">🌿 Ayurvedic Health Analysis</h1>
      {!showWebcam ? (
        <button onClick={startWebcam} className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg shadow-md">
          📷 Start Webcam
        </button>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="border-4 border-green-500 rounded-lg shadow-md" />
          <button onClick={capture} className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg shadow-md">
            📸 Capture & Upload
          </button>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg border-2 border-green-500">
        <h2 className="text-xl font-semibold text-green-700 text-center">🔍 Prediction Results</h2>
        {loading ? (
          <p className="text-center text-green-600">⏳ Analyzing image...</p>
        ) : prediction ? (
          <div className="mt-3">
            <p className="text-lg font-medium">🦠 Disease: <span className="text-red-500">{prediction.disease}</span></p>
            <h3 className="font-semibold text-green-800">🌿 Dosha Analysis:</h3>
            <div className="grid grid-cols-3 gap-2">
              <p>Vata: {prediction.dosha_analysis.vata}</p>
              <p>Pitta: {prediction.dosha_analysis.pitta}</p>
              <p>Kapha: {prediction.dosha_analysis.kapha}</p>
            </div>
            <h3 className="font-semibold text-green-800 mt-3">🔍 Observations:</h3>
            <ul className="list-disc pl-5 text-gray-700">
              {prediction.observations.map((obs: string, index: number) => (
                <li key={index}>{obs}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-700">Waiting for analysis...</p>
        )}
      </div>

      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg border-2 border-green-500">
        <h2 className="text-2xl font-semibold text-green-700">💬 AI Chatbot</h2>
        <div className="w-full h-60 bg-gray-100 p-4 rounded-lg overflow-y-auto">
        {chatMessages.map((msg, index) => (
        <p key={index} className={msg.role === "User" ? "text-blue-700" : "text-green-700"}>
        {msg.role}: {Array.isArray(msg.content) ? msg.content.map(obj =>
        Object.entries(obj).map(([key, value]) => `🔹 ${key}: ${value}`).join("\n")
         ).join("\n\n") : msg.content}
       </p>
        ))}

        </div>
        <div className="mt-4 flex gap-2">
          <input type="text" placeholder="Type a message..." value={userMessage} onChange={(e) => setUserMessage(e.target.value)} className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-500" />
          <button onClick={sendMessage} className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg shadow-md">Send</button>
        </div>
      </div>
    </div>
  );
};
  
export default Predict;

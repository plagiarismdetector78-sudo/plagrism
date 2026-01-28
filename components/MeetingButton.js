"use client";

import { useState, useRef } from "react";
import Modal from "./Modal"; // We'll create a simple modal component

export default function MeetingButton({ onJoinRoom }) {
  const [isActive, setIsActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [roomId, setRoomId] = useState("");

  // Animate green button pulsing
  return (
    <>
      <button
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full ${
          isActive ? "bg-green-500 animate-pulse" : "bg-gray-500"
        } shadow-lg flex items-center justify-center text-white text-2xl z-50`}
        onClick={() => setShowModal(true)}
      >
        🎥
      </button>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-bold">Join Meeting</h2>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="border p-2 rounded w-full text-black"
            />
            <button
              onClick={() => {
                if (!roomId) return alert("Enter a room ID!");
                onJoinRoom(roomId);
                setShowModal(false);
              }}
              className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Join
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

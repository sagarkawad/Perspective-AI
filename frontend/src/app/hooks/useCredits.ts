import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useCredits } from "@/zustand/states";

export const creditsFromDB = () => {
  const { user } = useUser();
  const { credits, setCredits } = useCredits();
  const fetchCredits = async () => {
    if (user) {
      try {
        const response = await fetch(`http://localhost:8000/credits`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        });
        const data = await response.json();
        setCredits(data.credits);
      } catch (error) {
        console.error("Error fetching credits:", error);
      }
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  return { credits, refreshCredits: fetchCredits };
};

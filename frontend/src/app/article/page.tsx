"use client";
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Box,
  Stack,
  CircularProgress,
  Tab,
  Tabs,
  IconButton,
} from "@mui/material";
import ChatMessage from "@/app/components/ChatMessage";
import Navbar from "@/app/components/Navbar";
import { useSearchParams } from "next/navigation";
import TextToSpeech from "../components/TextToSpeech";
import MarkdownRenderer from "../components/MarkDownRenderer";
import { getOrCreateMachineId } from "../utils/machineId";
import { YouTubeEmbed } from "../components/ui/youtube-embed";
import { useStore } from "@/zustand/states";
import { useUser } from "@clerk/nextjs";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";

export default function Article() {
  const [videoId, setVideoId] = useState(""); // Default video
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [research, setResearch] = useState();
  // States for API responses and loading flags
  const [summary, setSummary] = useState("");
  const [summaryCompleted, setIsSummaryCompleted] = useState(false);
  const [perspective, setPerspective] = useState("");
  const [perspectiveCompleted, setIsPerspectiveCompleted] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  const [isGeneratingPerspective, setIsGeneratingPerspective] = useState(false);
  const { file } = useStore();
  const { user } = useUser();
  const [isChatOpen, setIsChatOpen] = useState(true);

  const searchParams = useSearchParams();
  const articleUrl = searchParams.get("url");
  const contentType = searchParams.get("type");

  // Add new state for chat history
  const [chatHistory, setChatHistory] = useState<
    Array<{ isAI: boolean; message: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatInitialized, setIsChatInitialized] = useState(false);

  // Add new state for thread ID
  const [threadId, setThreadId] = useState<string | null>(null);

  // Set URL and type when component mounts
  useEffect(() => {
    if (articleUrl) {
      setUrl(articleUrl);
    }
    if (contentType) {
      setType(contentType);
    }
  }, [articleUrl, contentType]);

  useEffect(() => {
    if (!articleUrl) return;
    const fetchSessionData = async () => {
      try {
        const res = await fetch("http://localhost:8000/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: articleUrl,
            machine_id: getOrCreateMachineId(),
            user_id: user?.id,
          }),
        });
        const data = await res.json();
        if (data.exists) {
          setSummary(data.summary);
          setPerspective(data.perspective);
          setSessionExists(true);
          setIsSummaryCompleted(true);
          setIsPerspectiveCompleted(true);
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setSessionChecked(true);
      }
    };
    fetchSessionData();
  }, [articleUrl, user]);

  useEffect(() => {
    if (!sessionChecked || sessionExists || !articleUrl) return;

    const fetchData = async () => {
      try {
        // Get article summary
        let response;
        if (contentType === "pdf") {
          if (file) {
            const formData = new FormData();
            formData.append("file", file);

            response = await fetch(
              "http://localhost:8000/scrape-and-summarize",
              {
                method: "POST",
                body: formData,
              },
            );
          }
        } else {
          // For articles and videos, send URL as form data
          const formData = new FormData();
          formData.append("url", articleUrl);
          response = await fetch(
            contentType === "article"
              ? "http://localhost:8000/scrape-and-summarize"
              : "http://localhost:8000/analyze-video",
            {
              method: "POST",
              body: formData,
            },
          );
        }
        if (!response) {
          console.error("No response received");
          return;
        }
        if (!response.body) {
          console.error("No response body");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let summaryVar = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  console.error("Stream error:", data.error);
                  continue;
                }
                if (data.chunk) {
                  setSummary((prev) => prev + data.chunk);
                  summaryVar = summaryVar + data.chunk;
                }
              } catch (e) {
                console.error("Error parsing stream data:", e);
              }
            }
          }
        }
        const generatePerspective = async () => {
          try {
            setPerspective("");
            console.log("Generating perspective for summary:", summaryVar);
            const resPerspective = await fetch(
              "http://localhost:8000/generate-perspective",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ summary: summaryVar }),
              },
            );

            if (!resPerspective.ok) {
              throw new Error(`HTTP error! status: ${resPerspective.status}`);
            }

            const reader2 = resPerspective.body?.getReader();
            if (!reader2) {
              throw new Error("No reader available");
            }

            const decoder2 = new TextDecoder();
            let buf2 = "";

            while (true) {
              const { done: done2, value: value2 } = await reader2.read();
              if (done2) break;

              buf2 += decoder2.decode(value2, { stream: true });
              const lines2 = buf2.split("\n");
              buf2 = lines2.pop() || "";

              for (const line2 of lines2) {
                if (line2.trim()) {
                  setPerspective((prev) => prev + line2);
                }
              }
            }
          } catch (err) {
            console.error("Error generating perspective:", err);
          } finally {
            setIsPerspectiveCompleted(true);
          }
        };
        await generatePerspective();
      } catch (error) {
        console.error("Error fetching article analysis:", error);
      } finally {
        setIsSummaryCompleted(true);
      }
    };
    fetchData();
  }, [sessionChecked, sessionExists, contentType, articleUrl, file]);

  useEffect(() => {
    if (!summary || !perspective || !articleUrl || !user) return;

    const initializeChat = async () => {
      try {
        await fetch(`http://localhost:8000/initialize-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: articleUrl,
            summary: summary,
            perspective: perspective,
            machine_id: getOrCreateMachineId(),
            user_id: user.id,
          }),
        });

        const historyResponse = await fetch(
          `http://localhost:8000/chat-history`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: articleUrl,
              machine_id: getOrCreateMachineId(),
              user_id: user.id,
            }),
          },
        );
        const historyData = await historyResponse.json();

        const greetingMessage = {
          isAI: true,
          message:
            "Hello! I've analyzed the article. What would you like to know about it?",
        };
        setChatHistory(
          historyData && historyData.length > 0
            ? [greetingMessage, ...historyData]
            : [greetingMessage],
        );
        setIsChatInitialized(true);
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initializeChat();
  }, [summaryCompleted, perspectiveCompleted, articleUrl, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = message;
    setChatHistory((prev) => [...prev, { isAI: false, message: userMessage }]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url,
          question: userMessage,
          thread_id: threadId,
          machine_id: getOrCreateMachineId(),
          user_id: user?.id,
          vm: false,
        }),
      });

      const data = await response.json();

      // Store the thread ID from the response if it exists
      if (data.thread_id) {
        setThreadId(data.thread_id);
      }

      // Add AI response to chat
      setChatHistory((prev) => [
        ...prev,
        { isAI: true, message: data.response },
      ]);
    } catch (error) {
      console.error("Error in chat:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          isAI: true,
          message: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to play base64 audio
  // const playAudio = (base64Audio: string) => {
  //   // Create a new Audio object with the data URL
  //   const audio = new Audio(base64Audio);
  //
  //   // Add error handling
  //   audio.onerror = (error) => {
  //     console.error("Audio playback error:", error);
  //   };
  //
  //   // Play the audio
  //   audio.play().catch((error) => {
  //     console.error("Audio playback failed:", error);
  //     // Handle autoplay restrictions
  //     if (error.name === "NotAllowedError") {
  //       console.log(
  //         "Please interact with the page first to enable audio playback",
  //       );
  //     }
  //   });
  // };

  const cardStyle = {
    bgcolor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
    borderRadius: "16px",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    },
    "& .MuiCardContent-root": {
      borderRadius: "16px",
      p: 3,
    },
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          bgcolor: "#f8fafc",
          minHeight: "100vh",
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          position: "relative",
          color: "#1e293b",
        }}
      >
        {/* Left side - Content */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, md: 4 },
            overflowY: "auto",
            maxHeight: { xs: "100vh", lg: "100vh" },
            width: {
              xs: "100%",
              lg: isChatOpen ? "calc(100% - 400px)" : "100%",
            },
            transition: "all 0.3s ease",
            maxWidth: { lg: isChatOpen ? "calc(100% - 400px)" : "100%" },
            mx: { lg: 0 },
            pr: { lg: isChatOpen ? 4 : 4 },
            pl: { lg: 4 },
            pb: { xs: isChatOpen ? "40vh" : "80px" },
          }}
        >
          {/* Chat Toggle Button */}
          <IconButton
            onClick={() => setIsChatOpen(!isChatOpen)}
            sx={{
              position: "fixed",
              right: { xs: 16, lg: isChatOpen ? 416 : 16 },
              top: { xs: isChatOpen ? "auto" : "auto", lg: "80px" },
              bottom: { xs: isChatOpen ? "calc(40vh + 16px)" : 16, lg: "auto" },
              zIndex: 1000,
              bgcolor: "#3b82f6",
              color: "white",
              "&:hover": {
                bgcolor: "#2563eb",
              },
              width: 40,
              height: 40,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {isChatOpen ? <CloseIcon /> : <ChatIcon />}
          </IconButton>

          {type === "video" && (
            <Box sx={{ mb: 4, maxWidth: "100%", overflow: "hidden" }}>
              <YouTubeEmbed videoId={videoId} />
            </Box>
          )}

          <Stack spacing={3} sx={{ maxWidth: "100%", width: "100%" }}>
            {/* Summary Section */}
            <Card sx={{ ...cardStyle, width: "100%", ml: 0 }}>
              <CardContent>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  gutterBottom
                  color="#3b82f6"
                  sx={{ mb: 2 }}
                >
                  Article Summary
                </Typography>
                <TextToSpeech text={summary} />
                <MarkdownRenderer content={summary} />
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: "1px solid rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight="bold"
                  >
                    Source Article:
                  </Typography>
                  <Typography
                    variant="body2"
                    color="#3b82f6"
                    component="a"
                    href={url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      wordBreak: "break-word",
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {url}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Perspective Section */}
            <Card sx={{ ...cardStyle, width: "100%", ml: 0 }}>
              <CardContent>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  gutterBottom
                  color="#3b82f6"
                  sx={{ mb: 2 }}
                >
                  AI Perspective
                </Typography>
                <TextToSpeech text={perspective} />
                <Typography variant="body1" component="div" gutterBottom>
                  <MarkdownRenderer content={perspective} />
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Box>

        {/* Right side - Chat */}
        <Box
          sx={{
            width: { xs: "100%", lg: "400px" },
            height: { xs: "40vh", lg: "100vh" },
            borderLeft: { lg: "1px solid rgba(0, 0, 0, 0.1)" },
            display: "flex",
            flexDirection: "column",
            bgcolor: "white",
            position: { xs: "fixed", lg: "fixed" },
            bottom: 0,
            right: 0,
            transform: {
              xs: isChatOpen ? "translateY(0)" : "translateY(100%)",
              lg: isChatOpen ? "translateX(0)" : "translateX(100%)",
            },
            transition: "all 0.3s ease",
            zIndex: 900,
            boxShadow: {
              xs: "0 -4px 16px rgba(0, 0, 0, 0.1)",
              lg: "-4px 0 16px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          {/* Chat Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              bgcolor: "#f8fafc",
            }}
          >
            {chatHistory.map((chat, index) => (
              <ChatMessage
                key={index}
                isAI={chat.isAI}
                message={chat.message}
              />
            ))}
            {isLoading && (
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>

          {/* Chat Input */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 2,
              borderTop: "1px solid rgba(0, 0, 0, 0.1)",
              bgcolor: "white",
            }}
          >
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask a question about the article..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.1)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.2)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#1e293b",
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{
                  borderRadius: "12px",
                  minWidth: "auto",
                  px: 2,
                  bgcolor: "#3b82f6",
                  "&:hover": {
                    bgcolor: "#2563eb",
                  },
                }}
                disabled={isLoading || !isChatInitialized}
              >
                Send
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}

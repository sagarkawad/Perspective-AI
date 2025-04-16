"use client";

import Navbar from "../components/Navbar";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Typography,
  Box,
  Stack,
  CircularProgress,
  Card,
  CardContent,
  Tab,
  Tabs,
} from "@mui/material";
import TextToSpeech from "../components/TextToSpeech";
import { YouTubeEmbed } from "../components/ui/youtube-embed";
import { CardFooter } from "@/app/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import ResearchDashboard from "../components/research-dashboard";
import { SummaryData } from "../components/research-dashboard";
import ChatMessage from "@/app/components/ChatMessage";
import { getOrCreateMachineId } from "../utils/machineId";
import MarkdownRenderer from "../components/MarkDownRenderer";

export default function Home() {
  const [videoId, setVideoId] = useState(""); // Default video
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  // States for API responses and loading flags
  const [summary, setSummary] = useState("");
  const [perspective, setPerspective] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isPerspectiveLoading, setIsPerspectiveLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [research, setResearch] = useState();

  const searchParams = useSearchParams();
  const articleUrl = searchParams.get("url");

  // Add new state for chat history
  const [chatHistory, setChatHistory] = useState<
    Array<{ isAI: boolean; message: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatInitialized, setIsChatInitialized] = useState(false);

  // Add new state for thread ID
  const [threadId, setThreadId] = useState<string | null>(null);

  // Update URL state when articleUrl changes
  useEffect(() => {
    setUrl(articleUrl);
  }, [articleUrl]);

  // Extract video ID from URL and update videoId state
  useEffect(() => {
    if (url) {
      const id = extractVideoId(url);
      if (id) {
        setVideoId(id);
      }
    }
  }, [url]);

  // Helper function to extract video ID from various YouTube URLs
  function extractVideoId(link: string): string | null {
    try {
      const urlObj = new URL(link);
      // For youtu.be links, the pathname is the video id
      if (urlObj.hostname === "youtu.be") {
        return urlObj.pathname.slice(1);
      }
      // For youtube.com links, the video id is usually in the "v" parameter
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v");
      }
    } catch (error) {
      console.error("Error extracting video id:", error);
    }
    return null;
  }

  useEffect(() => {
    if (articleUrl) {
      const fetchData = async () => {
        try {
          // API request to get Deep Research
          const research_response = await fetch(
            "http://localhost:8000/deep-research",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: articleUrl }),
            },
          );

          const research_data = await research_response.json();
          console.log(research_data.research);
          setResearch(research_data.research);

          // Get video summary
          const response = await fetch("http://localhost:8000/analyze-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: articleUrl }),
          });
          const data = await response.json();
          console.log("Received summary response:", data);

          // If there's an error (like missing subtitles), set errorMessage and skip AI perspective
          if (data.status === "error") {
            setErrorMessage(data.message);
            setIsSummaryLoading(false);
            setIsPerspectiveLoading(false);
            return;
          }

          const summaryText = data.summary;
          if (!summaryText) {
            throw new Error("Summary text not found in response");
          }
          setSummary(summaryText);
          setIsSummaryLoading(false);

          // Request for AI perspective using the summary text
          const resPerspective = await fetch(
            "http://localhost:8000/generate-perspective",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ summary: summaryText }),
            },
          );
          const dataPerspective = await resPerspective.json();
          console.log("Received perspective response:", dataPerspective);
          setPerspective(dataPerspective.perspective);
          setIsPerspectiveLoading(false);

          // Initialize chat session
          await fetch(`http://localhost:8000/initialize-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: articleUrl,
              summary: summaryText,
              perspective: dataPerspective.perspective,
              machine_id: getOrCreateMachineId(),
            }),
          });

          // Fetch existing chat history
          const historyResponse = await fetch(
            `http://localhost:8000/chat-history`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: articleUrl,
                machine_id: getOrCreateMachineId(),
              }),
            },
          );
          const historyData = await historyResponse.json();

          // Always include the greeting message at the beginning
          const greetingMessage = {
            isAI: true,
            message:
              "Hello! I've analyzed the article. What would you like to know about it?",
          };
          if (historyData && historyData.length > 0) {
            setChatHistory([greetingMessage, ...historyData]);
          } else {
            setChatHistory([greetingMessage]);
          }

          setIsChatInitialized(true);
        } catch (error) {
          console.error("Error fetching article analysis:", error);
          setIsSummaryLoading(false);
          setIsPerspectiveLoading(false);
        }
      };
      fetchData();
    }
  }, [articleUrl]);

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
  const cardStyle = {
    bgcolor: "white",
    boxShadow: 3,
    borderRadius: "20px",
    "& .MuiCardContent-root": { borderRadius: "20px" },
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <>
      <Navbar />

      <Box
        sx={{
          bgcolor: "#111827",
          background:
            "linear-gradient(90deg, rgba(7, 0, 40, 1) 0%, rgba(23, 6, 66, 1) 50%, rgba(19, 0, 47, 1) 100%)",
          color: "white",
          minHeight: "100vh",
          py: 8,
        }}
      >
        <YouTubeEmbed videoId={videoId} />
        <Container
          maxWidth="lg"
          sx={{
            flexGrow: 1,
            pt: 4,
            transition: "transform 0.3s ease",
            transform: "translateX(0)",
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            centered
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <Tab
              label="AI Perspective"
              sx={{ fontSize: "1.6rem", textTransform: "none", color: "white" }}
            />
            <Tab
              label="Deep Research"
              sx={{ fontSize: "1.6rem", textTransform: "none", color: "white" }}
            />
          </Tabs>
          {tabIndex === 0 && (
            <Stack spacing={6} className="mt-4">
              {/* Summary Section */}
              {isSummaryLoading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ height: "150px" }}
                >
                  <CircularProgress color="primary" />
                </Box>
              ) : errorMessage ? (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      gutterBottom
                      color="error"
                    >
                      Error
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {errorMessage}
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      gutterBottom
                      color="primary.main"
                    >
                      Video Summary
                    </Typography>
                    <TextToSpeech text={summary} />
                    <Typography variant="body1" paragraph>
                      <MarkdownRenderer content={summary} />
                    </Typography>
                    <CardFooter className="pt-1">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <a
                          href={url ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Visit Resource
                        </a>
                      </Button>
                    </CardFooter>
                  </CardContent>
                </Card>
              )}

              {/* Perspective Section (only render if no error) */}
              {!errorMessage &&
                (isPerspectiveLoading ? (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    sx={{ height: "150px" }}
                  >
                    <CircularProgress color="primary" />
                  </Box>
                ) : (
                  <Card sx={cardStyle}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        gutterBottom
                        color="primary.main"
                      >
                        AI Perspective
                      </Typography>
                      <TextToSpeech text={perspective} />
                      <MarkdownRenderer content={perspective} />
                    </CardContent>
                  </Card>
                ))}
              {/* Discussion Section */}
              <Card sx={cardStyle}>
                <CardContent
                  sx={{
                    p: 4,
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    gutterBottom
                    color="primary.main"
                  >
                    Discussion
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      overflowY: "auto",
                      maxHeight: 400,
                      mb: 3,
                      borderRadius: "16px",
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
                  <Box
                    component="form"
                    onSubmit={handleSubmit}
                    display="flex"
                    gap={2}
                  >
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Ask a question about the article..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      color="primary"
                      disabled={isLoading || !isChatInitialized}
                    >
                      Send
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          )}
          {tabIndex === 1 && research ? (
            <ResearchDashboard data={research as SummaryData} />
          ) : (
            tabIndex === 1 && (
              <div className="flex justify-center items-center h-full w-full mt-10">
                <CircularProgress />
              </div>
            )
          )}
        </Container>
      </Box>
    </>
  );
}

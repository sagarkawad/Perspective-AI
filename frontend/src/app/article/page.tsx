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
} from "@mui/material";
import ChatMessage from "@/app/components/ChatMessage";
import Navbar from "@/app/components/Navbar";
import { useSearchParams } from "next/navigation";
import TextToSpeech from "../components/TextToSpeech";
import RelatedTopicsSidebar from "../components/RelatedTopicsSidebar";
import ResearchDashboard from "../components/research-dashboard";
import { SummaryData } from "../components/research-dashboard";
import MarkdownRenderer from "../components/MarkDownRenderer";
import { getOrCreateMachineId } from "../utils/machineId";
import { YouTubeEmbed } from "../components/ui/youtube-embed";

export default function Article() {
  const [videoId, setVideoId] = useState(""); // Default video
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [research, setResearch] = useState();
  // States for API responses and loading flags
  const [summary, setSummary] = useState("");
  const [perspective, setPerspective] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isPerspectiveLoading, setIsPerspectiveLoading] = useState(true);
  const [text, setText] = useState("");

  const searchParams = useSearchParams();
  const articleUrl = searchParams.get("url");
  const contentType = searchParams.get("type");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Add new state for chat history
  const [chatHistory, setChatHistory] = useState<
    Array<{ isAI: boolean; message: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatInitialized, setIsChatInitialized] = useState(false);

  // Add new state for thread ID
  const [threadId, setThreadId] = useState<string | null>(null);

  const handleSidebarToggle = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
  };

  // Update URL state when articleUrl changes
  useEffect(() => {
    setUrl(articleUrl);
    setType(contentType);
    console.log("type", contentType);
  }, []);

  useEffect(() => {
    console.log("inside use effect", articleUrl);
    console.log("inside use effect", contentType);

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
    const fetchData = async () => {
      try {
        // API request to get Deep Research
        if (contentType === "article" || contentType === "video") {
          const research_response = await fetch(
            "http://localhost:8000/deep-research",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: url }),
            },
          );

          const research_data = await research_response.json();
          console.log(research_data.research);
          setResearch(research_data.research);
        }

        // Get article summary
        const response = await fetch(
          contentType === "article" || contentType === "pdf"
            ? "http://localhost:8000/scrape-and-summarize"
            : "http://localhost:8000/analyze-video",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body:
              type === "article" || type === "video"
                ? JSON.stringify({ url: url })
                : JSON.stringify({ content: text }),
          },
        );
        const data = await response.json();
        console.log("Received summary response:", data);

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
  }, [url, type]);

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
          vm: true,
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
      // Play the audio if audio data is present
      if (data.audio) {
        playAudio(data.audio);
      }
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
  const playAudio = (base64Audio: string) => {
    // Create a new Audio object with the data URL
    const audio = new Audio(base64Audio);

    // Add error handling
    audio.onerror = (error) => {
      console.error("Audio playback error:", error);
    };

    // Play the audio
    audio.play().catch((error) => {
      console.error("Audio playback failed:", error);
      // Handle autoplay restrictions
      if (error.name === "NotAllowedError") {
        console.log(
          "Please interact with the page first to enable audio playback",
        );
      }
    });
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
        {type === "video" ? <YouTubeEmbed videoId={videoId} /> : null}

        <Container
          maxWidth="lg"
          sx={{
            flexGrow: 1,
            pt: 4,
            transition: "transform 0.3s ease",
            transform: isSidebarOpen ? "translateX(-190px)" : "translateX(0)",
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
              ) : (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      gutterBottom
                      color="primary.main"
                    >
                      Article Summary
                    </Typography>
                    <TextToSpeech text={summary} />

                    <MarkdownRenderer content={summary} />
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      fontWeight="bold"
                    >
                      Source Article:
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary"
                      component="a"
                      href={url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ wordBreak: "break-word" }}
                    >
                      {url}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Perspective Section to render only the JSON snippet */}
              {isPerspectiveLoading ? (
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
                  <div className="p-4"></div>
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
              )}

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
                      variant="contained"
                      color="primary"
                      sx={{ borderRadius: "12px", px: 4 }}
                      disabled={isLoading || !isChatInitialized}
                    >
                      Send
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      sx={{ borderRadius: "12px", px: 4 }}
                      disabled={isLoading || !isChatInitialized}
                    >
                      VM
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
          )}{" "}
        </Container>
      </Box>
      {/* Related Topics Sidebar */}
      <RelatedTopicsSidebar
        currentArticleUrl={url || undefined}
        currentArticleSummary={summary || undefined}
        onSidebarToggle={handleSidebarToggle}
      />
    </>
  );
}

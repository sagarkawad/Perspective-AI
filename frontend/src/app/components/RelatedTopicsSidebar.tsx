"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  CircularProgress,
  Divider,
  ListItemButton,
  Tooltip,
  Link,
} from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  Public as PublicIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  ExpandMore as ExpandMoreIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { ChevronLeftIcon } from "lucide-react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { PORT } from "../port";
interface Source {
  url: string;
  domain: string;
  title: string;
  favicon?: string;
}

interface RelatedTopicsSidebarProps {
  currentArticleUrl?: string;
  currentArticleSummary?: string;
  width?: number;
  onSidebarToggle?: (isOpen: boolean) => void;
}

export default function RelatedTopicsSidebar({
  currentArticleUrl,
  currentArticleSummary,
  width = 380,
  onSidebarToggle,
}: RelatedTopicsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topics, setTopics] = useState(String);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    {},
  );

  // Toggle sidebar and notify parent component
  const toggleSidebar = (open: boolean) => {
    setIsOpen(open);
    if (onSidebarToggle) {
      onSidebarToggle(open);
    }
  };

  const generatelinks = () => {
    console.log("hello from useeffect");
    if (currentArticleUrl) {
      const fetchData = async () => {
        try {
          // Fetch article summary

          // Request for related topics using the summary text
          const resTopics = await fetch(`${PORT}related-topics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: currentArticleSummary }),
          });

          const dataTopics = await resTopics.json();
          console.log("Received related topics response:", dataTopics);
          console.log(topics);

          setTopics(dataTopics.topics || []);
        } catch (error) {
          console.error("Error fetching related topics:", error);
          setTopics("false");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  };

  return (
    <>
      <IconButton
        onClick={() => {
          toggleSidebar(!isOpen);
          generatelinks();
        }}
        sx={{
          position: "fixed",
          top: "50%",
          right: isOpen ? width : 0,
          transform: "translateY(-50%)",
          zIndex: 1200,
          bgcolor: "#5F27CD",
          color: "white",
          "&:hover": {
            bgcolor: "#4B1E8F",
          },
          boxShadow: 3,
          p: 2,
          mr: isOpen ? 1 : -1,
          transition: "right 0.3s ease",
        }}
      >
        <ChevronLeftIcon />
      </IconButton>

      <Drawer
        variant="temporary"
        anchor="right"
        open={isOpen}
        onClose={() => toggleSidebar(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width,
            boxSizing: "border-box",
            borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
            background: "#F3E5F5",
            top: 0,
            height: "100vh",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            bgcolor: "#5F27CD",
            color: "white",
          }}
        >
          {currentArticleUrl && (
            <IconButton
              component={Link}
              href={currentArticleUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "white", mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            Related Links
          </Typography>
          <IconButton
            onClick={() => toggleSidebar(false)}
            size="small"
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ overflow: "auto", flexGrow: 1, p: 2 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {topics
                .split("\n")
                .filter((line) => line.includes("]("))
                .map((line, index) => {
                  const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                  if (!match) return null;
                  const linkText = match[1];
                  const linkUrl = match[2];
                  return (
                    <ListItem key={index} disableGutters>
                      <Box
                        sx={{
                          border: "1px solid rgba(0, 0, 0, 0.12)",
                          borderRadius: 1,
                          p: 1.5,
                          width: "100%",
                          background: "white",
                        }}
                      >
                        <Link
                          href={linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{
                            fontSize: "1rem",
                            color: "#5F27CD",
                            fontWeight: 500,
                          }}
                        >
                          {linkText}
                        </Link>
                      </Box>
                    </ListItem>
                  );
                })}
            </List>
          )}
        </Box>
      </Drawer>
    </>
  );
}

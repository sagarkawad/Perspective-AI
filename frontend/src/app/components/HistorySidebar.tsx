"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  Link as MuiLink,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import { getOrCreateMachineId } from "../utils/machineId";
import { useUser } from "@clerk/nextjs";

interface HistorySidebarProps {
  open: boolean;
  onClose: () => void;
}

interface HistoryItem {
  type: "article" | "video" | "pdf";
  url?: string;
  name?: string;
  created_at?: string;
}

export default function HistorySidebar({
  open,
  onClose,
}: HistorySidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const { user } = useUser();
  useEffect(() => {
    if (!open) return;
    const loadHistory = async () => {
      try {
        const res = await fetch("http://localhost:8000/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            machine_id: getOrCreateMachineId(),
            user_id: user?.id,
          }),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data: HistoryItem[] = await res.json();
        setHistory(data);
      } catch (error) {
        console.error("Error loading history:", error);
        setHistory([]);
      }
    };
    loadHistory();
  }, [open, user]);

  const getHref = (item: HistoryItem) => {
    if (item.type === "video" && item.url) {
      return `/video?url=${encodeURIComponent(item.url)}`;
    }
    if (item.type === "pdf") {
      return undefined;
    }
    if (item.url) {
      return `/article?url=${encodeURIComponent(item.url)}&type=${item.type}`;
    }
    return undefined;
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 300, p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <HistoryIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Search History</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <List>
          {history.map((item, index) => {
            const href = getHref(item);
            return (
              <ListItem key={index} disablePadding>
                {href ? (
                  <MuiLink component={NextLink} href={href} underline="hover" sx={{ display: "flex", alignItems: "center", width: "100%", py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {item.type === "pdf" ? <PictureAsPdfIcon /> : <HistoryIcon />}
                    </ListItemIcon>
                    <Typography variant="body2" noWrap>
                      {item.url}
                    </Typography>
                  </MuiLink>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%", py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PictureAsPdfIcon />
                    </ListItemIcon>
                    <Typography variant="body2" noWrap>
                      {item.name}
                    </Typography>
                  </Box>
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}
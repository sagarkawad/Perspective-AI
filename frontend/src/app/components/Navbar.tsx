"use client";

import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from "@mui/material";
import { Brain, Menu, Home, Github } from "lucide-react";
import HistoryIcon from "@mui/icons-material/History";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";
import HistorySidebar from "./HistorySidebar";
import { creditsFromDB } from "../hooks/useCredits";

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { user } = useUser();
  const { credits, refreshCredits } = creditsFromDB();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { text: "Home", href: "/", icon: <Home size={20} /> },
    {
      text: "GitHub",
      href: "https://github.com/AOSSIE-Org/Perspective-AI",
      icon: <Github size={20} />,
    },
  ];
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.text}
            component={Link}
            href={item.href}
            sx={{
              color: "#4a5568",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#f7fafc",
                transform: "translateX(4px)",
              },
            }}
          >
            <ListItemIcon sx={{ color: "#4a5568" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <ListItem
          onClick={() => {
            handleDrawerToggle();
            setHistoryOpen(true);
          }}
          sx={{
            color: "#4a5568",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "#f7fafc",
              transform: "translateX(4px)",
            },
          }}
        >
          <ListItemIcon sx={{ color: "#4a5568" }}>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText primary="History" />
        </ListItem>
        <SignedOut>
          <ListItem>
            <SignInButton mode="modal" />
          </ListItem>
          <ListItem>
            <SignUpButton mode="modal" />
          </ListItem>
        </SignedOut>
        <SignedIn>
          <ListItem>
            <UserButton />
          </ListItem>
        </SignedIn>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            component={Link}
            href="/"
            sx={{
              textDecoration: "none",
              color: "#2d3748",
              transition: "all 0.3s ease",
              "&:hover": {
                opacity: 0.8,
                transform: "scale(1.02)",
              },
            }}
          >
            <IconButton
              edge="start"
              aria-label="logo"
              sx={{
                mr: 1,
                color: "#4a5568",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "#f7fafc",
                  transform: "rotate(15deg)",
                },
              }}
            >
              <Brain size={28} />
            </IconButton>
            <Typography
              variant="h6"
              fontWeight="500"
              sx={{
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
                background: "linear-gradient(45deg, #4a5568, #2d3748)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Perspective AI
            </Typography>
          </Box>

          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  color: "#4a5568",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "#f7fafc",
                    transform: "rotate(90deg)",
                  },
                }}
              >
                <Menu />
              </IconButton>
              <Drawer
                variant="temporary"
                anchor="right"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                  keepMounted: true,
                }}
                sx={{
                  "& .MuiDrawer-paper": {
                    boxSizing: "border-box",
                    width: 240,
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(8px)",
                  },
                }}
              >
                {drawer}
              </Drawer>
            </>
          ) : (
            <Box display="flex" gap={2} alignItems="center">
              {navItems.map((item) => (
                <Link
                  key={item.text}
                  href={item.href}
                  style={{
                    textDecoration: "none",
                    color: "#4a5568",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {item.icon}
                  <Typography variant="body2" fontWeight="500">
                    {item.text}
                  </Typography>
                </Link>
              ))}
              <IconButton
                color="inherit"
                onClick={() => setHistoryOpen(true)}
                sx={{
                  color: "#4a5568",
                  transition: "all 0.3s ease",
                  "&:hover": { color: "#2d3748" },
                }}
              >
                <HistoryIcon />
              </IconButton>
              <SignedOut>
                <SignInButton mode="modal" />
                <SignUpButton mode="modal" />
              </SignedOut>
              <SignedIn>
                {credits !== null && (
                  <Chip
                    label={`${credits} Credits`}
                    sx={{
                      bgcolor: "#3b82f6",
                      color: "white",
                      fontWeight: "500",
                      "&:hover": {
                        bgcolor: "#2563eb",
                      },
                    }}
                  />
                )}
                <UserButton />
              </SignedIn>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <HistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
};

export default Navbar;
